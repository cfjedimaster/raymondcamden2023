---
layout: post
title: "Automating Movie Recommendations with Generative AI and Pipedream"
date: "2024-04-26T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_movie.jpg
permalink: /2024/04/26/automating-movie-recommendations-with-generative-ai-and-pipedream
description: How I used Pipedream's lowcode platform and Google Gemini to suggest new movies.
---

For the past few months or so, I've started tracking my movie watching with [Letterboxd](https://letterboxd.com/). I'm not doing a lot of reviews, mostly just logging, but I find it neat to look back and remind myself of what I've watched recently. You can see my [profile](https://letterboxd.com/raymondcamden/) if you're curious, or check out my ["Now"](/now) page as well. I thought it might be interesting to see if I could use my Letterboxd data along with [Google Gemini](https://gemini.google.com/) as a way to suggest the *next* movie I should watch. I was able to build a quick workflow using the incredible [Pipedream](https://pipedream.com) in a few minutes. Let me share with you how I did that.

## What does it do?

At a high level, my workflow does the following:

* It runs, automatically, once a week on Sunday. That was a bit arbitrary but felt like a good day to pick.
* Look at my Letterboxd profile and pluck out the most recent film I logged.
* From that, generate a prompt and ask Gemini what it would suggest.
* Take those suggestions and email them to me.

Now let's take a look at that workflow in detail.

## Step One - The Schedule

This will be the quickest step as it was one of Pipedream's built-in triggers - a CRON/schedule. All I had to was set it to weekly on Sunday.

<p>
<img src="https://static.raymondcamden.com/images/2024/04/movies1.jpg" alt="Scheduled based trigger showing 1:15 PM, only on Sunday" class="imgborder imgcenter" loading="lazy">
</p>

## Step Two - Getting My Letterboxd Data

While Letterboxd has an API, they also have RSS feeds for people's logs. You can find mine here: <https://letterboxd.com/raymondcamden/rss/>. In Pipedream, I added a built-in step that parses RSS feeds. I selected the "Merge" one even though I only had one feed and I'm not sure if there's an action I missed specifically for *one* feed, but it worked easily enough - I simply gave it the RSS url.

<p>
<img src="https://static.raymondcamden.com/images/2024/04/movies2.jpg" alt="RSS Parsing step" class="imgborder imgcenter" loading="lazy">
</p>

As a quick aside, and as a reminder of why I love Pipedream, I've now got a serverless workflow with a custom schedule parsing RSS and I haven't written one line of code. 

## Step Three - Generate My Prompt

Now I actually do need to write code. I'm going to get the first item from the RSS feed, which looks like so in raw XML:

```xml
<item>
	<title>Late Night with the Devil, 2023 - ★★★</title>
	<link>https://letterboxd.com/raymondcamden/film/late-night-with-the-devil/</link>
	<guid isPermaLink="false">letterboxd-watch-578751912</guid>
	<pubDate>Sun, 21 Apr 2024 14:43:16 +1200</pubDate>
	<letterboxd:watchedDate>2024-04-20</letterboxd:watchedDate>
	<letterboxd:rewatch>No</letterboxd:rewatch>
	<letterboxd:filmTitle>Late Night with the Devil</letterboxd:filmTitle>
	<letterboxd:filmYear>2023</letterboxd:filmYear>
	<letterboxd:memberRating>3.0</letterboxd:memberRating>
	<tmdb:movieId>938614</tmdb:movieId>
	<description><![CDATA[ <p><img src="https://a.ltrbxd.com/resized/film-poster/8/4/3/4/1/5/843415-late-night-with-the-devil-0-600-0-900-crop.jpg?v=b6c384f7c5"/></p> <p>Watched on Saturday April 20, 2024.</p> ]]></description>
	<dc:creator>Raymond Camden</dc:creator>
</item>
```

I wanted the title, but not the title in `<title>` as it has extra info, but rather, the value in `<letterboxed:filmTitle>`. I grab that value, and generate my prompt:

```js
export default defineComponent({
  async run({ steps, $ }) {
    let lastMovie = steps.get_films.$return_value[0];
    let title = lastMovie['letterboxd:filmtitle']['#'];
    
    $.export('title', title);
    
    return `
The last movie I watched is "${title}". What would you suggest I watch next?
    `;
  },
})
```

Note how I both return the prompt and export the `title`. I need the title later in the workflow, but I wanted the main return to be the prompt. I've not returned multiple values from a Pipedream step before and I appreciate how easy it is. At the end of this step, I'll be able to reference `title` from the step as well as `$return_value`. 

## Step Four - Talking to Gemini

At this point (if you read my blog), you've seen me demonstrate the Gemini API multiple times. In general, it's trivial code, with the truly important bits being the prompt. A few days back, I [blogged](https://www.raymondcamden.com/2024/04/17/json-results-with-google-gemini-generative-ai-api-calls) about how to get JSON results from your prompt using the response type setting and system instructions. I followed the same format for my code here:

```js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

async function callGemini(text,model) {

	const generationConfig = {
		temperature: 0.9,
		topK: 1,
		topP: 1,
		maxOutputTokens: 2048,
		response_mime_type:'application/json'
	};

	const safetySettings = [
		{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,	threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
	];

	const parts = [
    	{text},
  	];

	const result = await model.generateContent({
		contents: [{ role: "user", parts }],
		generationConfig,
		safetySettings,
	});


	try {

		if(result.response.promptFeedback && result.response.promptFeedback.blockReason) {

			return { error: `Blocked for ${result.response.promptFeedback.blockReason}` };
		}
		const response = result.response;
		return JSON.parse(response.candidates[0].content.parts[0].text);
	} catch(e) {

		return {
			error:e.message
		}
	}
	
}

export default defineComponent({
  async run({ steps, $ }) {
    
    const MODEL_NAME = "gemini-1.5-pro-latest";
    const API_KEY = process.env.GOOGLE_API_KEY;

    const si = `
You are an expert at movies and can make recommendations for a movie a person should watch based on their last film. 

Your response should be a JSON object containing an array of recommendations in this form:

* title: The title of the movie.
* year: The year it was released.
* reason: A one sentence explanation for why the film was recommended.
    `;
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME,
    	systemInstruction: {
    		parts: [{ text:si }],
    		role:"model"
    	} } , { apiVersion:'v1beta' });

    return await callGemini(steps.generatePrompt.$return_value,model);
    
  },
})
```

That's a big block of code, but the important portion really is the system instructions I set up in the `si` string. I describe how Gemini should act and how it should return its results. The net result is an array that looks like so:

```json
{
	"$return_value": [
		{
			"title": "Talk to Me",
			"year": 2023,
			"reason": "If you enjoyed the blend of horror and humor in \"Late Night with the Devil\", \"Talk to Me\" offers a similar tone with its exploration of a group of friends who discover how to conjure spirits using an embalmed hand."
		},
		{
			"title": "The Blackening",
			"year": 2023,
			"reason": "For those who appreciated the satirical elements of \"Late Night with the Devil\", \"The Blackening\" provides a comedic horror experience that cleverly critiques horror movie tropes through a group of Black friends facing a killer."
		},
		{
			"title": "Evil Dead Rise",
			"year": 2023,
			"reason": "If the demonic presence in \"Late Night with the Devil\" intrigued you, \"Evil Dead Rise\" delivers a thrilling continuation of the Evil Dead franchise, showcasing a fresh take on the iconic Deadites and their malevolent influence."
		}
	]
}
```

## Step Five - Generate Email

As I plan on using HTML for my email, I created another code step for the sole purpose of creating an HTML string:

```js
export default defineComponent({
  async run({ steps, $ }) {
    let html = `
<h2>Movie Recommendations</h2>

<p>
The last movie you watched was "${steps.generatePrompt.title}". I asked Google Gemini what you should watch next
and this is what it recommended:
</p>
    `;

    for(let film of steps.generateResponse.$return_value) {
      html += `
 <h3>${film.title} (${film.year})</h3>

 ${film.reason}
      `;
    }

    return html;
  },
})
```

Basically, here's what you watched last, and here's what to watch next. I spent maybe one minute making it look decent, but I could have done much more of course. 

## Step Six - Email

The final step is trivial. Pipedream includes an "email you" type step where you provide a subject and content to email, and it emails the account holder, in this, case. You absolutely *can* use email services and they've got built-in actions for those, but I'm fine with the basic one.

## The Results

The last movie I watched was "Late Night with the Devil", and here's what Gemini recommended:

<div style="background-color: #c0c0c0;padding:10px">
<h2>Movie Recommendations</h2>
The last movie you watched was Late Night with the Devil. I asked Google Gemini what you should watch next and this is what it recommended:

<h3>The Vast of Night (2019)</h3>
If you liked the radio broadcast suspense and 1950s setting of "Late Night with the Devil", you may enjoy this film with a similar premise.

<h3>Talk to Me (2023)</h3>
If what you liked about "Late Night with the Devil" was the occult horror aspect, then you'll enjoy this film that deals with similar themes.

<h3>Pontypool (2008)</h3>
This is another horror film that takes place largely in one location, similar to "Late Night with the Devil", and uses sound design as a key element of horror.
</div>

Of those, I've seen two of them, and honestly, the recommendations feel spot on. While testing I got a few different recommendations including "Antlers", "The Blackening", and "Evil Dead Rise". Again, these feel like great recommendations.

I do think it might be interesting to grab the last two movies instead of one, and that way you would get a bit more variety in responses (assuming you watched different genres), but I figure this by itself is good enough. You can find the complete Pipedream source here: <https://github.com/cfjedimaster/General-Pipedream-Stuff/tree/production/suggest-next-movie-p_ZJCRzAD>. Let me know what you think!
