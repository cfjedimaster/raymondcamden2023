---
layout: post
title: "Using Chrome's (Preview) Prompt API for Data Summarization"
date: "2025-04-10T18:00:00"
categories: ["development"]
tags: ["generative ai", "python"]
banner_image: /images/banners/cat_raincoat.jpg
permalink: /2025/04/10/using-chromes-preview-prompt-api-for-data-summarization
description: Using Chrome's built-in AI to summarize data
---

I probably should *not* be blogging about Chrome's built-in AI (upcoming) features as pretty much every single post I've done is now broken due to changes to the APIs and such, but given that I just got back from a conference where I had a chance to show off these [early APIs](https://developer.chrome.com/docs/ai/built-in), I built a demo that I wanted to share with folks. I imagine that once these APIs become GA (generally available) that this demo will need updating, but I thought it was a cool example and something that has me excited for their future. 

Unlike other Chrome AI features I've covered here that are focused on one particular task (like [translation](https://developer.chrome.com/docs/ai/translator-api)), the [Prompt API](https://developer.chrome.com/docs/extensions/ai/prompt-api) is more general purpose. It supports any general question and answer, but being based on a smaller model ([Gemini Nano](https://deepmind.google/technologies/gemini/nano/)), it won't have nearly the same breadth of knowledge as a larger, API based system. 

That being said, the [docs](https://developer.chrome.com/docs/extensions/ai/prompt-api) for the API had some pretty fascinating use cases, including scanning text for calendar events or contract data. This got me to thinking about a topic I covered in October last year, [AI insights to data](https://www.raymondcamden.com/2024/10/17/adding-ai-insights-to-data-with-google-gemini/). In that post, I used Gemini APIs to translate raw data being used in charts to general one sentence 'executive' type summaries. Even though they pretty much said exactly what was in the chart, I thought it was a great use of AI and was something I was curious about using with Chrome's built-in AI. 

## My Data

For my demo, I decided to (once again) make use of the [Pirate Weather](https://pirateweather.net/en/latest/) API. When making a forecast request, you get a large set of data back. Here's a subset of that information:

```js
{
    "latitude": 30.216,
    "longitude": -92.033,
    "timezone": "America/Chicago",
    "offset": -5.0,
    "elevation": 46,
    "daily": {
        "summary": "Clear",
        "icon": "clear-day",
        "data": [
            {
                "time": 1744261200,
                "summary": "Clear",
                "icon": "clear-day",
                "sunriseTime": 1744285591,
                "sunsetTime": 1744331550,
                "moonPhase": 0.43,
                "precipIntensity": 0.0,
                "precipIntensityMax": 0.0,
                "precipIntensityMaxTime": 1744261200,
                "precipProbability": 0.0,
                "precipAccumulation": 0.0,
                "precipType": "rain",
                "temperatureHigh": 81.46,
                "temperatureHighTime": 1744318800,
                "temperatureLow": 61.21,
                "temperatureLowTime": 1744365600,
                "apparentTemperatureHigh": 80.58,
                "apparentTemperatureHighTime": 1744315200,
                "apparentTemperatureLow": 61.26,
                "apparentTemperatureLowTime": 1744365600,
                "dewPoint": 56.58,
                "humidity": 0.7,
                "pressure": 1020.88,
                "windSpeed": 4.44,
                "windGust": 10.74,
                "windGustTime": 1744336800,
                "windBearing": 223.75,
                "cloudCover": 0.04,
                "uvIndex": 7.98,
                "uvIndexTime": 1744311600,
                "visibility": 9.61,
                "temperatureMin": 54.23,
                "temperatureMinTime": 1744286400,
                "temperatureMax": 81.46,
                "temperatureMaxTime": 1744318800,
                "apparentTemperatureMin": 53.94,
                "apparentTemperatureMinTime": 1744286400,
                "apparentTemperatureMax": 80.58,
                "apparentTemperatureMaxTime": 1744315200
            },
            {
                "time": 1744347600,
                "summary": "Possible Drizzle",
                "icon": "clear-day",
                "sunriseTime": 1744371923,
                "sunsetTime": 1744417988,
                "moonPhase": 0.46,
                "precipIntensity": 0.0017,
                "precipIntensityMax": 0.04,
                "precipIntensityMaxTime": 1744365600,
                "precipProbability": 0.05,
                "precipAccumulation": 0.04,
                "precipType": "rain",
                "temperatureHigh": 78.08,
                "temperatureHighTime": 1744405200,
                "temperatureLow": 49.93,
                "temperatureLowTime": 1744455600,
                "apparentTemperatureHigh": 70.88,
                "apparentTemperatureHighTime": 1744398000,
                "apparentTemperatureLow": 47.06,
                "apparentTemperatureLowTime": 1744455600,
                "dewPoint": 52.02,
                "humidity": 0.6,
                "pressure": 1020.99,
                "windSpeed": 7.19,
                "windGust": 15.56,
                "windGustTime": 1744405200,
                "windBearing": 246.46,
                "cloudCover": 0.09,
                "uvIndex": 7.99,
                "uvIndexTime": 1744398000,
                "visibility": 9.96,
                "temperatureMin": 60.98,
                "temperatureMinTime": 1744372800,
                "temperatureMax": 78.08,
                "temperatureMaxTime": 1744405200,
                "apparentTemperatureMin": 59.71,
                "apparentTemperatureMinTime": 1744430400,
                "apparentTemperatureMax": 70.88,
                "apparentTemperatureMaxTime": 1744398000
            }
        ]
    },
    "flags": {
        "sources": [
            "ETOPO1",
            "gfs",
            "hrrrsubh",
            "hrrr_0-18",
            "nbm",
            "nbm_fire",
            "hrrr_18-48",
            "gefs"
        ],
        "sourceTimes": {
            "hrrr_subh": "2025-04-10 17Z",
            "hrrr_0-18": "2025-04-10 16Z",
            "nbm": "2025-04-10 15Z",
            "nbm_fire": "2025-04-10 12Z",
            "hrrr_18-48": "2025-04-10 12Z",
            "gfs": "2025-04-10 12Z",
            "gefs": "2025-04-10 06Z"
        },
        "nearest-station": 0,
        "units": "us",
        "version": "V2.5.4"
    }
}
```

The portion I cut out was within `data.daily` and I simply removed the last five days of the forecast. Given this raw data, can we write a simple and short forecast? Here's what I came up with.

## My Demo

First, I grab the forecast:

```js
let pirate_api_key = 'lrokzEoN2n7ifLAVgrChU4V6XPEyqAZp5ikO6UWF';
let lat = 30.216;
let lng = -92.033;

let resp = await fetch(`https://api.pirateweather.net/forecast/${pirate_api_key}/${lat},${lng}?units=us&exclude=currently,minutely,hourly,alerts`);
let forecast = await resp.json();
```

Given the large set of data, I wanted to 'translate' this into a smaller string that consisted of:

* The high and low temperatures
* The forecast summary (i.e. cloudy, rainy, apocalypse) 

I used the following logic to do so:

```js
let dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let dayInfo = forecast.daily.data.map(f => {
	let date = new Date(f.time* 1000);
	return { low: f.temperatureLow, high: f.temperatureHigh, summary: f.summary, dayOfWeek: dayNames[date.getDay()] };
}).slice(1);
```

Note that the `slice` at the end removes the first day which is the current day. That may, or may not, make sense. The result from this is:

```js
[
    {
        "low": 49.93,
        "high": 78.08,
        "summary": "Possible Drizzle",
        "dayOfWeek": "Friday"
    },
    {
        "low": 51.71,
        "high": 75.16,
        "summary": "Clear",
        "dayOfWeek": "Saturday"
    },
    {
        "low": 60.66,
        "high": 78.83,
        "summary": "Clear",
        "dayOfWeek": "Sunday"
    },
    {
        "low": 62.62,
        "high": 82.08,
        "summary": "Clear",
        "dayOfWeek": "Monday"
    },
    {
        "low": 56.06,
        "high": 80.11,
        "summary": "Mostly Clear",
        "dayOfWeek": "Tuesday"
    },
    {
        "low": 62.27,
        "high": 79.43,
        "summary": "Mostly Clear",
        "dayOfWeek": "Wednesday"
    },
    {
        "low": 68.77,
        "high": 81.56,
        "summary": "Partly Cloudy",
        "dayOfWeek": "Thursday"
    }
]
```

Spoiler - in Louisiana, if you ever see "possible drizzle" or "possible rain", you're getting rain. Period. 

Now let's turn this into a forecast. For this demo, I skipped my usual "does the API exist and can it be used" checks, so keep that in mind. First, I create an instance of the model with my system instruction:

```js
session = await window.LanguageModel.create({
	systemPrompt:'You turn an list of forecasts including low and high temps and conditions into a one sentence forecast summary.'
});
```

And then I generate the result:

```js
let result = await session.prompt(JSON.stringify(dayInfo));
```

Here's a sample result:

<blockquote>
The forecast for the next week includes a mix of clear skies and partly cloudy days, with temperatures ranging from the mid-40s to the mid-80s. There is a chance of drizzle on Friday.
</blockquote>

That seems pretty accurate I think. You can test this out yourself, but keep in mind that instructions for enabling this feature is behind a signup (fill out the [form here](https://docs.google.com/forms/d/e/1FAIpQLSfZXeiwj9KO9jMctffHPym88ln12xNWCrVkMY_u06WfSTulQg/viewform?resourcekey=0-dE0Rqy_GYXDEWSnU7Z0iHg)) and probably will *not* work for you below. But, you can at least see the full code and honestly, it's a trivial amount of work. Let me know what you think!

<p class="codepen" data-height="500" data-default-tab="js,result" data-slug-hash="gbOZGao" data-pen-title="LanguageModel + Weather" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/gbOZGao">
  LanguageModel + Weather</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

<p>
