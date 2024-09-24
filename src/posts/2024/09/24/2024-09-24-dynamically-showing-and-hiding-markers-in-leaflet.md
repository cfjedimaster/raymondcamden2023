---
layout: post
title: "Dynamically Showing and Hiding Markers in Leaflet"
date: "2024-09-24T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_magician.jpg
permalink: /2024/09/24/dynamically-showing-and-hiding-markers-in-leaflet
description: A demonstration of how to show/hide markers in a Leaflet map.
---

This was originally going to be an example of using [Leaflet](https://leaflet.js.com) with [Alpine.js](https://alpinejs.dev), but while working on that demo I discovered an interesting aspect of Leaflet that was a bit more difficult than I thought it would be - hiding and showing markers. Here's how I approached the problem, and as always, if you know of a better way, leave me a comment below and share!

## Approach One

For my first demo, I decided to start simple. First, I built a function to return a static set of data:

```js
async function getStores() {
	return new Promise(resolve => {
		
		let stores = [
			{ name: "Lafayette Store", open24Hours:true, location: { lat:30.216, lng: -92.033 }},
			{ name: "Baton Rouge Store", open24Hours:false, location: { lat:30.471, lng: -91.147 }},
			{ name: "NOLA Store", open24Hours:true, location: { lat:29.951, lng: -90.071 }},
			{ name: "Lake Charles Store", open24Hours:false, location: { lat:30.212, lng: -93.218 }},
			{ name: "Rayne Store", open24Hours:true, location: { lat:30.235, lng: -92.268 }},
			{ name: "Opelousas Store", open24Hours:false, location: { lat:30.535, lng: -92.070 }},
			{ name: "Alexandria Store", open24Hours:false, location: { lat:31.284, lng: -92.461 }}
			];
		
		resolve(stores);
	});
}
```

Note that each store has a name, a boolean on whether or not they're open 24 hours a day, and a location. For my first demo, I wanted a way to show and hide stores that were not open 24 hours a day. You could imagine this being on a company website and a user needing to find a store open late.

When I first Google for how to hide (and show again of course) markers, I found that there wasn't a method for that. (Not technically, you'll see more in the second approach below.) I ran across one StackOverflow answer that was helpful: <https://stackoverflow.com/a/61590840/52160>

In that answer, the user suggests making use of a "FeatureGroup" that can added and removed from a map. That seemed like a good possibility, but I felt a [LayerGroup](https://leafletjs.com/reference.html#layergroup) was better suited. The docs describe this feature as:

<blockquote>
Used to group several layers and handle them as one. If you add it to the map, any layers added or removed from the group will be added/removed on the map as well.
</blockquote>

Ok, so given that I want a simple "off/on" toggle for showing stores that are open 24 hours, here's how I built that. First, the HTML:

```html
<div id="map"></div>
<h3>Our Stores</h3>
<input type="checkbox" id="filter24"> <label for="filter24">Filter to Open 24 Hours</label>
```

Not much there, but you can see the `div` for the map and my checkbox filter. In thecode, I begin by getting my stores and initializing my map:

```js
let stores = await getStores();
let map = L.map('map', { zoomControl:false}).setView([30.216, -92.033], 7);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 16,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
```

Next, I create two LayerGroups:

```js
let open24Group = L.layerGroup();
let notOpen24Group = L.layerGroup();
```

Now I loop over my stores, and based on their properties, add them to the appropriate group:

```js
stores.forEach(s => {
	let marker = L.marker([s.location.lat, s.location.lng]);
	marker.bindPopup(`<h3>${s.name}</h3><p>Open 24 hours? ${s.open24Hours?'Yes':'No'}</p>`);
	if(s.open24Hours) open24Group.addLayer(marker);
	else notOpen24Group.addLayer(marker);
});
```

Finally, I add both groups to the map:

```js
open24Group.addTo(map);
notOpen24Group.addTo(map);
```

Alright - so now, I add an event listener to my checkbox, and add the hide/show logic:

```js
document.querySelector('#filter24').addEventListener('change', e => {
	if(e.target.checked) map.removeLayer(notOpen24Group);
	else map.addLayer(notOpen24Group);
});
```

And... that's it. Pretty simple actually. I can say that I could have gotten away without making the `open24Group` as it's never removed, but I kept it in there for now. You can try this yourself below:

<p class="codepen" data-height="700" data-theme-id="dark" data-default-tab="result" data-slug-hash="poMvzGo" data-pen-title="Leaflet - Show/Hide Markers 1" data-editable="true" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/poMvzGo">
  Leaflet - Show/Hide Markers 1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Approach Two

So, the first approach works great for *one* filter, and a boolean filter at that. But what happens if you have 2? Or more? This approach breaks down unless you start creating a heck of a lot of different groups to accommodate all the possible combinations of filters, and that's only going to work if they are all boolean filters. What if wanted a free form text field filter, perhaps on the name of the store?

I then realized that there may be an even simpler solution, at least in cases with a 'reasonable' amount of markers. While there isn't a 'hide' marker method, you can simply remove it from the map! Let's look at an example. First, my updated HTML with a name filter:

```html
<div id="map"></div>
<h3>Our Stores</h3>
<input type="checkbox" id="filter24"> <label for="filter24">Filter to Open 24 Hours</label><br>
<input type="search" id="filterName" placeholder="Filter by name">
```

My JavaScript is a bit different now obviously. I'll share the entire thing then break it down:

```js
let $filter24 = document.querySelector('#filter24');
let $filterName = document.querySelector('#filterName');

let stores = await getStores();
let map = L.map('map', { zoomControl:false}).setView([30.216, -92.033], 7);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 16,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
		
stores.forEach(s => {
	s.marker = L.marker([s.location.lat, s.location.lng]).addTo(map);
	s.marker.bindPopup(`<h3>${s.name}</h3><p>Open 24 hours? ${s.open24Hours?'Yes':'No'}</p>`);
});
		
const filter = () => {
	let filter24 = $filter24.checked;
	let term = $filterName.value.toLowerCase().trim();
	console.log(`Filter to term: ${term}, open 24 ${filter24}`);
	
	stores.forEach(s => {
		if(
				(filter24 && !s.open24Hours)
				||
				(term !== '' && s.name.toLowerCase().indexOf(term) === -1)
		) map.removeLayer(s.marker);
		else if(!map.hasLayer(s.marker)) map.addLayer(s.marker);
	});
};

$filterName.addEventListener('input', filter);
$filter24.addEventListener('change', filter);
```

I now create my markers and store them in my, um, stores. You can see that in the `forEach` loop. I then have two event listeners, one for the checkbox and one for the input field. Both run `filter` which handles the logic of looping over every store and determining if the store's marker should be removed or added back. 

This really seemed to work well, and you can test it below:

<p class="codepen" data-height="750" data-theme-id="dark" data-default-tab="result" data-slug-hash="KKOwKdp" data-pen-title="Leaflet - Show/Hide Markers 1" data-editable="true" data-user="cfjedimaster" style="height: 750px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/KKOwKdp">
  Leaflet - Show/Hide Markers 1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

As I said, this seems fine for a "reasonable" amount of markers. I'm not sure I'd use this approach with thousands of markers, but that's a consideration for another blog post probably. 