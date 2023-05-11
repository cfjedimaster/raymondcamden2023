---
layout: post
title: "Creating a Web Component for Reveal.js (Follow-up)"
date: "2023-04-24T18:00:00"
categories: ["development"]
tags: ["web components"]
banner_image: /images/banners/slideshow.jpg
permalink: /2023/04/24/creating-a-web-component-for-revealjs-followup
description: A followup to my previous proof of concept web component for Reveal.js.
---

This weekend I [blogged](https://www.raymondcamden.com/2023/04/22/creating-a-web-component-for-revealjs) about a web component experiment wrapping the excellent [Reveal.js](https://revealjs.com/) presentation library. In that post, I created a component to wrap `<section>` tags that represented individual slides. I mentioned that I wanted to follow up on this and create a "child" component to represent slides. Here's what I did - including my first version which failed for a pretty obvious reason.

## Version One - That I Did Wrong on Purpose to Test My Readers - Honest.

Alright, so in my initial [post](https://www.raymondcamden.com/2023/04/22/creating-a-web-component-for-revealjs), I created the `<reveal-preso>` tag. Here's an example of how such a component would work:

```html
<reveal-preso height="700px" theme="dracula">
	<section>Slide 1b</section>
	<section>
		<h2>Plan</h2>
		<ul>
			<li class="fragment">Phase One - Collect Underpants</li>
			<li class="fragment">Phase Two - ?</li>
			<li class="fragment">Phase Three - Profit</li>
		</ul>
	</section>
	<section>Slide 3</section>
	<section data-background-color="aquamarine">
		<h2>🍦</h2>
	</section>
	<section data-background-image="https://placekitten.com/800/800">
		<h2>Image</h2>
	</section>	
</reveal-preso>
```

My plan was to simply replace `<section>` with a new component, `<reveal-slide>`. My initial, flawed implementation, was super simple:

```js
class RevealSlide extends HTMLElement {
	constructor() {
		super();
	}
	
	connectedCallback() {
		console.log('RS connected callback called');
		let currentHTML = this.innerHTML;
		this.innerHTML = `<section>${currentHTML}</section>`;
	}
}

if(!customElements.get('reveal-slide')) customElements.define('reveal-slide', RevealSlide);
```

I then edited my HTML to add one on top:

```html
<reveal-preso height="700px" theme="dracula">
	<reveal-slide>Reveal Slide</reveal-slide>
	<section>Slide 1b</section>
	<!-- more sections... -->
</reveal-preso>
```

I intentionally just added one because I figured the other slides would continue to work as before. However, the result was broken:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/reveal1.jpg" alt="Both slides being shown at once" class="imgborder imgcenter" loading="lazy">
</p>

I've been using Reveal for a long time, and typically when this happens it means I made a typo somewhere in my HTML. So I did what any good web developer should do - <s>run to StackOverflow</s>open up my devtools. When I did, I saw this:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/reveal2.jpg" alt="Devtools DOM tree" class="imgborder imgcenter" loading="lazy">
</p>

In case that's a bit hard to read, it's basically showing this:

```html
<reveal-preso ...>
	<reveal-slide>
		<section> ... </section>
	</reveal-slide>
	<section> ... </section>
	<section> ... </section>
</reveal-preso>
```

Reveal expects *top-level* `<section>` tags immediately under the `<div>` wrapper with `class="slides"`. Since it was "under" the original web component, it wasn't found and properly handled by Reveal. 

In case you want to see this broken version, you can find it below.

<p class="codepen" data-height="700" data-theme-id="dark" data-default-tab="result" data-slug-hash="jOeByGq" data-editable="true" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/jOeByGq">
  WC Reveal (2 Fork)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Version Two - The Perfect One I Meant To Do All Along

Fixing it ended up being rather easy, although I'm not entirely sure how "proper" this is for web components, but one of the fun things about building demos on the web is seeing what you can use in the wrong way. I simply replaced my web component instance with a new `section` tag:

```js
let currentHTML = this.innerHTML;
let section = document.createElement('section');
section.innerHTML = `${currentHTML}`;
this.parentNode.replaceChild(section, this);
```

This works, but of course, my web component is basically self-destructing. If I wanted to do things like handle attribute changes and the such, as far as I know it wouldn't work. But in terms of the presentation, it worked just fine.

I then decided to take it one step further. Reveal slides can be modified with data attributes, so for example:

```html
<section data-background-image="https://placekitten.com/800/800">
	<h2>Image</h2>
</section>	
```

"Proper" HTML allows for *any* custom attribute as long as you prefix it with `data`, and then you can get and manipulate those attributes as you see fit. 

For my web component, I thought it would be cool to allow you to use all of the attributes Reveal supports, but without the `data-` prefix:

```html
<reveal-slide background-color="red">Red Reveal Slide</reveal-slide>
<reveal-slide background-gradient="linear-gradient(to bottom, #283b95, #17b2c3)">
<h2>🐟</h2>
</reveal-slide>
<reveal-slide background-image="https://placekitten.com/800/800">
	<h2>Image</h2>
</reveal-slide>	
```

To support this, I checked the `attributes` property of my web component instance. For reach I find, I simply prefix it with `data-`. 

```js
for(let i=0; i<this.attributes.length; i++) {
	section.setAttribute(`data-${this.attributes[i].name}`, this.attributes[i].value);
}
```

Now, this would be bad for standard attributes like `id`, `width`, etc. But Reveal doesn't really use those for slides. 

All in all, this really "reads" nicely to me:

```html
<reveal-preso height="700px" theme="dracula">
	<reveal-slide>Reveal Slide</reveal-slide>
	<reveal-slide background-color="red">Red Reveal Slide</reveal-slide>
	<reveal-slide background-gradient="linear-gradient(to bottom, #283b95, #17b2c3)">
  	<h2>🐟</h2>
	</reveal-slide>
	<reveal-slide>
		<h2>Plan</h2>
		<ul>
			<li class="fragment">Phase One - Collect Underpants</li>
			<li class="fragment">Phase Two - ?</li>
			<li class="fragment">Phase Three - Profit</li>
		</ul>
	</reveal-slide>
	<reveal-slide background-image="https://placekitten.com/800/800">
		<h2>Image</h2>
	</reveal-slide>	
</reveal-preso>
```

Feel free to play with, and fork, this version:

<p class="codepen" data-height="700" data-theme-id="dark" data-default-tab="result" data-slug-hash="QWZpdmE" data-editable="true" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/QWZpdmE">
  WC Reveal (2 Fork Rev B)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<p></p>

Photo by <a href="https://unsplash.com/@alex_andrews?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Alexander Andrews</a> on <a href="https://unsplash.com/s/photos/slide-show?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  