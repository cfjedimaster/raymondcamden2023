---
layout: post
title: "Links For You"
date: "2024-02-11T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2024/02/11/links-for-you
description: Links for the Big Game, or just for fun.
---

Happy Super Bowl Day for those who celebrate, oh wait, sorry, I mean "The Big Game". I'm looking forward to both the game and the commercials this year, and I managed to avoid every single commercial preview so they should all be new to me. This week was *incredibly* hard at work (with the caveat that I sit on my rear, in a home office, and I'm very lucky), but difficult in that way like when you exercise and muscles you haven't used in a while hurt. I complained to my wife more than once, but also recognized I was improving some skills that needed it. 

Before getting into the links, a reminder. If you want to sponsor these posts (twice a month) or the email newsletter in general, drop me a line. I no longer use any kind of advertising here but would welcome a sponsor to help with the (pretty minimal) costs. Just let me know!

## Maze Maker

I love mazes and have built some in the past (check out this [ColdFusion maze generator](https://www.raymondcamden.com/2009/07/23/Generating-mazes-in-ColdFusion) post from 2009), and I was very excited to see the release of [Labyrinthos](https://yantra.gg/labyrinthos/), which generates mazes, terrains, and biomes. Check out the [GitHub repo](https://github.com/yantra-core/Labyrinthos.js) for detailed docs, but here's a simple example of generating a maze:

```js
let map = new LABY.TileMap({
  width: 30,
  height: 30
});
map.fill(1);

LABY.mazes.RecursiveBacktrack(map, {});
```

You can see this running in the CodePen below:

<p class="codepen" data-height="500" data-default-tab="js,result" data-slug-hash="rNRqQxj" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/rNRqQxj">
  Maze with Labyrinthos</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## CSS One Liners

Next up is an *incredibly* good post by [Stephanie Eckles](https://front-end.social/@5t3ph) on [12 CSS one-line upgrades](https://moderncss.dev/12-modern-css-one-line-upgrades/) that you can start using today. I knew a grand total of *one* of these features so this post was very useful to me. I wanted to point one one in particular I thought was handy but there were too many of them!

## That's One Big PDF

Ok, this last one is more of "just for fun" post but as I work with PDFs at my day job, I found it really interesting. Is there such a thing as a "max size" for a PDF? I mean, technically we're talking about an electronic document, but they do have a rendered height and width and in theory, there could be a limit, perhaps defined in the PDF spec. (No, I haven't read it.) [Alex Chan](https://alexwlchan.net/) did an exhaustive look into this and like I said, the results were incredible. Check it out here: [Making a PDF that’s larger than Germany](https://alexwlchan.net/2024/big-pdf/)

