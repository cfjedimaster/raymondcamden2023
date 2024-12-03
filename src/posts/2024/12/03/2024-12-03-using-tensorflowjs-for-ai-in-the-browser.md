---
layout: post
title: "Using Transformers.js for AI in the Browser"
date: "2024-12-03T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_robot.jpg
permalink: /2024/12/03/using-transformersjs-for-ai-in-the-browser
description: A look at Transformers.js and doing GenAI work in the browser.
---

Two weeks ago I had the pleasure of attending, and speaking at, [connect.tech](https://2024.connect.tech/). One of the cooler presentations I saw was from [Danielle Maxwell](https://daniellemaxwell.info/) where she discussed using 
AI in the browser and introduced me to [Transformers.js](https://huggingface.co/docs/transformers.js/en/index). I'd heard of this before, but wasn't quite aware of how easy it was to use. While this isn't necessarily going to replace a "real" GenAI server, it does feel compelling enough to something to consider. As my readers know, I've been playing with Chrome's attempt to bake this in as well, and while that's not quite ready for real use yet, Transformers.js feels like something you could play with right now. 

## How to get started?

Using Transformers.js makes use of what they call a 'pipeline' API. You will import the general API into your code and then select a pipeline based on your use case. The docs list a set of [tasks](https://huggingface.co/docs/transformers.js/en/pipelines#available-tasks) that covers things like:

* General question answering on text
* Summarizing
* Translation
* Image classification and detection
* Audio classification

And more. Again, check their [docs](https://huggingface.co/docs/transformers.js/en/pipelines#available-tasks) for a full list. Let's look at an example of how easy it is to get started.

## Detecting Sentiment

To get sentiment on text, you can get the `sentiment-analysis` pipeline like so:

```js
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';

const classifier = await pipeline('sentiment-analysis');
```

Then you can pass a string to the `classifier` object:

```js
let result = await classifier('input');
```

This returns an array of results (for me, an array with one result always) where each result is an object with a label and scope:

```js
{
    "label": "POSITIVE",
    "score": 0.9984346628189087
}
```

In a real application, you could use this to provide realtime feedback on user input. I could imagine this being useful for customer service reps and such to help ensure they're being positive in their responses. I built a simple Alpine.js demo you can see below. To test, just start writing and go for something mean, or happy, you decide.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="rNXXByq" data-pen-title="Transformers.js Test" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/rNXXByq">
  Transformers.js Test</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

You probably don't need to show the score as I do, but could instead try using it as a filter, i.e. if the score is too low, don't bother reporting what it found. 

How much does this impact the browser in terms of downloading the bits required for analysis? I put up a copy of the code from CodePen here, <https://cfjedimaster.github.io/ai-testingzone/transformersjs/test1.html>, and looking in devtools, I see 111 MB used in storage. That's not inconsequential, but also not terribly bad on a decent connection. I'd absolutely ensure that this was used in a progressive enhancement manner, ie, don't require a result to let the user submit text, but if it *can* be loaded and used, it would be a helpful addition. 

This is a useful reminder that the "Application" tab of your dev tools (in Chrome/Edge at least, but other browsers report this as well), you can dig into these details:

<p>
<img src="https://static.raymondcamden.com/images/2024/12/trans1.jpg" alt="Devtools report on the assets downloaded by the pipeline" class="imgborder imgcenter" loading="lazy">
</p>

## Object Detection in Images (for Cats, of course)

For the next demo, I built a demo that modified the example from the ["Building a Vanilla JS Application"](https://huggingface.co/docs/transformers.js/en/tutorials/vanilla-js) guide. This is a great tutorial (you can test out the [demo](https://huggingface.co/spaces/Scrimba/vanilla-js-object-detector) as well) and a good example of another powerful feature, finding objects in images. 

In their guide, they explain how this pipeline can find objects and optionally be customized for how confident it is before adding a result and whether or not the bounding boxes are pixels or percentages of the source. 

Now, their demo goes on to actually add visible bounding boxes and labels to the source, but let's try something simpler - using the device camera to determine if we've taken a picture of a cat. 

For my demo, I made use of Alpine.js. My front-end code is just a button to activate the camera (or file picker on desktop) and a place for results:

```html
<h2>Is Cat?</h2>
<div x-data="cameraApp">
	<input type="file" capture="camera" accept="image/*" @change="gotPic" :disabled="working">
	<template x-if="imageSrc">
		<p>
		<img :src="imageSrc">
		</p>
	</template>
	<div x-html="status"></div>
</div>
```

The JavaScript is a bit more complex. I'll skip over some of the Alpine.js stuff and focus mostly on the Transformers.js stuff. In the Alpine.js `init` method, I wait for the pipeline to load the code I need:

```js
this.detector = await pipeline("object-detection", "Xenova/detr-resnet-50");
```

Once this is done, the user can actually click the button. What happens when you take a picture (or select an image)? First, I get the selected image from the event:

```js
let file = e.target.files[0];
if(!file) return;
```

I then set up a file reader to get the bits:

```js
let reader = new FileReader();
reader.readAsDataURL(file);
reader.onload = async e => {
```

Inside the `onload` method is where the real work happens. First, get the actual "data" url value and assign it to the DOM for a thumbnail:

```js
this.imageSrc = e.target.result;
```

I can then ask the detector to... well, detect:

```js
let output = await this.detector(e.target.result, {
	threshold: 0.5,
	percentage: true,
});	
```

This returns an array of objects consisting of a label (what it thinks it is), a bounding box and a confidence score. Here's a source image:

<p>
<img src="https://static.raymondcamden.com/images/2024/12/trans2.jpg" alt="White kitten on a desk" class="imgborder imgcenter" loading="lazy">
</p>

And here's the result:

```js
[
    {
        "score": 0.9479293823242188,
        "label": "book",
        "box": {
            "xmin": -0.02235063910484314,
            "ymin": 0.6216115802526474,
            "xmax": 0.3279511630535126,
            "ymax": 0.7934765964746475
        }
    },
    {
        "score": 0.9981929063796997,
        "label": "cat",
        "box": {
            "xmin": 0.23074954748153687,
            "ymin": 0.047968536615371704,
            "xmax": 0.7742043137550354,
            "ymax": 0.8249835669994354
        }
    },
    {
        "score": 0.7411214113235474,
        "label": "book",
        "box": {
            "xmin": 0.44809791445732117,
            "ymin": 0.6813655197620392,
            "xmax": 1.0155799686908722,
            "ymax": 0.985151618719101
        }
    },
    {
        "score": 0.5772241353988647,
        "label": "book",
        "box": {
            "xmin": 0.17918723821640015,
            "ymin": 0.6792456209659576,
            "xmax": 1.0064586997032166,
            "ymax": 0.9803193509578705
        }
    }
]
```

I'd argue that the book results are invalid, but perhaps sensible? The cat is perfect of course. 

Ok, so given that result, I used the following code to look for `cat` or `cats`:

```js
let labels = output.map(i => i.label);
let isCat = labels.includes('cat') || labels.includes('cats');
```

I probably could have done that in one line, not two, but this is why I can't pass the Google tech screen. 

Ok, so given that, you can point your phone (or pick a file) at a cat and it will see if a cat was found. Shockingly, no cats were in my office, so I had to get off my butt. First, a negative test:

<p>
<img src="https://static.raymondcamden.com/images/2024/12/trans3.jpg" alt="Photo of desk clutter, not a cat" class="imgborder imgcenter" loading="lazy">
</p>

And then a dog:

<p>
<img src="https://static.raymondcamden.com/images/2024/12/trans4.jpg" alt="Photo of a dog, not a cat" class="imgborder imgcenter" loading="lazy">
</p>

And here's two positive results (pardon the audio UI on the first shot):

<p>
<img src="https://static.raymondcamden.com/images/2024/12/trans5.jpg" alt="Photo of a black cat" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2024/12/trans5.jpg" alt="Photo of a white cat" class="imgborder imgcenter" loading="lazy">
</p>

For folks curious, the first cat is Wednesday, the second Zelda. The complete source code may be found here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/transformersjs/camera_test>. You can test it online here, but remember that if you are on a desktop machine, it will want a local file instead: <https://cfjedimaster.github.io/ai-testingzone/transformersjs/camera_test/index.html>

You'll notice it takes up to ten seconds or so to work, which isn't super fast, but it's all done on the device itself, so a fair trade off I think. I'm absolutely going to dig into this more, and be sure to check the [docs](https://huggingface.co/docs/transformers.js/en/index) for more examples. 