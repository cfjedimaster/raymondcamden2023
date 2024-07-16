---
layout: post
title: "Web Component to Generate Image Color Palettes"
date: "2024-07-16T18:00:00"
categories: ["development"]
tags: ["javascript","web components"]
banner_image: /images/banners/cat_colorful.jpg
permalink: /2024/07/16/web-component-to-generate-image-color-palettes
description: A web component that adds a palette to images.
---

Chalk this up to something that is *probably* not terribly useful, but was kind of fun to build. A few weeks ago I came across a site talking about the colors used in the Fallout TV show. I grabbed a screenshot of how they rendered it:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/pal1.jpg" alt="Screenshot" class="imgborder imgcenter" loading="lazy">
</p>

Unfortunately, I didn't make note of the site itself and I can't seem to find it anymore. I really dug how it showed the palette of prominent colors directly beneath the image itself. Using this as inspiration, I looked into how I could automate this with a web component.

To get the color palette, I turned to a library I've used many times before, [Color Thief](https://lokeshdhakar.com/projects/color-thief/). Given an image, it can return either the most dominant color of an image or return an array of values representing the palette of the image. 

I began with the HTML, which in this case simply wrapped a random image returned from Unsplash at a specific height and width:

```html
<color-palette>
<img src="https://unsplash.it/640/425" crossorigin="anonymous">
</color-palette>
```

In retrospect, maybe using a random image was a bad idea, as every reload showed something different, but once I had the code working it, well, worked, so I kept it as is.

Now for the code. To be honest, I didn't spend much time thinking about the color palette, rather, I was more concerned about how to 'rewrite' the image HTML in a way to look like the screen grab above. I knew CSS Grid could do it, so I went that route. I built a simple CodePen that only handled the layout. 

<p class="codepen" data-height="600" data-theme-id="dark" data-default-tab="result" data-slug-hash="QWXbVKo" data-pen-title="Pallete Demo 1" data-editable="true" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/QWXbVKo">
  Pallete Demo 1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

It was... nearly perfect. You can see a bit of whitespace after the image and before the images beneath. Honestly, if someone were to fork my CodePen with a fix, I'd definitely appreciate it! But with CSS in hand, I proceeded to the web component version.

Here's the code:

```js
class ColorPalette extends HTMLElement {
	#scriptSrc = 'https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js';
	
	constructor() {
		super();
	}
	
	async connectedCallback() {
		/*
		If we wrap an image, we work, otherwise, leave early
		*/
		this.imgRef = this.querySelector('img');
		if(!this.imgRef) {
			console.warn('color-palette: No img found.'); 
			return;
		}
		
		//not sure why getHTML() doesn't work
		let initialHTML = this.imgRef.outerHTML;
		await this.loadScript();
		console.log('loaded');
		await this.loadImage(this.imgRef);
		console.log('img loaded');

		let colorThief = new ColorThief();
		let palette = colorThief.getPalette(this.imgRef, 5);
		console.log(JSON.stringify(palette,null,'\t'));
		let newHTML = `
<style>
div.photo_palette {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	width: 640px;
	row-gap: 0;
}

div.photo_palette div {
	outline: 1px solid black;
}

div.photo {
	grid-column: span 5;
}

div.colorbar {
	width: 1fr;
	height: 50px;
}
</style>

<div class="photo_palette">
	<div class="photo">
		${initialHTML}
	</div>
	<div class="colorbar" style="background-color:rgb(${palette[0][0]},${palette[0][1]},${palette[0][2]})"></div>
	<div class="colorbar" style="background-color:rgb(${palette[1][0]},${palette[1][1]},${palette[1][2]})""></div>
	<div class="colorbar" style="background-color:rgb(${palette[2][0]},${palette[2][1]},${palette[2][2]})""></div>
	<div class="colorbar" style="background-color:rgb(${palette[3][0]},${palette[3][1]},${palette[3][2]})"></div>
	<div class="colorbar" style="background-color:rgb(${palette[4][0]},${palette[4][1]},${palette[4][2]})"></div>
</div>
`;
		this.innerHTML = newHTML;
	
	}
	
	async loadImage(i) {
		return new Promise((resolve, reject) => {
			console.log('complete', i.complete);
			if(i.complete) {
				resolve();
				return;
			}
			i.addEventListener('load', () => {
				resolve();
			});
		});
	};
	
	async loadScript() {
		return new Promise((resolve, reject) => {
			let script = document.createElement('script');
			script.type = 'text/javascript';
			script.src=this.#scriptSrc;
			document.head.appendChild(script);
			script.addEventListener('load', () => {
				resolve();
			});		
		});
	}
}

if(!customElements.get('color-palette')) customElements.define('color-palette', ColorPalette);
```

The script has two async processes it needs to wait for. First, load the external Color Thief library. Next, see if the image is loaded. As it's possible it's already loaded, my code has to handle that case as well. 

But once past that, I can get the color palette and then rewrite the HTML contained with the tags with my CSS and new divs holding the colors. I try to avoid the shadow DOM where possible, but obviously, this code will possibly 'clash' with existing CSS. I could perhaps use some better-named classes (for example, `div.color_palette_web_component`). 

Here it is in action:

<p class="codepen" data-height="600" data-theme-id="dark" data-default-tab="result" data-slug-hash="dyBoqNz" data-pen-title="Palete Demo 2" data-editable="true" data-user="cfjedimaster" data-token="5a954c8bc5afc6724bb8dab3532cf265" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/dyBoqNz/5a954c8bc5afc6724bb8dab3532cf265">
  Palete Demo 2</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

And since what you see above is random, I captured two examples:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/pal2.jpg" alt="First example" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2024/07/pal3.jpg" alt="Seconds example" class="imgborder imgcenter" loading="lazy">
</p>
