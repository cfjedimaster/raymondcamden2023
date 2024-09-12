---
layout: post
title: "Using AI to Roast Your Photos"
date: "2024-09-12T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_camera_photography.jpg
permalink: /2024/09/12/using-ai-to-roast-your-photos
description: Using GenAI as a virtual 'roast' service.
---

Chalk this up as another of my "this is probably not a good idea, but it's fun" blog posts. A few weeks back my buddy and ColdFusion Evangelist [Mark Takata](https://www.thefatpanther.com/) shared a fun little thing he did with GenAI - using it to roast himself. That *immediately* set me off on a quest to see just how much fun I could have with the idea. Now, to be clear, I do not like mean people. But having a disembodied set of code routines roast me? Sounds perfect. 

Back in December last year, I built an experiment where I used the device camera on a mobile web app and asked [Google Gemini](https://ai.google.dev/) what kind of cat breed was in the picture: [Using Generative AI to Detect Cat Breeds](https://www.raymondcamden.com/2023/12/18/using-generative-ai-to-detect-cat-breeds)

That experiment worked *really* well actually. The only real issue I ran into involved the size of the image I was sending to the API. When the Gemini API first came out, you could only do multimodal prompts by converting your image to base64 and including it in the prompt. That had a max file size limit that was easy to reach with images taken on a good mobile camera. I ended up doing client-side resizing in JavaScript to get around it.

Now, however, Gemini has a proper "Files" API. I first wrote about this back in May: ["Using the Gemini File API for Prompts with Media"](https://www.raymondcamden.com/2024/05/21/using-the-gemini-file-api-for-prompts-with-media)

I decided to take that existing front end app, remove the resize portion, and hook it up to a new back end. How did it work?

Omg really, really, well:

<p>
<img src="https://static.raymondcamden.com/images/2024/09/roast1.jpg" alt="An example from the app showing the roast." class="imgborder imgcenter" loading="lazy">
</p>

Brutal. And I love it. Alright, so how about the code...

## The Front End

I'm not going to share *all* of the code on the front end as it's pretty much the same as before. I will remind folks that you can easily add camera support via the web on mobile like so:

```html
<input type="file" capture="camera" accept="image/*" @change="gotPic" :disabled="working">
```

What's nice is that on desktop, that just reverts to a file picker. (And to be clear, you *can* ask for a web cam on desktop too, but this was all I needed for the moment.) 

On the JavaScript side, I'm using Alpine, and basically I just read in the data to base64 and pass it to the server:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('cameraRoast', () => ({
	imageSrc:null,
	working:false,
	status:'',
    async init() {
		console.log('init');
    },
	async gotPic(e) {
		let file = e.target.files[0];
		if(!file) return;
		
		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = async e => {
			this.imageSrc = e.target.result;
			this.working = true;
			this.status = '<i>Sending image data to Google Gemini...</i>';

			let body = {
				imgdata:this.imageSrc
			}

			let resp = await fetch('/roast', {
				method:'POST', 
				body: JSON.stringify(body)
			});

			let result = await resp.json();
			console.log(result);
			this.working = false;
			this.status = result.text;

		}

	}
  }))
});
```

I don't have any error checking here because I like to live dangerously. 

## The Back End

In the [previous post](https://www.raymondcamden.com/2023/12/18/using-generative-ai-to-detect-cat-breeds) I made use of Cloudflare Workers, but I'm a little ticked at them currently so I avoided that and just wrote some Node.js code. I'll share a link to the entire codebase at the end, but here is, roughly, what it does:

```js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GoogleAIFileManager } from "@google/generative-ai/server";

import mime from 'mime';

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_API_KEY;

const si = `
You are professional photographer and you review photos. You are incredibly mean spirited and will rarely say anything good about a photo.
`;

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: MODEL_NAME, 
	systemInstruction: {
		parts: [{ text:si }],
		role:"model"
	} 
});

const fileManager = new GoogleAIFileManager(API_KEY);
```

This first block has my imports and sets up the objects I'll use later. Of special note is the `si` variable which is my system instruction. 

The Node.js code listens for the call to `/roast` and then runs this function with the data:

```js
async function callGemini(photo) {

	/*
	I'm sent b64 data, lets to binary that thing and store it temporarily. Note
	I've hard coded a name here, it should be a UUID instead.
	*/

	photo = photo.replace(/data:.*?;base64,/, '');
	let buf = Buffer.from(photo, 'base64');
	fs.writeFileSync('./test_temp.jpg', buf);

	const uploadResult = await fileManager.uploadFile('./test_temp.jpg', {
		mimeType:'image/jpeg',
		displayName: "temp cemera content",
	});
	const file = uploadResult.file;

	const generationConfig = {
		temperature: 0.9,
		topK: 1,
		topP: 1,
		maxOutputTokens: 2048,
	};

	const safetySettings = [
		{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,	threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
	];
	
	let text = 'Roast the attached picture.';

	const parts = [
    	{text},
		{
			fileData: {
				fileUri:file.uri, 
				mimeType:'image/jpeg'
			}
		}
  	];

	const result = await model.generateContent({
		contents: [{ role: "user", parts }],
		generationConfig,
		safetySettings
	});

	console.log(JSON.stringify(result,null,'\t'));

	try {

		if(result.response.promptFeedback && result.response.promptFeedback.blockReason) {

			return { error: `Blocked for ${result.response.promptFeedback.blockReason}` };
		}
		const response = result.response.candidates[0].content.parts[0].text;
		return { response };
	} catch(e) {
		// better handling
		return {
			error:e.message
		}
	}
	
}
```

I convert the base64 back to binary and save it. That file is then uploaded to Gemini and then I run my prompt, which is fairly simple since most of the 'definition' for how the results should work is done in the system instruction. 

You can find the full code here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/camera_roast>

## More Examples

So I played around with this a bit, of course. I shared it with my brother, Alex, who took this great pic:

<p>
<img src="https://static.raymondcamden.com/images/2024/09/roast2.jpg" alt="A guy frowning" class="imgborder imgcenter" loading="lazy">
</p>

The result was:

"Oh honey, put the camera down. The only thing appealing in this photo is that crisp blue siding in the background. Did you roll out of bed, sweat for a few hours and think "Time for my close-up"? The forced sadness expression? Get outta here. This belongs in a 'how-not-to-selfie' textbook."

And here's another result, this from a random picture I had saved already:

<p>
<img src="https://static.raymondcamden.com/images/2024/09/roast3.jpg" alt="A cat and a tribble" class="imgborder imgcenter" loading="lazy">
</p>

Gemini loses a point though for identifying the tribble as a cat. 

Anyway, it *would* be interesting to see what the service says if it wasn't set to "roast" mode. I don't know enough about photography to judge how well the responses would be, but if folks want to fork my code and give it a shot, let me know what you find in a comment below.