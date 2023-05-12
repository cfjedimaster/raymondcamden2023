---
layout: post
title: "Updating and Supporting URL Parameters in Alpine.js"
date: "2023-05-12T18:00:00"
categories: ["javascript"]
tags: ["alpinejs"]
banner_image: /images/banners/lens_filter.jpg
permalink: /2023/05/12/updating-and-supporting-url-parameters-in-alpinejs
description: 
---

I think most of my readers know, when I get an idea in my head, I tend to go pretty deep into it. A few days ago, I blogged about [updating and supporting URL parameters with JavaScript](https://www.raymondcamden.com/2023/04/27/updating-and-supporting-url-parameters-in-javascript). That post itself was an update to an earlier [post](https://www.raymondcamden.com/2021/05/08/updating-and-supporting-url-parameters-with-vuejs) demonstrating how to do it with Vue.js. For this last post on the topic, probably, I'm going to demonstrate how it could be done with [Alpine.js](https://alpinejs.dev/).

Before I start though a quick note. The demonstration application I've built is *incredibly* simple and works just fine without any additional framework. I really like Alpine, but I would not use it in such a simple example. That being said, I added it to my application for demonstration purposes and I hope that clarification makes sense. If not, just reach out!

## The Initial Application

I'm going to cheat a bit and steal some of the text/images from both the old Vue post and the one from a few days ago. Here's our application in its default state:

<p>
<img src="https://static.raymondcamden.com/images/2021/05/vu1.jpg" alt="Demo layout of application, list of items with filters" class="imgborder imgcenter" loading="lazy">
</p>

There's a list of items that consist of people, cats, and a dog. Each item has a name and type. On top, there are filters for the name and type. If you enter any text, the items that match the name (ignoring case) will be shown. If you select one or more of the types, only those matching will be shown.

<p>
<img src="https://static.raymondcamden.com/images/2021/05/vu2.jpg" alt="Items filtered by name and type" class="imgborder imgcenter" loading="lazy">
</p>

Here's how I built this with Alpine. First, the HTML:

```html
<div x-data="myApp">
	<h2>Items</h2>

	<p>
	<input type="search" placeholder="Filter by name" x-model="nameFilter"> 
	<input type="checkbox" value="person" id="personType" x-model="typeFilter"> 
	<label for="personType">Only People</label>
	
	<input type="checkbox" value="cat" id="catType" x-model="typeFilter"> 
	<label for="catType">Only Cats</label>

	<input type="checkbox" value="dog" id="dogType" x-model="typeFilter"> 
	<label for="dogType">Only Dogs</label>
	</p>

	<ul>
		<template x-for="result of filteredResults">
			<li x-text="result.name"></li>
		</template>
	</ul>
</div>
```

If you aren't familiar with Alpine, just pay attention to the `x-` bits as they give you a clue as to what's going on. One of the things I like about Alpine is that I think a person with no knowledge at all about the framework could look at that and get a basic idea of what's going on. 

My form fields make use of `x-model` for two-way binding, and the results are handled via `x-for` inside my unordered list. Now for the JavaScript:

```js
// hard coded for simplicity...
const ITEMS = [
	{ name: "Ray", type: "person" },
	{ name: "Lindy", type: "person" },
	{ name: "Jacob", type: "person" },
	{ name: "Lynn", type: "person" },
	{ name: "Noah", type: "person" },
	{ name: "Jane", type: "person" },
	{ name: "Maisie", type: "person" },
	{ name: "Carol", type: "person" },
	{ name: "Ashton", type: "person" },
	{ name: "Weston", type: "person" },
	{ name: "Sammy", type: "cat" },
	{ name: "Aleese", type: "cat" },
	{ name: "Luna", type: "cat" },
	{ name: "Pig", type: "cat" },
	{ name: "Cayenne", type: "dog" }
];

document.addEventListener('alpine:init', () => {
	Alpine.data('myApp', () => ({
		async init() {
			this.results = ITEMS;
			this.filteredResults = this.results;
			this.$watch('nameFilter', () => this.updateFilter() );
			this.$watch('typeFilter', () => this.updateFilter() );
		},
		nameFilter:'',
		typeFilter:[],
		results:[],
		filteredResults:[],
		updateFilter() {
			this.filteredResults = this.results.filter(i => {
				if(this.nameFilter !== '' && i.name.toLowerCase().indexOf(this.nameFilter.toLowerCase()) === -1) return false;
				if(this.typeFilter.length > 0 && !this.typeFilter.includes(i.type)) return false;
				return true;
			});
				
		}
	}))
})
```

Skip past the hard-coded set of data and note the actual Alpine implementation. It's mostly done by listening for changes to the name and type filter. Both will fire off the same method, `updateFilter`. That method then updates the list of items we render based on your filters. You can see this in action below:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="KKGeXaG" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/KKGeXaG">
  Work with URL Params, Alpine (Pre)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Now let's get to the fancy version!

## The Updated Application

As stated in the last blog post, we need to do two things: 

* When a person filters in any way, update the URL to reflect the filter.
* When the application loads, check the URL to see if filters were supplied.

Let's begin with the first requirement, updating the URL. Luckily we mostly use the exact same code. First, in `updateFilter`, we add a call to `this.updateURL();`. Here's that new function:

```js
updateURL() {
	let qp = new URLSearchParams();
	if(this.nameFilter !== '') qp.set('filter', this.nameFilter);

	if(this.typeFilter.length) qp.set('typeFilter', this.typeFilter);
	history.replaceState(null, null, "?"+qp.toString());
}
```

This ends up being a bit simpler than the JavaScript version but basically follows the same pattern. Check each filter and update the query string based on the values there.

Now let's look at how we can handle existing URL parameters - we will do this in our `init` method:

```js
async init() {
	this.results = ITEMS;
	this.filteredResults = this.results;
	this.$watch('nameFilter', () => this.updateFilter() );
	this.$watch('typeFilter', () => this.updateFilter() );

	let qp = new URLSearchParams(window.location.search);
	if(qp.get('filter')) this.nameFilter = qp.get('filter');
	let tf = qp.get('typeFilter');
	if(tf) {
		this.typeFilter = tf.split(',');
	}

},
```

We begin by creating a new `URLSearchParams` object and checking for each possible filter. Setting the `nameFilter` is simple, but `typeFilter` is an array. We can get that easily enough (if it exists) by using the `split` method. 

And that's it! As before, you can't really demo this on CodePen, but I did make one here: <https://codepen.io/cfjedimaster/pen/zYmaEmv>. Instead, test it out here: <a href="https://cfjedimaster.github.io/webdemos/history/alpine_history.html" target="_new">https://cfjedimaster.github.io/webdemos/history/alpine_history.html</a>.

Or, test an example with stuff already filtered: <a href="https://cfjedimaster.github.io/webdemos/history/alpine_history?filter=y&typeFilter=person" target="_new">https://cfjedimaster.github.io/webdemos/history/alpine_history?filter=y&typeFilter=person</a>