---
layout: post
title: "Checking for Spam Content with Chrome AI"
date: "2025-11-07T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cans_of_spam.jpg
permalink: /2025/11/07/checking-for-spam-content-with-chrome-ai
description: Using on-device AI to detect spam content
---

Earlier this week I mentioned I'm looking at my previous server-based generative AI demos and seeing which could possibly make sense using on-device AI with [Chrome's AI](https://developer.chrome.com/docs/ai/get-started) support. I remembered a demo from last year where I tested [spam detection](https://www.raymondcamden.com/2024/03/28/using-generative-ai-to-check-for-spam) using Google Gemini. That demo had worked out rather well and so I thought I'd try it out in Chrome.

## Ok, but why?

Spam detection is important, and a server-based solution could have many users, especially in sites that make use of a lot of user generated content. But what would be the point doing this in the browser? Consider the fact that many of the Chrome AI APIs help with writing, I think such a solution could be useful in helping flag content that *may* be considered spam by others. So for example, your web-based CMS system may let you craft email content, and being able to see in real-time if the content would be diverted to someone's spam folder could be incredibly useful. 

## The Code

To build my spam checking tool, I relied on the following features:

* The [Prompt API](https://developer.chrome.com/docs/ai/prompt-api), which is the general purpose aspect of Chrome AI. 
* A system prompt that guided the Prompt API to focus on the task of determining if the content would be considered spam.
* [Structured output](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api) so I could properly display the results.

Here's how I did this. The first two aspects are handled by the code that creates the session object:

```js
session = await window.LanguageModel.create({
    initialPrompts: [
        { role: 'system', content: 'You analyze a string and detect if it would be flagged as spam. You return a true/false result for that as well as a list of reasons.' },			
    ],
    monitor(m) {
        m.addEventListener("downloadprogress", e => {
            console.log(`Downloaded ${e.loaded * 100}%`);
            /*
                    why this? the download event _always_ runs at
                    least once, so this prevents the msg showing up
                    when its already done. I've seen it report 0 and 1
                    in this case, so we skip both
                    */
            if(e.loaded === 0 || e.loaded === 1) return;
            $result.innerHTML = `Downloading, currently at ${Math.floor(e.loaded * 100)}%`;
        });
    }			
});
```

You'll notice that I'm using the system prompt to both explain what I want and help shape the output. But to *really* specify how the output should be returned, you must make use of JSON schema. I created this schema for my demo:

```js
const spamCheckResultSchema = {
	type:"object", 
	properties: {
		spam:{
			type:"boolean"
		},
		reasons: {
			type:"array", 
			items: {
				type:"string"
			}
		}
	}
};
```

Basically, a top level spam true/false value and an array of reasons backing up why something was flagged a certain way.

The last aspect is the easiest - taking the user input and passing it to the model:

```js
let result = await session.prompt(input, { responseConstraint: spamCheckResultSchema });
```

And that's it. The rest of my demo is just DOM manipulation, and I'll include it below, but keep in mind that as of today, this feature (the Prompt API specifically) is behind a flag in Chrome. It's released for extensions, but not the main browser yet. With that in mind, here's a few samples:

Given: 

```
CAPITAL CREDIT ASSOCIATES
The Capital Recovery Division
Attorney of Record: Stanley Woods
Email: attorney.stanley.woods@gmail.com

Case Reference: CF-9814725D3

Subject: Past Due Loan Amount – $1,825.60

This correspondence concerns the above case reference linked to your account with Capital Credit Associates. Despite prior efforts to connect with you by phone and mail, we have not received any acknowledgment or response. Accordingly, your file has been escalated to our Legal Resolution Department, which has now categorized your account as non-compliant and ready for formal litigation review.

The National Financial Compliance Office has reported the following statutory violations connected to your account activity:

Breach of Federal Lending Guidelines

Misuse of Negotiable Instruments

Unauthorized Funds Withdrawal

Obtaining Credit Under False Pretenses
```

I get:

```
Was it spam? Yes

Reasons Given:

Aggressive tone and threat of litigation
Demand for payment with vague details
Generic subject line (
Past Due Loan Amount
without specifying the lender directly)
Reference to escalation to Legal Resolution Department
Mention of statutory violations without specifics (creating fear)
Lack of specific details about the alleged debt
Generic email address (gmail.com)
Pressure tactics to elicit a quick response
```

That seems right on the money. Now if I try something more innocent:

```
Hi, I attended your presentation about cat developer relations, 
and I was wondering if a) I could get a copy of your slide deck
and b) would you be open to giving the talk to our local cat 
user group?
```

The result is:

```
Was it spam? No

Reasons Given:

Request for information (slide deck)
Request to present at a user group (potentially legitimate outreach)
Non-aggressive language
No attempt to solicit personal information
Clear and straightforward query
```

All in all, this seems to work rather well I think. If you want to give it a shot yourself, or just see the code, you can check out the embed below.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="xbZNNJq" data-pen-title="Spam Detection Test" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/xbZNNJq">
  Spam Detection Test</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

Photo by <a href="https://unsplash.com/@hannes?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Hannes Johnson</a> on <a href="https://unsplash.com/photos/blue-and-brown-cardboard-boxes-mRgffV3Hc6c?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      
