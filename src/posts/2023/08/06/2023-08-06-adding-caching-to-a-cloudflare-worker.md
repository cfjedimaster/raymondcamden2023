---
layout: post
title: "Adding Caching to a Cloudflare Worker"
date: "2023-08-06T18:00:00"
categories: ["serverless"]
tags: ["cloudflare"]
banner_image: /images/banners/oldship.jpg
permalink: /2023/08/06/adding-caching-to-a-cloudflare-worker
description: How to add basic caching to a Cloudflare Worker serverless worker.
---

Last week I [blogged](https://www.raymondcamden.com/2023/08/01/building-a-basic-pirate-api-wrapper-with-cloudflare-workers) about my first experience building a [Cloudflare Worker](https://workers.cloudflare.com/) serverless function. In that post, I built a simple serverless function that wrapped calls to the [Pirate Weather API](https://pirateweather.net/en/latest/), a free and simple-to-use API for getting weather information. For today's post, I thought I'd show how easy it is to add a bit of caching to the worker to help improve its performance. As with my last post, I've also got a video walkthrough of everything you watch instead. (Or read *and* watch, go crazy!)

## The Application

In the last post, I shared the complete code of the Worker, but let me share it again:

```js
// Lafayette, LA
const LAT = 30.22;
const LNG = -92.02;

export default {
	async fetch(request, env, ctx) {

		const APIKEY = env.PIRATE_KEY;

		let url = `https://api.pirateweather.net/forecast/${APIKEY}/${LAT},${LNG}`;
		let forecastResp = await fetch(url);
		let forecast = await forecastResp.json();

		let data = {
			daily: forecast.daily.data, 
			alerts: forecast.alerts
		}

		return new Response(JSON.stringify(data), {
			headers: {
				'Content-Type':'application/json;charset=UTF-8'
			}
		});

	},
};
```

As a reminder, it does the following:

* First, it grabs the API key from a secret. In production, this is set up using the `wrangler` CLI, and locally it's done by adding a `.dev.vars` file following a key=value format for defining secrets.
* Next, it hits the Pirate Weather API. The Worker is hardcoded to only get weather for Lafayette, LA. Spoiler, it's hot. I don't care when you're reading this, it's hot. 
* Finally, it shapes the result to only return the daily forecast and any alerts for the location.

This all works reasonably well. On my local machine when I fire up the development server and hit it a few times, I see timings between 1 and 2 seconds. Here's an example of how that looks:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/cache1.jpg" alt="Terminal output showing timings" class="imgborder imgcenter" loading="lazy">
</p>

## Cloudflare KV

Cloudflare Workers come with multiple different things it can integrate with on their system, including [Cloudflare KV], a key/value system with highly performant persistence. As a key/value system it resembles the [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) API quite a bit. You can store data by giving it a key and fetch the same thing back with the key. Also like Web Storage, complex values need to be JSON encoded and decoded. 

You can, and should, check the [Workers and KV docs](https://developers.cloudflare.com/workers/wrangler/workers-kv/) for how they work together, but let me demonstrate how simple it is to get started.

First, you create a KV namespace. This can be done via the `wrangler` CLI and looks like so:

```bash
wrangler kv:namespace create <YOUR_NAMESPACE>
```

For my test, I'm using `weather4` for the name (I've iterated on my demo a few times and wanted to keep the files separate), so I'll make a namespace with the same name:

```bash
wrangler kv:namespace create weather4
```

When run at the CLI (note, if you don't have `wrangler` installed globally, you can prefix the command with `npx` to use the command from your Worker project). This will output:

```bash
Add the following to your configuration file in your kv_namespaces array:
{ binding = "weather4", id = "b1342a22bcfd4af68f075223739025b3" }
```

The configuration file is `wrangler.toml`, and any scaffolded Worker project will include one. To add it, you can open the file and paste in this:

```
kv_namespaces = [
{ binding = "weather4", id = "b1342a22bcfd4af68f075223739025b3" }
]
```

If you fire up your Worker project again, however, you'll get an error:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/cache2.jpg" alt="Error in terminal" class="imgborder imgcenter" loading="lazy">
</p>

Luckily this is *very* clear and tells you exactly what to do. When you use KV in a Cloudflare Worker, they want you to create a development copy of the namespace. This can be done by literally rerunning the last command and adding `--preview`:

```bash
wrangler kv:namespace create weather4 --preview
```

This time it outputs:

```
{ binding = "weather4", preview_id = "29f5c2406dc24417bfd7bf6a79c2c5a7" }
```

And you then copy just `preview_id` to your `wrangler.toml`:

```
kv_namespaces = [
    { binding = "weather4", id = "b1342a22bcfd4af68f075223739025b3", preview_id = "29f5c2406dc24417bfd7bf6a79c2c5a7" }
]
```

At this point, you can run the development server and not have any errors. (Hopefully.)

### Using the Cache

Using the cache involves two steps - reading from the cache to see if it exists and writing to the cache when the data is fetched. Before we add that, I first moved the actual API call into its own function:

```js
async function getForecast(key,lat,lng) {
	let url = `https://api.pirateweather.net/forecast/${key}/${lat},${lng}`;
	let forecastResp = await fetch(url);
	return  await forecastResp.json();
}
```

Back in the main part of the function, I can check for the cache like so:

```js
let forecast = await env.weather4.get('cache');
```

The API is async, hence the `await` keyword, and you access it via the `env` argument and via the namespace. Finally, you pass the key value. If the value isn't in the cache, you'll get a null result. I can modify my code like so:

```js
let forecast = await env.weather4.get('cache');

