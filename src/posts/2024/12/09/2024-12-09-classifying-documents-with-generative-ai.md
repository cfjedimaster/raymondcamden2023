---
layout: post
title: "Classifying Documents with Generative AI"
date: "2024-12-09T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_files.jpg
permalink: /2024/12/09/classifying-documents-with-generative-ai
description: A look at using generative AI to help classify documents.
---

Generative AI and documents is a fairly common topic these days, typically in the form of creating summaries or asking questions about the documents. I was curious how generative AI could help in terms of classification. Way back in January of this year, I blogged about using Google's [Gemini API](https://ai.google.dev/) to classify images based on whether they were a photo, screenshot, or meme: ["Using GenAI to Classify an Image as a Photo, Screenshot, or Meme"](https://www.raymondcamden.com/2024/01/18/using-genai-to-classify-an-image-as-a-photo-screenshot-or-meme). That actually worked well and I thought perhaps it could work with text as well. Specifically:

* Your organization gets an influx of documents, lets say many per day...
* And you would like to categorize them for sorting/processing later

Before playing with this, I made a basic assumption, that being that while I thought generative AI could probably give a category to *anything*, it would probably work a heck of a lot better in cases where your inputs fall into a certain set list of categories. 

For example, a company's HR team could have resumes coming in with categories being useful for the types of jobs applicable to the candidate. Legal firms could categorize documents based on the type of case (real estate, marine law, etc). 

Given this assumption, I created a test. For my input, I decided to use Shakespeare plays, and while we probably won't see many more of those, it does lead itself to a simple classification:

* Comedies
* Tragedies
* Histories

Let's look at the code for how a classification system could be built.

## The Code

First, I'll begin with my imports. I'm still doing most of my GenAI work in Node.js, but obviously this could be done in Python, or any language with the REST API.

```js
import fs from 'fs'; 
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GoogleAIFileManager } from "@google/generative-ai/server";

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_API_KEY;
const fileManager = new GoogleAIFileManager(API_KEY);
```

One thing I'll note here is that I'm using Gemini 1.5 Pro, not Flash. With the assumption that this code is a backend process, we want the AI to take it's time, we aren't needing to rush a response back to a human.

Next, we'll define a JSON schema to tell Gemini how ot shape the response. Again, this is an automated process so JSON makes sense:

```js
const schema = `
{
  "type": "object",
  "properties": {
    "category": {
      "type": "string",
      "enum": [
        "comedy",
        "tragedy",
        "history"
      ]
    },
    "reasoning": {
      "type": "string"
    }
  }
}
`;
```

Note the use of an `enum` to restrict the results. I also asked for 'reasoning', thinking perhaps that it could be logged someplace for review later by a human. 

I follow the schema up with a system instruction:

```js
const si = `
You categorize an input play into one of three categories: 
Comedy, Tragedy, History. You also return your reasoning.
`;
```

And then create my model:

```js
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: MODEL_NAME, 
	systemInstruction: {
		parts: [{ text:si }],
		role:"model"
	},
	generationConfig: {
		responseMimeType:'application/json',
		responseSchema:JSON.parse(schema)
	} 
});
```

The final bit is the function itself:

```js
async function classifyDocument(path) {


	const uploadResult = await fileManager.uploadFile(path, {
		mimeType:'application/pdf',
	});
	const file = uploadResult.file;

	let prompt = 'Categorize this play.';

	const result = await model.generateContent([
		prompt, 
		{
			fileData: {
				fileUri:file.uri, 
				mimeType:'application/pdf'
			}
		}
	]);

	try {

		if(result.response.promptFeedback && result.response.promptFeedback.blockReason) {

			return { error: `Blocked for ${result.response.promptFeedback.blockReason}` };
		}
		return result.response.candidates[0].content.parts[0].text;
	} catch(e) {
		// better handling
		return {
			error:e.message
		}
	}
	
}
```

It uses the Gemini Files API to upload the document (and assumes it is a PDF, but you could make it more generic) and then runs the simple prompt on the document. That's literally it. 

For a test, I whipped up a run on 3 plays:

```js
(async () => {

	let files = fs.readdirSync('./').filter(f => f.endsWith('.pdf'));

	for(let f of files) {
		console.log(`Analyze ${f}`);
		let result = await classifyDocument(f);
		console.log(result);

		// for rate limiting
		await delay(30 * 1000);
	}

})();
```

My 3 PDFs were "A Midsummer Night's Dream", "Romeo and Juliet", and "Henry IV - Part 1". 

Here's what I got back for "A Midsummer Night's Dream" (I added some line breaks in the reasoning for easier reading:

```json
{
"category": "comedy", 
"reasoning": "A Midsummer Night's Dream is one of Shakespeare's 
most famous comedies. The play features fairies, mistaken 
identities, and love triangles. Its light tone and happy ending
solidify its categorization as a comedy."
}
```

Here's what I got for "Romeo and Juliet":

```json
{
"category": "tragedy", 
"reasoning": "Romeo and Juliet is classified as a tragedy due
to the deaths of the main characters. The play explores themes
of love, hate, fate, and family conflict, ultimately leading
to a tragic conclusion."
}
```

And finally, "Henry IV - Part 1":

```json
{
"category": "history", 
"reasoning": "Henry IV Part 1 is one of Shakespeare's history plays, 
dramatizing the reign of King Henry IV. Although fictionalized, 
it depicts real historical figures and events in 15th-century 
England during the king's reign."
}
```

If you would like the complete code for this demo, you may find it here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/doc_classification> As always, I'm interested in what you've done in this space, so leave me a comment below!