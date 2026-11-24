---
layout: post
title: "My To Do - Replacing what Microsoft is Killing"
date: "2026-11-24T18:00:00"
categories: ["development"]
tags: []
banner_image: /images/banners/todo.jpg
permalink: /2026/11/24/my-to-do-replacing-what-microsoft-is-killing
description: My newest app - a replacement for MS To DO
---

Earlier this week I [shared](https://www.raymondcamden.com/2026/11/20/microsoft-to-do-fan-ive-got-bad-news-for-ya) the bad news that Microsoft is killing off To Do, one of the best, simplest apps around. I built a simple [export tool](https://todoexport.netlify.app/) to let you get your existing To Dos in either JSON or HTML format. At the time, I hinted at a plan to replace the app, and today I'm happy to share it. 

[My To Do](https://mytodo.raymondcamden.com/) is a web application based *heavily* on the UI and functionality of Microsoft's app. It's got a few lists built in, but then lets you add your own and create to dos to your heart's content. Functionality includes:

* The ability to create groups of lists
* The ability to set due dates and reminders.
* The ability to create repeating tasks.
* It's an installable PWA with offline support as well.

Here's an example of it running as a Mac OSX app:

<p>
<img src="https://static.raymondcamden.com/images/2026/11/todo1.jpg" loading="lazy" alt="App example" class="imgborder imgcenter">
</p>

For folks curious, when I travel for work I try to remember to do things that make it easier for my wife while I'm gone. This is that list. 

The application was built with Google Antigravity and is hosted on Netlify. I'm going to be moving my usage this week and probably will *not* use my own export tool as I think I probably need to clean up my blog idea's list. (I mean I'll still export it, but I'm not going to import everything.) 

Finally, if you want to take a look at the code, it's all up on GitHub: <https://github.com/cfjedimaster/mytodo>