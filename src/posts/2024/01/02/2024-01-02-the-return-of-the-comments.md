---
layout: post
title: "The Return of the Comment(s)"
date: "2024-01-02T18:00:00"
categories: ["misc"]
tags: []
banner_image: /images/banners/cat_comments.jpg
permalink: /2024/01/02/the-return-of-the-comments
description: New comments provided by Giscus
---

In the twenty plus years this blog has been around, I've had various different comment systems. Initially, I simply stored them in a database (this blog used to be powered by ColdFusion), but eventually moved to [Disqus](https://disqus.com/). I had a pretty huge amount of comments and was generally OK with the service, but eventually, folks simply stopped commenting. 

I then made the decision to simply kill off the integration. I wrote some scripts to get my data, stored them as flat files, and you can still see the old comments on posts that had them. 

About a year or so I added in [Webmentions](https://indieweb.org/Webmention), which works ok, but doesn't really feel the same. 

After some time thinking about it, I decided maybe its time to try again. The excellent and *incredibly* easy to set up [Giscus](https://giscus.app/) uses GitHub discussions to power commenting. Now, that does mean that you need a GitHub account to comment, but with this being a very technical blog (a technical *cat* blog), I figured it was a safe assumption.

I'm only enabling commenting for posts from this year and forward, and if you're curious, that code looks like so:

```
{% raw %}{% assign year = page.date | date: "%Y" %}
{% if year >= 2024 %}
	{% include 'giscus' %}
{% endif %}{% endraw %}
```

I love me some Liquid. 

Anyway, leave me a comment! Say hello, introduce yourself, and so forth. 