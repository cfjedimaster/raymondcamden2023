---
layout: post
title: "Adding AI Insights to Data with Google Gemini"
date: "2024-10-17T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_charts.jpg
permalink: /2024/10/17/adding-ai-insights-to-data-with-google-gemini
description: A look at adding AI insights to a chart
---

Yesterday, [Elizabeth Siegle](https://www.lizziesiegle.xyz/), a developer advocate for CLoudflare, showed off a really freaking cool demo making use of Cloudflare's Workers AI support. Her demo made use of WNBA stats to create a beautiful dashboard that's then enhanced with AI. You can find the demo here: <https://wnba-analytics-ai-insights.streamlit.app/>

I found this *incredibly* exciting. I last looked at Cloudflare's AI stuff almost an entire year ago (["Using Cloudflare's AI Workers to Add Translations to PDFs"](https://www.raymondcamden.com/2023/10/24/using-cloudflare-ai-workers-to-add-translations-to-pdfs)), and I haven't quite had a chance to try it again, mostly because I've been focused on [Google Gemini](https://ai.google.dev) for my Generative AI work. 

From an API/usage perspective, Cloudflare's Workers are easy as heck (although I recently had an issue with them that turned out to be a very unique edge case), and you can see this in her code behind the dashboard here: <https://github.com/elizabethsiegle/wnba-analytics-dash-ai-insights/blob/main/app.py>. Scroll down to the `generate_insights` Python method and you'll see it's a simple POST with a prompt to get the results. 

As I said, this was exciting as heck to me. Last week, my [Code Break](https://youtu.be/6nqVWXpvTEY?si=UzQ2oJalZK5qZ0ng) episode was focused on charting in JavaScript. In that session, I made use of [Chart.js](https://www.chartjs.org/) to create charts for a simple set of sales data. This sales data was a hard coded set of totals for four products over 12 months. You can see an example chart I built here: <https://cfjedimaster.github.io/codebr/charts1/chartjs2.html>. In case you don't want to click, here's the chart:

<p>
<img src="https://static.raymondcamden.com/images/2024/10/chart1.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Inspired by Elizabeth's example, I wanted to take this chart, and see if Google could get insights from it. Here's what I built.

## Version One

For the first version, I started off with an HTML page making use of the same chart as shown above, but with an added empty div to share insights:

```html
<h1>Sales Data</h1> 

<div id="chartWrapper">
<canvas id="myChart"></canvas>
</div>

<div id="result"></div>
```

On the client-side, the JavaScript is mostly related to Chart.js, but at the end, I've added a call to my server-side code to get insights and render it to the page:

```js
document.addEventListener('DOMContentLoaded', init, false);
let sales;
let $result;

async function init() {

	$result = document.querySelector('#result');

	let req = await fetch('./data.json');
	salesData = await req.json();

	let chartData = [];

	let productNames = ['Apples', 'Bananas', 'Cherries', 'Donuts'];
	for(let p of productNames) {

		let data = {
			label:p, 
			data: salesData.sales.map(d => {
				for(let product of d.items) {
					if(product.name === p) return product.total;
				}
			})
		}

		chartData.push(data);
	}

	chartLabels = salesData.sales.map(d => {
		return d.date;
	});

	const ctx = document.getElementById('myChart');

	new Chart(ctx, {
		type: 'bar',
		data: {
			labels: chartLabels,
			datasets:chartData,
		},
		options: {
		scales: {
			y: {
			beginAtZero: true
			}
		}
		}
	});

	$result.innerHTML = '<p><i>Getting AI insights into this data...</i></p>';

	let insightsReq = await fetch('/insights', {
		method:'POST', 
		body:JSON.stringify(salesData)
	});

	let insights = await insightsReq.json();
	console.log(insights);
	$result.innerHTML = marked.parse(insights.text);
}
```

So far, nothing special. Do note that I'm passing the same sales data I used in the chart to my server. This is a sample of that data, just the first three months:

```js
{
	"sales": [
		{ 
			"date":"1/2024", 
			"items": [
				{ "name": "Apples", "total": 541 },
				{ "name": "Bananas", "total": 218 },
				{ "name": "Cherries", "total": 490 },
				{ "name": "Donuts", "total": 451 }
			]
		},
		{ 
			"date":"2/2024", 
			"items": [
				{ "name": "Apples", "total": 558 },
				{ "name": "Bananas", "total": 198 },
				{ "name": "Cherries", "total": 452 },
				{ "name": "Donuts", "total": 491 }
			]
		},
		{ 
			"date":"3/2024", 
			"items": [
				{ "name": "Apples", "total": 521 },
				{ "name": "Bananas", "total": 312 },
				{ "name": "Cherries", "total": 402 },
				{ "name": "Donuts", "total": 645 }
			]
		}
	]
}
```

Alright, the fun part comes at the server. I'll share a link to the complete source in a bit, but here's the Gemini aspect:

```js
const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_API_KEY;

const si = `
You provide insights on sales data. You should return 3 to 5 insights about the products sold and their trends over time.
`;

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: MODEL_NAME,
	systemInstruction: {
		parts: [{ text:si }],
		role:"model"
	} 
 });

async function callGemini(data) {

	const generationConfig = {
		temperature: 0.9,
		topK: 1,
		topP: 1,
		maxOutputTokens: 2048,
	};

	const safetySettings = [
		{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE, },
		{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,	threshold: HarmBlockThreshold.BLOCK_NONE, },
		{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE, },
		{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE, },
	];
	
	const parts = [
    	{text:JSON.stringify(data)},
  	];

	const result = await model.generateContent({
		contents: [{ role: "user", parts }],
		generationConfig,
		safetySettings
	});

	console.log(JSON.stringify(result,null,'\t'));

	try {

		if(result.response.promptFeedback && result.response.promptFeedback.blockReason) {

			return { error: `Blocked for ${result.response.promptFeedback.blockReason}` };
		}
		const response = result.response.candidates[0].content.parts[0].text;
		return { response };
	} catch(e) {
		// better handling
		return {
			error:e.message
		}
	}
	
}
```

In this case, my system instruction does all the heavy lifting. I'm literally just passing my JSON to Gemini as is... and it works really well. I honestly thought I'd have to rewrite it, perhaps in simple text with tabs and such to line it up, but it didn't need any help at all. 

Here's the result:

<p>
<img src="https://static.raymondcamden.com/images/2024/10/chart2.jpg" alt="Screenshot showing rendered chart and insights" class="imgborder imgcenter" loading="lazy">
</p>

I recognize that text may be a bit hard to read, so here's a copy:

<div style="background-color: #111111; padding: 25px">
Here are some insights from your sales data:

<ol>
<li>Donuts are on a constant rise: Donut sales show a clear upward trend throughout the year, ending the year with more than double the sales they had in January. This suggests a strong positive response to donuts, perhaps due to seasonal preference or successful marketing.</li>

<li>Apples see growth, Bananas decline: Apple sales demonstrate overall growth across the year, peaking towards the latter months. Conversely, banana sales have steadily declined, particularly in the last quarter. Investigating external factors like pricing or availability could explain these opposing trends.</li>

<li>Cherries fluctuate, but remain relatively stable: Cherry sales don't show a strong upward or downward trend. They peak mid-year and experience some dips, but generally remain within a certain range, suggesting consistent demand.</li>

<li>Potential Seasonality: There's a noticeable dip in sales for almost all items in April, followed by an upswing in May. This could be due to seasonal factors influencing consumer behavior, or perhaps external events impacting that specific period.</li>

<li>Consider Donut Promotions: Given the consistent success of Donuts, further promotions or exploring variations of Donuts could capitalize on their popularity and drive even greater sales.</li>
</ol>
</div>

Sweet! You can find the source here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/chartdemo>

## Version Two

So, I was just going to stop there, and then I recognized something. When I built the HTML for this demo, I had copied in a template that made use of [Shoelace](https://shoelace.style/), my favorite UI library built with web components. I wasn't actually *using* any of them in them in my code so the *smart* thing would have been to remove the dependencies. I didn't. Instead, I looked at the Shoelace site to see if perhaps I could render the insights a bit nicer. 

While looking, I came across their [Carousel](https://shoelace.style/components/carousel) component, and I thought it would be nice to display the insights, one at a time, in larger text to be a bit more... bold? I'm not a designer, and I don't play one on TV, but I figured it was worth a shot. 

On the client side, I modified my code a tiny bit, making the assumption I would get an array back from the server:

```js
let insights = await insightsReq.json();
console.log(insights);
let html = `<sl-carousel pagination navigation>`;
insights.forEach(i => html += `<sl-carousel-item style="background: var(--sl-color-red-200);font-size: var(--sl-font-size-2x-large);padding:20px;">${i}</sl-carousel-item>`);
html += '</sl-carousel>';
$result.innerHTML = html;
```

Converting my insights into an array was trivial - I simply made use of JSON schema in my call to Gemini:

```js
const schema = {
	"description": "A list of insights",
	"type": "array",
	"items": {
		"type":"string"
	}
};
```

I still sent the same prompt, the only change was to my "config" object:

```js
const generationConfig = {
	temperature: 0.9,
	topK: 1,
	topP: 1,
	maxOutputTokens: 2048,
	responseMimeType: "application/json",
	responseSchema:schema
};
```

The results were pretty impressive I think:

<p>
<img src="https://static.raymondcamden.com/images/2024/10/chart3.jpg" alt="New carousel display" class="imgborder imgcenter" loading="lazy">
</p>

I love how big and impactful the insight is. If this were a dashboard on display, you could add the `autoplay` feature to the carousel and have it change automatically. 

I was happy with this, but the red color made me think a bit. I liked the red, but I literally just got it from copying and pasting Shoelace sample code. I wondered if I could do something different. Before I show you that, here's the source for this version: <https://github.com/cfjedimaster/ai-testingzone/tree/main/chartdemo2>

## Version Three

As I said, the red kinda bothered me, as even though it wasn't a bright red, red usually implies a warning or negative item. What if I could get Gemini to quantify it's insights into three sentiments, positive, negative, and neutral? 

Turns out, this was incredibly simple - I just updated my JSON Schema and system instructions:

```js
const schema = {
	"description": "A list of insights categorized by positive, neutral, or negative",
	"type": "array",
	"items": {
		"type":"object",
		"properties": {
			"insight": {
				"type":"string",
				"description":"The actual insight."
			},
			"sentiment":{
				"type":"string",
				"enum":["positive","neutral","negative"]
			}
		}
	}
};


const si = `
You provide insights on sales data. You should return 3 to 5 insights about the products sold and their trends over time. For each insight, classify the sentiment as either positive, neutral, or negative.
`;
```

Nothing else changed on the server. On the front end, I slightly tweaked my code:

```js
let insights = await insightsReq.json();
console.log(insights);

let sentimentColors = {
	"positive":"green",
	"neutral":"blue",
	"negative":"red"
};

let html = `<sl-carousel pagination navigation>`;
insights.forEach(i => {
	let mood = sentimentColors[i.sentiment];
	html += `<sl-carousel-item style="background: var(--sl-color-${mood}-200);font-size: var(--sl-font-size-2x-large);padding:20px;">${i.insight}</sl-carousel-item>`;
});
html += '</sl-carousel>';
$result.innerHTML = html;
```

Here's an example of a positive report:

<p>
<img src="https://static.raymondcamden.com/images/2024/10/chart4.jpg" alt="Positive donut sales" class="imgborder imgcenter" loading="lazy">
</p>


And here's a negative:

<p>
<img src="https://static.raymondcamden.com/images/2024/10/chart5.jpg" alt="Negative banana sales" class="imgborder imgcenter" loading="lazy">
</p>

Blue is used for neutral:

<p>
<img src="https://static.raymondcamden.com/images/2024/10/chart6.jpg" alt="A neutral insight" class="imgborder imgcenter" loading="lazy">
</p>

There ya go. You can find the code for this here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/chartdemo3> 

I wish I could host these publicly, but I don't want to incur charges for a simple demo. :) As always, let me know what you think, and huge thanks again to [Elizabeth Siegle](https://www.lizziesiegle.xyz/) for the inspiration!