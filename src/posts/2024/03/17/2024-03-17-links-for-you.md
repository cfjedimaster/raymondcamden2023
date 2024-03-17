---
layout: post
title: "Links For You"
date: "2024-03-17T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2024/03/17/links-for-you
description: Links for your enjoyment...
---

Good morning. I managed to tear myself away from Assasin's Creed Valhalla a bit to get out a "Links For You" post. I was supposed to do this last week (my schedule is every two weeks), but I must have forgotten. Or just been busy. Life happens, amiright??!?! Next month will be pretty busy as well. I've got two conferences I'll be speaking at, a birthday, and just normal life stuff as well. As a reminder, if you find these posts, and this blog handy, I've got multiple ways you can show your support. With my birthday coming up, you could always visit my [Amazon wishlist](http://www.amazon.com/gp/registry/wishlist/2TCL1D08EZEYE/ref=cm_wl_rlist_go_v?), or become a [patron](https://www.patreon.com/raymondcamden) (I'd use that to possibly invest in better analytics), or simply [buy me a coffee](https://www.buymeacoffee.com/raymondcamden). Anything and everything is much appreciated. :) Ok, enough begging, here are the links for this edition.

## WebShare Web Component

I played around with the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) almost a year ago now (["Testing the Web Share API"](https://www.raymondcamden.com/2023/04/20/testing-the-web-share-api)), and while I thought it was pretty neat, I haven't looked at it recently. Turns out, it's an excellent candidate for progressive enhancement and web components. Zach Leat built the very cool [`<webcare-webshare>`](https://www.zachleat.com/web/webcare-webshare/) component that lets you use Web Share when available but gracefully fall back to a simple link. You can play with the [demo](https://zachleat.github.io/webcare-webshare/demo.html) or check out the [repo](https://github.com/zachleat/webcare-webshare). (And as always, whenever I post to stuff like this, I love to hear about people using it so if you do decide to implement it, leave me a comment below.)

## Quick and Simple Typescript with Node Tutorial

Next up is a quick tutorial for quickly getting started with TypeScript and Node.js: ["How to set up a Node server with TypeScript in 2024"](https://www.learnwithjason.dev/blog/modern-node-server-typescript-2024). Don't let the title confuse you though, the tutorial can be used for a Node "server" (i.e. something that keeps running, usually responding on HTTP) as well as a Node script that just runs and is done. I've only used TypeScript rarely, but this post was incredibly easy to understand and quick to test. Also, I learned something new. The "watch" command in Node can be used for scripts that aren't servers. It simply reruns the script for you. That's *really* useful and I wish I had known that before!

Credit for this post goes to [Jason Lengstorf](https://www.learnwithjason.dev/blog/modern-node-server-typescript-2024). 

## Quickly Mock a REST API with json-server

For the last link, here's a super useful CLI tool. `json-server` lets you set up a mock API using just a JSON file. The CLI reads the file and based on the data there, sets up multiple different API routes and features. Heck, it can even update the JSON file based on `PUT` and `DELETE` calls. It is *super* flexible and neat and can be great in cases where you don't want to setup a database and a proper server, just mock up some REST API calls quickly. Read more about it here: <https://github.com/typicode/json-server/tree/v0>

Back in January, I did a quick video on it. Check it out below:

<iframe width="560" height="315" src="https://www.youtube.com/embed/xs56HGC5Y5I?si=ziHEAwwVeRGEoSXR" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="display:block;margin:auto;margin-bottom: 15px"></iframe>
