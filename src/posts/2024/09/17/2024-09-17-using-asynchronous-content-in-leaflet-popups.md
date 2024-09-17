---
layout: post
title: "Using Asynchronous Content in Leaflet Popups"
date: "2024-09-17T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_map_layered_paper.jpg
permalink: /2024/09/17/using-asynchronous-content-in-leaflet-popups
description: Supporting asynchronous content in Leaflet Popups!
---

Today in my [`<Code><Br>`](https://cfe.dev/talkshow/code-break/) stream (I'll share a link to the video at the bottom), I spent some time digging into [Leaflet](https://leafletjs.com/) and worked on a demo that made use of the National Parks Service [API](https://www.nps.gov/subjects/developer/api-documentation.htm). This is a fun API I've used many times in the past, especially at my last job at HERE. For the stream today, I wanted to build the following:

* Create a map that loads a geojson file of NPS parks. The geojson file contains the code and name for each park. 
* On clicking one of the markers, use the NPS API to get more information about the park.

In general, I've found everything in Leaflet to be stupid easy, but this particular aspect turned out to be a bit more difficult, which of course made for a fun stream. I got it working, but I want folks to know I'm not 100% convinced that the solution shown here is the best. As always, if you've got a better idea, I'd love to hear more and you can leave me a comment below. Ok, let's get started.

## The First Approach

Let me begin by showing the code that handled the geojson initially:

```js
let geoReq = await fetch('./national-parks.geojson');
let geo = await geoReq.json();

map = L.map('map').setView([37.09024, -95.712891], 3);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);	

L.geoJSON(geo).addTo(map);
```

Basically, load my geojson from the server, parse it, and after the Leaflet map is initialized, you can add it with the `geoJSON` method. I freaking *love* how simple that is. 

The first change I made was to bind a popup to the layer:

```js
L.geoJSON(geo).bindPopup(function (layer) {
	return layer.feature.properties.Name;
}).addTo(map);
```

In this case, the function I wrote there is called every time you click and will return the `Name` value from the properties. As I said above, only the code and name are available, but we're going to fix that with a quick API call. 

From the NPS docs, you can retrieve park information with one quick call:

```js
async function getParkData(code) {
	let r = await fetch(`https://developer.nps.gov/api/v1/parks?parkCode=${code}&api_key=KTGT4KgP0kgO8pO1U1rtHdHHrcubYua2CruhHzpy`);
	return (await r.json()).data[0];
}
```

The API returns an array of results in the `data` key and since I know I'll always be getting one, it's trivial to return just the park info. With that function written, I then turned to incorporating it into the popup.

I first tried something like this - and to be clear, I didn't check the docs so I fully didn't *expect* this to work:

```js
L.geoJSON(geo).bindPopup(async function (layer) {
	let data = await getParkData(layer.feature.properties.Code);
	return layer.feature.properties.Name + `<p>${data.description}</p>`;
}).addTo(map);
```

On clicking, I got an error, so it was clear that Leaflet expected a synchronous response from the function.

## The Second Approach

So, at this point, I actually did check the docs, and nothing really seemed helpful. I googled around and found this on Stackoverflow: [Unable to successfully bind an async function to a Leaflet marker popup](https://gis.stackexchange.com/questions/421196/unable-to-successfully-bind-an-async-function-to-a-leaflet-marker-popup)

The answer shared there shows returning a DOM element in the `bindPopup` function that gets updated later in code. Here's their solution:

```js
marker.bindPopup(() => {
    const el = document.createElement('div');
    let html = `<h4>${r.title}</h4>`;

    const getData = async (url) => {
        const response = await fetch(url);
        if (response.ok) {
            const json = await response.json();
            html += `<p>${JSON.stringify(json)}</p>`;
            el.innerHTML = html;
        }
    };

    getData(`server/foo?id=${r.id}`);
    return el;
});
```

That seemed... like a possible solution. So I gave it a shot:

```js
	L.geoJSON(geo).bindPopup(function (layer) {

		const el = document.createElement('div');
		let html = `<h4>${layer.feature.properties.Name}</h4>`

		getParkData(layer.feature.properties.Code).then(r => {
			console.log('got crap back', r);
			html += `<p>${r.description}</p>`;
			html += `<p><img src="${r.images[0].url}" width="250"></p>`;
			el.innerHTML = html;
		});

		return el;
	}, { minWidth: 500 }).addTo(map);

}
```

Remember that `getParkData` is the wrapper around the NPS API. I didn't use `await` on the call as I needed to return the DOM element as shown above and just update it later. 

This... actually worked well. I was concerned however about race conditions. What happens if you click one marker and then quickly click another. As far as I can tell... it just works. Either Leaflet 'kills' the DOM element for the first marker so the later code does nothing, or it 'works' but as the popup is hidden, it doesn't impact the *current* popup.

As I said... I'm rather unsure about this, but it seems to work well. The code may be found [here](https://github.com/cfjedimaster/codebr/blob/main/leaflet/nps.html), and you try it yourself here: <https://cfjedimaster.github.io/codebr/leaflet/nps.html>

I think there's still improvements that could be made here. For one, caching the calls to the API in browser storage for example. The NPS API responds quickly, but I do know last week it was running a bit slower. Some quick `sessionStorage` caching would really help. Also, the popup shows up small and blank. I could possibly setup the park name initially and show some "loading..." type messages while it works. 

That being said... any thoughts? I really think that there's possibly a better way and I'd love to see it if so!