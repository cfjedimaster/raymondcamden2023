---
layout: post
title: "Adding Translation with a Web Component and Chrome AI"
date: "2024-11-07T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cats_eiffel.jpg
permalink: /2024/11/07/adding-translation-with-a-web-component-and-chrome-ai
description: Using Chrome's new Generative AI features to add translation.
---

**Edit on March 25, 2025** As expected, these APIs have changed quite a bit in the past few months. The code in this article is out of date now, *but*, I updated the Glitch shared at the end to work with the newer APIs.

A few days ago, I [blogged](https://www.raymondcamden.com/2024/10/29/using-chrome-ai-for-translation) about using Chrome's built-in generative AI features (which are still *super duper* too early to even consider for production) to add on-device translation capabilities to a web app. It got me thinking, what if we could do translation automatically via a web component? If for some reason it failed, that would be fine as the original text would still be there, but in cases where it *could* work, it would be automatic. Here's what I built.

First, I whipped up a quick HTML demo of the text I'd like translated:

```html
<translate-text>
Congress shall make no law respecting an establishment of religion, 
or prohibiting the free exercise thereof; or abridging the freedom 
of speech, or of the press; or the right of the people peaceably to 
assemble, and to petition the Government for a redress of grievances.
</translate-text>
```

Then I built my web component. It begins by seeing if `window.translation` even exists:

```js
/*
Detection routine for ai translation
*/
if(!window.translation) {
	console.log('window.translation not supported');
	return;
}
```

Next, it checks to see if it can detect the language being used. I originally thought I'd force the user to add a `sourceLanguage=something` attribute to the web component, then I remembered that one of the new AI APIs is a language detection one - so let's use that!

```js
// check if can detect 
let canDetect = await window.translation.canDetect();
if(canDetect !== 'readily') {
	console.log('window.translation.canDetect returned false.');
	return;
} 
```

I then use this API to sniff the language of the source text:

```js
let detector = await window.translation.createDetector();
console.log('calling detect...');
let results = await detector.detect(this.innerText);
// We don't care about the confidence :) 
this.sourceLanguage = results[0].detectedLanguage;
```

The API returns an array of languages it thinks might be right, sorted by the one it is most confident about. Each result contains the `detectedLanguage` key and `confidence`. In theory, you could do some sanity checking here such that if the highest confident match is too low, you stop working.

Next, I detect the language the user would like. Naturally, I look at their IP because as we know, if a user travels to a different country, they immediately know how to read and write the language spoken there. Naturally.

<p>
<img src="https://static.raymondcamden.com/images/2024/11/snark.gif" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Sigh. No, of course not, despite so many freaking web sites out there doing this stupid, asinine behavior. The browser *already* tells you what language the user prefers in the `navigator.language` property. There's actually *two* properties you can check, the one I just shared as well as `navigator.languages` which gives you an array of languages in order of what's most preferred. 

Here's the code I used:

```js
//do i support translating to my language?
this.myLanguage = navigator.language;
```

Followed by this for testing purposes:

```js
// temp hack so I can test ;)
this.myLanguage = 'fr';
```

Next, a quick sanity check:

```js
if(this.myLanguage === this.sourceLanguage) {
	console.log('No need to translate');
	return;
}
```

Now the work begins. First, let's define an object representing our source and target:

```js
let pair = {
	sourceLanguage:this.sourceLanguage, 
	targetLanguage:this.myLanguage
}
```

Then we ask the browser, can you dig it?

```js
let canTranslate = await translation.canTranslate({
	sourceLanguage:this.sourceLanguage,
	targetLanguage:this.myLanguage
});

console.log('can i translate it?',canTranslate);
if(canTranslate !== 'readily') {
	console.log('Unable to translate');
	return;
}
```

If we've gotten this far, the last step is to do the actual translation:

```js
let translator = await translation.createTranslator(pair);
let translated = await translator.translate(this.innerText);
```

And finally, update the text inside:

```js
this.innerText = translated;
```

If you want to see the complete code, and try a demo yourself, you can find it on my Glitch below, but keep in mind you need to be using Chrome Canary and have gone through the documented steps to enable this feature.

<!-- Copy and Paste Me -->
<div class="glitch-embed-wrap" style="height: 420px; width: 100%;">
  <iframe
    src="https://glitch.com/embed/#!/embed/mature-glorious-celestite?path=index.html&previewSize=0"
    title="mature-glorious-celestite on Glitch"
    allow="geolocation; microphone; camera; midi; encrypted-media; xr-spatial-tracking; fullscreen"
    allowFullScreen
    style="height: 100%; width: 100%; border: 0;">
  </iframe>
</div>

For those curious, this is the translated text I got:

<blockquote>
Le Congrès n'adoptera aucune loi concernant l'établissement de la religion, ou leur interdisant le libre exercice ; ou écarter la liberté d'expression, ou de la presse ; ou le droit du peuple de se rassembler paisiblement et de demander au gouvernement une réparation des griefs.
</blockquote>