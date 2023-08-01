---
layout: post
title: "Building a Basic (Pirate) API Wrapper with Cloudflare Workers"
date: "2023-08-01T18:00:00"
categories: ["serverless"]
tags: ["cloudflare"]
banner_image: /images/banners/oldship.jpg
permalink: /2023/08/01/building-a-basic-pirate-api-wrapper-with-cloudflare-workers
description: A look at building a simple serverless API wrapper with Cloudflare Workers
---

I've been playing with [Cloudflare Workers](https://workers.cloudflare.com/) the past few weeks, and while I've had a few technical issues here and there, I've been *really* impressed with the developer experience overall and just how powerful the platform is. I thought I'd share a quick demo of a simple "API wrapper" built with Workers. If you want, you can skip to the end of this post where I've shared a Youtube video of what I'm covering here. Let's get started!

## What We're Building

For this demo, I'm going to build a simple wrapper around the excellent [Pirate Weather API](https://pirateweather.net/en/latest/). This API returns, you guessed it, weather data. The serverless API I'll build will hide the key from the client-side code and will only get information for one city, Lafayette Louisiana. Someone could take the endpoint for our serverless API, but it wouldn't be terribly useful for them with it locked down to one location.


## Pre-Reqs and Docs

I'm not going to cover the same ground as their [excellent docs](https://developers.cloudflare.com/workers/), but I'd recommend taking a quick look at the [getting started guide](https://developers.cloudflare.com/workers/get-started/guide/). You will also, of course, need an account with Cloudflare.

You will also need a key for Pirate Weather. I'm sharing mine here in code but will probably delete the key (eventually). 

## Scaffolding the Worker

To begin, I'll scaffold a new Worker with:


```bash
npm create cloudflare@latest
```

This will ask me a few questions. For the name, I'm using `weather2`. For the scaffold, just the `hello world` one, and finally I elected to use JavaScript, not TypeScript. 

<p>
<img src="https://static.raymondcamden.com/images/2023/08/worker1.jpg" alt="Screenshot of CLI doing scaffolding." class="imgborder imgcenter" loading="lazy">
</p>

In the end, it will prompt you to immediately deploy to production, but I said no to that. I'll do that later.

Finally, you'll see this:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/worker2.jpg" alt="Final screen from the CLI" class="imgborder imgcenter" loading="lazy">
</p>

As the output says, once you change into the project directory, you can fire up the dev server with `npm run start`:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/worker3.jpg" alt="More from the CLI" class="imgborder imgcenter" loading="lazy">
</p>

I haven't tried all the options here, but `b` works fine and opens a new tab. The default `hello world` scaffolded application returns 'Hello World!' in the browser. Now let's get started coding!

## Make it JSON

Your worker code lives in `src/worker.js`. Here's that code:

```js
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx) {
		return new Response('Hello World!');
	},
};
```

The first thing I want to do is return JSON. I'll begin by adding a new object to return and specifying a header in my response:

```js
export default {
	async fetch(request, env, ctx) {

		
		let data = { msg: 'Hello World' };
		
		return new Response(JSON.stringify(data), {
			headers: {
				'Content-Type':'application/json;charset=UTF-8'
			}
		});

	},
};
```

Simple enough so far, right?

## Get the Weather

For the next iteration, I want to get the weather. I know the longitude and latitude of Lafayette, Louisiana, so I'll add those and my Pirate Weather key directly to the code:

```js
const APIKEY = 'lrokzEoN2n7ifLAVgrChU4V6XPEyqAZp5ikO6UWF';

// Lafayette, LA
const LAT = 30.22;
const LNG = -92.02;
```

You can check the [Pirate Weather docs](https://pirateweather.net/en/latest/) for more information, but getting a basic forecast involves hitting their endpoint with the key and location. Here it is being loaded via `fetch`:

```js
export default {
	async fetch(request, env, ctx) {


		let url = `https://api.pirateweather.net/forecast/${APIKEY}/${LAT},${LNG}`;
		let forecastResp = await fetch(url);
		let forecast = await forecastResp.json();

		return new Response(JSON.stringify(forecast), {
			headers: {
				'Content-Type':'application/json;charset=UTF-8'
			}
		});

	},
};
```

The result is... huge. Nearly 2000 lines of data huge. Let's fix that. For our purposes, we only want the daily information and alerts:

```js
const APIKEY = 'lrokzEoN2n7ifLAVgrChU4V6XPEyqAZp5ikO6UWF';

// Lafayette, LA
const LAT = 30.22;
const LNG = -92.02;

