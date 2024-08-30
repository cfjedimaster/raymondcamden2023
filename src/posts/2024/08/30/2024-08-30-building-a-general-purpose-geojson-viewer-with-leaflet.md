---
layout: post
title: "Building a General Purpose GeoJSON Viewer with Leaflet"
date: "2024-08-30T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_globe.jpg
permalink: /2024/08/30/building-a-general-purpose-geojson-viewer-with-leaflet
description: How to use Leaflet to view any GeoJSON file.
---

Last week I shared my [initial experiences](https://www.raymondcamden.com/2024/08/23/mapping-with-leaflet) with [Leaflet](https://leafletjs.com/) and I thought I'd share a small demo I built with it - a general purpose GeoJSON viewer.

## GeoJSON and Leaflet

As I mentioned at the end of my last post, GeoJSON is a [specification](https://geojson.org/) for encoding ad hoc geographic data. Here's an example:

```json
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "id": 0,
            "properties": {
                "Code": "FRLA",
                "Name": "Frederick Law Olmsted National Historic Site"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -71.13112956925647,
                    42.32550867371509
                ]
            }
        },
        {
            "type": "Feature",
            "id": 1,
            "properties": {
                "Code": "GLDE",
                "Name": "Gloria Dei Church National Historic Site"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -75.14358360598474,
                    39.93437740957208
                ]
            }
        },
	]
}
```

GeoJSON can encode points, lines, polygons, and more, and support a `properties` section that can have anything in it. Leaflet makes it easy to use GeoJSON. Here's the example I used in that last post:

```js
let dataReq = await fetch('https://assets.codepen.io/74045/national-parks.geojson');
let data = await dataReq.json();

L.geoJSON(data).bindPopup(function (layer) {
		return layer.feature.properties.Name;
}).addTo(map);
```

That's literally it. Given how easy this, I thought I'd build a demo where the data was provided by the user.

## The Application

My application is built with simple vanilla JavaScript, no Alpine even, and lets you drop a file into the browser to load the information. 

<p>
<img src="https://static.raymondcamden.com/images/2024/08/leaflet.jpg" alt="The Leaflet demo" class="imgborder imgcenter" loading="lazy">
</p>

My code waits for `DOMContentLoaded` and then registers event handlers for dragdrop support:

```js
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', handleDrop);
```

When you drop a file, I then use a bit of code to read it in. 

```js
function handleDrop(e) {
		e.preventDefault();
		let droppedFiles = e.dataTransfer.files;
		if(!droppedFiles) return;
		let myFile = droppedFiles[0];
		let ext = myFile.name.split('.').pop();
		if(ext !== 'geojson') {
			alert('Drag/drop a .geojson file only.');
			return;
		}
		
		let reader = new FileReader();
		reader.onload = e => {
			loadGeoJSON(JSON.parse(e.target.result));
		};
		
		updateStatus('Reading .geojson');
		reader.readAsText(myFile);	
}
```

The `loadGeoJSON` function handles adding the data to Leaflet:

```js
async function loadGeoJSON(data) {
	updateStatus(`.geojson loaded with ${data.features.length} features. Adding to map now.`);

	L.geoJSON(data, {
	}).bindPopup(function (layer) {
			return `
			<p>
			<b>Properties:</b><br>
			<pre style='white-space:pre-wrap'><code>
${JSON.stringify(layer.feature.properties,null,'  ')}
			</code></pre>
			</p>
			`;
	},{minWidth:450}).addTo(map);

}
```

This is pretty much the same code as before, except that my popup uses a basic dump (`stringify`) of the `properties` key. Note that this will *not* work for all files, especially if there's a lot of data there. I could get fancier with my output there and perhaps add a max height with overflow. That being said, here is how it looks after adding America's parks to it (and clicking one feature):

<p>
<img src="https://static.raymondcamden.com/images/2024/08/leaflet2.jpg" alt="The Leaflet demo - with data" class="imgborder imgcenter" loading="lazy">
</p>

You can test it out here (full screen): <https://codepen.io/cfjedimaster/full/GRbxVVR>

And here's the full code:

<p class="codepen" data-height="600" data-default-tab="result" data-slug-hash="GRbxVVR" data-pen-title="Leaflet geojson viewer (v2)" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/GRbxVVR">
  Leaflet geojson viewer (v2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<p>


