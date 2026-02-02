---
layout: post
title: "Building an RSS Aggregator with Astro"
date: "2026-02-02T18:00:00"
categories: ["development"]
tags: ["javascript","astro"]
banner_image: /images/banners/cat_newspaper.jpg
permalink: /2026/02/02/building-an-rss-aggregator-with-astro
description: How I used Astro and Netlify to build a simple RSS Aggregator.
---

This weekend I had some fun building a little Astro site for RSS aggregation. It works by the individual user defining a set of feeds they care about and works with a server-side Astro route to handle getting and parsing the feeds. Here's a quick example. On hitting the site, it notices you haven't defined any feeds and prompts you to do so:

<p>
<img src="https://static.raymondcamden.com/images/2026/02/rss1.jpg" loading="lazy" alt="initial display of app, prompting for you to add a feed" class="imgborder imgcenter">
</p>

Clicking "Manage Feeds" opens up a dialog (my first time using one with native web platform tech!) where you can add and delete RSS feeds:

<p>
<img src="https://static.raymondcamden.com/images/2026/02/rss2.jpg" loading="lazy" alt="dialog to add and delete feeds" class="imgborder imgcenter">
</p>

After you have some specified, the app then calls server-side to fetch and parse the feeds. Items are mixed together and returned sorted by date:

<p>
<img src="https://static.raymondcamden.com/images/2026/02/rss3.jpg" loading="lazy" alt="display of items" class="imgborder imgcenter">
</p>

Not too shabby looking, either. That's thanks to the simple addition of [Simple.css](https://simplecss.org/). Let's take a look at the code.

## The App

The entire application really comes down to two routes. The first being just the home page, which is pretty slim:

```html
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout pageTitle="Your Feeds">

	<div id="content">
	
	</div>

	<dialog id="manageFeedsDialog">
		<button autofocus style="float: right;margin-bottom: 15px">Close</button>
		<table id="feedsTableDialog">
			<thead>
				<tr>
					<th>Feed URL</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
			</tbody>
		</table>

		<p>
			<input type="url" id="feedUrl" placeholder="Enter Feed URL" />
			<button id="addFeedButton">Add Feed</button>
		</p>
	</dialog>

	<script src="/app.js" is:inline></script>

</BaseLayout>
```

The `<BaseLayout>` wrapper just sets up HTML wrapper that would be useful if I had more than one page to be displayed, but even with one such page, I like having the abstraction. Note that the `dialog` element is hidden when initially viewing the page, it only shows up when the `Manage Feeds` button is clicked. For completeness, here it is in `BaseLayout.astro`:

```html
---
import '../css/app.css';

const { pageTitle } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{pageTitle}</title> 
    
    <meta name="generator" content={Astro.generator} />
    <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css">
</head>

<body class="line-numbers">

    <header>
    <h1>RSS Aggregator</h1>
    </header>

    <main>
        <h2>{pageTitle}</h2>
    <slot/>
    </main>

    <footer>
    	<button id="showDialogButton">Manage Feeds</button>
    </footer>

</body>
</html>
```

The fun part comes in the JavaScript. I begin by declaring a few global variables, and setting up the code I want to run when the page loads:

```js
let feeds = [];
let $content, $dialog, $showDialogBtn, $closeDialogBtn, $addFeedBtn, $feedUrl, $feedTableDialog;

document.addEventListener('DOMContentLoaded', async () => {

    $content = document.querySelector('#content');
    $feedTableDialog = document.querySelector('#feedsTableDialog tbody');
    $showDialogBtn = document.querySelector('#showDialogButton');
    $dialog = document.querySelector('#manageFeedsDialog');
    $closeDialogBtn = document.querySelector('#manageFeedsDialog button');
    $addFeedBtn = document.querySelector('#addFeedButton');
    $feedUrl = document.querySelector('#feedUrl');

    $showDialogBtn.addEventListener("click", async () => {
        // before we show the dialog, get our feeds and render to table
        await renderFeedsDialog();
        $dialog.showModal();
    });

    $closeDialogBtn.addEventListener("click", () => {
        loadFeedItems();
        $dialog.close();
    });

    $addFeedBtn.addEventListener("click", async () => {

        if($feedUrl.checkValidity() === false) {
            $feedUrl.reportValidity();
            return;
        }

        const feedUrl = $feedUrl.value;
        if (feedUrl) {
            console.log(`Adding feed: ${feedUrl}`);
            let feeds = await getFeeds();
            feeds.push(feedUrl);
            window.localStorage.setItem('feeds', JSON.stringify(feeds));
            await renderFeedsDialog();
            $feedUrl.value = '';
        }
    });

    loadFeedItems();
});
```

