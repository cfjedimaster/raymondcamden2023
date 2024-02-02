---
layout: post
title: "Using Generative AI as Your Content Assistant"
date: "2024-02-02T18:00:00"
categories: ["writing"]
tags: ["generative ai","eleventy"]
banner_image: /images/banners/cat_writing_rainbow.jpg
permalink: /2024/02/02/using-generative-ai-as-your-content-assistant
description: Enhance your content creation process by utilizing generative AI as your virtual writing assistant.
---

Last week I had the honor of presenting one at [TheJam.dev](https://cfe.dev/events/the-jam-2024/). This was my first presentation on generative AI and I got to share what I thought was an interesting use case - helping with the writing process.

Now to be clear, I don't mean using GenAI to write blog posts, that would be a horrible idea. (IMO!) Instead, I looked at how it could help with some of the process. Let me back up a bit and give some background.

I've been a fan of [John Birmingham](https://cheeseburgergothic.substack.com/) for many years now. He's an author who writes in the military/sci-fi/etc genre and has some pretty fascinating ideas. I initially discovered him via his "Axis of Time" trilogy which dealt with the idea of a modern international naval fleet being sent back in time to 1942. Now, that by itself is cool, however, I loved that he didn't just focus on the military aspect, but spent a lot of time talking about the culture clash between the "uptimers" (folks from the future) and the contemporaries. I suppose you could say it was a bit like Tom Clancy but not just focused on the action. I'd pretty much recommend any of his books and if you've read him already, let me know in a comment below.

As a follower of his work, I subscribed to his Patreon and it's been really interesting. He shares drafts of chapters from upcoming works, but more importantly, he also talks about his process quite a bit. As a writer myself, I find this really fascinating. 

Recently, he was talking about his own use of GenAI, and discussed how he's using it from more of a 'framework' perspective. Ie, how to bring in a character's motive at the right time, and how to set up plot points. This is still 'creative' work but more ... I don't know. Management of the work?

As I said though, I thought it was really interesting and it got me thinking. How could I use GenAI on my blog as a way to help with the writing process? Here's what I came up with.

As a quick aside, everything I discuss below makes use of Google's [Gemini API](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini) and [Eleventy](https://www.11ty.dev/), but would certainly be useful elsewhere.

## Suggesting Titles

The first demo I built involved helping me come up with titles for blog posts. Now, I typically don't struggle with this, but I was curious if GenAI could perhaps suggest alternatives for *better* titles. 

I began by testing out a prompt: 

<blockquote>
Given the following title for a blog post, share three suggestions that may improve the title and drive traffic to the post:  "SOME TITLE". Present your answer in JSON form. The top level key of the JSON result should be "suggestions" and each suggestion should use the key "title" for the suggested title and "reasoning" for the reasoning.
</blockquote>

You'll notice that I specifically ask for three suggestions and say I want to help drive more traffic. Now, I'll be honest. That feels a bit gross and spammy. I don't necessarily want clickbait titles. That being said, I wanted to see some other ideas for my titles. 

That prompt seemed to work well with a few tests in [AI Studio](https://makersuite.google.com/), so I jumped into code. I took the code Google exported, and then wrote a bit of code to:

* Let me pass a filename in via the command line
* Parse the front matter to get the title
* Then call the GenAI endpoint. 

Here's the entire script:

```js
#!/usr/bin/env node

/*
Given an input MD file, grab the title, and ask Google's AI APIs to offer suggestions. 
*/

const fs = require('fs');
const fm = require('front-matter');
require('dotenv').config({path:__dirname + '/.env'});

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GOOGLE_AI_KEY;

async function runGenerate(title) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
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
    {text: `Given the following title for a blog post, share three suggestions that may improve the title and drive traffic to the post:  \"${title}\". 
    Present your answer in JSON form. The top level key of the JSON result should be "suggestions" and each suggestion should use the key "title" for the suggested title and "reasoning" for the reasoning.
    
    The returned JSON should look like the following sample:

    [
      { 
        title: "First suggested title", 
        reasoning: "This is the reason for the suggestion."
      }
    ]
   
    `},
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  // remove backticks and parse. I'm seeing ```json sometimes too
  // console.log('DEBUG', response.text());
  return JSON.parse(response.text().replace(/```/mg, '').replace(/```json/mg,''));
}

(async () => {
  if(process.argv.length === 2) {
    console.log('Usage: titlesuggestions.js <<path to md>>');
    process.exit(1);
  } 

  const mdPath = process.argv[2];
  if(!fs.existsSync(mdPath)) {
    console.log(`Unable to find ${mdPath}.`);
    process.exit(1);
  }

  const contents = fs.readFileSync(mdPath,'utf-8');
  let title  = fm(contents).attributes.title;
  console.log(`\nGenerating suggestions for: ${title}`);
  console.log('------------------------------------------------------------------------');

  let suggestions = (await runGenerate(title)).suggestions;
  //console.log(suggestions);
  suggestions.forEach(s => {
    console.log(`Suggested Title: ${s['title']}\n\nReasoning: ${s['reasoning']}\n`);
    console.log('------------------------------------------------------------------------');
  });
})();
```

And how does it work? This blog post is titled: "Using Generative AI as Your Content Assistant"

Here's what Gemini suggested:

```
Suggested Title: The Power of Generative AI: Your New Content Assistant

Reasoning: This title emphasizes the strength and potential of generative AI as a content creation tool, capturing the reader's attention and making them curious about the possibilities it offers.

------------------------------------------------------------------------
Suggested Title: Unlock Your Content Creation Potential with Generative AI

Reasoning: This title suggests that generative AI can unlock new levels of productivity and creativity in content creation, attracting readers who are looking for ways to enhance their content strategy.

------------------------------------------------------------------------
Suggested Title: Revolutionize Your Content Creation: Meet Your Generative AI Assistant

Reasoning: This title highlights the transformative potential of generative AI in content creation, appealing to readers who are eager to adopt cutting-edge technologies to streamline their workflow.
```

Yeah... I think that's pretty cool. However, none of these really feel like "my" voice for here. I absolutely see some merit in the suggestions and it gives me something to think about, but obviously, I left the original title as is. 

## Writing the Description (Summary)

For my next demo, I looked at a part of my writing process I really don't enjoy, writing the one-sentence `description` value used in my front matter. This string ends up going into my `<meta name="description">` tag and isn't used anywhere else. 

I thought this would be an excellent use of GenAI's summarization feature. I began with a prompt like so:

<blockquote>
Given the following blog post, write a one sentence summary to use as the description
</blockquote>

And then thought about what content I'd send. My blog posts typically have a lot of code samples, and I figured that would end up being noise. So my logic became:

* Let me pass a filename in via the command line
* Parse the front matter to get the title (just for output to me purposes)
* Get the content of the blog post
* 'Clean' it up.
* Then call the GenAI endpoint. 

Most of this is just a modified version of the first example, but let's take a look at the cleanup aspect:

```js
function cleanup(str) {
	str = str.replace(/```(.*?)```/sg, '');
	str = str.replace(/---(.*?)---/sg, '');
	str = str.replace(/\n{3,}/g, '\n');
	return str.trim();
}
```

This is passed the entire contents of the blog post, so I remove the front matter and code samples. I then replace multiple blank lines as well. Here's the entire script:

```js
#!/usr/bin/env node

/*
Given an input MD file, grab the text, scrub code, and ask for a summary.
*/

const fs = require('fs');
const fm = require('front-matter');
require('dotenv').config({path:__dirname + '/.env'});

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GOOGLE_AI_KEY;

async function runGenerate(text) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
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
    {text: `Given the following blog post, write a one sentence summary to use as the description:\n${text}
    `},
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.candidates[0].content.parts[0].text;
  
}

