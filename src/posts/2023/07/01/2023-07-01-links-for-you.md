---
layout: post
title: "Links For You"
date: "2023-07-01T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2023/07/01/links-for-you
description: Links for July
---

So yeah, I know my [last post](https://www.raymondcamden.com/2023/06/30/algolia-devcon-2023-videos) was just a link, but I promise the post *after* this will be actual new content, not just me sharing stuff. Then again, it's my blog, so who knows what I'll do. ;) Happy July, and for those of you suffering with me in the South (heat and multiple other reasons), stay hydrated. 

## RSS Styling

First up is a cool article by Darek Kay, [Style your RSS feed](https://darekkay.com/blog/rss-styling/). While on one-hand I'm *so* happy I don't need to work with XML often, on the other hand, I've already been impressed by the XML ecosystem, especially XSLT and XPath. Turns out, you can add a style sheet written in XSL and make your RSS feed prettier. This is really cool, and I've done it to my [feed](/feed.xml) as well. 

## The 11ty Bundle

Next up is the [11ty Bundle](https://11tybundle.dev/) by [Bob Monsour](https://www.bobmonsour.com/), a huge collection of Eleventy resources from around the web. He even has a [firehose RSS feed](https://11tybundle.dev/firehosefeed.xml) you can subscribe to in your feed reader of choice.

## JSON to Chart

Last is a resource my buddy [Todd Sharp](https://recursive.codes/) shared with me. [JSON to Chart](https://jsontochart.com/) is a super useful little tool that lets you paste in some JSON data and generate a chart. I'm not talking about a charting library, this is literally, "I've got some data, and I'd love to make a quick chart of it to share with others" type thing. 

This is a trivial example, but take some JSON like so:

```json
[
{"name":"Zelda", "age":1, "gender":"female"},
{"name":"Pig", "age":8, "gender":"female"},
{"name":"Luna", "age":12, "gender":"female"},
{"name":"Elise", "age":11, "gender":"female"},
{"name":"Grace", "age":13, "gender":"female"}
]
```

Paste it into the site and specify name for x-axis and age for y-axis, and you get this:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/jsonchart.png" alt="JSON Chart sample" class="imgborder imgcenter" loading="lazy">
</p>