---
layout: post
title: "Let's Map Traffic Incidents... Again"
date: "2024-09-06T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_police.jpg
permalink: /2024/09/06/lets-map-traffic-incidents-again
description: Yet another look at rebranding incident data
---

This blog has been around for a while (twenty one years currently) so it isn't too uncommon for me to revisit old topics and demos and rebuild them. I think today's post may be something of an outlier though. Way back in 2010, early 2010, I built a [Proof of Content 911 Viewer](https://www.raymondcamden.com/2010/01/19/proof-of-concept-911-viewer) that wrapped a local police department's web site, [lafayette911.org](https://lafayette911.org/).

<p>
<img src="https://static.raymondcamden.com/images/2024/09/laf911.jpg" alt="Screenshot showing a table of incidents" class="imgborder imgcenter" loading="lazy">
</p>

Note the cute disclaimer at the bottom of the site saying you have to ask permission to link to it. Tell me you don't know how the internet works without telling me you don't know how it works.

Anyway, back in 2010 I used Yahoo Pipes (pour one out for a cool as heck web service) to scrape the data and store it in a database. This was done via a scheduled ColdFusion script. I then used ColdFusion's Google Map wrapper to display it. 

That was fun. But even more fun was the fact that I forgot I had built it and six months later I had a crap ton of cool data: [Update to my 911 Viewer](https://www.raymondcamden.com/2010/09/03/Update-to-my-911-Viewer)

Fast forward seven years and I updated my code to make use of IBM OpenWhisk, the first serverless platform I really got into: [Collecting 911 Data with OpenWhisk Cron Triggers](https://www.raymondcamden.com/2017/02/14/collecting-911-data-openwhisk-cron-triggers)

Hop forward again and in 2020, I demonstrated how to use [Pipedream's](https://pipedream.com) event sources features to fire off workflows when a new traffic incident occurs. I like Pipedream for a lot of reasons but their ability to design custom ways to fire off workflows is incredible. 

It may be that I'm obsessive, but recently I decided to take a look at it again. As it turns out, the last version of my code no longer works, so it was time to update it again.

## Getting Raw Data from Lafayette911

When viewing [Lafayette911](https://lafayette911.org), you have to dig a bit to see where the actual data is coming from. Opening up Devtools shows a POST request to https://lafayette911.org/WebService1.asmx/getCurrentTrafficConditions. I whipped up a quick script to confirm:

```js
let resp = await fetch('https://lafayette911.org/WebService1.asmx/getCurrentTrafficConditions', 
        { 
          method: 'POST',
          headers: {
            'Content-Type':'application/json'
          }
        });

let data = await resp.json();
let realData = JSON.parse(data['d']);
console.log(realData);
```

The result is within a `d` property of the object so `realData` just helps me get to it quicker. This is how it looks right now. As a note, we're having bad weather here so the number of results isn't surprising:

```js
{
  status: 'ok',
  incidents: [
    {
      location: '800 DAIGLE ST/ARDOIN MEMORIAL ST            LAFAYETTE, LA',
      cause: 'TRAFFIC ACCIDENT UNK INJURYS',
      reported: '09/06/2024 13:25',
      assisting: 'POLICE'
    },
    {
      location: '100 YOUNGSVILLE HWY/YOUNGSVILLE            LAFAYETTE, LA',
      cause: 'TRAFFIC ACCIDENT MINOR',
      reported: '09/06/2024 13:18',
      assisting: 'POLICE'
    },
    {
      location: '3110 AMBASSADOR CAFFERY PKWY/GOVERNOR MIRO PKWY            LAFAYETTE, LA',
      cause: 'TRAFFIC ACCIDENT MINOR',
      reported: '09/06/2024 13:17',
      assisting: 'POLICE'
    },
    {
      location: '1100 RUE DU BELIER/NEZIDA            LAFAYETTE, LA',
      cause: 'TRAFFIC ACCIDENT MINOR',
      reported: '09/06/2024 13:09',
      assisting: 'POLICE'
    },
    {
      location: '2678 JOHNSTON ST/AMARYLLIS ST            LAFAYETTE, LA',
      cause: 'TRAFFIC ACCIDENT MINOR',
      reported: '09/06/2024 12:55',
      assisting: 'POLICE'
    },
    {
      location: '100 RIDGE RD/RIDGE            LAFAYETTE, LA',
      cause: 'TRAFFIC ACCIDENT MINOR',
      reported: '09/06/2024 12:53',
      assisting: 'POLICE'
    },
    {
      location: '111 GIREER RD/            YOUNGSVILLE, LA',
      cause: 'STALLED VEHICLE',
      reported: '09/06/2024 10:27',
      assisting: 'SHERIFF'
    }
  ]
}
```

Cool. Now, let's map it!

## Mapping the Data with Leaflet

I knew that mapping this with [Leaflet](https://leafletjs.com) wouldn't be difficult, but I was missing something important. The data returned from Lafayette911 isn't geocoded. It's just a street and city address. In order to geocode this, I was going to need to use another service. 

I decided to make use of the Google Maps REST API. Give you have a key, this is a fairly easy process:

```js
async function geocode(address) {

	let req = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_KEY}`);
	let result = await req.json();
	return result.results[0].geometry.location;

}
```

Now, this isn't free, but in theory, my little demo should be well within the free tier. Hopefully anyway. That being said, I knew I'd need some kind of caching in place which meant - I needed to build a 'real' server. 

For this I turned to [Glitch](https://glitch.com). I've built some fun little projects there before and I thought this might be a good chance to do so again. One of their starter projects is a simple Fastify Node server so I began with that.

I had never seen [Fastify](https://fastify.dev/) before, but I was able to read the code easily enough and modify it do what I needed. That's a great sign imo. Do check the [Fastify](https://fastify.dev) website though as from what I can see, it looks to be a pretty nice Node server. (My main experience in that area is Express, and I haven't really used Express in probably a decade.)

So, given that I've got a real server, my plan was:

* Create a route to simply load the HTML for my map (and CSS/JavaScript)
* Create a route to get the data from Lafayette911
* For each address, check a local RAM based cache for a geocoded address and if not there, ask Google for it.

Honestly the RAM based cache should be more persistent, but again, this is just a demo for fun. 

Here's the entirety of the Fastify stuff, and again, even if you've never seen it, I bet you'll have no trouble understanding what's going on:

```js
let fetch = require('node-fetch');
const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});

let GOOGLE_KEY = process.env.GOOGLE_API;
let CACHE_ADDR = {};

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

/**
 * Our home page route
 *
 * Returns src/pages/index.hbs with data built into it
 */
fastify.get("/", function (request, reply) {
  return reply.redirect('/map');
});

fastify.get("/map", function (request, reply) {
  return reply.view("/src/pages/map.hbs");
});

fastify.get('/incidents', async (request, reply) => {

  let resp = await fetch('https://lafayette911.org/WebService1.asmx/getCurrentTrafficConditions', 
        { 
          method: 'POST',
          headers: {
            'Content-Type':'application/json'
          }
        });

  let data = await resp.json();
  let realData = JSON.parse(data['d']);

  for(let i=0; i<realData.incidents.length; i++) {
    let loc = realData.incidents[i].location;
    console.log(`look up ${loc}`);
    if(CACHE_ADDR[loc]) {
      console.log('returned it from cache');
      realData.incidents[i].geo = CACHE_ADDR[loc];
    } else {
      console.log('not in cache');
      realData.incidents[i].geo = await geocode(realData.incidents[i].location);
      CACHE_ADDR[loc] = realData.incidents[i].geo;
    }
  
  }
  reply.send(realData.incidents)
  
  
});


// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);


async function geocode(address) {
	let req = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_KEY}`);
	let result = await req.json();
	return result.results[0].geometry.location;
}
```

Now let's look at the front end. I've got a div to hold my map, and here's the code that creates the map:

```js
document.addEventListener('DOMContentLoaded', async () => {
	let incidentsReq = await fetch('/incidents');
	let incidents = await incidentsReq.json();
	console.log(incidents);

	let map = L.map('map').setView([30.216, -92.033], 12);

	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 20,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);

	for(let i=0;i<incidents.length;i++) {
		let desc = `
		<b>${incidents[i].location}</b><br>
		Cause: ${incidents[i].cause}<br>
		Assisting: ${incidents[i].assisting}<br>
		`
		L.marker([incidents[i].geo.lat, incidents[i].geo.lng]).addTo(map)
		.bindPopup(desc)
	}
	
},false)
```

Basically, ask the server for traffic incidents and add them to the map. For each incident, add a popup describing the issue. 

<p>
<img src="https://static.raymondcamden.com/images/2024/09/incident1.jpg" alt="Map showing incidents with one popup active. It mentions a minor traffic accident" class="imgborder imgcenter" loading="lazy">
</p>

If you want to see it yourself, and keep in mind, the data will change as time goes on, just visit: <https://spectacular-large-battery.glitch.me/map>

Want to see the code? Just go to <https://glitch.com/~spectacular-large-battery>