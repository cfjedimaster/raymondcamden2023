---
layout: post
title: "Updating and Supporting URL Parameters in JavaScript"
date: "2023-04-27T18:00:00"
categories: ["javascript"]
tags: ["javascript"]
banner_image: /images/banners/lens_filter.jpg
permalink: /2023/04/27/updating-and-supporting-url-parameters-in-javascript
description: How to support both setting and reading URL parameters in JavaScript
---

Not quite a *long* time ago, but roughly two years ago I wrote a [blog post](https://www.raymondcamden.com/2021/05/08/updating-and-supporting-url-parameters-with-vuejs) on updating and supporting, URL parameters with Vue.js. The idea was this: Given an application that lets you perform various tweaks, it would be nice if the URL was updated to reflect the current state of the application. This would let you bookmark, or share, the URL with others and they would get the same view as you. In that post, I built a very basic "data filtering" application and then updated it to support updates to the URL. I thought I'd revisit that post and demonstrate building it in vanilla JavaScript. As always, I'd love to hear your thoughts on this, especially if you've done something similar. 

## The Initial Application

I'm going to cheat a bit and steal some of the text/images from the older post. Here's our application in its default state:

<p>
<img src="https://static.raymondcamden.com/images/2021/05/vu1.jpg" alt="Demo layout of application, list of items with filters" class="lazyload imgborder imgcenter">
</p>

There's a list of items that consist of people, cats, and a dog. Each item has a name and type. On top, there are filters for the name and type. If you enter any text, the items that match the name (ignoring case) will be shown. If you select one or more of the types, only those matching will be shown.

<p>
<img src="https://static.raymondcamden.com/images/2021/05/vu2.jpg" alt="Items filtered by name and type" class="lazyload imgborder imgcenter">
</p>

Let's take a look at the code. First, the HTML:

```html
<div id="app">
	<h2>Items</h2>

	<p>
	<input type="search" placeholder="Filter by name" id="nameFilter"> 
	<input type="checkbox" value="person" id="personType" name="typeFilter"> 
	<label for="personType">Only People</label>
	
	<input type="checkbox" value="cat" id="catType" name="typeFilter"> 
	<label for="catType">Only Cats</label>

	<input type="checkbox" value="dog" id="dogType" name="typeFilter"> 
	<label for="dogType">Only Dogs</label>
	</p>

	<ul id="results">
		
	</ul>
</div>
```

This isn't too different from the earlier Vue version, but I've removed `v-model` and other Vue declarations. Now, the JavaScript. First, I've got my data hard-coded on top. Here's how it looks:

```js
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
]
```

Normally this would be loaded in via a network call or some such. Next, I define different variables and the "start up" code:

```js
let filteredItems = ITEMS;
let $results, $nameFilter, $typeFilter;

document.addEventListener('DOMContentLoaded', init, false);
function init() {
	$results = document.querySelector('#results');
	$nameFilter = document.querySelector('#nameFilter');
	$typeFilter = document.querySelectorAll('input[name="typeFilter"]');
	
	$nameFilter.addEventListener('input', updateFilter, false);
	$typeFilter.forEach(f => f.addEventListener('change', updateFilter, false));
	
	renderItems();
}
```

The only really interesting part is here that I listen for any change or input event on my fields on top, all of them going to the same particular function to handle those changes. 

`renderItems` just handles generated my HTML list:

```js
function renderItems() {
	let res = '';
	filteredItems.forEach(i => res +=`<li>${i.name}</li>`);
	$results.innerHTML = res;
}
```

But `updateFilter` is a bit more complex. I need to potentially filter by text input as well as multiple different "type" filters:

```js
function updateFilter() {
	let selectedTypes = Array.from($typeFilter).reduce((res, cur) => {
		if(cur.checked) res.push(cur.value);
		return res;
	}, []);
	
	filteredItems = ITEMS.filter(i => {
		if($nameFilter.value !== '' && i.name.toLowerCase().indexOf($nameFilter.value.toLowerCase()) === -1) return false;
		if(selectedTypes.length && !selectedTypes.includes(i.type)) return false;
		return true;
	});
	
	renderItems();
}
```

I think the only really odd thing above is `Array.from`, because `querySelectorAll` returns a `NodeList`, not a real array. 

All in all, I've got a bit more code than the Vue.js version, but I'm also not loading Vue, so a net win for this simple application. You can test this yourself below.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="bGmWQRy" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/bGmWQRy">
  Vue Blog Post about URL Params 2</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## The Updated Application

Ok, for our new version, we need to do two things: 

* When a person filters in any way, update the URL to reflect the filter.
* When the application loads, check the URL to see if filters were supplied.

Let's start with the latter. In my `updateFilter` method, in the end, I added a call to a new function, `updateURL`:

```js
function updateURL() {
	let qp = new URLSearchParams();
	if($nameFilter.value !== '') qp.set('filter', $nameFilter.value);

	let selectedTypes = Array.from($typeFilter).reduce((res, cur) => {
		if(cur.checked) res.push(cur.value);
		return res;
	}, []);

	if(selectedTypes.length) qp.set('typeFilter', selectedTypes);
	history.replaceState(null, null, "?"+qp.toString());
}
```

This uses the [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) API to generate a new query string. I begin by checking the input field for a value and if it exists, set the `filter` param to it.

For the selected types, I check them all and simply append the value if they are checked. This creates an array I can then set to `typeFilter` by relying on an automatic `toString` conversion. 

Finally, I use the [replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState) method of the History API to update the URL. The third argument doesn't need to be a full URL as I'm just changing the values in the query string. 

That part's rather easy, but to support recognizing the parameters on load, I've modified my init function:

```js
let filteredItems = Array.from(ITEMS);
let $results, $nameFilter, $typeFilter, $peopleFilter, $catFilter, $dogFilter;

document.addEventListener('DOMContentLoaded', init, false);
function init() {
	$results = document.querySelector('#results');
	$nameFilter = document.querySelector('#nameFilter');
	$typeFilter = document.querySelectorAll('input[name="typeFilter"]');

	$peopleFilter = document.querySelector('#personType');
	$catFilter = document.querySelector('#catType');
	$dogFilter = document.querySelector('#dogType');
	
	$nameFilter.addEventListener('input', updateFilter, false);
	$typeFilter.forEach(f => f.addEventListener('change', updateFilter, false));

	let qp = new URLSearchParams(window.location.search);
	if(qp.get('filter')) $nameFilter.value = qp.get('filter');
	let tf = qp.get('typeFilter');
	if(tf) {
		tf.split(',').forEach(t => {
			if(t === 'people') $peopleFilter.checked = true;
			if(t === 'cat') $catFilter.checked = true;
			if(t === 'dog') $dogFilter.checked = true;
		});
	}

	updateFilter();
	renderItems();
}
```

I've added a few more variables to make it easier to check my individual type filters. I get my current query string and then begin checking for my two main values, `filter` and `typeFilter`. Working with `filter` is easy, but for the `typeFilter`, I need to check each possible value and check the appropriate box. Also, notice I've added a call to update the filter since it's possible we have filtering going on. 

And that's it. Now, I'd like to show you on CodePen, but unfortunately it won't work correctly there. You can grab the code there if you want (<https://codepen.io/cfjedimaster/pen/dygWQwj?editors=1011>), but don't bother trying to *use* it there. Instead, I put it in one of my repos and you can browse it here: <https://cfjedimaster.github.io/webdemos/history/>

Or, test an example with stuff already filtered: <https://cfjedimaster.github.io/webdemos/history/?filter=y&typeFilter=person>

Let me know what you think!