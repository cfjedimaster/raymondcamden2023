---
layout: post
title: "Building a Mastodon Bot with Cloudflare Workers"
date: "2023-08-14T18:00:00"
categories: ["serverless"]
tags: ["cloudflare","mastodon"]
banner_image: /images/banners/superheroes.jpg
permalink: /2023/08/14/building-a-mastodon-bot-with-cloudflare-workers
description: How to build a simple Mastodon bot for Cloudflare Workers
---

I can't go a day (or two) without building a bot of some sort, and last week was no exception. I've been a fan of the [Marvel API](https://developer.marvel.com) for nearly a decade now and one of my favorite examples of it is my [random comic book cover](https://botsin.space/@randomcomicbook) bot. I thought I'd use the Marvel API as a way to build *another* bot, but this time on the [Cloudflare Workers](https://workers.cloudflare.com/) platform. Here's how I did it.

## The Architecture

So obviously I'm using Cloudflare Workers, but I decided to make this project a two-step process. In my [last post](https://www.raymondcamden.com/2023/08/11/connecting-cloudflare-workers-with-service-bindings), I shared how you can "connect" one Worker to another via service bindings. Obviously, this is practical for reuse, and while it may be a bit overkill for this, I wanted to put what I learned in the last post in practice. My project's two workers are:

1) A scheduled Worker that makes use of their [Cron triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) support. This worker will be run on a schedule, call the second Worker for its data, and then post to Mastodon.

2) A Worker that wraps calls to the Marvel API, specifically one to get a random character. 

The latter of the two is the simpler one, so let's start with that.

## Using the Marvel API for Character Information

So, much like my 'random comic book' logic, I get a random Marvel character by:

* Figure out the total number of characters. I did this using their interactive tester and making note of the total number of results. As of August 2023, that number is 1562. Here's an example of that output:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/marvel1.jpg" alt="Interactive API tester showing total number of results" class="imgborder imgcenter" loading="lazy">
</p>

* Then simply call the character endpoint with a limit of one and an offset of a random number in that range. 

For the most part, it's all relatively simple, except Marvel requires you to sign your API requests. This was a minor sticking point for me as my previous Node.js code didn't work on Cloudflare and I had to switch to Web Crypto, which was nicely documented here: <https://developers.cloudflare.com/workers/runtime-apis/web-crypto/#web-crypto>.

Here's the entirety of the Worker:

```js
// Based on checking the API (in Aug 2023) to see how the max number of characters
const CHAR_TOTAL = 1562;

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getSuperHero(privateKey, publicKey) {

    let selected = getRandomInt(0, CHAR_TOTAL);
    let url = `https://gateway.marvel.com:443/v1/public/characters?limit=1&apikey=${publicKey}&offset=${selected}`;

    // add hash
    let ts = new Date().getTime();
    let myText = new TextEncoder().encode(ts + privateKey + publicKey);

    let hash = await crypto.subtle.digest({
        name:'MD5'
    }, myText);

    // Credit: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
    const hexString = [...new Uint8Array(hash)]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    url += '&hash='+encodeURIComponent(hexString)+'&ts='+ts;

    let resp = await fetch(url);
    let data = await resp.json();
    return data.data.results[0];
}

