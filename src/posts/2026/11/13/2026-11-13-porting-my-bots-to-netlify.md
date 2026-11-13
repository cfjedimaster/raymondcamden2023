---
layout: post
title: "Porting My Bots to Netlify"
date: "2026-11-13T18:00:00"
categories: ["development"]
tags: []
banner_image: /images/banners/welcome2018.jpg
permalink: /2026/11/13/porting-my-bots-to-netlify
description: How I moved my bots from Pipedream to Netlify
---

I've got a number of [bots](/bots) I've built for both fun and learning (well mostly fun), most of which were running on [Pipedream](https://pipedream.com). Sadly, Pipedream is shutting down. I'd naturally consider [Val Town](https://val.town) instead... but it's shutting down too. Yeah, wonderful times in tech these days, eh? 

I was a bit unsure of what to do with them. Cloudflare has excellent serverless support and I knew I could move them there, but instead I decided to wrap them into my site here itself. I was hesitant to do so at first - these bots really aren't part of my blog - but given that they're tiny (just one file, ignoring any dependencies), I figured I'd bring em home and run them here. 

For each bot, I used the same method. I'm using Google Antigravity for my personal work, so I told my agent something along the lines of:

```
I want to migrate a bot that runs on Pipedream. Every four hours it 
posts to Mastodon (or Bluesky) and uses this logic to craft the actual
post:
```

Here's where I then pasted in the code bits from Pipedream. Some were in JavaScript. Some were in Python. I trusted my agent to know it needed everything deployed in TypeScript. 

And honestly - it worked perfectly. I instructed my agent to store my credentials (Mastodon requires an access token, Bluesky your username and password) as Netlify environment variables. The Netlify CLI picks these up and provides access to them locally so testing was easy. Even better, the Netlify CLI supports testing these scheduled functions via the CLI, so for example:

```
netlify functions:invoke bot-superjoycat
```

As an example of the final result, here's my Dragon Hoards bot, one of my favorites:

```typescript
import type { Config, Context } from '@netlify/functions';
import { generateSlug, type RandomWordOptions } from 'random-word-slugs';
import indefinite from 'indefinite';
import pluralize from 'pluralize';
import { BskyAgent } from '@atproto/api';

const getRandomIntInclusive = function (min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const locations = [
  'in an ancient temple',
  'in a jungle',
  'by a dusty fountain',
  'on the shore of an ocean',
  'on a distant planet',
  'inside a whirlpool',
  'on an ancient moon',
  'on an island',
  'by a lake',
  'by a forest lake',
  'under your bed',
  "in a unicorn's forest",
  'far from people',
  'under a lake',
  'in a castle in the sky',
  'on a forgotten mountain',
  'at the bottom of a whirlpool',
  'in a nebula',
  'far away under rocks and stone',
  'in a mossy grove',
  'in a sock drawer',
  'inside an abandoned castle',
  'at the end of a rainbow',
  'on a mountain top',
  'in a moonlit forest',
  'inside a black hole',
  'in the ruins of a city',
  'on a deserted island',
  'in a jungle',
  'in a forest temple',
  'in a long forgotten city',
  'on a moon',
  'on a distant planet',
  'deep inside a well',
  'in an old mansion',
  'on a crumbling mountain',
  'on a forgotten island',
  'in a haunted house',
  'on the other side of a rainbow',
  'on a lonely island',
  "under a child's bed",
  'in a castle in the clouds',
  'in the ruins of a village',
  'deep in a cave',
  'under a haunted house',
  'near a village',
];

const verbs = [
  'sees',
  'explores',
  'sorts',
  'inventories',
  'loves',
  'estimates',
  'guards',
  'tallies',
  'reminisces over',
  'regards',
  'looks over',
  'searches',
  'investigates',
  'is proud of',
  'examines',
  'fiddles with',
  'counts',
  'admires',
  'loves',
  'admires',
];

const getDragonType = function () {
  const options: RandomWordOptions<1> = {
    format: 'lower',
    partsOfSpeech: ['adjective'],
    categories: {
      adjective: ['color', 'appearance', 'personality'],
    },
  };

  return generateSlug(1, options);
};

const getLocation = function () {
  return locations[getRandomIntInclusive(0, locations.length - 1)];
};

const getVerb = function () {
  return verbs[getRandomIntInclusive(0, verbs.length - 1)];
};

const getHoard = function () {
  const options: RandomWordOptions<1> = {
    format: 'lower',
    partsOfSpeech: ['adjective'],
    categories: {
      adjective: ['quantity'],
    },
  };

  const quantity = generateSlug(1, options);

  const options2: RandomWordOptions<1> = {
    format: 'lower',
    partsOfSpeech: ['noun'],
    categories: {
      noun: ['animals', 'food', 'thing'],
    },
  };

  const item = pluralize(generateSlug(1, options2));
  const ofWords = ['hundreds', 'thousands', 'millions', 'billions'];
  let joiner = ' ';
  /*
  hard coded logic - may revisit
  */
  if (ofWords.indexOf(quantity) >= 0) joiner = ' of ';

  return `${quantity}${joiner}${item}`;
};

const getFeeling = function () {
  const options: RandomWordOptions<1> = {
    format: 'lower',
    partsOfSpeech: ['adjective'],
    categories: {
      adjective: ['condition'],
    },
  };

  return generateSlug(1, options);
};

export default async (req: Request, context: Context) => {
  const mastodonToken = Netlify.env.get('BOT_DRAGONHOARDS');
  const blueskyPassword =
    Netlify.env.get('BLUESKY_DRAGONHOARDS_PASSWORD') || Netlify.env.get('BOT_DRAGONHOARDS_BLUESKY');

  if (!mastodonToken || !blueskyPassword) {
    console.error('Missing BOT_DRAGONHOARDS or BLUESKY_DRAGONHOARDS_PASSWORD environment variable');
    return new Response('Missing BOT_DRAGONHOARDS or BLUESKY_DRAGONHOARDS_PASSWORD environment variable', {
      status: 500,
    });
  }

  const type = getDragonType();
  const hoards: string[] = [];
  for (let i = 0; i < 3; i++) {
    hoards.push(getHoard());
  }

  const hoardStr = `${hoards[0]}, ${hoards[1]}, and ${hoards[2]}`;
  const statusText = `${indefinite(type, { capitalize: true })} dragon lives ${getLocation()}. She ${getVerb()} her hoard, which consists of ${hoardStr}. She feels ${getFeeling()}.`;

  // 1. Post to Mastodon
  const tootRes = await fetch('https://mastodon.social/api/v1/statuses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mastodonToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ status: statusText }),
  });

  if (!tootRes.ok) {
    const errText = await tootRes.text();
    console.error(`Failed to post to Mastodon: ${tootRes.status} ${errText}`);
    return new Response('Failed to post to Mastodon', { status: 502 });
  }

  const mastodonResult = await tootRes.json();
  console.log(`Posted to Mastodon: ${mastodonResult.url ?? mastodonResult.id}`);

  // 2. Post to Bluesky
  const agent = new BskyAgent({
    service: 'https://bsky.social',
  });

  await agent.login({
    identifier: 'dragonhoards.bsky.social',
    password: blueskyPassword,
  });

  const bskyResult = await agent.post({
    text: statusText,
    langs: ['en-US'],
    createdAt: new Date().toISOString(),
  });
  console.log(`Posted to Bluesky: ${bskyResult.uri}`);

  return Response.json({
    text: statusText,
    mastodon: mastodonResult,
    bluesky: bskyResult,
  });
};

export const config: Config = {
  schedule: '0 */4 * * *', // Every 4 hours on the hour (UTC)
};
```

You can see an example of this bot below:

<blockquote class="mastodon-embed" data-embed-url="https://mastodon.social/@dragonhoards/117610909536016556/embed" style="background: #FCF8FF; border-radius: 8px; border: 1px solid #C9C4DA; margin: 0; max-width: 540px; min-width: 270px; overflow: hidden; padding: 0;"> <a href="https://mastodon.social/@dragonhoards/117610909536016556" target="_blank" style="align-items: center; color: #1C1A25; display: flex; flex-direction: column; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Roboto, sans-serif; font-size: 14px; justify-content: center; letter-spacing: 0.25px; line-height: 20px; padding: 24px; text-decoration: none;"> <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32" viewBox="0 0 79 75"><path d="M63 45.3v-20c0-4.1-1-7.3-3.2-9.7-2.1-2.4-5-3.7-8.5-3.7-4.1 0-7.2 1.6-9.3 4.7l-2 3.3-2-3.3c-2-3.1-5.1-4.7-9.2-4.7-3.5 0-6.4 1.3-8.6 3.7-2.1 2.4-3.1 5.6-3.1 9.7v20h8V25.9c0-4.1 1.7-6.2 5.2-6.2 3.8 0 5.8 2.5 5.8 7.4V37.7H44V27.1c0-4.9 1.9-7.4 5.8-7.4 3.5 0 5.2 2.1 5.2 6.2V45.3h8ZM74.7 16.6c.6 6 .1 15.7.1 17.3 0 .5-.1 4.8-.1 5.3-.7 11.5-8 16-15.6 17.5-.1 0-.2 0-.3 0-4.9 1-10 1.2-14.9 1.4-1.2 0-2.4 0-3.6 0-4.8 0-9.7-.6-14.4-1.7-.1 0-.1 0-.1 0s-.1 0-.1 0 0 .1 0 .1 0 0 0 0c.1 1.6.4 3.1 1 4.5.6 1.7 2.9 5.7 11.4 5.7 5 0 9.9-.6 14.8-1.7 0 0 0 0 0 0 .1 0 .1 0 .1 0 0 .1 0 .1 0 .1.1 0 .1 0 .1.1v5.6s0 .1-.1.1c0 0 0 0 0 .1-1.6 1.1-3.7 1.7-5.6 2.3-.8.3-1.6.5-2.4.7-7.5 1.7-15.4 1.3-22.7-1.2-6.8-2.4-13.8-8.2-15.5-15.2-.9-3.8-1.6-7.6-1.9-11.5-.6-5.8-.6-11.7-.8-17.5C3.9 24.5 4 20 4.9 16 6.7 7.9 14.1 2.2 22.3 1c1.4-.2 4.1-1 16.5-1h.1C51.4 0 56.7.8 58.1 1c8.4 1.2 15.5 7.5 16.6 15.6Z" fill="currentColor"/></svg> <div style="color: #787588; margin-top: 16px;">Post by @dragonhoards@mastodon.social</div> <div style="font-weight: bold;">View on Mastodon</div> </a> </blockquote> <script data-allowed-prefixes="https://mastodon.social/" async src="https://mastodon.social/embed.js"></script>

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:u62qb6gjgpfcix3vu6nbqxpl/app.bsky.feed.post/3n27rllxmyo2p" data-bluesky-cid="bafyreidazcdkonnrit24sbda33j4m3o4sxzz44tqwad6533bsfk24w5rve" data-bluesky-embed-color-mode="system"><p lang="en-US">A faithful dragon lives at the bottom of a whirlpool. She searches her hoard, which consists of full xylophones, many zebras, and billions of refrigerators. She feels important.</p>&mdash; Dragon Hoards (<a href="https://bsky.app/profile/did:plc:u62qb6gjgpfcix3vu6nbqxpl?ref_src=embed">@dragonhoards.bsky.social</a>) <a href="https://bsky.app/profile/did:plc:u62qb6gjgpfcix3vu6nbqxpl/post/3n27rllxmyo2p?ref_src=embed">November 13, 2026 at 2:01 PM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

All in all, painless, except I did make one mistake that I didn't notice until just now. I forgot to deploy the environment variables. Earlier in the post I mentioned my agent had done that, but I had definitely misunderstood. That's absolutely my fault and I should have checked my bots this morning to ensure they're running. Now I'm 100% sure. Really. (Ok, I held off on hitting publish on this post until I saw it for sure. ;)

FYI, and I just found this out myself a minute ago, the Netlify CLI can actually look for errors across your entire site, including functions, and filter to errors. It's as simple as:

```
netlify logs --source functions --source edge-functions --source deploy --since 24h -l error fatal
```

Here's an example of that output:

<p>
<img src="https://static.raymondcamden.com/images/2026/11/ntl.jpg" loading="lazy" alt="Netlify errors" class="imgborder imgcenter">
</p>

That's super clear, so I added it to my npm scripts: `npm run checkproderrors`