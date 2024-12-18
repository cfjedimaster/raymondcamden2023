---
layout: post
title: "Summarizing with Transformers.js"
date: "2024-12-18T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_court_reporter.jpg
permalink: /2024/12/18/summarizing-with-transformersjs
description: How well does Transformers.js handle summarizing content?
---

Earlier this month I took my [first look](https://www.raymondcamden.com/2024/12/03/using-transformersjs-for-ai-in-the-browser) at using [Transformers.js](https://huggingface.co/docs/transformers.js/en/index), a JavaScript SDK around multiple different models hosted by Hugging Face. My initial experiments worked pretty OK I think. The sentiment analysis felt pretty good, and the object detection (with a [cat demo](https://www.raymondcamden.com/2024/12/03/using-transformersjs-for-ai-in-the-browser#object-detection-in-images-(for-cats%2C-of-course)) of course), worked pretty good as well. I was curious how well summarization would work, and while I'm not *quite* as impressed as I was before, I thought I'd share what I found. (And it's 100% possible I'm not tweaking the right knobs to get better results, so if you see a way to improve my results, leave me a comment!)

## A Basic Test

If you remember from the [first post](https://www.raymondcamden.com/2024/12/03/using-transformersjs-for-ai-in-the-browser), usage can be fairly simple. Import the library:

```js
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';
```

Then get your pipeline:

```js
const summarizer = await pipeline('summarization');
```

Getting a summary just requires passing text:

```js
let summary = await summarizer("Some text here");
```

This returns an array of objects where each item has a `summary_text` value. A trivial implementation of this is below.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="PwYZJJe" data-pen-title="Transformers.js Test - Summarize" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/PwYZJJe">
  Transformers.js Test - Summarize</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

If you test this, you'll notice right away this is a bit... "beefier" than the previous results in that it definitely seems to make the CPU work a bit harder. The results can be hit or miss. So, I tried with this input, some text from the Wikipedia for [Milan Kundera](https://en.wikipedia.org/wiki/Milan_Kundera).

```
Milan Kundera was born on 1 April 1929 at Purkyňova 6 (6 Purkyně Street) in Královo Pole, a district of Brno, Czechoslovakia (present-day Czech Republic), to a middle-class family. His father, Ludvík Kundera (1891–1971), was an important Czech musicologist and pianist who served as the head of the Janáček Music Academy in Brno from 1948 to 1961.[8][9][10] His mother Milada Kunderová (born Janošíková)[11] was an educator.[10] His father died in 1971, and his mother in 1975.[10]

Kundera learned to play the piano from his father and later studied musicology and musical composition. Musicological influences, references and notation can be found throughout his work. Kundera was a cousin of Czech writer and translator Ludvík Kundera.[12] In his youth, having been supported by his father in his musical education, he was testing his abilities as a composer.[13][14] One of his teachers at the time was Pavel Haas.[15] His approach to music was eventually dampened due to his father not being able to launch a piano career for insisting on playing the music of modernist Jewish composer Arnold Schoenberg.[14]

At the age of eighteen, he joined the Communist Party of Czechoslovakia in 1947.[16] In 1984, he recalled that "Communism captivated me as much as Stravinsky, Picasso and Surrealism."[17]

He attended lectures on music and composition at the Charles University in Prague but soon moved to the Film and TV School of the Academy of Performing Arts in Prague (FAMU) to study film.[18] In 1950, he was expelled from the party.[13] After graduating, the Film Faculty appointed Kundera a lecturer in world literature in 1952.[19] Following the Warsaw Pact invasion of Czechoslovakia in 1968, he lost his job at the Film Faculty.[20] In 1956, Kundera also married for the first time, the operetta singer Olga Haas, the daughter of the composer and his teacher Pavel Haas and the doctor of Russian origin Sonia Jakobson, the first wife of Roman Jakobson
```

And after ten seconds, got:

```
Milan Kundera was born in 1929 in Purky��žova, a district of Czechoslovakia. His father, Ludvík Kundero, was an important Czech musicologist and pianist. He was a cousin of Czech writer and translator Ludvísk Kundersa.
```

Not sure what to think of the encoding issue there. That feels like probably my fault, and not the library, but it's something to consider. I also noted that the Summarize button took 3 seconds to become disabled, despite being run first. 

I then tried my [About](/about) text, which is now out of date, but:

```
My name is Raymond Camden. I'm a married father of eight living in beautiful Lafayette, Louisiana. I am a Senior Developer Evangelist working at Adobe. Most of my time is spent writing, researching, or presenting. When I'm not behind a computer, I'm an avid Xbox/Playstation player, enjoy movies, and read like crazy.

I've been lucky to have been invited to speak at many conferences over the years. If you would like me to speak at your conference or organization, please contact me. I can cover pretty much any topic you see my blog about, but feel free to request just about anything. I love presenting on topics I'm not yet familiar with as it gives me a chance to learn something new.

I'm somewhat of a Star Wars nerd - but don't tell anyone else I told you that.

If you find this content useful (currently at 6579 posts), please consider visiting my Amazon Wishlist to show your appreciation. Since Amazon will often not tell me who purchased a gift for me, drop me a line to let me know!
```

And got this:

```
Raymond Camden is a Senior Developer Evangelist working at Adobe. He's a married father of eight living in Louisiana, Louisiana. He is an avid Xbox/Playstation player, enjoy movies, and read like crazy. If you would like him to speak at your conference or organization, please contact him.
```

This feels pretty good, except for the grammar issue with "read like crazy". 

## RSS Summaries

For my next demo, I rebuilt a demo I did back in September where I used Chrome's new built-in AI to summarize entries from an RSS feed - ["Using the Chrome AI Summarizer (Early Look)"](https://www.raymondcamden.com/2024/09/10/using-the-chrome-ai-summarizer-early-look). The basic idea for that application was - you give it an RSS feed, code then fetches the entries from the feed (assuming "full" blog posts) and then summarizes each entry. 

Most of the code is Alpine and it makes use of a Cloudflare worker, but the GenAI portion is literally no different than the above, so to keep it simple, I'll just share the CodePen. But what excites me about this, and Chrome's efforts, is that it can 100% be an optional improvement to an application. In fact, you could imagine an application first checking for built-in functionality, then going to Transformers.js, and if that fails, showing an except of the entry. (I think I just figured out my next blog post.) 

You can see this demo below. As a reminder, the Cloudflare worker I built is limited in terms of what RSS feeds it handles, so work with the default (my blog), or fork my worker and deploy your own (Cloudflare has an *incredible* free tier). 

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="wBwgVmR" data-pen-title="transformers.js - RSS to Summaries (Strip HTML Better - And Code)" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/wBwgVmR">
  transformers.js - RSS to Summaries (Strip HTML Better - And Code)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Some final thoughts. I'm not terribly happy with the performance and results of this part of Transformers.js. That being said, it's "free" (outside of the cost of downloading the model to you user's network), but given that it's all on device, that's a pretty compelling argument.