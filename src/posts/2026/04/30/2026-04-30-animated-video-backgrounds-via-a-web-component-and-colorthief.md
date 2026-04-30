---
layout: post
title: "Animated video backgrounds via a Web Component and ColorThief"
date: "2026-04-30T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/shadows.jpg
permalink: /2026/04/30/animated-video-backgrounds-via-a-web-component-and-colorthief
description: A web component for animated video backgrounds.
---

Earlier this year, the epic [ColorThief](https://lokeshdhakar.com/projects/color-thief/) library had a pretty significant update. I [blogged](https://www.raymondcamden.com/2026/03/04/dyanimically-adjusting-image-text-for-contrast) about a simple demo I built with it but I was fascinated by one particular demo on their site.  

The "observe" function in ColorThief lets you monitor a video source and grab the colors at a particular frame. Their [demo](https://lokeshdhakar.com/projects/color-thief/#v3-observe) uses this to create a lovely shadow background of the video. I believe some TVs have this feature as well, and honestly I'd worry that would get annoying, but the ColorThief demo was pretty cool, so I thought I'd try to build it with a web component. 

The idea would be - take any basic video element and wrap it like so:

```html
<video-bgshadow>
<video controls width="250">
    <source src="videos/flower.mp4" type="video/mp4">
</video>
</video-bgshadow>
```

The web component would then handle:

* Loading the ColorThief library
* Waiting for the video to be played
* Running the `observe` method and updating the CSS 

All in all, this wasn't too difficult. I don't think my shadow is as good as the demo (and I'm totally open to people submitting a PR!), but it came out ok. 

I'll link to the demo below, but here's a simple example in a CodePen:

<p class="codepen" data-theme-id="dark" data-height="500" data-pen-title="&amp;lt;video-bgshadow&amp;gt;" data-preview="true" data-version="2" data-default-tab="result" data-slug-hash="yyVLXQY" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/editor/cfjedimaster/pen/019dd938-b4d6-7494-a3f7-a6a3a1b801aa">
  &lt;video-bgshadow&gt;</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Alright, so here's the code:

```js
class VideoBGShadowComponent extends HTMLElement {
	
	constructor() {
		super();
	}
	
	async connectedCallback() {
		this.videoEl = this.querySelector('video');
		if(!this.videoEl) {
			console.warn('No <video> element found.');
			return;
		}

		// wrap the video in a new div
		this.wrapper = document.createElement('div');
		this.videoEl.parentNode.insertBefore(this.wrapper, this.videoEl);
		this.wrapper.appendChild(this.videoEl);
		this.wrapper.style.display = 'inline-block';
		this.videoEl.style.verticalAlign = 'bottom';
		if(!window.ColorThief) await this.loadCF();
		this.videoEl.addEventListener('play', this.startShadow.bind(this));
		this.videoEl.addEventListener('ended', this.endShadow.bind(this));
		this.videoEl.addEventListener('pause', this.endShadow.bind(this));

	
	}

	// Sets window.ColorThiefLoading (Promise) to deduplicate concurrent script injection across multiple instances.
	async loadCF() {
		if (!window.ColorThiefLoading) {
			window.ColorThiefLoading = new Promise((resolve) => {
				const script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = 'https://unpkg.com/colorthief@3/dist/umd/color-thief.global.js';
				document.head.appendChild(script);
				script.onload = resolve;
			});
		}
		return window.ColorThiefLoading;
	}

	startShadow(e) {
		console.log('video play');
		let thatWrapper = this.wrapper;
		this.controller = ColorThief.observe(e.target, {
		    throttle: 200,
		    colorCount: 5,
			  onChange(palette) {
	            const [dominant] = palette;
                thatWrapper.style.setProperty('--glow-color', dominant.css());
                thatWrapper.style.boxShadow = '15px 15px 20px 8px var(--glow-color)';
		    },
		})
	}

	endShadow() {
		console.log('video play end');
		this.controller.stop();
	}

}

if(!customElements.get('video-bgshadow')) customElements.define('video-bgshadow', VideoBGShadowComponent);
```

I don't think there's anything necessarily interesting in here, although I struggled quite a bit with `loadCF`. I didn't want to add the ColorThief library N times to the page. Checking for `window.ColorThief` only works if for some reason a video wrapped with the component is added to the page *after* the library loads. I used Claude to help me with this bit and while it "litters" the window object with a value, I think that is a fair trade off to ensure only one library is loaded. (Technically this could be further updated to first see if ColorThief exists in general as it's possible the website uses it for something else.)

You can see a demo with a couple of examples here: <https://cfjedimaster.github.io/webdemos/video-bgshadow/>

And if you think this is a good start but could be *so* much better, I agree, help me out over at the repo: <https://github.com/cfjedimaster/webdemos/tree/master/video-bgshadow>

Photo by <a href="https://unsplash.com/@ansleycreative?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Matthew Ansley</a> on <a href="https://unsplash.com/photos/two-people-standing-on-concrete-floor-6AQxBtaIYOk?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
