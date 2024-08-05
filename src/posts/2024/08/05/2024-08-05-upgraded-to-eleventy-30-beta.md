---
layout: post
title: "Upgraded to Eleventy 3.0 (Beta)"
date: "2024-08-05T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/possum-laptop.jpg
permalink: /2024/08/05/upgraded-to-eleventy-30-beta
description: My experience upgrading this blog to the latest Eleventy blog.
---

Like I assume most of my fellow Eleventy users have been doing, I've been closely following the updates on [Eleventy](https://www.11ty.dev/) and its progress towards 3.0. As my blog is a fairly large site, I wasn't in a rush to upgrade to an Alpha release, but the recent [beta](https://www.11ty.dev/blog/three-point-oh-beta-one/) release convinced me it was time to take the plunge. The TLDR is that... it took me roughly an hour (most of which was by choice, I'll explain below) and it's been smooth sailing. Want to know more? Keep on reading...

## The Upgrade Helper

Per the [release notes](https://github.com/11ty/eleventy/releases/tag/v3.0.0-beta.1), I made use of the [upgrade helper](https://github.com/11ty/eleventy-upgrade-help) which is a plugin you install along with, of course, upgrading your site to Eleventy 3. 

This worked well and flagged my only issue, using EJS, which is removed from the core of Eleventy and requires a plugin:

<p>
<img src="https://static.raymondcamden.com/images/2024/08/eleventy1.jpg" alt="Screen output of the upgrade helper showing a lot of warnings" class="imgborder imgcenter" loading="lazy">
</p>

That screenshot probably isn't too readable, but it clearly pointed out the EJS issue. I added the EJS plugin (and filed an [issue](https://github.com/cfjedimaster/raymondcamden2023/issues/31) to remove the files later) and it corrected the issue. 

Note that I made one small mistake though. The docs for the upgrade helper say:

```js
// If you have other `addPlugin` calls, UpgradeHelper should be listed last.
eleventyConfig.addPlugin(UpgradeHelper);
```

And to be honest, I ignored the comment. It's important. If you don't have it last, it won't recognize that you've installed the EJS plugin.

## Switch to ESM

Even though it is **not** required, I thought, why not switch to ESM as well? That was *mostly* easy as I've found Node to be *really* quick and clear when you screw this up. The only real issue I had was a script I had copied from someone else that I thought wasn't going to work for... I don't know. I think just because it wasn't my code. But I went through them all, updated them all, and it worked just fine.

There's one exception to this. My serverless functions were a mix of CJS and ESM code. I only used ESM in the Netlify functions that used their new 2.X version. I figured, well, assumed, that since the serverless functions don't run in the same context as the rest of the site I didn't *have* to upgrade them. I figured I should, and did a few, but I still have two left. 

Right now when I run `netlify dev` I get a warning, but it builds just fine locally and in production:

<p>
<img src="https://static.raymondcamden.com/images/2024/08/eleventy2.jpg" alt="Console output showing warnings about the files not yet converted to ESM" class="imgborder imgcenter" loading="lazy">
</p>

Finishing up the last two serverless functions is on my TODO.

## Misc

Updating to Eleventy 3 also fleshed out a weird thing - I had a filter defined that I imported but didn't export. And I never used it. All I can think of is that it was a filter I forgot to remove sometime in the past, and for some reason, it started throwing an error in the 3.x version. Fine by me - I just deleted it from existence. 

The last and final issue I ran into was on Netlify. Eleventy 3 requires Node 18. In my site settings at Netlify, I had 20 specified. Running a build though got me a pretty quick error saying my Node version was too low. Turned out I had an environment variable specifying the version. Again, I probably did that a few years back and just forgot. I nuked that too. 

That's it really - not too difficult and I'm *real* excited about this version. I plan on hosting a `<Code><Br>` session on Eleventy once 3.0 is finalized. 