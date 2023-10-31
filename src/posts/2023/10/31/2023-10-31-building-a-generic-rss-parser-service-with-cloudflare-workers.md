---
layout: post
title: "Building a Generic RSS Parser Service with Cloudflare Workers"
date: "2023-10-31T18:00:00"
categories: ["javascript"]
tags: ["cloudflare","serverless"]
banner_image: /images/banners/cat_laptop.jpg
permalink: /2023/10/31/building-a-generic-rss-parser-service-with-cloudflare-workers
description: Building a simple RSS parser API with Cloudflare Workers
---

About once every three months I'll write a quick JavaScript demo and attempt to fetch someone's RSS feed... and then remember that the *vast* majority of RSS feeds don't specify a CORS header to allow remote scripts to load them. I know this - and yet I still tend to forget. I thought it would be kind of fun to build a serverless API via [Cloudflare Workers](https://workers.cloudflare.com/) to handle loading, parsing, and returning a RSS feed with CORS allowed. I figured this would be pretty easy, but I ran into a snag right away.

## Workers and NPM Modules

Cloudflare Workers is Node.js compatible... with some issues. Cloudflare has a [documentation](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) page on it addressing what you may run into, and for me, my main issue is with older npm modules. 

As it turns out, my goto Node RSS parser, [rss-parser](https://www.npmjs.com/package/rss-parser), is somewhat old. While it was updated seven months ago, it hasn't really changed much because, honestly, RSS hasn't changed much.

While attempting to use it in Cloudflare Workers, I got an error when it tried to instantiate `XMLHttpRequest`. This was the old way of doing network stuff in JavaScript, long since replaced by `Fetch`. 

Unfortunately, I don't think there's a way around this, which means... parsing RSS by hand. Ick. But - let me show you what I came up with.

## Version One

For my first version, I began with figuring out how I was going to parse the XML without rss-parser. I found [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser) and it worked well in Cloudflare's environment. Here's the initial version of my "generic" RSS parser hard coded to just use my own RSS feed.

```js
import { XMLParser } from 'fast-xml-parser';

const options = {
    ignoreAttributes:false
}
const parser = new XMLParser(options);

export default {
    async fetch(request, env, ctx) {
        let req = await fetch('https://www.raymondcamden.com/feed_slim.xml');
        let xmlData = await req.text();
        let data = parser.parse(xmlData);
        let feed = reformatData(data.feed);
    
        return new Response(JSON.stringify(feed), {
            headers: {
                'Content-Type':'application/json;charset=UTF-8',
                'Access-Control-Allow-Origin':'*'
            }
        });

    },
};

// I make some opinionated changes to the XML result specific for RSS feeds.
function reformatData(d) {
    if(d.link && d.link.length) {
        d.link = d.link.map(fixLink);
    }
    if(d.entry && d.entry.length) {
        d.entry.forEach(e => {
            if(e.link) e.link = fixLink(e.link);

            if(e.content) {
                let newContent = {};
                newContent.text = e.content['#text'];
                newContent.type = e.content['@_type'];
                e.content = newContent;
            }

            if(e.category && e.category.length) {
                e.category = e.category.map(c => {
                    return c['@_term'];
                });
            }
        });
    }
    return d;
}

function fixLink(l) {
    let result = {};
    if(l['@_href']) result.href = l['@_href'];
    if(l['@_rel']) result.rel = l['@_rel'];
    if(l['@_type']) result.type = l['@_type'];
    if(l['@_title']) result.type = l['@_title'];
    return result;
}
```

If you look at the main `fetch` function for the Worker, it loads my XML and passes it to the fast-feed-parser library. This returns a JavaScript-ready version of the XML... that's still a bit messy. I wrote two 'support' functions, `reformatData` and `fixLink` to attempt to bring some sanity to the result. To be clear, there was nothing 'broken' about how the XML was parsed, but XML is pretty complex and while the resulting JSON I ended up with was 'correct', I wanted to simplify it quite a bit. 

The last thing my code does is return the result with the appropriate headers. Here's an example of the output where I've reduced the number of entries to two:

```json
{
    "title": "Raymond Camden",
    "link": [
        {
            "href": "https://www.raymondcamden.com/feed_slim.xml",
            "rel": "self",
            "type": "application/atom+xml"
        },
        {
            "href": "https://www.raymondcamden.com/",
            "rel": "alternate",
            "type": "text/html"
        }
    ],
    "subtitle": "Father, husband, developer relations and web standards expert, and cat demo builder.",
    "updated": "2023-10-26T15:09:33+00:00",
    "author": {
        "name": "Raymond Camden",
        "email": "raymondcamden@gmail.com"
    },
    "id": "https://www.raymondcamden.com/feed_slim.xml",
    "generator": "Eleventy",
    "entry": [
        {
            "id": "https://www.raymondcamden.com/2023/10/24/using-cloudflare-ai-workers-to-add-translations-to-pdfs",
            "title": "Using Cloudflare's AI Workers to Add Translations to PDFs",
            "updated": "2023-10-24T18:00:00+00:00",
            "link": {
                "href": "https://www.raymondcamden.com/2023/10/24/using-cloudflare-ai-workers-to-add-translations-to-pdfs",
                "rel": "alternate",
                "type": "Using Cloudflare's AI Workers to Add Translations to PDFs"
            },
            "content": {
                "text": "Late last month, Cloudflare <a href=\"https://blog.cloudflare.com/workers-ai/\">announced</a> new AI features in their (already quite stellar)<a href=\"https://workers.cloudflare.com/\">Workers</a> platform. I've been a big fan of their serverless feature (see my <a href=\"https://www.raymondcamden.com/tags/cloudflare\">earlier posts</a>) so I was quite excited to give this a try myself. Before I begin, I'll repeat what the Cloudflare folks said in their announcement: &quot;Usage is not currently recommended for production apps&quot;. So with that in mind, remember that what I'm sharing today may change in the future.",
                "type": "html"
            },
            "category": [
                "cloudflare",
                "serverless",
                "pdf services",
                "adobe",
                "generative ai",
                "javascript"
            ],
            "author": {
                "name": "Raymond Camden",
                "email": "raymondcamden@gmail.com"
            }
        },
        {
            "id": "https://www.raymondcamden.com/2023/10/22/links-for-you",
            "title": "Links For You",
            "updated": "2023-10-22T18:00:00+00:00",
            "link": {
                "href": "https://www.raymondcamden.com/2023/10/22/links-for-you",
                "rel": "alternate",
                "type": "Links For You"
            },
            "content": {
                "text": "Hello friends and welcome to another post of links I hope you find interesting. In a few days, I'll be heading out to <a href=\"https://apiworld.co/\">API World</a> for my last trip of the year and my last in-person event. (I'll be giving the same talk for API World again later this month in their virtual event.) I just got back from <a href=\"https://2023.allthingsopen.org/\">All Things Open</a> which was an <em>incredible</em> conference that I'm happy I was able to participate in, and I'd absolutely recommend it for next year. Let's get to the links!",
                "type": "html"
            },
            "category": [
                "links4you",
                "misc"
            ],
            "author": {
                "name": "Raymond Camden",
                "email": "raymondcamden@gmail.com"
            }
        }
    ],
    "@_xmlns": "http://www.w3.org/2005/Atom"
}
```

Not bad, a bit verbose for sure, but it gets the job done.

## Version Two

In the second version, all I did was simply make the actual feed a URL parameter. Here's the code that changed:

```js
const { searchParams } = new URL(request.url);
let feedURL = searchParams.get('feed');

if(!feedURL) {
    return new Response(JSON.stringify({
        error:'feed not passed in url'
    }), {
        headers: {
            'Content-Type':'application/json;charset=UTF-8',
            'Access-Control-Allow-Origin':'*'
        }
    });
}

let req = await fetch(feedURL);
```

I'm looking in the querystring for the `feed` value. So for example:

```
http://127.0.0.1:8787/?feed=https://www.raymondcamden.com/feed_slim.xml
```

### Version Three

So, for the third and final form of this little RSS wrapper, I added another small wrinkle, which of course, ended up blowing up into something bigger! I thought that if I were to deploy something like this to production, most likely I'd want a sanity check on the RSS URLs being parsed. I'm not building a (hypothetical) service for anyone and everyone, so having limits is ok. I decided on a simple "ALLOW" list and set it up like so:

```js
const ALLOW_LIST = [
    'https://www.raymondcamden.com/feed_slim.xml',
    'https://recursive.codes/blog/feed',
    'https://scottstroz.com/feed.xml'
]

// later in code...

if(ALLOW_LIST.indexOf(feedURL) === -1) {
    return new Response(JSON.stringify({
        error:'feed not allowed'
    }), {
        headers: {
            'Content-Type':'application/json;charset=UTF-8',
            'Access-Control-Allow-Origin':'*'
        }
    });
}
```

Simple enough, but it's here where I remember why I liked `rss-parser` so much. The second RSS URL, `https://recursive.codes/blog/feed`, uses a different format from the first and third. I could simply return it as parsed, but as I had done a bit of 'data reformatting' initially, I thought it made sense to continue doing so. I began with a simple IF block:

```js
let feed = {};
if(data.feed) feed = reformatData(data.feed);
if(data.rss) feed = reformatData(data.rss);
```

And then did some major work in `reformatData`.

```js
function reformatData(d) {

    if(d.link && d.link.length) {
        d.link = d.link.map(fixLink);
    }

    /*
    Final xformation... 
    */
    let result = {
        feed: {}, 
        entries: {}
    }
    
    // feed is metadata about the feed
    if(d.channel) {
        result.feed = {
            title: d.channel.title,
            link: d.channel.link
        }

        result.entries = d.channel.item.map(i => {
            return {
                title: i.title, 
                link: i.link, 
                published: i.pubDate,
                content: i['content:encoded']
            }
        });
    } else {
        result.feed = {
            title: d.title
        }

        if(d.link) {
            let alt = d.link.filter(d => d.rel === 'alternate');
            if(alt.length) result.feed.link = alt[0]['href'];
            else {
                // accept the link with _no_ rel
                result.feed.link = d.link.filter(d => !d.rel)[0]['href'];
            }
        }

        result.entries = d.entry.map(e => {

            if(e.link) e.link = fixLink(e.link);

            if(e.content) {
                let newContent = {};
                newContent.text = e.content['#text'];
                newContent.type = e.content['@_type'];
                e.content = newContent;
            }

            return {
                title: e.title, 
                published: e.updated, 
                content: e.content.text,
                link: e.link.href
            }

        });

    }

    return result;
}
```

Basically, based on the two types of RSS (which should be RSS and Atom, yes there is an RSS type named RSS), I filter to a small set of feed metadata (title and link), and then the content is returned in an `entries` feed, filtered down to a title, the date published, the content, and link. I completely ignore the categories, although I could probably add that back in and document it as something optional. 

However the result is "similar" RSS results for different RSS feeds. There's one final bit I *should* do but didn't, and that's normalizing the `pubDate` value. If I have a slow week, I'll maybe post that as an update. Here's sample output, again with me filtering the entries to just two:

```json
{
    "feed": {
        "title": "Raymond Camden",
        "link": "https://www.raymondcamden.com/"
    },
    "entries": [
        {
            "title": "Using Cloudflare's AI Workers to Add Translations to PDFs",
            "published": "2023-10-24T18:00:00+00:00",
            "content": "Late last month, Cloudflare <a href=\"https://blog.cloudflare.com/workers-ai/\">announced</a> new AI features in their (already quite stellar)<a href=\"https://workers.cloudflare.com/\">Workers</a> platform. I've been a big fan of their serverless feature (see my <a href=\"https://www.raymondcamden.com/tags/cloudflare\">earlier posts</a>) so I was quite excited to give this a try myself. Before I begin, I'll repeat what the Cloudflare folks said in their announcement: &quot;Usage is not currently recommended for production apps&quot;. So with that in mind, remember that what I'm sharing today may change in the future.",
            "link": "https://www.raymondcamden.com/2023/10/24/using-cloudflare-ai-workers-to-add-translations-to-pdfs"
        },
        {
            "title": "Links For You",
            "published": "2023-10-22T18:00:00+00:00",
            "content": "Hello friends and welcome to another post of links I hope you find interesting. In a few days, I'll be heading out to <a href=\"https://apiworld.co/\">API World</a> for my last trip of the year and my last in-person event. (I'll be giving the same talk for API World again later this month in their virtual event.) I just got back from <a href=\"https://2023.allthingsopen.org/\">All Things Open</a> which was an <em>incredible</em> conference that I'm happy I was able to participate in, and I'd absolutely recommend it for next year. Let's get to the links!",
            "link": "https://www.raymondcamden.com/2023/10/22/links-for-you"
        }
    ]
}
```

You can see this in action here: <https://rsstojson.raymondcamden.workers.dev/?feed=https://www.raymondcamden.com/feed_slim.xml>

The full source code may be found here: <https://github.com/cfjedimaster/cloudflareworkers-demos/tree/main/rsstojson>


