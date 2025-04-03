---
layout: post
title: "Using AI in the Browser for Typo Rewriting"
date: "2025-02-27T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_typing.jpg
permalink: /2025/02/27/using-ai-in-the-browser-for-typo-rewriting
description: Use Chrome's GenAI APIs to help fix typos.
---

<div style="background-color: #c0c0c0; padding:5px;margin-top:10px">
<strong>Update on April 3, 2025:</strong> As expected, Google has continued to evolve and update these APIs, for the better of course, but that means the code I write about here is 100% broken. That's life, eh? I'm not going to edit the text here as if I tried to keep every post up to date it would be a never-ending job. That being said, I plan on blogging on these APIs more and I corrected the CodePen shown at the end with a new version that works correctly. You can see it here: <a href="https://codepen.io/cfjedimaster/pen/ZYEwoJx">https://codepen.io/cfjedimaster/pen/ZYEwoJx</a>
</div>

Last week I gave a presentation on Chrome's new [built-in AI](https://developer.chrome.com/docs/ai/built-in) support (I'll link the video at the end) and it's gotten me inspired to consider new and different ways these APIs can be used to enhance the user experience. These APIs still aren't quite ready for production use, and it's absolutely possible we may never see these in Safari or Firefox, but the possibility of using them to enhance an application where available is exciting. For today, I want to share an interesting use case that occurred to me a few weeks ago. 

One of the APIs being built is a [translation](https://developer.chrome.com/docs/ai/translator-api) API (along with a [language detection](https://developer.chrome.com/docs/ai/language-detection)) API as well. In general the idea here is to go from one language to another. But what if you don't want to translate, but rather, "repair", some input text.

I've got a best friend who I won't name (although his name rhymes with Mott Moze) and he tends to typo quite a bit. In fact, sometimes myself and another friend will tease him about it, especially when he typos so bad we can't even figure out what he meant. That then brings up the question - how well could these generative AI models help with fixing input that's got typos and returning something more sensible. I did some playing and found some interesting results. 

## Attempt One - The Prompt API

In my opinion, the Chrome team is really pushing *specific* GenAI APIs over more generic uses. That's why the docs focus on those specific APIs - translation, language detection, and summarization for example. There is a "general purpose" [prompt API](https://developer.chrome.com/docs/extensions/ai/prompt-api) but honestly, I imagine that will be used a lot less than the more specific ones. That being said, I thought I'd use that for my first stab at this problem.

For my demo, I whipped up a quick Alpine.js form that lets you enter your typo-ridden text and then hit a button to try to fix it. These complete source code will be available below so I'll focus on the GenAI aspects, not the Alpine.js DOM stuff. 

I begin with a bit of code just to see if the API is available:

```js
let ready = (await window.ai.languageModel.capabilities()).available;
if(ready === 'readily') this.hasAI = true;
```

This code only supports the API being 100% ready and will *not* support the use case of, "I support AI, but I need a few minutes to download the model." To be clear, Chrome's APIs support that and you should do that, but I wanted to keep things simple for now. 

Now comes the important part, creating a session for my application with a system instruction detailing what I want it to do:

```js
this.session = await window.ai.languageModel.create({
	systemPrompt:'You take original input that may include typos and rewrite the text to correct it.'
});
```

Actually using this is almost anticlimatic in terms of how simple it is, given your input, you use the `prompt` method to get the result:

```js
this.result = marked.parse(await this.session.prompt(this.prompt));
```

In case you don't recognize it, `marked` is a JavaScript Markdown library and as most results include Markdown, I use this to convert it to HTML. I don't think it actually does much here, but I had it from a previous demo and kept it. 

So, the demo will be right below, but as this feature is still in early testing and not available without flipping some flags, let me share some before and after examples:

<strong>Input:</strong> "My name is Scott Stroz. I work asd a developer advocat for Oracle. My focis is on MySQL and the Giants who are the bestfootball team in the NLF>"

<strong>Output:</strong> "My name is Scott Stroz, and I work as a developer advocate for Oracle. My focus is on MySQL and the Giants who are the best NFL football team."

That's *damn* good to be honest, ignoring the obvious typo of "Saints" where "Giants" was used. I would argue though that by changing the period to a comma, it's doing a bit more than typo correction.  Here's another example:

<strong>Input:</strong> "This is Raymonid Camden. I work in Louisian as a developer evangelist and advocoa fovused on generative AI, APIs, and listening to Deepche Mode."

<strong>Output:</strong> "This is Raymond Camden. I work in Louisiana as a developer evangelist and advocate focused on generative AI, APIs, and listening to Deepche Mode."

As you can see, it failed to fix Depeche Mode, but it did clean it up quite well. You can see the full code, and live demo below:

<p class="codepen" data-height="600" data-default-tab="html,result" data-slug-hash="ogNYyOW" data-pen-title="Chrome AI - Fix Typos V1" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/ogNYyOW">
  Chrome AI - Fix Typos V1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## Attempt Two - The Rewriter API

For my next attempt, I made use of the Rewriter API. This isn't called out in the navigation on the Chrome AI docs, but does live under the [Summarization API](https://developer.chrome.com/docs/ai/summarizer-api) "family" I suppose. You can find it documented under the [GitHub Explainer](https://github.com/webmachinelearning/writing-assistance-apis). 

The API for the Rewriter API is a bit different than the others, and I imagine it may change soon. For example, to check if it's available, you don't run a `capabilities()` method but rather use the `availabilty` one instead:

```js
const availability = await ai.rewriter.availability();
if(availability === 'available') this.hasAI = true;
```

The Rewrite object does not, as far as I know, have system instructions, but instead, has `sharedContext`. I began with this:

```js
this.rewriter = await window.ai.rewriter.create({
	sharedContext:'You take original input that may include typos and rewrite the text to correct it. '
});
```

To get output, you make use of the `rewrite` method:

```js
this.result = marked.parse(await this.rewriter.rewrite(this.prompt));
```

So how did it work? Darn good I'd say. Here's my tests again:

<strong>Input:</strong> "My name is Scott Stroz. I work asd a developer advocat for Oracle. My focis is on MySQL and the Giants who are the bestfootball team in the NLF>"

<strong>Output:</strong> "My name is Scott Stroz. I work as a developer advocate for Oracle. My focus is on MySQL and the Giants, who are the best football team in the NFL."

It's close but not the same. Notice though it kept the sentences closer to the input. Now for the next one:

<strong>Input:</strong> "This is Raymonid Camden. I work in Louisian as a developer evangelist and advocoa fovused on generative AI, APIs, and listening to Deepche Mode."

<strong>Output:</strong> "This is Raymond Camden. I work in Louisiana as a developer evangelist and advocate focused on generative AI, APIs, and listening to Deep Thought's Mode."

GenAI really seems to have it in for Depeche Mode and I'm now reconsidering my professional direction choices. That being said, I feel like the main difference in these two tests is that the rewriter API may have more closely respected the original text, especially in the first example. As before, I've embedded the demo below:

<p class="codepen" data-height="600" data-default-tab="html,result" data-slug-hash="KwKNejj" data-pen-title="Chrome AI - Fix Typos V1" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/KwKNejj">
  Chrome AI - Fix Typos V1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

As always, let me know what you think! The video I mentioned is below:

{% liteyoutube "GV7wPmXKcb4" %}
