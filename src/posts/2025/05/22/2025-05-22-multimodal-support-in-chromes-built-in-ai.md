---
layout: post
title: "Multimodal Support in Chrome's Built-in AI"
date: "2025-05-22T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/bubbles.jpg
permalink: /2025/05/22/multimodal-support-in-chromes-built-in-ai
description: 
---

It's been a few weeks since I blogged about Chrome's [built-in AI efforts](https://developer.chrome.com/docs/ai/built-in), but with Google IO going this week there's been a lot of announcements and updates. You can find a great writeup of recent changes on the Chrome blog: ["AI APIs are in stable and origin trials, with new Early Preview Program APIs"](https://developer.chrome.com/blog/ai-api-updates-io25?hl=en).

 One feature that I've been excited the most about has finally been made available, [multimodal prompting](https://developer.chrome.com/docs/ai/prompt-api#multimodal_capabilities). This lets you use both image *and* audio data for prompts. Now, remember, this is all still early preview and will likely change before release, but it's pretty promising. 

 As I've mentioned before, the Chrome team is asking folks to [join the EPP (early preview program)](https://developer.chrome.com/docs/ai/join-epp?hl=en) for access to the docs and such, but it's fine to publicly share demos. You'll want to join the EPP for details on how to enable these APIs and use the latest Chrome Canary, but let me give you some examples of what you can do.

 ## Basic Image Identification

 At the simplest level, to enable multimodal inputs you simply tell the model you wish to deal with them:

 ```js
session = await LanguageModel.create({
	expectedInputs:[{type: 'image'}]
});
```

You can also use `audio` as an expected input but I'm only concerned with images for now. To test, I built a demo that simply let me select a picture (or use my camera on mobile), render a priview of the image, and then let you analyze it. 

HTML wise it is just a few DOM elements:

```html
<h2>Image Analyze</h2>

<div class="twocol">
	<div>
		<p>
		<input type="file" capture="camera" accept="image/*" id="imgFile">
		<button id="analyze">Analyze</button>
		</p>
		<img id="imgPreview">
	</div>
	<div>
		<p id="result"></p>
	</div>
</div>
```

The JavaScript is the important bit. So first off, when the file input changes, I kick off a preview process:

```js
$imgFile = document.querySelector('#imgFile');
$imgPreview = document.querySelector('#imgPreview');
$imgFile.addEventListener('change', doPreview, false);

// later...
async function doPreview() {
	$imgPreview.src = null;
	if(!$imgFile.files[0]) return;
	let file = $imgFile.files[0];
	
	$imgPreview.src = null;
	let reader = new FileReader();
	reader.onload = e => $imgPreview.src = e.target.result;
	reader.readAsDataURL(file);

}
```

This is fairly standard, but let me know if it doesn't make sense. In theory I could have done the AI analysis immediately, but instead I tied it to the analyze button I showed up on top. Here's that process:

```js
async function analyze() {
	$result.innerHTML = '';
	if(!$imgFile.value) return;
	console.log(`Going to analyze ${$imgFile.value}`);
	let file = $imgFile.files[0];
	
	let imageBitmap = await createImageBitmap(file);
	let result = await session.prompt([
  		'Create a summary description of the image.',
  		{ type: "image", content: imageBitmap}
	]);
	console.log(result);
	$result.innerHTML = result;
}
```

So, remember that `$imgFile` is a pointer to the input field which is using the file type. I've got read access to the selected file, which is turned into an image bitmap (using [`window.createImageBitmap`](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap)), and then passed to the AI model. My prompt is incredibly simple - just write a summary. 

As I assume most of yall can't actually *run* this demo, let me share with you a few screenshots showing some selected pictures and their summaries.

<p>
<img src="https://static.raymondcamden.com/images/2025/05/mm1.jpg" alt="Sample run" class="imgborder imgcenter" loading="lazy">
</p>

Yes, I agree, she is adorable. 

<p>
<img src="https://static.raymondcamden.com/images/2025/05/mm2.jpg" alt="Sample run" class="imgborder imgcenter" loading="lazy">
</p>


This one was pretty shocking in terms of the level of detail. I'm not sure if that is LAX, and not sure if those are exact matches on the airplane types, but *damn* is that impressive. 

<p>
<img src="https://static.raymondcamden.com/images/2025/05/mm3.jpg" alt="Sample run" class="imgborder imgcenter" loading="lazy">
</p>

This is pretty good as well, although I'm surprised it didn't recognize that it was a particular Mandalorian, Boba Fett. 

Here's the complete CodePen if you want to try it out, again, given that you've gone through the prerequisites.

<p class="codepen" data-height="500" data-default-tab="js,result" data-slug-hash="OPPKxgm" data-pen-title="MM + AI" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/OPPKxgm">
  MM + AI</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## More Guided Indentification

Of course, you can do more than just summarize an image, you can also guide the summarization, for example:

```js
let result = await session.prompt([
  'You report if an image is a cat or not. If it is a cat, you should return a wonderfully pleasant and positive summary of the picture. If it is not a cat, your response should be very negative and critical.',
  { type: "image", content: imageBitmap}
]);
```

While a bit silly, there's some practical uses for this. You could imagine a content site dedicated to cats (that's all I dream of) where you want to do a bit of sanity checking for content editors to ensure pictures are focused on cats, not other subjects. 

