---
layout: post
title: "Testing Out the Alpine.js Intersect Plugin"
date: "2023-09-20T18:00:00"
categories: ["javascript"]
tags: ["alpinejs"]
banner_image: /images/banners/intersection.jpg
permalink: /2023/09/20/testing-out-the-alpinejs-intersect-plugin
description: 
---

A few weeks ago, I finally got around to looking at the official plugins [Alpine.js](https://alpinejs.dev) supports and built a little demo that integrated the Intl spec with the Mask plugin. (You can read the post here: [Integrating Intl with Alpine.js Mask](https://www.raymondcamden.com/2023/09/06/integrating-intl-with-alpinejs-mask)). Today I thought I'd take a look at another plugin, [Intersect](https://alpinejs.dev/plugins/intersect).

## What Is It?

The Intersect plugin is a wrapper for the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). This is a pretty cool web platform API that lets you monitor when DOM elements come into the visible part of a web browser. I first dug into this a few months ago in an article I wrote for Cloudinary, ["Automatically Loading High-Quality Images with Cloudinary and IntersectionObserver"](https://cloudinary.com/blog/automatically-loading-high-quality-images-cloudinary-intersectionobserver).

In that article, I show how to use the API to determine when an image has become visible and swap out a lower-quality version of an image with a higher-quality one. I thought this was a pretty cool idea as folks without JavaScript still get the images, albeit more lightweight ones, and those with JavaScript get nicer images, but only when necessary. 

The Intersect plugin looks to make using the API even simpler. By adding `x-intersect` to anything in the DOM (within an Alpine.js application), you can assign logic to fire when the item becomes visible. Here's an example:

```html
<div x-data="myApp">
   (imagine lots of DOM crap that adds a lot of white space...)
   <div x-intersect="visible = true">
   When I'm visible, the variable, visible, will be set to true.
   </div>
</div>
```

Here's a live example where I've placed `x-intersect` on an image tag. When you scroll down to it, you'll get an alert. If you scroll up and back, you'll get the alert again. This is done like so:

```html
<img x-intersect="meow" src="https://placekitten.com/500/500">
```

With the Alpine.js code being just:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
        meow() {
            alert('Meow!');
        }
  }))
});
```

Here's the demo itself (and as an aside, Edge started acting up with the scrolling in the result pane for me, but I couldn't reproduce it anywhere else, so if you *do* have an issue with the demo, maybe quickly try Chrome/Safari/etc).

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="eYbyJMX" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/eYbyJMX">
  Alpine Intersection Demo (A)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Right away, you probably ask, is there a way to handle intersects, but only care about the *initial* event of it being visible? Turns out that's pretty easy. There are 5 different [modifiers](https://alpinejs.dev/plugins/intersect#modifiers) you can use to tweak the behavior, with one being `.once`. 

To make that modification to the previous demo, it's just a quick addition:

```html
<img x-intersect.once="meow" src="https://placekitten.com/500/500">
```

If you run this demo, you should only get the alert once.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="mdapVaw" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/mdapVaw">
  Alpine Intersection Demo (A)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## A Real Demo

Given how easy it is to use, I thought I'd modify the demo I built for my [Cloudinary blog post](https://cloudinary.com/blog/automatically-loading-high-quality-images-cloudinary-intersectionobserver) and give it an Alpine.js twist. 

I'll start with a demo that *doesn't* make use of this feature. In the initial version, Alpine will define a set of images and render them to the DOM, but first, it will make use of Cloudinary's APIs to serve it via its CDN, giving us some free automatic performance boosts. Here's the HTML:

```html
<div x-data="app">
    <div id="images">
        <template x-for="image in images">
            <p><img :src="image"></p>
        </template>
    </div>
</div>
```

And the JavaScript behind it. I trimmed the list of images to make the code listing a bit shorter.

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
        init() {
            this.images = this.initialImages.map(i => this.cloudinize(i));
        },
        images:[],
        initialImages: [
            "https://static.raymondcamden.com/images/2023/04/300_1.jpg",
            "https://static.raymondcamden.com/images/2023/04/700.jpg"
        ],
        cloudinize(u) {
            return 'https://res.cloudinary.com/raymondcamden/image/fetch/' + u;
        },
  }))
});
```

I want to apologize for the `cloudinize` name for a method. That's literally one of the worst names for a method ever. But I like it. You can view this initial version below:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="vYvWRLM" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/vYvWRLM">
  Alpine Intersection Demo (1)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Alright, so now I want to modify this in two ways. First, I want to use lower-quality images by default. This will reduce the initial load for all those images. This is done via a very small change to `cloudinize`:

```js
cloudinize(u) {
    return 'https://res.cloudinary.com/raymondcamden/image/fetch/q_30/' + u;
},
```

Basically, by adding `q_30` to the URL, I've asked Cloudinary to reduce the quality down to 30%. 

Next, I modify my HTML to handle the intersection:

```html
<template x-for="(image,idx) in images" :key="idx">
    <p x-intersect.once="swapImage(idx)"><img :src="image"></p>
</template>
```

In the code above, I'm calling `swapImage` and passing the current loop index. My data is an array, so I don't care about the actual value in the loop, just the index. Also, notice `.once` - it only makes sense to 'upgrade' the image once. 

Here's the JavaScript:

```js
swapImage(x) {
    this.images[x] = this.images[x].replace('q_30', 'q_90');
}
```

Since Cloudinary lets you swap out different operations by just changing the URL, this online line handles swapping out the 30% quality version with the 90% one. Here's a complete demo. You may want to open it in a new tab and check your devtools to see the new images load as you scroll.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="xxmPWVz" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/xxmPWVz">
  Alpine Intersection Demo (2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Let me know what you think, and definitely check both the [docs](https://alpinejs.dev/plugins/intersect) for more about the plugin and the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) for details on the API as a whole. 

Photo by <a href="https://unsplash.com/@darshan394?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Deva Darshan</a> on <a href="https://unsplash.com/photos/Jt9syHEhrPE?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  