---
layout: post
title: "Links For You"
date: "2023-06-03T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2023/06/01/links-for-you
description: Links for your eternal enjoyment.
---

Happy June folks. Not sure what that actually means, but Happy June nonetheless. Before I get into the links, a quick reminder that I'm looking for sponsorship for the site, primarily to let me upgrade my Mailchimp account. If you, or your company, wish to help out, just send me an email. I'd be happy to mention your sponsorship on the site. I'll also remind folks of my [Patreon](https://www.patreon.com/raymondcamden). Alright, I promised I wouldn't be (too) annoying about asking for donations, so let's move on!

## Badass Natural Language Parsing with Chrono

Pardon the French, but the [Chrono](https://github.com/wanasit/chrono) library really is badass. It takes natural language expressions (for a subset of languages, though) for dates and converts them into real dates. So for example:

* "An appointment on Sep 12-13" - "2023-09-12T17:00:00.000Z"
* "tomorrow" - "2023-06-04T15:36:14.087Z"
* "six days ago" - "2023-05-28T15:36:14.087Z"

It's got quite a few options detailed in their [docs](https://github.com/wanasit/chrono)](https://github.com/wanasit/chrono) so check it out and see if it will be useful in your projects. I got a quick CodePen working below if you want to play with it. 

<p class="codepen" data-height="500" data-default-tab="js,result" data-slug-hash="GRYVejM" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/GRYVejM">
  Untitled</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Laying Out a Print Book With CSS

This [great post](https://iangmcdowell.com/blog/posts/laying-out-a-book-with-css/) by Ian G McDowell goes into incredible detail about how CSS can be used to create a beautiful book layout on the web. I continue to be amazed at how far CSS has come in the last decade and if I ever see a "Peter Griffen trying to work with blinds is the same as CSS" meme gif again I'm going to have to throw down. (Actually no, I'm about as scary as an avocado.) 

While I'm praising CSS, I'll also point out that you can sign up for a great newsletter on the topic, [cssweekly](https://css-weekly.com/). 

## How to Add Hotlink Protection to Your Web Fonts With Netlify Edge Functions and Deno

I've yet to make use of Netlify Edge functions and if you're in the same boat, this is a *great* blog post showing where they make sense. Written by Sidney Alcantara, this [post](https://betterprogramming.pub/how-to-add-hotlink-protection-to-your-web-fonts-with-netlify-edge-functions-and-deno-2fd97f348743) explains how edge functions can be used to check for, and potentially block, direct access to web font resources. For sites using commercial fonts (legally of course) that require protection, this is a great and relatively simple solution you could have up and running quickly. 

## And Lastly...

Here's a quick and fun video. ["The Prisoner"](https://en.wikipedia.org/wiki/The_Prisoner) was one of the most fascinating shows to ever air on TV. Enjoy! 

<iframe width="560" height="315" style="margin:auto;display:block;margin-bottom:15px" src="https://www.youtube.com/embed/nVG9uGVKdt8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>