---
layout: post
title: "Using Generative AI to Detect Cat Breeds"
date: "2023-12-18T18:00:00"
categories: ["javascript"]
tags: ["generative ai","serverless","cloudflare"]
banner_image: /images/banners/cat_photographer.jpg
permalink: /2023/12/18/using-generative-ai-to-detect-cat-breeds
description: 
---

Let's be honest, what other use is there for generative AI than working with cats? If you read my [previous post](https://www.raymondcamden.com/2023/12/14/google-gemini-and-ai-studio-launch) on Google's Gemini AI launch, you may have seen my test prompts asking it to identify the kind of cat shown in a picture. I decided to turn this into a proper web application as a real example of the API in action. Here's what I came up with.

## The Front End

For the front end, I decided to make use of a native web platform feature to access the user's camera via a simple HTML form field. By using `capture="camera"` on an `input` tag, you directly get access to the device camera. There are more advanced ways of doing this, but for quick and simple, it works fine. Even better, on desktop it simply acts as a file selector. 

My thinking was - provide a way to get an image (either via camera or file selection), display the image, and send it off to the back end. While incredibly simple and vanilla JS would have been fine, I went ahead and used [Alpine.js](https://alpinejs.dev) for the interactivity. First, the HTML, which just needs to provide the UI for the image, a place to display the image, and another place to display the result.

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="app.css">
	<title></title>
</head>
<body>

<h2>🐈 Detector</h2>
<div x-data="catDetector">
	<input type="file" capture="camera" accept="image/*" @change="gotPic" :disabled="working">
	<template x-if="imageSrc">
		<p>
		<img :src="imageSrc">
		</p>
	</template>
	<div x-html="status"></div>
</div>


<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script src="app.js"></script>
</body>
</html>
```

Now let's turn to the JavaScript. I'm going to begin by sharing the initial version as it's simpler than explain how it failed. All I needed to do, initially, was notice when a file was selected, or a picture taken, and render it out to the DOM. (I used a bit of CSS not shared here to keep the visible size in check. More on that in a bit.) I also needed to send a base64 version of the file to the server side code. Here's the initial version:

```js
//const IMG_FUNC = 'http://localhost:8787/';
const IMG_FUNC = 'https://catdetector.raymondcamden.workers.dev';

document.addEventListener('alpine:init', () => {
  Alpine.data('catDetector', () => ({
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

			let resp = await fetch(IMG_FUNC, {
				method:'POST', 
				body: JSON.stringify(body)
			});

			let result = await resp.json();
			this.working = false;
			this.status = result.text;

		}

	}
  }))
});
```

The `gotPic` method is fired whenever the `input` field fires an `onchange` event. I take the file/image used, read it as a data URL (base64), and then assign it to the image in the DOM and send it to the server. Nice and simple, right?

Well, everything worked fine on the desktop, but when I switched to my camera, the Samsung S22 Ultra Magnus Extreme 200 Camera Lens Edition (not the real name), I ran into issues where Google's API complained that I was sending too much data. I then remembered, my camera takes *really* detailed pictures, and I needed to resize the image before sending it on. 

I was already resizing in CSS, but obviously, that's not the same as *really* resizing. I found this excellent article on ImageKit's site: [How to resize images in Javascript?](https://imagekit.io/blog/how-to-resize-image-in-javascript/) In this article, they describe using an HTML `canvas` element to do the resizing. I had not used Canvas in probably close to a decade, but I was able to repurpose their code into my front end well enough:

```js
//const IMG_FUNC = 'http://localhost:8787/';
const IMG_FUNC = 'https://catdetector.raymondcamden.workers.dev';

// Resize logic: https://imagekit.io/blog/how-to-resize-image-in-javascript/
const MAX_WIDTH = 400;
const MAX_HEIGHT = 400;

document.addEventListener('alpine:init', () => {
  Alpine.data('catDetector', () => ({
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
			let img = document.createElement('img');
			img.onload = async e => {
				let width = img.width;
				let height = img.height;

				if(width > height) {
					if(width > MAX_WIDTH) {
						height = height * (MAX_WIDTH / width);
						width = MAX_WIDTH;
					}
				} else {
					if (height > MAX_HEIGHT) {
						width = width * (MAX_HEIGHT / height);
						height = MAX_HEIGHT;
					}
				}

				let canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				let ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, width, height);

				this.imageSrc = canvas.toDataURL(file.type);

				this.working = true;
				this.status = '<i>Sending image data to Google Gemini...</i>';

				let body = {
					imgdata:this.imageSrc
				}

				let resp = await fetch(IMG_FUNC, {
					method:'POST', 
					body: JSON.stringify(body)
				});

				let result = await resp.json();
				this.working = false;
				this.status = result.text;

			};
			img.src = e.target.result;

		}

	}
  }))
});
```

You'll notice the code uses a max dimension for both width and height, and correctly handles resizing while keeping the same aspect ratio. Again, I can't take credit for any of that, thanks to [Manu Chaudhary](https://imagekit.io/blog/author/manu/) for his blog post. 

The net result of this change is that now I'm sending a much smaller image to the back end service, and it's finally time to take a look at that.

## The Back End

For my back end, I decided to use [Cloudflare Workers](https://developers.cloudflare.com/workers/) again. I was a bit hesitant as it's had some issues with NPM packages and my demos before, but it didn't have any issues this time. If you remember from my [last post](https://www.raymondcamden.com/2023/12/14/google-gemini-and-ai-studio-launch), Google's AI Studio lets you easily output sample code from your prompts, so all I had to do was incorporate that into the Cloudflare Worker. 

Here's the entirety of the code:

```js
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const MODEL_NAME = "gemini-pro-vision";


