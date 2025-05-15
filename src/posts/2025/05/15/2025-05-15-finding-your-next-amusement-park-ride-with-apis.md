---
layout: post
title: "Finding Your Next Amusement Park Ride with APIs"
date: "2025-05-15T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_coaster1a.jpg
permalink: /2025/05/15/finding-your-next-amusement-park-ride-with-apis
description: How I built a 'what ride is available first' app with APIs.
---

Every now and then I'll wonder if something or another has an API, google for it, and be pleasantly surprised to find that there is indeed an API available. This week that random thought was about ride waiting times for amusement parks. To be fair, it wasn't completely random. I saw an ad on Facebook for a little display you can get for your home that shows live wait times. Obviously that's targetted for amusement park <s>freaks</s>fans but it's a cute idea and something I'd consider. I've only recently become a Disney fan (you don't want to know how much I freak out at Galaxy's Edge) so I get the attraction.

In this case, my googling landed me on [Queue Times](https://queue-times.com/en-US), a website which provides wait times and a whole lot more for amusement parks around the world. Best of all, they've got a [free API](https://queue-times.com/en-US/pages/api) that's easy to use and doesn't require any kind of authentication. This got me thinking about what could be built with these APIs and what I'd like to see if I was at a park. I came up with not one, but two interesting ideas, and today I'm going to share the first.

## The Ride Sort App

My first idea was rather simple. A web application that lets you pick a park and then fetch the rides. It would then show you all the rides that are a) open and b) sorted by the shortest wait time. So if you are at the park and not sure where to go next, this would give you ideas. To be clear, parks have apps, Disney for sure, and this information is available there too, but I thought having a web page that was super clear and focused, and sorted, could be really useful. 

As a quick aside, I an referring to 'rides', but the API returns more than roller coasters. It's really returning all the attractions but I'm fine keeping it named 'Ride Sort' for now. 

For the application, I decided on Alpine.js of course, but for the UI, I used Google Gemini within Visual Studio Code to create my design. My initial prompt was:

```
i'm creating a simple, mobile friendly web site that will use an API 
to get wait times for rides. I'm calling the app, Find a Ride,
and I need some CSS to make it look nice. I'm looking for CSS that
is responsive and has a playful, colorful look to it that matches
the fun you have at amusement parks.
```

Notice I had another name for the app at first. Gemini responded with:

```
Okay, "Find a Ride" sounds like a super fun app! An amusement park 
heme is a great choice for the design. I've whipped up some CSS 
that should give your site that playful, colorful, and responsive 
feel you're looking for.

This CSS uses a mobile-first approach, so it'll look great on phones, 
and then it adapts for tablets and desktops. I've picked some 
vibrant colors and fun fonts (make sure to include the Google Fonts 
link in your HTML's <head>).
```

After this it spit out a bunch of code, and then followed up with instructions on how to use it. This was hella useful as it made it clear what classes I'd need for certain statuses. 

Here's a screenshot of the final application. Note that I followed up my initial prompts with further requests, including help designing the drop down and the checkbox I added later.

<p>
<img src="https://static.raymondcamden.com/images/2025/05/park1.jpg" alt="Ride Sort UI screenshot" class="imgborder imgcenter" loading="lazy">
</p>

Now let's get into the code.

## The HTML

As an Alpine app, my front end is pretty simple. I've got directives to bind my UI controls (the drop down, buttons, and checkbox) and a place to display rides. 

```html
<div class="app-header">
	<h1>Ride Sort</h1>
</div>

<main class="content-wrapper" x-data="app">

<p>
Select which park you are in: 
<select x-model="selectedPark">
	<option value="">-- Select a park --</option>
	<template x-for="park in parks" :key="park.id">
	<option x-text="park.name" :value="park.id"></option>
	</template>
</select> <button class="btn" x-show="parksLoaded" @click="loadTimes">Get Times</button>
<div class="checkbox-control">
    <input type="checkbox" x-model="showClosed" id="showClosedCheckbox" class="themed-checkbox">
    <label for="showClosedCheckbox" class="checkbox-label">Show Closed Rides (<span x-text="allRides.length"></span> total rides)</label>
</div>
</p>

<div class="loader" style="display:none" x-show="loadingRides" id="loader"></div>

<template x-if="ridesLoaded">
	<div class="ride-list">
	<template x-for="ride in rides">

		<div class="ride-card">
			<h2 x-text="ride.name"></h2>
			<p class="wait-time"><span x-text="ride.wait_time"></span> <span class="unit">minutes</span></p>
			<!-- is_open: true or false -->
			<p class="info-item"><strong>Land:</strong> <span x-text="ride.land"></span></p>
			<span class="status" :class="ride.is_open ? 'open':'closed'" x-text="ride.is_open ? 'Open':'Closed'"></span></span>
		</div>
	</template>
	</div> 
</template>

<footer class="app-footer">
<p>
Created by <a href="https://www.raymondcamden.com" target="_blank">Ramond Camden</a> ~ <a href="https://queue-times.com/en-US" target="_blank">Powered by Queue-Times.com</a>
</p>
</footer>
```

