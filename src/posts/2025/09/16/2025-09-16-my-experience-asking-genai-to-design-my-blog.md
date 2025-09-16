---
layout: post
title: "My Experience Asking GenAI to Design My Blog"
date: "2025-09-16T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_painting.jpg
permalink: /2025/09/16/my-experience-asking-genai-to-design-my-blog
description: What happened when I asked GenAI to design my blog...
---

What was my experience using GenAI tools to design my blog? Well, you're looking at it! As I mentioned [last week](https://www.raymondcamden.com/2025/09/10/time-for-something-new), my new design came from one of my experiments using GenAI to help me design a new theme, but I wanted to share a bit more about the experience when I had time, and that time is now. 

About two or so months ago, I had the idea of testing out GenAI to create themes for small web apps. While my blog is actually *huge* (near seven thousand pages), design wise it's basically:

* A home page
* A post page
* A "everything else" page

That's just three basic pages, all sharing a main layout with slight differences in what's the main content of the page. I thought it would be fun to give multiple different GenAI tools a chance to spec out a blog theme to see what would happen. 

## The Process 

For my tests, I made use of the same prompt every time:

```
I want to create a new theme for my blog. My blog is developer-centric. 
My theme should consist of one main HTML file, one CSS file, and minimal 
if any JavaScript. (You can create an empty JS file and include it 
though if you wish.)

Absolutely NO framework must be used. Absolutely no React, or Vue, or 
anything, and no build process. I literally just want static HTML and CSS. 

I want a dark green centric theme as green is my favorite color. 

The theme should be responsive and look on mobile devices.

The main page you create should include a title for the blog and 10 
blog entries listed in reverse chronological order. Each blog post 
should include a date.

The top level menu should include a links to: Home, About, Speaking 
(I'm a frequent speaker at conferences), Subscribe. You can also 
include a link to a search page, or perhaps a small search field. 

Finally, using this template, create a page for an individual blog post. 
That template should include a date and a list of categories associated 
with the blog post. 
```

I tried to be specific in terms of what I wanted as well as what I *didn't* want. 

For the tools I used, I wanted something that integrated into my editor and could write to the file system. I didn't always do this as one solution I'll share below made use of the CLI. 

Once the initial results were created, I'd open them up and see if I wanted any tweaks. To be clear, not in regards to make the design 100% complete, just initial reactions and things I thought should change immediately.

Finally, for each of these (except one), I made a video, and that's primarily what I'll be sharing below. Ok, let's get to it!

## Copilot in Visual Studio Code

My first attempt made use of Copilot in Visual Studio Code. This is baked into VSC now with no need to install anything extract, and you get a decent free tier with a GitHub sign-in I believe. Here's how it went down.

{% liteyoutube "myT_uKhdYt8" %}

You can find the resulting code here: <https://github.com/cfjedimaster/gen_my_new_blog_theme/tree/main/copilot_in_vsc>

And you can see it in action here: <https://cfjedimaster.github.io/gen_my_new_blog_theme/copilot_in_vsc/index.html>

All in all not bad, but not my favorite shade of green.

## Gemini in Visual Studio Code

Next was Google Gemini in Visual Studio Code. Nearly all of my experience with GenAI has been via Google Gemini, so it has a special place in my heart. This one had a few issues while recording though.

{% liteyoutube "JfTMRLiaAbo" %}

You can find the code for this version here: <https://github.com/cfjedimaster/gen_my_new_blog_theme/tree/main/gemini_in_vsc>

And demo it here: <https://cfjedimaster.github.io/gen_my_new_blog_theme/gemini_cli/index.html>

## Cursor

Next was [Cursor](https://cursor.com/en), an editor built on the open source portion of Visual Studio Code. You can see how it went down here:

{% liteyoutube "X9vmNbe9ykM" %}

The code may be found here: <https://github.com/cfjedimaster/gen_my_new_blog_theme/tree/main/cursor>

You'll note it did *not* listen to my instruction to create a blank JavaScript file, but to be honest, this is pretty much what I do in a lot of apps when starting anyway:

```js
// DevBlog JavaScript
// This file is intentionally minimal as requested
// Future enhancements can be added here

console.log('DevBlog loaded successfully!');

// Placeholder for future functionality
document.addEventListener('DOMContentLoaded', function() {
    // Future JavaScript functionality can be added here
});
```

You can demo this one here: <https://cfjedimaster.github.io/gen_my_new_blog_theme/cursor/index.html>

This was *almost* the design I picked. 

## Gemini via CLI

Ok, so this is cheating a bit, but it was suggested I give the [Gemini CLI](https://cloud.google.com/gemini/docs/codeassist/gemini-cli) a try and I figured, why not. As I said, I'm a huge fan of Gemini but I had not tried out the CLI. Here's how this one went:

{% liteyoutube "wM0qfY-Yeas" %}

You can peruse the source here: <https://github.com/cfjedimaster/gen_my_new_blog_theme/tree/main/gemini_cli>

And see it in action here: <https://cfjedimaster.github.io/gen_my_new_blog_theme/gemini_cli/index.html>

Not surprisingly, it's pretty similar to the Gemini in VSC one.

## Claude

For my fifth attempt, I used Claude, again in Visual Studio Code:

{% liteyoutube "tmAlTETGaXY" %}

The generated code can be found here: <https://github.com/cfjedimaster/gen_my_new_blog_theme/tree/main/claude>

The resulting blog can be seen here: <https://cfjedimaster.github.io/gen_my_new_blog_theme/claude/index.html>

## And the Winner Is...

None of the above! Ok, technically it's Claude, but I recently got access to [Kiro](https://kiro.dev/), a new AI IDE from Amazon, which uses Claude, and when I tried out my prompt there, I was *incredibly* happy with the results. I didn't record a video for it, but I felt like I hand landed on my final design and just went for it. What's cool is - after I decided to implement it on my blog here, I went back to Kiro multiple times to ask for tweaks I needed for various parts of my site. As one example, I asked for a good blockquote UI.

<blockquote>
And you can see the result here.
</blockquote>

I also asked for a good design for a form field and button, which you can see in the newsletter signup below. All in all it just really clicked with me, even though I didn't even try the spec-driven development that is the core feature of the product. 

All in all, I'm pretty darn pleased with this experiment. I've already used GenAI a few times for small design challenges and I think this one turned out great. Let me know what you think - leave me a comment below!

Image by <a href="https://pixabay.com/users/vika_glitter-6314823/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=6775790">Victoria</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=6775790">Pixabay</a>