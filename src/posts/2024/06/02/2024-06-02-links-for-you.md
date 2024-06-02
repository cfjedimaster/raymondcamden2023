---
layout: post
title: "Links For You"
date: "2024-06-02T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2024/06/02/links-for-you
description: Links for a rainy Sunday.
---

Hello from what feels like a rainforest down in Louisiana. We've had what feels like weeks now of not just rain, but *strong* rain and storms, and the hurricane season has only officially just begun. Thankfully we've got a whole home generator but I'm not looking forward to this year's storm season. (One of many reasons my wife and I are moving as soon as the youngest finishes school.) Here are some links to help add a bit of sunshine to me, and hopefully your, day.

## The HTML List Padding Problem

Here's a problem I didn't know actually existed, but as soon as I started reading, immediately realized it could be an issue. Lists (`<ul>` and `<li>`) include a bit of inherent padding when rendering the markers in front of each list item. For *numeric* lists (`<ol>`), this padding ends up not being big enough for very long lists. In this post, [Making room for long list markers with subgrid](https://noahliebman.net/2024/03/making-room-for-long-list-markers-with-subgrid/), [Noah Liebman](https://noahliebman.net/) describes how to use CSS subgrid to solve it. Now, you may say that having a big list is a problem itself, but don't forget HTML lists have a `start` attribute that can change the default starting number. You may use pagination to break up a large list but still want the numbers to be correct, and Noah's blog post could help out with potential layout issues.

## ECMAScript 2024 Proposal - Promise.withResolvers()

[Dr. Axel Rauschmayer](https://dr-axel.de/) is probably the most knowledgeable JavaScript expert on the planet, and even better, is incredibly willing to help others. (I've reached out to him many times over the years and he's always helped me.) In one of his latest posts, he digs into the proposal for [Promise.withResolves()](https://2ality.com/2024/05/proposal-promise-with-resolvers.html), which could provide more power to the already really useful Promise feature. I've read his post twice now, and I *think* I get it, but honestly will probably need to write up my own demo to wrap my head around it. 

## State of HTML 2023

Over the past few months, a survey was filled out by over twenty thousand developers focused on HTML. While there's been a [State of JavaScript](https://stateofjs.com/en-US) and [State of CSS](https://stateofcss.com/en-US) for a while now, this was the first developer survey focused on HTML. The [State of HTML](https://2023.stateofhtml.com/en-US) survey covers all aspects of HTML. While there's a *lot* to digest here, it could be a good way for technical leaders to get a barometer on how folks feel about and how much they are using various aspects of the web platform. I found the [web components](https://2023.stateofhtml.com/en-US/features/web_components/) section very interesting.

## And last but not least...

Another music treat for you, this one from [Men I Trust](https://menitrust.com/), and I believe I've got Brian to thank again for this track.

<iframe width="560" height="315" src="https://www.youtube.com/embed/HAK5D3drObI?si=06KkVK_TP6Y9274F" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>