if(!forecast) {
 // todo
} else forecast = JSON.parse(forecast);
```

Remember that we need to JSON encode complex values, so if it was in the cache, it was a JSON string. If we need to get the data, we just do that inside the `if` condition:

```js
console.log('need to fetch, not in cache');
let data = await getForecast(APIKEY,LAT,LNG);
forecast = {
	created: new Date(), 
	daily: data.daily.data, 
	alerts: data.alerts
}
```

Notice I've added a value, `created`, just to see when the data was cached. 

Finally, the value needs to be actually cached, and here is where I got most happy with the API. To store the value, you use `put`, and as you can probably guess, you'll pass a key and value. But you can also pass an expiration value! You can expire at a certain time, or after a certain number of seconds. Best of all, this is all automated. If you tell KV to expire at a time and that time has passed, when you `get` the value, it will return nothing again. 

The smallest time you can cache for is 60 seconds. Obviously, for a weather forecast you would want to cache for hours, not seconds, but for testing purpose I'll set it to 60 seconds:

```js
await env.weather4.put('cache', JSON.stringify(forecast), { expirationTtl: 60 });
```

Also, note I'm running `JSON.stringify` before setting the value. And that's it. After doing this, and hitting the API a few times, check out the difference in speed:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/cache3.jpg" alt="Improvements shown with caching added." class="imgborder imgcenter" loading="lazy">
</p>

So with a few lines of code, and two commands run the CLI, the worker is now returning results in near instantaneous speed. I love it! Here's the complete code:

```js
// Lafayette, LA
const LAT = 30.22;
const LNG = -92.02;

async function getForecast(key,lat,lng) {
	let url = `https://api.pirateweather.net/forecast/${key}/${lat},${lng}`;
	let forecastResp = await fetch(url);
	return  await forecastResp.json();
}

export default {
	async fetch(request, env, ctx) {

		const APIKEY = env.PIRATE_KEY;

		let forecast = await env.weather4.get('cache');

		if(!forecast) {
			console.log('need to fetch, not in cache');
			let data = await getForecast(APIKEY,LAT,LNG);
			forecast = {
				created: new Date(), 
				daily: data.daily.data, 
				alerts: data.alerts
			}

			await env.weather4.put('cache', JSON.stringify(forecast), { expirationTtl: 60 });
		} else forecast = JSON.parse(forecast);

		return new Response(JSON.stringify(forecast), {
			headers: {
				'Content-Type':'application/json;charset=UTF-8'
			}
		});

	},
};
```

You can watch a video of this below.

<iframe width="560" height="315" src="https://www.youtube.com/embed/TL-cfLfbAbI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="display:block;margin:auto;margin-bottom:10px"></iframe>