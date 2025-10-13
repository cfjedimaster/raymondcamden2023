---
layout: post
title: "I Know What You Did Last Summer (with val town)"
date: "2025-10-08T18:00:00"
categories: ["javascript"]
tags: ["serverless"]
banner_image: /images/banners/halloween-black-cat.jpg
permalink: /2025/10/08/i-know-what-you-did-last-summer-with-val-town
description: An update to my horror themed web app
---

With Halloween a few weeks away, it's officially spooky season. My wife and I usually plan our costumes *months* in advance (mine's been ready since July or so) and we love decorating the house (and yard) with all kind of fun and darkly horrific decorations. Two years ago, I built a great Halloween-themed web app using Glitch and Cloudflare: [I Know What You Did Last Summer (With Glitch and Cloudflare)](https://www.raymondcamden.com/2023/08/04/i-know-what-you-did-last-summer-with-glitch-and-cloudflare)

Unfortunately, [Glitch](https://glitch.com/) is no more. These things happen and I have to thank the Glitch folks for creating an incredibly cool resource and also helping people safely migrate off their platform. One of my projects was the Halloween project from two years ago. While the serverless function was running on Cloudflare, and I could have moved the HTML resources there, I decided to try another platform, [val.town](https://www.val.town/dashboard).

val.town is a service I've played with a few times before (most recently earlier this year with my [park ride timer app](https://www.raymondcamden.com/2025/05/15/finding-your-next-amusement-park-ride-with-apis)) but haven't really dug deep into it. Initially I only considered val.town as a cool serverless host, but you can host complete web apps there as well.  Their [home page](https://www.val.town) cheekily refer to themselves as "Zapier for know-code engineers", which I just love. They've got a [generous free tier](https://www.val.town/pricing) so you can test things out. If you want to learn more, check out their [docs](https://docs.val.town/) and signup. (Tell em I sent you. For every 500 referrals I get a brownie point!) 

Ok, so what web app am I talking about? I won't repeat the entire [previous post](https://www.raymondcamden.com/2023/08/04/i-know-what-you-did-last-summer-with-glitch-and-cloudflare), but the idea was somewhat simple. 

I used a [Markov chain generating](https://en.wikipedia.org/wiki/Markov_chain) library to generate fun new horror movie titles. For example:

<p>
<img src="https://static.raymondcamden.com/images/2025/10/hall1.jpg" alt="Scream 4: Requiem" class="imgborder imgcenter" loading="lazy">
</p>

That design is pretty much the limit of my ability. Hitting reload just keeps generating new titles, like:

* Popeye's Body
* A Quiet Place: Welcome to Zombie Island
* Anacondas: The Long Walk
* In a Zombie Apocalypse
* Children of a Violent Nature

They don't always make sense, but that's part of the fun. In order for the Markov generator to work, I get a list of horror movies using the [TMDB API](https://developer.themoviedb.org/docs). I hit their `discover` endpoint, filter to the horror genre, and specify English movies. 

This gives me the data that's then fed to [titlegen](https://www.npmjs.com/package/titlegen), a JavaScript library that generates titles based on inputs using Markov Chains. 

That's *what* I built - now here's how I migrated it to val.town.

## Serving Static Files

I forget who pointed me to this, but while it was really easy to create a serverless function in val.town and get the endpoint, I wasn't sure how to do static files. This took all of two lines of code:

```js
import { staticHTTPServer } from "https://esm.town/v/std/utils/index.ts";
export default staticHTTPServer(import.meta.url);
```

At this point, any resource in my project could be requested via a normal request. This was in my `main.tsx` and used the URL, <https://raymondcamden--d31a59087a0d11f0917f0224a6c84d84.web.val.run>, so I then added `index.html` and it worked right away. My HTML hasn't changed from the previous post and is pretty minimal - a place to display the title and a button. The JavaScript is also simple - hit the serverless val.town resource that gets my titles:

```js
let $title, generator, $regenBtn;

document.addEventListener("DOMContentLoaded", async () => {

  let titlesReq = await fetch(
    "https://raymondcamden--5f458a2a7a2111f0b4c30224a6c84d84.web.val.run",
  );
  let titles = await titlesReq.json();

  generator = titlegen.create();
  generator.feed(titles);

  $title = document.querySelector("#title");
  $regenBtn = document.querySelector("#regenBtn");

  doTitle();

  $regenBtn.addEventListener("click", doTitle);
});

function doTitle() {
  $title.innerText = generator.next();
}
```

The only real complex aspect was the serverless function. As I mentioned, it was on Cloudflare, so I had to rewrite it a bit for val.town. The only tricky part was figuring out caching, but val.town has [blob storage](https://docs.val.town/std/blob/) so that ended up being simple as well! 

Here's the entire method:

```js
import { blob } from "https://esm.town/v/std/blob";
import process from "node:process";

const APIKEY = process.env.MOVIEAPI;

// Horror!
const GENRE = "27";
// cache time of 6 hours
const CACHE = 60 * 60 * 6 * 1000;

async function getHorrorMovies(key, page = 1) {
  console.log('Running getHorrorMovies, page=',page);
  const resp = await fetch(
    `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&with_genres=${GENRE}&with_original_language=en&page=${page}`,
    {
      headers: {
        "Authorization": `Bearer ${key}`,
      },
    },
  );

  return (await resp.json()).results;
}

export default async function handler(request: Request) {
  let cache = await blob.getJSON("horrormovies");
  let titles;

  if(cache) {
    let age = Date.now() - cache.created;
    console.log('age of cache is ', age);
    if(age < CACHE) {
      console.log('USING CACHE');
      return Response.json(cache.titles)
    }
  }
  
  let horrorMovies = [];
  const totalPages = 20;
  for (let i = 0; i < totalPages; i++) {
    const movies = await getHorrorMovies(APIKEY, i + 1);
    horrorMovies = [...horrorMovies, ...movies];
  }
  console.log(`Fetched ${horrorMovies.length} horror movies.`);
  titles = horrorMovies.map((m) => m.title);
  await blob.setJSON("horrormovies", { titles, created:Date.now() });

  return Response.json(titles);
}
```

You can view the entire project on my val here: <https://www.val.town/x/raymondcamden/randomhorrormovie>. And to save you another click, I've embedded the demo below - enjoy!

<iframe src="https://raymondcamden--d31a59087a0d11f0917f0224a6c84d84.web.val.run/" width="100%" height="700"></iframe>

Photo by <a href="https://unsplash.com/@nika_benedictova?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Nika Benedictova</a> on <a href="https://unsplash.com/photos/black-cat-on-gray-textile-YpZiY2-koE8?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      