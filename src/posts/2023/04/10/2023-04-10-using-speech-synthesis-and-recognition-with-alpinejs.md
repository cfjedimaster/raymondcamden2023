---
layout: post
title: "Using Speech Synthesis and Recognition with Alpine.js"
date: "2023-04-10T18:00:00"
categories: ["javascript"]
tags: ["alpinejs"]
banner_image: /images/banners/speech_bubble.jpg
permalink: /2023/04/10/using-speech-synthesis-and-recognition-with-alpinejs
description: An example of adding the Speech Synthesis and Recognition APIs to an Alpine.js application.
---

Recently, I worked on two interesting (imho!) articles for our blog at work on integrating web APIs with the Adobe [PDF Embed API](https://developer.adobe.com/document-services/apis/pdf-embed/). The first [blog post](https://blog.developer.adobe.com/bring-voice-to-your-documents-9f1103ac60b5) demonstrated using the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) to let you select text in a PDF and have it read to you. I followed this up with an [article](https://blog.developer.adobe.com/adding-voice-control-to-your-documents-8a01c5d35246) on using the [Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) to let you use your voice to control a PDF document, for example, asking it to navigate forward and backward or performing searches. 

I thought it would be interesting to look into integrating these APIs in a simple Alpine.js application. I didn't expect any trouble of course, but as with a lot of things I do here on the blog, I just wanted to see it working to reassure myself it wouldn't *actually* be a problem. 

For my Alpine.js application, I found a great demo that would be perfect for what I had planned. Back in 2019, I [blogged](https://www.raymondcamden.com/2019/12/08/sunday-quick-hack-eliza-in-vuejs) an example of building Eliza in Vue.js. Eliza is an old school, *really* old school chatbot that isn't terribly intelligent but can trick people into thinking it's a lot more intelligent than it really is. (I do that too!) 

I began by simply converting the existing Vue.js application to Alpine.js. For the most part, this was relatively simple. My HTML basically switched from `v-` crap to `x-` crap. 

```html
<div x-data="app">
	<div class="chatBox" x-ref="chatBox"><span x-html="chat"></span></div>
	<form @submit.prevent="">
		<input x-model="msg" class="msg">
		<button @click="inputResponse" :disabled="!msg" class="chatBtn">Chat</button>
	</form>
</div>
```

The JavaScript is also pretty similar, except in the simpler more direct (again, imho) Alpine.js setup:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
		chat:'',
		eliza:null,
		msg:'',
		init() {
			this.eliza = new ElizaBot();
			this.chat = 'Eliza: '+this.eliza.getInitial();
		},
		inputResponse() {
			let reply = this.eliza.transform(this.msg);
			this.chat += `<br/>You: ${this.msg}<br/>Eliza: ${reply}`;
			this.msg = '';
			this.$nextTick(() => {
				// https://stackoverflow.com/a/40737063/52160
				this.$refs.chatBox.scrollTop = this.$refs.chatBox.scrollHeight;

				if(this.eliza.quit) {
					alert('Your conversation is now over.');
					window.location.reload(true);
				}
			});
		}
  }))
});
```

The Eliza library I use has a few methods. `getInitial` starts a conversation. `transform` will create a response to input. The only really fancy part here is auto-scrolling the textarea to the bottom. Feel free to play with this version here:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="KKGpvJQ" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/KKGpvJQ">
  Alpine Eliza</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Eliza, the OG ChatGPT.

<p>
<img data-src="https://static.raymondcamden.com/images/2023/04/nerd.jpg" alt="Old computer nerd, could be me." class="lazyload imgborder imgcenter">
</p>

## Adding Speech Synthesis

Speech Synthesis, if you take the defaults, is pretty trivial. And honestly, the default voice, at least on my system, sounds *exactly* like a computer therapist. I began by modifying `inputResponse` to call out to a new method to handle it:

```js
inputResponse() {
	let reply = this.eliza.transform(this.msg);
	this.chat += `<br/>You: ${this.msg}<br/>Eliza: ${reply}`;
	this.speak(reply);
	// rest of method....
```

The initial version of my `speak` method was just two lines:

```js
speak(s) {
	let utterance = new SpeechSynthesisUtterance(s);
	speechSynthesis.speak(utterance);
}
```

Again, the API itself can be configured quite a bit, but as I said, the out-of-the-box voice worked perfectly for me. 

## Adding Speech Recognition

So this part was going to be simple. Honest, it was. And then things took... a weird turn. All the best "simple" demos do. I began by adding some UI so that the end user could enable speech recognition, and I tied it to checking for support first. Here's the HTML:

```html
<template x-if="speechRecogSupported">
	<div>
		<input type="checkbox" x-model="enableSpeechRecognition"> Enable Speech Recognition
	</div>
</template>
```

As you can see, it shows up if a variable, `speechRecogSupported` is true. It uses a checkbox to let the user enable (or disable) the feature.

In the JavaScript, I created two variables for this:

```js
speechRecogSupported:false
enableSpeechRecognition:false,
```

I then added code inside `init` to handle it. First, see if we have support:

```js
const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
this.speechRecognition = new SpeechRecognition();
if(this.speechRecognition) {
	this.speechRecogSupported = true;
	this.speechRecognition.continuous = true;
	this.speechRecognition.lang = 'en-US';
	this.speechRecognition.interimResults = false;
}
```

Next, I monitor the checkbox and when enabled, start listening:

```js
this.$watch('enableSpeechRecognition', (value, oldValue) => {
	this.speechRecognition.start();
	this.speechRecognition.onresult = e => {
		if(e.results && e.results[e.results.length-1].isFinal) {
			let text = e.results[e.results.length-1][0].transcript;
			console.log('text',text);
			this.msg = text; 
			this.inputResponse();
		}
	};
	
});
```

This version doesn't check for the checkbox being *unchecked*, but I'll get to that eventually. Basically, this waits for a transcript value to come in, sets it to the user's message, and acts as if they had clicked the chat button. 

So, this _worked_ but had a hilarious side-effect, namely that I spoke, it recognized it and entered it as input, Eliza responded, and the speech recognition service recognized *that* as well, and all of a sudden, the app is basically talking to itself. It was crazy and fun, so of course I saved that version here: [Alpine Eliza with Speech (with bug)](https://codepen.io/cfjedimaster/pen/qBJdPad)

The fix for this ended up being a bit weird. I figured I'd need to turn off speech recognition while Eliza was talking. I initially tried this:

```js
speak(s) {
	let utterance = new SpeechSynthesisUtterance(s);
	if(this.enableSpeechRecognition) {
		this.speechRecognition.stop();
	}
	speechSynthesis.speak(utterance);
	if(this.enableSpeechRecognition) {
		this.speechRecognition.start();
	}
}
```

This however returned an error about the speech service being already in an enabled state. I couldn't figure out why that was happening and on a whim, I tried adding in a delay (with `setTimeout`), and that corrected it. It then occurred to me, that the `speak` method wasn't asynchronous, and that Eliza would still be speaking when I turned on recognition again.

There is no event I could use, only a boolean, `speaking`, that is true while SpeechSynthesis is actively speaking. I ended up with this version:

```js
speak(s) {
	let utterance = new SpeechSynthesisUtterance(s);
	if(this.enableSpeechRecognition) {
		console.log('stop listening');
		this.speechRecognition.stop();
	}
	speechSynthesis.speak(utterance);
	if(this.enableSpeechRecognition) {
		let interval = setInterval(() => {
			console.log('still speaking?', speechSynthesis.speaking);
			if(!speechSynthesis.speaking) {
					clearInterval(interval);
					this.speechRecognition.start();
			}
		}, 250);
	}
}
```

Basically, while `speaking` is true, I want to loop, but in an interval of quarter seconds, and when it's finally *not* speaking, kill the interval. 

This is probably brittle as hell, but it seemed to work well. Note that Edge, on M1 Macs, has an issue with speech recognition in general, so it may not work for you on that platform. And for yet another issue, I discovered that the SpeechRecognition API will censor curse words. If you say "fuck" (I don't think I've used that word here much, but we're all adults, right?), the transcript value will be ****. I tried a variety of curse words (I know a few), and most of what I expected to be censored was. I've reached out online to see if this is a setting that can be tweaked and will let yall know what I find. You can find my final demo below. 

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="rNqVGrB" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/rNqVGrB">
  Alpine Eliza with Speech (without bug)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<p></p>

Photo by <a href="https://unsplash.com/@lunarts?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Volodymyr Hryshchenko</a> on <a href="https://unsplash.com/photos/V5vqWC9gyEU?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>