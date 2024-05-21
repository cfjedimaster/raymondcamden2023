---
layout: post
title: "Using the Gemini File API for Prompts with Media"
date: "2024-05-21T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_holding_pictures.jpg
permalink: /2024/05/21/using-the-gemini-file-api-for-prompts-with-media
description: A look at how the File API can make working with multimodal prompts easier.
---

Using media in your prompts (what's called 'multimodal') with the Gemini API is fairly simple in small cases. You can encode your input with base64 and pass it along with your prompt. While this works well, it's got limitations that may be quickly hit - most specifically a file size limit of 20 megs. A few months ago, I shared a demo of using your device's camera to [detect cat breeds](https://www.raymondcamden.com/2023/12/18/using-generative-ai-to-detect-cat-breeds). With today's cameras taking *incredibly* detailed pictures, I hit that limit right away and had to write some code to resize the image to a smaller size. Luckily, the Gemini API has a better way of handling that, the [File API](https://ai.google.dev/gemini-api/docs/prompting_with_media). 

## The File API

This API provides a separate method of adding media to a prompt by using a separate upload process that returns a reference you can then use in your prompt. These references are stored in Google's infrastructure and are automatically deleted after 48 hours, which means a long-running process can make use of the media without having to re-upload the file every time. (And do know that if you wish, you can programatically delete the file as well.)

Switching to the File API also provides other benefits, including a much larger file size (2GB). There is a limit per project of 20GB however so if you know, or are worried, you may hit this limit you might want to use that delete capability I mentioned above. 

Supported file types include images, audio, text, and video. The [documentation](https://ai.google.dev/gemini-api/docs/prompting_with_media?lang=python#supported_file_formats) tells you every precise file format but for the most part, everything you expect is there. I will note though that under the list of [plain text formats](https://ai.google.dev/gemini-api/docs/prompting_with_media?lang=python#plain_text_formats), PDF isn't supported. Of course, PDF isn't "plain text", but I still felt like I should point this out.

## Using the File API

As a simple example, you can use the File API like so (in Node):

```js
import { GoogleAIFileManager } from "@google/generative-ai/files";

const API_KEY = process.env.GEMINI_API_KEY;
const fileManager = new GoogleAIFileManager(API_KEY);

const uploadResult = await fileManager.uploadFile(someFilePath, {
	mimeType,
	displayName: "a display name for the asset",
});
const file = uploadResult.file;
```

The result looks like so:

```js
{
  name: 'files/ei72xz0z2td4',
  displayName: './dog1.png',
  mimeType: 'image/png',
  sizeBytes: '555573',
  createTime: '2024-05-21T15:19:43.572944Z',
  updateTime: '2024-05-21T15:19:43.572944Z',
  expirationTime: '2024-05-23T15:19:43.560274302Z',
  sha256Hash: 'my hash brings all the devs to the yard',
  uri: 'a uri so special it hurts...',
  state: 'ACTIVE'
}
```

Obviously you wouldn't run this alone (at least I don't think so typically), so let's consider a full example. 

## Using a File Result with a Prompt

A trivial example of using media with a prompt would be a "what's in this picture" use case. For that, I'd start with some basic input processing:

```js
if(process.argv.length < 3) {
  console.log('Pass a path to an image.');
  process.exit();
}

let img = process.argv[2];
console.log(`Asking Gemini about: ${img}`);
let result = await processImage(img);
console.log(result);
```

The function `processImage` is responsible for wrapping the File API and prompt handling. Here's that block:

```js
async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  return file;
}

async function processImage(img) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 8192,
  };

  const safetySettings = [
    // removed
  ];

  // Could be better w/ mimetype module
  let ext = img.split('.').pop();
  let mimeType = 'image/png';
  if(ext === '.jpg') mimeType = 'image/jpeg';

  const imageDrive0 = await uploadToGemini(img, mimeType);

  let imgPart = {
    fileData: {
      fileUri:imageDrive0.uri,
      mimeType
    }
  }

  const parts = [
    {text: "Describe what's in this picture"}, imgPart
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  return response.text();
}
```

This code was partially taken from sample code in AI Studio and modified a bit by me, but you can see in `processImage` the first call is to `uploadGemini` with the path and mime type. Once you get that result, it becomes one more part to the data sent to `generateContent` along with a hard-coded prompt.

So given this input: 

<p>
<img src="https://static.raymondcamden.com/images/2024/05/dog1.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

The result is:

```
The picture shows a black Labrador Retriever dog lying on a white floral 
blanket on a red couch. The couch has two light blue pillows with white 
flower and rabbit designs. The dog is wearing a collar with a tag and has
its legs stretched out in front of it. The dog is looking at the camera.
The couch is situated on a wooden floor. 
```

The result is pretty much perfect... and... I hate to say this... but I never noticed the rabbit outline on the pillows before. This is literally five or so feet from where I usually sit in the living room. 

## File API versus Base64

So given that you have two options for using files with multimodal prompts, which is best? Honestly, and this is the consensus I'm seeing with other Gemini users, it feels like it's just plain safer to always use the File API. It's only a few more lines of code, and it lets you simply not worry about the file size. Again, for the most part, you want to remember that 20 gig limit per project as a max cap. My recommendation is to just use the File API going forward.

## Show Me the Code!

You can grab the code from my repo (<https://github.com/cfjedimaster/ai-testingzone/tree/main/gemini_files_api>), or copy it below. Remember, you'll need your own key of course.

```js
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

import { GoogleAIFileManager } from "@google/generative-ai/files";

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GEMINI_API_KEY;
const fileManager = new GoogleAIFileManager(API_KEY);

async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  return file;
}

async function processImage(img) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 8192,
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

  // Could be better w/ mimetype module
  let ext = img.split('.').pop();
  let mimeType = 'image/png';
  if(ext === '.jpg') mimeType = 'image/jpeg';

  const imageDrive0 = await uploadToGemini(img, mimeType);
  console.log(imageDrive0);

  let imgPart = {
    fileData: {
      fileUri:imageDrive0.uri,
      mimeType
    }
  }

  const parts = [
    {text: "Describe what's in this picture"}, imgPart
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  return response.text();
}

if(process.argv.length < 3) {
  console.log('Pass a path to an image.');
  process.exit();
}

let img = process.argv[2];
console.log(`Asking Gemini about: ${img}`);
let result = await processImage(img);
console.log(result);
```