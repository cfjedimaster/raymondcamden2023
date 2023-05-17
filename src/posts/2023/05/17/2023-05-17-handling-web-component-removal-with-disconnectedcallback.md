---
layout: post
title: "Handling Web Component Removal with disconnectedCallback"
date: "2023-05-17T18:00:00"
categories: ["javascript"]
tags: ["web components"]
banner_image: /images/banners/legos.jpg
permalink: /2023/05/17/handling-web-component-removal-with-disconnectedcallback
description: A quick look at how to handle (when you need to) the removal of a web component.
---

MDN does a fairly good job of covering the [lifecycle events](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#using_the_lifecycle_callbacks) for web components but one in particular got my attention today, `disconnectedcallback`. As kind of the inverse of `connectedCallback`, it will be fired when an instance of your custom element is removed from the DOM. While I didn't doubt this worked as advertised, I wanted to build a quick demo myself so I could see it in action. Let's start off with a component that demonstrates why this event is needed.

## Initial Web Component

The first draft of our component is `foo-cat`. This component does two things, outputs a simple bit of HTML and then uses an interval to execute code every two seconds. In this trivial example, it's just going to log a message to the DOM, but in a real-world component, you could imagine a component hitting a remote API to get updated information.

Here's the component:

```js
class FooCat extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		let name = 'Nameless';
		if(this.hasAttribute('name')) name = this.getAttribute('name');
		this.innerHTML = `<p>"Meow, meow.", said ${name} the cat.</p>`;
		setInterval(() => {
			let p = document.createElement('p');
			p.innerText = 'Meow!';
			document.body.append(p);
		}, 2000);
	}

}

customElements.define('foo-cat', FooCat);
```

Now I'll use it in my HTML:

```html
<foo-cat></foo-cat>
<button onclick="killTheCat()">Kill the Cat</button>
```

I've added a button as well and used an inline event handler (yes, this is not best practice, but I'm trying to keep things simple, please don't report me to the JavaScript Elders, I'd rather they keep fighting about React, SPAs, and, well everything else). The `killtheCat` function just removes the element using a document selector (technically this will only remove the first one in the DOM, but again, going for simplicity):

```js
function killTheCat() {
	console.log('kill the cat');
	document.querySelector('foo-cat').remove();
}
```

Alright, nice and simple, right? Here it is running in a CodePen:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="yLRRVzp" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/yLRRVzp">
  Test disconnectedCallback</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

If you click the button, you'll notice the component goes away, but the messages keep getting printed to the page. If you want, you can open the CodePen link, go to devtools, and confirm the custom element is gone. 

## Fixed Component

I was going to label this section, "properly killing the cat", but thought that was a bit much. So as you can expect, having an event handler to recognize when the component leaves the DOM is exactly what we need to fix this issue. I made two changes. First, I kept a handle to my interval like so:

```js
this.heartbeat = setInterval(() => {
	let p = document.createElement('p');
	p.innerText = 'Meow!';
	document.body.append(p);
}, 2000);
```

And then simply added the event handler:

```js
disconnectedCallback() {
	console.log('i was killed, sad face');
	clearInterval(this.heartbeat);
}
```

So again, while my component here is pretty trivial, you can see how important this would be in a real-world web component. You can test this out yourself below. 

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="gOBBLKM" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/gOBBLKM">
  Test disconnectedCallback</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>