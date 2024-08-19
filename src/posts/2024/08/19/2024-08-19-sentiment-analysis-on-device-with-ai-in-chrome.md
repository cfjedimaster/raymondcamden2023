---
layout: post
title: "Real-Time Sentiment Analysis on Device with AI in Chrome"
date: "2024-08-19T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_dog_fireplace.jpg
permalink: /2024/08/19/sentiment-analysis-on-device-with-ai-in-chrome
description: Attempting to analyze the sentiment of text using Chrome's built-in LLM.
---

Last week, I took a look at [Chrome's GenAI implementation](https://www.raymondcamden.com/2024/08/13/a-quick-look-at-ai-in-chrome) in the browser. What I found was interesting, and rough, but possibly something that could be incredibly useful in the future. I've been thinking about it more the last few days. First off, if this feature interests you, there is an [early preview program](https://forms.gle/ksWMYFtsUSZiC63m9) you can sign up for that gives you access to a mailing list containing docs, announcements, and more information. I've done that and it was a relatively quick process. There are already cool things I've seen there that I want to dig into soon, but today I wanted to share a little experiment. This too does not work terribly well yet, but I think the idea has merit and, as always, I'd love to know what folks think. Leave me a comment below with your thoughts. 

## Sentiment Analysis

One of the things I've done with GenAI in the past is use it for sentiment analysis. In fact, one of my very first demos using Gemini (PaLM back then) was to create a [sentiment report of recent forum posts](https://www.raymondcamden.com/2023/10/16/using-google-palm-to-gather-sentiment-analysis-on-a-forum). This got me thinking about what kind of sentiment analysis could be done on the client-side, possibly providing feedback of your input before you submit a response or create a post. 

My initial tests didn't work so well:

```
Give me a sentiment score for the following test, with 0 being very negative, 
and 1 being very positive: I like cats. I love cats. If I could have a 
thousand cats, I would.

Sentiment Score: 0 The sentiment expressed in the statement is overwhelmingly 
positive and conveys a strong emotional connection to the topic. The user 
indicates their love and fondness for cats, using phrases like "like" and 
"love." The sentiment also extends to the hypothetical scenario of having 
thousands of cats, emphasizing the emotional attachment and yearning 
associated with the possession of these animals. Overall, the sentiment 
score for the given statement is set at 0
```

The reasoning was dead on, but it didn't properly score the response. Here was my second attempt:

```
Give me a sentiment score for the following test, with 0 being very 
negative, and 1 being very positive: I do not like dogs. They smell. 
They stink. They fart. I just really don't like dogs.

Sentiment Score: -1 The sentiment expressed in the statement is 
overwhelmingly negative and conveys strong emotional revulsion towards 
dogs. The user consistently uses phrases that describe the negative 
characteristics of dogs, such as "smelly," "stinky," and "farting." 
The negative and emotional language employed indicates a strong 
dislike for dogs, resulting in a sentiment score of -1.
```

Again, it parsed the text very well but didn't properly handle the scoring aspect. I then took another approach - why not simply ask for a sentiment summary of one word? In theory, it could help you quickly see the tone of what you're writing:

```
Summarize the sentiment of the following text in one word
```

Given that and the two inputs above, the first returned: 

```
Love
```

And the second returned:

```
Dislike
```

By the way, I feel like I have to say, I absolutely love dogs. Maybe not quite as much as cats, but I love my big stinky dog.

<p>
<img src="https://static.raymondcamden.com/images/2024/08/dog.jpg" alt="Photo of a small kitten on the left, a large dog on the right" class="imgborder imgcenter" loading="lazy">
</p>

Cool, so let's build it!

## The Demo

For my demo, I went with Alpine.js, primarily for one reason - an easy way to debounce calls to get the sentiment analysis. While the calls are all within the browser itself, it does take a second or two to process and I figured a simple debounce call would help reduce the work. Here's my HTML:

```html
<div x-data="app">
	<div x-show="!hasAI">
		Sorry, no AI for you. Have a nice day.
	</div>
	<div x-show="hasAI">
		<div class="row">
			<div class="column">
				<label for="prompt">Your input: </label>
			</div>
			<div class="column column-90">
				<textarea type="text" x-model.debounce.500ms="prompt" id="prompt"></textarea>
			</div>
		</div>
		<p x-html="result"></p>
	</div>
</div>
```

The debounce part can be seen in the `x-model` attribute on the `textarea`. Here's the JavaScript I used:

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
				this.$watch('prompt', val => this.testInput(val));
			}
		},
		async testInput(val) {
			let prompt = `
Check the sentiment of this input and return a one word result:

${val}`;
			try {
				this.result = 'Sentiment analysis: ' + await this.session.prompt(prompt);
			} catch(e) {
				console.log('window.ai pooped the bed', e);
			}
		}
  }))
});

```

Basically, I just have a hard-coded prompt where your input is appended and sent to the built-in model. I realize most folks can't test this yet, so here's a screenshot of this in action:

<p>
<img src="https://static.raymondcamden.com/images/2024/08/sent1.jpg" alt="Input was 'I really dislike my body and have a pretty bad self image. I recognize that, which is good, but it doesn't necessarily stop the feelings I have. I'm too fat. I'm too clumsy. I'm too tall. All of these I know aren't important to my wife and kids, but I still struggle with it every day.' and the result is Dislike" class="imgborder imgcenter" loading="lazy">
</p>

And here's a more positive result:

<p>
<img src="https://static.raymondcamden.com/images/2024/08/sent2.jpg" alt="Input was 'about a year ago my wife bought some simple crystals to hang in our house, just for fun, and i still remember the day i walked into the kitchen and saw rainbows. it was such a small thing that made me smile in a huge way. to this day, i love walking in the room and seeing random rainbows everywhere.' and the result is Joy" class="imgborder imgcenter" loading="lazy">
</p>

Obviously, those inputs were just tests, but you could imagine a customer support response form perhaps, or just a forum post in general using this to provide feedback. I'd like to see the browser API mimic Gemini's where you can use system instructions and JSON schema to 'force' a particular response type. You can find the complete demo below:

<p class="codepen" data-height="500" data-default-tab="js,result" data-slug-hash="wvLpYoy" data-pen-title="window.ai test (sentiment analysis)" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/wvLpYoy">
  window.ai test (sentiment analysis)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

So, not even close to being really ready for production, but what do you think?