---
layout: post
title: "Using GenAI to Classify an Image as a Photo, Screenshot, or Meme"
date: "2024-01-18T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/photo_album.jpg
permalink: /2024/01/18/using-genai-to-classify-an-image-as-a-photo-screenshot-or-meme
description: GenAI can classify images as photos, screenshots, or memes with high accuracy.
---

File this under the "I wasn't sure if it would work and it did" category. Recently, a friend on Facebook wondered if there was some way to take a collection of photos and figure out which were 'real' photos versus memes. I thought it could possibly be a good exercise for GenAI and decided to take a shot at it. As usual, I opened up Google's [AI Studio](https://makersuite.google.com/) and did a few initial tests:

<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm1.jpg" alt="Screenshot from AI Studio" class="imgborder imgcenter" loading="lazy">
</p>

I then simply removed that image and pasted more info to test. From what I could see, it worked well enough. I then took the source code from AI Studio and began working.

## The Code

First, I grabbed some pictures from my collection, eleven of them, and tried to get a few photos, memes, and screenshots. To make it easier for me, after downloading them I renamed them so it would be quicker to see if it worked right. As I mentioned above, AI Studio gave me the code, but I modified it slightly so I could pass a directory of images:

```js
import fs from 'fs/promises';
import 'dotenv/config';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const MODEL_NAME = "gemini-pro-vision";
const API_KEY = process.env.GOOGLE_AI_KEY;


async function detectPhoto(path) {
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

  const parts = [
    {text: "Look at the following photo and tell me if it's a photo, a screenshot, or a meme. Answer with just one word.\n"},
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: Buffer.from(await fs.readFile(path)).toString("base64")
      }
    },
    {text: "\n\n"},
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  return response.text();
}

const root = './source_for_detector/';
let files = await fs.readdir(root);
for(const file of files) {
	console.log(`Check to see if ${file} is a photo, meme, or screenshot...`);
	let result = await detectPhoto(root + file);
	console.log(result);
}
```

It worked perfectly!

<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm2.jpg" alt="Terminal output from script" class="imgborder imgcenter" loading="lazy">
</p>

If you want a copy of the source, you can grab it here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/detect_meme_ss>

## The Photos

Ok, technically you can just head over to the GitHub repo to see these, but here are the source images. First, the 'regular' photos:

<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/photo1.jpg" alt="Cat laying on a desk next to a computer mouse" class="imgborder imgcenter" loading="lazy">
</p>
<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/photo2.jpg" alt="Display case that says 'invisible snake'" class="imgborder imgcenter" loading="lazy">
</p>
<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/photo3.jpg" alt="Picture from a football game" class="imgborder imgcenter" loading="lazy">
</p>
<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/photo4.jpg" alt="Two cats on a chair" class="imgborder imgcenter" loading="lazy">
</p>

Next, the screenshots:

<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/shot1.jpg" alt="Screenshot from Reddit ap" class="imgborder imgcenter" loading="lazy">
</p>
<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/shot2.jpg" alt="Screenshot from walmart.com, Nebulon-B Frigate LEGO" class="imgborder imgcenter" loading="lazy">
</p>
<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/shot3.jpg" alt="Screenshot from OneNote, a list of shows to watch" class="imgborder imgcenter" loading="lazy">
</p>

And finally, the memes. Enjoy.

<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/meme1.jpg" alt="Time's Person of the Year - Godzilla" class="imgborder imgcenter" loading="lazy">
</p>
<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/meme2.jpg" alt="Vote Cobra" class="imgborder imgcenter" loading="lazy">
</p>
<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/meme3.jpg" alt="Who is Cobra Commander - I mean really..." class="imgborder imgcenter" loading="lazy">
</p>
<p>
<img src="https://static.raymondcamden.com/images/2024/01/cm/meme4.jpg" alt="Brace yourself - winter is coming. The entire thing. All at once. In one weekend." class="imgborder imgcenter" loading="lazy">
</p>