export default {
    async fetch(request, env, ctx) {
        const PRIVATE_KEY = env.MARVEL_PRIVATE_KEY;
        const PUBLIC_KEY = env.MARVEL_PUBLIC_KEY;
        let hero = await getSuperHero(PRIVATE_KEY, PUBLIC_KEY);
        console.log(`I got the hero ${hero.name}`);

        return new Response(JSON.stringify(hero), {
            headers: {
                'Content-Type':'application/json;charset=UTF-8'
            }
        });
    },
};
```

By the way, notice the `console.log`? Later this week I'll show how that works in production. In case you're curious, here's what that JSON response looks like. It randomly selected one of my favorite characters, Galactus. In order to save on space, I removed *many* items from the arrays of data.

```json
{
    "id": 1009312,
    "name": "Galactus",
    "description": "",
    "modified": "2014-09-30T16:47:03-0400",
    "thumbnail": {
        "path": "http://i.annihil.us/u/prod/marvel/i/mg/5/03/528d31a791308",
        "extension": "jpg"
    },
    "resourceURI": "http://gateway.marvel.com/v1/public/characters/1009312",
    "comics": {
        "available": 236,
        "collectionURI": "http://gateway.marvel.com/v1/public/characters/1009312/comics",
        "items": [
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/comics/12638",
                "name": "Alpha Flight (1983) #10"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/comics/12639",
                "name": "Alpha Flight (1983) #100"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/comics/4788",
                "name": "Annihilation (2006) #1"
            },

        ],
        "returned": 20
    },
    "series": {
        "available": 112,
        "collectionURI": "http://gateway.marvel.com/v1/public/characters/1009312/series",
        "items": [
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/series/2116",
                "name": "Alpha Flight (1983 - 1994)"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/series/3613",
                "name": "Annihilation (2006 - 2007)"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/series/1864",
                "name": "Annihilation: Heralds of Galactus (2007)"
            }
        ],
        "returned": 20
    },
    "stories": {
        "available": 259,
        "collectionURI": "http://gateway.marvel.com/v1/public/characters/1009312/stories",
        "items": [
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/stories/694",
                "name": "Cover #694",
                "type": "cover"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/stories/898",
                "name": "Fantastic Four (1998) #520",
                "type": "cover"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/stories/899",
                "name": "1 of 5 - Galactus",
                "type": "interiorStory"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/stories/922",
                "name": "Fantastic Four (1998) #518",
                "type": "cover"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/stories/923",
                "name": "AVENGERS DISASSEMBLED TIE-IN! \"FOURTITUDE\" PART 2 (OF 3) With public opinion of the FF at an all-time low and with all of Manhat",
                "type": "interiorStory"
            }
        ],
        "returned": 20
    },
    "events": {
        "available": 9,
        "collectionURI": "http://gateway.marvel.com/v1/public/characters/1009312/events",
        "items": [
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/events/229",
                "name": "Annihilation"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/events/234",
                "name": "Avengers Disassembled"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/events/318",
                "name": "Dark Reign"
            },
            {
                "resourceURI": "http://gateway.marvel.com/v1/public/events/302",
                "name": "Fear Itself"
            }
        ],
        "returned": 9
    },
    "urls": [
        {
            "type": "detail",
            "url": "http://marvel.com/comics/characters/1009312/galactus?utm_campaign=apiRef&utm_source=fe877c0bf61f995fc8540d9eac4704f1"
        },
        {
            "type": "wiki",
            "url": "http://marvel.com/universe/Galactus?utm_campaign=apiRef&utm_source=fe877c0bf61f995fc8540d9eac4704f1"
        },
        {
            "type": "comiclink",
            "url": "http://marvel.com/comics/characters/1009312/galactus?utm_campaign=apiRef&utm_source=fe877c0bf61f995fc8540d9eac4704f1"
        }
    ]
}
```

Notice the `thumbnail` property is both a path and extension. Here's our lovely world devourer.

<p>
<img src="https://static.raymondcamden.com/images/2023/08/marvel2.jpg" alt="Picture of Galactus" class="imgborder imgcenter" loading="lazy">
</p>

Now on to the next Worker.

## The Scheduled Tooter

I love that subhead. So the next Worker is responsible for running on a schedule and actually doing the Mastodon posting. The [Cloudflare docs](https://developers.cloudflare.com/workers/configuration/cron-triggers/) cover how these are set up and how you can test. For the most part, this just plain worker. The biggest difference in the code is that you have a `scheduled` handler, not `fetch`. Here's a barebones Worker for scheduled execution.

```js
export default {
    async scheduled(event, env, ctx) {


    },
};
```

And your schedule is defined in the `wrangler.toml` file. In this case, every two hours:

```
[triggers]
crons = ["0 */2 * * *"] 
```

The first issue I ran into was how to connect this worker to the first one. In the [last blog post](https://www.raymondcamden.com/2023/08/11/connecting-cloudflare-workers-with-service-bindings), you'll see it's rather simple:

```js
const backResponse = await env.backlogic.fetch(request.clone());
```

But, this expects an incoming `fetch` request, a HTTP-driven Worker. There isn't a request in a Cron-triggered worker. I [asked](https://community.cloudflare.com/t/cron-trigger-and-executing-another-worker/543879/4) on the Cloudflare forums and got help from the most Internet nickname ever, [Cyb3r-Jak3](https://community.cloudflare.com/u/cyb3r-jak3/summary). The fix is to simply make an empty (mostly) Request object like so:

```js
let heroRequest = await env.randomsuperhero.fetch(new Request('http://127.0.0.1'));
let hero = await heroRequest.json();
```

Next, I prepare my data for my toot:

```js
/*
Generate the text for the toot.
I'm using the 'detail' link which is not always the best, better than the wiki though :( 
*/
let toot = `
Your random Marvel superhero of the moment is: ${hero.name}.
More information here: ${hero.urls[0].url}
`;

