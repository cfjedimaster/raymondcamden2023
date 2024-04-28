---
layout: post
title: "Links For You"
date: "2024-04-28T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2024/04/28/links-for-you
description: Sunday Links for a Sunday Day
---

Good afternoon, readers, I hope you are having as good a day as I am. Today I started playing "Midnight Suns" (PS5) and so far, it's a heck of a lot of fun. Yesterday was one of those days that was so good, I almost got a bit paranoid that something bad was going to happen. (It didn't - the day ended great.) I hope it's a sign of how good the week will be. As a quick aside, there will be no `<Code><Br>` this week - it will return next week. See you then!

## Cally - Calendar Component

First up is a cute (can you call a web component cute???) little web component that displays calendars and allows the user to select a date, or a range of dates. It's easy to use, for example, show a single calendar and allow for one date:

```html
<calendar-date>
  <calendar-month></calendar-month>
</calendar-date>
```

Or - show multiple calendars and allow for a range:

```html
<style>
  .grid {
    display: flex;
    gap: 1em;
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
<calendar-range months="2">
  <div class="grid">
    <calendar-month></calendar-month>
    <calendar-month offset="1"></calendar-month>
  </div>
</calendar-range>
```

Cally was created by [Nick Williams](https://wicky.nillia.ms/) and can be installed via a script tag or npm install if you wish. It is important to note that, "The aim is not to give you a full date picker, instead only the lower-level building blocks that allow you to build your own.", which means outside of displaying the calendar and letting you select a date (or range), it doesn't do much else. I wish it would support form participation, but you can grab the value with JavaScript by just getting the value. 

To show that, and the component in action, I whipped up a quick CodePen:

<p class="codepen" data-height="500" data-default-tab="html,result" data-slug-hash="BaEEpMB" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/BaEEpMB">
  Cally</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

As I said, it renders *very* well and is quick to use, so check it out: [Cally](https://wicky.nillia.ms/cally/)

## Files and the Web Platform

In various ways, web developers have had some way to work with user files for quite some time. But as the web platform has expanded, so have those options. [Scott Vandehey](https://cloudfour.com/is/scott/) wrote up a great guide on those features named ["The Many, Confusing File System APIs"](https://cloudfour.com/thinks/the-many-confusing-file-system-apis/). 

His article covers all the various options, helps explain the differences, and even offers up a PDF guide (if you're willing to sign up for a newsletter). 

## Embed the Sky...

Sorry for the overly dramatic subtitle there. I've gone back and forth about my opinion of [Bluesky](https://bsky.app/). For a while, I was considering dropping it, but Threads has really turned into... I don't know. Threads feels more very "shiny", but also a bit "lifeless", whereas Bluesky feels a bit more like how Twitter used to be. While I don't post a lot there, I do spend more time there than I used to. (If you want, you can find me at [raymondcamden.com](https://bsky.app/profile/raymondcamden.com).) 

[Vincent Will](https://github.com/Vincenius) created a nice little web component named [bsky-embed](https://github.com/Vincenius/bsky-embed) that lets you embed a user's posts, a feed, or search, quickly and easily.  

After loading in the script tag, you can then embed a profile like so:

```html
<bsky-embed
    username="vincentwill.com"
    mode="dark"
    limit="5"
  >
</bsky-embed>
  ```

You can see it in action below:

<p class="codepen" data-height="700" data-default-tab="result" data-slug-hash="NWmmpGN" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/NWmmpGN">
  bsky-embed</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## One More Thing...

Let's end as I've done the past few weeks with a music video you may enjoy. Or not. Either way, give it a listen?

<iframe width="560" height="315" src="https://www.youtube.com/embed/42P8l2vQ8U0?si=hEeY-Zy5VkDNdukM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>






