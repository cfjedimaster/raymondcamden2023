---
layout: post
title: "Adding Programming Language Detection with Built-in Chrome AI"
date: "2025-08-13T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_laptop3a.jpg
permalink: /2025/08/13/adding-programming-language-detection-with-built-in-chrome-ai
description: How well can Chrome's built-in AI detect programming languages?
---

As I've been playing, and thinking, more and more about how to best add [Chrome AI](https://developer.chrome.com/docs/ai/built-in) support to web apps, I came across an interesting use-case that I think could be helpful, and like in my previous examples, be completely ok if it didn't actually work. When I write on the [developer blog at Foxit](https://developer-api.foxit.com/developer-blogs/), I make use of WordPress plugin for code samples. This editor has a place for you to both paste in your code, and select the language so the proper highlighter is used:

<p>
<img src="https://static.raymondcamden.com/images/2025/08/code1.jpg" alt="Code block editor in WordPress" class="imgborder imgcenter" loading="lazy">
</p>

This works well enough, but it gets a bit annoying to have to constantly keep selecting Python in the dropdown. Ideally the form would use the last language (simple enough via `LocalStorage`), but I was curious how well Chrome's [Prompt API](https://developer.chrome.com/docs/ai/prompt-api) could handle the task.

To be clear, this is *not* the same as the [Language Detection API](https://developer.chrome.com/docs/ai/language-detection) which is good for identifying spoken languages. What I wanted was something that could understand programming languages, or code. 

I forked one my earlier examples and built a form with a textbox and a simple button to kick off the analyzation. So for example, I pasted in the JavaScript code for the actual Code Pen and analyzed that:

<p>
<img src="https://static.raymondcamden.com/images/2025/08/code2.jpg" alt="Example" class="imgborder imgcenter" loading="lazy">
</p>

(As a quick aside, after I took this screenshot I was curious if I could disable the spellcheck in the `textarea`. Turns out you can as easy as `spellcheck="false"`.)

You'll notice it had no problem detecting JavaScript. So I threw in a couple of others tests and was surprised how well it worked:

* It had no trouble with Python
* Or HTML and CSS
* I even took the code from this post and it recognized it as Markdown
* I tried an old Perl CGI script - worked!
* I even tried ActionScript - and it worked!
* ColdFusion? Yep
* PHP? Yep

And how about the ultimate test:

<p>
<img src="https://static.raymondcamden.com/images/2025/08/code3.jpg" alt="COBOL never dies" class="imgborder imgcenter" loading="lazy">
</p>

So my demo is fairly simple, just printing out the result, but if I wanted to tie it to something like I said above, you could imagine taking the result, comparing it to the list of options in a dropdown for your editor, and selecting one on a match. (Of course, only do this if the user hasn't selected a language already.)

As for the code, it's pretty close to my other demos so I'll focus on the AI parts, not so much the DOM parts. First, the session:

```js
session = await LanguageModel.create({
	initialPrompts: [
		{role:'system', content:'You look at a sample of code and try to determine the programming language being used. You will only return the name of the programming language, nothing else.'}
	]
```

And then the call:

```js
let result = await session.prompt([
	{
		role:"user",
		content: [
			{ type: "text", value:$input.value }
		]
	}]);
```

And that's it. I decided against a JSON schema this time as it was so simple, but that could be done as well to help enforce the "one word" response constraint. 

As with my other demos here, you'll need Chrome Canary with the flags enabled and such, or if you are reading this in the future while flying with your S-Tier jetpack, congratulations! 

<p class="codepen" data-height="600" data-theme-id="dark" data-default-tab="result" data-slug-hash="jEbaWLX" data-pen-title="Detect Code Language" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/jEbaWLX">
  Detect Code Language</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Photo by <a href="https://unsplash.com/@agforl24?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Tai Bui</a> on <a href="https://unsplash.com/photos/a-cat-sitting-on-top-of-a-laptop-computer-iPsOfXA79U4?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      