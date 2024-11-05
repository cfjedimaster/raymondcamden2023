---
layout: post
title: "Using the Bluesky API"
date: "2024-02-09T18:00:00"
categories: ["javascript"]
tags: ["pipedream"]
banner_image: /images/banners/cat_bluesky.jpg
permalink: /2024/02/09/using-the-bluesky-api
description: A look at using Bluesky's API for bot posting.
---

Social media has always been... addicting and kinda gross/dangerous/etc, but lately, I'm not even sure what to think anymore. As I mentioned in my [first episode](https://www.raymondcamden.com/2024/02/06/codebr-first-episode) of `<Code><Br>`, I segregate all of my social media to the Firefox browser so it doesn't get in the way of my regular, work/research/etc browsing. I currently have tabs open for Threads, Bluesky, Mastodon, and, yeah, Twitter still. 

I find Threads to be really good for news. It works well as a replacement for Twitter for that type of content. Mastodon works really well for technical content. Bluesky is a bit more unusual for me. I've considered dropping it at times, but then I'll see some great content there. I honestly don't know if I'll be using it a year from now, but for now it's still got a place in Firefox. 

All that being said, yesterday an account [posted](https://bsky.app/profile/anonymous.expectus.fyi/post/3kkwo6lkjsd2n) a link to the Bluesky community showcase which then led me to the [core docs](https://docs.bsky.app/docs/get-started) and I was really surprised at how simple their API was. Here's their initial example of just connecting:

```js
import { BskyAgent } from '@atproto/api'

const agent = new BskyAgent({
  service: 'https://bsky.social'
})
await agent.login({
  identifier: 'example.com',
  password: 'hunter2'
})
```

And here's an example of posting:

```js
await agent.post({
  text: 'Hello world! I posted this via the API.',
  createdAt: new Date().toISOString()
})
```

That's *super* simple. Obviously, there's a lot more you can do with the API, but if you want to build a simple bot, all you need to do is create the account and write roughly ten lines of code, at least for the Bluesky integration portion. Whatever logic you have for the bot's content is another matter.

Now, I will say that I did run into a problem early on. Bluesky's docs clearly say "Typescript" on top of their code sample, but when I looked at the code, nothing struck me as code that wouldn't work in regular Node. However, when I tried running it, I got:

```
SyntaxError: Named export 'BskyAgent' not found. The requested module 
'@atproto/api' is a CommonJS module, which may not support all 
module.exports as named exports.
```

The error message continues to showing how to rewrite it, but I want to give a shout-out to Giao Phan of Pipedream for helping me as well. Here's the fix:

```js
import Atproto  from '@atproto/api';
const { BskyAgent } = Atproto;
```

Cool. So how am I going to use this? I already have a bot I really love on Mastodon called [Random Comic Book](https://botsin.space/@randomcomicbook). This bot uses [Pipedream](https://pipedream.com) and the [Marvel Comics API](https://developer.marvel.com) to post random comic book covers from the history of Marvel. I *love* seeing these comic covers. 

Given that I already had all of the logic done (you can read about that logic in my [post](https://www.raymondcamden.com/2017/06/19/serverless-demo-random-comic-book-character-via-comic-vine-api) from *way* back in 2017), all I needed to do was add a step to my Pipedream workflow to post to Bluesky after it posted to Mastodon.

As it isn't terribly long, I'll share the entire thing, and then point out the important bits.

```js
import Atproto  from '@atproto/api';
const { RichText, BskyAgent } = Atproto;
import fs from 'fs';

export default defineComponent({
  async run({ steps, $ }) {

    const agent = new BskyAgent({
      service: 'https://bsky.social'
    });

    await agent.login({
      identifier: 'randomcomicbook.bsky.social',
      password: process.env.BLUESKY_RANDOMCOMICBOOK_PASSWORD
    });

    const file = fs.readFileSync('/tmp/cover.jpg');
    const image = Buffer.from(file);

    const { data } = await agent.uploadBlob(image, { encoding:'image/jpeg'} )

    const rt = new RichText({
      text: steps.getMarvelImage.image.toot,
    });
    await rt.detectFacets(agent);

    await agent.post({
      text:rt.text,
      facets: rt.facets, 
      embed: {
        $type:'app.bsky.embed.images', 
        images:[{
          alt:'Cover of the comic book.', 
          image: data.blob
        }]
      },
      langs:['en-US'],
      createdAt: new Date().toISOString()
    })

    // Reference previous step data using the steps object and return data to use it in future steps
    return steps.trigger.event
  },
})
```

There are two main changes here from the simple script I shared earlier. First, to use images with a Bluesky post, you need to upload the bits. My Pipedream workflow saved the Marvel image to `/tmp/cover.jpg` for use by Mastodon and Bluesky can use it as well:

```js
const file = fs.readFileSync('/tmp/cover.jpg');
const image = Buffer.from(file);

const { data } = await agent.uploadBlob(image, { encoding:'image/jpeg'} )
```

This was simply enough and is [documented](https://docs.bsky.app/docs/tutorials/creating-a-post#images-embeds) well at Bluesky. 

The next part was a bit weirder. In one of my first tests, I saw that the link to the Marvel record for the comic wasn't being turned into a real link:

<p>
<a href="https://bsky.app/profile/randomcomicbook.bsky.social/post/3kkwwm5cjbl2g"><img src="https://static.raymondcamden.com/images/2024/02/bs1.jpg" alt="Screen shot of posting showing URL not" class="imgborder imgcenter" loading="lazy"></a>
</p>

Again, the Bluesky [docs](https://docs.bsky.app/docs/advanced-guides/post-richtext) discuss this, I just didn't expect it to be an issue. That's where the `RichText` portion comes in.

```js
const rt = new RichText({
	text: steps.getMarvelImage.image.toot,
});
await rt.detectFacets(agent);
```

You then pass the `rt` object in with your post:

```js
await agent.post({
	text:rt.text,
	facets: rt.facets, 
```

As I said, that felt weird, but didn't take long to figure out. And now that I know, it won't be an issue for next time. 

Here's an example with everything working:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/bs2.jpg" alt="One example post from the bot." class="imgborder imgcenter" loading="lazy">
</p>

And if you want to follow the bot (assuming you have a Bluesky account), you can find it here: <https://bsky.app/profile/randomcomicbook.bsky.social>