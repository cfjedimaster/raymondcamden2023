---
layout: post
title: "Using Netlify Edge and Blob Support to Investigate Website Traffic"
date: "2024-04-06T18:00:00"
categories: ["development","serverless"]
tags: ["javascript"]
banner_image: /images/banners/scroll.jpg
permalink: /2024/04/06/using-netlify-edge-and-blob-support-to-investigate-website-traffic
description: A look at my (failed) attempt to diagnose a weird traffic issue.
---

For some time now, I've relied on my Netlify Analytics report to keep track of how well my site is doing, what content is popular, and so forth. I was a Google Analytics user for over ten years, but when they updated the UI, I saw red every time I tried to use it. Netlify Analytics is super simple and quick. (My only real complaint is that it's limited to 30 days, but I've got free access to the feature so I'm happy to not care about that.) I complement Netlify Analytics with [GoatCounter](https://www.goatcounter.com/) as well. Netify's analytics show much more traffic than Goat, and I figure the truth is somewhere in the middle, and again, I'm fine with that. 

What's odd though is that for the past year, two old blog posts have consistently had the most page views:

<p>
<img src="https://static.raymondcamden.com/images/2024/04/n1.jpg" alt="Page view report" class="imgborder imgcenter" loading="lazy">
</p>

Ignoring hits to the home page, the top two page views are two blog posts related to ColdFusion, oAuth, and Facebook. You can read them [here](https://www.raymondcamden.com/2013/04/01/ColdFusion-and-OAuth-Part-1-Facebook/) and [here](https://www.raymondcamden.com/2013/04/03/ColdFusion-and-OAuth-Part-2-Facebook) if you would like, but both are now **eleven** years old. There's absolutely no reason for these pages to be getting this kind of traffic. Neither of these show up on my GoatCounter report so I've got no real clue. 

My guess is, of course, bots, but... why? I honestly have no clue. If they were trying for a DOS attack, they aren't really tring that hard. As an attempt to investigate what's going on, I decided to take a stab at using a [Netlify Edge](https://docs.netlify.com/edge-functions/overview/). Why an Edge Function? They can inspect an incoming request and transform the response. While I don't need to transform anything, being able to put up a function to run *before* a URL, log something, and continue, felt like exactly what I'd need. I began with this:

```js

export default async (request, context) => {

	console.log(context);
	return;
}

export const config = { path: "/2013/04/03/ColdFusion-and-OAuth-Part-2-Facebook" };
```

The `path` portion at the end matches the most popular 'weird' post and the default function simply logs out the `context` value and returns. This has the result of just rendering the page as is, but when testing locally, I could see the function running so I knew it was set up correctly. The [context object](https://docs.netlify.com/edge-functions/api/#netlify-specific-context-object) has some interesting data in it I thought would be good for my tracking. 

For that, I turned to another Netlify feature, [Blob](https://docs.netlify.com/blobs/overview/) storage. This is a simple key/value system that lets you easily persist data for a site. Each site can have one or more stores and each has its own dictionary of values. I modified my Edge function like so:

```js
import { getStore } from "@netlify/blobs";

export default async (request, context) => {

	const tracker = getStore('tracker');

	let packet = {
		ref: request.headers.get('referer'),
		ua: request.headers.get('user-agent'),
		ip: context.ip, 
		geo: context.geo,
		time:new Date()
	};

	let log = await tracker.get('log', { type:'json' });
	if(!log) log = [];
	log.push(packet);
	await tracker.setJSON('log', log);

	return;
}

export const config = { path: "/2013/04/03/ColdFusion-and-OAuth-Part-2-Facebook" };
```

I begin by opening up a store called 'tracker'. I'm storing the HTTP referrer, user agent, ip, geo information, and the current time. I read in the existing value for `log` from the store, initialize it as an array if need be, and then add to the end. Finally, I store the value back in. Super easy and quick to add. I deployed this and was able to confirm data was being stored using Netlify's CLI. 

I could have stopped there, but I thought it might be nicer to have a quicker way to get the data. For that, I wrote a quick serverless function:

```js
import { getStore } from "@netlify/blobs";

export default async () => {

	const tracker = getStore('tracker');
	let result = await tracker.get('log', { type:'json' });
	return Response.json(result);	
};

export const config = {
  path: "/api/log"
};
```

This simply grabs the value and returns it as JSON. You can see this yourself if you want, here: <https://www.raymondcamden.com/api/log>

Again, I could have stopped here. But then I figured, why not whip up a quick script to grab the data and dump it out to my console. 

```js
import { Table } from 'voici.js'
import UAParser from 'ua-parser-js';
/*
let parser = new UAParser('Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 OPR/89.0.4447.51');
console.log(parser.getResult());
*/
let data = await (await fetch('https://www.raymondcamden.com/api/log')).json();
console.log(`There are ${data.length} items in the log.`);
//console.log(data[14]);
const table = new Table(data, {
  header: {
    maxWidth:60,
    include:['ip','browser','location','ref','ip','time'],
    dynamic: {
      location: (row) => {
          let r = '';
          if(row['geo']['city']) r += `${row['geo']['city']},`;
          if(row['geo']['subdivision']) r += ` ${row['geo']['subdivision']['name']},`;
          r += ` ${row['geo']['country']['name']}`;
          return r;
      },
      browser: (row) => {
        let b = (new UAParser(row['ua'])).getResult();
        if(!b.browser.name) return row['ua'];
        let bs = `${b.browser.name} ${b.browser.major}, ${b.os.name}`;
        if(b.os.version) bs += ` ${b.os.version}`;
        return bs;
      }
    }
  }
});

table.print();
```

This script makes use of [voici.js](https://voici.larswaechter.dev/), a table printing library. I also make use of a user agent parser. I take my initial data and render each row with a bit of logic to make location and the browser report better. The end result is... a lot of text. I've had the Edge Function running for maybe 4 days and it's at nearly 600 records. Here's a dump if you wish to see:

<style>
.gist {
	overflow: auto;
}
.gist .blob-wrapper.data {
   max-height: 400px;
   overflow: auto;
}
</style>

<script src="https://gist.github.com/cfjedimaster/2cdbb0a73d9e18c4c1d1a8da44936674.js"></script>

And now I know... nothing. The referrer value is either blank, my blog, or the post itself. There's nothing consistent in the location or any other value! Honestly I didn't learn a thing... except I did get to play with a Netlify Edge function and their blob support, so I'll take that as a win. 

If anyone else has an idea of what could be causing the traffic, leave me a comment below please!