I don't think there's anything too crazy there, but obviously let me know in the comments if anything doesn't make sense. All of the CSS used came right from Gemini and I just adapted to Alpine and my data. 

## The APIs

As I mentioned, the application makes use of Alpine.js, but before going into that, let's discuss the APIs. Queue Times provides two end points. The first returns a list of Parks via <https://queue-times.com/parks.json>. This returns an array of companies, and beneath each company (or park group) is an array of parks. Here's one example under the Disney group:

```json
 {
	"id": 7,
	"name": "Disney Hollywood Studios",
	"country": "United States",
	"continent": "North America",
	"latitude": "28.3575294",
	"longitude": "-81.5582714",
	"timezone": "America/New_York"
},
```

Once you have the ID of a park, you can then request wait times like so: <https://queue-times.com/parks/7/queue_times.json>. This also returns an array of arrays, this time grouped by "land" with "rides" under it. So for example:

```json
{
	"id": 70,
	"name": "Muppet Courtyard",
	"rides": [
		{
			"id": 118,
			"name": "Muppet*Vision 3D",
			"is_open": true,
			"wait_time": 10,
			"last_updated": "2025-05-15T13:55:50.000Z"
		}
	]
},
```

By the way, the Muppet 3D show is going away and I know I'm not alone in being really sad about that. 

<p>
<img src="https://static.raymondcamden.com/images/2025/05/sam.jpg" alt="Sam the Eagle with the word NO!!" class="imgborder imgcenter" loading="lazy">
</p>

Given that the APIs are super easy to use, the only issue I ran into is that CORS is not supported. To get around that, I simply created two proxies at [val town](https://www.val.town/). That was as easy as making a file, adding a HTTP trigger, and writing code like so:

```js
export async function main() {
  let res = await fetch("https://queue-times.com/parks.json");
  let data = await res.json();
  return Response.json(data);
}
```

That's the main proxy to get all the parks, and here's one for getting rides:

```js
export const rides = async (req: Request) => {
  let params = new URL(req.url).searchParams;
  let id = params.get("id");

  let res = await fetch(`https://queue-times.com/parks/${id}/queue_times.json`);
  let data = await res.json();
  return Response.json(data);
};
```

Notice there's no error handling there. Oh well. 

Alright, now let's turn to the JavaScript.

## The JavaScript

I love Alpine, but it's been a few months since I made use of it so this part was probably the slowest for me. First, here's the core application definition:

```js

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
	parks: [],
	allRides:[],
	selectedPark:null,
	showClosed:false, 
	loadingRides:false, 
	parksLoaded() {
		return this.parks.length > 0;
	},
	ridesLoaded() {
		return this.rides.length > 0;
	},
	async init() {
		this.parks = await getParks();
	},
	async loadTimes() {
		this.allRides = [];
		this.loadingRides = true;
		console.log(`get for ${this.selectedPark}`);
		this.allRides = await getRides(this.selectedPark);
		this.loadingRides = false;
	}, 
	get rides() {
		if(this.showClosed) return this.allRides;
		else return this.allRides.filter(r => r.is_open === true);
	}
  }))

});
```

I specify default values for what my UI needs and then have code to support loading my remote data and such. The `rides` value is dynamic based on whether or not you want to see closed rides, which I default to false as I can't imagine wanting those rides shown, but you've got that option.

Here's how I handle the two API calls:

```js
const PARK_PROXY = 'https://raymondcamden--634fa2d2310a11f09b31569c3dd06744.web.val.run/';
const RIDE_PROXY = 'https://raymondcamden--12f63956310d11f0a367569c3dd06744.web.val.run/';

async function getParks() {

	let res = await fetch(PARK_PROXY);
	let data = await res.json();
	let parks = [];
	/*
	structure is:
		array of companies
			array of parsk
	*/
	data.forEach(c => {
		c.parks.forEach(p => {
			parks.push(p);
		});
	});

	parks.sort((a,b) => {
		return a.name.localeCompare(b.name);
	});

	return parks;
}

async function getRides(id) {
	let res = await fetch(`${RIDE_PROXY}?id=${id}`);
	let data = await res.json();
	let rides = [];
	/*
	structure is:
		array of lands
			array of rides
	*/
	data.lands.forEach(l => {
		l.rides.forEach(r => {
			r.land = l.name;
			rides.push(r);
		});
	});

	rides.sort((a,b) => {
		return a.wait_time - b.wait_time;
	});

	return rides;

}
```

For each, I do a bit of data manipulation. So for example, parks are 'flattened' to just a long list of parks and then sorted. I could see perhaps letting people pick a group of parks first and then the park. I could also see building a Disney specific version of this, or heck, even one that's just American companies. You get the locations for each park so it would, technically, be possible to filter. 

For rides I flatten again, but copy over the land value for display in the UI. 

## Play with It!

Alright, so that's basically it. Like I mentioned, I've got another cool idea for tomorrow using this API, but you can play with now on CodePen: <https://codepen.io/cfjedimaster/full/vEEbVjv>

You can see the full code here:

<p class="codepen" data-height="700" data-theme-id="dark" data-default-tab="result" data-slug-hash="vEEbVjv" data-pen-title="Ride Sort" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/vEEbVjv">
  Ride Sort</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

<p>
