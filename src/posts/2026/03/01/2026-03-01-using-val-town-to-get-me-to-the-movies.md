---
layout: post
title: "Using Val Town to Get Me to the Movies"
date: "2026-03-01T18:00:00"
categories: ["javascript"]
tags: ["serverless"]
banner_image: /images/banners/cat_movie.jpg
permalink: /2026/03/01/using-val-town-to-get-me-to-the-movies
description: Using Val Town and TMDB for Movie Releases
---

My wife and I both love going to the movies, but sometimes a few months will go by without us making it out there. Mostly we just forget what's coming out and don't realize till it's already on a streaming app. I thought it would be nice to build a tool that could help remind me of upcoming movie releases so we can make our theater going more of a consistent habit. To accomplish this, I used the [The Movie Database APIs](https://developer.themoviedb.org/docs/getting-started) and [Val Town](https://www.val.town/).

## The First Version

Before I even considered building a tool like this, I investigated the TMDB reference to see how easy it was to get upcoming releases. Turns out, there've got an endpoint just for that: [Upcoming Movies](https://developer.themoviedb.org/reference/movie-upcoming-list) If you carefully read the docs, you'll see this is just a shortcut to the more flexible [Discover](https://developer.themoviedb.org/reference/discover-movie) endpoint, but as it was out of the box, it worked fine for me. The only tweak I had to do was add the `US` region. 

This simple function handled everything for me:

```js
async function getUpcomingMovies() {
	let resp = await fetch('https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=1&region=US', {
		headers: {
			'Authorization': `Bearer ${TMDB_KEY}`,
			'accept':'application/json'
		}
	});
	let data = await resp.json();
	return data;
}
```

With the help of [Oat](https://oat.ink/), I built a simple HTML table rendering the results. I started with this HTML:

```html
<html>
	<head>
	</head>
	
	<body data-theme="dark">
		<div class="container">
		<h1>Upcoming Movies</h1>		
		
			<div id="movieDisplay" class="mb-4"></div>
			
		</div>
	</body>
</html>
```

And then a bit of JavaScript (this is everything *except* the function I just shared above):

```js
let $movieDisplay, $title;

document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	$movieDisplay = document.querySelector('#movieDisplay');
	$title = document.querySelector('h1');
	
	let movies = await getUpcomingMovies();
	let html = '';
	
	movies.results.forEach((m,x) => {
		console.log(x,m);
		if(x === 0) {
			html += '<div class="row mt-4">';
		} else if(x % 3 === 0) {
			html += '</div><div class="row mt-4">';
		}
		html += `
<div class="col-4">
<article class="card">
  <header>
    <h3>${m.title}</h3>
  </header>
  <p>${m.overview}</p>
	<img src="https://image.tmdb.org/t/p/w300/${m.poster_path}">
  <footer class="flex gap-2 mt-4">
	Releases ${m.release_date}
  </footer>
</article>		
</div>
		`;
	});

	$movieDisplay.innerHTML = html;
	
	$title.innerHTML += ` (From ${movies.dates.minimum} to ${movies.dates.maximum})`;
}
```

You can check out the running demo here:

<p class="codepen" data-theme-id="dark" data-height="500" data-pen-title="Upcoming Movies" data-default-tab="result" data-slug-hash="ogzNBVL" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/ogzNBVL">
  Upcoming Movies</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

You will notice, probably, it depends on when you run this, that some movies have release dates in the past. These are re-releases so the release date value is accurate, if confusing at first. I considered removing these, it would be simple enough to just compare the date to the current date, but both my wife and I have enjoyed watching re-releases so I kept it in. 

By the way, we are both *super* excited about the Peaky Blinders movie. 

## Creating the Reminder in Val Town

The next bit was trivial - the only real issue I had was just being somewhat rusty with Val Town. I began by creating a new val, just for the movie logic. The only real change is that I'm getting my key from an environment variable rather than hard coding as I did in the CodePen above. (The key is a read only key so I don't have any concerns there.) 

The next bit was to add a val and specify the cron trigger. I then imported the first val, crafted my HTML (a bit simpler than the CodePen demo), and emailed it. Val Town supports emailing yourself on the free plan, and that was perfect for my needs. You can see all the code here:

```js
import { getUpcomingMovies } from "./main.ts";
import { email } from "https://esm.town/v/std/email";

// Learn more: https://docs.val.town/vals/cron/
export default async function (interval: Interval) {
  const movies = await getUpcomingMovies();
  let html = "";

  movies.results.forEach((m, x) => {
    html += `
    <h3>${m.title}</h3>
	<img src="https://image.tmdb.org/t/p/w185/${m.poster_path}" style="align:left">
    <p>
    ${m.overview}
    </p>
    <p>
	Releases ${m.release_date}.
    </p>
    <hr>`;
  });

  await email({
    subject: "Upcoming Movie Releases",
    html,
  });
}
```

I specified Sunday at noon, but ran a few quick tests to confirm:

<p>
<img src="https://static.raymondcamden.com/images/2026/03/movie1.png" loading="lazy" alt="Sample email" class="imgborder imgcenter">
</p>

You can check out the complete project here: <https://www.val.town/x/raymondcamden/UpcomingMovies>
