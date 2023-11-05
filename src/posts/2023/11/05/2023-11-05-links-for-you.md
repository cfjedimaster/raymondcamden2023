---
layout: post
title: "Links For You"
date: "2023-11-05T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2023/11/05/links-for-you
description: Fun links for your Sunday
---

Happy Sunday, and as I'm currently watching the Saints lose (to be fair, I'm an hour behind, watching it recorded), I figured why not go ahead and share some links that will be more winning than my poor team. As of now, I'm completely done with presentations and travel for the rest of the year, so hopefully I can catch up on some research and 'fun' technical stuff. Enjoy these links!

## Simple CSS Update Proposed - Autosizing Textareas

While I'm *very* far behind in keeping up with CSS, I'm also *very* happy with how much CSS has been improving. In this article by Amit Merchant, he discusses a new CSS property in considering for [autosizing textareas](https://www.amitmerchant.com/textarea-auto-increase-height/) as you type. For a while now I think most browsers have let you pull at the corner of a textarea to increase the size, but having a simple CSS property to automatically size as you type sounds perfect. Currently, this is Chrome only.

## Exploring the Potential of the Web Speech API in Karaoke

Next up is a cool presentation by [Ana Rodrigues](https://ohhelloana.blog/) on using the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) to build a karaoke web app. It's a quick twenty-minute presentation that's fun as heck to watch.

<iframe width="560" height="315" src="https://www.youtube.com/embed/r6yffqNJP3c?si=TrfIHOoB59Z2wo_A" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="margin:auto;display:block;margin-bottom:10px"></iframe>

## The Segmenter Feature of Intl

I've used the [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) spec a lot, but usually just for formatting numbers and dates. In this post, ["Using the Intl segmenter API"](https://polypane.app/blog/using-the-intl-segmenter-api/) from Polypane, they go into detail about how the segmenter part of Intl can be really useful. Essentially, it lets you figure out the number of words, or sentences, in a string, in a locale-friendly manner. No need for regexes or other tricks, this should, in theory, "do it right" and be correct for the language being used. 