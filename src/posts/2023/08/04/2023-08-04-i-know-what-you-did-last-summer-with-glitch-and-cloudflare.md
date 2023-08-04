---
layout: post
title: "I Know What You Did Last Summer (With Glitch and Cloudflare)"
date: "2023-08-04T18:00:00"
categories: ["javascript"]
tags: ["serverless"]
banner_image: /images/banners/scary-woods.jpg
permalink: /2023/08/04/i-know-what-you-did-last-summer-with-glitch-and-cloudflare
description: Generating random movie titles with Cloudflare, Glitch, and more.
---

Every now and then I get a dumb little idea, and too often, I turn those dumb ideas into little web toys. About five years ago, I discovered 
[Markov chains](https://en.wikipedia.org/wiki/Markov_chain), which in my limited understanding is a deterministic way to guess what would come after some input. A bit like autocomplete for example. If I type, "I like", I'm more likely to type "cats" after that than "yard work". It's fairly complex (see the Wikipedia link above for more details) and perhaps a *tiny* bit like GenAI. For me, I just think it's neat. 

Five years ago I took the excellent [titlegen](https://www.npmjs.com/package/titlegen) npm package, a list of Cure songs, and built a generator for... well Cure songs: [Generating Random Cure Song Titles with Markov Chain](https://www.raymondcamden.com/2018/01/16/generating-random-cure-song-titles). I was thinking about this post and wondered if I could do something with horror movies. Why horror movies? Maybe because it's 200 degrees here and I'm *really* pining for October and Halloween. Either way, I built it! And here's how I did it.

## Getting the Data

In order for my demo to work, I needed data for the Markov chain. For my data I used the *really* simple [TMDB API](https://developer.themoviedb.org/docs). This gives you access to loads of movie and TV data and while I've seen folks use it before, this was the first time I tried it and honestly, I was really impressed with it. To get my data, I hit their `discover` endpoint with these arguments:

* The horror genre (27), per the docs.
* No video (I believe that means direct-to-video) or adult movies.
* Original language as English

The API can only return 20 results per call but supports paging. I decided to use [Cloudflare Workers](https://workers.cloudflare.com/) again because I'm enjoying the platform and knew I could get something up super quick. I want to point out that I'm also using [Glitch](https://glitch.com/) and Glitch absolutely supports server-side code, I just felt more comfortable doing my server-side code in Cloudflare and my front-end in Glitch. 

Ok, so here's the entire worker:

```js
// Horror!
const GENRE = '27';
// cache time of 6 hours
const CACHE = 60 * 60 * 6;

async function getHorrorMovies(key,page=1) {

	let resp = await fetch(`https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&with_genres=${GENRE}&with_original_language=en&page=${page}`, {
		headers: {
			'Authorization':`Bearer ${key}` 
		}
	});
  
  return (await resp.json()).results;
  
}

export default {
	async fetch(request, env, ctx) {

		const APIKEY = env.MOVIEAPI;

		let titles = await env.horrormovies.get('horrormovies');
		if(!titles) {
			let horrorMovies = [];
			const totalPages = 20;
			for(let i=0;i<totalPages;i++) {
			let movies = await getHorrorMovies(APIKEY,i+1);
			horrorMovies = [...horrorMovies, ...movies]
			}
			console.log(`Fetched ${horrorMovies.length} horror movies.`);
			titles = horrorMovies.map(m => m.title);
			await env.horrormovies.put('horrormovies', JSON.stringify(titles), { expirationTtl: CACHE });

		} else titles = JSON.parse(titles);

		return new Response(JSON.stringify(titles), {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
				'Content-Type':'application/json;charset=UTF-8'
			}
		});

	},
};
```

On top, I've got a function that wraps calls to the TMDB API. My worker hits the KV cache (something I'll be blogging about more on Monday, for now, just think of it as a simple key/value caching system) if possible, and if not, grabs 400 movies from the API, filtering out to the just the titles. I cache for 6 hours so the worker can return quicker. Finally, I return the data along with CORS headers so I can use it from another server. You can hit this endpoint here: <https://horrormovies.raymondcamden.workers.dev/>

## Presenting the Data

For the front end, I used [Glitch](https://glitch.com/). I set up my HTML, JavaScript, and CSS there. You can view all the code at the [project](https://glitch.com/edit/#!/random-horror-movie?path=index.html%3A27%3A6) but I'll focus on the JavaScript.

On page load, I fetch my titles from the Cloudflare Worker, and then use titlegen to initialize the ability to generate titles. As I said, their utility package is super simple. Here's the entire JavaScript file:

```js
let $title, generator, $regenBtn;

document.addEventListener('DOMContentLoaded', async () => {
  
  let titlesReq = await fetch('https://horrormovies.raymondcamden.workers.dev/');
  let titles = await titlesReq.json();

  generator = titlegen.create();
  generator.feed(titles);

  $title = document.querySelector('#title');
  $regenBtn = document.querySelector('#regenBtn');

  doTitle();
  
  $regenBtn.addEventListener('click', doTitle);
});

function doTitle() {
  $title.innerText = generator.next();  
}
```

As you can see, it's one line to initialize titlegen, one to input the data, and then just running `next()` to get a new title. 

And that's literally it. Play with the full version here:

<!-- Copy and Paste Me -->
<div class="glitch-embed-wrap" style="height: 650px; width: 100%;">
  <iframe
    src="https://glitch.com/embed/#!/embed/random-horror-movie?path=script.js&previewSize=100"
    title="random-horror-movie on Glitch"
    allow="geolocation; microphone; camera; midi; encrypted-media; xr-spatial-tracking; fullscreen"
    allowFullScreen
    style="height: 100%; width: 100%; border: 0;">
  </iframe>
</div>

Obviously, it doesn't always work, but sometimes the "silly" results are funny as hell:

* Final Destination 5: The Addams Family 2
* You Should Have Eyes
* H.P. Lovecraft's Dracula

I hope you've enjoyed this 100% useless bit of code today! Note that the font I used, while excellent, apparently doesn't support numbers. 

Photo by <a href="https://unsplash.com/@benofthenorth?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Ben Griffiths</a> on <a href="https://unsplash.com/photos/4M5Diy4vr_A?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>.