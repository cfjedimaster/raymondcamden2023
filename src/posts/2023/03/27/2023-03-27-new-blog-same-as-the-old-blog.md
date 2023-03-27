---
layout: post
title: "New Blog Same as the Old Blog"
date: "2023-03-27T18:00:00"
categories: ["misc"]
tags: ["eleventy"]
banner_image: /images/banners/welcome2018.jpg
permalink: /2023/03/27/new-blog-same-as-the-old-blog
description: Details about my site rebuild.
---

Welcome to the new blog! Looks familiar, right? So... a month or so ago I decided it was time to start reconsidering a rewrite. Still with [Eleventy](https://www.11ty.dev/) of course, but I really wanted to reorganize my site and possibly clean up stuff I no longer used. My site repo (<https://github.com/cfjedimaster/raymondcamden2020>) has been around since 2020 so it wasn't too old, but when I built it, I was new to Eleventy and as time went on, I patched and modified so much I'm surprised it actually ran. Add to that some six thousand or so Markdown files, I felt it was time for a change.

I decided to switch to a new repository - <https://github.com/cfjedimaster/raymondcamden2023>. I know the "best" thing to do would have been to use a branch on my existing repository, but I didn't want to fiddle with branches and I really wanted to have a "blank slate". I won't be deleting the old repo, but from now on I'll be using the 2023 one. 

My goals were:

* Rebuild the basic architecture. 
* Remove stuff I don't really need anymore. 
* Switch to a new theme. 

Let's see how well that worked.

## New Architecture

I had two main goals in mind here. First, to move most of my Eleventy site itself under a new `src` folder, and secondly to put into place some of the great ideas Lene Saile documented in her excellent blog post, [Organizing the Eleventy config file](https://www.lenesaile.com/en/blog/organizing-the-eleventy-config-file/). My [Eleventy config file](https://github.com/cfjedimaster/raymondcamden2020/blob/master/.eleventy.js) had gotten pretty gnarly. It was over 300 lines, not really organized, and just a mess. 

My [new config file](https://github.com/cfjedimaster/raymondcamden2023/blob/main/eleventy.config.js) is a third of the size, right under 100 lines. More importantly, my collections, filters, and shortcodes are all abstracted out. I feel like I could do some more trimming in the filter area, I mean check out this list:

```js
const { ageInDays, algExcerpt, catTagList, fixcattag, 
getByCategory, myEscape, my_xml_escape, titlecase, toTitle, 
postCategories, postTags } = require('./config/filters/index.js');
```

But the important thing is that now it would be a heck of a lot easier to do so. 

I also went ahead and split up my `_includes` folder such that the layout files exist in `_layouts`. Not a big deal, but again, helps organize things. I even found a layout I could get rid of. 

## Remove Stuff

When I looked at the root of my site, I saw pages that I had not touched in ages. Demos for stuff I built and never returned to. And so forth. I just got rid of em. I figure if they were tied to a blog post, I know I shared a link to the repo, and as it still exists, folks can still get the code. 

I also started using a `misc` folder under my source for "junk" that's mostly for me. Like my [stats](/stats) page for example. I just added a `permalink` to them to route them to the old URL so I can get to them via muscle memory. 

## New Theme

Well... I tried. I was considering moving to a theme that would be *super* minimal. I first tried writing my own. I wasn't happy with it. I then found a great, simplistic theme, but the code behind it was hella complex with loads of dependencies. I loved how it looked, I just wasn't happy with the code behind it. (To be clear, it wasn't bad code, it just had a *lot* going on.)

I did make a few small changes. I added header anchor links via Rhian's excellent post here: [Adding heading anchor links to an Eleventy site](https://rhianvanesch.com/posts/2021/02/09/adding-heading-anchor-links-to-an-eleventy-site/). 

I changed my avatar (look up in the left corner to see just how freaking old I am). And I probably did a few other small things I forgot as well. 

I also removed Vue from two places. In one, I simply switched to vanilla JavaScript. In another, I switched to [Alpine](https://alpinejs.dev/). Right now I still have Vue on my [stats](/stats) page, but I'll be switching that to Alpine as well.

Either way, in the future when and if I decide to tweak my theme, in theory it will be easier next time. 

As always, let me know what you think, check out the [repo](https://github.com/cfjedimaster/raymondcamden2023), and let me know if you find any bugs. 

