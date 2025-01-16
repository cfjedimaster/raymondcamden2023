---
layout: post
title: "Turn Your Weather into Poetry with GenAI"
date: "2025-01-16T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_weather_poem.jpg
permalink: /2025/01/16/turn-your-weather-into-poetry-with-genai
description: Using Google Gemini to turn a perfectly good forecast into poetry.
---

I was struggling to get some real, productive work done (I just got back from a trip in Europe) and I thought I'd tackle something that's been in my queue for a little while now. This is, yet again, one of my "bad ideas" that you should probably not ever use in production, but it was fun, it made me happy, and you get to see the kind of silliness I do when I'm trying to distract myself. 

The idea was simple - given a forecast, how well could generative AI transform it into something more fun, like poetry? As I usually do, I opened up Google's [AI Studio](https://aistudio.google.com) and tried it there first. I began with a system instruction:

```
Given a forecast, rewrite it in poetry. Return just the poem and nothing more. 
```

The second sentence there is important as in my initial tests, Gemini would return a few examples in different styles. 

I then passed a simple forecast focused on the condition, chance of precipitation, and the low and high temps:

```
The forecast for today is clear, with a 0 percent chance of rain. 
The high temp will be 61.66 and the low 40.06
```

The result won't win any awards, but was kinda magical:

```
A flawless sky, a sunlit stage,
No rain descends to turn a page.
Sixty-one and two-thirds climb,
Then forty whispers, losing time.
Dryness reigns, from dawn till night,
A day of sun, a glorious sight.
```

Cool! So let's build this!

## Step One - The Workflow

