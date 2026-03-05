---
layout: post
title: "Dynamically Adjusting Image Text for Contrast"
date: "2026-03-04T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/paintings.jpg
permalink: /2026/03/04/dyanimically-adjusting-image-text-for-contrast
description: 
---

Yesterday I was pleasantly surprised to discover that one of my favorite JavaScript libraries, [Color Thief](https://lokeshdhakar.com/projects/color-thief/), had gotten a major update. Color Thief examines an image and can tell you the dominant color as well as the five most used colors. I thought this was pretty cool, and over the past, I kid you not, 14 years, I've blogged about it a few times:

* [Demo of Color Palettes and PhoneGap](https://www.raymondcamden.com/2012/01/13/Demo-of-Color-Palettes-and-PhoneGap) - from way back in 2012
* [Capturing camera/picture data without PhoneGap](https://www.raymondcamden.com/2013/05/20/capturing-camerapicture-data-without-phonegap) - in 2013
* [Drag and drop image matching search at Behance](https://www.raymondcamden.com/2013/10/18/Drag-and-drop-image-matching-search-at-Behance) - do people still use Behance?
* [New Camera Hotness from Chrome](https://www.raymondcamden.com/2017/01/24/new-camera-hotness-from-chrome) - "new" as of 2017
* [Building a Progressive Color Thief](https://www.raymondcamden.com/2018/01/25/building-a-progressive-color-thief) - this was me exploring PWAs
* [Web Component to Generate Image Color Palettes](https://www.raymondcamden.com/2024/07/16/web-component-to-generate-image-color-palettes) - the most recent post (2024) where I use it in a web component

So yeah, it's a cool library, and as I said, I was stoked to see it get a major upgrade. The last version improves the library quite a bit, adding n TypeScript definitions but also a set of features that can directly help with creating text that contrasts well with the image. After examining an image, it has a basic `isDark` variable that can be checked, two `contrast` variables for white and black, and best of all, a simple `textColor` value that provides the best **suggestion** (and yes, this won't be perfect, I'll touch on why at the end) for what text color should be used to provide contrast. 

As an example, consider this simple demo. First, I've got some HTML and CSS to render text over an image. Here's the HTML:

```html
<div class="image-container">
	<img src="https://unsplash.it/640/425?image=40">
	<div class="overlay-text">Your Text Here</div>
</div>
```

And here's the CSS (I used Gemini to help write this):

```css
.image-container {
  position: relative;
  display: inline-block; /* Keeps the container the same size as the image */
}

.image-container img {
  display: block; /* Removes unwanted whitespace at the bottom of the image */
  max-width: 100%;
  height: auto;
}

.overlay-text {
  position: absolute;
  bottom: 15px; /* Padding from the bottom */
  right: 15px;  /* Padding from the right */
  
  /* Styling */
  color: white; 
  font-family: sans-serif;
  font-weight: bold;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.7); /* Helps readability on busy images */
}
```

You can see how it looks below. The text-shadow absolutely helps (and I wish I had known about this before), but it's still a bit washed out:

<p class="codepen" data-theme-id="dark" data-height="600" data-pen-title="Text on image test" data-default-tab="result" data-slug-hash="vEXLxmE" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/vEXLxmE">
  Text on image test</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

To correct this, I added Color Thief. Given a pointer to an image object, all you need to do is run `geColorSync`. One of the values returned will be `textColor` and I can then update the CSS on the fly. 

So, first I modified my HTML to have two images, nicely showing different levels of darkness ("Levels of Darkness" is the name of my new darkwave band - coming soon):

```html
<div class="image-container">
	<img src="https://unsplash.it/640/425?image=80" crossorigin>
	<div class="overlay-text">Your Text Here</div>
</div>

<div class="image-container">
	<img src="https://unsplash.it/640/425?image=40" crossorigin>
	<div class="overlay-text">Your Text Here</div>
</div>
```

My CSS stayed the same, and as you remember, defaults to white text. Now here's the JavaScript I use to examine and update that color:

```js
import { getColorSync } from 'https://unpkg.com/colorthief@3/dist/index.js';

/*
const img = document.querySelector('img');
const caption = document.querySelector('#caption-text');

const color = getColorSync(img);
console.log(color.hex());
console.log(color.isDark, color.textColor);
caption.style.color = color.textColor;
*/

// get the containers
let containers = document.querySelectorAll('.image-container');
containers.forEach(c => {
	let myImage = c.querySelector('img');
	let myText = c.querySelector('div.overlay-text');
	// assume loaded - may be bad
	const color = getColorSync(myImage);
	myText.style.color = color.textColor;

});
```

You'll note the comment where I mention I should check and see if the image is loaded, but I was feeling pretty lazy. Anyway, the result is perfect!

<p class="codepen" data-theme-id="dark" data-height="600" data-pen-title="Text on image test (with CT)" data-default-tab="result" data-slug-hash="NPRxpag" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/NPRxpag">
  Text on image test (with CT)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Neat! So - a few caveats, things to think about, etc. I could probably also have used a simple black background on the div element wrapping my text. What I have now though feels a bit less obtrusive. Also note that it's possible for a dark image to have a "light corner" where your text is. In that case, Color Thief would be thrown off and return a value that's not helpful. (I plan on filing an issue on their repo suggesting a way to perhaps examine *part* of an image.) Finally, this could also be useful if you are using Cloudinary to host your image. Cloudinary can dynamically add text to an image (see my [blog post](https://cloudinary.com/blog/building-infographic-with-cloudinary-and-the-national-park-service-api) where I demonstrate this with the National Parks System API) and in theory, you could use this to help determine the best color. 

Let me know what you think!
