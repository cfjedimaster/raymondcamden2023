---
layout: post
title: "Creating Human-Readable Summaries of Data with Google PaLM Generative AI"
date: "2023-11-06T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_weather.jpg
permalink: /2023/11/06/creating-human-readable-summaries-of-data-with-google-palm-generative-ai
description: Transforming an API response into a 'friendly' summary for readers using generative AI and Google PaLM.
---

Like a lot of folks, I've been spending a lot of time thinking about generative AI, and AI, in general, and oddly (well for me), trying to focus on productive uses for it when working with APIs. A few weeks ago I shared my [initial impressions](https://ai.google/discover/palm2/) of Google's [PaLM 2 API](https://ai.google/discover/palm2/), and today I came up with an interesting use case for it. 

I've seen text summarization as a fairly common use case for gen AI, and I agree, it can be incredibly helpful when working with lots of text. However, I got to thinking today, would it be possible to use this as a way to summarize *numerical*, or other data? So given some process that returns a set of information, can we use gen AI to summarize it? Here's what I came up with.

## Playing in MakerSuite

I began by using Google's MakerSuite with some hard-coded data for the weather in our area (Louisiana) for the upcoming week. MakerSuite was really useful in letting me iterate over a number of different prompts trying to get the result I was looking for. Here's what I started off with:

```
Given the following temperature reports (with the first report being the earliest), write a three sentence summary of the weather over the next seven days.

Low of 64, high of 84
Low of 64, high of 83
Low of 66, high of 83
Low of 56, high of 70
Low of 56, high of 68
Low of 54, high of 69
```

To be fair, a three-sentence summary is probably a bit much, but here's what I got:

```
The weather will be warm and sunny with highs in the 80s and lows in the 60s for the next 7 days.

Monday: Sunny, with a high near 84 and a low near 64.

Tuesday: Sunny, with a high near 83 and a low near 64.

Wednesday: Sunny, with a high near 83 and a low near 66.

Thursday: Mostly sunny, with a high near 70 and a low near 56.

Friday: Mostly sunny, with a high near 68 and a low near 56.

Saturday: Mostly sunny, with a high near 69 and a low near 54.

Sunday: Mostly sunny, with a high near 70 and a low near 54.
```

That first sentence is *perfect*, but all the rest is a bit much. I then tried this prompt (with the weather data again):

```
Given the following temperature reports (with the first report being the earliest), write a short summary of the weather over the next seven days.
```

That response *was* perfect: 

```
The weather will be mild over the next seven days, with highs in the mid-80s and lows in the mid-60s. The best day to be outside will be on Tuesday, when the high will be 84 degrees.
```

Like, I *love* that comment on Tuesday. So, I clicked the handy "Get code" button and started working on a real demo.

## Making it Dynamic

I began by deciding on how I'd get the weather and went to a service I used recently, [Pirate Weather](https://pirateweather.net/en/latest/). After getting a key, you can easily get a forecast once you have the latitude and longitude of your location. They also (nicely) let you exclude things you don't need, so I made sure to do that in my call:

```js
let key = 'can my key be any more secret?';
let lat = 30.216;
let lng = -92.033;

let resp = await fetch(`https://api.pirateweather.net/forecast/${key}/${lat},${lng}?units=us&exclude=currently,minutely,hourly,alerts`);
let forecast = await resp.json();
```

FYI, that latitude and longitude are for Lafayette, Louisiana, my hometown. I took this result and mapped it to a new array containing the high and low temps, as well as the general 'summary':

```js
let dayInfo = forecast.daily.data.map(f => {
  return { low: f.temperatureLow, high: f.temperatureHigh, summary: f.summary };
}).slice(1);
```

Note the `slice` at the end. Pirate Weather returns the current day in the forecast and I wanted to focus on the *next* seven days.Here's what this looks like:

```json
[
	{"low":64.58,"high":83.14,"summary":"Partly Cloudy"},
	{"low":66.22,"high":82.76,"summary":"Partly Cloudy"},
	{"low":65.5,"high":83.45,"summary":"Cloudy"},
	{"low":56.99,"high":69.23,"summary":"Rain"},
	{"low":61.63,"high":71.51,"summary":"Cloudy"},
	{"low":62.99,"high":68.46,"summary":"Cloudy"},
	{"low":60.19,"high":65.72,"summary":"Cloudy"}
]
```

OK, with that data ready, I then simply pasted in the code output from MakerSuite, but swapped in my data in the prompt:

```js
const { TextServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");

const MODEL_NAME = "models/text-bison-001";
const API_KEY = "AI is so hot these days";

const client = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(API_KEY),
});

const promptString = `Given the following weather reports (with the first report being the earliest), write a short summary of the weather over the next seven days.

${JSON.stringify(dayInfo)}

`;

const stopSequences = [];

