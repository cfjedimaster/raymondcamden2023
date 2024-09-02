---
layout: post
title: "Using CSV Data with Leaflet"
date: "2024-09-02T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_pirate_shipwreck.jpg
permalink: /2024/09/02/using-csv-data-with-leaflet
description: A look at using geographic data encoded in CSV with Leaflet
---

As I continue to play with, and really freaking enjoy [Leaflet](https://leafletjs.com/), I thought it would be interesting to show a demo of using CSV data with it. This also coincides with an interesting dataset I got from the [Data is Plural](https://www.data-is-plural.com/) newsletter, a collection of datasets covering just about any topic you can imagine. 

A few weeks back, they shared [ancient shipwrecks](https://docs.google.com/spreadsheets/d/11fk5YeQ4eFOnYSBNpUdHp4TP42gJ7wY5/edit?gid=970169931#gid=970169931) covering the years from 1500 BC to 1500 AD. I know, that's a bit random, but I thought it was kinda cool. The dataset covers near two thousand unique shipwrecks and includes information, at times, about the cargo that was being carried. I thought this would be fun to map, and here's how I did it.

## Working with CVS

Disregarding the map, the first thing I needed to do was parse the CSV. I turned to a solution I've used many times in the past, [Papa Parse](https://www.papaparse.com/). Papa Parse is a JavaScript library for - wait for it - parsing CSV files. It's worked perfectly for me in the past, and did so mostly this time, with one small issue. 

I wrote a function to handle parsing my data so I could use it with Leaflet. I began with this:

```js
async function getData() {
	return new Promise((resolve, reject) => {
		Papa.parse('https://assets.codepen.io/74045/shipwrecks2.csv', {
			download:true,
			header:true,
			complete:(results) => {				
				resolve(results.data);
			}
		});
	});
}
```

From the top, I provide the URL (hosted as an asset on CodePen), and specify the following arguments:

* `download:true` - this is how you tell Papa Parse that the first argument is a URL to be fetched
* `header:true` - this tells Papa Parse to consider the first row as headers and to map the results to use those names
  
The final argument simply lets me make use of my Promise so I can make this an async function. 

This worked... kinda. It failed to properly parse because our data has a line *before* the header line. Here's the first five lines:

```
,,,,HARVARD MAPS/DARMC DATA,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,OXREP DATA,,,,,,,,,,,,,,,,,,,,,,,,,
,DARMC_X,DARMC_Y,DARMC_OBJECTID,NAME,NAME2,Latitude,Longitude,Geo_Q,F2008_Wreck,F2010_Wreck,Geo_D,Start_Date,End_Date,Date_Q,Date_D,Depth,Depth_Q,Year_Found,Year_Found_1,Cargo_1,Cargo_Type1,Cargo_2,Cargo_Type2,Cargo_3,Cargo_Type_3,Other_Cargo,Gear,Estimated displacement,Comments,Length,Width,Size_Detail,Parker_ref,Parker?,Bibliography AFM State 2008,Bibliography_2,OXREP_locid,OXREP_Site_Name,OXREP_Wreck_Name,OXREP_Earliest_Date,OXREP_Latest_Date,OXREP_Dating_comment,OXREP_Wreck_ID,OXREP_Strauss_ID,OXREP_Parker_Number,OXREP_Sea_area,OXREP_Country,OXREP_Region,OXREP_Min_depth,OXREP_Max_depth,OXREP_Depth,OXREP_Period,OXREP_Reference,OXREP_Comments,OXREP_Stone_cargo_notes,OXREP_Other_cargo,OXREP_Hull_remains,OXREP_Shipboard_paraphernalia,OXREP_Ship_equipment,OXREP_Estimated_tonnage,,
33,-316258.6733,6959356.392,34,Ellesmere, ,52.872,-2.841,ca,0,0, ,-500,500, , , ,silted,1864, , ,, ,, , , ,Paddle & bowl found with the boat.,0.412,,3.35,0.73, , ,0,,S. McGrail 1978.,,,,,,,,,,,,,,,,,,,,,,,,,,
912,1805231.076,5322124.705,913,Krava, ,43.066667,16.216667, ,416,430, ,-400,-200, , , , , , ,amphoras,"Dr2-4, pear-shaped", ,, , , ,, ,,0,0, ,558,1,, ,1921,Krava,Krava,-400,-200,C4th-3rd BC,7970,,558,Adriatic,Croatia,Vis,,,,Classical/Hellenistic,"N. Cambi in Amphores Romains et Histoire Economique, Dix Ans de Rechereches (Siena, 1986) 1989, 323-5; M . Jurisic in D. Davison, V. Gaffney and E. Martin (eds.) BAR 2006, 175-192",The earliest known wreck in the Adriatic,,Grindstones and handmills,,,,,,
738,1421178.833,4602997.051,739,San Vito, ,38.166667,12.766667, ,809,847, ,-400,500,?, , , , , ,amphoras,, ,, , , ,, ,,0,0, ,1025,1,, ,1413,San Vito,San Vito,-400,400,,8405,,1025,,,,,,,,,,,,,,,,,
```

Sigh. So, the easiest solution (and honestly the one I did first) would be to just edit the file and remove that first line. But I was really curious to see if Papa Parse had another way of handling this. Maybe my CSV isn't a flat file per se but the result of an API call. I could still "edit" in JavaScript, but as I said, I was curious to see if the library could handle it.

Turns out - it could. But it couldn't. What do I mean? Papa Parse documents a configuration option, `skipFirstNLines`, which seems perfect. I tried that... and nothing changed. I did some Googling and turns out, it's a [bug](https://github.com/mholt/PapaParse/issues/1040). 

Sigh (again). Luckily, in the bug report there was a simple workaround using the `beforeFirstChunk` option. I used that fix below:

```js
async function getData() {
	return new Promise((resolve, reject) => {
		// hack for skipFirstNLines: https://github.com/mholt/PapaParse/issues/1040
		Papa.parse('https://assets.codepen.io/74045/shipwrecks2.csv', {
			download:true,
			header:true,
			beforeFirstChunk: chunk => [...chunk.split('\n').slice(1)].join('\n'),
			complete:(results) => {				
				resolve(results.data);
				}
			});
	});
}
```

Hopefully the library corrects this soon. I don't see a PR for it yet, so we'll see. That being said, I now have a generic function to translate my CSV into data.

## Using Custom Data with Leaflet

On the Leaflet side, the work here was trivial. Given a latitude and longitude, and some information for a label, here's a generic bit of code that will add a marker:

```js
L.marker([
		latitude, longitude
]).addTo(map).bindPopup(`
Custom stuff here for the marker.		
`);
```

That's literally it. Given how easy it is, here's the complete application:

```js
let data = await getData();

let map = L.map('map').setView([48.864, 2.349], 4);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 16,
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

for(let i=0; i<data.length;i++) {
	
	let cargo = [];
	if(data[i].Cargo_1.trim() !== '') cargo.push(data[i].Cargo_1);
	if(data[i].Cargo_2.trim() !== '') cargo.push(data[i].Cargo_2);
	if(data[i].Cargo_3.trim() !== '') cargo.push(data[i].Cargo_3);
	
	L.marker([
			parseInt(data[i]["Latitude"],10), parseInt(data[i]["Longitude"],10)
	]).addTo(map).bindPopup(`
<h3>${data[i].NAME}</h3>
<p>
<b>Found in:</b> ${data[i].Year_Found}<br>
<b>Cargo:</b> ${cargo.join(', ')}<br>
	`);

}
```

I create my map (centered on Europe), add my tiles, and then simply loop through my CSV data. There's a *lot* of columns, but I decided to show the name and a list of cargo. Not every item has a name, or any cargo, but for those that do I'll be able to show it. 

You can play with the demo below:

<p class="codepen" data-height="600" data-default-tab="result" data-slug-hash="MWMPryq" data-pen-title="Leaflet3" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/MWMPryq">
  Leaflet3</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Some Thoughts

Now, it's fair to say that the data behind this map will *not* change often. I may fetch a copy of the CSV once a month or so. I think in "the real world", I'd write code to parse the CSV in some simple local Node script and store the data as a JSON string. I'd then store *that* results in CodePen (or my website) and reduce the amount of work the application has to do to render the items. Also, I'd have the opportunity to drop all those columns I'm not actually using. That would make the JSON a heck of a lot smaller, again improving the performance. 

If this exercise is something folks would like to see, just ask and I'll share!