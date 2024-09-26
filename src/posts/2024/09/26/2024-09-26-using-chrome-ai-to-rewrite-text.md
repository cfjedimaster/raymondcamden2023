---
layout: post
title: "Using Chrome AI to Rewrite Text"
date: "2024-09-26T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cats_copying_text.jpg
permalink: /2024/09/26/using-chrome-ai-to-rewrite-text
description: Another look at Chrome's upcoming GenAI features.
---

Earlier this month, I [discussed](https://www.raymondcamden.com/2024/09/10/using-the-chrome-ai-summarizer-early-look/) how Chrome's upcoming built-in AI support was adding new features specifically tailored to certain use-cases. In that [post](https://www.raymondcamden.com/2024/09/10/using-the-chrome-ai-summarizer-early-look/), I looked at the Summarizer API. For today, I decided to take a look at the rewriter API.

As a quick reminder, this is *very* early on, and if you want to try this yourself, you should hit the [sign-up form](https://docs.google.com/forms/d/e/1FAIpQLSfZXeiwj9KO9jMctffHPym88ln12xNWCrVkMY_u06WfSTulQg/viewform?resourcekey=0-dE0Rqy_GYXDEWSnU7Z0iHg) and read the [intro post](https://developer.chrome.com/blog/august2024-built-in-ai?hl=en) from the Chrome folks first. Obviously, everything I'm going to show below probably will, almost certainly will, change before shipping. 

Ok, with that out of the way, let's talk rewriting, specifically, how the Chrome API operates. Given a set of source input, the API can shorten, or lengthen the input, as well as help modulate the level of formality of the text. Another example would be to, well not "dumb down", but simplify text for audiences of different technical abilities.

One of the reasons this excites me is the specific use-case of shortening content. I feel like this is something I've hit many times in the past. I'll be using a form on the web, enter some text, and then be told I need to shorten my input. (By the way, if your form doesn't provide real-time feedback about this, that's a UX issue you need to correct. See my [post from last year](https://www.raymondcamden.com/2023/08/09/adding-form-fields-characters-counters-with-alpinejs) on how I did this with Alpine as an example.) 

As a way to see this in action, I built a quick demo that provides a text area for input and then provides a shorter version of your text:

<p>
<img src="https://static.raymondcamden.com/images/2024/09/shoter1.jpg" alt="Screenshot of the application I built, showing a text field with a block of input, a button 'Make Shorter', and result text." class="imgborder imgcenter" loading="lazy">
</p>

In case it is difficult to read in the screenshot, my input was my typical bio:

<blockquote>
Raymond Camden is a Senior Developer Evangelist for Adobe. He works on the Acrobat Services APIs to build powerful (and typically cat-related) PDF demos.  He is the author of multiple books on web development and has been actively blogging and presenting for almost twenty years. Raymond can be reached at his blog (www.raymondcamden.com) or via email at raymondcamden@gmail.com.
</blockquote>

Thrilling, right? You would definitely hire me as your next GenAI Evangelist I bet! After using the built-in AI service to shorten it, the result was:

<blockquote>
Raymond Camden is a Senior Developer Evangelist for Adobe. He's the author of multiple books on web development and has been blogging and presenting for nearly 20 years. He can be reached at his blog (www.raymondcamden.com) or via email at raymondcamden@gmail.com.
</blockquote>

I got to say, I think this is the most impressed I've been so far with these proposed APIs. For the heck of it, I took this output and fed it back in. The result was:

<blockquote>
Raymond Camden is a web development evangelist for Adobe. He's the author of several books, blogs, and presents regularly. You can contact him at his blog or email.
</blockquote>

To be honest, that's dang good. And because I'm crazy, I did it again:

<blockquote>
Raymond Camden, Adobe web development evangelist, writes books and blogs and gives presentations. You can contact him at his blog or email.
</blockquote>

Again, great result. It would be stupid for me to do it again. So I did it:

<blockquote>
Raymond Camden writes books, blogs, and gives presentations. You can contact him at his blog or email.
</blockquote>

At this point we are down to 17 words. Let's do it again:

<blockquote>
Raymond Camden blogs, writes, and presents. Contact him at his blog or email.
</blockquote>

Just 13 words. And yes, I did try again and it wasn't able to make it shorter. In theory it could have gone with "Mr. Camden", but honestly, I'm pretty pleased with the iterations. 

Let's look at the code. I'm going to 'paraphrase' a bit from the Alpine.js bits. After you determine if the browser supports it, you can then create a session:

```js
session = await window.ai.rewriter.create({
	sharedContext:'You help shorten text',
	length:'shorter'
});
```

I feel like `sharedContext` would normally be more tuned to a particular kind of content. So for example, if this were helping writers on a site dedicated to cats, the context could be modified to discuss that. For `length`, you have values for shortening, lengthening, or keeping it as is. There is also a 'tone' setting that lets go for more formal and casual. 

Once you have that, this is all you need to do:

```js
let newText = await session.rewrite(input);
```

And that's it. *Incredibly* simple. I will share the CodePen below so you can see the full code, but 99% of it is Alpine.js and, again, it won't work for you outside of Chrome Canary. That being said, I am curious what you think. Leave me a comment!

<p class="codepen" data-height="500" data-default-tab="js,result" data-slug-hash="yLmyjGE" data-pen-title="window.ai - shorten" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/yLmyjGE">
  window.ai - shorten</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>
```