Once again I turned to [Pipedream](https://pipedream.com) to build the workflow, starting with a scheduled trigger to run every day at 6AM. I figured that would be a good time to run as the end of this workflow will result in an email to myself with the poem. 

## Step Two - Defining my Settings

I knew I was going to have code that needed to get a forecast for my location. I could have hardcoded my location values, but I decided I wanted the workflow to be a bit more abstract. Node.js steps in Pipedream support the idea of 'props', step level values that can be defined in the UI and referenced in code. Python steps do not. So, I created a code step, `defineSettings`, that would act in the same manner, basically returning my configuration for the workflow:

```python
import os

def handler(pd: "pipedream"):
  return {
    "apikey": os.environ["PIRATE_WEATHER"],
    "latitude": 30.216667,
    "longitude": -92.033333 
  }
```

In case you're curious, that location is for Lafayette, Louisiana. 

## Step Three - Get the Forecast

For my weather, I used the excellent, and free, [Pirate Weather](https://pirateweather.net/en/latest/) API. It's API lets you get a huge amount of weather data, but for my purposes, I just needed a daily forecast. The response is still pretty huge, even with stuff filtered out. You can see an example of a [complete response](https://pirateweather.net/en/latest/API/#response) if you want. My code here was a grand total of 2 real lines:

```python
import requests

def handler(pd: "pipedream"):

  data = requests.get(f"https://api.pirateweather.net/forecast/{pd.steps['defineSettings']['$return_value']['apikey']}/{pd.steps['defineSettings']['$return_value']['latitude']},{pd.steps['defineSettings']['$return_value']['longitude']}?exclude=minutely,hourly,currently,alerts")
  return (data.json())["daily"]["data"][0]
```

Note that I'm returning the first result which should be the current day's forecast. Here's what that data looks like:

```json
{
	"time": 1737007200,
	"icon": "clear-day",
	"summary": "Clear",
	"sunriseTime": 1737032710,
	"sunsetTime": 1737070270,
	"moonPhase": 0.59,
	"precipIntensity": 0,
	"precipIntensityMax": 0,
	"precipIntensityMaxTime": 1737007200,
	"precipProbability": 0,
	"precipAccumulation": 0,
	"precipType": "rain",
	"temperatureHigh": 61.77,
	"temperatureHighTime": 1737061200,
	"temperatureLow": 40.06,
	"temperatureLowTime": 1737115200,
	"apparentTemperatureHigh": 56.84,
	"apparentTemperatureHighTime": 1737061200,
	"apparentTemperatureLow": 36.59,
	"apparentTemperatureLowTime": 1737115200,
	"dewPoint": 40.9,
	"humidity": 0.7,
	"pressure": 1026.29,
	"windSpeed": 2.75,
	"windGust": 7.44,
	"windGustTime": 1737050400,
	"windBearing": 150,
	"cloudCover": 0.27,
	"uvIndex": 4.65,
	"uvIndexTime": 1737054000,
	"visibility": 10,
	"temperatureMin": 41.29,
	"temperatureMinTime": 1737032400,
	"temperatureMax": 61.77,
	"temperatureMaxTime": 1737061200,
	"apparentTemperatureMin": 37.24,
	"apparentTemperatureMinTime": 1737032400,
	"apparentTemperatureMax": 56.84,
	"apparentTemperatureMaxTime": 1737061200
}
```

## Step Four - Translate to English

In theory, I could pass this raw data to Gemini, and in theory, it could possibly grok what's going on based on the key names and values, but I wanted to make it more clear, so I added a new step that essentially translates the data above into English, focused on the type of day, precipitation and temperatures:

```python
def handler(pd: "pipedream"):
  summary = f"""
The forecast for today is {pd.steps['getForecast']['$return_value']['summary']}, with a {pd.steps['getForecast']['$return_value']['precipProbability']*100} percent chance of {pd.steps['getForecast']['$return_value']['precipType']}.
The high temperature will be {pd.steps['getForecast']['$return_value']['temperatureHigh']}F and a low of {pd.steps['getForecast']['$return_value']['temperatureLow']}F.
  """

  return summary
```

That's pretty wordy code-wise, but as an example, this is a possible result (not based on the JSON shown in Step 3 though):

```
The forecast for today is Snow, with a 39.0 percent chance of snow.
The high temperature will be 36.01F and a low of 24.35F.
```

## Step Five - Call GenAI

The next step is where the magic happens. I create an instance of my Gemini model with the system instruction and pass the summary from before:

```python
# pipedream add-package google-generativeai
import google.generativeai as genai

import os 

def handler(pd: "pipedream"):

  genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

  model=genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction="Given a forecast, rewrite it in poetry. Return just the poem and nothing more."
  )
  
  response = model.generate_content(pd.steps["writeSummary"]["$return_value"])

  return response.text
```

As this is a scheduled task, I could have switched to the Pro model to possibly get better, and slower, results, but I was happy with what Flash provided. The result is the poem itself, so that's all I need to do here.

## Step Six - Email!

The final step was trivial as I used Pipedream's built-in "Email Yo-Self" (my name, not theirs) step. I set the subject to "Your Forecast" and the text is just the result from the previous step. I did a quick run and got:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/poem1.jpg" alt="The sun shines bright, a cloudless sky, 
No rain today, the heavens lie.
Sixty-one degrees, the warmth will gleam,
Then forty low, a cooler dream." class="imgborder imgcenter" loading="lazy">
</p>

Pretty cool! Now, it just so happens we are about to have some kind of ice storm in the next few days. It's all over the news, people are in complete panic, dogs and cats living together, mass hysteria, etc. So I tweaked step 3 to go a few days in the future and got this lovely result:

```
A veil of white, a whispered threat,
Thirty-nine percent, the chance is set.
The snow descends, a chilling grace,
On frozen ground, a frosted space.

Thirty-six degrees, the sun's weak plea,
Then twenty-four, where winter's free
To paint the land in hues of frost,
A day of cold, whatever the cost.
```

And that's it! If you want to see the complete code (as Pipedream stores it), you may find it here: <https://github.com/cfjedimaster/General-Pipedream-AI-Stuff/tree/production/weather-forecast-in-poetry-p_vQCakG2>. Tomorrow, and in the next few days, I may share some of the results in comments below. Let me know what you think!

