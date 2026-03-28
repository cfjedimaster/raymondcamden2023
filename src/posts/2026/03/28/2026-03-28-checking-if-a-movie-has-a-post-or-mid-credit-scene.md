---
layout: post
title: "Checking if a Movie has a Post or Mid Credit Scene"
date: "2026-03-28T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/movies.jpg
permalink: /2026/03/28/checking-if-a-movie-has-a-post-or-mid-credit-scene
description: A simple web app that lets you know if a movie has stingers in the credits.
---

Tell me if you done this before - you're sitting in a movie theater after it's ended and want to know if you should stay for a mid, or post-credit scene (also called a stinger). You open your phone, google, and end up a web page that has five gigs of ads or so and then thirty to forty paragraphs of text talking about the movie before they finally get around to actually answering the question. Yeah, I hate that too. I always tell myself, next time I'll google ahead of time so I'll know before going in, but I never do. If this bugs you, I built a web app that literally only tells you if the movie has these stingers - and nothing more. No context, no description of the movie you literally just saw, just a simple yes or no. If you don't care how it was built, just go here: <https://canhaspostcredit.raymondcamden.com/>

## How It's Built

Still here? Cool. The app is incredibly simple. I made use of the wonderful [SimpleCSS](https://simplecss.org/) for my design and then made use of the [TMDB API](https://developer.themoviedb.org/docs/getting-started). The TMDB APIs are pretty easy to use, but finding out how to get this information did take a bit of digging. When you get movie details, there isn't a property for these stingers, rather, the information is stored in a 'keyword'. Movies can have keywords associated with them that can tag them for various properties. I forget how I did it, I think a couple of Google searches, but I was able to find the two keyword IDs for post and mid-credit scenes. They were 179430 and 179431. 

Given that, you can search for movies with keywords, but that's not what I'd be doing in a movie theater - instead I'd be searching for a movie. The [movie search API](https://developer.themoviedb.org/reference/search-movie) can return movies based on user input, but does not return keywords. So I had to combine two approaches:

* Do a search on the user's input
* For each result, get the details on the movie and include the keywords.

I'll share all the code below, but here's the main search function:

```js
async function doSearch() {
	let term = $term.value.trim();
	if(term === '') return;
	console.log(`search for ${term}`);
	$searchBtn.setAttribute('disabled', 'disabled');
	$results.innerHTML = '<i>Searching for matches...</i>';
	
	let movieReq = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(term)}&include_adult=false&language=en-US`, {
		headers: {
			'Accept':'application/json', 
			'Authorization': `Bearer ${TMDB_KEY}`
		}
	});
	let movies = (await movieReq.json()).results;

	let resultHTML = '<h2>Results</h2>';

	if(movies.length > 0) {
		let requests = [];
		movies.forEach(m => {
			requests.push(getMovie(m.id));
		});
	
		let results = await Promise.all(requests);
		console.log('DONE', results);
	
		results.forEach(r => {
			resultHTML += `
			<div class="result">
			${r.title} (${r.release_date})<br>
			Mid Credit Scene: <strong>${hasMidCreditScene(r)? 'Yes':'No'}</strong><br>
			Post Credit Scene: <strong>${hasPostCreditScene(r)? 'Yes':'No'}</strong>
			</div>
			`;
		});
	} else resultHTML += '<p>No matches found.</p>';
	
	$results.innerHTML = resultHTML;
	$searchBtn.removeAttribute('disabled');
}
```

You can see the initial search followed by the request to get details for each. I'm using an array of requests that are then tied to a `Promise.all` call to gather the results when done. 

To get details, it's a basic API call, but I do include the query parameter to ask for keywords:

```js
async function getMovie(id) {

	let req = await fetch(`https://api.themoviedb.org/3/movie/${id}?append_to_response=keywords&language=en-US`, {
		headers: {
			'Accept':'application/json', 
			'Authorization': `Bearer ${TMDB_KEY}`
		}
	});
	let movie = await req.json();
	return movie;
}
```

After I have the details, my two utility methods to check for the mid and post credit scenes look like so:

```js
function hasMidCreditScene(m) {
	return m.keywords.keywords.some(k => k.id === 179431);
}

function hasPostCreditScene(m) {
	return m.keywords.keywords.some(k => k.id === 179430);
}
```

You may be wondering why the code uses `keywords.keywords`. Me too. Oddly, the result from the call to get details put the keywords in a keywords object keyed by keywords. So... yeah, `keywords.keywords`. 

And that's it. CodePen allows you to deploy to a host with a custom domain (see their [docs](https://blog.codepen.io/docs/pens/deployment/#custom-domains)) and it was easy to setup a subdomain CNAME for my main domain. You can check out all the code below, and if you fork it, let me know!

<p class="codepen" data-theme-id="dark" data-height="500" data-pen-title="CanHasPostCredit" data-version="2" data-default-tab="result" data-slug-hash="jEMYjLQ" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/editor/cfjedimaster/pen/019d2f61-480c-7c90-a84e-584c3f9da768">
  CanHasPostCredit</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>


