---
layout: post
title: "A Tip for Properly Handling Loading States in Web Apps"
date: "2023-11-15T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_loading.jpg
permalink: /2023/11/15/a-tip-for-properly-handling-loading-states-in-web-apps
description: A tip for better handling of the loading state for apps.
---

This isn't something I was going to blog about, but after seeing the same issue a few times recently (although to be fair, last in a mobile game), I thought I'd share it with my audience. I apologize if the title isn't the best as it was a hard issue to describe, so let me begin by demonstrating the problem, and then the (hopefully) obvious solution.

## Loading Data 

Here's a super simple example of a web page that loads some data from the API. In this case, it's the [Star Wars API](https://swapi.dev/) which, unfortunately, has been pretty slow recently. On the flip side, that helps illustrate that issue. 

The HTML is just an h2 and an empty `ul` and the JavaScript is fairly simple:

```js
document.addEventListener('DOMContentLoaded', init, false);

async function init() {
	let $shipList = document.querySelector('#shipsList');
	let shipRequest = await fetch('https://swapi.dev/api/starships');
	let ships = await shipRequest.json();
	if(ships.count === 0) {
		$shipList.outerHTML = 'There are no ships. :(';	
	} else {
		let html = ships.results.reduce((prev, cur) => {
			return prev + `<li>${cur.name}</li>\n`;
		}, '');
		$shipList.innerHTML = html;
	}
}
```

The result of the API call will contain a `count` variable, and if it's zero, it means we have no data. If it's anything else, we can render a list of ships. You can see this in action below:

<p class="codepen" data-height="300" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="yLZPNjK" data-editable="true" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/yLZPNjK">
  Untitled</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

If you got to this part of my article and the data was already there, just hit the nice little `Rerun` button in the bottom right to see how there's no indication that anything is loading at all. The user may think the page is broken and navigate away. 

The solution is to simply add a loading message. Most folks I assume know this already, but let's just fix that quickly. Since my JavaScript blows away the inside of my list when the data is loaded, I'll fix the issue with HTML:

```html
<ul id="shipsList">
	<li><i>Loading ships...</i></li>
</ul>
```

Here's that version, and again, hit `Rerun` to see it properly.

<p class="codepen" data-height="300" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="RwvjPvR" data-editable="true" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/RwvjPvR">
  Untitled</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Cool. My expectation is that most people inherently get this, but if not, hopefully I've taught you an good way to handle things like this. But - let's consider an alternative.

## Loading Data - Part Deux

In the previous example, it's important to remember that there isn't two states (loading and done loading), but rather three: Loading, Ships, and No Ships. Let's consider a variant of the previous demo that makes use of Alpine.js. In my HTML, I'm going to handle only two states - no ships or ships:

```html
<div x-data="app" x-cloak>
	<h2>Ships</h2>
	<div x-show="ships">
	<ul>
		<template x-for="ship in ships">
			<li x-text="ship.name"></li>
		</template>
	</ul>
	</div>
	<div x-show="!ships">
		There are no ships.
	</div>
</div>
```

My JavaScript simply fills the ship data on load:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
		ships:null,
		async init() {
			let shipRequest = await fetch('https://swapi.dev/api/starships');
			let shipData = await shipRequest.json();
			if(shipData.count) this.ships = shipData.results;
		}
  }))
});
```

And now if you run this version, you see the issue (and again, smash that Rerun button):

<p class="codepen" data-height="300" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="PoVOqrm" data-editable="true" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/PoVOqrm">
  Untitled</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

You'll see the page load up and clearly say, "There are no ships", while that is clearly false. We don't *know* if there aren't ships!

Now, I feel like this is an obvious thing to avoid, but like I said, I've seen it a few times now so I figured it was time to talk about it. 

As a final note, here's a corrected version of the previous example. In this one, I use a new variable, `loading`, and toggle the DOM between showing a loading message or one of the two results (ships or now ships):

<p class="codepen" data-height="300" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="NWowGqY" data-editable="true" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/NWowGqY">
  Loading Post V4</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

