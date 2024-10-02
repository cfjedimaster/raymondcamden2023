---
layout: post
title: "Eleventy 3.0 Released (and in use here!)"
date: "2024-10-02T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/eleven.jpg
permalink: /2024/10/02/eleventy-30-released-and-in-use-here
description: Eleventy 3.0 has been released!
---

This is just a quick note to let my readers know that [Eleventy](https://11ty.dev) 3.0 has been released. This is a huge update and folks using it should read the full release notes here: [Eleventy v3.0.0: Possums ❤️ ESM](https://github.com/11ty/eleventy/releases/tag/v3.0.0).

I've been running a beta for a while. You can see the issues I ran into here: [Upgraded to Eleventy 3.0 (Beta)](https://www.raymondcamden.com/2024/08/05/upgraded-to-eleventy-30-beta). I upgraded to the final version yesterday and ran into one issue, a template that output to a path without an extension. This was very clearly detailed in the error I got:

```
[11ty] Problem writing Eleventy templates:
[11ty] The template at './src/webfinger.liquid' attempted to write to './_site/.well-known/webfinger' (via `permalink` value: '.well-known/webfinger'), which is a target on the file system that does not include a file extension.
[11ty]
[11ty] You *probably* want to add a file extension to your permalink so that hosts will know how to correctly serve this file to web browsers. Without a file extension, this file may not be reliably deployed without additional hosting configuration (it won’t have a mime type) and may also cause local development issues if you later attempt to write to a subdirectory of the same name.
[11ty]
[11ty] Learn more: https://v3.11ty.dev/docs/permalinks/#trailing-slashes
[11ty]
[11ty] This is usually but not *always* an error so if you’d like to disable this error message, add `eleventyAllowMissingExtension: true` somewhere in the data cascade for this template or use `eleventyConfig.configureErrorReporting({ allowMissingExtensions: true });` to disable this feature globally.
```

And since I *did* want it write without an extension, I added the value suggested:

```
---
permalink: '.well-known/webfinger'
eleventyExcludeFromCollections: true
eleventyAllowMissingExtension: true
---
```

And that was literally it. I did take the opportunity to upgrade two remaining serverless functions to ESM and that took about an hour or so, mostly due to *non*-Eleventy issues. I didn't have to update them but I was tired of the errors. 

Now that 3.0 is shipped, I'm planning on doing an intro to it on my [`<Code><Br>`](https://cfe.dev/talkshow/code-break/) show later this fall. 
