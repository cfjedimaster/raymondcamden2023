---
layout: post
title: "Using Generative AI to Improve Image Filenames"
date: "2024-01-26T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/cat_photo_box.jpg
permalink: /2024/01/26/using-generative-ai-to-improve-image-filenames
description: Can AI help us provide better filenames for images?
---

Last night I had an interesting thought. Many times I work with images that have vague filenames. For example, `screenshot_1_24_12_23.jpg`. Given that there are many APIs out there that can look at an image and provide a summary, what if we could use that to provide a better file name based on the content of the image? Here's what I was able to find.

As always, I began by prototyping in [Google AI Studio](https://makersuite.google.com/). I apologize for stating this in basically every post on the topic, but I really want to stress how useful that is for development. 

I used a very simple prompt:

```
Write a one sentence short summary of this image. The sentence 
should be no more than five words.
````

And then did a quick test:

<p>
<img src="https://static.raymondcamden.com/images/2024/01/ir1.jpg" alt="Prompt on image of a cake being correctly recognized." class="imgborder imgcenter" loading="lazy">
</p>

If it's a bit hard to read in the screenshot, the result was: 

```
A Mardi Gras king cake.
```

Which is absolutely perfect. So, I took the code from this prompt and whipped up the following script:

```js
import fs from 'fs/promises';
import 'dotenv/config';
import slugify from '@sindresorhus/slugify';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const MODEL_NAME = "gemini-pro-vision";
const API_KEY = process.env.GOOGLE_AI_KEY;

const SOURCE = './source/';
const OUTPUT = './output/';


async function getImageSummary(path) {
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

  // ToDo potentially - make mimeType actually check the image type
  const parts = [
    {text: "Write a one sentence short summary of this image. The sentence should be no more than five words.\n\n"},
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: Buffer.from(await fs.readFile(path)).toString("base64")
      }
    },
    {text: "\n"},
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  // This assumes a good response. Never assume.
  return result.response.candidates[0].content.parts[0].text.trim();
}


const files = await fs.readdir(SOURCE);
for(let file of files) {
	console.log(`Processing ${file}`);
	let result = await getImageSummary(SOURCE + file);
	// again, assumes jpg
	let newname = OUTPUT + slugify(result) + '.jpg';
	console.log(`Copying to ${newname}`);
	await fs.copyFile(SOURCE + file, newname);
}

console.log('Done');
```

The main part is the `getImageSummary` function which is a modified version of the code AI Studio output. As you can see, I do kinda assume `.jpg` only, which isn't great, and I don't handle errors at all, but for a quick test, it's fine.

After the function, I basically list the files from a source directory, get the summary, and use the excellent `@sindresorhus/slugify` package to translate the sentence into a slug for use in renaming. Now, one thing to keep in mind is that if you run this script multiple times, you will get multiple results with slightly different summaries. You could wipe the output directory before running perhaps.

So how well did it work?

## Sample Images

I tested with these five images. Below each image you can see their original filename and how they were renamed. 

<p>
<img src="https://static.raymondcamden.com/images/2024/01/20240107_120237.jpg" alt="Picture 1" class="imgborder imgcenter" loading="lazy">
<figcaption>20240107_120237.jpg to an-nfl-game-between-the-saints-and-the-falcons.jpg</figcaption>
</p>

<p>
<img src="https://static.raymondcamden.com/images/2024/01/20240108_152420.jpg" alt="Picture 2" class="imgborder imgcenter" loading="lazy">
<figcaption>20240108_152420.jpg to cat-interrupts-work-day.jpg</figcaption>
</p>

<p>
<img src="https://static.raymondcamden.com/images/2024/01/20240113_193655.jpg" alt="Picture 3" class="imgborder imgcenter" loading="lazy">
<figcaption>20240113_193655.jpg to a-small-cake-with-yellow-frosting.jpg</figcaption>
</p>

<p>
<img src="https://static.raymondcamden.com/images/2024/01/20240120_170218.jpg" alt="Picture 4" class="imgborder imgcenter" loading="lazy">
<figcaption>20240120_170218.jpg to cat-sits-in-a-box.jpg</figcaption>
</p>

<p>
<img src="https://static.raymondcamden.com/images/2024/01/20240122_184642.jpg" alt="Picture 5" class="imgborder imgcenter" loading="lazy">
<figcaption>20240122_184642.jpg to a-mardi-gras-king-cake.jpg</figcaption>
</p>

Honestly, these feel perfect. I will say the "cat-interrupts-work-day" one is... perhaps a bit more funny than practical. I think that would be a fair criticism, but in general, this worked *incredibly* well.

If you want the full source code with the images as well, you can grab it here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/rename_images>

Let me know what you think in the comments below.