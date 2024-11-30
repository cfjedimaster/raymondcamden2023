---
layout: post
title: "Links For You (11/30/24)"
date: "2024-11-30T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2024/11/30/links-for-you
description: Happy (Almost) XMas Links
---

Hello folks - I'm a week or so behind on my schedule for these posts, but the last few weeks have been incredibly hectic. I had 5 or so (I've lost track honestly) online presentations and one in-person event at connect.tech, and of course, this week was Thanksgiving. I'm *also* behind on scheduling for my `<Code><Br>` show, which I hope to fix up later today. I wish I could look forward to things get less busy, but the next few weeks will be busy as well! I've got [two upcoming presentations](/speaking) on Gen AI coming up! Ok, enough whining, let me share some links!

## Avoid Amazon's Echo Show

In theory you can stop reading at the title, [Please don't buy an Echo Show](https://crashthearcade.com/blog/2024/dont-buy-echo-show/), but it's something I've been saying to folks as well. The excellently named "crash the arcade" author talks about his Echo Show device went from a valued device in his home to an advertising spewing piece of e-waste. For a long time, I've had a huge amount of respect for Alexa as a developer platform. Heck, I gave multiple presentations on the platform and shipped some public Alexa skills. I had my own Echo Show next my bed and loved it... until it also started displaying ads - a foot from my bed. To be clear, these don't show up at night when the device switches to a low-light mode, but it infuriates me. I get even more angry knowing that Amazon tablets have both an ad supported price and a 'no ads' price. I could get behind that - totally! But there isn't an option for that on the Show, and it definitely wasn't an option when I purchased the device. 

I'll echo the author's suggestion of considering the Google Nest Hub, we've got one in the kitchen and love it. 

## Advent of Code

Every year I recommend folks check out the [Advent of Code](https://adventofcode.com/). This is a twenty-five day coding challenge that goes from fun to insanely difficult, but the nice thing is that you are free to do as many or little as you like. Each day, a core challenge is released in two parts. Typically the second part is a simple-ish modification of what you built in the first part. For the past few years, I've used AoC as a way to practice my Python. There's a dedicated subreddit where you can find solutions, and honestly, I don't consider that cheating at all. If you feel a bit guilty and can't get past a challenge, try finding a solution in another language and 'translating' it to your language of choice. 

## Tiny Static Map

Last up is a little library that creates static map images, [Tiny Static Map](https://github.com/bopjesvla/tiny-static-map). I'm a little torn on this one as Google's Static Map API uses just image urls. This library still requires JavaScript, but, if you want to drop a map on a page and not have any interactivity, it's an option I suppose. Usage is pretty simple:

```html
<!-- From the docs -->
<div id="map-container"></div>
<script src="tiny-static-map.js"></script>
<script>
  const container = document.querySelector('#map-container');
  createStaticMap(container, 37.7749, -122.4194, 12, 300, 300);
</script>
```

I'm curious to see if perhaps this could be modified to not draw to the DOM, but return something that could be saved to the file system. In that case, it could be a useful addition to a static web site. 

## Just For Fun

I don't know about you, but I'm really excited we get a new Star Wars show this Monday. On the off chance you haven't heart of it, check out the trailer for "Skeleton Crew" below. I *love* the Goonies vibe!

{% liteyoutube "f19gfOMZTtg" %}
