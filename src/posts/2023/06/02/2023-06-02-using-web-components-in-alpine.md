---
layout: post
title: "Using Web Components in Alpine"
date: "2023-06-02T18:00:00"
categories: ["javascript"]
tags: ["alpinejs","web components"]
banner_image: /images/banners/cat-mountain.jpg
permalink: /2023/06/02/using-web-components-in-alpine
description: An example of including, and using web components with Alpine
---

To be honest, the TLDR for this entire post is, "It just works", so I'd more than understand if you stop reading, but like most things in my life, I like to *see* it working to reassure myself of the fact. So with that out of the way, let's consider a simple example. 

## First Attempt

I began by defining a super simple Alpine application that just has a list of cats:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
		cats:[
			{name:"Luna", age:11},
			{name:"Pig", age:9},
			{name:"Elise", age:13},
			{name:"Zelda", age:1},
			{name:"Grace", age:12},
			]
  }))
});
```

In the HTML, I iterate over each cat and display it with a web component I'll define in a moment:

```html
<div x-data="app">
	<template x-for="cat in cats">
		<p>
		cat: <cat-view :name="cat.name" :age="cat.age"></cat-view>
		</p>
	</template>
</div>
```

As the component hasn't been defined yet, all I'll see are 5 "cat:" messages:

<p>
<img src="https://static.raymondcamden.com/images/2023/06/awc1.jpg" alt="HTML rendered list of cats" class="imgborder imgcenter" loading="lazy">
</p>

Alright, let's define our web component:

```js
class CatView extends HTMLElement {

	constructor() {
		super();
		this.name = '';
		this.age = '';
	}
	
	connectedCallback() {
		
		if(this.hasAttribute('name')) this.name = this.getAttribute('name');
		if(this.hasAttribute('age')) this.age = this.getAttribute('age');
		this.render();
	}
	
	render() {
		this.innerHTML = `
<div>
I'm a cat named ${this.name} that is ${this.age} years old.
</div>
`;
	}
	
	
}

if(!customElements.get('cat-view')) customElements.define('cat-view', CatView);
```

All this component is doing is picking up the `name` and `age` attributes and rendering it out in a `div`. Let's see what this renders:

<p>
<img src="https://static.raymondcamden.com/images/2023/06/awc2.jpg" alt="Cats render, but with no name or age displayed" class="imgborder imgcenter" loading="lazy">
</p>

So what happened? Alpine successfully added the components to the DOM, but the attributes were updated after the `connectedCallback` event was fired. This was - I think - expected - and luckily is simple enough to fix with `observedAttributes` and `attributeChangedCallback`:

```js
class CatView extends HTMLElement {

	constructor() {
		super();
		this.name = '';
		this.age = '';
	}
	
	connectedCallback() {
		
		if(this.hasAttribute('name')) this.name = this.getAttribute('name');
		if(this.hasAttribute('age')) this.age = this.getAttribute('age');
		this.render();
	}
	
	render() {
		this.innerHTML = `
<div>
I'm a cat named ${this.name} that is ${this.age} years old.
</div>
`;
	}
	
	static get observedAttributes() { return ['name', 'age']; }

	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
		this.render();
	}
	
	
}
```

And voila, you can see the result below:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="ZEqgXWo" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/ZEqgXWo">
  Alpine + WC</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Small Update

Cool, so that worked, but I wanted to be sure that updating data in Alpine worked, so I added a quick button:

```html
<button @click="addCat">Add Cat</button>
```

This was tied to this handler:

```js
addCat() {
	let newCat = {
		name:`New cat ${this.cats.length+1}`,
		age: this.cats.length
	};
	this.cats.push(newCat);
}
```

I'm just giving a name and age based on the number of cats already in the data set. Again, no surprises here, but it works as expected:

<p>
<img src="https://static.raymondcamden.com/images/2023/06/awc3.jpg" alt="Cats listed out with a few new ones" class="imgborder imgcenter" loading="lazy">
</p>

You can find this version below. I encourage you to hint that "Add Cat" button multiple times because more cats is always a good thing.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="abReLmX" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/abReLmX">
  Alpine + WC (2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<br>

Photo by <a href="https://unsplash.com/@kriztheman?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Christopher Alvarenga</a> on <a href="https://unsplash.com/photos/-XW3rl2aXb0?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
