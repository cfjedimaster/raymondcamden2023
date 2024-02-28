---
layout: post
title: "Testing Multiple Variations of Generative AI Prompts"
date: "2024-02-26T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/cat_writing_paper.jpg
permalink: /2024/02/26/testing-multiple-variations-of-generative-ai-prompts
description: A simple web tool to let you compare and contract different prompt styles.
---

In nearly all of my recent explorations of Generative AI, I've come to realize how important prompts are. That hasn't necessarily translated me into writing better prompts all the time, but being aware of the problem is at least one step towards correcting it, right? One of the things that I thought would help me personally would be to have a tool to quickly compare and contrast different prompts. Obviously, I could just open up multiple tabs in a browser, but I really wanted something more direct and simplified for my purposes. With that in mind, let me share what I've built. 

## Prompt Tester

Prompt Tester is my incredibly imaginatively named tool to... um... test prompts. It begins with one prompt:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/pt1.jpg" alt="Prompt Tester web app with one empty prompt" class="imgborder imgcenter" loading="lazy">
</p>

The idea is that you enter your initial prompt, and then click one or more times to add more prompts. When ready, you can then just click "Generate Results":

<p>
<img src="https://static.raymondcamden.com/images/2024/02/pt2.jpg" alt="Prompt Tester web app with two prompts and results" class="imgborder imgcenter" loading="lazy">
</p>

Before showing some example results, let me talk a bit about how it was built.

## The Code

The backend is an *incredibly* simple Node.js server that handles throwing up the static HTML and responding to the front end API requests. Once again, I thank Todd Sharp for sharing his initial code with me. Here's the boring simple handling portion:

```js
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
			console.log('BODY:\n', JSON.stringify(body, null, '\t'));

			let result = await callGemini(body.prompt);
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

And the `callGemini` part, which just passes the prompt off to Google's [Gemini API](https://ai.google.dev/). In theory, this could be changed to ChatGPT or any other service.

```js
const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GOOGLE_AI_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