export default {
	async fetch(request, env, ctx) {


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

This returns a much more sensible 400 or so lines of code. I could even reduce the size even more, for example, removing wind data if I don't care about it. As an example, here's one daily record:

```js
{
	"time": 1690866000,
	"icon": "partly-cloudy-day",
	"summary": "Partly Cloudy",
	"sunriseTime": 1690889212,
	"sunsetTime": 1690938097,
	"moonPhase": 0.49,
	"precipIntensity": 0,
	"precipIntensityMax": 0,
	"precipIntensityMaxTime": 1690905600,
	"precipProbability": 0,
	"precipAccumulation": 0,
	"precipType": "none",
	"temperatureHigh": 102.94,
	"temperatureHighTime": 1690923600,
	"temperatureLow": 80.44,
	"temperatureLowTime": 1690966800,
	"apparentTemperatureHigh": 113.8,
	"apparentTemperatureHighTime": 1690923600,
	"apparentTemperatureLow": 107.22,
	"apparentTemperatureLowTime": 1690966800,
	"dewPoint": 69.3,
	"humidity": 0.44,
	"pressure": 1014.28,
	"windSpeed": 5.83,
	"windGust": 9.81,
	"windGustTime": 1690945200,
	"windBearing": 237,
	"cloudCover": 0.46,
	"uvIndex": 8.68,
	"uvIndexTime": 1690916400,
	"visibility": 10,
	"temperatureMin": 86.97,
	"temperatureMinTime": 1690945200,
	"temperatureMax": 102.94,
	"temperatureMaxTime": 1690923600,
	"apparentTemperatureMin": 107.22,
	"apparentTemperatureMinTime": 1690945200,
	"apparentTemperatureMax": 113.8,
	"apparentTemperatureMaxTime": 1690923600
}
```

And yes, the "feels like" temperature is 107. Sigh. Shockingly, here's one of the alerts. You get one guess as to the type of alert:

```js
{
	"title": "Excessive Heat Warning issued August 1 at 3:35AM CDT until August 1 at 7:00PM CDT by NWS Lake Charles LA",
	"regions": [
		"Vernon",
		" Rapides",
		" Avoyelles",
		" Beauregard",
		" Allen",
		" Evangeline",
		" St. Landry",
		" Lafayette",
		" Upper St. Martin",
		" Lower St. Martin",
		" West Cameron",
		" East Cameron",
		" Northern Calcasieu",
		" Northern Jefferson Davis",
		" Northern Acadia",
		" Upper Vermilion",
		" Upper Iberia",
		" Upper St. Mary",
		" Southern Calcasieu",
		" Southern Jefferson Davis",
		" Southern Acadia",
		" Lower Vermilion",
		" Lower Iberia",
		" Lower St. Mary",
		" Tyler",
		" Hardin",
		" Northern Jasper",
		" Northern Newton",
		" Southern Jasper",
		" Southern Newton",
		" Upper Jefferson",
		" Northern Orange",
		" Lower Jefferson",
		" Southern Orange"
	],
	"severity": "Severe",
	"time": 1690902000,
	"expires": 1690934400,
	"description": "* WHAT...For the first Excessive Heat Warning, dangerously hot conditions with heat index values up to 116 expected. For the second Excessive Heat Warning, dangerously hot conditions with heat index values up to 115 expected.  * WHERE...Portions of central, south central, southwest and west central Louisiana and southeast Texas.  * WHEN...For the first Excessive Heat Warning, from 10 AM this morning to 7 PM CDT this evening. For the second Excessive Heat Warning, from 10 AM to 7 PM CDT Wednesday.  * IMPACTS...Extreme heat and humidity will significantly increase the potential for heat related illnesses, particularly for those working or participating in outdoor activities.  * ADDITIONAL DETAILS...Thursday bears watching. Confidence is high that at least a Heat Advisory will be needed, however some locations do reach into Warning criteria.",
	"uri": "https://alerts-v2.weather.gov/#/?id=urn%3Aoid%3A2.49.0.1.840.0.ad8009682e35629cc5eca9dd28b74faae7fabaa0.001.3"
},
```

Woot! We're done. Almost...

## Removing the Key

So while my Pirate Weather key isn't visible publicly, I would like to remove it from the code itself. The Cloudflare docs cover [environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/) and make it *super* easy to use.

First, add a `.dev.vars` file to your project. This ends up being like a `dotenv` file:

```
PIRATE_KEY=lrokzEoN2n7ifLAVgrChU4V6XPEyqAZp5ikO6UWF
```

This is a set of name/value pairs that will be applied to the environment variable of your worker. I removed the earlier `const` declaration and added a new line inside the main function of the worker:

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

**Important - the Cloudflare Development environment doesn't typically require restarting, but for this change, you will want to use the `x` key to exit, and just run `npm run start` again for it to pick up the new file and environment variable. 

Next, to get this variable available in production, you can use the `wrangler` CLI (part of the installation process) like so: `wrangler secret put PIRATE_KEY`:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/worker4.jpg" alt="CLI to create a new secret" class="imgborder imgcenter" loading="lazy">
</p>

## Deploying

Now for the shortest section of the post. To push the worker live, just run `npm run deploy`:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/worker5.jpg" alt="Pushing to production via CLI" class="imgborder imgcenter" loading="lazy">
</p>

If you want, you can hit this yourself here: <https://weather2.raymondcamden.workers.dev/>

## The Video Version!

I hope you liked this. As I said, I'm *very* happy with the development process in Workers. I will say I've had a bit of bad luck with their support forums. For example, I've got a post up there that's about two weeks old with no response. But hopefully, that's not the norm. As I mentioned above, today I recorded a video of all the above:

<iframe width="560" height="315" src="https://www.youtube.com/embed/o5FI-Xj66T0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="display:block;margin:auto;width:100%;margin-bottom:10px"></iframe>

Photo by <a href="https://unsplash.com/@zoltantasi?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Zoltan Tasi</a> on <a href="https://unsplash.com/photos/HTpAIzZRHvw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  