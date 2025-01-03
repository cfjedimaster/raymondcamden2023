---
layout: post
title: "Building a Bluesky AI Sentiment Analysis Dashboard"
date: "2025-01-03T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_bluesky3.jpg
permalink: /2025/01/03/building-a-bluesky-ai-sentiment-analysis-dashboard
description: A simple tool to monitor the sentiment of keywords on Bluesky
---

As the "Great Social Network Wars" carry on (my term, not anyone else), I'm finding myself more and more enjoying Bluesky. I do more posting on Mastodon, but Bluesky reminds me a lot more of early Twitter. Threads is... ok, but has felt too corporate. I can't even remember the last time I checked it. Earlier this week, I was poking around the Bluesky API and was **incredibly** happy to discover that their [Search API](https://docs.bsky.app/docs/api/app-bsky-feed-search-posts) does not require a key and supports CORS, which means a simple client-side application could make use of it. In the past I had built similar tools for Twitter, back when it had a decent API, and I thought it might be fun to build something for Bluesky, specifically, a way to monitor sentiment of keywords in real time. Here's what I created.

## What the App Will Do

At a high level, the app lets you:

* Enter a keyword to check
* On a schedule, get recent posts for that keyword
* For each post, analyze the sentiment of the text
* Get and return an average
* Optionally let the user delete the keyword from the dashboard

For my app, I kept it incredibly simple, and ugly, and there's a number of UI/UX things that could be improved, but let's look at how I got it together.

## The Search API

The first thing I did was play a bit with the [Search API](https://docs.bsky.app/docs/api/app-bsky-feed-search-posts). It contains multiple different arguments but at minimum, requires a search query. 

As a minimum example, this will return posts with my name:

<https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=Raymond+Camden>

The top level result is an array of posts. Here's two as an example:

```json
{
    "uri": "at://did:plc:mw7drluj7dtqybvzkcqkworx/app.bsky.feed.post/3lelx76yjxb2u",
	"cid": "bafyreidgtoclrufosj6x6bqd3yxlqgtgrwvgo2m4ulmb7j4qc4scqtciha",
	"author": {
		"did": "did:plc:mw7drluj7dtqybvzkcqkworx",
		"handle": "florianrappl.bsky.social",
		"displayName": "Florian Rappl",
		"avatar": "https://cdn.bsky.app/img/avatar/plain/did:plc:mw7drluj7dtqybvzkcqkworx/bafkreig7q5kols7gwkz3ey524nuiws73s2knkn6lcj7ir3lbvnczki5xxi@jpeg",
		"labels": [],
		"createdAt": "2024-11-23T08:57:28.845Z"
	},
	"record": {
		"$type": "app.bsky.feed.post",
		"createdAt": "2024-12-31T11:32:55.067Z",
		"facets": [
			{
				"features": [
					{
						"$type": "app.bsky.richtext.facet#link",
						"uri": "https://www.raymondcamden.com/2024/12/18/summarizing-with-transformersjs"
					}
				],
				"index": {
					"byteEnd": 106,
					"byteStart": 34
				}
			}
		],
		"reply": {
			"parent": {
				"cid": "bafyreifx3dzyzrzknjcdo3hgk5mx3fphmn3wiuuauq4xvk4ixdobbetbyq",
				"commit": {
					"cid": "bafyreihoieerqoxprnlqn46j3a3efleazasmsh4gzpdcijspj7fhjdl6au",
					"rev": "3lelx752qn32d"
				},
				"uri": "at://did:plc:mw7drluj7dtqybvzkcqkworx/app.bsky.feed.post/3lelx752gul2d",
				"validationStatus": "valid"
			},
			"root": {
				"cid": "bafyreifx3dzyzrzknjcdo3hgk5mx3fphmn3wiuuauq4xvk4ixdobbetbyq",
				"commit": {
					"cid": "bafyreihoieerqoxprnlqn46j3a3efleazasmsh4gzpdcijspj7fhjdl6au",
					"rev": "3lelx752qn32d"
				},
				"uri": "at://did:plc:mw7drluj7dtqybvzkcqkworx/app.bsky.feed.post/3lelx752gul2d",
				"validationStatus": "valid"
			}
		},
		"text": "Summarizing with Transformers.js (https://www.raymondcamden.com/2024/12/18/summarizing-with-transformersjs) by Raymond Camden"
	},
	"replyCount": 0,
	"repostCount": 0,
	"likeCount": 0,
	"quoteCount": 0,
	"indexedAt": "2024-12-31T11:32:55.845Z",
	"labels": []
},
{
	"uri": "at://did:plc:zha3q6pd5zhbr7dmgp25b3x5/app.bsky.feed.post/3lczlj4cy5k23",
	"cid": "bafyreicjkluug5pg4waj7dmakmygpzxbelxhnvk3b2vepqxhbly35iwafa",
	"author": {
		"did": "did:plc:zha3q6pd5zhbr7dmgp25b3x5",
		"handle": "codepo8.bsky.social",
		"displayName": "Chris Heilmann",
		"avatar": "https://cdn.bsky.app/img/avatar/plain/did:plc:zha3q6pd5zhbr7dmgp25b3x5/bafkreie35iy2fwn25ufakobqmqko4dnveyl2d47ijzx55kbc73gbbvczjq@jpeg",
		"labels": [],
		"createdAt": "2023-06-17T10:17:43.112Z"
	},
	"record": {
		"$type": "app.bsky.feed.post",
		"createdAt": "2024-12-11T10:50:36.582Z",
		"embed": {
			"$type": "app.bsky.embed.video",
			"aspectRatio": {
				"height": 1920,
				"width": 1080
			},
			"video": {
				"$type": "blob",
				"ref": {
					"$link": "bafkreiex2dxpm4xbsmqk6d7zx7n3dnclufdowso52woj6odss5vj2oadqy"
				},
				"mimeType": "video/mp4",
				"size": 963604
			}
		},
		"langs": [
			"en"
		],
		"text": "Proof that @wearedevelopers live events are really live and that Raymond Camden is a trooper…"
	},
	"embed": {
		"$type": "app.bsky.embed.video#view",
		"cid": "bafkreiex2dxpm4xbsmqk6d7zx7n3dnclufdowso52woj6odss5vj2oadqy",
		"playlist": "https://video.bsky.app/watch/did%3Aplc%3Azha3q6pd5zhbr7dmgp25b3x5/bafkreiex2dxpm4xbsmqk6d7zx7n3dnclufdowso52woj6odss5vj2oadqy/playlist.m3u8",
		"thumbnail": "https://video.bsky.app/watch/did%3Aplc%3Azha3q6pd5zhbr7dmgp25b3x5/bafkreiex2dxpm4xbsmqk6d7zx7n3dnclufdowso52woj6odss5vj2oadqy/thumbnail.jpg",
		"aspectRatio": {
			"height": 1920,
			"width": 1080
		}
	},
	"replyCount": 0,
	"repostCount": 0,
	"likeCount": 2,
	"quoteCount": 0,
	"indexedAt": "2024-12-11T10:50:38.652Z",
	"labels": []
}
```

The API supports pagination parameters, but for my usage, a default set of 25 items felt like a good enough sample size. As you can see, quite a bit of data is returned, but for each post, you can get to the text via the `record.text` key. I did add one parameter to my search code, and that was adding `lang=en`, to focus on English. Modify or remove that if you need to. Here's a minimal code sample in JavaScript:

```js
let topic = 'python';

let req = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(topic)}&lang=en`);
let data = await req.json();
```

## Getting Sentiment

To perform the sentiment analysis, there's a large variety of options here, but I really wanted to stick to client-side code only. For me that would come down to two options, [Transformers.js](https://huggingface.co/docs/transformers.js/en/index) or Chrome's new built-in AI functionality. I first covered Transformers.js a few weeks ago, [Using Transformers.js for AI in the Browser](https://www.raymondcamden.com/2024/12/03/using-transformersjs-for-ai-in-the-browser), and I really liked how easy, and usually quick, sentiment analysis was done. With that in mind, I decided on Transformers.js. 

## The App

Ok, so as a warning, this isn't terribly pretty, but let's take a look at the app. In HTML, it's rather simple, a place to enter keywords, a status div, and a results div:

```html
<p>
<label for="newTopic">Enter New Topic: 
	<input id="newTopic"></label> <button id="addTopic">Add Topic</button>
</p>

<div id="results">
</div>

<div id="status"></div>
```

Most of the work is done in JavaScript, and while I'll share the complete demo below, let me share the pertinent bits. The code to handle adding a topic is basic DOM manipulation, adding a string to an array of topics called, `topics`. In my startup routine, I do handle loading in and storing my core Transformers.js model:

```js
$status.innerHTML = 'Loading sentiment analyzer...';
classifier = await pipeline('sentiment-analysis');
$status.innerHTML = '';
```

The important part is the actual analysis which is done on a schedule. That core function is below:

```js
async function checkTopics() {
	console.log('checkTopics');
	if(topics.length === 0) return;
	$status.innerHTML = 'Loading Bluesky data for topics.';
	let responses = [];
	topics.forEach(t => {
		responses.push(getSentiment(t));
	});
	console.log('fired off calls for each topic');
	let results = await Promise.all(responses);
	
	console.log('all done', results);
	$status.innerHTML = '';
	renderResults(results);
	setTimeout(checkTopics, INTERVAL);
}
```

I basically fire off calls to my analysis function and store the resulting promise in an array, and when done, pass the results off for rendering. 

Here's how I get the sentiment:

```js
async function getSentiment(topic) {
	console.log(`Get sentiment for ${topic}`);
	let sentimentTotal = 0;
	
	let req = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(topic)}&lang=en`);
	let data = (await req.json()).posts;
	console.log(`Posts found: ${data.length}`);
	for(let i=0; i<data.length; i++) {
		let sentiment = (await classifier(data[i].record.text))[0];
		//console.log(`Sentiment for ${data[i].record.text} is ${JSON.stringify(sentiment)}`); 
		if(sentiment.label === 'NEGATIVE') sentiment.score = -1 * sentiment.score;
		sentimentTotal += sentiment.score;
	}
	let avgSentiment = sentimentTotal / data.length;
	console.log(`Total sentiment, ${sentimentTotal}, avg ${avgSentiment}`);
	return { topic: topic, sentiment: avgSentiment, total:data.length,  generated: new Date() };
}
```

Basically, hit the Bluesky search API, and for each result, I call my classifier object and add the result to a total I can do an average on. Each result contains a label, `POSITIVE` or `NEGATIVE` (in theory, `NEUTRAL` is possible too, but I never saw it). Each result also has a score, which is always positive, but I flip it negative so that in theory, my average will range between -1 and 1. I also return a bit of metadata in the result like the orignal topic, how many items were found, and when it was generated.

The last bit, the rendering, is fairly simple. The only real oddity here is that it's possible for someone to remove a topic *while* analysis is happening, so I did a quick check to remove that if it happens.

```js
function renderResults(results) {
	
	/*
	It's possible a user clicks remove while we were loading 
	stuff, so we'll do a quick sanity check.
	*/
	results = results.filter(r => topics.includes(r.topic));
	
	let s = '';
	results.forEach(r => {
		
			s += `
			<div class="result" data-topic="${r.topic}">
<h2>Sentiment Analysis for: ${r.topic}</h2>
<p>
Average was <strong>${r.sentiment>0?'POSITIVE':'NEGATIVE'}</strong> (Average Score: ${r.sentiment} over ${r.total} items)<br>
Generated: ${dateFormat(r.generated)}
</p>
<p>
<button class="removeBtn" data-topic="${r.topic}">Remove from Analysis</button>
</p>
			</div>`;
	});

	$results.innerHTML = s;
	document.querySelectorAll('button.removeBtn').forEach(d => {
		d.addEventListener('click', removeItem);
	});
}
```

I've embedded the complete application below, but you can also open up the live demo here: <a href="https://codepen.io/cfjedimaster/live/jENaEMV" target="_blank">https://codepen.io/cfjedimaster/live/jENaEMV</a>.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="jENaEMV" data-pen-title="BS Search Panel" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/jENaEMV">
  BS Search Panel</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## Everything Wrong...

That's a scary heading. ;) So, there's quite a bit that could be improved here to make this a nicer dashboard. I had considered using [Shoelace](https://shoelace.style/) to make it prettier, and that would be great I think. Also, I'd like to add a proper list of topics being checked so you can see them all the time, remove, add, etc. Right now if you add X as a topic, you won't actually *see* it till the first result is returned. Users may think it's broken, so that's not good. 

But - my biggest question is - does anyone find this useful? I'd absolutely be willing to put some love into this and launch it as a proper web app, but I'd like to know first if folks would actually use it. ;) Leave me a comment below!

