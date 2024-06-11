---
layout: post
title: "Using JSON Schema with Google Gemini"
date: "2024-06-11T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_diagram.jpg
permalink: /2024/06/11/using-json-schema-with-google-gemini
description: How JSON Schema helps shape GenAI results with Google Gemini.
---

Back about a month ago, I wrote up a post on how to generate JSON results using [Google Gemini](https://gemini.google.com/), ["JSON Results with Google Gemini Generative AI API Calls"](https://www.raymondcamden.com/2024/04/17/json-results-with-google-gemini-generative-ai-api-calls). While you should read that post first, the process basically boiled down to:

* Setting the response type of the result to JSON. Without this, Gemini will return JSON but encoded in Markdown.
* Using a System Instruction to give directions on the "shape" of the JSON, i.e., use this key and that key.

While these techniques work well, recently yet another feature was added that makes this even better, JSON schema support. JSON Schema is an abstract way to define the shape of JSON and can be really useful in validation. The [website](https://json-schema.org/) provides examples and documentation of how to build your schema. It can be used to define the shape of JSON results as well as signify property types and what is required versus what is optional. Note that this feature is *not* available in Flash models, only Pro.

It can be somewhat gnarly. For example, here's the schema that defines the JSON results from the [Adobe PDF Extract API](https://developer.adobe.com/document-services/apis/pdf-extract/): <https://developer.adobe.com/document-services/docs/extractJSONOutputSchema2.json>

What's nice though is that while a text description of a JSON result is nice, a *schema* description should be even more precise in terms of directing Gemini. The [docs](https://ai.google.dev/gemini-api/docs/api-overview#json) provide a Python example, but let's consider how this could be done in Node.

First, remember the [last demo](https://www.raymondcamden.com/2024/04/17/json-results-with-google-gemini-generative-ai-api-calls) in my earlier blog post showed a "comic book recommendation" agent and used a system instruction to shape the results:

```
You are an expert in comic book history and return suggested comics 
based on a user's desired kind of story. 

Your response must be a JSON object containing four to five comic 
books. Each comic book object has the following schema:

* name: Name of the comic book or series
* publisher: The publisher of the comic book
* reason: A brief reason for why the user would like this book
```

The first thing we'll do is simply the instructions:

```
You are an expert in comic book history and return suggested comics 
based on a user's desired kind of story. 
```

Next, I'll define a JSON schema for the results:

```js
const schema = `
{
  "description": "A list of comic book recommendations",
  "type": "array",
  "items": {
	"type":"object",
	"properties": {
		"name": {
			"type":"string"
		},
		"publisher": {
			"type":"string"
		},
		"reason": {
			"type":"string"
		}
	},
	"required": ["name","publisher","reason"]
  }
}
`;
```

This matches what I had in the previous version, although it doesn't limit the results and I'm fine with that. I could add that back in the system instructions if necessary. 

The last step is actually using it, which can be done using the `generationConfig` object:

```js
const generationConfig = {
	temperature: 0.9,
	topK: 1,
	topP: 1,
	maxOutputTokens: 2048,
	responseMimeType:'application/json',
	responseSchema:JSON.parse(schema)
};
```

Do note that I actually parse the JSON schema before sending it, which feels a bit silly as the SDK is just going to stringify it anyway. Putting it all together, here's a complete rewrite of that previous demo that now uses the schema:

```js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_API_KEY;

const schema = `
{
  "description": "A list of comic book recommendations",
  "type": "array",
  "items": {
	"type":"object",
	"properties": {
		"name": {
			"type":"string"
		},
		"publisher": {
			"type":"string"
		},
		"reason": {
			"type":"string"
		}
	},
	"required": ["name","publisher","reason"]
  }
}
`;


const si = `
You are an expert in comic book history and return suggested comics based on a user's desired kind of story. 
`;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME,
	systemInstruction: {
		parts: [{ text:si }],
		role:"model"
	} });

async function callGemini(text) {

	const generationConfig = {
		temperature: 0.9,
		topK: 1,
		topP: 1,
		maxOutputTokens: 2048,
		responseMimeType:'application/json',
		responseSchema:JSON.parse(schema)
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

let result = await callGemini('I like stories that are fantasy and involve cats.');

let text = result.response.candidates[0].content.parts[0].text;
console.log(JSON.stringify(JSON.parse(text),null,'\t'));
```

The results are pretty much the same as before. Note that I changed the prompt to ask about fantasy stories involving cats.

```json
[
        {
                "name": "Saga",
                "publisher": "Image Comics",
                "reason": "While not explicitly about cats, features the cutest, most helpful feline companion, Lying Cat."
        },
        {
                "name": "Blacksad",
                "publisher": "Dark Horse Comics",
                "reason": "A film noir detective story with anthropomorphic animal characters - the protagonist is a cat."
        },
        {
                "name": "Princeless",
                "publisher": "Action Lab Entertainment",
                "reason": "Features a princess who teams up with a dragon to save her other sister - but the dragon is actually a big cat-like creature."
        },
        {
                "name": "Catwoman",
                "publisher": "DC Comics",
                "reason": "A morally gray cat burglar, typically depicted as an antihero in Batman's stories."
        }
]
```

By the way, that first recommendation is absolutely spot on. You can find the complete source here: <https://github.com/cfjedimaster/ai-testingzone/blob/main/gemini_json/test_system_instructions_4.js>

## Building an API with the API

For fun, I wondered if it would be possible to use the Gemini API to build... an API. A few days ago my stepson asked a Google Home device about the "animal of the day", which was apparently something it supported because it (sadly) responded saying it no longer had that feature. I was curious if I could recreate this in Gemini.

I began with this schema and system instruction:

```js
const schema = `
{
  "description": "An animal.",
  "type": "object",
	"properties": {
		"name": {
			"type":"string"
		},
		"description": {
			"type":"string"
		},
		"link": {
			"type":"string"
		}
	},
	"required": ["name","description","link"]
}
`;


const si = `
You are an API meant to help young learners discover new animals. You return the name of a random animal, a 
one sentence description of the animal and a link to the Wikipedia page on the animal.
`;
```

I'm defining the JSON to support three keys in a basic object - `name`, `description`, and `link`. I then updated my function to use a hard-coded prompt:

```js
async function callGemini() {

	const generationConfig = {
		temperature: 0.9,
		topK: 1,
		topP: 1,
		maxOutputTokens: 2048,
		responseMimeType:'application/json',
		responseSchema:JSON.parse(schema)
	};

	const safetySettings = [
		{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,	threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
	];

	const parts = [
    	{text:'Give me a random animal please.'},
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
```

And the results look like so (I ran it a few times):

```json
{
        "description": "The Greenland shark is a large shark species native to the waters of the North Atlantic Ocean and Arctic Ocean, spending most of its time in very deep waters in temperatures of 1 to 12 \"\"",
        "link": "https://en.wikipedia.org/wiki/Greenland_shark",
        "name": "Greenland shark"
}
```

```json
{
        "description": "Often called the 'King of the Jungle,' the lion is a large cat known for its distinctive mane in males and its powerful roar.",
        "link": "https://en.wikipedia.org/wiki/Lion",
        "name": "Lion"
}
```

You can find the complete source here: <https://github.com/cfjedimaster/ai-testingzone/blob/main/gemini_json/test_system_instructions_5.js>

Obviously, it wouldn't (probably) be cost-effective to build an API like this, but it's a possible solution. As always, let me know what you think by leaving me a comment below. 