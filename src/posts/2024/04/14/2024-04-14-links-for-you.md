---
layout: post
title: "Links For You"
date: "2024-04-14T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2024/04/14/links-for-you
description: Cheerful, shiny happy fresh links.
---

Good day my fabulous readers and I hope all is well with you. I just got back from speaking at the *excellent* [Devnexus](https://devnexus.com/) event and despite some travel issues (thank you storms, really), I had a great time. I got to see not one, not two, but three very old friends of mine and attended some good sessions as well. I'm home for a week and then on the road again to the [Adobe ColdFusion Summit](https://devnexus.com/) in the DC area. Don't forget, this Tuesday I've got another episode of [`<Code><Br>`](https://cfe.dev/talkshows/codebreak-04162024/) coming up. I'll be building, or attempting to, build a PWA live. Surely it will go perfectly, right?

## Pretty Console Table Printing

First up is a neat little library, [voici.js](https://voici.larswaechter.dev/), that makes it a bit easier to print tabular data in the console. I'm going to borrow from their [quick start](https://voici.larswaechter.dev/quick-start) to show you an example:

```js
import { Table } from 'voici.js'

const data = [
  { firstname: 'Homer', lastname: 'Simpson', age: 39 },
  { firstname: 'Marge', lastname: 'Simpson', age: 36 },
  { firstname: 'Bart', lastname: 'Simpson', age: 10 },
  { firstname: 'Lisa', lastname: 'Simpson', age: 8 },
  { firstname: 'Maggie', lastname: 'Simpson', age: 1 }
];

const table = new Table(data);
table.print();
```

Given the above code, you'll get this in your terminal:

<p>
<img src="https://voici.larswaechter.dev/~gitbook/image?url=https:%2F%2F1307571304-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FOIf17OLFblxkTooTktmI%252Fuploads%252Fvq3uyi7IXatPN3r9xehW%252Fcarbon.png%3Falt=media%26token=34bcec9b-fb2a-4e7b-a820-98cb700a0bbe&width=768&dpr=2&quality=100&sign=fbb7be3155caac904639e817169a820074c51c83b7fa63eea3bdeebb6977e30e" alt="Screenshot from AI Styling demo" class="imgborder imgcenter" loading="lazy">
</p>

You can get pretty fancy too, for example, easily picking out what columns to show, and even creating 'virtual' columns based on custom logic. If you want to see an example of how I used this recently, read my [recent post](https://www.raymondcamden.com/2024/04/06/using-netlify-edge-and-blob-support-to-investigate-website-traffic) on how I investigated some odd traffic issues on my site.

## A Great Example of Promise.race

Earlier this year I took a look at [various Promise methods](https://www.raymondcamden.com/2024/02/12/looking-at-the-javascript-promise-collection-methods), including `Promise.race`. In this post by David Bushel, he [demonstrates](https://dbushell.com/2024/02/27/a-fun-line-of-code/) how he used `Promise.race` to nicely handle an interesting use case with media files. It's a *perfect* example of how useful this `Promise` method can be.

## Speaking of Promises...

While on the topic of Promises, [Lydia Hallie](https://www.lydiahallie.io/) has a dang good and *deep* look at how Promises work: [JavaScript Visualized: Promise Execution](https://www.lydiahallie.com/blog/promise-execution). She goes into incredible depth about how the internals of Promises operator and honestly, a lot of this was new to me. She also built some incredibly good visualizations. I will say I'm not a fan of animated GIFs - it's sometimes difficult to tell when the 'loop' is starting and I wish I could pause - but the ones used here are pretty well built. Be sure to check out her [blog](https://www.lydiahallie.io/) as a quick look at her past entries shows a wealth of valuable information.

## And last but not least...

In my last post, I shared a music video from a recent Spotify discovery, so I figured why not do it again? Enjoy!

<iframe width="560" height="315" src="https://www.youtube.com/embed/Mzyou1thwQg?si=fNFVft7QhPsQ-PHC" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>


