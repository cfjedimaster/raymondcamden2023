---
layout: post
title: "Microsoft To Do fan? I've got (bad) news for ya..."
date: "2026-11-20T18:00:00"
categories: ["development"]
tags: []
banner_image: /images/banners/todo.jpg
permalink: /2026/11/20/microsoft-to-do-fan-ive-got-bad-news-for-ya
description: To Do is going to die... export your data
---

Yesterday it was announced that Microsoft was killing off one of it's best apps, To Do: ["Microsoft is killing its great tasks app in favor of its worse tasks app"](https://www.theverge.com/tech/1037558/microsoft-to-do-shutdown-planner). This is a *real* bummer as the app is easily one of the best I've seen. Simple, clean, only does what it needs to do, and even as someone who is pro-AI, its one of the few apps that have resisted the urge to add AI just to add AI. 

Obviously To Do apps are everywhere, and nearly every demo out there uses the same idea, but this one really clicked with me. I used it as a dumping ground for blog ideas, to help me remember things to do before I travel, and more. Honestly, it was less a task list really and more a way to remember things that didn't feel like they should be 'notes'. 

<p>
<img src="https://static.raymondcamden.com/images/2026/11/todo.jpg" loading="lazy" alt="Sample list" class="imgborder imgcenter">
</p>

I'm already thinking about a replacement for it, but in the meantime, I needed a way to export my data. The app itself has a link to do that... which leads to a page about exporting Outlook data. And heck, maybe that works? But I don't use Outlook. I Googled for other options and the best I could find was a site that felt slightly sketchy to be honest. 

So with that in mind, I built a simple quick and dirty web based export: <https://todoexport.netlify.app/> Hit up the URL, authenticate with Microsoft, and you can export either all your To Dos, or just the ones that aren't marked complete. You can get either a JSON export for processing, or HTML for easier reading. 

The OAuth flow clearly states it will only be reading your data, but if you are concerned, you can check out the complete repo here: <https://github.com/cfjedimaster/todoexport>