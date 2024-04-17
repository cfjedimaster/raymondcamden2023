---
layout: post
title: "JSON Results with Google Gemini Generative AI API Calls"
date: "2024-04-17T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_writing_laptop.jpg
permalink: /2024/04/17/json-results-with-google-gemini-generative-ai-api-calls
description: A look at generating JSON responses with Google Gemini.
---

Forgive the somewhat alliterative title there, but today's post covers something that's been on my mind since I started playing with [Google Gemini](https://gemini.google.com), specifically, how to get the results of your API calls in JSON. To be clear, the REST API returns a result in JSON, but I'm talking about the *content* of the result itself. Before I continue, a quick shot out to [Allen Firstenberg](https://prisoner.com/) who has been helping me off and on with Google Gemini stuff. Anything I get wrong though is entirely my fault. 😜

Ok, so before I go on, let's look at a typical result. Take a prompt like so: "What is the nature of light". Pass this to Gemini via the API, and the result you get, once you dig down a bit from the full result which includes various bits of metadata and any safety values, looks like so:

<script src="https://gist.github.com/cfjedimaster/b235476ced0e7d381d96a1817b0545b4.js"></script>

Notice it uses Markdown to format the result. If we wanted JSON, one thing we could try is to ask for it specifically. Here's a new version of the prompt: "What is the nature of light? Your answer should be in valid JSON which includes an `answer` key with the value being your answer."

And this returns:

<script src="https://gist.github.com/cfjedimaster/8361fe731248b50f6ceb620f03779567.js"></script>

It looks like JSON, but it's a) still wrapped in Markdown code and b), well, not valid JSON as the newlines would break parsing. You could use a bit of code to fix this, but, what if we didn't have to?

## Method One - Response Type

Let's first look at the fact that, at the top level, Gemini is returning Markdown, period, for every call, even when it attempts to format the results *inside* the Markdown. There is a way to stop that now when generating the result by using the `response_mime_type` argument. This is mentioned in the docs in [JSON format responses](https://ai.google.dev/docs/gemini_api_overview#json) and looks like so, in Node.js:

```js
const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME } , { apiVersion:'v1beta' });

const generationConfig = {
	temperature: 0.9,
	topK: 1,
	topP: 1,
	maxOutputTokens: 2048,
	response_mime_type:'text/plain'
};

const safetySettings = [
	{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
	{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,	threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
	{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
	{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
];

const parts = [
	{text:'Prompt here'},
];

const result = await model.generateContent({
	contents: [
		{ role: "user", parts }
		],
	generationConfig,
	safetySettings,
});
```

That's a lot of code, but look in `generationConfig` where I've specified it. Switching that to `application/json` will reformat the result. To test, I built a wrapper function that took the prompt and mime type as arguments:

```js
async function callGemini(text, mimeType="text/plain") {

	const generationConfig = {
		temperature: 0.9,
		topK: 1,
		topP: 1,
		maxOutputTokens: 2048,
		response_mime_type:mimeType
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
		contents: [
			{ role: "user", parts }
			],
		generationConfig,
		safetySettings,
	});

	try {

		if(result.response.promptFeedback && result.response.promptFeedback.blockReason) {

			return { error: `Blocked for ${result.response.promptFeedback.blockReason}` };
		}
		const response = result.response;
		return { response };
	} catch(e) {

		return {
			error:e.message
		}
	}
	
}
```

And then tested twice with the simpler prompt:

```js
let result = await callGemini('What is the nature of light');

// and...

result = await callGemini('What is the nature of light','application/json');
```

Here's how the JSON response looked:

```json
[
  "Light can be described both as a wave and as a particle. This is known as the wave-particle duality of light."
]
```

Notice that it is an array of strings, in this case one. I rewrote my prompt to test something:

```js
result = await callGemini('What is the nature of light? Answer in five to ten sentences.','application/json');
```

And this gave:

```json
[
 "Light exhibits a dual nature, behaving both as a wave and as a stream of particles called photons.",
 "As a wave, light can diffract, interfere, and polarize, demonstrating properties like wavelength and frequency.",
 "The wavelength of light determines its color, with shorter wavelengths corresponding to bluer light and longer wavelengths to redder light.",
 "As particles, photons carry discrete amounts of energy, and their interactions with matter can cause phenomena like the photoelectric effect.",
 "The speed of light in a vacuum is a fundamental constant of nature, approximately 299,792 kilometers per second.",
 "Light plays a crucial role in our understanding of the universe, enabling us to observe distant stars and galaxies, and is essential for many technologies, including lasers, fiber optics, and photography."
]
```

One array element per sentence. But, it's valid JSON though. If we simply wanted to print this, a quick `join` would give us a paragraph. 

Ok, but what about getting an actual JSON object as a result? Enter system instructions.

## Method Two - System Instructions for the Win

The next part of the puzzle is [system instructions](https://ai.google.dev/docs/system_instructions/?utm_source=gais&utm_medium=email&utm_campaign=geminipp). These are ways of telling Gemini how it should respond. Now, this has already been possible with a basic prompt. For example, consider this prompt:

"Explain how light works as if you are a hyperactive teenager who loves the Marvel movies."

See how I ask a question, *and* direct how I want my response? This gives:

<div style="background-color:#c0c0c0;padding:10px">
OMG, like, have you ever thought about light? It's totally wild!  It's like Ant-Man shrinking down and surfing on electromagnetic waves or something!  Light is made up of these super tiny things called photons, and they're, like, the Flash of the universe – they travel SO fast!  Nothing can beat them!  

So basically, photons zoom out of stuff like the sun, light bulbs, or even your phone screen, and they bounce off everything!  That's how we see stuff – the photons bounce off an object, say, Captain America's shield, and then bam! They hit our eyes and our brains are like, "whoa, that's a sweet shield!" 

And get this – light can act like a wave AND a particle at the same time! It's like, quantum physics or something, super complicated but crazy cool!  So, like, light can diffract and interfere with itself, like when you see a rainbow. It's basically light waves doing a synchronized swimming routine or something! 

And there are different kinds of light, too, like the visible spectrum – that's all the colors of the rainbow, ROYGBIV!  But there's also, like, ultraviolet light, which is what gives you a sunburn if you're not careful, and infrared light, which is basically heat vision!  So next time you're out in the sun, just remember, you're being bombarded by tiny little photon superheroes, and they're the reason you can see all the awesome stuff around you!  It's like having superpowers, but for your eyes!  🤯🤯🤯 
</div>

From what I understand, while this works, it would require you to take user input and add that bit about how to answer at the end. System instructions remove that by adding the context outside of the prompt.  

To use system instructions with the Node SDK, you specify it when generating your model object:

```js
const model = genAI.getGenerativeModel({ model: MODEL_NAME,
	systemInstruction: {
		parts: [{ text:"System instruction here." }],
		role:"model"
	} } , { apiVersion:'v1beta' });
```

When calls to generate content are made against this model, it will use the system instructions to format the response. For fun, consider this example:

```js
const si = "You are a bot that answers questions at a high school level, but you are also a cat.";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME,
	systemInstruction: {
		parts: [{ text:si }],
		role:"model"
	} } , { apiVersion:'v1beta' });
```

Now when I ask it to explain the nature of light, I get:

```
Meow. Light be not a thing, but a happening.  The sun, and stars, and fireflies, and also light bulbs, do make tiny particles called photons.  These photons zoom about super fast and bounce off things.  When they hit your eyes, you see!

Do you want to hear about the time I chased a laser pointer?  It was the reddest dot!  I could never catch it.  But it was fun to try! Purr. 
```

Purrfect. Ok, but how about a more serious example? Consider this:

```js
const si = `
You are an expert in comic book history and return suggested comics based on a user's desired kind of story. 

Your response must be a JSON object containing four to five comic books. Each comic book object has the following schema:

* name: Name of the comic book or series
* publisher: The publisher of the comic book
* reason: A brief reason for why the user would like this book
`;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME,
	systemInstruction: {
		parts: [{ text:si }],
		role:"model"
	} } , { apiVersion:'v1beta' });
```

I gave the model a persona as well as a definition for how to return the result. I then tried this prompt: "I like stories that are science fiction and have strong female characters.". This gave me:

<script src="https://gist.github.com/cfjedimaster/7bf367870d8a1c3dfbd138e1b4ad9460.js"></script>

Oops! Still Markdown, but the JSON is perfect. So what's the next step? Combine them!

## Method Three - All of the Above

In order to get JSON, in JSON, the best bet seems to be specifying the response type **and** using system instructions. Here's a script that shows this in action:

```js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_API_KEY;

const si = `
You are an expert in comic book history and return suggested comics based on a user's desired kind of story. 

Your response must be a JSON object containing four to five comic books. Each comic book object has the following schema:

* name: Name of the comic book or series
* publisher: The publisher of the comic book
* reason: A brief reason for why the user would like this book
`;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME,
	systemInstruction: {
		parts: [{ text:si }],
		role:"model"
	} } , { apiVersion:'v1beta' });

async function callGemini(text) {

	const generationConfig = {
		temperature: 0.9,
		topK: 1,
		topP: 1,
		maxOutputTokens: 2048,
		response_mime_type:'application/json'
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
		const response = result.response;
		return { response };
	} catch(e) {

		return {
			error:e.message
		}
	}
	
}

let result = await callGemini('I like stories that are science fiction and have strong female characters.');

console.log(result.response.candidates[0].content.parts[0].text);
```

And the result:

```json
[
  {
    "name":"Saga",
    "publisher":"Image Comics",
    "reason":"Saga features a sprawling space opera with a diverse cast of characters, including many complex and well-developed women"
  },
  {
    "name":"Y: The Last Man",
    "publisher":"Vertigo",
    "reason":"Y: The Last Man explores a post-apocalyptic world where Yorick Brown and his pet monkey Ampersand are the only surviving males on Earth."
  },
  {
    "name":"Paper Girls",
    "publisher":"Image Comics",
    "reason":"Paper Girls follows a group of young girls who deliver newspapers in the 1980s and find themselves caught in a time-traveling conflict."
  },
  {
    "name":"Bitch Planet",
    "publisher":"Image Comics",
    "reason":"Bitch Planet is a feminist science fiction comic set in a dystopian future where non-compliant women are sent to a prison planet."
  }
]
```

All in all, this seems to work well and I really like how I can separate out the system instructions from the prompt itself. If you want to look at all my test scripts, you can find them here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/gemini_json>. Let me know what you think and leave me a comment below.