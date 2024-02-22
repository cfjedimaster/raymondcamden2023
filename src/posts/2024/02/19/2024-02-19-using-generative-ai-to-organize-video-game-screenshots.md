---
layout: post
title: "Using Generative AI to Organize Video Game Screenshots"
date: "2024-02-19T18:00:00"
categories: ["javascript"]
tags: ["generative ai","pipedream"]
banner_image: /images/banners/cat_steampunk_gamer.jpg
permalink: /2024/02/19/using-generative-ai-to-organize-video-game-screenshots
description: 
---

Way back in January (remember January), I wrote a blog post describing how to use [gen ai to improve image filenames](https://www.raymondcamden.com/2024/01/26/using-generative-ai-to-improve-image-filenames). This worked by uploading the image to Google Gemini, asking for a short description, and using that description for a new filename. Recently I was thinking about that demo and was curious how well it would work for video games. 

As always, I did a few quick tests in [Google AI Studio](https://aistudio.google.com/). I did some quick Googling for various games and screenshots, and the results were pretty impressive. Here are three mostly modern examples:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game1.jpg" alt="Screenshot from AC Valhalla, correctly identified" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game2.jpg" alt="Screenshot from Diablo 4, correctly identified" class="imgborder imgcenter" loading="lazy">
</p>

And here's a first failure, identifying this as Final Fantasy 14, not 16.

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game3.jpg" alt="Screenshot from FF16, incorrectly identified" class="imgborder imgcenter" loading="lazy">
</p>

It did well for one *really* old game, although to be fair the name is in the picture:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game4.jpg" alt="Screenshot from Zork 1, correctly identified" class="imgborder imgcenter" loading="lazy">
</p>

Although failed on this rather obscure one. It's Bard's Tale 2, not Betrayal at Krondor.

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game5.jpg" alt="Screenshot from Bard's Tale 2, incorrectly identified" class="imgborder imgcenter" loading="lazy">
</p>

Also, note it didn't follow my directions to answer with just the name of the game.

I then tried a few race games. I was really curious about this as with the high fidelity of modern racing games, it feels like it would be a difficult task. Surprisingly, it got them right:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game6.jpg" alt="Screenshot from Forza Horizon 5, correctly identified" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game7.jpg" alt="Screenshot from Gran Turismo 4, correctly identified" class="imgborder imgcenter" loading="lazy">
</p>

I then went *super* old school and obscure and it failed, but it was worth a shot. (The first person to identify it *without* using reverse image search earns 200 Nerd Points.)

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game8.jpg" alt="Screenshot incorrectly identified" class="imgborder imgcenter" loading="lazy">
</p>

So all in all... it worked reasonably well. So let's talk automation! 

## Automating the Process

Nearly two years ago, I blogged about [copying Nintendo Switch screenshots](https://www.raymondcamden.com/2022/04/23/store-nintendo-switch-screenshots-in-the-cloud-using-pipedream) to Dropbox. This made use of the fact that the Switch can post to Twitter and you can use [Pipedream](https://pipedream.com) to scrape media from a Twitter account. As far as I know, that probably doesn't work since Twitter crapped the bed on developer access. While it *did* work, the images I got had random names for images.

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game9.jpg" alt="Screenshot from Dropbox showing 3 Switch screenshots, all with random filenames." class="imgborder imgcenter" loading="lazy">
</p>

The XBox can upload to OneDrive and actually does name the images, which is super helpful. 

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game10.jpg" alt="Screenshot from OneDrive showing a Diablo 4 screenshot." class="imgborder imgcenter" loading="lazy">
</p>

In case you can't read it, the filename is `Diablo IV-2024_02_19-1514-24.png`. It's not only got the game in the screenshot, but the date and time as well. For the purposes of this blog post, I'm going to ignore that but in a real application, I'd probably just handle the XBox images with a bit of custom code, no AI needed.

Playstation is a bit more wonky and a bit surprising. As far as I can tell, you can share videos on YouTube, but screenshots can only be added to the PS app or copied to a USB drive. Again, surprising. 

Here's a screenshot showing how the images are named, and as you can see, nothing relevant is included. 

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game11.jpg" alt="Screenshot from my phone's local files, showing the PS screenshot with an unhelpful name." class="imgborder imgcenter" loading="lazy">
</p>

For the purpose of this, let's make some assumptions (nothing ever goes wrong with that, right?). We will assume that our screenshots all get stored in a Dropbox folder named, `SSIn`. 

I'm going to build a Pipedream workflow that will:

* Trigger on a new file added to SSIn.
* Download the image.
* Use Gemini AI to determine the game.
* Use the name as a new folder in Dropbox, under SSOut, So for example, `/SSOut/Galaga`
* Upload the image and auto rename it based on the time. This lets us know when the screenshot was - well not taken, but at least added to Dropbox.

Let's break it down:

## Step One - The Trigger

This part is relatively simple in Pipedream. I created a trigger based on the Dropbox action for new files. I specified the path and told it to include a link so it could be downloaded.

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game12.jpg" alt="Dropbox trigger" class="imgborder imgcenter" loading="lazy">
</p>

## Step Two - Download the File

The next step is another built-in Pipedream action, downloading a file. In this case, it gets downloaded to `/tmp` with the original filename.

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game13.jpg" alt="Download action" class="imgborder imgcenter" loading="lazy">
</p>


## Step Three - Use AI to Determine the Game

The next step is a Node.js step that essentially takes the code output from AI Studio and has it work with the file in `/tmp`:

```js
import fs from 'fs';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

async function identifyPic(path, key) {
  const MODEL_NAME = "gemini-1.0-pro-vision-latest";
  const API_KEY = key;

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
    {text: "Can you identify what game this screenshot comes from? Just tell me the game.\n\n"},
    {
      inlineData: {
        mimeType: "image/png",
        data: Buffer.from(fs.readFileSync(path)).toString("base64")
      }
    },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.candidates[0].content.parts[0].text;
}

export default defineComponent({
  async run({ steps, $ }) {
    return await identifyPic(steps.download_file_to_tmp.$return_value[1], process.env.PALM_KEY);
  },
})
```

The only really important part here is the first argument to `identifyPic`, the path. Note that the path is the *second* result value from the download step. This definitely surprised me. 

## Step Four - Create a Folder

The next step was also a 'built-in', creating the folder. Now, I should warn you. I'm pretty sure this step is going to throw an error if run twice with the same game. The action's configuration lets you pick a new name if it already exists, but doesn't have a "don't make it if already exists" parameter. I didn't get a chance to test that, but, if it *is* an issue, I'd simply switch to the Pipedream feature that lets you hit any Dropbox API with the right credentials, check the Dropbox API docs, and see if it's possible there, or heck, just wrap in a `try/catch`. 

Outside of that, note that I added a `trim()` to the result from Google as it had a space in front.

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game14.jpg" alt="Create folder" class="imgborder imgcenter" loading="lazy">
</p>

Also note that sometimes Gemini will return a sentence, not just a game name. For example, "The game is X". I figure that will be pretty obvious in the output and a human can handle that.

## Step Five - Upload

The final step is to upload the picture to the new output directory. To get the name to be date based, I used a pretty long expression:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game15.jpg" alt="Upload file" class="imgborder imgcenter" loading="lazy">
</p>

Did it work? Sure did! I mean it's brittle as heck, but here's the output from a few runs. First, top-level folder:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game16.jpg" alt="Folders" class="imgborder imgcenter" loading="lazy">
</p>

And here's the contents of the Valhalla one:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/game17.jpg" alt="Valhalla file result" class="imgborder imgcenter" loading="lazy">
</p>

## The Code, and Everything Else

All in all, I think this works "Ok" to "Well", but not perfect. I definitely think a human could help, and in fact, one thing Pipedream makes easy is sending emails. You could easily add an email notification at the end where a person could see if something got misfiled. 

Anyway, this was fun, and if you want to use this yourself in Pipedream, you can find the workflow here: <https://github.com/cfjedimaster/General-Pipedream-AI-Stuff/tree/production/identify-and-sort-screenshots-p_brCmQz3>




