---
layout: post
title: "Testing Temperature Settings with Generative AI"
date: "2024-02-14T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/cat_temp.jpg
permalink: /2024/02/14/testing-temperature-settings-with-generative-ai
description: Visualizing the impact of temperature settings in your GenAI Application
---

So far most of my playing with Generative AI has been on the prompt side, with no real look at the various settings you can tweak in your calls. As I'm still very new to this, I'm trying my best to take things slowly. But every time I open [Google AI Studio](https://makersuite.google.com/) and see the settings on the right, I keep nagging myself to take a deeper look. 

<p>
<img src="https://static.raymondcamden.com/images/2024/02/temp1.jpg" alt="Screen shot of settings available for prompts" class="imgborder imgcenter" loading="lazy">
</p>

You can also see the various settings options in the default code Studio spits out:

```js
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
```

I thought today I'd take a look at `temperature`, as I had a *very* rough idea of what it implied. Temperature, at a high level, refers to how 'varied' a particular generated response can be. As an example, if I were to say, "I like ____", then you could make a list of what the next word would be, rated by how likely it is:

* Cats (VERY LIKELY)
* Star Wars (LIKELY)
* Books (LIKELY)
* Vegetables (UNLIKELY)

At the highest temperature value, there will be a *lot* of variety. At the lowest level, no variety. Now, from what I know, that does *not* mean that every response will be the same. Just very similar. This post, ["Creatively Deterministic: What are Temperature and Top_P in Generative AI?"](https://www.linkedin.com/pulse/creatively-deterministic-what-temperature-topp-ai-kevin-tupper/), does a great job explaining temperature (and other settings). 

While it's relatively easy in AI Studio to adjust the temperature setting you see above, what I really wanted was a tool to help me see multiple results at once. So I built one. :) 

## Temperature Testing Tool

My tool begins with a simple prompt:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/temp2.jpg" alt="Temperature Demo with prompt on top" class="imgborder imgcenter" loading="lazy">
</p>

This is pretty vanilla HTML so I won't share the code here (I've got a link to everything down below). Upon hitting the button, that's where the magic begins. Here's the JavaScript:

```js
// Testing ranges for temperature
const tempRanges = [0, 0.3, 0.6, 1];

// How many times to test per temp.
const perTemp = 2;

let $status, $results;

document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	document.querySelector('#submitBtn').addEventListener('click', handleSubmit, false);
	$status = document.querySelector('#status i');
	$results = document.querySelector('#results');
}
```

I begin with some variable declarations and a listener for `DOMContentLoaded`. In the variable sections, the first two are the crucial ones. Temperature values go from 0 (focus on only the highest probable response) to 1 (be more creative) and I decided to test four values in that range. 

For each range in the array of temperatures, I do two tests. My thinking was that two results would be enough to see the variance in one particular temperature value.

Carrying on...

```js
async function handleSubmit(e) {
	e.preventDefault();
	$results.innerHTML = '';

	let prompt = document.querySelector('#prompt').value.trim();
	if(prompt === '') return;

	/*
	We are going to loop perTemp times for each tempRange. In order to not
	get stopped by Gemini for too many requests, and to provide feedback to the user, 
	I'll report after each tempRange
	*/
	for(temp of tempRanges) {
		$status.innerText = `Getting results for temperature ${temp}.`;
		let promises = [];
		for(let i=0; i<perTemp; i++) {
			promises.push(getResult(prompt, temp));
		}

		let results = await Promise.all(promises);
		let html = `<h2>Temperature ${temp}</h2>`;
		for(let i=0; i < results.length; i++) {
			html += `
<p>
Result #${i+1}:<br/>
${results[i]}
</p>`;
		}
		$results.innerHTML += html;
		console.log(results);
	}

	$status.innerText = ``;
	
}

async function getResult(prompt, temperature) {
	console.log(`Calling getResult with prompt ${prompt} and ${temperature}`);
	let body = {
		prompt, 
		temperature
	};
	let req = await fetch('/api', { method: 'POST', body: JSON.stringify(body)});
	return await req.json();
}
```

In this code, I loop over the range of temperatures and then make my two sample calls. When done, I render it out to the screen. 

The last function simply passes my prompt and temperature to the backend API. I'll share a screenshot but it's a *long* wall of text, this is only a small portion:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/temp3.jpg" alt="Temperature Demo with prompt on top" class="imgborder imgcenter" loading="lazy">
</p>

The backend is a lightweight Node.js server that basically handles outputting my HTML and responding to the `POST` request by the client-side JavaScript. Let's take a look at that, specifically the portion handling the Google Gemini call:

```js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GOOGLE_AI_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

async function callGemini(text, temperature) {

	const generationConfig = {
		temperature,
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

	const response = result.response.candidates[0].content.parts[0].text;
	
	return response;
}
```

This is pretty much the exact code spit out by Studio, but wrapped into a function where the prompt and temperature can be passed in. This function has *no* error handling and that absolutely bit me in the butt. I'm going to be taking a look at those errors, and how to handle them, in a future blog post. 

So what did I find?

## Results

Here's the results of using the prompt: "Tell me a story about cats."

First, temperature 0. 

### Result 1

<p style="background-color: #c0c0c0; height:400px;overflow-y:scroll;padding: 5px">
Once upon a time, in a quaint little town nestled amidst rolling hills, there lived a mischievous cat named Mittens. Mittens was known throughout the neighborhood for her playful antics and her insatiable curiosity. One sunny afternoon, as Mittens was basking in the warmth of the sunbeam that streamed through the window, she noticed a peculiar sound coming from the kitchen. Intrigued, she hopped off the window sill and tiptoed towards the source of the noise. Upon entering the kitchen, Mittens discovered a group of kittens huddled around a bowl of milk. Their tiny paws were eagerly reaching for the sweet liquid, and their eyes sparkled with delight. Mittens, being the adventurous cat she was, couldn't resist joining in on the fun. With a playful leap, Mittens landed gracefully in the midst of the kittens. She purred loudly, her tail swishing back and forth, as she rubbed against their soft fur. The kittens, initially startled by the sudden intrusion, soon warmed up to Mittens' friendly presence. Together, they formed a circle around the bowl of milk, their whiskers twitching as they lapped up the delicious treat. Mittens, being the eldest and most experienced cat, took it upon herself to teach the kittens proper table manners. She showed them how to take turns and how to avoid spilling the milk. As the kittens learned and grew, they developed a deep bond with Mittens. They looked up to her as their mentor and protector. Mittens, in turn, cherished her role as the leader of the pack. She spent her days playing with the kittens, teaching them valuable life lessons, and keeping them safe from harm. Word of Mittens' extraordinary kindness and wisdom spread throughout the town. People would often bring their cats to her, seeking her advice and guidance. Mittens welcomed each and every cat with open paws, offering them comfort, support, and a sense of belonging. And so, Mittens became known as the "Guardian Cat" of the town. She was loved and respected by all, both humans and cats alike. Her legacy lived on for generations, inspiring countless cats to follow in her paw prints and spread joy and kindness wherever they went.
</p>

### Result 2

<p style="background-color: #c0c0c0; height:400px;overflow-y:scroll;padding: 5px">
Once upon a time, in a quaint little town nestled amidst rolling hills, there lived a mischievous cat named Mittens. Mittens was known throughout the neighborhood for her playful antics and her insatiable curiosity. One sunny afternoon, as Mittens was basking in the warmth of the sunbeam that streamed through the window, she noticed a peculiar sound coming from the kitchen. Intrigued, she hopped off the window sill and tiptoed towards the source of the noise. Upon entering the kitchen, Mittens discovered a group of kittens huddled around a bowl of milk. Their tiny paws were eagerly lapping up the delicious liquid, their whiskers quivering with delight. Mittens, unable to resist the temptation, joined the kittens and began to partake in the feast. As they drank, Mittens couldn't help but notice that one of the kittens was smaller and weaker than the others. It struggled to keep up with its siblings, and its eyes held a look of longing. Mittens, being the compassionate cat that she was, decided to help the little kitten. With a gentle nudge, Mittens pushed the other kittens aside and made room for the weaker one. She then curled her tail around the kitten, providing it with warmth and comfort. The little kitten, grateful for Mittens' kindness, nuzzled against her fur and began to purr softly. As the kittens continued to drink their milk, Mittens couldn't help but feel a sense of fulfillment. She had not only satisfied her own hunger but had also brought joy and comfort to a fellow creature. From that day forward, Mittens became known as the neighborhood's guardian angel. She would often be seen playing with the kittens, teaching them how to climb trees and chase butterflies. She would also bring them food and shelter when they were in need. The kittens, in turn, adored Mittens and would follow her everywhere she went. They would purr and rub against her legs, showing their affection and gratitude. And so, Mittens lived a long and happy life, surrounded by the love and companionship of her feline friends. She taught the town's residents the importance of kindness and compassion, and her legacy lived on long after she was gone.
</p>

<hr>

Notice that both start off the same and then diverge. To save on space, I'll skip to temperature 1 next.

### Result 1

<p style="background-color: #c0c0c0; height:400px;overflow-y:scroll;padding: 5px">
Once upon a time, in a bustling city called Willow brook, there lived a calico cat named Mittens. Mittens had a reputation for being a fearless explorer, always curious and eager for adventure. One day, Mittens embarked on her biggest expedition yet. She had heard rumors of a secret garden hidden deep within the city park, and she was determined to find it. When nightfall came, Mittens began her adventure, carefully sneaking out of her home and into the park. The park was silent, illuminated only by the soft glow of the moon. As she tiptoed through the winding paths, a faint scent of flowers carried by the wind caught her attention. Mittens followed the scent until she stumbled upon a large tree. Its branches were laden with bountiful blooms, and a gentle breeze sent petals raining down on her. Suddenly, a soft voice whispered, "Welcome, little traveler." Mittens looked around, her eyes widening in astonishment. Sitting on a branch was a beautiful cat, its fur shimmered like the night sky. "I am Esmerelda," the cat said, "and you are Mittens, the brave calico." Mittens was amazed. She had heard stories about Esmerelda, a magical cat said to hold the secret to unlocking the hidden garden. "Yes, Mittens," Esmerelda continued, "you have found the Enchanted Garden. But to enter, you must pass three challenges." Without hesitation, Mittens agreed. Her first challenge was to find a golden key hidden within the roots of and oak tree. With her sharp claws and determined spirit, Mittens discovered the key, its surface glowing brightly. Next, Esmerelda asked Mittens to gather dewdrops from the heart of a moonflower blossom. As Mittens gracefully leaped and climbed the tall stems, she carefully collected the sparkling dew in a tiny seashell. Finally, Mittens' last challenge was to sing a song that would make the trees sway and the flowers bloom. As Mittens lifted her voice, her melodious' tune enchanted the garden, which sprang to life with vibrant colors and dazzling lights. Esmerealda smiled, "Well done, little traveler. You have passed the challenges." With a gentle paw, Esmerelda touched the large oak tree, causing it to slowly open like a door, revealing an awe-inspiring paradise. Inside the Enchanted Garden, Mittens found lush meadows, sparkling fountains, and exotic creatures playing among the trees. It was a place of wonder and joy, as if every storybook she had ever heard had come true. Mittens spent the entire night exploring the magical realm, amazed by its beauty. As dawn broke, she turned to Esmerelda and said, " Thank you for sharing this incredible place with me. Esmerelda purred softly. "You are welcome, Mittens. As long as you believe in magic, the garden will always be here for you to explore." From that day forward, Mittens became the guardian of the Enchanted Garden, a place where she could always find solace, friendship, and a sense of belonging among the natural beauty of Willow brook. And so, the legend of the brave calico and the Enchanting Garden lived on, brought to life of the belief in magic and the wonders that can be found when one dares to explore beyond the ordinary.
</p>

### Result 2 

<p style="background-color: #c0c0c0; height:400px;overflow-y:scroll;padding: 5px">
Once upon a time, in a small and charming town called Willow Creek, nestled amidst rolling hills and blooming meadows, there lived two extraordinary cats. One was a sleek and graceful Siamese named Luna, whose shimmering white fur and piercing blue eyes radiated elegance and mystique. Her every movement exuded nimbleness, gliding through the streets of Willow Creek with an air of regal composure. Meet the second cat was a tabby by the name of Max, a playful and mischievous soul, adorned with a coat of orange and black stripes. His sparkling green eyes twinkled with a mischievous glint; ears always perked, ever alert to the adventures that awaited him. His playful antics had become legend among the townspeople, who were often greeted by his friendly antics and joyful meows. The companionship between Luna and Max was a sight to behold. They were inseparable, roaming the cobblestone streets together, their playful pursuits leading them to alleyways and secret paths known only to them. Their friendship was a true testament to the unwavering spirit and unbreakable bond between cats. During the day, they would bask lazily in the warm sunlight that bathed the town square, absorbing the melody of children playing and the laughter of friends sharing stories. At night, under the velvet sky adorned with shimmering stars, they would chase elusive fireflies and embark on daring expeditions, exploring the town's hidden nooks and crannies, their soft paw steps barely disturbing the tranquil silence. Many a local came to rely on the presence of Luna and Max, knowing that their playful chases and affectionate purrs brought an unexplainable joy and warmth to the heart. The elderly, feeling isolated, found solace in their presence, witnessing a simple yet profound beauty in their interactions. Children were captivated by their antics, watching in delight as they climbed trees or chased each other through the flowerbeds. One day, a traveling circus arrived in Willow Creek, filled with fanfare and vibrant colors. Luna and Max, captivated by the excitement, couldn't resist exploring the wonders this circus held. As they ventured into the largest tent, they were greeted with the mesmerising spectacle of trained cats, performing incredible feats of agility and balance. Inspired by their newfound passion, Luna and Max made a daring decision - they ran away to join the circus! They honed their skills tirelessly, practicing their balancing acts and performing stunning leaps. Their dedication and unwavering friendship caught the attention of the ringmaster, who recognized their talent and potential. Finally, the moment arrived when Luna and Max took center stage, their hearts pounding with excitement and anticipation. The audience, holding their breath in anticipation, witnessed an extraordinary performance, a mesmerizing ballet of agility and grace. Luna's elegant poise and Max's playful energy combined to create a symphony of motion that left the spectators awe-inspired. News of Luna and Max's incredible talents spread like wildfire, and they became stars of the circus, sharing their joy and laughter with audiences of all ages. Their unwavering friendship remained the heart of their performances, a symbol of the magical bond between cats that touched the hearts of all who witnessed their amazing journey. And so, Luna and Max, once ordinary cats roaming the streets of Willow Creek, found their destined path in the spotlight of the circus ring, leaving behind a legacy of a friendship that defied the ordinary and inspired the extraordinary in others.
</p>

<hr>

As you can tell, even if you only skimmed it, these are much more varied. I found having all these variations on screen at once, from the same prompt, a *real* easy way to help me understand the impact of temperature. If you want to try this yourself, you can grab the bits here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/temp_tester>

Download the code, `npm i` the required bits, and set an environment variable for your Google API key. Run the script (`node script.js`) and it will open up a web server on port 3000. Lastly, just open that up with your browser.

As always, let me know what you think. I've got some ideas for other tools like this as a way of learning generative AI!