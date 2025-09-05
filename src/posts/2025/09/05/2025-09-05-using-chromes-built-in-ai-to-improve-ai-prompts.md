---
layout: post
title: "Using Chrome's Built-in AI to Improve AI Prompts"
date: "2025-09-05T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_writing.jpg
permalink: /2025/09/05/using-chromes-built-in-ai-to-improve-ai-prompts
description: Using AI to improve AI!
---

Props for this article go to my best friend, [Todd Sharp](https://recursive.codes/), who yesterday said something along the lines of, "Hey Ray, you should blog a demo of ..." which is pretty much akin to bring out a laser pointer in front of a cat. Not only do I love getting ideas for new demos, his idea was actually pretty freaking brilliant, which means I get to pretend I'm brilliant as well.

His idea was this: Given a user created prompt meant to be shipped off to a "proper" (i.e. maybe expensive) Generate AI API, can we use tools to help improve the prompt and make it "cheaper" before used. Given we've got [AI in the browser](https://developer.chrome.com/docs/ai/built-in) via Chrome (ok, we *will* have it soon), this seemed absolutely possible and I quickly whipped up a demo.

As usual, the normal caveats apply. To test this, you'll want to use Chrome Canary with the appropriate flags enabled and such. As I've suggested before, join the [EPP](https://developer.chrome.com/docs/ai/join-epp) to get access to additional docs and support forums for help getting started. (Or just [subscribe](/subscribe) to my blog and keep reading my posts.)

Let's get started!

## The General Strategy, and What Can Be Done Better

The general idea for this demo is to take your input, a text prompt, and ask Chrome's [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api) to recreate it in a better form. 

This assumes a text only prompt, which of course isn't always the case. Multimodal prompts could include many different forms of binary data and optimization could be done in that area as well. For example, a 4000x4000 hires image could be resized and optimized down quite a bit to reduce the size it adds to the context window. Audio could be sped up 10% or so for tasks involving transcription. PDFs could be optimized as well. 

For now, I'm keeping it simple and just focusing on "cleaning" up the prompt. 

Initially my thinking was to take the result, send it to Gemini over API, measure the tokens used, and compare against the original. However, looking at the [GitHub explainer](https://github.com/webmachinelearning/prompt-api) for the Prompt API, I found a method, `measureInputUsage()`, which tell you how many tokens a prompt will use. 

Now, the docs have some important notes on this API I'll share here:

* We do not expose the actual tokenization to developers since that would make it too easy to depend on model-specific details.
* Implementations must include in their count any control tokens that will be necessary to process the prompt, e.g. ones indicating the start or end of the input.
* The counting process can be aborted by passing an AbortSignal, i.e. session.measureInputUsage(promptString, { signal }).
* We use the phrases "input usage" and "input quota" in the API, to avoid being specific to the current language model tokenization paradigm. In the future, even if we change paradigms, we anticipate some concept of usage and quota still being applicable, even if it's just string length.

Given that, and given that different API engines may tokenize different, using this method to measure the effectiveness is *not perfect*, but feels like a good ballpark figure for how effective it may be.

## The Code

Alright, let's take a look at the code. On the HTML side, I'm literally just plopping down a textarea for your input and a button, so I won't share that here. Let's get into the JavaScript. Nothing every went wrong using JavaScript, right?

First, the startup crap:

```js
let $input, $result;
let promptModel, rewriterModel;

async function canDoIt() {
	if(!window.LanguageModel || !window.Rewriter) return false;
	return true;
}

document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	$result = document.querySelector('#result');

	let canWe = await canDoIt();
	if(!canWe) {
		$result.innerHTML = "Sorry, you can't run this demo.";
		return;
	}

	$input = document.querySelector('#input');

	document.querySelector('#improve').addEventListener('click', analyze, false);
	document.querySelector('#improve').removeAttribute('disabled');
}
```

I've got a few global variables and an `init` function run when the document loads. It checks to see if the user has access to the Prompt and Writer APIs, and if so, enables the button so we can analyze their input. 

Now for the complex stuff. The first thing I did was build wrappers to get the Prompt and Rewriter model. In the past, I've not done a good job of handling 'loading' states and such, and this demo handles it better, showing in the UI as the model downloads. I've got a blog post on just this particular topic coming up in a day or so:

```js
async function getLanguageModel() {
	return await LanguageModel.create({
			monitor(m) {
				m.addEventListener('downloadprogress', e => {
					console.log(`Downloading prompt model: ${e.loaded * 100}%`);
					$result.innerHTML = `Downloading prompt model (${Math.floor(e.loaded * 100)}%)`;
				});
			}
	});
}

async function getRewriterModel() {
	return await Rewriter.create({
		monitor(m) {
			m.addEventListener('downloadprogress', e => {
				console.log(`Downloading rewriter model: ${e.loaded * 100}%`);
				$result.innerHTML = `Downloading rewriter (${Math.floor(e.loaded * 100)}%)`;
			});
		}
	});
}
```

Here's the actual method called when you click the Analyze button:

```js
async function analyze() {
	
	/*
	The rewriter module needs to have user input before it's instantiated *if* it needs
	to be downloaded, so this code used to be in my init, but is now here after the click, and will be run once only
	*/
	
	if(!promptModel || !rewriterModel) {
		$result.innerHTML = 'Creating Language Model';
		promptModel = await getLanguageModel();
		console.log(promptModel);
		$result.innerHTML = 'Creating Rewriter';
		rewriterModel = await getRewriterModel();
		console.log(rewriterModel);
	}
	
	$result.innerHTML = 'Beginning the rewrite...';
	console.log(`Going to analyze ${$input.value}`);
	
	let stringUsage = await promptModel.measureInputUsage(input.value);
	console.log('stringUsage', stringUsage);

	let improvedPrompt = await rewriterModel.rewrite(input.value, {
		context:'Please reduce the following text by removing extraneous language and simplifying without losing context. This input is for a LLM prompt and anything not necessary should be taken out. Greetings and other polite terms should be removed.'
	});
	console.log(improvedPrompt);
	
	let stringUsage2 = await promptModel.measureInputUsage(improvedPrompt);
	console.log(stringUsage2);

	$result.innerHTML = `
<h2>Analysis Complete</h2>
<p>
The initial prompt measurement was ${stringUsage}.
</p>
<p>
I rewrote the prompt to:
</p>
<blockquote>${improvedPrompt}</blockquote>
<p>
The new prompt measurement is ${stringUsage2}.
</p>
	`;
}
```

I begin getting my models, if I need to, and in theory, this will gracefully handle the case where we have to wait for a download.

Next, I get the token usage on your input. 

Then I can use the Rewriter API with context explaining what I want it to do. This could possibly be improved and I welcome suggestions! 

Finally, I measure the new prompt and report it all back to the user. 

## Examples

Here's an initial prompt:

```
Hello my AI best friend! I'd like to learn more about working with Alpine.js. Specifically I'd like 
help figuring out how to integrate that awesome framework in with API calls to a weather system. 
I need a simple to understand explanation for someone who is kinda new to JavaScript.
```

And the rewrite, with 'scores' before and after:

```
The initial prompt measurement was 69.

I rewrote the prompt to:

Alpine.js and API calls for a weather system. Need a beginner-friendly integration explanation.

The new prompt measurement is 27.
```

Another example:

```
I'm pretty dumb when it comes to astronomy, but watched Star Wars a few times. I'd like to understand better how black holes are formed and understand their dynamics. Can you explain it to me like I'm a freaking idiot?		
```

And the result:

```
The initial prompt measurement was 59.

I rewrote the prompt to:

Astronomy is confusing. I've seen Star Wars. Explain black hole formation and dynamics simply. Assume I know nothing.

The new prompt measurement is 33.
```

Want to take it for a spin? (And are using Canary with the right flags?) Check out the embed below:

<p class="codepen" data-height="300" data-theme-id="dark" data-default-tab="result" data-slug-hash="myevqea" data-pen-title="ChromeAI to Improve Prompt" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/myevqea">
  ChromeAI to Improve Prompt</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Photo by <a href="https://unsplash.com/@epicantus?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Daria Nepriakhina 🇺🇦</a> on <a href="https://unsplash.com/photos/black-cat-scratching-on-table-p6ac4ss5vVM?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      