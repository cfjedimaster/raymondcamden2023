---
layout: post
title: "Working with Google Gemini and ColdFusion"
date: "2024-01-23T18:00:00"
categories: ["coldfusion"]
tags: ["generative ai"]
banner_image: /images/banners/cat-writing-flowers.jpg
permalink: /2024/01/23/working-with-google-gemini-and-coldfusion
description: 
---

Most of my recent work with generative AI has been with [Google Gemini](https://deepmind.google/technologies/gemini/#introduction) lately as I find it really simple to use. With most of the complexity being on the prompt side, I appreciate that the code doesn't get in the way. I thought it would be interesting to see how difficult it would be to get the API running in ColdFusion, and unsurprisingly, it was pretty simple. Here's how I got it working.

## Getting the Code

As with pretty much every single post I've done about GenAI, I started in [AI Studio](https://makersuite.google.com/). For my demo, I wanted to re-use a prompt I built for an earlier blog post, ["Texting Email Summaries using Google PaLM AI and Twilio"](https://www.raymondcamden.com/2023/10/13/texting-email-summaries-using-google-palm-ai-and-twilio). Basically:

```
Summarize the following text into two to three sentences: 
```

In AI Studio, I entered that prompt like so:

<p>
<img src="https://static.raymondcamden.com/images/2024/01/cf1.jpg" alt="Basically just the prompt in the Studio UI" class="imgborder imgcenter" loading="lazy">
</p>

I then clicked "Get code". This provides options for JavaScript, Python, Android, Swift, and cURL. I selected cURL as I figured this would give me the basic HTTP call I'd need to recreate in ColdFusion. Here's what it generated.

```
#!/bin/bash

API_KEY="YOUR_API_KEY"

curl \
  -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY} \
  -H 'Content-Type: application/json' \
  -d @<(echo '{
  "contents": [
    {
      "parts": [
        {
          "text": "Summarize the following text into two to three sentences:\n\nTEXT\n"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.9,
    "topK": 1,
    "topP": 1,
    "maxOutputTokens": 2048,
    "stopSequences": []
  },
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}')
```

Basically, an endpoint that needs my key and a body where all I need to care about is the `text` property.  

## The ColdFusion Version

In ColdFusion, that's just one `cfhttp` call. Here's my first version with a hard-coded string to summarize. In this case, an email I got from Disney+ about how awesome they are that I should be giving them more money.

```javascript
<cfscript>
body = {
  "contents": [
    {
      "parts": [
        {
          "text": "Summarize the following text into two to three sentences:\n\nWe wanted to let you know that the price of your subscription will change to \n$139.99 per year on November 12, 2023. Your payment method on file will be \ncharged unless you cancel before then. You'\''ll continue to enjoy 12 months \nfor the price of 10.*\n\nExplore plan options to find the one that best fits your needs. For more \ninformation on managing your subscription, including how to update your \npayment or change your plan, go to Account Settings or visit this FAQ for\ninstructions on how to cancel your subscription.\n\nThank you for being a loyal fan and continuing to be the best part of \nour story. We'\''re working hard to elevate your streaming experience, and\nare excited to continue bringing you the movies, series, and exclusive \nOriginals you love.\n\nWe'\''re always here to help. For any questions visit our Help Center.\n\nThe Disney+ Team\n"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.9,
    "topK": 1,
    "topP": 1,
    "maxOutputTokens": 2048,
    "stopSequences": []
  },
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}	

cfhttp(url="https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=#application.GOOGLE_AI_KEY#", method="post") {
	cfhttpparam(type="header", name="Content-Type", value="application/json");
	cfhttpparam(type="body", value="#serializeJSON(body)#");
}
result = deserializeJSON(cfhttp.fileContent);
writedump(result);

</cfscript>
```

Here's the result, which is probably a bit too small to read. 

<p>
<img src="https://static.raymondcamden.com/images/2024/01/cf2.jpg" alt="Dump of the result" class="imgborder imgcenter" loading="lazy">
</p>

The important part is the result within `candidates`. Here is the text value:

```
The price of your Disney+ subscription will increase to $139.99 per year on 
November 12, 2023, but you'll continue to enjoy 12 months for the price of 
10. Explore plan options or visit your Account Settings to manage your 
subscription, including updating payment or changing your plan.
```

Woot. So given that this first example is static, let's make it a bit more dynamic. I'll convert the Gemini part into a function, and then pass some dynamic text to it (well, static, but you get the idea):

```html
<cfscript>
function aiSummarize(str) {
	var body = {
	"contents": [
		{
		"parts": [
			{
			"text": "Summarize the following text into two to three sentences:\n\n#arguments.str#"
			}
		]
		}
	],
	"generationConfig": {
		"temperature": 0.9,
		"topK": 1,
		"topP": 1,
		"maxOutputTokens": 2048,
		"stopSequences": []
	},
	"safetySettings": [
		{
		"category": "HARM_CATEGORY_HARASSMENT",
		"threshold": "BLOCK_MEDIUM_AND_ABOVE"
		},
		{
		"category": "HARM_CATEGORY_HATE_SPEECH",
		"threshold": "BLOCK_MEDIUM_AND_ABOVE"
		},
		{
		"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
		"threshold": "BLOCK_MEDIUM_AND_ABOVE"
		},
		{
		"category": "HARM_CATEGORY_DANGEROUS_CONTENT",
		"threshold": "BLOCK_MEDIUM_AND_ABOVE"
		}
	]
	};

	var result = "";
	cfhttp(url="https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=#application.GOOGLE_AI_KEY#", method="post", result="result") {
		cfhttpparam(type="header", name="Content-Type", value="application/json");
		cfhttpparam(type="body", value="#serializeJSON(body)#");
	}

	var data = deserializeJSON(result.fileContent);
	if(data.keyExists('candidates') && data.candidates.len() >= 1) {
		return data.candidates[1].content.parts[1].text;
	} else return "";

}
</cfscript>

<cfsavecontent variable="input">
We wanted to let you know that the price of your subscription will change to 
$139.99 per year on November 12, 2023. Your payment method on file will be 
charged unless you cancel before then. You'll continue to enjoy 12 months 
for the price of 10.*

Explore plan options to find the one that best fits your needs. For more 
information on managing your subscription, including how to update your 
payment or change your plan, go to Account Settings or visit this FAQ for
instructions on how to cancel your subscription.

Thank you for being a loyal fan and continuing to be the best part of 
our story. We're working hard to elevate your streaming experience, and
are excited to continue bringing you the movies, series, and exclusive 
Originals you love.

We're always here to help. For any questions visit our Help Center.

The Disney+ Team
</cfsavecontent>

<p>
Doing a summary on our input text, please stand by...
</p>
<cfflush>

<cfset summary = aiSummarize(input)>
<cfoutput>
<p>
Summary: #summary#
</p>
</cfoutput>
```

Here's the result:

<p>
<img src="https://static.raymondcamden.com/images/2024/01/cf3.jpg" alt="Result from previous demo" class="imgborder imgcenter" loading="lazy">
</p>

I'll remind folks my CFML skills are probably pretty rusty and I'd probably include this in a CFC, not just a function, but you get the idea. Let me know what you think and leave your comments below!