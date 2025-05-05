---
layout: post
title: "Using AI to Analyze Chart Images"
date: "2025-05-05T18:00:00"
categories: ["development"]
tags: ["generative ai","python"]
banner_image: /images/banners/cat_paw_chart.jpg
permalink: /2025/05/05/using-ai-to-analyze-chart-images
description: How well can GenAI services analyze chart images?
---

I've done a few posts where I've asked GenAI services to analyze and summarize data. Most recently, I [blogged](https://www.raymondcamden.com/2025/04/10/using-chromes-preview-prompt-api-for-data-summarization) about Chrome's built-in AI APIs and summarizing raw data into simple English. In each case where I've done work like this, I've had access to the raw data of what I want the API to analyze. But what if you don't? What if all you have is a simple chart image? I did some testing with this and here's what I found.

## My Source Data

For my source data, I created a set of charts using [Highcharts](https://www.highcharts.com/). This isn't my preferred front-end charting library, but I noticed their demos had (usually) a quick CSV export. That made it easy to get both a sample chart and the raw data behind it. This is what I'll use to judge how well the GenAI service parsed the image. 

I used four charts from Highcharts, and one chart from Powerpoint. I tried to Google for pictures of charts, i.e. someone snapping a picture of a newspaper fore example, but didn't have much luck.

## The Code

Ok, this is usually where I'd tell you I wasn't going to use code, but instead rely on Google Gemini's [AI Studio](https://aistudio.google.com/) UI instead. If you think about it, there's no real code needed to test what I want to test, but, I ran into an interesting issue.

As part of my testing, I wanted a standardized response in JSON that included:

* A high level summary of what the chart represents
* A confidence rating from 0 to 1.
* A copy of the data represented by the chart

The second bullet item ended up being an issue. When defining my schema, I attempted to create a property called `data`, of type array of objects, and leave it at that. If you think about it, we have no idea at runtime what our chart will represent so the schema needs to be generic. However, AI Studio wouldn't let me do that. It insisted I needed to define properties for the object.

On a whim, I tried a quick code sample and via API, it worked just fine. So given that, here is what I came up with:

```python
import sys
import os
from google import genai
from google.genai import types

from pydantic import BaseModel

class ParsedChart(BaseModel):
	description: str
	condfidence: int
	data: object

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


def processImage(path):
	file_ref = client.files.upload(file=path)
	prompt = ''
	response = client.models.generate_content(
		model="gemini-2.5-pro-exp-03-25", 
		contents=[prompt, file_ref],
		config=types.GenerateContentConfig(
			system_instruction="You analyze a chart and return a summary of the chart's data, as well as a parsed data set of the values inside. When parsing chart images, be sure to note data points between axis lines. Return a confidence value that ranges from 0 to 1 representing how confident you are in the numbers returned.",
			response_mime_type='application/json'
		)
	)
	return response.text

if len(sys.argv) < 2:
  print('Usage: python test.py "path to chart image"')
  sys.exit(1)
else:
  chart = sys.argv[1]

result = processImage(chart)
print(result)
```

This is vanilla Gemini API code to upload a document and then ask a question about it, although in this case the prompt is blank, it's the system instruction that has the important portion. Do make note of this part though:

```
"When parsing chart images, be sure to note data points between axis lines."
```

In my initial testing, I saw Gemini returning results for items defined in the x-axis but not data points between them. For example, look at the x-axis on the chart below:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/chart1.jpg" alt="First chart" class="imgborder imgcenter" loading="lazy">
</p>

Notice how the years labels every *other* year while the data points cover every year. Gemini at first missed those points and the addition to the prompt helped out. Note I said "helped", it didn't always work. 

Ok, so let's look at the results, shall we? The tl;dr is... it seemed to work ok. Reasonably well. Although I think it's also reasonable to say folks may not agree. Let's get to it.

## The First Chart

For the first chart, it's the one I shared above. To save you a scroll, here it is again:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/chart1.jpg" alt="First chart" class="imgborder imgcenter" loading="lazy">
</p>

Gemini returned this for the summary:

"The line chart shows the trends in U.S. Solar Employment Growth by job category from 2010 to 2022. The dominant category throughout the period is 'Installation & Developers', which saw substantial growth peaking around 2016 and then fluctuating before rising again towards 2022. 'Manufacturing' employment saw an initial spike in 2011 but remained relatively stable afterwards, generally hovering between 30k and 40k employees. 'Sales & Distribution' also peaked early in 2011 and then maintained a lower, relatively stable level. The 'Other' category remained the smallest, fluctuating below 20k. 'Operations & Maintenance' data is shown starting from 2018 and exhibits slight growth."

Seems pretty reasonable. Now for the numbers. Here is how Gemini returned it:

```json
[
      {"Year": 2010, "Installation & Developers": 45000, "Manufacturing": 25000, "Sales & Distribution": 10000, "Operations & Maintenance": null, "Other": 20000},
      {"Year": 2011, "Installation & Developers": 50000, "Manufacturing": 40000, "Sales & Distribution": 30000, "Operations & Maintenance": null, "Other": 5000},
      {"Year": 2012, "Installation & Developers": 65000, "Manufacturing": 30000, "Sales & Distribution": 15000, "Operations & Maintenance": null, "Other": 7000},
      {"Year": 2013, "Installation & Developers": 85000, "Manufacturing": 32000, "Sales & Distribution": 20000, "Operations & Maintenance": null, "Other": 10000},
      {"Year": 2014, "Installation & Developers": 112000, "Manufacturing": 33000, "Sales & Distribution": 22000, "Operations & Maintenance": null, "Other": 8000},
      {"Year": 2015, "Installation & Developers": 145000, "Manufacturing": 30000, "Sales & Distribution": 28000, "Operations & Maintenance": null, "Other": 10000},
      {"Year": 2016, "Installation & Developers": 175000, "Manufacturing": 40000, "Sales & Distribution": 32000, "Operations & Maintenance": null, "Other": 18000},
      {"Year": 2017, "Installation & Developers": 165000, "Manufacturing": 38000, "Sales & Distribution": 35000, "Operations & Maintenance": null, "Other": 15000},
      {"Year": 2018, "Installation & Developers": 155000, "Manufacturing": 35000, "Sales & Distribution": 32000, "Operations & Maintenance": 12000, "Other": 10000},
      {"Year": 2019, "Installation & Developers": 160000, "Manufacturing": 32000, "Sales & Distribution": 30000, "Operations & Maintenance": 11000, "Other": 11000},
      {"Year": 2020, "Installation & Developers": 155000, "Manufacturing": 30000, "Sales & Distribution": 28000, "Operations & Maintenance": 11000, "Other": 8000},
      {"Year": 2021, "Installation & Developers": 170000, "Manufacturing": 32000, "Sales & Distribution": 30000, "Operations & Maintenance": 12000, "Other": 10000},
      {"Year": 2022, "Installation & Developers": 172000, "Manufacturing": 34000, "Sales & Distribution": 33000, "Operations & Maintenance": 15000, "Other": 9000}
]
```

How does this compare? Here's the real data:

```
"Category","Installation & Developers","Manufacturing","Sales & Distribution","Operations & Maintenance","Other"
2010,43934,24916,11744,,21908
2011,48656,37941,30000,,5548
2012,65165,29742,16005,,8105
2013,81827,29851,19771,,11248
2014,112143,32490,20185,,8989
2015,142383,30282,24377,,11816
2016,171533,38121,32147,,18274
2017,165174,36885,30912,,17300
2018,155157,33726,29243,11164,13053
2019,161454,34243,29213,11218,11906
2020,154610,31050,25663,10077,10073
2021,168960,33099,28978,12530,11471
2022,171558,33473,30618,16585,11648
```

In general, it looks like Gemini always rounded to the nearest thousand, and in general, was in the ballpark. Not precise, but I wasn't expect precise, but it feels reasonably close. 

## The Second Chart

For my second chart, I've got a horizontal bar chart:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/chart2.jpg" alt="Second example" class="imgborder imgcenter" loading="lazy">
</p>

The summary returned by Gemini was:

"The horizontal bar chart displays the historic world population, measured in millions, for four regions (Africa, America, Asia, and Europe) in the years 1990, 2000, and 2021. Asia consistently had the highest population across all three years, increasing from 3,202 million in 1990 to 4,695 million in 2021. Africa showed significant growth, more than doubling its population from 632 million in 1990 to 1,393 million in 2021. America's population grew from 727 million to 1,031 million, while Europe experienced the slowest growth, increasing slightly from 721 million to 745 million over the same period."

With a confidence of 1 (ohhh nice, feeling confident are we) this is the data it returned.

```json
 [
    {
      "Region": "Africa",
      "Year 1990": 632,
      "Year 2000": 814,
      "Year 2021": 1393
    },
    {
      "Region": "America",
      "Year 1990": 727,
      "Year 2000": 841,
      "Year 2021": 1031
    },
    {
      "Region": "Asia",
      "Year 1990": 3202,
      "Year 2000": 3714,
      "Year 2021": 4695
    },
    {
      "Region": "Europe",
      "Year 1990": 721,
      "Year 2000": 726,
      "Year 2021": 745
    }
  ]
```

Ok, so I don't need to show you the CSV data as the chart itself had the numbers on it. Gemini picked up on that and it's results are precise. I expected this, but it was good to see.

## The Third Chart

For the third chart, I've got a stacked bar chart:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/chart3.jpg" alt="Third example" class="imgborder imgcenter" loading="lazy">
</p>

Honestly, this chart feels a bit weird to me. I get what it is trying to represent, but don't get why it stacked 2 countries in 2 bars. This feels like a bad chart, which makes it perfect for testing.

Here's what Gemini said: "Stacked bar chart displaying the all-time Olympic medal counts for Norway, Germany, United States, and Canada, broken down by medal type (Gold, Silver, Bronze). For each medal type, there are two stacks: one combining Norway and Germany, and another combining the United States and Canada. Norway has the highest count for Gold (150), Silver (132), and Bronze (125) medals among the four countries. Germany has 100 Gold, 98 Silver, and 65 Bronze medals. The United States has 115 Gold, 120 Silver, and 95 Bronze medals. Canada has 75 Gold, 72 Silver, and 80 Bronze medals."

Here's the data it found:

```json
[
    {"Medal Type": "Gold", "Country": "Norway", "Count medals": 150},
    {"Medal Type": "Gold", "Country": "Germany", "Count medals": 100},
    {"Medal Type": "Gold", "Country": "United States", "Count medals": 115},
    {"Medal Type": "Gold", "Country": "Canada", "Count medals": 75},
    {"Medal Type": "Silver", "Country": "Norway", "Count medals": 132},
    {"Medal Type": "Silver", "Country": "Germany", "Count medals": 98},
    {"Medal Type": "Silver", "Country": "United States", "Count medals": 120},
    {"Medal Type": "Silver", "Country": "Canada", "Count medals": 72},
    {"Medal Type": "Bronze", "Country": "Norway", "Count medals": 125},
    {"Medal Type": "Bronze", "Country": "Germany", "Count medals": 65},
    {"Medal Type": "Bronze", "Country": "United States", "Count medals": 95},
    {"Medal Type": "Bronze", "Country": "Canada", "Count medals": 80}
 ]
```

And here's the real data:

```
"Category","Norway","Germany","United States","Canada"
"Gold",148,102,113,77
"Silver",133,98,122,72
"Bronze",124,65,95,80
```

These results seem to be *very* close!

## The Fourth Chart

Time for pie!

<p>
<img src="https://static.raymondcamden.com/images/2025/05/chart4.jpg" alt="Pie chart" class="imgborder imgcenter" loading="lazy">
</p>

I don't know about you, but I went from "this is the most boring data ever" to "wtf, there's ASH in eggs???". I looked online and yeah... that's a thing and now I don't want to eat eggs anymore. 

Alright, here's what Gemini had to say:

"The pie chart displays the composition of an egg yolk. According to the source (MDPI), the primary component is Water, making up 55.0% of the yolk. Fat is the second largest component at 26.7%, followed by Protein at 15.5%. Carbohydrates and Ash are also present in smaller quantities, but their specific percentages are not labeled on the chart. The labeled components sum to 97.2%."

I like how it recognized that two parts of the chart weren't labelled and gave a total for the labelled portion.  Here's the data it found:

```json
 [
    {"category": "Water", "value": 55.0},
    {"category": "Fat", "value": 26.7},
    {"category": "Protein", "value": 15.5},
    {"category": "Carbohydrates", "value": null},
    {"category": "Ash", "value": null}
  ]
```

Noting where it could read the precise values, it did so perfectly. I'm kinda surprised it didn't guess on the two unlabeled portions though. It had retuned a confidence of 1.0 which feels incorrect if it couldn't make a guess for those two slices. 

## The Fifth Chart

For the fifth and final chart, I built something quick and dumb in PowerPoint:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/chart5.jpg" alt="fifth chart" class="imgborder imgcenter" loading="lazy">
</p>

You'll notice I could have shaped that a bit better to make the labels clearer to read. This is what Gemini said:

"A grouped bar chart displaying sales data for Pies, Cookies, and Apples across the years 2023, 2024, 2025, and 2026. The y-axis represents the sales value, ranging from 0 to 6. In 2023, Pies had the highest sales (approx. 4.3), followed by Cookies (approx. 2.4) and then Apples (2.0). In 2024, Cookies had the highest sales (approx. 4.4). In 2025, Pies had the highest sales (3.5). In 2026, Apples had the highest sales (5.0), followed by Pies (4.5) and Cookies (approx. 2.8)."

Seems ok. Here's the data it found:

```json
[
    {"Year": "2023", "Pies": 4.3, "Cookies": 2.4, "Apples": 2.0},
    {"Year": "2024", "Pies": 2.5, "Cookies": 4.4, "Apples": 2.0},
    {"Year": "2025", "Pies": 3.5, "Cookies": 1.8, "Apples": 3.0},
    {"Year": "2026", "Pies": 4.5, "Cookies": 2.8, "Apples": 5.0}
  ]
```

And the "real" data:

```
 	Pies	Cookies	Apples
2023	4.3	2.4	2
2024	2.5	4.4	2
2025	3.5	1.8	3
2026	4.5	2.8	5
```

In this case, the results were perfect, but note that the simpler, smaller scale on the y-axis probably helped with that. 

## Summary

All in all, it felt like Gemini did a reasonable job of extrapolating real data from chart pictures. I could imagine this being really useful to provide additional context to people with vision difficulties, or perhaps in parsing old images where no original data is available anymore. I'd still followup with a human reviewer, but Gemini seemed to do a great initial pass. I'd be curious if folks wanted to take my samples and try with other engines. If you do, let me know in a comment below.