let image = `${hero.thumbnail.path}.${hero.thumbnail.extension}`;
```

This is where I should point out that while my random comic book cover bot is *great*, the character information is - unfortunately - a bit slim, especially for obscure characters. To be clear, I don't mean a lack of information, but a lot of 404s and no images. Honestly, I almost punted on this as a source of data, but figured I'd let it go and see how it looks after a while "in the wild." 

Now, at this point, I've got the text for my toot, as well as the image url. I had intended to make use of the npm module I'd used in the past, [mastodon-api](https://www.npmjs.com/package/mastodon-api), however when I included this in my Worker, I got compatibility errors with the Workers environment. It didn't seem like an easy workaround and I almost gave up when I thought, why not actually look at their [API documentation](https://docs.joinmastodon.org/client/intro/) and try using it without a wrapper? 

Creating a "toot" was incredibly simple:

```js
let data = new FormData();
data.append('status', toot);

let resp = await fetch('https://botsin.space/api/v1/statuses', {
    body:data,
    method:'post',
    headers:{
        'Authorization':`Bearer ${KEY}`
    }
});
```

Literally 10 lines or so of code. I was pleasantly surprised. I then looked into the image aspect. Like Twitter, if you want to associate an image with a toot, you first upload the image, get the ID, and then associate it with the new message. 

To do this, I needed to first get the bits from the URL on Marvel's side and then send that to Mastodon. In the past, I would have simply saved the image to `/tmp`, but I don't think Cloudflare supports that. Instead, I did everything in memory. This took me the longest time, so hopefully this code can help others. 

```js
async function uploadMedia(url, key) {
    // first, grab the bits of the url
    let imgreq = await fetch(url);
    let blob = new Blob([await imgreq.blob()]);

    let data = new FormData();
    data.append('file', blob);

    let mediaupload = await fetch('https://botsin.space/api/v2/media', {
        body:data,
        method:'post',
        headers:{
            'Authorization':`Bearer ${key}`
        }
    });

    return await mediaupload.json();

}
```

Woot. Ok, with that in play, here's the updated toot code (I love saying toot):

```js
let toot = `
Your random Marvel superhero of the moment is: ${hero.name}.
More information here: ${hero.urls[0].url}
`;

let image = `${hero.thumbnail.path}.${hero.thumbnail.extension}`;
let mediaOb = await uploadMedia(image, KEY);

let data = new FormData();
data.append('status', toot);
data.append('media_ids[]', mediaOb.id);

let resp = await fetch('https://botsin.space/api/v1/statuses', {
    body:data,
    method:'post',
    headers:{
        'Authorization':`Bearer ${KEY}`
    }
});
```

And voila - magic:

{% stoot "botsin.space", "110882198234133362" %}

This is Alex Power, part of Power Pack, a favorite of mine when I was a teenager, and unfortunately, the detail links to a 404. :( 

All in all, this is kind of par for the course for Cloudflare Workers. I hit a few snags, learn how Cloudflare does things, and then it all just works. I know I said this before, but I'm absolutely digging the Cloudflare developer experience.

If you want to follow the bot, you can find the account at <https://botsin.space/@myrandomsuperhero>. The source code for generating the random hero may be found here: <https://github.com/cfjedimaster/cloudflareworkers-demos/tree/main/randomsuperhero>. The source for the cron/Mastodon Worker may be found here: <https://github.com/cfjedimaster/cloudflareworkers-demos/tree/main/randomsuperherobot>

Photo by <a href="https://unsplash.com/@yuliamatvienko?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Yulia Matvienko</a> on <a href="https://unsplash.com/photos/kgz9vsP5JCU?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  