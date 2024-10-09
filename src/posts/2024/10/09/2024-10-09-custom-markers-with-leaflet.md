---
layout: post
title: "Custom Markers with Leaflet"
date: "2024-10-09T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/map_markers.jpg
permalink: /2024/10/09/custom-markers-with-leaflet
description: How to modify the default marker in Leaflet
---

As I continue to dig into [Leaflet](https://leafletjs.com), I was recently asked about custom markers based on data, so for example, some locations for a store may use one icon while others use another. I did some digging, and while it turns out Leaflet has deep support for customizing markers, it does take a little bit of work. Here's what I found.

First off, this is the default marker:

<p>
<img src="https://static.raymondcamden.com/images/2024/10/m1.jpg" alt="Blue marker on a map" class="imgborder imgcenter" loading="lazy">
</p>

Out of the box, this is it. Period. I can appreciate the library wanting to keep it's size to a minimum, but I was a bit surprised. That being said, the library provides really flexible support for creating your own markers. The first thing I found was the tutorial, [Markers With Custom Icons](https://leafletjs.com/examples/custom-icons/). In this tutorial, they describe the process of creating an instance of the `icon` class and specifying resources for the icon and shadow. Technically, this looked incredibly simple, and again, flexible, but the immediate issue I ran into was... ok, where do I find more icons?

I did some more digging, and came across this open source project, [leaflet-color-markers](https://github.com/pointhi/leaflet-color-markers), which provide a set of markers in the same style as the original, but in a variety of colors. Their read.me demonstrates the usage like so:

```js
var greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.marker([51.5, -0.09], {icon: greenIcon}).addTo(map);
```

Now... I'm hesitant to suggest making use of `raw.githubusercontent.com`, as I've always heard that it wasn't meant to be used in production applications. That being said, for today I will, and keep in mind that you can take the asset (for example, `marker-icon-2x-green.png`) and download it to your website. 

I tested this myself and it worked fine, but I wanted the smaller size icons, not the one demonstrated above. I simply copied the URL (`https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png`), but then the four size/anchor properties stopped working well. 

That made sense - I mean, I had a different size icon, and my first thought was, well, I'll just keep tweaking numbers till I get it right, but then I went back to the Leaflet docs, specifically for [Icon](https://leafletjs.com/reference.html#icon-default), and noticed this part:

<blockquote>
In order to customize the default icon, just change the properties of L.Icon.Default.prototype.options (which is a set of Icon options).
</blockquote>

On a whim, I simply entered `L.Icon.Default.prototype.options` in my console, and got the following:

```json
{
  "iconUrl": "marker-icon.png",
  "iconRetinaUrl": "marker-icon-2x.png",
  "shadowUrl": "marker-shadow.png",
  "iconSize": [
    25,
    41
  ],
  "iconAnchor": [
    12,
    41
  ],
  "popupAnchor": [
    1,
    -34
  ],
  "tooltipAnchor": [
    16,
    -28
  ],
  "shadowSize": [
    41,
    41
  ]
}
```

Woot. So with these defaults, I was able to figure out how to combine that project's custom colors with the 'regular' size markers and set the right values. 

I'm not quite done yet. One more cool aspect of the [Leaflet tutorial on custom markers](https://leafletjs.com/examples/custom-icons/) was how they demonstrated that you could define your own custom icon class, and then make new instances with only slight tweaks. This is taken right from their tutorial:

```js
var LeafIcon = L.Icon.extend({
    options: {
        shadowUrl: 'leaf-shadow.png',
        iconSize:     [38, 95],
        shadowSize:   [50, 64],
        iconAnchor:   [22, 94],
        shadowAnchor: [4, 62],
        popupAnchor:  [-3, -76]
    }
});


var greenIcon = new LeafIcon({iconUrl: 'leaf-green.png'}),
    redIcon = new LeafIcon({iconUrl: 'leaf-red.png'}),
    orangeIcon = new LeafIcon({iconUrl: 'leaf-orange.png'});
```

I took this approach, and merged it with the icons from the GitHub project, and came up with this snippet:

```js
let ColorIcon =  L.Icon.extend({
	options: {
		shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
		iconSize:     [25, 41],
		shadowSize:   [41, 41],
		iconAnchor:   [12, 41],
		popupAnchor:  [1, -34]
	}
});

let greenIcon = new ColorIcon({iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png'});

let redIcon = new ColorIcon({iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'});
```

And here is an example using it:

```js
L.marker([30.471165, -91.147385], 
	{icon: greenIcon}).addTo(map).bindPopup("Baton Rouge");
```

This was all maybe twenty or so minutes of digging, so not too bad at all. Here's a complete CodePen:

<p class="codepen" data-height="700" data-theme-id="dark" data-default-tab="result" data-slug-hash="wvVoMWP" data-pen-title="Leaflet with Custom Icons" data-editable="true" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/wvVoMWP">
  Leaflet with Custom Icons</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## A Sample Application 

Let's demonstrate this with a (kinda) real world scenario. For the next map, I'll call a function that returns a list of stores and whether or not they are currently open:

```js
async function getStores() {
	return [
		{ lat: 30.1, lng: -92.09, desc: '<b>Store One</b><br>Open 9-5 M-F', open:true },
		{ lat: 30.3, lng: -92.06, desc: '<b>Store Two</b><br>Open 9-5 M-F', open: true },
		{ lat: 30.1, lng: -91.8, desc: '<b>Store Three</b><br>Open 9-1 M-F', open:false }
		];
}
```

And with the same custom markers I demonstrated above, I'll use them like so:

```js
let stores = await getStores();
for(let store of stores) {
	let marker = greenIcon;
	if(!store.open) marker = redIcon;
	 L.marker([store.lat, store.lng], {icon:marker}).addTo(map).bindPopup(store.desc);
}
```

Fairly simple, and you could imagine multiple different icons in play based on the data for your locations. Here's the demo:

<p class="codepen" data-height="700" data-theme-id="dark" data-default-tab="result" data-slug-hash="vYoyKoL" data-pen-title="Leaflet with Custom Icons" data-editable="true" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/vYoyKoL">
  Leaflet with Custom Icons</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

I think I said this in a previous post, but I love how easy Leaflet is, and when I do run into something that isn't *quite* as easy, I feel like it always provides a way to get to what I need. That's a sign of a good library!
