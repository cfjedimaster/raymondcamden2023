---
layout: post
title: "Using Chrome AI for Translation"
date: "2024-10-29T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_french_teacher.jpg
permalink: /2024/10/29/using-chrome-ai-for-translation
description: Making use of on-board Chrome AI features for translation.
---

I've done a couple blog posts now on Chrome's efforts to bring generative AI to the browser. It's *still* somewhat of a rough process (remember, you can [sign up](https://docs.google.com/forms/d/e/1FAIpQLSfZXeiwj9KO9jMctffHPym88ln12xNWCrVkMY_u06WfSTulQg/viewform?resourcekey=0-dE0Rqy_GYXDEWSnU7Z0iHg) for access to test and learn more at the [intro post](https://developer.chrome.com/blog/august2024-built-in-ai?hl=en) from the Chrome engineers), but it's getting better over time. One thing I mentioned in my last post (["Using Chrome AI to Rewrite Text"](https://www.raymondcamden.com/2024/09/26/using-chrome-ai-to-rewrite-text)) was how the Chrome team is shipping *focused* APIs for specific purposes, not just general Q and A. In that previous post, I demonstrated an example of the Rewriter API. As yet another example of this, you can now test out on device translation.

As with everything else I've shared in this space, you should consider this *real* early in terms of implementation, but once you get past some of the hurdles enabling the feature (something that's going to be far easier later in the development cycle), translation is shockingly simple.

At the top level, you've got a `window.translation` object. If it exists, you can then check for the type of translation you want to do, i.e. from what language to another. Currently, if your code request to translate from, let's say English to French, this will spawn a download process for that support. In the real world (i.e., when this is more readily available), I could see perhaps doing this on a user's first visit if you anticipate making use of the feature as they make use of the site. In other words, you're going to wait to think ahead a bit and 'pre-load' the support before it can actually be used. 

To check for the ability to translate, you can use `canTranslate`:

```js
let pair = {
	sourceLanguage:'en', 
	targetLanguage:'fr'
}

let canTranslate = await translation.canTranslate(pair);
```

Note that you are specifying a source and target, so if for some reason you need to go back and forth, you would need to do *two* calls and reverse the values. 

If translation is ready, you get `readily`, otherwise, `after-download`. For a non-valid pair, you get `no`. You can actually check for an event to monitor the download if you wish so in theory, it's possibly to immediately enable the feature on your site when ready. 

If the result from `canTranslate` is good, you can then create a translator:

```js
translator = await translation.createTranslator(pair);
```

So - there's a bit of complexity involved in the setup, but not too bad I think. And once you have the translator object, the API is just:

```js
let result = await translator.translate(inputText);
```

How about a real world use? In the CodePen below (which, admittedly, probably won't work for you so I'll share screenshots), I've made use of the [Adobe PDF Embed](https://developer.adobe.com/document-services/apis/pdf-embed/) library to display a PDF in a web page:

<p>
<img src="https://static.raymondcamden.com/images/2024/10/tran1.jpg" alt="Embedded PDF on a page" class="imgborder imgcenter" loading="lazy">
</p>

To the right of this, I added a simple message: "Select text in the PDF and I'll translate it to French."

I then used the Embed API's features to listen for selection events. Here's the important part:

```js
adobeDCView.registerCallback(
	AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
	async function(event) {
		let selection = await apis.getSelectedContent();
		console.log(selection);
		if(selection.type === "text" && selection.data.length) translate(selection.data);
	}, eventOptions
);
```

Which then calls out to the `translate` function:

```js
async function translate(s) {
	console.log(`call transation on ${s}`);	
	resultDiv.innerHTML = '<i>Working on translation...</i>';
	let result = await translator.translate(s);
	console.log(result);
	
	resultDiv.innerHTML = `<strong>Translated Text:</strong><br/>${result}`;
}
```

I selected "It is never too early or too late to start planning your legacy. We have the perfect life insurance plan for you to make it easy to start securing your family's financial future. " and got:

```
Il n'est jamais trop tôt ou trop tard pour commencer à planifier votre héritage. 
Nous avons le plan d'assurance-vie parfait pour vous permettre de commencer à 
garantir l'avenir financier de votre famille.
```

And as I *obviously* remember all my high school French that seems... um... ok I guess? :) Honestly, the best translation would be one at the time of publication, hiring professionals to ensure it's done right, carries over the context of the original text and so forth. But being able to do this real-time, on device, in a second (according to my unscientific timing) is really freaking cool. 

You can check out the complete demo below:

<p class="codepen" data-height="300" data-default-tab="html,result" data-slug-hash="yLmvrRw" data-pen-title="PDF Selection Translate with Nano" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/yLmvrRw">
  PDF Selection Translate with Nano</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Let me know what you think with a comment below!