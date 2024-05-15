---
layout: post
title: "Testing Google's New Gemini Flash Model"
date: "2024-05-15T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_racing.jpeg
permalink: /2024/05/15/test-googles-new-gemini-flash-model
description: Testing and comparing the Gemini Flash model
---

I'm currently at [Google I/O](https://io.google/2024/) waiting for the next session to start and decided to take a quick look at the latest Gemini model to be released, Flash 1.5. As the name implies, this is a 'speedier' model built to return responses quicker than other models, with the tradeoff that the results may not be as good. Like most things in life, there's going to be tradeoffs. Gemini's Pro 1.5 model will definitely be slower but will return better results. When and how you choose is... well that's a good question, right? I decided to build a tool so I could play with this myself. The idea is to let me enter a prompt and have it run both Flash *and* Pro models and see both the result as well as how long it took. Here's what I built, and what I saw in my testing.

## Models - in General

My mental model for generative AI, at least from the perspective of the developer writing code to use these services, has very much been similar to how I looked at databases when I did more backend work. Most programming languages make it easy to work with databases. However, writing good SQL is a far different story. When I first began to realize how important my prompts were, I drew parallels to the importance of writing good SQL as well. The API is simple - the use of the API is complex.

It is quite a bit more of a stretch, but I *kinda* look at models like databases. Different databases have different strengths and weaknesses. In the case of Pro and Flash, the tradeoffs are quality of results and speed of execution. 

This is probably not the best analogy, but it's helping me come to terms with working with generative AI. (And please, leave me a comment below with your thoughts on this as well!)

## The Application

The web app I built was very simple - basically a text box for the prompt:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/flash1.jpg" alt="Web interface showing a box for your prompt and a button to get the results." class="imgborder imgcenter" loading="lazy">
</p>

Clicking that button fires off two requests - one to get the results for Flash, and one for Pro. I let both run at the same time and render the result for each as soon as it comes in. Usually, I expect Flash to always come back first.

<p>
<img src="https://static.raymondcamden.com/images/2024/05/flash2.jpg" alt="Screenshot showing results with Flash taking 3032ms and Pro 5083" class="imgborder imgcenter" loading="lazy">
</p>

In the example above, the difference isn't huge, 3 seconds to five seconds, but the prompt was ridiculously small. I did another test with this prompt:

```
The following text is a play. Read the play and create a 
summary consisting of a one sentence title and then 
three paragraphs covering the major themes of the 
play (with citations):
```

And added a plain text version of "Hamlet". In this case, the differences with much larger - Flash took 13.8 seconds to return while Pro took 35 seconds. Here's the Flash result:

<div style="background-color: #c0c0c0; padding: 5px">
<p>
Hamlet is a play that explores the themes of revenge, madness, and the corruption of power. Hamlet, the protagonist, is driven to madness by his father's murder and his uncle Claudius's subsequent marriage to his mother, Gertrude. Fueled by the ghost of his father’s vengeful plea, Hamlet grapples with his own moral compass and his duty to exact justice.
</p>

<p>
The play centers on Hamlet’s internal struggle, where he contemplates the consequences of his actions and the potential for a moral downfall should he act on his vengeful desires. He ponders the question of whether it is better to “suffer the slings and arrows of outrageous fortune” or to “take arms against a sea of troubles” (III.i.55-57). Ultimately, his quest for revenge consumes him, leading to a tragic climax where multiple characters, including himself, meet their demise.
</p>

<p>
The play also explores the corrupting nature of power, as Claudius’s actions to seize the throne through murder showcase the ruthless lengths one can go to for personal gain. The play suggests that power can lead to a disregard for moral principles and a loss of empathy for others. Claudius, “with witchcraft of his wit, with traitorous gifts,” betrays his brother, lustfully covets the queen, and ultimately orchestrates a plan to eliminate Hamlet (I.v.41). The play's ending, with Fortinbras taking the throne, suggests that the corrupting influence of power is cyclical and inescapable.
</p>
</div>

Now compare it to Pro:

<div style="background-color: #c0c0c0; padding: 5px">
<p>
Shakespeare's Hamlet explores the corrosive nature of revenge and its devastating impact on individuals and the state. Hamlet, driven by the ghost's demand for vengeance (I.v.9-11), becomes consumed by his mission, neglecting his studies (II.ii.113-119), alienating his loved ones (III.i.184-189), and feigning madness (I.v.170-172). This pursuit of retribution leads him down a dark path, culminating in a series of tragic deaths, including Polonius (III.iv.21), Ophelia (IV.vii.168-183), and ultimately, himself (V.ii.333-336).
</p>

<p>
The play also highlights the destructive effects of ambition and corruption. Claudius, blinded by his desire for power, murders his brother, marries his widow, and usurps the throne (I.v.75-80). This act throws the kingdom into turmoil, breeding suspicion, paranoia, and ultimately, chaos (I.iv.90-92). Claudius’s actions further demonstrate how the pursuit of power can lead to moral decay, as he manipulates those around him, including Laertes (IV.vii.105-121), to achieve his selfish ends.
</p>

<p>
Finally, Hamlet contemplates the themes of mortality and the fragility of human existence. From the opening scene with the appearance of the Ghost (I.i.41), the play grapples with the mysteries of life and death. Hamlet's famous "To be or not to be" soliloquy (III.i.56-90) reveals his struggle with existential questions, while the gravedigger's scene (V.i.148-216) emphasizes the inevitability of death and the decay of even the greatest individuals. Ophelia's descent into madness and subsequent drowning (IV.vii.168-183) serve as further reminders of the precarious nature of life and the destructive power of grief.
</p>
</div>

