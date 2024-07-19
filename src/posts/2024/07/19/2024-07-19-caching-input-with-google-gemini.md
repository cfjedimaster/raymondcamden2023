---
layout: post
title: "Caching Input with Google Gemini"
date: "2024-07-19T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cats_cash.jpg
permalink: /2024/07/19/caching-input-with-google-gemini
description: How to add context caching for improved performance.
---

A little over a month ago, Google [announced](https://developers.googleblog.com/en/new-features-for-the-gemini-api-and-google-ai-studio/?linkId=10227854) multiple updates to their GenAI platform. I made a note of it for research later and finally got time to look at one aspect - [context caching](https://ai.google.dev/gemini-api/docs/caching).

When you send prompts to a GenAI system, your input is tokenized for analysis. While not a "one token per word" relation, basically the bigger the input (context) the more the cost (tokens). The process of converting your input into tokens takes time, especially when dealing with large media, for example, a video. Google introduced a "Context caching" system that helps improve the performance of your queries. As the [docs](https://ai.google.dev/gemini-api/docs/caching) suggest, this is really suited for cases where you've got a large initial input (a video, text file) and then follow up with multiple questions related to the content. 

At this time, speed improvements aren't really baked in, but cost improvements definitely are. If you imagine a prompt based on a video for example, your cost will be X let's say, where X is the token count of your text-based prompt and the video. For cached data and Gemini, the cost is instead: "Token count of your prompt, and a *reduced* charge for your cached content". Honestly, this was a bit hard to grok at first, but a big thank you to Vishal Dharmadhikari at Google for patiently explaining it to me. 

You can see current cost details here:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/gem_cache1.jpg" alt="Current prices" class="imgborder imgcenter" loading="lazy">
</p>

The docs do a good job of explaining how to use it, but I really wanted a demo I could run locally to see it in action, and to create a test where I could compare timings to see how much the cache helped. 

## Caveats

Again, this is documented, but honestly, I missed them both. 

* You must use a specific version of a model. In other words, not `gemini-1.5-pro` but rather `gemini-1.5-pro-001`. 
* Gemini has a free tier in which you can create a key in a project that has no credit card. This feature is **not available** in the free tier. I found the error message a bit hard to grok in that case. 

Ok, with that in mind, let's look at how it's used.

## Caching in Gemini

My code is modified slightly from the docs, but credit to Google for documenting this well. Before getting into code, a high-level look:

* First, you use the Files API to get your asset in Google's cloud. Note that this API changed from my [blog post](https://www.raymondcamden.com/2024/05/21/using-the-gemini-file-api-for-prompts-with-media) back in May.
* Second, you create a cache. This is very similar to creating a model.
* Third, you actually get the model using a special function that integrates with the cache.

After that, you can run prompts at will against the model.

Here's my code, and honestly, it is a bit messy, but hopefully understandable. 

Let's start with the imports:

```js
import {
  GoogleGenerativeAI
} from '@google/generative-ai';

import { FileState, GoogleAIFileManager, GoogleAICacheManager } from '@google/generative-ai/server';
```

Next, some constants. By the way, I'm not using `const` much anymore, so when you see it, it's just code I haven't bothered to change to `let`.

```js
const MODEL_NAME = 'models/gemini-1.5-pro-001';
const API_KEY = process.env.GEMINI_API_KEY;
const fileManager = new GoogleAIFileManager(API_KEY);
const cacheManager = new GoogleAICacheManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);
```

Next, I defined my system instructions. This will be used for both model objects I create in a bit.

```js
// System instructions used for both tests
let si = 'You are an English professor for middle school students and can provide help for students struggling to understand classical works of literature.';
```

Now my code handles uploading my content, in this case, a 755K text version of "Pride and Prejudice":

```js
async function uploadToGemini(path, mimeType) {
	const fileResult = await fileManager.uploadFile(path, {
		mimeType,
		displayName: path,
	});

	let file = await fileManager.getFile(fileResult.file.name);
	while(file.state === FileState.PROCESSING) {
		console.log('Waiting for file to finish processing');
		await new Promise(resolve => setTimeout(resolve, 2_000));
		file = await fileManager.getFile(fileResult.file.name);
	}

  return file;
}

// First, upload the book to Google 
let book = './pride_and_prejudice.txt';
let bookFile = await uploadToGemini(book, 'text/plain');
console.log(`${book} uploaded to Google.`);
```

At this point, we can create our cache:

```js
let cache = await cacheManager.create({
	model: MODEL_NAME, 
	displayName:'pride and prejudice', 
	systemInstruction:si,
	contents: [
		{
			role:'user',
			parts:[
				{
					fileData: {
						mimeType:bookFile.mimeType, 
						fileUri: bookFile.uri
					}
				}
			]
		}
	],
	ttlSeconds: 60 * 10 // ten minutes
});
```

Note that this is *very* similar to how you create a model normally. It's got the model name, system instructions, and a reference to the file. 

The cache object returned there is the only time you have access to the cache. There are APIs to [list, update, and delete](https://ai.google.dev/gemini-api/docs/caching?lang=node#list-caches) caches, but you can't get a reference once the script execution ends. 

To get the actual model you can run prompts on, you then do:

```js
let genModel = genAI.getGenerativeModelFromCachedContent(cache);
```

As an example:

```js
// used for both tests.
let contents = [
		{
			role:'user',
			parts: [
				{
					text:'Describe the major themes of this work and then list the major characters.'
				}
			]
		}
	];

let result = await genModel.generateContent({
	contents
});
```

And that's it really. I've got a complete script that demos this in action *and* it shows a comparison to a non-cached model. It reports on the timings, which again, at this point do not show the cached stuff being quicker, but it also reports the `usageMetadata` and that shows the impact of the cached token count against your total. Here's an example with the cache:

```
{
  promptTokenCount: 189940,
  candidatesTokenCount: 591,
  totalTokenCount: 190531,
  cachedContentTokenCount: 189925
}
with cache, duration is 52213

{
  promptTokenCount: 189935,
  candidatesTokenCount: 251,
  totalTokenCount: 190186,
  cachedContentTokenCount: 189925
}
with cache, second prompt, duration is 19117
```

And here's the report when the cache isn't used:

```
{
  promptTokenCount: 189939,
  candidatesTokenCount: 790,
  totalTokenCount: 190729
}
without cache, duration is 29005

{
  promptTokenCount: 189934,
  candidatesTokenCount: 181,
  totalTokenCount: 190115
}
without cache, second prompt, duration is 11707
```

Again, the timing above shows that with the cache, the timings were actually slower, but cost-wise, something like 99% of the cost is reduced. That's huge. If you want the complete script (and source book), you can find it here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/cache_test>