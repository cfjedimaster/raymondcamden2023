---
layout: post
title: "Working with CloudCannon and Eleventy - My Experience"
date: "2023-04-06T18:00:00"
categories: ["jamstack"]
tags: ["eleventy","cloudcannon"]
banner_image: /images/banners/writing.jpg
permalink: /2023/04/06/working-with-cloudcannon-and-eleventy-my-experience
description: My experience testing the CloudCannon CMS experience with Eleventy.
---

I've been working with the Jamstack (in its various iterations and names) for many years now. In that time, one area I had not really looked into is the use of a content management system (CMS). I recently had a chance to look into how [CloudCannon](https://cloudcannon.com/) adds CMS capabilities to [Eleventy](https://www.11ty.dev/) and I thought I'd share my experience. I went in, admittedly, a bit concerned. One of Eleventy's greatest strengths is its flexibility. Unlike other Jamstack solutions that have a proscribed way of doing things, Eleventy is *incredibly* open to how it can be used to build a site. My assumption was that it would be difficult for a CMS to "grok" a particular Eleventy implementation and support it. Turns out my concerns were unwarranted. Let me share what I discovered.

## Start with the Guide

This is probably obvious but start with the [Eleventy-specific guide](https://cloudcannon.com/documentation/guides/eleventy-cms-get-started-with-cloudcannon/) created by CloudCannon. While it begins with Eleventy-specific content, it then goes into more general content about CloudCannon is an excellent way to start. In many cases, I've seen platform products produce short, isolated content related to a specific tool, but this guide takes the time to go a bit further into the more general things a new user would want to know. I appreciate that and as I work in developer relations it's a strategy I'm going to consider in the future.

## Support for Eleventy 2.0 is Ready to Go

When I first began testing, one issue I ran into quickly was support for 2.0. Eleventy 2.0 is a fairly recent release, so I wasn't too surprised that it caused an issue (also, my initial test was over a month ago). I reached out to support, and they identified it as an issue, gave me a workaround as well as a general ETA for a proper fix, and in my case, I just waited. I had to reach out to support a few times in my experiments with CloudCannon and I was impressed with how quickly I got a response. 

## About that Flexibility

As I mentioned in the beginning, I was concerned about how a CMS would handle the flexibility of Eleventy. In one of my first tests, I worked with a copy of my blog, which is both a large site and a somewhat complex one. As I worried, things did go a bit haywire but it turns out CloudCannon has a built-in way of handling that - [configuration files](https://cloudcannon.com/documentation/articles/setting-global-configuration/). I added a simple YAML file that quickly corrected the issues I was seeing. Obviously how and when you use this will depend on your site, but it's important to know that if you do see issues with how the CMS is working with your site, it's possible a quick configuration file will help things out. 

If you're curious about the specifics, CloudCannon had difficulty understanding the path to my posts and regular pages. This was corrected with a few lines of YAML:

```
collections_config:
  posts:
    path: _posts
  pages:
    path: ''
    filter: strict

collections_config_override: true
```

## HTML, It Matters

The next issue I ran into was an odd one. I'd go to edit a post and I'd be forced into the raw code editor, not the pretty visual one. This turned out to be entirely my fault. For my blog, I use some code to lazy load images. The HTML looks like so:

```html
<img data-src="https://static.raymondcamden.com/images/2023/03/alp1.jpg" alt="Table of four cities and four weather forecasts." class="imgborder imgcenter lazyloaded">
```

I use JavaScript to find the image tags with `data-src`, wait for them to become visible, and then load them at that time. Unfortunately, this means people without JavaScript don't see the image at all. I need to rethink this solution at some point, but the important part is that the invalid HTML caused the CMS to not be able to use the nicer editor. Support mentioned that the error could have been handled better (with a warning for example), but it was entirely my fault, and indicative of a site that's been patch worked for quite a few years.

## Passthrough File Copy, It Also Matters

I started over with a new site, a copy of the one that people can build with my [Eleventy Blog guide](https://cfjedimaster.github.io/eleventy-blog-guide/guide.html). This was an incredibly simple application and I figured it would be a good test for CloudCannon, but once again I ran into an issue. While using the editor, I uploaded an image, and it rendered fine there, but when saved and viewed publicly, it did not show up.

This may shock you, but the issue was my fault again. One thing that bites new Eleventy users is that they quickly discover Eleventy will ignore files it doesn't process, including images, CSS, and JavaScript. Eleventy makes it easy to correct this via the [Passthrough File Copy](https://www.11ty.dev/docs/copy/) feature but it's a bit "low" in the docs and easily missed when learning. This week, Eleventy released additional documentation to help address this: [Adding CSS, JavaScript, Fonts](https://www.11ty.dev/docs/assets/) and that's a great addition. 

In my own Eleventy blog guide, I was trying to keep things as simple as possible and never addressed this. Therefore my blog didn't have support for images, which in retrospect was kind of dumb. I've since updated my guide to add this, and once my code was added to my repository, CloudCannon was able to pick up on it immediately. 

I'll also note that while debugging this (and a big shout out to CloudCannon support for again helping me out), they pointed out that you get very nice control over how media is uploaded and placed. You can find out more in the [docs](https://cloudcannon.com/documentation/articles/adjusting-the-uploads-path/?ssg=Eleventy)

## It Works!

So after a few missteps (with a majority of the issues being my fault), I got things working. While it's pretty basic, you can see the live version at <https://thrifty-goldfinch.cloudvent.net/>. The CMS editor is - honestly - a delight. The dashboard gives you a visual of your site, including a mobile version, and the activity log is super useful:

<p>
<img data-src="https://static.raymondcamden.com/images/2023/04/shot1.png" alt="Dashboard" class="lazyload imgborder imgcenter">
</p>

Writing content is also well done. As someone with a *long* history on the web, I don't have an incredibly high opinion of rich text editors, but the CloudCannon one keeps things really simple and outputs great HTML.

<p>
<img data-src="https://static.raymondcamden.com/images/2023/04/shot2.png" alt="Post Editor" class="lazyload imgborder imgcenter">
</p>

Honestly, as a developer who lives and breathes writing Markdown, this was absolutely pleasant and has me completely reconsidering how I write content for my own site. I'm definitely going to be recommending CloudCannon in the future and using it when I can!

