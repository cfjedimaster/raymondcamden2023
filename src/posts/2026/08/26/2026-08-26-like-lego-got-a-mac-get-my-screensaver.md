---
layout: post
title: "Like LEGO? Got a Mac? Get My Screensaver"
date: "2026-08-26T18:00:00"
categories: ["development"]
tags: []
banner_image: /images/banners/legos.jpg
permalink: /2026/08/26/like-lego-got-a-mac-get-my-screensaver
description: Introducing a LEGO screensaver I built with Cursor.
---

Good morning my fabulous readers. This will be a quick post as I just wanted to share something cool I built with Cursor over the past couple of days - a LEGO screensaver. I'm a huge fan of "show me something random from something I like" and have built multiple bots in that vein. I recently discovered [Rebrickable's LEGO datasets](https://rebrickable.com/downloads/) which contains a CSV file of LEGO sets. The data looks like so:

```
set_num,name,year,theme_id,num_parts,img_url
0003977811-1,Ninjago: Book of Adventures,2022,761,1,https://cdn.rebrickable.com/media/sets/0003977811-1.jpg
001-1,Gears,1965,756,43,https://cdn.rebrickable.com/media/sets/001-1.jpg
0011-2,Town Mini-Figures,1979,67,12,https://cdn.rebrickable.com/media/sets/0011-2.jpg
0011-3,Castle 2 for 1 Bonus Offer,1987,199,0,https://cdn.rebrickable.com/media/sets/0011-3.jpg
0012-1,Space Mini-Figures,1979,143,12,https://cdn.rebrickable.com/media/sets/0012-1.jpg
0013-1,Space Mini-Figures,1979,143,12,https://cdn.rebrickable.com/media/sets/0013-1.jpg
```

I thought it would be cool to select a random set, show the year, name, number of pieces, and render the image as well. I gave this CSV to Cursor and started iterating on building a simple OSX screensaver. I had it filter out sets where the number of pieces was greater than or equal to 50 (typically "swag", non-buildable items) or with names that also appeared to be non-buildable things. 

After that, I just let Cursor handle creating the project. I know *nothing* about OSX development, thankfully Cursor does. The only real issue I ran into was OSX aggressively caching the screensaver data which made updates a bit difficult. I think we (and by that I mean mostly Cursor, and some me) figured that out eventually. 

Here's an example of how it looks:

<p>
<img src="https://static.raymondcamden.com/images/2026/08/lego.png" loading="lazy" alt="LEGO screensaver example" class="imgborder imgcenter">
</p>

Alright, so before I link you to the GitHub repo, a quick warning. I'm not paying Apple for a developer's license which means if you get the build, you'll need to run a one-time command in your terminal to whitelist the app. 

Ok, with that out of the way, head over to the repo and check it out: <https://github.com/cfjedimaster/lego-screensaver>