client.generateText({
  // required, which model to use to generate the result
  model: MODEL_NAME,
  // optional, 0.0 always uses the highest-probability result
  temperature: 0.7,
  // optional, how many candidate results to generate
  candidateCount: 1,
  // optional, number of most probable tokens to consider for generation
  top_k: 40,
  // optional, for nucleus sampling decoding strategy
  top_p: 0.95,
  // optional, maximum number of output tokens to generate
  max_output_tokens: 1024,
  // optional, sequences at which to stop model generation
  stop_sequences: stopSequences,
  // optional, safety settings
  safety_settings: [{"category":"HARM_CATEGORY_DEROGATORY","threshold":1},{"category":"HARM_CATEGORY_TOXICITY","threshold":1},{"category":"HARM_CATEGORY_VIOLENCE","threshold":2},{"category":"HARM_CATEGORY_SEXUAL","threshold":2},{"category":"HARM_CATEGORY_MEDICAL","threshold":2},{"category":"HARM_CATEGORY_DANGEROUS","threshold":2}],
  prompt: {
    text: promptString,
  },
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
});
```

You will notice I *slightly* tweaked the prompt and changed 'temperature reports' to 'weather reports' to flag the fact that I was including information about the type of weather for that day. Also, I didn't bother rewriting the data in a human-friendly form, I simply dumped out the JSON. And the result (minus the additional data, just the text) was...

```
The weather for the next seven days will be partly cloudy with 
a high of 84 degrees Fahrenheit and a low of 65 degrees 
Fahrenheit. There is a chance of rain on the fourth day with
a high of 69 degrees Fahrenheit and a low of 57 degrees Fahrenheit.
```

Dang, that's cool! My only real complaint is that "fourth day" is kind of vague. I decided to push my luck a bit. First, I added the day of the week to the data:

```js
let dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let dayInfo = forecast.daily.data.map(f => {
  let date = new Date(f.time* 1000);
  return { low: f.temperatureLow, high: f.temperatureHigh, summary: f.summary, dayOfWeek: dayNames[date.getDay()] };
}).slice(1);
```

As a quick aside, I could have used the Intl spec to get the day of the week instead, but this seemed quicker. This had a bad effect on the 'summary' though:

```
Tuesday: Partly Cloudy, high 84F
Wednesday: Partly Cloudy, high 83F
Thursday: Cloudy, high 83F
Friday: Rain, high 69F
Saturday: Cloudy, high 71F
Sunday: Cloudy, high 68F
Monday: Cloudy, high 66F
```

Still accurate, and yes, it's a more human-readable form of the data, but I could have done that without AI. I then tweaked my prompt a bit more:

```
Given the following weather reports (with the first report being the 
earliest), write a short summary of the weather over the next seven 
days. The weather report is a JSON object containing values for the
high temperature ('high'), low temperature ('low'), weather 
('summary'), and day of the week ('dayOfWeek'). Do not list out each
day, but rather create a summary of the entire set of data.
```

Frankly, it felt weird being so specific, doubling down on the "do not..." part. But it actually seemed to work:

```
The weather for the next 7 days will be partly cloudy with highs 
in the 80s and lows in the 60s. There will be rain on Friday.
```

That's pretty cool I think. Obviously this isn't unique and I'm sure other folks are doing this as well, but it did strike me as a pretty useful way to 'transform' the raw data. Here's my complete script, with the two keys removed of course.

```js
let key = 'my keys are sparkly and filled with rainbows';
let lat = 30.216;
let lng = -92.033;

let resp = await fetch(`https://api.pirateweather.net/forecast/${key}/${lat},${lng}?units=us&exclude=currently,minutely,hourly,alerts`);
let forecast = await resp.json();

let dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let dayInfo = forecast.daily.data.map(f => {
  let date = new Date(f.time* 1000);
  return { low: f.temperatureLow, high: f.temperatureHigh, summary: f.summary, dayOfWeek: dayNames[date.getDay()] };
}).slice(1);

const { TextServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");

const MODEL_NAME = "models/text-bison-001";
const API_KEY = "did anyone read this? let me know";

const client = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(API_KEY),
});

const promptString = `Given the following weather reports (with the first report being the earliest), write a short summary of the weather over the next seven days. The weather report is a JSON object containing values for the high temperature ('high'), low temperature ('low'), weather ('summary'), and day of the week ('dayOfWeek'). Do not list out each day, but rather create a summary of the entire set of data.

${JSON.stringify(dayInfo)}

`;

const stopSequences = [];

client.generateText({
  // required, which model to use to generate the result
  model: MODEL_NAME,
  // optional, 0.0 always uses the highest-probability result
  temperature: 0.7,
  // optional, how many candidate results to generate
  candidateCount: 1,
  // optional, number of most probable tokens to consider for generation
  top_k: 40,
  // optional, for nucleus sampling decoding strategy
  top_p: 0.95,
  // optional, maximum number of output tokens to generate
  max_output_tokens: 1024,
  // optional, sequences at which to stop model generation
  stop_sequences: stopSequences,
  // optional, safety settings
  safety_settings: [{"category":"HARM_CATEGORY_DEROGATORY","threshold":1},{"category":"HARM_CATEGORY_TOXICITY","threshold":1},{"category":"HARM_CATEGORY_VIOLENCE","threshold":2},{"category":"HARM_CATEGORY_SEXUAL","threshold":2},{"category":"HARM_CATEGORY_MEDICAL","threshold":2},{"category":"HARM_CATEGORY_DANGEROUS","threshold":2}],
  prompt: {
    text: promptString,
  },
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
});
```