You can see there the event logic to handle showing the dialog as well as the handler for adding a RSS field. As you can see, I'm using `window.localStorage` for storage which means you can leave and come back, and the application will know what feeds you care about. I've got a simple wrapper to get them as well:

```js
async function getFeeds() {
    let f = window.localStorage.getItem('feeds');
    if (f) {
        return JSON.parse(f);
    } else {
        return [];
    }
}
```

Now one quick note. `LocalStorage` is not asynchronous, it's blocking, but I built my function with the idea that in the future, I could switch to IndexDB or another solution entirely. That may be overkill now, but it doesn't hurt anything. 

Here's how I handle rendering the feeds in the dialog, as well as deletions:

```js
async function renderFeedsDialog() {
    let feeds = await getFeeds();
    let content = '';
    feeds.forEach(f => {
        content += `<tr><td>${f}</td><td><button onclick="deleteFeed('${f}')">Delete</button></td></tr>`;
    })
    $feedTableDialog.innerHTML = content;
}

async function deleteFeed(feedUrl) {
    let feeds = await getFeeds();
    feeds = feeds.filter(f => f !== feedUrl);
    window.localStorage.setItem('feeds', JSON.stringify(feeds));
    await renderFeedsDialog();
}
```

Next up is the code that calls for feed items and handles rendering them:

```js
async function loadFeedItems() {
    console.log('Loading feed items...');
    let feeds = await getFeeds();

    if(feeds.length === 0) {
        $content.innerHTML = '<p>No feeds available. Please add some feeds using the button below!</p>';
        return;
    }
    
    $content.innerHTML = '<i>Loading feed items...</i>';
    let qs = new URLSearchParams({
        feeds
    }).toString();

    let items = await fetch(`/loaditems?${qs}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }        
    });
    let data = await items.json();
    console.log('Fetched feed items', data.length);
    let result = '';
    data.forEach(item => {
        result += `<div class="feedItem">
            <h3><a href="${item.link}" target="_blank" rel="noopener">${item.title}</a></h3>
            <p>${snippet(item.content)}</p>
            <p><em>From: ${item.feedTitle} | Published: ${new Date(item.pubDate).toLocaleString()}</em></p>
        </div>`;
    });
    $content.innerHTML = result;
}
```

This is pretty vanilla network calling with `fetch`, although I'll note that I had some qualms about using the query string. There *are* limits to how long that could be, and in theory, I should switch to a `POST` probably. 

The last bit of client-side code is `snippet`, which handles the content of the feed item:

```js
/*
I clean the content from parsing to remove HTML and reduce size
*/
function snippet(content) {
    content = content.replace(/(<([^>]+)>)/gi, ""); // remove HTML tags
    const maxLength = 200;
    if (content.length <= maxLength) {
        return content;
    } else {
        return content.substring(0, maxLength) + '...';
    }
}
```

I should probably move that `maxLength` up top. I'll do so. Eventually. 

## Fetching RSS Items

Now for the fun part, fetching RSS items. For this, I made use of the [rss-parser](https://www.npmjs.com/package/rss-parser) Node package. The logic is relatively simple - given a call to the route with a list of RSS urls, fetch them, parse them, sort them by date, and return, but as an added wrinkle, I made use of [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) for easy caching. Here's the server-side route I built named `loaditems.js`:

```js
import Parser from 'rss-parser';
import { getStore } from "@netlify/blobs";

const TTL = 1000 * 60 * 60; // 1 hour cache 

