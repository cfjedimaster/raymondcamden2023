---
layout: post
title: "Testing Live Content Collections in Astro V6"
date: "2026-03-11T18:00:00"
categories: ["development"]
tags: ["javascript","astro"]
banner_image: /images/banners/live-audience.jpg
permalink: /2026/03/11/testing-live-content-collections-in-astro-v6
description: Using Live Content in an Astro app.
---

Yesterday, [Astro V6](https://astro.build/blog/astro-6/) formally launched. I say "formally" as it's been available to test for a little while, but with me still being pretty new to Astro I've kept to the main release only. Now that V6 is the default, I thought it was time to dig into it a bit. One feature in particular stood out as being really useful to me - [live content collections](https://docs.astro.build/en/guides/content-collections/#live-content-collections). One of the reasons I've been digging Astro so much is that it nicely straddles the SSG world and Node.js server worlds. When building your app, you can make logical decisions about what should be done at build time versus what should be done dynamically. It's like having Express and Eleventy rolled into one solution. 

Astro already let you easily use live data in your application. The "multi RSS into one" app I shared last week (["Using Astro for a Combined RSS View and Generator"](https://www.raymondcamden.com/2026/03/03/using-astro-for-a-combined-rss-view-and-generator)) is an example of that. What Live Content Collections provides is a way to have on demand data while still using Astro's "content collection" metaphor. 

To test this, I created an app that wrapped the [TMDB API](https://developer.themoviedb.org/docs/getting-started) to provide the following features:

* A home page that rendered a list of movie genres.
* A detail page for each genre showing recently released movies in that genre.

Here's how I built it.

## The Live Loader

The [docs](https://docs.astro.build/en/guides/content-collections/#live-content-collections) are a great guide to how this feature works and you should absolutely spend some time there, but at a high level, this feature requires:

* A loader script that handles returning all items in your collection or one particular item.
* A definition file for your app that defines all the live loaders. 

Let's start with the later. Unlike static content collections which are defined in `content.config.ts`, Astro looks like live collections in `live.config.ts`. Here's mine:

```js
// Define live collections for accessing real-time data
import { defineLiveCollection } from 'astro:content';
import { genreLoader } from './loaders/tmdbloader';

const genres = defineLiveCollection({
  loader: genreLoader({
    apiKey: process.env.TMDB_API_KEY!
  }),
});

export const collections = { genres };
```

There isn't much here as I've only got one loader. Let's now take a look at that loader:

```js
import type { LiveLoader } from 'astro/loaders';

interface Genre {
  id: string;
  name: string;
}

interface EntryFilter {
  id: string;
}

export function genreLoader(config: { apiKey: string }): LiveLoader<Genre, EntryFilter, never> {
  return {
    name: 'genre-loader',
    loadCollection: async () => {
      try {

        let genreReq = await fetch('https://api.themoviedb.org/3/genre/movie/list', {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`, 
            'accept':'application/json'
          }
        });

        let genreData = await genreReq.json();
        console.log(`Got ${genreData.genres.length} genres`);
        return {
          entries: genreData.genres.map((g:Genre) => ({
            id: g.id,
            data: g,
          })),
        };
      } catch (error) {
        console.log('------------- ERROR --------');
        return {
          error: new Error('Failed to load genres ', { cause: error }),
        };
      }
    },
    loadEntry: async ({ filter }) => {
      console.log('loadEntry called with filter', filter);
      
      try {
        let movieReq = await fetch(`https://api.themoviedb.org/3/discover/movie?region=US&language=en-US&with_genres=${filter.id}&sort_by=primary_release_date.desc`, {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`, 
            'accept':'application/json'
          }
        });

        let movieData = await movieReq.json();
        console.log(`Loaded movies for ${filter.id}`);
        return {
          id: filter.id,
          data: movieData.results
        }

      } catch (error) {
        return {
          error: new Error('Failed to load movies', { cause: error }),
        };
      }

    },
  };
}
```

Per the docs, your loader needs to define a name, a `loadCollection` method that returns an array, and a `loadEntry` method that returns an object representing one part of your collection. For me, this came down to hitting the TMDB [genre list for movies API](https://developer.themoviedb.org/reference/genre-movie-list) and then following up with the [discover movies API](https://developer.themoviedb.org/reference/discover-movie) that filtered to the genre. (As well as English movies and sorted by release date.)

## Using the Live Collection

I first used the collection in my home page, `index.astro`:

```html
---
export const prerender = false; 

import BaseLayout from '../layouts/BaseLayout.astro';
import { getLiveCollection } from 'astro:content';

const { entries } = await getLiveCollection('genres');
---

<BaseLayout pageTitle="List of Genres">

	<ul>
		{ entries.map((genre:any) => 
			<li><a href={"genre/" + genre.id + "?l=" + genre.data.name}>{genre.data.name}</a></li>
		)}
	</ul>

</BaseLayout>
```

This is pretty much the exact same way I'd use a static collection. Get the entries - iterate - done. For details, you'll note I'm linkking to "genre/X?l=NAME" for each genre. I created `pages\genre\[id].astro` to support that. You'll notice I'm passing the name of the genre in the query string. That's just so I can use it for display purposes. Here's the code:

```html
---
export const prerender = false; 

import BaseLayout from '../../layouts/BaseLayout.astro';
import { getLiveEntry } from 'astro:content';
const { entry, error } = await getLiveEntry('genres', Astro.params.id);

if (error) {
  return Astro.rewrite('/404');
}

const title = Astro.url.searchParams.get("l");
---

<BaseLayout pageTitle={title}>

    <div class="movieWrapper">
        { entry.data.map((movie:any) => 
            <article class="movie">
                <h3>{movie.title}</h3>
                <p>
                    {movie.overview}
                </p>
                <p>
                    Releases {movie.release_date}
                </p>
                { movie.poster_path ?
                <p><img src={"https://image.tmdb.org/t/p/w300/"+movie.poster_path}></p> : ''
                }
            </article>
        )}
    </div>

</BaseLayout>
```

And... that's it. I fired it up, ran it, and it worked perfectly. After adding the Netlify adapter, I pushed it up here: <https://tmdb-movie-browser-v6.netlify.app/>

## But wait...

This isn't the most complex example of course, and I was ready to write up the blog post when I noticed something interesting in the V6 post - [route caching](https://astro.build/blog/astro-6/#experimental-route-caching). This is still marked as experimental so I'm not sure I'd use it in a production app, but it looked super easy so I thought I'd give it a try. 

In both pages, I added this to my front matter:

```js
Astro.cache.set({
  maxAge: 120, // Cache for 2 minutes
  swr: 60, // Serve stale for 1 minute while revalidating
});
```

And modified my `astro.config.mjs` to load it:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import { memoryCache } from 'astro/config';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
    adapter: netlify(),
    experimental: {
        cache: { provider: memoryCache() },
    },
});
```

And... it did nothing! Complete failure! Astro sucks! 

After taking a minute to chill out, I looked closer at the [docs](https://docs.astro.build/en/reference/experimental-flags/route-caching/) for this feature and noticed this important line (emphasis mine):

<blockquote>
Use `cache.enabled` to check whether a cache provider is configured and active.
This returns false when no provider is configured, or in <u style="color:red">development mode:</u>
</blockquote>

I killed my locally running Astro app and did this:

```bash
npm run build
npm run preview
```

That was the first time I'd done that with an Astro app and it worked perfectly - and - the caching worked perfectly as well. Literally a line of code to each page and the work was done!

## Show Me the Code (and More Stuff)

If you want to see everything, the repo is here: <https://github.com/cfjedimaster/astro-tests/tree/main/tmdb-movie-browser-v6>

As a quick note - a "live" view of movie genres is **not** the most sensible example of this feature. Most likely the movie genre data itself changes incredibly rarely. But this goes back to what I said above - I really dig that Astro would make it easy to have build time data (genres) and live data (moves in that genre) with minimal effort on my part. 

Let me know what you think, and if you are already an Astro user, have you moved to V6 yet?

Photo by <a href="https://unsplash.com/@wansan_99?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Wan San Yip</a> on <a href="https://unsplash.com/photos/people-sitting-on-chair-inside-room-ID1yWa1Wpx0?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
