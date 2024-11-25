---
layout: post
title: "Automatically Posting to Bluesky on New RSS Items"
date: "2024-11-05T18:00:00"
categories: ["javascript"]
tags: ["pipedream"]
banner_image: /images/banners/cat_bluesky2.jpg
permalink: /2024/11/05/automatically-posting-to-bluesky-on-new-rss-items
description: A look at automating posts to Bluesky when new data is posted to a RSS feed.
---

<div style="background-color: #c0c0c0; padding: 10px">
<strong>Edit on November 25, 2024:</strong> So this post turned out a bit more popular than I expected. :) While working with folks in the comments, two things came about. First, folks needed things spelled out a little bit, so with that in mind, I made a quick Youtube video: <a href="https://www.youtube.com/watch?v=_yp9U-QJgOM">https://www.youtube.com/watch?v=_yp9U-QJgOM</a>. Secondly, a user was running into issues with my code, and it turned out, my own meta tags here for <code>og:description</code> and <code>og:image</code> were using <code>name</code> instead of <code>property</code>. This seemed to work ok in most situations, but wasn't proper. So, I've updated the code here, and the GitHub repo for the workflow, to use that. Thanks to @toothless-666 for helping me debug and @benmillett for pointing out various things as well. You can see the full discussion in the comments below. 
</div>

