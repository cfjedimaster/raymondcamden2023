---
layout: post
title: "Mapping with Leaflet"
date: "2024-08-23T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_map.jpg
permalink: /2024/08/23/mapping-with-leaflet
description: 
---

If you missed my [`<Code><Br>`](https://cfe.dev/talkshow/code-break/) episode earlier this week you missed (imo) a great episode. I'll share a link to the video at the end, but I spent the session raving about how great the [Leaflet](https://leafletjs.com/) JavaScript library is for maps. I had it on my list to look into for a few months now and while having a layover recently I took the time to dig into it. I was - blown away.

I've got a lot of experience over the years working with maps on the web. I really dig Google Maps, both the JavaScript library and APIs, and I spent some time as a developer evangelist for [HERE](https://here.com) helping others learn about their offerings. I'm obviously a bit biased but I really dug their offerings as well. 

That being said, I was incredibly impressed with just how simple Leaflet is. Their [quickl start](https://leafletjs.com/examples/quick-start/) has you up and running within minutes. As I played with it and wondered, "how do I do X", every time I googled I found an answer and typically - it was pretty trivial. 

I don't want this post to be a rehash of their [guide](https://leafletjs.com/examples/quick-start/), you really should check it out, but I thought I'd show a few quick samples just to give you an idea of the level of effort required to work with the library.

Now before I get started, let me point out that Leaflet is "just" the top level framework for working with map data. You have to bring in your own tiles. Their quick start demonstrates this. Also, you won't find features like routing, geocoding or reverse geocoding, and so forth. You could absolutely mix in those APIs from other providers of course, but if you ended up using Google Maps or HERE, I'd probably just suggest using their front-end code as well. The point is, you've got options. 

With that being said, let's consider a few examples.

## Store Maps

For a few example, a real world use case could be plotting stores on a map for a company. Those stores could come from a database/backend API/etc, but honestly, if you are a small company with a few locations, you can just hard code em. In a few months or years when you open a new store, first off, congrats, and secondly, you can just add one more line of code.

Leaflet requires one JavaScript and CSS resource:

```html
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
```

HTML wise, like other mapping solutions, you provide a div and simple css:

```html
<div id="map"></div>

<style>
#map {
	height: 600px;
	width: 600px;
}
</style>
```

Now for the JavaScript. We need to center logically, in this case the region where our stores are:

```js
let map = L.map('map').setView([30.216, -92.033], 13);
```

Then add our tiles, ie the actual map:

```js
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
```

Now let's add 3 markers for stores:

```js
let marker = L.marker([30.1, -92.09]).addTo(map);
marker = L.marker([30.3, -92.06]).addTo(map);
marker = L.marker([30.1, -91.8]).addTo(map);
```

And how about some info about each store?

```js
let marker = L.marker([30.1, -92.09]).addTo(map);
marker.bindPopup('<b>Store One</b><br>Open 9-5 M-F');

marker = L.marker([30.3, -92.06]).addTo(map);
marker.bindPopup('<b>Store Two</b><br>Open 9-5 M-F');

marker = L.marker([30.1, -91.8]).addTo(map);
marker.bindPopup('<b>Store Three</b><br>Open 9-1 M-F');
```

And that's literally it. You can see it below:

<p class="codepen" data-height="700" data-theme-id="dark" data-default-tab="result" data-slug-hash="MWMGrrj" data-pen-title="Leaflet1" data-editable="true" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/MWMGrrj">
  Leaflet1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Store Maps - But an API

Real developers know that hard coding stuff is lame-sauce, and if you are a 10X Unicorn, you would quickly build up a serverless function backed by a database to put those stores in a persistence system that could power the universe. 

Let's pretend we built an API:

```js
async function getStores() {
	return [
		{ lat: 30.1, lng: -92.09, desc: '<b>Store One</b><br>Open 9-5 M-F' },
		{ lat: 30.3, lng: -92.06, desc: '<b>Store Two</b><br>Open 9-5 M-F' },
		{ lat: 30.1, lng: -91.8, desc: '<b>Store Three</b><br>Open 9-1 M-F' }
		];
}
```

And now our code becomes:

```js
let map = L.map('map').setView([30.216, -92.033], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 10,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let stores = await getStores();

stores.forEach(s => {
	let marker = L.marker([s.lat, s.lng]).addTo(map);
	marker.bindPopup(s.desc);
});
```

You can see this below. It looks the same, but I get to charge Senior Developer rates.

<p class="codepen" data-height="700" data-theme-id="dark" data-default-tab="result" data-slug-hash="xxojpWp" data-pen-title="Leaflet Blog 1" data-editable="true" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/xxojpWp">
  Leaflet Blog 1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## GeoJSON

One of the things I enjoyed most about my time at HERE was discovering [GeoJSON](https://geojson.org/). GeoJSON is a JSON style that supports ad hoc mapping data. It's incredibly flexible and used in many applications. I grabbed a copy of America's national parks as a GeoJSON file and this is how easy it is to use in Leaflet:

```js
let dataReq = await fetch('https://assets.codepen.io/74045/national-parks.geojson');
let data = await dataReq.json();

L.geoJSON(data).bindPopup(function (layer) {
		return layer.feature.properties.Name;
}).addTo(map);
```

Simple, right? You can see this below. Clicking on a marker will show you the park's name:

<p class="codepen" data-height="700" data-theme-id="dark" data-default-tab="result" data-slug-hash="zYVjpaE" data-pen-title="Leaflet Blog 2" data-editable="true" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/zYVjpaE">
  Leaflet Blog 2</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Watch Me Build Maps...

So, if you want to see more, check out my CodeBr episode below. I plan on covering this more in my next session, and I've got a few more blog posts planned as well. If you've built things with Leaflet, please let me know and write a comment below.

{% liteyoutube "uRUqzNjS454" %}