/*
I'm responsible for 'cleaning' up the text before sending to Google. For now, I'll just remove code blocks,
but in the future I may remove images too. Also remove double blank lines. Oh, also remove FM.
*/
function cleanup(str) {
	str = str.replace(/```(.*?)```/sg, '');
	str = str.replace(/---(.*?)---/sg, '');
	str = str.replace(/\n{3,}/g, '\n');
	return str.trim();
}

(async () => {
	if(process.argv.length === 2) {
		console.log('Usage: summarysuggestions.j <<path to md>>');
		process.exit(1);
	} 

	const mdPath = process.argv[2];
	if(!fs.existsSync(mdPath)) {
		console.log(`Unable to find ${mdPath}.`);
		process.exit(1);
	}

	let contents = fs.readFileSync(mdPath,'utf-8');
	let title  = fm(contents).attributes.title;

	// Make it nicer!
	contents = cleanup(contents);

	console.log(`\nGenerating summary suggestion for: ${title}`);
	console.log('------------------------------------------------------------------------');

  	let suggestion = (await runGenerate(title));
  	console.log(suggestion);
})();
```

And here's what it shows for a post from a few days ago, ["Using Generative AI to Improve Image Filenames"](https://www.raymondcamden.com/2024/01/26/using-generative-ai-to-improve-image-filenames):

```
This post explores how Generative AI can be used to enhance image filenames, making them more descriptive, accurate, and consistent.
```

I got to say, that's pretty spot on! And I'm not so worried about the 'voice' for that. I went ahead and used it for *this* post (after I was done), and got (and used) - this:

<blockquote>
Enhance your content creation process by utilizing generative AI as your virtual writing assistant.
</blockquote>

## Watch the Movie

If this interests you but you would love to see me ramble on while looking at a LEGO Death Star, you can watch the presentation below:

<iframe width="560" height="315" src="https://www.youtube.com/embed/7_TfWfcjlpg?si=uGMgeDqr1R-9yRie" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="margin:auto;display:block;margin-bottom:15px"></iframe>

Both of my scripts shown above are in my repo and may be found in the scripts directory here: <https://github.com/cfjedimaster/raymondcamden2023/tree/main/scripts>

Let me know what you think in a comment below!