export default {
	async fetch(request, env, ctx) {

		const API_KEY = env.GEMINI_KEY;

		console.log('begin serverless logic');

		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
			"Access-Control-Max-Age": "86400",
	    };

		let { imgdata } = await request.json();
		imgdata = imgdata.replace(/data:.*?;base64,/, '');

		const genAI = new GoogleGenerativeAI(API_KEY);
		const model = genAI.getGenerativeModel({ model: MODEL_NAME });

		const generationConfig = {
			temperature: 0.4,
			topK: 32,
			topP: 1,
			maxOutputTokens: 4096,
		};

		const safetySettings = [
			{
			category: HarmCategory.HARM_CATEGORY_HARASSMENT,
			threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
			},
			{
			category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
			threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
			},
			{
			category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
			threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
			},
			{
			category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
			threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
			},
		];

		const parts = [
			{text: "Look at this picture and if you see a cat, return the breed of the cat."},
			{
			inlineData: {
				mimeType: "image/jpeg",
				data: imgdata
			}
			}			
		];

		console.log('calling google');
		const result = await model.generateContent({
			contents: [{ role: "user", parts }],
			generationConfig,
			safetySettings,
		});

		const response = result.response;
		let finalResult = { text: response.text() };

		return new Response(JSON.stringify(finalResult), { headers: {...corsHeaders}});

	},
};
```

The majority of the code is boilerplate from the AI Studio export, except now I get my image data from the information POSTed to the worker. I want to especially call out the prompt:

```
Look at this picture and if you see a cat, return the breed of the cat.
```

Initially, I tried hard to get a result in JSON and have it return a blank string if the picture wasn't a cat. But then I noticed something cool - Gemini did a *really* good job of handling pictures that weren't of cats. Like... shockingly good. I actually really appreciated that the app wouldn't just say "Not a Cat", but explain what it was instead. Obviously, there's room for both styles for an application like this, but I went and kept Google's verbose and helpful responses. 

Now for the fun part... the results.

## The Results

Let's start with a few pictures of cats. 

First up is Pig, my favorite cat who is not fat and doesn't look like Jabba the Hut at all:

<p>
<img src="https://static.raymondcamden.com/images/2023/12/cat1.jpg" alt="A picture of a calico cat, correctly recognized" class="imgborder imgcenter" loading="lazy">
</p>

Next, a picture of Luna. In this case, the breed is incorrect - but at least close.

<p>
<img src="https://static.raymondcamden.com/images/2023/12/cat2.jpg" alt="A picture of a considered a Maine Coon" class="imgborder imgcenter" loading="lazy">
</p>

Now let's throw Google a curveball:

<p>
<img src="https://static.raymondcamden.com/images/2023/12/cat3.jpg" alt="A picture of a watering can correctly identified." class="imgborder imgcenter" loading="lazy">
</p>

This *really* surprised me. The description is 100% accurate, and honestly, if I had seen this picture and didn't know, I would have recognized it as a sculpture of a cat, not as a watering can. I mean, I guess it's *kind* of obvious, but I honestly don't think I would have noticed that myself. 

Now let's go totally crazy:

<p>
<img src="https://static.raymondcamden.com/images/2023/12/cat4.jpg" alt="A picture of an XMas tree correctly identified." class="imgborder imgcenter" loading="lazy">
</p>

Yep, that's right Google. How about AI generated cat images?

<p>
<img src="https://static.raymondcamden.com/images/2023/12/cat5.jpg" alt="A picture of a cat as a DJ." class="imgborder imgcenter" loading="lazy">
</p>

I think it handled that pretty well. 

Next...

<p>
<img src="https://static.raymondcamden.com/images/2023/12/cat6.jpg" alt="A picture of a Bigfoot action figure" class="imgborder imgcenter" loading="lazy">
</p>

Yep, that's Bigfoot alright. Just think, all those Bigfoot "researchers" could retire and simply connect their trail cams to AI!

<p>
<img src="https://static.raymondcamden.com/images/2023/12/cat7.jpg" alt="A picture of a Skeletor action figure" class="imgborder imgcenter" loading="lazy">
</p>

I've got to say - I'm impressed Google not only recognized the franchise but the actual character as well, but to be fair, Skeletor has a pretty distinct look to him. 

And finally, since I (unfairly of course) compared my cat to Jabba, let's see how it's handled:

<p>
<img src="https://static.raymondcamden.com/images/2023/12/cat8.jpg" alt="Jabba the Hutt" class="imgborder imgcenter" loading="lazy">
</p>

Oh, I know I said I was done, but of course, I had to test a dog:

<p>
<img src="https://static.raymondcamden.com/images/2023/12/cat9.jpg" alt="Dog on a couch" class="imgborder imgcenter" loading="lazy">
</p>

Dang good job, Gemini. Unfortunately I won't be hosting this demo live (the Cloudflare 'live' URL earlier in the code won't work), but I can share the code.

Front End: <https://github.com/cfjedimaster/webdemos/tree/master/catdetector><br/>
Back End: <https://github.com/cfjedimaster/cloudflareworkers-demos/tree/main/catdetector>

