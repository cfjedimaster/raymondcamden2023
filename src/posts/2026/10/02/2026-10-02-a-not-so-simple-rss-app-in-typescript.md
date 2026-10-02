---
layout: post
title: "A Not-So-Simple RSS App in TypeScript"
date: "2026-10-02T18:00:00"
categories: ["development"]
tags: ["javascript","typescript","alpinejs"]
banner_image: /images/banners/typewriter.jpg
permalink: /2026/10/02/a-not-so-simple-rss-app-in-typescript
description: An RSS aggregator with TypeScript.
---

Ok, I lie, this demo is also pretty simple, but I wanted to break the pattern of the last few posts and at least pretend this example is a bit more complex. As I try to find excuses to write more TypeScript, I thought a great example of that would be a simple RSS aggregator. You hit the site, tell it the feeds you care about, and it renders a date sorted list of entries. 

Because RSS typically can't be parsed in client-side JavaScript (don't know why? ask me below!) so I'd have to make use of a serverless function to proxy the calls (and at the same time, handle turning the XML into JSON). 

Now, to be fair, I had built nearly the same thing back in February: [Building an RSS Aggregator with Astro
](https://www.raymondcamden.com/2026/02/02/building-an-rss-aggregator-with-astro). This let me crib a bit of the work already done. 

For this one, my stack was:

* Vite for the build process
* Alpine on the front end
* TypeScript, as much as possible
* Hosting on Netlify to make the serverless function easier to do
* WebAwesome, which I've used in the previous ones, for the UI

You can test this yourself here: <https://ts-rss-vite.netlify.app/>. The full source is here: <https://github.com/cfjedimaster/typescript-stuff/tree/main/rss-reader-1>. 

I figure yall have seen a few of these posts already, so let me focus on sharing the interesting stuff.

## Run TypeScript Checking

I mentioned in my [last post](https://www.raymondcamden.com/2026/09/26/a-simple-weather-app-in-typescript) that when Vite would reload, it wasn't running the TypeScript checker. It only did this when a build was run. Enabling this checking while in dev mode took two steps.

First, simply add `"strict": true,` to `tsconfig.json`. Funny enough, in years past I can remember removing this when I was trying to get something working in a TypeScript app and I was too lazy to learn or figure it out.

Second, I had to add [vite-plugin-checker](https://www.npmjs.com/package/vite-plugin-checker) to the app and modify `vite.config.ts`.

```js
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig({
  plugins: [checker({ typescript: true })],
});
```

This file doesn't exist by default so it was a net new file for the app. As soon as I did that, if I screwed something up on purpose (ahem, I only make mistakes on purpose), I saw errors in my terminal when Vite was running.

## The Serverless Function

For the backend, I used the `ntl` CLI (this is Netlify's CLI tool) to scaffold a function, which helpfully includes a TypeScript option. For the most part, the code here is a simpler version of what I had done for the Astro site, specifically I didn't bother with BLOB caching. Anyway, here's that function:

```ts
import Parser from 'rss-parser';
import type { Context } from '@netlify/functions';

type FeedItem = {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  feedTitle: string;
};

export default async (request: Request, context: Context) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { Allow: 'POST' },
    })
  }

  try {
    const body: unknown = await request.json()
    const parser = new Parser();

    if (
      typeof body !== 'object' ||
      body === null ||
      !('feeds' in body) ||
      !Array.isArray(body.feeds)
    ) {
      return new Response('Request body must include a feeds array', {
        status: 400,
      })
    }
    console.log('Parsing feeds:', body.feeds);

    let reqs: Promise<any>[] = [];
    let items: FeedItem[] = [];

    for(const feed of body.feeds) {
      reqs.push(parser.parseURL(feed.url));
    }

    const results = await Promise.allSettled(reqs);
    for (const result of results) {
        if (result.status === 'fulfilled') {
            const feed = result.value;
            console.log(`Fetched feed: ${feed.title} with ${feed.items.length} items.`);
            let newItems:any[] = [];
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

  } catch(e) {
    console.log(e);
    return new Response('Request body must be valid JSON', {
      status: 400,
    })
  }
}
```

This is all pretty simple but I liked having the ability to create a custom type for my results. 

I did run into an error after I created the function - and it's one I've seen twice now. Something in what the Netlify CLI does breaks some dependencies and my app fails to run at all. I passed the error to Claude and what it said was:

```
The most likely cause is that adding the Netlify function pulled in an older 
typescript that's now being resolved instead of your project's version. This 
usually happens when a netlify/functions package has its own package.json, 
or when netlify-cli or the functions bundler is running an older tsc from a 
different node_modules.
```

Its suggested fix, `npm i -D typescript@latest`, was enough to correct it. I definitely won't forget this when it happens again.

## What's Next?

This has been so fun, at least for me. I've got my next two ideas ready! (Well, in my head at least. ;)


