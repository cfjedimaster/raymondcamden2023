---
layout: post
title: "Using Geocoding with Leaflet"
date: "2024-10-04T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_sleeping_map.jpg
permalink: /2024/10/04/using-geocoding-with-leaflet
description: Using a third party geocoding API with Leafleft.
---

When I first started talking about [Leaftlet](https://leafletjs.com), I mentioned how it was "only" a map library, and by that I mean, only able to present a view/wrapper around tiles representing map data. There's a heck of a lot of services that Google Maps, HERE, and so forth, add on top that won't be present, things like routing, geocoding, and more. Considering the fact that Leaflet is, again, "only" a client-side JavaScript library, that's just a fact of life. But I've been thinking about how I could integrate Leaflet with such services, and I thought I'd share a demo of just that - adding geocoding to Leaflet.

## WTF is Geocoding?

Simply put, geocoding is converting an address in text to a precise location. So for example, a city like "Seattle, Washington" can be geocoding to latitude 47.61 and longitude -122.33. A location like "3901 Johnston St, Lafayette, LA 70503" (a local restaurant that is amazing) can be geocoded to 30.198, -92.055. 

Reverse geocoding lets you supply a latitude and longitude and the API will tell you what's there. So for example, 38.9002898,-76.9990361 map to 508 H St NE, Washington, DC 20002.

## Do you need this?

Before considering even adding geocoding to a client-side application, ask yourself if you really need it. In a few of my Leaflet demos, I've used the example of stores for a business. If your business had 5, 10, heck, 50 locations, most likely that's a pretty static set of locations not changing often. Open up your browser, go to any number of geocoding websites, enter each one by one and copy and paste the results into a database, local file, or parchment. There's no need for every visitor to your web site to hit some third party API to locate a store that's the exact same location for every other visitor to your site.

Ok, but what if you have five thousand? In that case, consider automating it, but do it locally. Write a script that goes through your data, geolocates based on an address, and then stores it.

Now, in that use case, you will want to check the usage rules for your API provider. Some prevent this and that's kind of sad imo. 

But the main takeaway from this is before you even consider using my code below, ensure you actually *need* to first. 

I can't believe I'm being practical. On my blog. I should check my temperature perhaps. 

## Geocoding via API

In preperation for this post, I did research, and by research I googled for "geocoding API", because I was specifically looking for something outside of Google and HERE. I found a pretty good one, [geocodio](https://www.geocod.io/). It's got some great pluses, with only one minus. On the plus side:

* Great free tier, with no need to add a credit card unless you want to do batch processing.
* A simple API, one of the friendliest I've seen. (And I'll share an example below.)
* The ability to IP lock your key for additional safety.
* You are "legally" allowed to save the results of geocoding. See what I mentioned above about some services preventing you from doing that.

On the minus side however...

* They only geocode in the US and Canada, although they can reverse geocode in Mexico.

That's pretty signficant, but if you know you're working in that area, I have to say all the plusses really make this a great service. Their free tier supports 2,500 lookups a day, which is pretty high. Also, when I first ran into this limitation, I had missed it in the docs and reached out for support. They got back to me within an hour, which is always a good sign.

Their [geocoding](https://www.geocod.io/docs/#geocoding) API (and they include reverse and batching as well) supports a number of options both how to search and how to handle the results. As a basic example, this will attempt to geocode my city:

https://api.geocod.io/v1.7/geocode?q=Lafayette+Louisiana&api_key=YOUR_API_KEY

This returns:

```js
{
    "input": {
        "address_components": {
            "city": "Lafayette",
            "state": "LA",
            "country": "US"
        },
        "formatted_address": "Lafayette, LA"
    },
    "results": [
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70501",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70501",
            "location": {
                "lat": 30.24171,
                "lng": -91.991044
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70502",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70502",
            "location": {
                "lat": 30.319799,
                "lng": -92.026969
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70503",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70503",
            "location": {
                "lat": 30.163949,
                "lng": -92.055824
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70504",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70504",
            "location": {
                "lat": 30.21385,
                "lng": -92.01866
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70505",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70505",
            "location": {
                "lat": 30.202251,
                "lng": -92.01877
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70506",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70506",
            "location": {
                "lat": 30.195474,
                "lng": -92.081292
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70507",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70507",
            "location": {
                "lat": 30.2528,
                "lng": -92.038679
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70508",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70508",
            "location": {
                "lat": 30.181866,
                "lng": -92.026859
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70509",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70509",
            "location": {
                "lat": 30.156506,
                "lng": -92.000019
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70598",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70598",
            "location": {
                "lat": 30.20812,
                "lng": -92.095109
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70593",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70593",
            "location": {
                "lat": 30.20812,
                "lng": -92.095109
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        },
        {
            "address_components": {
                "city": "Lafayette",
                "county": "Lafayette Parish",
                "state": "LA",
                "zip": "70596",
                "country": "US"
            },
            "formatted_address": "Lafayette, LA 70596",
            "location": {
                "lat": 30.20812,
                "lng": -92.095109
            },
            "accuracy": 1,
            "accuracy_type": "place",
            "source": "TIGER/Line® dataset from the US Census Bureau"
        }
    ]
}
```

That's quite a bit, and you can both limit the number of results as request even *more* [fields](https://www.geocod.io/docs/#fields) like congressional and school districts. Check out that doc I linked to in the previous sentence as it's quite extensive. 

But what I really like is that it supports a `format` attribute that takes one value, `simple`. 

https://api.geocod.io/v1.7/geocode?q=Lafayette+Louisiana&format=simple&api_key=YOUR_API_KEY

This returns:

```js
{
    "address": "Lafayette, LA 70501",
    "lat": 30.24171,
    "lng": -91.991044,
    "accuracy": 1,
    "accuracy_type": "place",
    "source": "TIGER/Line® dataset from the US Census Bureau"
}
```

That's... excellent! Let's use that!

## Leaflet and Geocoding

I whipped up a super quick Leaflet demo that while probably isn't terribly realistic, shows the integration of geocoding with maps. For my demo, I simply used a text field you can enter an address into. Beneath it is the HTML for the map.

```html
<input type="search" id="address" placeholder="Address">
<div id="map"></div>
```

Now for the code. First, the map, centered on the US:

```js
let map = L.map('map').setView([39.8097343, -98.5556199], 4);
let marker;

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
```

Next, recognizing changes to the search field and kicking off a geocode request:

```js
document.querySelector('#address').addEventListener('change', geocode, false);

async function geocode(e) {
	let address = e.target.value.trim();
	if(address === '') return;
	console.log(`Geocode ${address}`);
	
	let req = await fetch(`https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(address)}&format=simple&api_key=${KEY}`);
	let resp = await req.json();
	
	if(resp.error) {
		alert(resp.error);	
	}
	
	if(resp.lat && resp.lng) {
		if(marker) map.removeLayer(marker);
		marker = L.marker([resp.lat, resp.lng]).addTo(map);
		marker.bindPopup(`Geocoded to ${resp.lat},${resp.lng}`);
		centerLeafletMapOnMarker(map, marker);
	}
	
	console.log(resp);
}
```

Note that this handles removing a previous marker, and then adding a new one for the result. The last bit is a nice little function I found on a [blog post](https://jeffreymorgan.io/articles/how-to-center-a-leaflet-map-on-a-marker/) that moves and centers on the marker:

```js
// Credit - https://jeffreymorgan.io/articles/how-to-center-a-leaflet-map-on-a-marker/
function centerLeafletMapOnMarker(map, marker) {
  var latLngs = [ marker.getLatLng() ];
  var markerBounds = L.latLngBounds(latLngs);
  map.flyToBounds(markerBounds, { maxZoom: 6});
}
```

I've not seen those APIs before, but it immediately made sense. I modified the code a bit from what the blog showed to add the 'fly' effect. 

And that's it. You can play with the demo below. 

<p class="codepen" data-height="750" data-theme-id="dark" data-default-tab="result" data-slug-hash="MWNyxxd" data-pen-title="Leaflet Blog 1" data-editable="true" data-user="cfjedimaster" style="height: 750px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/MWNyxxd">
  Leaflet Blog 1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>