async function callGemini(text) {

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

I'm proud to say that I'm now, finally, doing some basic error handling and trying to expose to the user (me) why a prompt was blocked. 

The front end is relatively simple. I used [Milligram](https://milligram.io/) for the core CSS (again, thank you Todd) and some vanilla JavaScript to handle adding new prompts and making the calls. Here's the HTML (minus the inline CSS):

```html
<h1>Prompt Tester</h1>

<p>
This tool helps you see the result of multiple prompts at the same time. The idea is to use similar prompts with different phrasing 
to see how it impacts the result.
</p>

<div id="prompts">
</div>

<template id="promptRow">
<div class="row">
	<div class="column column-33"><textarea placeholder="Enter your prompt."></textarea></div>
	<div class="column column-67 result"></div>
</div>
<hr>
</template>


<div class="float-right">
<button id="addPrompt">Add Prompt</button> <button id="generateResults">Generate Results</button>
</div>
```

And then the JavaScript. Notice I used `<template>` above to handle the prompt layout. This is the first time I've used that tag and it was relatively easy.

```js
let $template, $prompts, $addPromptsBtn, $generateResultsBtn;
let promptCount = 0;

document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	
	$addPromptsBtn = document.querySelector('#addPrompt');
	$addPromptsBtn.addEventListener('click',  addPrompt, false);
	$generateResultsBtn = document.querySelector('#generateResults')
	$generateResultsBtn.addEventListener('click',  generateResults, false);
	$template = document.querySelector('#promptRow');
	$prompts = document.querySelector('#prompts');

	addPrompt();
}

function addPrompt() {
	promptCount++;
	const newPrompt = $template.content.cloneNode(true);
	$prompts.append(newPrompt);
}

async function generateResults() {
	// disable add prompt and generate
	$addPromptsBtn.setAttribute('disabled', 'disabled');
	$generateResultsBtn.setAttribute('disabled', 'disabled');

	let $results = document.querySelectorAll('div.result');
	// clear any previous results
	$results.forEach(r => r.innerHTML = '');

	/*
	gather prompts from the inputs
	*/
	let prompts = [];
	let $fields = document.querySelectorAll('#prompts textarea');
	for(f of $fields) prompts.push(f.value);

	let promises = [];
	for(p of prompts) promises.push(getResult(p));
	let results = await Promise.all(promises);

	// assign results to result area for each, handle errors - later
	// there's a one to one correspondance between our array of results and the result div
	for(let i=0;i<results.length;i++) {
		if(results[i].response) $results[i].innerHTML = marked.parse(results[i].response);
		else if(results[i].error) $results[i].innerHTML = `<strong>Error with Prompt: </strong> ${results[i].error}`;
	}

	$addPromptsBtn.removeAttribute('disabled');
	$generateResultsBtn.removeAttribute('disabled');

}

async function getResult(p) {
	console.log('get result for',p);
	// quick return on empty prompt
	if(p.trim() === '') return { response:'<strong>Enter a prompt.</strong>' };
	let req = await fetch('/api', { method:'POST', body: JSON.stringify({prompt:p.trim()})});
	let result = await req.json();
	return result;
}
```

I *think* that's all pretty simple DOM manipulation and API calling, but definitely let me know in a comment below if something doesn't make sense. Notice I fire off all my API calls at once and `Promise.all` wait for them to finish. 

Also, note I use the `marked` library. The results from Google typically have Markdown and this helps render them nicely in my little web app.

All of this isn't terribly interesting I think, but let's look at some testing. As I said, I *knew* the style of prompt was important. Having it presented directly to me in a tool went a *heck* of a long way to reinforcing that. 

## Sample Result - Gravity

Let's start with a simple idea - explaining gravity, but for different age groups. Because of the large size of the results, I'm going to use a bit of CSS here to help keep things sane.

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 10px">
<p>
<strong>Prompt: explain gravity to me but make it appropriate for a child in 1st grade</strong>
</p>

Gravity is a superpower that our planet has! It's like an invisible force that makes everything on Earth stay on the ground.

Imagine you have a ball in your hand. When you drop it, what happens? It falls down, right? That's because of gravity. Gravity pulls the ball towards the center of the Earth, and so it falls to the ground.

Gravity is also what keeps us on the ground. It's what keeps our feet planted firmly on the Earth and prevents us from floating away!

Gravity is a very important force. It keeps everything in place and helps things work the way they do. Without gravity, we would all be floating around in space, and things would be very chaotic!

Here's a fun way to think about gravity: imagine that the Earth is a giant magnet, and everything on Earth is made of metal. The magnet pulls the metal objects towards it, and that's what keeps them on the ground.

Gravity is a very important and interesting force. It's one of the things that makes our planet such a unique and special place to live!
</div>


<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 10px">
<p>
<strong>Prompt: explain gravity to me but make it appropriate for a child in 7th grade</strong>
</p>

Imagine you're playing with a ball. You toss it up in the air, and it comes back down to you. This is because of gravity. Gravity is a force that pulls things toward each other. It's what keeps you on the ground and what makes things fall down.

The amount of gravity between two objects depends on their mass. The more mass an object has, the stronger its gravity is. That's why things like planets and stars have more gravity than things like people and cars.

Gravity is also what keeps the planets in orbit around the sun. The sun's gravity is much stronger than the Earth's, so it pulls the Earth towards it. This keeps the Earth moving in a circle around the sun.

Gravity is a very important force in our universe. It keeps things in place and makes things move. Without gravity, the planets would fly off into space, and we would all float away.

Here are some fun facts about gravity:

* Gravity is responsible for the tides. The moon's gravity pulls on Earth's oceans, causing them to rise and fall.
* Gravity is the reason why we have an atmosphere. Without gravity, the air would just float away into space.
* Gravity is what makes it possible for us to walk. When we walk, our feet push against the ground, and the ground pushes back. This is what propels us forward.
* Gravity is the reason why we don't float away into space. Earth's gravity pulls us towards its center, keeping us on the ground.
</div>

Note the typo in the prompt below. Gemini handled it just fine.

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 10px">
<p>
<strong>Prompt: explain gravity to me but make it appropriate for a college-aged studen</strong>
</p>

**Gravity: The Force of Attraction**

Gravity is a fundamental force in the universe responsible for keeping celestial bodies, such as planets, moons, and stars, in motion. It is also what keeps us firmly planted to the ground and allows objects to fall when dropped.

**Newton's Law of Universal Gravitation:**

The law of universal gravitation states that every object in the universe attracts every other object with a force proportional to the product of their masses and inversely proportional to the square of the distance between them. Mathematically, it can be expressed as:

F = Gm1m2/r^2

Where:

F is the gravitational force between two objects. G is the gravitational constant (6.674 × 10^-11 N m^2/kg^2). m1 and m2 are the masses of the two objects. r is the distance between the centers of the two objects.

**Significance of Gravity:**

1. **Keeps Celestial Bodies in Orbit:**
The gravitational pull of larger celestial bodies keeps smaller ones revolving around them. For example, Earth's gravity keeps the moon in orbit, while Sun's gravity keeps Earth and other planets in their respective orbits.

1. **Responsible for Tides:**
Gravity between the Earth and the moon causes ocean tides. As the moon orbits Earth, its gravitational pull creates a bulge in the ocean's water on the side facing the moon. Another bulge forms on the opposite side of Earth due to the inertial forces. As the Earth rotates, these bulges move across the planet's surface, resulting in high and low tides.

1. **Keeps Objects on Earth:**
Gravity pulls objects towards Earth's center, preventing them from floating away. This phenomenon allows us to walk, stand, and interact with our environment.

1. **Formation of Stars and Galaxies:**
Gravity plays a crucial role in the formation of stars and galaxies. The gravitational collapse of massive clouds of gas and dust leads to the creation of new stars. Similarly, the gravitational pull of galaxies keeps them bound together, preventing them from dispersing.

1. **Relativity Theory:**
Albert Einstein's general relativity theory provides a more comprehensive understanding of gravity. It explains that gravity is not a force but rather a curvature of spacetime caused by the presence of mass or energy. This curvature affects the motion of objects, causing them to follow curved paths rather than straight lines.

In conclusion, gravity is a fundamental force responsible for keeping celestial bodies in motion, tides, and the behavior of objects on Earth. It is a complex phenomenon that has been studied extensively over the centuries, and it continues to fascinate scientists and researchers to this day.
</div>

## Sample Result - Pets

For my second test, I started with a basic prompt and then a better version that asked for specific types of details:

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 10px">
<p>
<strong>Prompt: why are cats so much better than dogs?</strong>
</p>

Cats and dogs are both popular pets, and there is no definitive answer to the question of which one is better. Both cats and dogs have their own unique set of advantages and disadvantages, and the best pet for you will depend on your individual needs and preferences.

Some people prefer cats because they are generally more independent than dogs. Cats are typically happy to entertain themselves, and they don't need to be walked or taken outside for exercise. This can be a big advantage for people who live in apartments or who have busy schedules.

Cats are also known for being clean and tidy animals. They groom themselves regularly, and they typically use the litter box without any problems. This can be a big advantage for people who don't want to deal with the mess and smell of a dog.

Of course, there are also some disadvantages to having a cat. Cats can be more expensive than dogs, and they can be more difficult to train. Cats are also more likely to scratch furniture and other household items.

Ultimately, the decision of whether to get a cat or a dog is a personal one. There is no right or wrong answer, and the best pet for you will depend on your individual needs and preferences.

Here is a table summarizing the key differences between cats and dogs:


<table>
<thead>
<tr>
<th>Characteristic</th>
<th>Cat</th>
<th>Dog</th>
</tr>
</thead>
<tbody><tr>
<td>Independence</td>
<td>More independent</td>
<td>Less independent</td>
</tr>
<tr>
<td>Exercise needs</td>
<td>Does not need to be walked or taken outside</td>
<td>Needs to be walked or taken outside</td>
</tr>
<tr>
<td>Cleanliness</td>
<td>Cleans itself regularly</td>
<td>Needs to be bathed regularly</td>
</tr>
<tr>
<td>Training</td>
<td>Can be difficult to train</td>
<td>Easier to train</td>
</tr>
<tr>
<td>Scratching</td>
<td>May scratch furniture and other household items</td>
<td>Does not typically scratch furniture</td>
</tr>
<tr>
<td>Cost</td>
<td>More expensive</td>
<td>Less expensive</td>
</tr>
</tbody></table>

</div>

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom: 10px">
<p>
<strong>Prompt: why are cats so much better than dogs? explain with a bulleted list of reasons that cover emotional well being and financial aspects</strong>

**Emotional well-being:**

* Independence: Cats are more independent than dogs, which can be a good thing for people who want a pet that doesn't require a lot of attention.
* Low maintenance: Cats are generally lower maintenance than dogs. They don't need to be walked or groomed as often, and they can be left alone for longer periods of time.
* Quiet: Cats are generally quieter than dogs, which can be ideal for people who live in apartments or have noise-sensitive neighbors.
* Therapeutic: Studies have shown that cats can have a calming effect on humans, and they can help to reduce stress and anxiety.


**Financial aspects:**

* Lower cost: Cats are generally less expensive to own than dogs. They eat less food, they need fewer vet visits, and they don't require as much grooming.
* Easier to travel with: Cats are easier to travel with than dogs. They can be transported in a carrier, and they don't need to be walked or exercised while you're away.
* Longer lifespan: Cats have a longer lifespan than dogs, on average. This means that you can enjoy your cat's companionship for many years to come.

</div>

## Sample Result - Chain of Thought Prompting

The following test came from an *excellent* presentation from AWS re:Invent: [AWS re:Invent 2023 - Prompt engineering best practices for LLMs on Amazon Bedrock (AIM377)](https://www.youtube.com/watch?v=jlqgGkh1wzY). I found a lot of great advice from this session, including a good overview of Chain of Thought prompting, where the idea is you provide information about the steps used to solve a problem to help the GenAI engine better solve a prompt. 

Now, the example given in that presentation went like so:

```
Q: Roger has 5 tennis balls. he buys 2 more cans of tennis balls. Each 
can has 3 tennis balls. How many tennis balls does he have now?

A: The answer is 11.

Q. The cafeteria had 23 apples. If they used 20 to make lunch and 
bought 6 more, how many apples do they have?
```

In the presentation, the model in use incorrectly returned 27. In my test, it worked correctly, but I absolutely saw issues with math back when I built my [generative AI blackjack advice demo](https://www.raymondcamden.com/2023/11/09/can-genai-help-you-win-in-vegas) last November. 

As I said, Gemini handled it fine: `A: The answer is 9.` But in Prompt Tester, I tried the suggested CoT prompt:

```
Q: Roger has 5 tennis balls. he buys 2 more cans of tennis balls. Each 
can has 3 tennis balls. How many tennis balls does he have now?

A: Roger started with 5 balls. 2 cans of 3 tennis balls each is 6 
tennis balls. 5 + 6 = 11. The answer is 11.

Q. The cafeteria had 23 apples. If they used 20 to make lunch and 
bought 6 more, how many apples do they have?
```

And the result was improved, showing how it got to the answer:

```
A: The cafeteria had 23 apples. They used 20 apples for lunch, which 
means they have 3 apples left. They then bought 6 more apples, so 
they now have a total of 3 + 6 = 9 apples.

The answer is 9.
```

The difference is pretty significant. 

### The Code 

If this seems useful to you at all, feel free to grab the code from here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/prompt_tester>. As I mentioned, it shouldn't be that difficult to add `callChatGPT` or some such and use a different service. If you do, let me know!