Hey folks - just a quick warning. This post is kind of a mashup/update of two earlier posts. Back almost two years ago I talked about this process but used Twitter and Mastodon: ["Automatically Posting to Mastodon and Twitter on New RSS Items"](https://www.raymondcamden.com/2022/12/06/automatically-posting-to-mastodon-and-twitter-on-new-rss-items). Earlier this year I first talked about using the Bluesky API, with a very appropriately named post: ["Using the Bluesky API"](https://www.raymondcamden.com/2024/02/09/using-the-bluesky-api). As I said, this post is going to mash up bits from both, and include new things I've not covered before, but for those of you who have been around here for a while, some of this may be repetition. 

For this solution, I'm using [Pipedream](https://pipedream.com). I've [blogged](/tags/pipedream) for years now and love it. Their [free tier](https://pipedream.com/docs/pricing#free-tier) will support what I'm showing below so you should feel free to give it a try. There are *many* alternatives out there, but Pipedream has some great features that I think make it stand out. You'll see that especially in the first step below. But, keep in mind if you've already got a platform you would want to use, as long as you can handle the execution on new RSS items, you could probably just skip to the last step and copy and paste from my code. 

Ok, enough preamble, let's take a look at how this can be built. 

## Step One - Firing on New RSS Items

The first thing our workflow needs is the ability to fire on a new item added to a RSS feed. This requires setting up a schedule, parsing the RSS feed, and *most importantly*, recognizing when a new item has been added. Luckily, Pipedream has this built in.

When creating a new workflow, you'll be prompted for the trigger. Type 'rss' to filter to the RSS app:

<p>
<img src="https://static.raymondcamden.com/images/2024/11/bs1.jpg" alt="The RSS app" class="imgborder imgcenter" loading="lazy">
</p>

Select it, and then pic: "New Item in Feed":

<p>
<img src="https://static.raymondcamden.com/images/2024/11/bs2.jpg" alt="New item in feed" class="imgborder imgcenter" loading="lazy">
</p>

This requires, at minimum, the RSS feed you want to monitor. The timer, which just means how often it checks, defaults to every 15 minutes, which honestly is overkill. My own workflow checks every 4 hours, but once a day, of maybe every 6 hours, would be more sensible.

Once you've done that, that's literally it - the workflow will check the feed automatically and recognize when a new item has been added. 

## Step Two - Generate the Message

When an RSS item triggers the workflow, you get information about the item of course. What you need to figure out then is *what* you want to post. You could just post the title and URL, but since my account also has random other posts from me (always super important stuff), I wanted to distinguish the automated posts.

Pipedream lets you add arbitrary code posts, so my new action in the workflow is a Node.js one. The code is relatively simple:

```js
export default defineComponent({
  async run({ steps, $ }) {

      return {
      text: `
New post from my blog: "${steps["trigger"]["event"]["title"]}"

${steps["trigger"]["event"]["link"]}
      `
    }

  },
})
```

Basically what I said above, title and link, but I prefixed it with "New post from my blog:" to help it stand out.

## Step Three - Posting to Bluesky

Ok, so working with Bluesky is mostly simple. Mostly. The [docs](https://docs.bsky.app/docs/get-started) are pretty good. Initially, you create an instance of the Bluesky 'agent' and login:

```js
import Atproto  from '@atproto/api';
const { BskyAgent } = Atproto;

const agent = new BskyAgent({
  service: 'https://bsky.social'
});

await agent.login({
  identifier: 'example.com',
  password: 'hunter2'
});
```

The imports here are slightly different from the docs in order to get it working on Pipedream. If you want more info on why, see my [earlier post](https://www.raymondcamden.com/2024/02/09/using-the-bluesky-api) in February. 

For identifier, I used `raymondcamden.com` which is my username on Bluesky. Posting is super easy as well - this is right from the docs:

```js
await agent.post({
  text: 'Hello world! I posted this via the API.',
  createdAt: new Date().toISOString()
})
```

However, there's one oddity that will trip you up. If your text contains URLs, they will *not* be automatically hot linked. Instead, you have to use what Bluesky refers to as 'rich text', and again, this is [documented](https://docs.bsky.app/docs/advanced-guides/post-richtext). It requires just a tiny tweak:

```js
const rt = new RichText({
	text: 'Text with things you want hot linked',
});
await rt.detectFacets(agent);

await agent.post({
  text: rt.text,
  facets: rt.facets,
  createdAt: new Date().toISOString()
})
```

Ok... so that works. You can see a sample here:

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:4tan3ugu55i2u3hmtblu7wf5/app.bsky.feed.post/3la7vvjpoxj2w" data-bluesky-cid="bafyreie7twufdfmzqeophmubdagmzbijkjugd744322etw5vn37yjupe34"><p lang="en-US">
New post from my blog: &quot;Next Code Break - Blogging with Eleventy&quot;

https://www.raymondcamden.com/2024/11/04/next-code-break-blogging-with-eleventy
  </p>&mdash; Raymond Camden (<a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5?ref_src=embed">@raymondcamden.com</a>) <a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5/post/3la7vvjpoxj2w?ref_src=embed">November 5, 2024 at 12:56 PM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

But I wanted the usual 'social media preview' card you see attached in the Bluesky app. Once again, this was nicely documented: [Website card embeds](https://docs.bsky.app/docs/advanced-guides/posts#website-card-embeds). Basically, you add an `embed` key to your post that includes, at minimum, a URL, title, and description. The description of my post is *not* in my RSS. In order to get it, I made use of [Cheerio](https://cheerio.js.org/), a Node.js library that gives you jQuery like features with raw HTML. I fetched the HTML and got the description like so:

```js
let card = {
	uri:steps.trigger.event.link,
	title:steps.trigger.event.title,
}

let req = await fetch(steps.trigger.event.link);
let html = await req.text();
let $$ = cheerio.load(html);
card.description = $$('meta[property="og:description"]').attr('content');
```

By the way, the use of `$$` as a variable is a twist on the Cheerio docs. They use `$`, but Pipedream uses `$` as a variable as well. 

I got this to work pretty quickly:

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:4tan3ugu55i2u3hmtblu7wf5/app.bsky.feed.post/3la7xqoojep2s" data-bluesky-cid="bafyreibmmjoxovvg6zxkjdv2j3oiugxh5mhqdcsgl4dumdbbfbb54tchkm"><p lang="en-US">
New post from my blog: &quot;Next Code Break - Blogging with Eleventy&quot;

https://www.raymondcamden.com/2024/11/04/next-code-break-blogging-with-eleventy
  <br><br><a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5/post/3la7xqoojep2s?ref_src=embed">[image or embed]</a></p>&mdash; Raymond Camden (<a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5?ref_src=embed">@raymondcamden.com</a>) <a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5/post/3la7xqoojep2s?ref_src=embed">November 5, 2024 at 1:29 PM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

But without the image, it looked kinda bland. This is where things got a tiny bit complicated. The image is easy to get with Cheerio:

```js
let image = $$('meta[property="og:image"]').attr('content');
```

I then uploaded fetch it as a blob, and uploaded it to Bluesky:

```js
let blob = await fetch(image).then(r => r.blob());
let { data } = await agent.uploadBlob(blob, { encoding:'image/jpeg'} );
```

I then added this data as a `thumb` to my card and that's all it took:

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:4tan3ugu55i2u3hmtblu7wf5/app.bsky.feed.post/3la7yufu5hj2r" data-bluesky-cid="bafyreif6s24kkvvu2qw5u6bkr3zxyngayjxnqv2hys7wvxqf4knvi3deqi"><p lang="en-US">
New post from my blog: &quot;Next Code Break - Blogging with Eleventy&quot;

https://www.raymondcamden.com/2024/11/04/next-code-break-blogging-with-eleventy
  <br><br><a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5/post/3la7yufu5hj2r?ref_src=embed">[image or embed]</a></p>&mdash; Raymond Camden (<a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5?ref_src=embed">@raymondcamden.com</a>) <a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5/post/3la7yufu5hj2r?ref_src=embed">November 5, 2024 at 1:49 PM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

Here's the complete code. Just to be sure it's clear, this code:

* Looks at the original workflow trigger to get the title and url of the new item in the RSS feed.
* Uses Cheerio to get additional meta tag info for the description and image
* Uploads the image to Bluesky
* And then makes a new post that includes the text I wanted as well as the embedded card:

```js
import * as cheerio from 'cheerio';
import Atproto  from '@atproto/api';
const { RichText, BskyAgent } = Atproto;

export default defineComponent({
  async run({ steps, $ }) {

    const agent = new BskyAgent({
      service: 'https://bsky.social'
    });

    await agent.login({
      identifier: 'raymondcamden.com',
      password: process.env.BLUESKY_RAYMONDCAMDEN_PASSWORD
    });

    let card = {
      uri:steps.trigger.event.link,
      title:steps.trigger.event.title,
    }

    let req = await fetch(steps.trigger.event.link);
    let html = await req.text();
    let $$ = cheerio.load(html);
    card.description = $$('meta[property="og:description"]').attr('content');
    let image = $$('meta[property="og:image"]').attr('content');

    let blob = await fetch(image).then(r => r.blob());
    let { data } = await agent.uploadBlob(blob, { encoding:'image/jpeg'} );

    card.thumb = data.blob;

    let rt = new RichText({
      text: steps.generateText.$return_value.text
    });
    await rt.detectFacets(agent);

    await agent.post({
      text:rt.text,
      facets: rt.facets, 
      langs:['en-US'],
      createdAt: new Date().toISOString(),
      embed: {
        $type: "app.bsky.embed.external",
        external:card
      }
    });
    
    return;
  },
})
```

And in theory... that's it! Now, my own particular workflow is slightly more complex as I've got an additional step that posts to Mastodon first, so basically, one workflow to automatically post to multiple social networks, but each step is self contained, which made it easy for me to add the Bluesky portion to it. 

If you've got any questions about any of this, just leave me a comment below, and hopefully this post shows up in a few hours. ;)

