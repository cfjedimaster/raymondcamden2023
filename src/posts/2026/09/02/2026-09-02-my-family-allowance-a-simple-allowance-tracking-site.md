---
layout: post
title: "My Family Allowance - a Simple Allowance Tracking Site"
date: "2026-09-02T18:00:00"
categories: ["misc"]
tags: ["astro"]
banner_image: /images/banners/money.jpg
permalink: /2026/09/02/my-family-allowance-a-simple-allowance-tracking-site
description: A new site I built to help you track allowance for your kids.
---

As you can probably tell, I've been on a bit of a builder kick the last few weeks. Today's "release" (it's been live for a few days already) is a tool to help fix a manual process we had in our family - tracking allowance for the kids. 

Previously we made use of a Google Sheet. Each kid had a column. When a kid would ask for something, we'd look to see when we last added allowance, multiply the number of weeks by their rate, add it, and then add another row to reduce by the amount they were spending. A simple formula on the right hand side would give a running total so they could see what their current balance was. 

I decided to take this manual process and turn it into a proper application.

<p>
<img src="https://static.raymondcamden.com/images/2026/09/over.webp" loading="lazy" alt="Overengineering everywhere" class="imgborder imgcenter">
</p>

Using Cursor, I created an application with the following features:

* The parent signs up with their Google account.
* They then have a simple admin to add, edit, and delete kids while setting their weekly allowance.
* The parent can then add or remove funds when necessary.
* Every Sunday, automatically, allowance is paid.
* They are given a unique URL for their family and can set a basic password. A great idea for this would be the same password used for wifi in the house.
* The "family" URL lets kids see their totals, and even click in to see a transaction history if they want to remember what they spent money on.

The stack is Astro, hosted on Netlify, with their Netlify DB as the storage system.

That's it! You can check it out here: <https://www.myallowance.family/>. If you want to check out the source, you can check out the repo: <https://github.com/cfjedimaster/myfamilyallowance>

Photo by <a href="https://unsplash.com/@igalness?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Igal Ness</a> on <a href="https://unsplash.com/photos/person-holding-fan-of-100-us-dollar-bill-9wY2ofzQ9Us?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>