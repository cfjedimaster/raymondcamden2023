---
layout: post
title: "Using Generative AI to Check for Spam"
date: "2024-03-28T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/cat_filing_papers.jpg
permalink: /2024/03/28/using-generative-ai-to-check-for-spam
description: Using Google Gemini to check text input for spam.
---

A few days ago I wrote up an exploration I did in Spam APIs, ["Spam APIs in 2024"](https://www.raymondcamden.com/2024/03/25/spam-apis-in-2024). After working on those demos and writing up my findings, I thought it might be interesting to see how a generative AI tool, like [Googele's Gemini](https://deepmind.google/technologies/gemini/#introduction) would handle such a task. 

## Initial Tests

So - once again - I'm a broken record on this - but I fired up [AI Studio](https://aistudio.google.com/) first to give it some quick tests. I began with this prompt:

<blockquote>
Given the following text, rate how much it appears to be spam by giving it a score between 1 and 10, with 10 being the most likely the content is spam.
</blockquote>

For my first test, I used a 'bad' sample (see my [last post](https://www.raymondcamden.com/2024/03/25/spam-apis-in-2024) for a full listing of my sample data):

<div style="background-color: #c0c0c0; padding: 5px">
💪 If you're looking for a lady to be in a relationship with, I could be your lady . I'm Maya, and I'm ready to match with a local dude who understands how to romantic with a girl like me. ❣ 👉Connect with me here👈 .
</div>

I got this response:

<div style="background-color: #c0c0c0; padding: 5px">
I would rate this text a **7/10** on the spam scale. Here's why:

**Spam indicators:**

* **Generic introduction:** "If you're looking for a lady..." is a broad statement that could apply to many people.
* **Suggestive language:** Phrases like "ready to match" and "understands how to romantic" can be interpreted as suggestive.
* **Call to action with suspicious link:** The text urges you to "Connect with me here" with a link that may lead to an unreliable or unsafe website.
* **Use of emojis:** While not inherently spammy, the excessive use of emojis can be a tactic to grab attention.

**However, there are some elements that make it less likely to be spam:**

* **Name introduction:** The text mentions a specific name, "Maya," which suggests a real person might be behind the message.
* **Specificity in desired partner:** Mentioning "local dude" indicates some degree of preference beyond just seeking any possible match.

Overall, the text exhibits several characteristics of spam, but it also contains some elements that could indicate a genuine attempt to connect. Therefore, a score of 7 reflects this ambiguity. 

It's important to remain cautious and avoid clicking on suspicious links, even if the message seems somewhat personal. 
</div>

That feels pretty correct. Next, I tried it with this 'good' sample':

<div style="background-color: #c0c0c0; padding: 5px">
Introducing Polls on Buy Me a Coffee 🎉

Aleesha <aleesha@buymeacoffee.com>
Wed, Mar 20, 4:33 PM (4 days ago)
to me

Hi Raymond Camden,

Just wanted to drop in and give you the big news: Polls are now live on Buy Me a Coffee.

To create a poll, go to your studio, select Posts and you will see an option to create Polls.

You can use Polls to engage with your audience, get ideas on what you should create next, collect feedback, and what not. Excited for you to try it out.

If you have any feedback for us, LMK. I read every reply :)

Regards,
Aleesha
Buy Me a Coffee Team
</div>

And got:

<div style="background-color: #c0c0c0; padding: 5px">
I would rate this email a **2 out of 10** on the spam scale. Here's why:

**Reasons it's not spam:**

* **Sent from a legitimate company:** The email is from Buy Me a Coffee, a well-known platform for creators to receive support from their fans.
* **Personalized:** The email addresses the recipient by name.
* **Relevant content:** The email announces a new feature relevant to users of the platform.
* **Clear unsubscribe option:** The email provides a clear and easy way to unsubscribe from future emails.

**Reasons it could be considered slightly spammy:**

* **Promotional content:** While relevant, the email is ultimately promoting a feature of the platform.
* **Informal language:** The email uses informal language like "LMK" which might not be appropriate for all audiences.

Overall, the email seems legitimate and informative, but its promotional nature and informality slightly increase its spam score. 
</div>

This also feels pretty accurate. All in all, it seems to work well, but if I wanted to automate the process, I'd need to remove the context. To do that, I changed my prompt to: 

<blockquote>
Given the following text, rate how much it appears to be spam by giving it a score between 1 and 10, with 10 being the most likely the content is spam. Your response should only contain the score with no additional text.
</blockquote>

I verified this worked, and then wrote a quick automation script:

```js
import { tests } from './inputdata.js';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_AI_KEY;

async function testForSpam(test) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME }, { apiVersion:'v1beta'});

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ];

  const parts = [
    {text: `
Given the following text, rate how much it appears to be spam by giving it a score between 1 and 10, with 10 being the most likely the content is spam. Your response should only contain the score with no additional text.

${test}`},
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  return response.text().trim();
}

async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
}


for(let good of tests.good) {
	console.log('Running good test');
	let result = await testForSpam(good);
	console.log(result);
	await delay(30 * 1000);
}

for(let bad of tests.bad) {
	console.log('Running bad test');
	let result = await testForSpam(bad);
	console.log(result);
	await delay(30 * 1000);
}
```

Most of this is boilerplate Gemini code, with one really important difference. Note the safety settings are all set to `BLOCK_ONLY_HIGH`. I found that Gemini would have an issue with some of the spam (no surprise there) and lowering the safety thresholds worked. 

Another important change was to throttle my code a bit such that I was only calling the API two times per minute. Without this I would get 429 errors stating I was hitting the API too much. That *feels* a bit on the stingy side and I'm not sure I'd use this at scale, but at the same time, it's doing a lot more and heck, may even be overkill for this task. 

## The Results

How did it do? Pretty good I think:

```bash
Running good test
2
Running good test
3
Running good test
3
Running good test
1
Running good test
1
Running bad test
6
Running bad test
8
Running bad test
8
Running bad test
7
Running bad test
7
```

Every single good test was less than 5 and every bad test was over 5. If you would like to try this code yourself, get a key, and then grab the code from here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/spam_check>