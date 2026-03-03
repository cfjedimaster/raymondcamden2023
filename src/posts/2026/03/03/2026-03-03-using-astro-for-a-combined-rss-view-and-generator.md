---
layout: post
title: "Using Astro for a Combined RSS View and Generator"
date: "2026-03-03T18:00:00"
categories: ["development"]
tags: ["javascript","astro"]
banner_image: /images/banners/bowie.jpeg
permalink: /2026/03/03/using-astro-for-a-combined-rss-view-and-generator
description: How I used Astro and Webflow Cloud to create a combined product update view
---

Ok, before I start, let me just clarify this demo is kind of a remix of my [earlier post](http://raymondcamden.com/2026/02/02/building-an-rss-aggregator-with-astro) about building an RSS aggregator in Astro. I did run into some interesting issues this time around though and I figured it was worth a share. 

At Webflow, our [developer docs](https://developers.webflow.com/) are separated into different sections per product. For most of our developer products, we've got changelogs. So for example, here's the [changelog for our Data APIs](https://developers.webflow.com/data/v2.0.0/changelog) and here's one for our [MCP server](https://developers.webflow.com/mcp/v1.0.0/changelog). We try to be good stewards of our developer community and ensure we document everything as clearly as possible. 

Each of our changelogs has an RSS feed as well so if you're using a feed reader, it's an easy to keep up to date. However, there isn't *one* unified RSS feed for all of our developer products. Given that I just worked on [RSS parsing in Astro](http://raymondcamden.com/2026/02/02/building-an-rss-aggregator-with-astro), I thought this would be a fun little utility to build. 

## The Application

My application is built in [Astro](https://astro.build/) (of course) and runs on the Webflow platform via [Webflow Cloud](https://developers.webflow.com/webflow-cloud/intro). It does two things - present a UI of a combined view of RSS feeds from our docs and serves up it's own RSS feed. 

Here's a look at the UI:

<p>
<img src="https://static.raymondcamden.com/images/2026/03/app1.jpg" loading="lazy" alt="App view showing all our developer updates" class="imgborder imgcenter">
</p>

Nothing too earth shattering but it does exactly what I need - let me see all our developer updates at once. 

If you don't care about the code and just want to see it running, hop on over to where I deployed it: <https://raymonds-webflow-cloud-space.webflow.io/chachachachanges>

Yes, I was thinking Bowie when crafting that URL. 

## The Code

Alright, so the app is a grand total of one HTML page and two additional routes. The HTML page makes use of [SimpleCSS](https://simplecss.org/) for UI, but don't forget Webflow Cloud apps can adopt the UI of their core site. In this case I didn't have a site (well, I did, but I'm not using it for anything) so SimpleCSS made it... err... simple. 

The home page isn't too complex, especially with the layout abstracted out, but all it's doing is hitting my endpoint for the data and then rendering:

```html
---
import Layout from '../layouts/Layout.astro';
---

<Layout>

  <style is:global>
  .card {
    border: 1px solid var(--border, #d8d8d8);
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 2rem;
  }
  .card-header {
    background-color: var(--accent-bg, #f2f2f2);
    padding: 1rem;
    border-bottom: 1px solid var(--border, #d8d8d8);
  }
  .card-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }
  .card-body {
    padding: 1rem;
  }
  .card-footer {
    padding: 1rem;
    border-top: 1px solid var(--border, #d8d8d8);
  }

  #content {
    padding-top: 25px;
  }
  </style>

  <div id="content">
    <p>
    <i>Loading greatness...</i>
    </p>
  </div>

  <script>
  
  document.addEventListener('DOMContentLoaded', async () => {

    let $content = document.querySelector('#content');
    // I had issues with the relative pathing - this SHOULD work. In WFC, I'm always at (root)/(path) with no / at the dn
    let itemReq = await fetch (document.URL + '/changes.json');
    let items = await itemReq.json();

    let html = '';
    items.forEach(i => {
      html += `
      <div class="card">
        <div class="card-header">
          <h2>${i.title}</h2>
        </div>
        <div class="card-body">
          ${i.content}
          <p><strong>Published:</strong> ${formatDate(i.pubDate)}</p>
        </div>
        <div class="card-footer">
          <a href="${i.link}" target="_blank">Read More</a>
        </div>
      </div>
      `;
    })
    console.log(items);

    $content.innerHTML = html;
  });

  function formatDate(d) {
    d = new Date(d);
    return Intl.DateTimeFormat('en-US', {
      dateStyle: 'long'
    }).format(d);
  }
  </script>
 
</Layout>
```

When the document loads, I hit my endpoint, which I defined in `changes.json.js`:

```js
import getFeeds from './getfeed.js';

export async function GET({ request }) {

    let items = await getFeeds();

    return new Response(JSON.stringify(items), {
        status: 200,
        headers: {
        "Content-Type": "application/json",
        },
    });
}
```

Yeah, not much there, that's because the core logic of "hit X RSS feeds and combine them" in defined in a helper function. The reason why will make sense in a sec. Here's that code, which makes use of the [rss-parser](https://www.npmjs.com/package/rss-parser) package:

```js
import Parser from 'rss-parser';
import { feeds } from './feeds.config.js';
let parser;

export default async () => {

    parser = new Parser();
    let items = [];

    let reqs = [];
    for (const feedUrl of feeds) {
        reqs.push(parseURL(feedUrl.url));
    }

    const results = await Promise.allSettled(reqs);
    for (const result of results) {
        if (result.status === 'fulfilled') {
            const feed = result.value;
            console.log(`Fetched feed: ${feed.title} with ${feed.items.length} items.`);
            let newItems = [];
            feed.items.forEach(item => {
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

    return items;
};

async function parseURL(u) {
    let xmlReq = await fetch(u);
    let xml = await xmlReq.text();
    return parser.parseString(xml);
}
```

I set the RSS feeds as a config file so I could easily tweak it in the future - it's just an array of feed names and URLs. I expect there's nothing too interesting here, but note `parseURL`. Why am I doing this? 

Webflow Cloud apps run on Cloudflare, and Cloudflare doesn't run the "full" Node environment, which means some packages/code won't work out of the box. I've run into this before, and simply forgot when I was building this app. You can read more about this in our docs, [Node.js compatibility](https://developers.webflow.com/webflow-cloud/environment/nodejs-compatibility), but honestly, the only time this impacted me at Cloudflare was, literally, the `rss-parser` package. It makes use of `http` and Cloudflare wants you to use `fetch` instead. Most modern Node packages do, but you will, from time to time, run into cases like I did here.

Luckily, `rss-parser` supports a "give me the XML string" method so I used `fetch` and and passed the XML string to it. Easy fix once I realized what was going on.

The last part of the app was taking that combined set of items and creating an RSS feed for it. To handle that, I used a npm package named [feed](https://www.npmjs.com/package/feed) which lets you create an RSS feed (of different flavors even) on the fly. I served this from a file named `feed.xml.js`:

```js
import getFeeds from './getfeed.js';
import { Feed } from 'feed';

export async function GET({ request }) {

    let items = await getFeeds();

    const feed = new Feed({
        title:"Combined Webflow Changelog Feed",
    });

    items.forEach(i => {
        feed.addItem({
            title: i.title, 
            id: i.link, 
            link: i.link, 
            content: i.content, 
            date: new Date(i.pubDate)
        })
    });

    return new Response(feed.rss2(), {
        status: 200,
        headers: {
        "Content-Type": "application/rss+xml",
        },
    });
}
```

I should note that the feed package supports a heck of a lot more options for creating RSS feeds than I needed, so keep in mind I did the bare minimum here. You can see this here: <https://raymonds-webflow-cloud-space.webflow.io/chachachachanges/feed.xml>

## Show Me the Code!

Ok, if you want to play with it, don't forget it lives up here, <https://raymonds-webflow-cloud-space.webflow.io/chachachachanges>, and you can see all of the code here: <https://github.com/Webflow-Examples/wfc-chachachachanges> 

Photo by <a href="https://unsplash.com/@chris_designer?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Christina Radevich</a> on <a href="https://unsplash.com/photos/a-red-light-in-a-window-VNmQWlKeskQ?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      