---
layout: post
title: "Debugging Cloudflare Workers with Logs"
date: "2023-08-22T18:00:00"
categories: ["serverless"]
tags: ["cloudflare"]
banner_image: /images/banners/logs.jpg
permalink: /2023/08/22/debugging-cloudflare-workers-with-logs
description: A look at how to debug your Cloudflare Workers with simple log messages.
---

As with some of my [previous Cloudflare posts](https://www.raymondcamden.com/tags/cloudflare), I've got a video version of this content so if you would rather watch that than read, just jump to the bottom. For the rest of you, here's a look at how to do some basic debugging with your [Cloudflare Workers](https://workers.cloudflare.com/).

## The Worker

Before I get into how to debug, let's consider a simple Worker that has an API for returning random numbers. (Don't use Cloudflare Workers, or any serverless platform, for something so simple!)

```js
export default {
	async fetch(request, env, ctx) {

		// ignore /favicon.ico
		if(request.url.includes('favicon.ico')) return new Response('');

		// https://community.cloudflare.com/t/parse-url-query-strings-with-cloudflare-workers/90286/3
		const { searchParams } = new URL(request.url);
		let min = parseInt(searchParams.get('min'),10);
		let max = parseInt(searchParams.get('max'),10);
		console.log(`inititial min, max: ${min}, ${max}`);
		if(isNaN(min)) min = 1;
		if(isNaN(max)) max = 100;
		if(min >= max) { min=1; max=100 };
		console.log(`corrected min, max: ${min}, ${max}`);

		let selectedNumber = getRandomIntInclusive(min, max);
		console.log(`selectedNumber: ${selectedNumber}`);
		
		return new Response(JSON.stringify({selectedNumber}), {
			headers: {
				'Content-Type':'application/json;charset=UTF-8'
			}
		});


	},
};

function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min); 
}
```

The logic boils down to - check the query string for a min and max value, do some basic validation, and then return a random number in that range. If you want you can actually hit this API here: <https://randomnumber.raymondcamden.workers.dev/>

## Debugging Locally

You'll notice a few `console.log` messages in there. When running the Worker locally via `npm run start`, the console messages will show up right in your terminal. I ran the API a few times with different values in the query string and you can see the debug output:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/debug1.jpg" alt="Console output in the terminal" class="imgborder imgcenter" loading="lazy">
</p>

Rather simple and actually what I expected to see when testing, so I was happy this "just worked".

## Debugging in Production

Don't. Ok, but what if you want to? Or simply check the output from logs? You've got two options for that. First, in the Cloudflare Workers dashboard, select your Worker, and then select the `Logs` tab:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/debug2.jpg" alt="Screen shot from the dashboard for the worker" class="imgborder imgcenter" loading="lazy">
</p>

You then click the nice blue button, `Begin log stream`:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/debug3.jpg" alt="Dashboard showing it is waiting for logs" class="imgborder imgcenter" loading="lazy">
</p>

Now, hit the URL for your Worker, or if it's triggered some other way, wait for that to happen. Once one or more events have happened, you'll see them show up:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/debug4.jpg" alt="2 events related to running the Worker" class="imgborder imgcenter" loading="lazy">
</p>

Finally, click on one to see the output. It's a big JSON result that I've copied below. I did remove some of the data to shorten it up a bit.

```json
{
  "outcome": "ok",
  "scriptName": "randomnumber",
  "diagnosticsChannelEvents": [],
  "exceptions": [],
  "logs": [
    {
      "message": [
        "inititial min, max: 9, 99999"
      ],
      "level": "log",
      "timestamp": 1692730437605
    },
    {
      "message": [
        "corrected min, max: 9, 99999"
      ],
      "level": "log",
      "timestamp": 1692730437605
    },
    {
      "message": [
        "selectedNumber: 36327"
      ],
      "level": "log",
      "timestamp": 1692730437605
    }
  ],
  "eventTimestamp": 1692730437605,
  "event": {
    "request": {
      "url": "https://randomnumber.raymondcamden.workers.dev/?min=9&max=99999",
      "method": "GET",
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip",
        "accept-language": "en-US,en;q=0.9",
        "cf-connecting-ip": "76.72.14.122",
        "cf-ipcountry": "US",
        "cf-visitor": "{\"scheme\":\"https\"}",
        "connection": "Keep-Alive",
        "dnt": "1",
        "host": "randomnumber.raymondcamden.workers.dev",
        "priority": "u=0, i",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203",
        "x-forwarded-proto": "https",
        "x-real-ip": "76.72.14.122"
      },
      "cf": {
        "longitude": "-92.04770",
        "latitude": "30.18100",
        "tlsCipher": "AEAD-AES128-GCM-SHA256",
        "continent": "NA",
        "asn": 25921,
        "clientAcceptEncoding": "gzip, deflate, br",
        "country": "US",
        "tlsVersion": "TLSv1.3",
        "colo": "ATL",
        "timezone": "America/Chicago",
        "city": "Lafayette",
        "edgeRequestKeepAliveStatus": 1,
        "requestPriority": "",
        "httpProtocol": "HTTP/3",
        "region": "Louisiana",
        "regionCode": "LA",
        "asOrganization": "LUS Fiber",
        "metroCode": "642",
        "postalCode": "70503"
      }
    },
    "response": {
      "status": 200
    }
  },
  "id": 1
}
```

You'll notice the log messages, on top, with a handy timestamp as well. By the way, note how the `cf` part includes detailed geographic information about the requestor. 

So that's debugging in the dashboard, how about in your local terminal? Turns out that's rather easy with the `wrangler` CLI, just use:  `npx wrangler tail X` where `X` is the name of your Worker. So for me, that's `npx wrangler tail randomnumber`.

Once it's running, just hit your API again and you'll immediately see results. 

<p>
<img src="https://static.raymondcamden.com/images/2023/08/debug5.jpg" alt="Log output in the console" class="imgborder imgcenter" loading="lazy">
</p>

While I like the level of detail in the dashboard, I see myself using the console version much more as it's focused on just the actual logs. 

That's it! Let me know what you think, and enjoy the video version below.

<iframe width="560" height="315" src="https://www.youtube.com/embed/SFWdpL3--rM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>

Photo by <a href="https://unsplash.com/@tcdinger?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Timo C. Dinger</a> on <a href="https://unsplash.com/photos/Oo3L5fL1lBU?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  