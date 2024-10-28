---
layout: post
title: "Links For You (10/28/2024)"
date: "2024-10-28T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2024/10/28/links-for-you-10282024
description: Happy Links for (Almost) the Weekend
---

This post was meant to go out on the weekend, but I got sucked into video games, baking cookies, and, well, watching the Saints suck. I've mentioned this already I think, and I'm pretty sure I talked about it on my stream, but my anxiety which had taken a bit of a back seat for nearly a month has come raging back in. November is going to be kind of a crazy month for me - I've got two trips, six presentations total, and a major holiday. I'm also just a teeny bit worried about, oh you know, the entire country going to hell, but for today, today I'm just going to focus on tackling things one by one. And with that... your lnks.

## Converting HTML to Image in Node.js

First up is a simple little Node package that converts HTML to an image called... [node-html-to-image](https://github.com/frinyvonnick/node-html-to-image). This uses a headless browser to convert HTML into an image. Here's an example from the readme:

```js
const nodeHtmlToImage = require('node-html-to-image')

nodeHtmlToImage({
  output: './image.png',
  html: '<html><body>Hello world!</body></html>'
})
.then(() => console.log('The image was created successfully!'))
```

I tried this and - of course - it worked:

<p>
<img src="https://static.raymondcamden.com/images/2024/10/links1.jpg" alt="Hello World" class="imgborder imgcenter" loading="lazy">
</p>

It's also got built-in Handlebars support which is pretty cool. An example (again, from the readme, slightly modified):

```js
const nodeHtmlToImage = require('node-html-to-image')

nodeHtmlToImage({
  output: './image.png',
  html: '<html><body><p>Hello {{name}}!</p><img src="https://placecats.com/250/250"></body></html>',
  content: { name: 'Raymond' }
})
.then(() => console.log('The image was created successfully!'))
```

<p>
<img src="https://static.raymondcamden.com/images/2024/10/links2.jpg" alt="Second example" class="imgborder imgcenter" loading="lazy">
</p>

There's many more options so check it out here: <https://github.com/frinyvonnick/node-html-to-image>

## The History of Regex in JavaScript

Regex holds a special place in my heart, as I started my web development career writing CGI scripts in Perl, where I first learned of the power (and pain) of regular expressions. This [historical guide](https://www.smashingmagazine.com/2024/08/history-future-regular-expressions-javascript/) to regex in JavaScript is a great look at the history of regex support on the web. Kudos go to [Steven Levithan](https://www.smashingmagazine.com/author/steven-levithan/) for the work in compiling this!

[Regexes Got Good: The History And Future Of Regular Expressions In JavaScript](https://www.smashingmagazine.com/2024/08/history-future-regular-expressions-javascript/)

## A Look at a Super Fast Website

This site recently 'hit the airwaves' so to speak when it was noticed that it was a) extremely fast and b) built without a framework, which, frankly, I'm shocked is even allowed anymore. (To be clear, I'm joking.) Wes Bos did an *incredibly* detailed breakdown into why the site performs well, all down by using devtools, which is a great reminder of how useful they can be in introspecting other web sites than your own. This thirteen minute video is 100% worth your time.

{% liteyoutube "-Ln-8QM8KhQ" %}

## Just For Fun...

And last but not least, how about I leave you with some music. I'm a huge fan of the "Above &amp; Beyond" Group Therapy playlist. Every few weeks, they put out a great trance set that I thoroughly enjoy. They also have many albums that are pretty great as well. "Flow State" is a much slower, more relaxed album from them I'll listen to when stressed. Today, this week, this is going to be on repeat. One of the tracks is a spoken word track that usually surprises me when it comes on and helps me redirect and relax...a bit. I've linked it below, but definitely check out the full album if you can.

{% liteyoutube "bO8zlkJGItk" %}
