---
layout: post
title: "A Quick Look at AI in Chrome"
date: "2024-08-13T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_chrome.jpg
permalink: /2024/08/13/a-quick-look-at-ai-in-chrome
description: A look at Chrome's proposed AI integration in the web platform.
---

Google announced a while back their intent to experiment with generative AI in the browser itself. Personally, I think this *could* be a really good idea, but I'm really unsure as to how many other vendors would support it. With Edge being a Chromium product, and Microsoft being pro-GenAI, it seems like a safe bet it would support it. Safari and Firefox... I honestly feel like they probably never would. That being said, initial support landed in Chrome Canary (the bleeding edge version of Chrome) and I thought I'd take a quick look. Here's what I found.

## Setting it Up

To test this new feature, you need either Chrome Canary or Dev. Enabling support requires tweaking two flags and restarting. This is all covered in a good blog post by Om Kamath, ["Google Chrome's Built-In AI Is A Game Changer."](https://medium.com/google-cloud/google-chrome-has-a-secret-ai-assistant-9accb95f1911). You can also find a guide at [Chrome AI](https://github.com/lightning-joyce/chromeai/blob/main/README.md). 

Now, here comes the rub, and this is a very early feature so keep in mind this may be completely different if you are reading this sometime after I posted. Both guides have you enable two flags and restart the browser.

You are then asked to go to `chrome://components` and look for `Optimization Guide On Device Model`. Here's where I ran into issues. I was *never* able to get this to show up. 

Until... I kid you not... I simply forgot about it for a few hours, looked back at the Chrome window in the background, and saw that the line item had shown up. Also, I couldn't get it to *ever* work in Canary, but it did work in Chrome Dev.

<p>
<img src="https://static.raymondcamden.com/images/2024/08/cat.jpg" alt="Why cat?" class="imgborder imgcenter" loading="lazy">
</p>

I had some help from [Thomas Steiner](https://mastodon.social/@tomayac@toot.cafe) on Mastodon. He mentioned that this long time to show up issue was known and that it should get better, but it's something to keep in mind if you wish to test this yourself. 

## Testing

I've not been able to find able to find a proper JavaScript spec for it yet, but the core object you'll use is `window.ai`. From what I see, it has three methods:

* `canCreateTextSession` 
* `createTextSession`
* `textModelInfo`

If you first check for `window.ai`, you could then use `canCreateTextSession` to see if AI support is *really* ready. Ie, it's on a supported browser *and* the model has been loaded. For fun, this doesn't return `true`, but... `readily`. I'm kinda hoping that's a temporary string. 

`textModelInfo` returns information about the model, which is probably obvious, but here's what it gave me:

```json
{
    "defaultTemperature": 0.800000011920929,
    "defaultTopK": 3,
    "maxTopK": 128
}
```

Finally, the thing you probably care about the most is `createTextSession`. It supports options, but I've not been able to find out what those are. 

Testing this is rather simple:

```js
const model = await window.ai.createTextSession();
await model.prompt("Who are you?");
```

Which for me returned:

```
I am a large language model, trained by Google.
```

There's also a `promptStreaming` method for working with a streamed response. I haven't tested that yet.

How well does it work?

Well... I did some testing in console and it didn't work great. It felt really easy to get an error or a bad response. For example:

```
await model.prompt('What is the nature of the galaxy?')
' The nature of the galaxy'
```

And:

```
wait model.prompt('Explain how light works. Answer like a high school physics teacher.')
' Light'
```

This may - and I don't have any reason to guess why - be the nature of testing in console. When I built a simple web app, it actually started to work quite a bit better, so... maybe? With that being said, let's look at a quick demo.

## Demo One - Just a Prompt

I started with a basic Alpine.js demo with just a prompt. I used this HTML:

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<h2>window.ai demo</h2>

<div x-data="app">
	<div x-show="!hasAI">
		Sorry, no AI for you. Have a nice day.
	</div>
	<div x-show="hasAI">
		<div class="row">
			<div class="column">
				<label for="prompt">Prompt: </label>
			</div>
			<div class="column column-90">
			<input type="text" x-model="prompt" id="prompt">
			</div>
		</div>
		<button @click="testPrompt">Test</button>
		<p x-html="result"></p>
	</div>
</div>
```

You can see a form field for your prompt, a button, and a place to dump it. (Note that I'm seeing `window.ai` return text with line breaks, which will *not* be rendered properly in HTML. Something to keep in mind.)

And a bit of JavaScript:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
		hasAI:false,
		prompt:"",
		result:"",
		session:null,
		async init() {
			if(window.ai) {
				let ready = await window.ai.canCreateTextSession();
				if(ready === 'readily') this.hasAI = true;
				else alert('Browser has AI, but not ready.');
				this.session = await window.ai.createTextSession();
			}
		},
		async testPrompt() {
			if(this.prompt === '') return;
			console.log(`test ${this.prompt}`);
			this.result = '<i>Working...</i>';
			try {
				this.result = await this.session.prompt(this.prompt);
			} catch(e) {
				console.log('window.ai pooped the bed', e);
			}
		}
  }))
});
```

And honestly - this seemed to work ok. If you've gone through the steps to enable this feature, you can test it below.

<p class="codepen" data-height="500" data-default-tab="html,result" data-slug-hash="QWXObrX" data-pen-title="window.ai test" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/QWXObrX">
  window.ai test</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Demo Two - Summarizing

I followed up the last demo with a slightly more advanced one - a textarea you can drop text in and have it summarized. In this case, the prompt is hard coded. Again, here's the HTML:

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<h2>window.ai demo</h2>

<div x-data="app">
	<div x-show="!hasAI">
		Sorry, no AI for you. Have a nice day.
	</div>
	<div x-show="hasAI">
		<p>
			<label for="inputText">Enter the text you would like summarized below:</label>
			<textarea x-model="inputText" id="inputText"></textarea>
		</p>

		<button @click="testSummarize">Summarize</button>
		<p x-html="result"></p>
	</div>
</div>
```

And the JavaScript:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
		hasAI:false,
		inputText:"",
		result:"",
		session:null,
		async init() {
			if(window.ai) {
				let ready = await window.ai.canCreateTextSession();
				if(ready === 'readily') this.hasAI = true;
				else alert('Browser has AI, but not ready.');
				this.session = await window.ai.createTextSession();
			}
		},
		async testSummarize() {
			if(this.inputText === '') return;
			this.result = '<i>Working...</i>';
			try {
				let prompt = `Summarize the following text:
				
${this.inputText}`;
				this.result = await this.session.prompt(prompt);
			} catch(e) {
				console.log('window.ai pooped the bed', e);
			}
		}
  }))
});
```

Honestly, this seemed to work well. I passed in the first paragraph of this blog post and got:

```
Google has expressed an interest in experimenting with generative AI in the browser, and it looks like Microsoft and the Chromium-based Edge browser could support it. While other browsers like Safari and Firefox might not be as open to such developments, Google's move into this area signifies potential support for generative AI in the future.
```

Not bad. Here's the demo:

<p class="codepen" data-height="500" data-default-tab="html,result" data-slug-hash="KKjyprw" data-pen-title="window.ai test" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/KKjyprw">
  window.ai test</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Demo Three - PDFs!

You love PDFs, right? I know I do. For the heck of it, I built a quick demo using Adobe's [PDF Embed](https://developer.adobe.com/document-services/apis/pdf-embed/) JavaScript library. One of the things it allows for is handling selection events. So what if you could select some text and get a summary?

Here's a screenshot of this in action - first, the PDF on the left with my selection:

<p>
<img src="https://static.raymondcamden.com/images/2024/08/ai1.jpg" alt="Screenshot showing PDF Embed with a slection" class="imgborder imgcenter" loading="lazy">
</p>

Hopefully you can *kinda* read the selection. This was the output:

```
The Bodéa Prime Plan is our most straightforward life insurance coverage, best suited for short-term coverage. You only pay a monthly or annual premium, and your family is protected for that time period. The Prime Plan is Bodéa's most affordable life insurance plan and is ideal for those initiating their coverage.
```

The JavaScript code is mostly PDF Embed related so I won't paste it here, but you can take a look at it below:

<p class="codepen" data-height="500" data-default-tab="js,result" data-slug-hash="BagmNME" data-pen-title="PDF Selection Test 3" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/BagmNME">
  PDF Selection Test 3</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Ship it!

So... it feels rough, and very early, but honestly, I do hope this takes off. I've had pretty much zero luck predicting the future of the platform, but I'd like to see this get some traction. Let me know what *you* think and leave me a comment below.