While both seem fairly accurate (to be honest, I haven't read Hamlet since college), the Pro version appears to do a *much* better job at citing its results. 

All in all, fairly interesting I think. Honestly, I build these tools for my own learning, but I hope this can help others try things out as well. As a reminder, you absolutely could open two tabs in Google's [AI Studio](https://aistudio.google.com) as well.

## The Code

I considering not sharing the code in the web app as honestly, it's just more variations of my previous tests, but I figure what the heck. You can find the code at my GitHub repo here as well: <https://github.com/cfjedimaster/ai-testingzone/tree/main/pro_vs_flash>

First, the front end, which is just some CSS and vanilla JavaScript:

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>Pro Versus Flash</title>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.css">
	<style>
	body {
		margin:30px;
	}

	textarea {
		min-height: 200px;
	}

	hr {
		margin: 30px 0;   
		border: 0;
		height: 4px;
		background: linear-gradient(-45deg, #ff0000 0%,#ffff00 25%,#00ff00 50%,#00ffff 75%,#0000ff 100%);
	}
	</style>
	<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>

<h1>Pro vs Flash</h1>

<p>
This tool lets you enter one prompt and see the result when using Gemini Pro 1.5 vs Flash. The result and the execution time is returned.
</p>

<div class="row">
	<div class="column column-33"><textarea placeholder="Enter your prompt." id="prompt">Why are cats better?</textarea></div>
	<div class="column column-67 result"></div>
</div>


<div class="clearfix">
<button id="generateResults" class="float-right">Generate Results</button>
</div>

<div id="results"></div>

<script>
let $prompt, $generateResultsBtn, $results;

document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	$prompt = document.querySelector('#prompt')
	$results = document.querySelector('#results')

	$generateResultsBtn = document.querySelector('#generateResults')
	$generateResultsBtn.addEventListener('click',  generateResults, false);	
}

async function generateResults() {
	let prompt = $prompt.value.trim();
	if(prompt === '') return;

	$results.innerHTML = '';

	// While this is nice - I don't _want_ to wait for both since part of the point of this is to see speed diffs
	// let [ pro_result, flash_result ] = await Promise.all([getResult(prompt, 'pro'), getResult(prompt,'flash')]);

	getResult(prompt, 'pro').then(r => {
		renderResult(r, 'Pro');
	});

	getResult(prompt, 'flash').then(r => {
		renderResult(r, 'Flash');
	});

	$generateResultsBtn.removeAttribute('disabled');

}

async function getResult(prompt, model) {
	return new Promise(async (resolve, reject) => {
		let req = await fetch('/api', {
			method:'POST', 
			body:JSON.stringify({prompt, model})
		});
		resolve(await req.json());
	});
}

function renderResult(r, type) {
	let html = `
<hr>
<div>
<h2>Results from ${type} (duration: ${r.duration}ms)</h2>

${marked.parse(r.airesult)}
</div>
	`;

	$results.innerHTML += html;
}
</script>

</body>
</html>
```

I think the only truly interesting part here is that my initial code had me waiting for both to finish, and I quickly realized that didn't make sense. 

The backend is essentially - wait for a request to `/api` that includes a prompt and a simple flag for which model to use:

```js
import * as http from 'http';
import fs from 'fs'; 
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const PRO_MODEL_NAME = "gemini-1.5-pro-latest";
const FLASH_MODEL_NAME = "gemini-1.5-flash-latest"

const API_KEY = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

const pro_model = genAI.getGenerativeModel({ model: PRO_MODEL_NAME });
const flash_model = genAI.getGenerativeModel({ model: FLASH_MODEL_NAME });

async function callGemini(text, model) {

	const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 64,
	maxOutputTokens: 8192,
	responseMimeType: "text/plain",
	};

	const safetySettings = [
		{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,	threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
	];

	const parts = [
    	{text},
  	];

	const result = await model.generateContent({
		contents: [{ role: "user", parts }],
		generationConfig,
		safetySettings,
	});

	try {

		if(result.response.promptFeedback && result.response.promptFeedback.blockReason) {
			return { error: `Blocked for ${result.response.promptFeedback.blockReason}` };
		}
		return result.response.text();
	} catch(e) {
		// better handling
		return {
			error:e.message
		}
	}
	
}

async function handler(req, res) {
	console.log('Entered handler.', req.method, req.url);

	if(req.method === 'GET' && req.url.indexOf('favicon.ico') === -1) {
		res.writeHead(200, { 'Content-Type':'text/html' });
		res.write(fs.readFileSync('./demo.html'));
		res.end();

	} else if(req.method === 'POST' && req.url === '/api') {

		let body = '';
		req.on('data', chunk => {
			body += chunk.toString();
		});

		req.on('end', async () => {
			body = JSON.parse(body);
			let airesult;
			let now = new Date();
			if(body.model === 'pro') {
				console.log('using pro');
				airesult = await callGemini(body.prompt,pro_model);
			} else {
				console.log('using flash');
				airesult = await callGemini(body.prompt,flash_model);
			}
			let duration = (new Date()) - now;
			let result = { duration, airesult };
			res.writeHead(200, { 'Content-Type':'application/json' });
			res.write(JSON.stringify(result));
			res.end();

		});

	}

}

const server = http.createServer(handler);
server.listen(3000);
console.log('Listening on port 3000');
```

In theory, you could expand this (and the front end) to handle more models from Gemini, but Pro and Flash feel like the ones that matter now. 

As always, give it a shot and let me know what you discover.