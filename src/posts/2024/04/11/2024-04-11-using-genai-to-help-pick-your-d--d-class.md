---
layout: post
title: "Using GenAI to Help Pick Your D & D Class"
date: "2024-04-11T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_shopping.jpg
permalink: /2024/04/11/using-genai-to-help-pick-your-d--d-class
description: 
---

A few weeks back I wrote up my experience with [generative AI as a dungeon master](https://www.raymondcamden.com/2024/02/16/google-gemini-as-your-dungeon-master). That post ended up being *really* popular and got me thinking about other ways I could integrate D & D, or other games, with Generative AI. With [Gemini 1.5](https://developers.googleblog.com/2024/04/gemini-15-pro-in-public-preview-with-new-features.html) now available via API, I thought it would be good to find an excuse to hit the API in a demo. So with that in mind, I'd like to introduce you to the Class Suggester.

## The Application

The app begins by simply presenting some introductory text and invites you to click a button to roll for your stats.

<p>
<img src="https://static.raymondcamden.com/images/2024/04/ddc1.jpg" alt="Initial screen of the application" class="imgborder imgcenter" loading="lazy">
</p>

You can hit the Roll Stats button as many times as you want. It uses the standard D & D rule of rolling a six-sided dice four times and removing the lowest number:

<p>
<img src="https://static.raymondcamden.com/images/2024/04/ddc2.jpg" alt="Sample values set for the attributes of a D and D character" class="imgborder imgcenter" loading="lazy">
</p>

Once you have stats, I enable another button that lets you hit it to ask Gemini to make a suggestion. Here's a screenshot of it in action:

<p>
<img src="https://static.raymondcamden.com/images/2024/04/ddc2a.jpg" alt="Recommendations based on stats" class="imgborder imgcenter" loading="lazy">
</p>


I played with this a bit, and it seemed to match well with the basics I know about D and D, and RPGs in general. It also surprised my many times, for example:

<p>
<img src="https://static.raymondcamden.com/images/2024/04/ddc3.jpg" alt="More class suggestions" class="imgborder imgcenter" loading="lazy">
</p>

I don't know what an Eldritch Knight Fighter is but it sounds cool as hell. Alright, let's look at the code.

## The Frontend

The web portion of the application is just a simple Alpine.js application. Here's the relevant HTML with placeholders for Alpine data:

```html
<div class="container" x-data="classSuggester" x-cloak>

	<div class="row">

		<!-- This is where we will render the attributes and scores... -->
		<div class="column">
		<h2>Your Stats</h2>
		<ul>
			<li>Strength: <span x-text="strVal"></span></li>
			<li>Dexterity: <span x-text="dexVal"></span></li>
			<li>Constitution: <span x-text="conVal"></span></li>
			<li>Intelligence: <span x-text="intVal"></span></li>
			<li>Wisdom: <span x-text="wisVal"></span></li>
			<li>Charisma: <span x-text="chrVal"></span></li>
		</ul>

		<button @click="roll">Roll Stats</button>
		</div>

		<!-- This is where we will render Gemini's response. -->
		<div class="column">
			<template x-if="statsReady">
				<div>
					<p>
					<button @click="getSuggestion">Get Suggested Class</button>
					</p>
					<dix x-html="result"></div>
				</div>
			</template>
		</div>

	</div>

</div>
```

I don't think there's anything really interesting there, but obviously, leave me a comment below if you've got a question. The JavaScript is also relatively simple:

```js

document.addEventListener('alpine:init', () => {
	console.log('alpine:init fired');

	Alpine.data('classSuggester', () => ({
		async init() {
			console.log('app init fired');
		},
		strVal:null,
		dexVal:null,
		conVal:null,
		intVal:null,
		wisVal:null,
		chrVal:null,
		statsReady:false,
		result:'',
		async getSuggestion() {
			this.result = '<i>Loading a suggestion from Google Gemini...</i>';
			let body = {
				str:this.strVal,
				dex:this.dexVal,
				con:this.conVal, 
				int:this.intVal,
				wis:this.wisVal,
				chr:this.chrVal
			};
			let suggestion = await (await fetch('/api', { method:'POST', body:JSON.stringify(body)})).json();

			this.result = marked.parse(suggestion.response);
		},
		roll() {

			// for each stat, roll 4 times, drop lowest
			this.strVal = getScore();
			this.dexVal = getScore();
			this.conVal = getScore();
			this.intVal = getScore();
			this.wisVal = getScore();
			this.chrVal = getScore();

			this.statsReady = true;

		}
	}));

});

function getScore() {
	let rolls = [getRandomInt(1,6), getRandomInt(1,6), getRandomInt(1,6), getRandomInt(1,6)].sort((a,b) => a-b);
	rolls.shift();
	return rolls.reduce((prev,cur) => { return prev + cur }, 0);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); 
}
```

The only real interesting part is `getScore`, which handles rolling the die four times and then dropping the lowest value. 

## The Backend

My backend is one main script, `server.js`, that is a lightweight Node.js web server. I'm going to skip the boilerplate part, and instead show you how it processes the incoming request. 

First, I've got code to parse the incoming request body and send this to the method that will integrate with Gemini:

```js
let body = '';
req.on('data', chunk => {
	body += chunk.toString();
});

req.on('end', async () => {
	body = JSON.parse(body);

	console.log('BODY:\n', JSON.stringify(body, null, '\t'));

	let result = await callGemini(body);
	res.writeHead(200, { 'Content-Type':'application/json' });
	res.write(JSON.stringify(result));
	res.end();

});
```

It's simply returning that value to the caller. Now let's look at the Gemini related code:

```js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME } , { apiVersion:'v1beta' });

async function callGemini(attributes) {

	const generationConfig = {
		temperature: 0.9,
		topK: 1,
		topP: 1,
		maxOutputTokens: 2048,
	};

	const safetySettings = [
		{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,	threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
	];

	let text = `
Give the standard rules for Dungeons and Dragons, what class would you recommend for a character with these stats:

Strenth: ${attributes.str}
Dexterity: ${attributes.dex}
Constitution: ${attributes.con}
Intelligence: ${attributes.int}
Wisdon: ${attributes.wis}
Charisma: ${attributes.chr}

I already know what Dungeons and Dragons is, so your response should just focus on the class recommendation.

	`;
	const parts = [
    	{text},
  	];

	const result = await model.generateContent({
		contents: [{ role: "user", parts }],
		generationConfig,
		safetySettings,
	});

	//console.log(JSON.stringify(result,null,'\t'));

	try {

		if(result.response.promptFeedback && result.response.promptFeedback.blockReason) {

			return { error: `Blocked for ${result.response.promptFeedback.blockReason}` };
		}
		const response = result.response.candidates[0].content.parts[0].text;
		return { response };
	} catch(e) {
		// better handling
		return {
			error:e.message
		}
	}
	
}
```

On top, the first change (from my previous demos anyway) is selecting the new 1.5 model. In order for that to work, however, you must specify `apiVersion` and set it to `v1beta`. (And if you are reading this in the future, that's probably not required anymore.)

The code inside `callGemini` is roughly the exact same as I've shown before, the important part is how I crafted the prompt. You can see I'm describing the situation (creating a new character) and then specifying what I want. Notice this part:

```
I already know what Dungeons and Dragons is, so your response should just focus on the class recommendation.
```

Why is this there? When I first tested my code, I was still using Gemini 1.0 Pro, and it worked perfectly fine. In 1.5, it still worked fine, but every result started off with a quick explanation of D&amp;D, which was correct, but noise since in this case, we can expect the user to already know what D&amp;D is. When I added this extra bit of prompt text, it worked well to focus the results. 

If you want to see the complete code, you can check it out here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/class_selector> As always, let me know what you think by leaving a comment below.