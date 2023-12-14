---
layout: post
title: "Google Gemini and AI Studio Launch"
date: "2023-12-14T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/cat_gemini.jpg
permalink: /2023/12/14/google-gemini-and-ai-studio-launch
description: A look at Google's update to the Generative AI and API offerings.
---

While it feels like just yesterday I first [blogged](https://www.raymondcamden.com/2023/10/12/a-look-at-googles-palm-api) about Google's PaLM APIs and MakerSuite, it was actually over two months ago, and of course, GenAI offerings are iterating and improving at lightning speed. In the past week, Google has announced [Gemini](https://deepmind.google/technologies/gemini/#introduction), their new generative AI model. Naturally, I was curious about the API aspect of this and took a quick look. 

## MakerSuite rebranded as AI Studio

First off, the web UI (which I reviewed back in my [first post](https://www.raymondcamden.com/2023/10/12/a-look-at-googles-palm-api)) has been renamed to the generic and boring, but probably more enterprise and appropriate, AI Studio. Along with that, when creating new prompts, it will default to use Gemini models. (You can still select PaLM if you want.) 

Another change... and I have to be honest, I don't know if this worked before or not, but you can now easily add images to your prompt. I'm pretty sure this is new as it's called out in the UI:

<p>
<img src="https://static.raymondcamden.com/images/2023/12/gem1.jpg" alt="UI showing Insert Image" class="imgborder imgcenter" loading="lazy">
</p>

You can paste in an image as well, but doing so will prompt you to change the model on the right from "Gemini Pro" to "Gemini Pro Vision". After that, you can just paste which is handy. As a test, I typed:

```
What kind of cat is in this picture?
```

And pasted in this picture:

<p>
<img src="https://static.raymondcamden.com/images/2023/12/gem2.jpg" alt="Cat laying next to a laptop and mouse" class="imgborder imgcenter" loading="lazy">
</p>

And got this result:

```
The cat in the picture is a Ragdoll. Ragdolls are a large breed of cat that
is known for its docile temperament and beautiful blue eyes. They are also 
known for being very affectionate and loyal to their owners. Ragdolls are 
typically pointed, meaning that they have darker fur on their faces, ears,
and tails.
``` 

In my testing, I did some more iterations on the prompt but didn't need to re-upload or paste the image which made it really handy for trying things out. 

## The Code 

I was curious about the code and as before, that's one click away. Here's the default code you get if you select JavaScript:

```js
// node --version # Should be >= 18
// npm install @google/generative-ai

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require("fs");

const MODEL_NAME = "gemini-pro-vision";
const API_KEY = "YOUR_API_KEY";

async function run() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.4,
    topK: 32,
    topP: 1,
    maxOutputTokens: 4096,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  if (!fs.existsSync("image0.jpeg")) {
    throw new Error("Could not find images in current directory.");
  }

  const parts = [
    {text: "What kind of cat is in this picture? "},
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: Buffer.from(fs.readFileSync("image0.jpeg")).toString("base64")
      }
    },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  console.log(response.text());
}

run();
```

If you compare this to the code previously generated (look at the sample in my [earlier post](https://www.raymondcamden.com/2023/10/12/a-look-at-googles-palm-api)), you can see it's "similar", but definitely been tweaked quite a bit. The npm module has changed to `@google/generative-ai`. Also, you can see how `parts` is used for both the prompt and the attached picture. Without even looking at the SDK docs, this is pretty simple to grok.

I swapped out my initial picture with this one:

<p>
<img src="https://static.raymondcamden.com/images/2023/12/pig.jpg" alt="Picture of a cat on a box" class="imgborder imgcenter" loading="lazy">
</p>

And modified the code to run locally:

```js
// node --version # Should be >= 18
// npm install @google/generative-ai-node

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require("fs");

const MODEL_NAME = "gemini-pro-vision";
const API_KEY = process.env.GOOGLE_GEMINI_KEY;

async function run() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.4,
    topK: 32,
    topP: 1,
    maxOutputTokens: 4096,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  if (!fs.existsSync("/mnt/c/Users/ray/Desktop/pig.jpg")) {
    throw new Error("Could not find images in current directory.");
  }

  const parts = [
    {text: "What kind of cat is in this picture? "},
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: Buffer.from(fs.readFileSync("/mnt/c/Users/ray/Desktop/pig.jpg")).toString("base64")
      }
    },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  console.log(response.text());
}

run();
```

And the result worked well:

```
This is a Calico cat.
```

Nice, right? Again, and I said this in the first post, I am *so* incredibly happy with how quickly you can go from testing in the web tool to working code. I've got a plan for a few more posts in this area coming soon!