---
layout: post
title: "Links For You"
date: "2024-01-28T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2024/01/28/links-for-you
description: Sunday links for your enjoyment.
---

Good morning, friends. I'm enjoying a lazy Sunday morning before I head out to my first (in-person) conference of the year, [THAT Conference Texas](https://thatconference.com/tx/2024/). I'll be speaking on web components and can't wait to see the other great sessions as well. If you're a reader and will be there, please tell me hello! 

## Simpler Node File Handling with FSX

I've made use of Node's `fs` package for years, and while it's not terribly difficult, Nicholas C. Zakas has come up with an interesting design for a more modern filesystem API, FSX: ["Introducing fsx: A modern filesystem API for JavaScript"](https://humanwhocodes.com/blog/2024/01/fsx-modern-filesystem-api-javascript/). While the name is most likely going to change, you can check out the project here: <https://github.com/humanwhocodes/fsx>

As just one example of what he proposes, here's reading a JSON file:

```js
// read JSON
const json = await fsx.json("/path/to/file.json");
```

He mentions it 'returns a JSON value' but I assume he means, a value parsed as JSON into regular data. (As a JSON string is just a string.)

## Deep Promise Education

Promises are an incredibly important part of JavaScript, and something I cover in my "A Beginner's Guide to Wrangling Asynchronicity in JavaScript" presentation. To help developers get a better understanding of how Promises work, [Henrique Inonhe](https://github.com/henriqueinonhe) has created an excellent learning tool that contains learning exercises a developer can do at their own pace to truly ground themselves in understanding the specification. Head over to the [promises-training](https://github.com/henriqueinonhe/promises-training) repository and *carefully* read the instructions on how to get started using the tutorials. From what I can see, this looks to be *really* intensive and could be really useful. If any of yall have already given this a shot, please leave a comment below as I'd love to hear about your experiences. 

## Ending in Beauty

For the last link I'll share today, I won't give any explanation at all, just click for beauty at the [drawing.garden](https://drawing.garden/). Turn your speakers up a bit as well.
