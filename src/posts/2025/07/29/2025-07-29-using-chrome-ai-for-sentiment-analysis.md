---
layout: post
title: "Using Chrome AI for Sentiment Analysis (Again)"
date: "2025-07-29T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/victorian_happy_sad_cat.jpg
permalink: /2025/07/29/using-chrome-ai-for-sentiment-analysis
description: A second attempt at doing sentiment analysis with Chrome's AI support.
---

Every now and then I get an idea for a blog post/demo, prepare to write about it, and realize I've actually covered the topic in the past. Sometimes, though, it works out really well especially when the technology has changed quite a bit. Almost a year ago, I [blogged](https://www.raymondcamden.com/2024/08/19/sentiment-analysis-on-device-with-ai-in-chrome) about doing sentiment analysis with Chrome's AI upcoming AI feature. At the time, it worked.... ok. The biggest issue at the time was the inability to provide a system instruction to the model as well as being able to shape the response a particular way. Thankfully, both of those are now supported.

As a reminder, the prompt API for the web is *still* in an origin trial, see the [docs](https://developer.chrome.com/docs/ai/built-in) for more information and join the [EPP](https://developer.chrome.com/docs/ai/join-epp?hl=en) to get access to forum and such. 

## The Demo

Ok, so as I mentioned, the two biggest issues when I first tried this was the lack of system instructions or the ability to specify a specific, structured response. Adding a system prompt is now fairly simple - this example is modified from the [docs for initial prompts](https://developer.chrome.com/docs/ai/prompt-api#initial_prompts):

```js
session = await LanguageModel.create({
	initialPrompts: [
		{role:'system', content:'You rate the sentiment value of text, giving it a score from 0 to 1 with 0 being the most negative, and 1 being the most positive.'}
	]
});
```

Notice I've specified the kind of output I want as well as explaining how I want the model to act. But that's not enough to ensure you get exactly what you ask for. This is now doable by [passing a JSON schema](https://developer.chrome.com/docs/ai/prompt-api#pass_a_json_schema) to your prompt. 

My schema is fairly simple:

```js
const schema = {
	title:"Sentiment",
	description:"A rating of the sentiment (bad versus good) of input text.",
	type:"number", 	
	minimum:0,
	maxiumum:1
};
```

JSON Schema is pretty handy so be sure to check [their site](https://json-schema.org/) for more information. Also see Thomas Steiner's [blog post](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api) on structured output.

So putting the two together, I can get a sentiment value with input like so. First, some simple HTML for the demo:

```html
<h2>Sentiment</h2>

<div class="twocol">
	<div>
		<textarea id="input"></textarea><br>
		<button id="analyze">Analyze</button>
	</div>
	<div>
		<p id="result"></p>
	</div>
</div>
```

And then the JavaScript. I'm checking for support, but as I've mentioned before, I'm being lazy by not checking for a supported browser that hasn't downloaded the model yet. That being said, here's the JavaScript:

```js
let $input, $result;
let session;

async function canDoIt() {
	if(!window.LanguageModel) return false;
	return (await LanguageModel.availability()) === 'available';
}

document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	$result = document.querySelector('#result');

	let canWe = await canDoIt();
	if(!canWe) {
		$result.innerHTML = "Sorry, you can't run this demo.";
		return;
	}

	session = await LanguageModel.create({
		initialPrompts: [
			{role:'system', content:'You rate the sentiment value of text, giving it a score from 0 to 1 with 0 being the most negative, and 1 being the most positive.'}
		]
	});

	$input = document.querySelector('#input');

	document.querySelector('#analyze').addEventListener('click', analyze, false);
}

const schema = {
	title:"Sentiment",
	description:"A rating of the sentiment (bad versus good) of input text.",
	type:"number", 	
	minimum:0,
	maxiumum:1
};

async function analyze() {
	$result.innerHTML = '';
	console.log(`Going to analyze ${$input.value}`);
	
	let result = await session.prompt([
		{
			role:"user",
			content: [
				{ type: "text", value:$input.value }
			]
		}], { responseConstraint: schema });

	$result.innerHTML = `Sentiment score: ${result}.`;
}
```

I'll embed the demo below, but my assumption is that a lot of you won't be able to run it yet, so here's some sample inputs and output:

<blockquote>
i kinda like dogs. im not sure. they are fun to play with for sure
</blockquote>

Result: 0.7

<blockquote>
i don't think I like cats. maybe i've just been fooling people for years now. dont tell anyone - im ashamed...
</blockquote>

Result: 0.2

I asked Gemini to generate a very negative product review for a shovel:

<blockquote>
The Foo shovel is an absolute catastrophe of a tool and I wouldn't wish it upon my worst enemy. On its very first use in my Lafayette garden, the flimsy metal scoop bent into a useless, crumpled shape when it met soil that was only slightly compacted. The handle feels like it's made of cheap, hollow plastic and flexed so much I was sure it would snap and send me flying. This isn't just a poorly made product; it's an insult to the very concept of a shovel. Avoid the Foo at all costs unless you're looking for an expensive, oddly-shaped piece of garbage to take up space in your shed.
</blockquote>

This is incredibly negative and gives... 0.0. I then asked for an overly positive shovel review (why shovels - I don't know - I don't work in the dirt and I hate gardening):

<blockquote>
The Foo shovel is an absolute triumph of engineering and has completely revolutionized my gardening work. From the moment I picked it up, I could feel the superior quality; its perfect balance and comfortable, ergonomic grip make it a joy to use, even for hours on end. I tested it against the tough, clay-heavy soil we have here in Lafayette, and it sliced through dirt and roots with an ease I've never experienced before, turning a daunting task into a satisfying one. The high-carbon steel blade is incredibly durable and shows no sign of wear, proving this tool is a long-term investment. Honestly, this is the shovel I've been looking for my entire adult life, and it has earned its place as the undisputed champion of my tool shed.
</blockquote>

Not surprisingly, this gave me 1.0 as a result.

So obviously, this isn't going to be perfect, but given that it's on device, it could be helpful in a CMS or other web app where you may want to ensure your content isn't overly negative. It could also provide visual feedback and heck, I just figured out what my next blog post will cover. Anyway, the full embed is below, give it a try (if you can) and let me know what you think.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="OPybbJQ" data-pen-title="Prompt to Sentiment (2)" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/OPybbJQ">
  Prompt to Sentiment (2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

<p>
