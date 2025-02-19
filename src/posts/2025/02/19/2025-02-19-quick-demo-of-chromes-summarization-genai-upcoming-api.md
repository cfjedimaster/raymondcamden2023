---
layout: post
title: "Quick Demo of Chrome's Summarization GenAI (Upcoming) API"
date: "2025-02-19T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_taking_notes.jpg
permalink: /2025/02/19/quick-demo-of-chromes-summarization-genai-upcoming-api
description: An example focused on the different output types of the Summary API
---

I've blogged a few times recently about Google's [AI on Chrome](https://developer.chrome.com/docs/ai) initiative to bring AI features to the browser itself. Yesterday, my Code Break episode was specifically on this topic:

{% liteyoutube "vXNV0c13p98" %}

In that session, I talk specifically about the [Summarizer](https://developer.chrome.com/docs/ai/summarizer-api) API, which does... wait for it... summarization. (It also covers the Writer and Rewriter API which I covered... woah, way back in September of last year: ["Using Chrome AI to Rewrite Text"](https://www.raymondcamden.com/2024/09/26/using-chrome-ai-to-rewrite-text/))

One interesting aspect of the API is that it offers multiple types of summarization:

* key points (the default)
* tl;dr 
* teaser
* headline

You can also request three different lengths:

* short
* medium (default) 
* long

According to the documentation, these lengths impact different types differently. So for example, using the key points type the length will impact the number of bullet points returned.

All of this made sense, mostly, but for types I wasn't really sure how to compare tl;dr and teaser for example. 

With that in mind, I built a demo that takes your input, and then walks through each type and length and shows you the output. While not something you would do in a real world application, this was darn handy for me to visualize the differences. I built the demo in the live stream, but afterwards, cleaned up the UI a bit to make it a bit nicer. 

HTML wise, it's simple:

```html
<div class="twocol">

	<div>
	<textarea id="input"></textarea>
	<p>
	<button id="summarize">Summarize</button>
	</p>
	</div>
	
	<div>
		<div id="results"></div>
	</div>
</div>
```

When I share the CodePen in a bit you'll notice I placed some default text in the `textarea` to make it easier to test. 

On the JavaScript side, I start up with some basic variable declarations and checking to see if the Summary API is available:

```js
let $input, $summarize, $results;
let summarizer;

document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	$input = document.querySelector('#input');
	$summarize = document.querySelector('#summarize');
	$results = document.querySelector('#results');
	
	let available = (await window.ai.summarizer.capabilities()).available;
	console.log(available);
	if (available !== 'readily') {
		alert('You cant do this.');
		return;
	}	

	$summarize.addEventListener('click', doSummary, false);	
}
```

One important thing to note here. The AI APIs Chrome ships have support for handling cases where AI itself is supported but the models aren't downloaded. I skipped that because I was lazy, but you *can* and probably *should* do that in production code. 

Also, I will not stop complaining about the fact that they use 'readily' instead of 'ready'. I *really* hope they change that before they finalize the APIs. 

Ok, that aside, here's the code that handles the summarization tests:

```js
async function doSummary() {
	let input = $input.value;
	if(input.trim() === '') return;
	console.log('going to work on', input);
	
	$summarize.innerText = 'Working';
	$summarize.disabled = true;
		
	let types = ['key-points','tl;dr','teaser','headline'];
	let lengths = ['short', 'medium', 'long'];
	
	for(let t of types) {
		for(let l of lengths) {
			console.log(`About to try type ${t} length ${l}`);

			let options = {
				type: t,
				length: l,
			};
			
			let summarizer = await self.ai.summarizer.create(options);
			console.log('summarizer object made');
			let summary = await summarizer.summarize(input);
			console.log(t,l,summary);
		
			let result = `
<div class="result">
<h3>Type: ${t} Length: ${l}</h3>

${marked.parse(summary)}
</div>`;
			
			$results.innerHTML += result;
		}		
	}

	$summarize.innerText = 'Summarize';
	$summarize.disabled = false;

}
```

Basically just loop over each type and length, run the result, and wait. Note I'm doing this synchronously in a loop. If for some reason you wanted to summarize multiple different bits of text, for example, you could absolutely run them in parallel. 

So, I know some of you won't be running a Chrome that supports this yet, let me share the results. For my input, I used the Gettysburg Address. In case you don't know it, here it is:

<div style="background-color: #c0c0c0; padding: 10px">
Fourscore and seven years ago our forefathers brought forth on this continent a new nation, conceived in liberty and dedicated to the proposition that all men are created equal.

Now we are engaged in a great civil war, testing whether that nation or any nation so conceived and so dedicated can long endure. We are met on a great battle field of that war. We have come to dedicate a portion of that field as a final resting place for those who here gave their lives that this nation might live. It is altogether fitting and proper that we should do this.

But in a larger sense, we cannot dedicate - we cannot consecrate - we can not hallow this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember, what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us - that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion - that we here highly resolve that these dead shall not have died in vain - that this nation, under God, shall have a new birth of freedom - and that government of the people, by the people, for the people, shall not perish from the earth.
</div>

Ok, let's consider the results. 

## Type: key-points

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">

Type: key-points Length: short

* The text begins by referencing the Declaration of Independence and the ongoing Civil War.
* Lincoln argues that it is important for the nation to dedicate itself to preserving the ideals of liberty and equality.
* He urges the audience to continue the work of those who fought and died to ensure that government of the people, by the people, for the people endures.
</div>

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">

Type: key-points Length: medium

* Abraham Lincoln delivers a Gettysburg Address on the grounds of the Soldiers' National Cemetery in Gettysburg, Pennsylvania.
* The address reflects on the Civil War, the sacrifices made by soldiers, and the importance of preserving the nation's commitment to liberty and equality.
* Lincoln emphasizes that the nation was founded on the idea of all men being created equal, a principle that is being challenged and defended during the war.
* He calls upon living citizens to honor the fallen soldiers and continue the work they began to establish a more perfect union.
* The address ends with a powerful statement affirming the enduring promise of government of and by the people for the people.
</div>

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">

Type: key-points Length: long

* Abraham Lincoln delivered the Gettysburg Address on November 19, 1863, at the dedication of the Soldiers' National Cemetery in Gettysburg, Pennsylvania, during the Civil War.
* The address is a concise and powerful tribute to the soldiers who died in the battle.
* Lincoln emphasizes that the nation is engaged in a "civil war" to determine if it can endure.
* He argues that the ground itself is consecrated by the sacrifices of the soldiers, and it's not up to us to add or detract from it.
* The true significance of the dedication lies in our commitment to completing the unfinished work of those who fought for the nation.
* Lincoln urges us to be dedicated to the "great task remaining before us" - to honor their sacrifice by continuing the fight for freedom and democracy.
* He concludes by expressing hope that their deaths will not be in vain and that the nation will emerge stronger and more dedicated to its ideals.

</div>

Two things I want to point out here for consideration. One - there is a part of me that is slightly unsure how I feel about the summary including the context of the text, specifically the fact that it references who gave the address and when. It's valid for sure, but as I said, part of me wonders if that makes sense in a summary. It's technically true, but should the summary focus on the text itself and not the context of where and when it was given? In almost every case I'd argue context matters oif course, but I could also see a situation where I wouldn't want the AI to do that and focus on just the text itself. 

The second thing to note - and I don't think you see it above but it came up in the stream - is that the `long` length may actually return less characters then `medium`, but more bullet points. So yes, it's longer in terms of how many bullets are returned, but could be shorter text length wise. I don't consider that a bug, but just FYI. 

## Type: tl;dr

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">

Type: tl;dr Length: short

The Gettysburg Address urges us to dedicate ourselves to the work of preserving the nation conceived in liberty and dedicated to the proposition that all men are created equal, and to finish the unfinished work begun by those who fought and died for it.
</div>

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">
Type: tl;dr Length: medium

The text is a speech delivered during the dedication of the Gettysburg Cemetery in Pennsylvania during the Civil War. The speaker argues that it is not their place to consecrate the ground but that it has already been consecrated by the sacrifices made by the soldiers who died there. He calls on the living to continue the work that the soldiers began and to ensure that their sacrifice was not in vain. He ends by reaffirming the belief that the nation will endure and that government of the people, by the people, for the people will not perish from the earth.
</div>

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">
Type: tl;dr Length: long

The Civil War is being fought to decide if a nation founded on freedom and equality can truly last. At Gettysburg, we are dedicating a cemetery for those who died fighting for this cause. While we can't truly make the land sacred, the sacrifices of those soldiers have already done so. Our task now is to honor their work and continue the fight for freedom and equality. We must resolve to ensure their deaths weren't in vain and that this nation, guided by God, will endure as a government of the people, by the people, for the people.
</div>

## Type: teaser

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">
Type: teaser Length: short

Abraham Lincoln's Gettysburg Address is a powerful call to action during the Civil War, urging Americans to dedicate themselves to preserving the nation's ideals of liberty and equality.
</div>

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">
Type: teaser Length: medium

Abraham Lincoln delivers the Gettysburg Address, dedicating the Soldiers' National Cemetery in Gettysburg, Pennsylvania. He emphasizes the gravity of the civil war and the sacrifices made by the soldiers who fought to preserve the nation. While the speech is short, its powerful message resonates deeply, urging Americans to honor the fallen, complete the unfinished work of the war, and dedicate themselves to the cause of freedom. Lincoln argues that the nation's fate rests on the ability of the people to govern themselves, reminding everyone of the importance of preserving democracy.
</div>

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">
Type: teaser Length: long

Abraham Lincoln delivers the Gettysburg Address on November 19, 1863, during the Civil War. He argues that it is not for the living to consecrate or dedicate the ground where the war was fought, as it is already consecrated by the sacrifices made by the soldiers who died there. Instead, he calls on the living to dedicate themselves to finishing the work that the dead began - to continue fighting for the cause for which they gave their lives. Lincoln concludes by stating that the nation, under God, will be reborn and that the government of the people, by the people, for the people will not perish from the earth.
</div>

## Type: headline

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">
Type: headline Length: short

The speaker dedicates the Gettysburg battlefield to the sacrifices of those who died in the Civil War. He emphasizes that the soldiers themselves have already consecrated the ground, and it is the duty of the living to finish the work they started and to ensure that their sacrifice was not in vain. He calls for renewed dedication to the cause of freedom and for the establishment of a government of the people, by the people, for the people.
</div>

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">
Type: headline Length: medium

Abraham Lincoln delivers the Gettysburg Address, a powerful speech commemorating the Civil War dead. In it, he argues that the fallen soldiers consecrated the battlefield through their sacrifices, and that it is our duty to finish the work they began and dedicate ourselves to the cause of freedom and democracy, ensuring the nation's survival and enduring promise.
</div>

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 20px">
Type: headline Length: long

On a battlefield, Abraham Lincoln delivers the Gettysburg Address, a pivotal speech that redefined the Civil War and its purpose. Lincoln argues that the nation's founding principles of liberty and equality demand a commitment to preserving the Union, even in the face of immense sacrifice. He emphasizes the sacrifices made by the soldiers and the importance of honoring their memory by dedicating oneself to fulfilling the unfinished work of preserving freedom and self-government. The address concludes with a powerful call for unwavering resolve and a belief that the nation will emerge from the war with a renewed commitment to these ideals.
</div>

Honestly, this one surprised me. I really thought `headline` would be a *lot* shorter, like a title. 

## The Code

If you want to give this a shot yourself, be sure to read the [Get Started](https://developer.chrome.com/docs/ai/summarizer-api#get_started) doc for the API, and run the demo below. 

<p class="codepen" data-height="500" data-default-tab="result" data-slug-hash="zxYrqwP" data-pen-title="window.ai Summarizer Demo (Cleaner)" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/zxYrqwP">
  window.ai Summarizer Demo (Cleaner)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

<p>
