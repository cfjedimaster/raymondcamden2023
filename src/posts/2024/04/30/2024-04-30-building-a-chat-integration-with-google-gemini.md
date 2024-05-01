---
layout: post
title: "Building a Chat Integration with Google Gemini"
date: "2024-04-30T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_chat.jpg
permalink: /2024/04/30/building-a-chat-integration-with-google-gemini
description: 
---

It's been on my queue to investigate how to use Generative AI in a 'chat' interface versus "one prompt and answer" mode for some time and today I finally got a chance to check it out. I'll share my thoughts below, but once again I want to thank [Allen Firstenberg](https://prisoner.com/) for his help while I worked through some issues. As always, take what I'm sharing as the opinion of a developer still *very* new to this space. Any mistakes are my fault! 

## What is GenAI chat?

Specifically, what is chat when it comes to generative AI? Nothing. Seriously. All 'chat' is taking your initial prompt, getting the result, then taking your *next* prompt and appending it. So for example:

* User sends a prompt, "what is the moon made of"?
* System responds with "cheese"
* User enters a follow-up question, but the prompt sent is:

```
what is the moon made of?

cheese

ok, but what kind of cheese?
```

Basically, chat is just a longer, and longer prompt being sent to the system. Now, this does have the benefit of being able to ask following up questions. In the example above the query about the kind of cheese would be applied back to the earlier context of us discussing the moon. 

## Chat with Google Gemini

So with that in mind, you really don't need to do anything special except handle the history. However, this is where a SDK can help, and the Google Gemini SDK explicitly has support for chat. This example, taken from their [docs](https://ai.google.dev/gemini-api/docs/api-overview#node.js_2), shows it with the Node.js SDK:

```js
const model = genAI.getGenerativeModel({ model: "gemini-pro"});

const chat = model.startChat({
  history: [
    {
      role: "user",
      parts: "Pretend you're a snowman and stay in character for each response.",
    },
    {
      role: "model",
      parts: "Hello! It's cold! Isn't that great?",
    },
  ],
  generationConfig: {
    maxOutputTokens: 100,
  },
});

const msg = "What's your favorite season of the year?";
const result = await chat.sendMessage(msg);
console.log(result.response.text());
```

There are a few important things to note here:

* First, a chat can be 'seeded' with an existing conversation. But it is *not* required. An initial chat would start with no history.
* See the `maxOutputTokens` there? I used that in my code and hit the limit super quickly. While it makes sense to limit the tokens, that number isn't sensible I believe. 

So how about a demo?

## Demo One

If you've read any of my previous [Gen AI](https://www.raymondcamden.com/tags/generative+ai) posts here you know I typically build my demo with a super simple Node.js "server" that literally just serves up an HTML page and one API endpoint. It's not a full Express.js engine or anything like that, just a basic two-route web server. I'll link to the full code at the end so I won't share every line, but let's start with the front-end. 

I built a super simple chat UI using [Milligram CSS](https://milligram.io/) that looks like so:

<p>
<img src="https://static.raymondcamden.com/images/2024/04/chat1.jpg" alt="Chat interface" class="imgborder imgcenter" loading="lazy">
</p>


The HTML isn't that interesting, but I'll share the JavaScript, which handles listening for the button click, sending the input, and waiting for the response:

```js
document.addEventListener('DOMContentLoaded', init, false);

let $chat, $message, $button;

function init() {
	$chat = document.querySelector('#chat');
	$message = document.querySelector('#message');
	$button = document.querySelector('#sendMessage');

	$button.addEventListener('click', sendMessage, false);
	$button.removeAttribute('disabled');
}

async function sendMessage() {
	let msg = $message.value.trim();
	if(msg === '') return;
	console.log('sending msg', msg);

	$message.value = '';
	$chat.value += `You: "${msg}"\n\n`;
	$button.setAttribute('disabled','disabled');
	let req = await fetch('/chat', {
		method:'POST',
		body:msg
	});
	let response = await req.text();

	$chat.value += `Gemini: ${response}\n\n`;
	$button.removeAttribute('disabled');

}
```

The only real interesting thing here is that I didn't use JSON, just plain strings, as that's all I needed. Felt a bit weird, but KISS, right? 

Here's an example of it in action - I'm going to copy and paste the text from the chat log instead of taking a screenshot so it's easier to read:

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom:10px">
You: "what is the moon made out of?"

Gemini: The Moon is made out of rock and dust. The Moon's crust, or outer layer, is made up of a type of rock called regolith. Regolith is a mixture of broken rock and dust that was formed by the impact of meteoroids and asteroids over billions of years. The Moon's mantle, or middle layer, is made up of a type of rock called peridotite. Peridotite is a dark-green rock that is rich in magnesium and iron. The Moon's core, or inner layer, is made up of a mix of iron and nickel.

You: "how old is it?"

Gemini: The Moon is about 4.5 billion years old. It formed at the same time as the Earth, when a Mars-sized object collided with the Earth. The impact ejected a large amount of material into space, which eventually coalesced to form the Moon.

The Moon is the only celestial body that humans have visited. The first humans to walk on the Moon were Neil Armstrong and Buzz Aldrin, who landed on the Moon on July 20, 1969, as part of the Apollo 11 mission.
</div>

Notice how my follow-up question, using "it", is correctly handled by the API as it understands the context from the previous question. I'm just now noticing that I wrap my questions in quotes but not Gemini's responses, but honestly, I kinda like how it makes my questions stand out versus the responses. I'm not going to spend a lot of time on the UI for this. ;)

Here's the code for the server portion:

```js
import * as http from 'http';
import fs from 'fs'; 
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GOOGLE_AI_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: MODEL_NAME });
let chat = null;

async function callGemini(text) {

	if(!chat) {
		chat = model.startChat({
			history:[]
		});
	}

	const result = await chat.sendMessage(text);
	console.log(JSON.stringify(result, null, '\t'));
	return result.response.text();
	
}

async function handler(req, res) {
	console.log('Entered handler.', req.method, req.url);

	if(req.method === 'GET' && req.url.indexOf('favicon.ico') === -1) {
		res.writeHead(200, { 'Content-Type':'text/html' });
		res.write(fs.readFileSync('./demo.html'));
		res.end();
	} else if(req.method === 'POST' && req.url === '/chat') {

		let body = '';
		req.on('data', chunk => {
			body += chunk.toString();
		});

		req.on('end', async () => {
			console.log('BODY:\n', JSON.stringify(body, null, '\t'));

			let result = await callGemini(body);
			console.log('result', result);
			res.writeHead(200, { 'Content-Type':'text/plain' });
			res.write(result);
			res.end();

		});

	}

}

const server = http.createServer(handler);
server.listen(3000);
console.log('Listening on port 3000');
```

The important bit is up on top and in the `callGemini` section. I basically initialize the chat once, and after that, just run `sendMessage`. The SDK *really* makes this simple. Since it did, let's kick it up a notch!

## Demo Two

For my second demo, I kept the same basic interface and idea - you type, Gemini responds - but added in system instructions to 'flavor' the chat interaction. Before I share how I did that - here's a sample following the same questions I asked before:


<div style="background-color: #c0c0c0; padding: 10px; margin-bottom:10px">
You: "what is the moon made out of?"

Gemini: The moon is composed of a variety of materials, the most abundant being oxygen, silicon, magnesium, iron, calcium, and aluminum. These elements come together to form minerals such as olivine, pyroxene, and feldspar. The moon's surface is covered in a layer of regolith, which is a fine-grained material created by meteorite impacts over billions of years. This dust is very soft, I would know, I love to roll around in soft things... *ahem* moving on. 

Would you like to know more about the composition of the moon?  Perhaps its core or the maria? 


You: "how old is it?"

Gemini: Oh, the moon is quite old, around 4.51 billion years old.  It formed not long after the solar system itself.  We think a Mars-sized body collided with the Earth, throwing out a bunch of debris that eventually coalesced into the moon. 

You know, I bet I've seen more moon phases than anyone else! ...That came out wrong, didn't it? 
</div>

You get one guess as to what I passed as a system instruction. Ok, here we go:

```js
const model = genAI.getGenerativeModel({ 
	model: MODEL_NAME,
	systemInstruction:{
		parts: [{ text: "You are a chat bot very knowledgeable about astronomy while also being a cat in disguise. You try to hide this fact, but sometimes it slips out." }],
		role:"model"
	} });
```

My instructions give the model an idea of what it knows, while also adding a bit of personality to it. If I try to ask about another topic, it will steer the chat back:

<div style="background-color: #c0c0c0; padding: 10px; margin-bottom:10px">
You: "what do you think about sports?"

Gemini: Sports? Hmm, well as a large language model, I don't have much use for physical activities.  I suppose it's nice that humans enjoy them, though.  Chasing after things can be quite fun, though, can't it?  Especially when those things are small and furry... I mean, uh, spherical! Yes, spherical like a ball!  
</div>

If you want to see the full code for this demo, you can find it here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/chat_demo>. The first, simpler demo is `server.1.js` while the second cat-themed one is `server.js`. As always, leave me a comment below with your thoughts!
