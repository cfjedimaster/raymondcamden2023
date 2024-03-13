---
layout: post
title: "Responding to HTML Changes in a Web Component"
date: "2024-03-13T18:00:00"
categories: ["javascript"]
tags: ["web components"]
banner_image: /images/banners/cat-pictures.jpg
permalink: /2024/03/13/responding-to-html-changes-in-a-web-component
description: Using MutationObserver in a web component to detect changes.
---

While driving my kids to school this morning, I had an interesting thought. Is it possible for a web component to recognize, and respond, when its inner DOM contents have changed? Turns out of course it is, and the answer isn't really depenedant on web components, but is a baked-in part of the web platform, the [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver). Here's what I built as a way to test it out.

## The Initial Web Component

I began with a simple web component that had the following simple feature - count the number of images inside it and report. So we can start with this HTML:

```html
<img-counter>
	<p>
		<img src="https://placehold.co/60x40">
	</p>
	<div>
		<img src="https://placehold.co/40x40">
	</div>
	<img src="https://placehold.co/90x90">
</img-counter>
```

And build a simple component:

```js
class ImgCounter extends HTMLElement {

	constructor() {
		super();
	}
	
	connectedCallback() {
		let imgs = this.querySelectorAll('img');
		this.innerHTML += `<p>There are <strong>${imgs.length}</strong> images in me.</p>`;
	}
	
}

if(!customElements.get('img-counter')) customElements.define('img-counter', ImgCounter);
```

It just uses `querySelectorAll` to count the `img` node inside it. For my initial HTML, this reports 3 of course. 

I then added a simple button to my HTML:

```html
<button id="testAdd">Add Img</button>
```

And a bit of code:

```js
document.querySelector('#testAdd').addEventListener('click', () => {
	document.querySelector('img-counter').innerHTML = '<p>New: <img src="https://placehold.co/100x100"></p>' + document.querySelector('img-counter').innerHTML;
});
```

When run, it will add a new image, but obviously, the counter won't update. Here's a CodePen of this initial version:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="ZEZOwKO" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/ZEZOwKO">
  Img Counter WC 1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Enter - the MutationObserver

The MDN docs on [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) are pretty good, as always. I won't repeat what's written there but the basics are:

* Define what you want to observe under a DOM element - which includes the subtree, childList, and attributes
* Write your callback
* Define the observer based on the callback
* Tie the observer to the DOM root you want to watch

So my thinking was... 

* Move out my 'count images and update display' to a function
* Add a mutation observer and when things change, re-run the new function

My first attempt was rather naive, but here it is in code form, not CodePen, for reasons that will be clear soon:

```js
class ImgCounter extends HTMLElement {

	constructor() {
		super();
	}
	
	connectedCallback() {
		
		this.renderCount();
		
		const mutationObserver = (mutationList, observer) => {
			this.renderCount();
		};
		
		const observer = new MutationObserver(mutationObserver);
		observer.observe(this, { 
			childList: true, subtree: true 
		});
	}
	
	renderCount() {
		let imgs = this.querySelectorAll('img');
		this.innerHTML += `<div><p>There are <strong>${imgs.length}</strong> images in me.</p></div>`;
	}

}
```

So the MutationObserver callback is sent information about what changed, and in my simple little mind, I figured, I don't care. If something changes, just rerun the count to count images. 

Look at that code and see if you can figure out the issue. If you can, leave me a comment below.

So yes, this "worked", but this is what happened:

* I clicked the button to add a new image
* The mutation observer fired and was like, cool, new shit to do, run `renderCount`
* `renderCount` got the images and updated the HTML to reflect the new count
* Hey guess what, `renderCount` changed the DOM tree, let's run the observer again
* Repeat until the [heat death of the universe](https://en.wikipedia.org/wiki/Heat_death_of_the_universe)

I had to tweak things a bit, but here's the final version, and I'll explain what I did:

```js
class ImgCounter extends HTMLElement {

	#myObserver;
	
	constructor() {
		super();
	}
	
	connectedCallback() {
		
		// create the div we'll use to monitor images:
		this.innerHTML += '<div id="imgcountertext"></div>';
		
		this.renderCount();
		
		const mutationObserver = (mutationList, observer) => {			
			for(const m of mutationList) {
				if(m.target === this) {
					this.renderCount();
				}
			}
		};
		
		this.myObserver = new MutationObserver(mutationObserver);
		this.myObserver.observe(this, { 
			childList: true, subtree: true 
		});
	}
	
	disconnectedCallback() {
		this.myObserver.disconnect();
	}
	
	renderCount() {
		let imgs = this.querySelectorAll('img');
		this.querySelector('#imgcountertext').innerHTML = `There are <strong>${imgs.length}</strong> images in me.`;
	}

}

if(!customElements.get('img-counter')) customElements.define('img-counter', ImgCounter);

document.querySelector('#testAdd').addEventListener('click', () => {
	document.querySelector('img-counter').innerHTML = '<p>New: <img src="https://placehold.co/100x100"></p>' + document.querySelector('img-counter').innerHTML;
});
```

I initially had said I didn't care about what was in the list of items changed in the mutation observer, but I noticed that the `target` value was different when I specifically added my image count report. To help with this, I'm now using a `div` tag with an ID and `renderCount` modifies that. 

When a new image (or anything) is added directly inside the component, my target value is `img-counter`, or `this`, which means I can run `renderCount` on it. When `renderCount` runs, the target of the mutation is its own div. 

Also, I noticed that the MutationObserver talks specifically called out the `disconnect` method as a way of ending the DOM observation. That feels pretty important, and web components make it easy with the `disconnectedCallback` method. 

All in all, it works well now (as far as I know ;), and you can test it yourself below:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="dyLXaWm" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/dyLXaWm">
  Img Counter WC 2</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Remember, MutationObserver can absolutely be used outside of web components. Also note that if you only want to respond to an *attribute* change in a web component, that's really easy as it's baked into the spec. As always, let me know what you think, and I've got a strong feeling that someone going to show me a better way of doing this, and I'd be happy to see it!