Here's two examples, first a cat:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/mm4.jpg" alt="Cat or not?" class="imgborder imgcenter" loading="lazy">
</p>

And then, obviously, not a cat:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/mm5.jpg" alt="Not a cat" class="imgborder imgcenter" loading="lazy">
</p>

For completeness sake, here's this demo:

<p class="codepen" data-height="500" data-default-tab="js,result" data-slug-hash="jEEjxam" data-pen-title="MM + AI (Cat or Not)" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/jEEjxam">
  MM + AI (Cat or Not)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## Image Tagging

Ok, this next demo I'm really excited about. A few weeks ago, the Chrome team added [structured output](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api) to the API. This allows you to guide the AI in regards to how responses should be returned. Imagine if in our previous demo we simply wanted the AI to return true or false if the image was of a cat. While we could use our prompt for that, and be *really* clear, there's still a chance the AI may feel creative and go a bit beyong the guardrails of your prompt. Structured output helps correct that.

So with that in mind, imagine if we asked the AI to not describe the image, but rather provide a list of tags that represent what's in the image. 

First, I'll define a basic schema:

```js
const schema = {
	type:"object", 	
	required: ["tags"],
	additionalProperties: false, 
	properties: {
		tags: {
			description:"Items found in the image",
			type:"array",
			items: {
				type:"string"
			}
		}
	}
};
```

And then I'll pass this schema to the prompt:

```js
let result = await session.prompt([
	"Identify objects found in the image and return an array of tags.",
	{ type:"image", content: imageBitmap }
	],{	responseConstraint: schema });
```

Note that the `prompt` API is somewhat complex in how you can pass arguments to it, and figuring out the right way to pass the image *and* the schema took me a few tries. The documentation around this is going to update soon.

The net result from this is a JSON string, so to turn it into an array, I can do:

```js
result = JSON.parse(result);
```

In my demo, I just print it out, but you can easily doing things like:

* For my cat site, if I don't see "cat", "cats", or "kitten", "kittens", raise a warning to the user.
* For my cat site, if I see "dog" or "dogs", raise a warning.

To be clear, this, and all of the Chrome AI features, should focus on *helping* the user, and shouldn't be used to prevent any action or as a security method of some sort, but having this here and available can help the process in general, and that's a good thing.

Here's two examples with the output:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/mm5.jpg" alt="Sample tag output" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/05/mm6.jpg" alt="Sample tag output" class="imgborder imgcenter" loading="lazy">
</p>

And here's the complete demo:

<p class="codepen" data-height="600" data-default-tab="js,result" data-slug-hash="EaaqBEg" data-pen-title="MM + AI (Tags)" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/EaaqBEg">
  MM + AI (Tags)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## More Resources

Before I wrap up, a few resources to share, thanks to [Thomas Steiner](https://blog.tomayac.com/) (who also helped me a bit with my code, thanks Thomas!), from Google IO:

* [Practical built-in AI with Gemini Nano in Chrome](https://www.youtube.com/watch?v=CjpZCWYrSxM)
* [The future of Chrome Extensions with Gemini in your browser](https://www.youtube.com/watch?v=8iIvAMZ-XYU&list=PLNYkxOF6rcIDf2yTHfwShSCwVxaUuGk-v&index=2)

Photo by <a href="https://unsplash.com/@andriyko?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Andriyko Podilnyk</a> on <a href="https://unsplash.com/photos/water-droplets-on-body-of-water-during-daytime-tmOpbECoARc?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      