export async function GET({ request }) {

    const store = getStore('rssagg-store');
    const url = new URL(request.url);
    const feeds = url.searchParams.get('feeds').split(',');
    const parser = new Parser();
    console.log('Feeds requested:', feeds);
    let items = [];

    let reqs = [];
    for (const feedUrl of feeds) {
        // first, do we have this in cache?
        const cacheKey = `feedcache-${encodeURIComponent(feedUrl)}`;
        let cached = await store.get(cacheKey);
        if(cached) {
            cached = JSON.parse(cached);
            // check age
            const now = Date.now();
            if(now - cached.timestamp < TTL) {
                console.log(`Using cached feed for ${feedUrl}`);
                items.push(...cached.items);
            } else {
                console.log(`Cache expired for ${feedUrl}, fetching new data.`);
                reqs.push(parser.parseURL(feedUrl));
            }
        } else {
            console.log(`No cache for ${feedUrl}, fetching data.`);
            reqs.push(parser.parseURL(feedUrl));
        }

    }

    const results = await Promise.allSettled(reqs);
    for (const result of results) {
        if (result.status === 'fulfilled') {
            const feed = result.value;
            console.log(`Fetched feed: ${feed.title} with ${feed.items.length} items.`);
            let newItems = [];
            feed.items.forEach(item => {
                /*
                will use content as a grab all for different fields
                for example, netlify had summary, not content
                */
                let content = item.contentSnippet || item.summary || item.content || '';
                newItems.push({
                    title: item.title,
                    link: item.link,
                    content: content,
                    pubDate: item.pubDate,
                    feedTitle: feed.title
                });
            });

            items.push(...newItems);

            // cache the feed
            const cacheKey = `feedcache-${encodeURIComponent(feed.feedUrl)}`;
            console.log(`Caching feed data for ${feed.feedUrl}`);
            await store.setJSON(cacheKey, {
                timestamp: Date.now(),
                items: newItems
            });
        } else {
            console.error('Error fetching/parsing feed:', result.reason);
        }
    }

    // now sort items by pubDate descending
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    return new Response(JSON.stringify(items), {
        status: 200,
        headers: {
        "Content-Type": "application/json",
        },
    });
}
```

The cache is based on the RSS URL so in theory, if two users come in requesting the same feed, they all get the benefit of the cache. I cache for one hour, which frankly could be a lot more. I blog *a lot* and even I don't usually have more than 2 or 3 a week, so feel free to tweak this as you see fit if you play with the code. 

## Check It Out!

Ok, if you want to try this out yourself, head over to <https://astrorssagg.netlify.app/> and try adding a few feeds. Let me know how it works for you. The complete code of the application may be found here: <https://github.com/cfjedimaster/astro-tests/tree/main/rssagg>

## But Wait... 

Ok, that's all I have to say about the application, and in theory, you can stop reading now, but I **really** want to comment on something. The DX (developer experience) of using Astro on Netlify is incredible. Like, I was in shock at how things "just worked". Multiple times I was *certain* I was going to hit a roadblock, need to configure and tweak something, and honestly, that never happened. Here's what I found.

The first thing I did was add the [Netlify adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/astro/), which comes down to:

```
npx astro add netlify
```

By itself, that was enough, but I wanted my server-side RSS parser to run on the server, which means I had to changeone line in `astro.config.js`. By default, the `defineConfig` looks like this after adding the adapter:

```js
export default defineConfig({
  adapter: netlify()
});
```

I added the `output` parameter:

```js
export default defineConfig({
  output: 'server',
  adapter: netlify()
});
```

That was it, literally. I'm pretty sure I could have specified `server` output just for my one route, but this was the quick and dirty solution. I was sure I'd have to rewrite my code into a Netlify Function, but nope, it just worked. 

Speaking of just working, blob support also just worked. Honestly I'm not even 100% sure I know how. In production, I know it automatically picks up on the right environment settings to associate the blobs with the site. Locally, I've got no clue. It's definitely a *different* store, not the production one, but again, it just plain worked. 

I just want to give a huge shout out to the Astro team, and Netlify, for making this so freaking pleasant!
