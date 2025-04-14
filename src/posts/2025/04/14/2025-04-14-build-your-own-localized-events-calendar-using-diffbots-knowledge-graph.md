---
layout: post
title: "Build Your Own Localized Events Calendar using Diffbot's Knowledge Graph"
date: "2025-04-14T18:00:00"
categories: ["development"]
tags: ["python", "pipedream"]
banner_image: /images/banners/cat_calendar.jpg
permalink: /2025/04/14/build-your-own-localized-events-calendar-using-diffbots-knowledge-graph
description: Building your own events calendar when one doesn't exist.
---

Finding out what's going on in your city can be a bit of a chore. For me, I use a combination of Facebook, specifically accounts for local organizations and news channels, and our local Reddit forum. This is... haphazard at best. I'm sure local "city wide" calendars exist, but I'm not aware of any that is used by the majority of folks nor do I trust them to actually cover *everything* going on. Having played with Diffbot's [Knowledge Graph](https://www.diffbot.com/products/knowledge-graph/) last month (["Automating and Responding to Sentiment Analysis with Diffbot's Knowledge Graph"](https://www.raymondcamden.com/2025/03/10/automating-and-responding-to-sentiment-analysis-with-diffbots-knowledge-graph)), I thought I'd do some digging to see what would be possible via their API. Here's what I was able to build.

## First Attempt - City and State

For my first attempt, I made use of the Diffbot [visual search tool](https://app.diffbot.com/search/). "Events" are one of the many entity types there so you can start off with:

```
type:Event
```

To give you an idea of the size of the Knowledge Graph, this returned over half a million results. 

Next, I wanted to filter by a location. This took a bit of digging around, but I figured out that the state property is `locations.region.name` while city is `locations.city.name`. This means it's easy to filter to a city. Now, one of the things I noticed was that there wasn't much data for my particular city, which to be fair, [Lafayette](https://app.diffbot.com/entity/EwbS7gNJAN16oSFMDGCzSgg) isn't a big region. For my demo, I switched to New Orleans:

```
type:Event locations.region.name:"Louisiana" locations.city.name:"New Orleans" 
```

This returned almost a thousand results. For the final filter, I added a date restriction for the past thirty days. Now, to be clear, today is April 14th, if an event happened on the 2nd, it's too late. That being said, I thought it would be useful to see events for the entire month. For events that occur every month, this lets you see something you may have missed before but can catch next time. I also added a sort as well:

```
type:Event locations.region.name:"Louisiana" locations.city.name:"New Orleans" 
startDateTime>"2025-03-14" sortBy:startDateTime 
```

This returns over two hundred results:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/df1.jpg" alt="List of Results" class="imgborder imgcenter" loading="lazy">
</p>

As you can see, there's an API call setting right in the UI and clicking it gives you the raw URL you need to get this data. Here it is, minus my key off course:

```
https://kg.diffbot.com/kg/v3/dql?type=query&token=SECRET&query=type%3AEvent+locations.region.name%3A%22Louisiana%22+locations.city.name%3A%22New+Orleans%22+startDateTime%3E%222025-03-14%22++sortBy%3AstartDateTime&size=25
```

Woot! This works, but I kept digging...

## Second Attempt - Using the Near Operator

While looking at Diffbot's [DQL Search docs](https://docs.diffbot.com/docs/tutorial-quickstart-with-knowledge-graph-search), I noticed the section on ["Utility Statements"](https://docs.diffbot.com/docs/tutorial-quickstart-with-knowledge-graph-search#utility-statements) discusses the `near` operator. As you can guess, this lets you find entities (what Diffbot calls their data) within a radius around a specific location. That radius defaults to 15km but can be changed to a specific km or mile value. The docs specify that you can provide either a city or an ID value. 

If you use a city, the docs say that it will "default to the city with the most importance within the Knowledge Graph." That makes sense I suppose, but generally, I'd probably suggest using the ID value of an entity instead to be sure. 

To try something different, I found the ID for Austin, Texas, and this is the query you would use to find events within ten miles:

```
type:Event startDateTime>"2025-04-01" near[10mi](id:"E8y6iIzzkPbKiZdINSDRnYQ") sortBy:startDateTime
```

This returns 123 results, but if we expand our search to twenty miles, you get 668. Not surprising but useful. 

So which do we use? I think it depends. For a large metro area, maybe always use the first approach with a specific value for the location. For a smaller area, the `near` approach may work better. And of course, there's always this option:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/df2.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Given that results from Diffbot have unique entity ID values, you could easily do two calls and dedupe the results. For today, I'm going to stick with the first approach to keep it simpler.

## Building the API

As with my [last demo](https://www.raymondcamden.com/2025/03/10/automating-and-responding-to-sentiment-analysis-with-diffbots-knowledge-graph), I decided to make use of [Pipedream](https://pipedream.com). I created a new workflow using a HTTP trigger which gives me an endpoint I can use in my code. Here's the URL it created: <https://eofjep94f7kygzd.m.pipedream.net> 

After adding the HTTP trigger, I added a code step that handled the "figure out 30 days in the past" and than simply hit the API. I made one small tweak for performance. Pipedream has a key-value storage system called data stores, and given that events won't change terribly often, nor will Diffbot's Knowledge Graph be updated every few seconds, I added a basic 12 hour cache to the results. Here's that code:

```python
import os 
import requests 
import json 
from datetime import datetime, timedelta
import urllib.parse

def simplifyEvent(e): 

	event = {}

	if "description" in e["entity"]:
		event["description"] = e["entity"]["description"]
	if "startDateTime" in e["entity"]:
		date = datetime.fromtimestamp(e["entity"]["startDateTime"]["timestamp"] / 1000)
		event["startDateTime"] = date.strftime("%Y-%m-%d %I:%M %p")

	event["name"] = e["entity"]["name"]
	event["url"] = f"https://{e['entity']['origin']}"
	
	return event
  
def handler(pd: "pipedream"):

  data_store = pd.inputs["data_store"]

  if "cachedResult" in data_store:
    print("Returning from cache")
    return data_store["cachedResult"]

  token = os.environ.get("db_token")
  
  today = datetime.now()
  startDate = today + timedelta(days=-30)
  fStartDate = startDate.strftime("%Y-%m-%d")

  query = f'type:Event locations.region.name:"Louisiana" locations.city.name:"New Orleans" startDateTime>{fStartDate} sortBy:startDateTime'
  apiCall = f"https://kg.diffbot.com/kg/v3/dql?type=query&token={token}&query={urllib.parse.quote(query)}&size=100"
  
  req = requests.get(apiCall)
  result = req.json()
  events = list(map(simplifyEvent, result["data"]))
  
  # cache is 12 hours
  data_store.set("cachedResult", events, ttl=43200)

  return events
```

Note that I could have made the city/state dynamic as properties to the workflow, but again, I'm keeping it simple. Also make note that I changed `size` to 100. Diffbot's API will let you paginate and it wouldn't be that difficult to do so, but as I didn't want to make this *too* complex, I figure this was a simple enough solution. I also added a simple map to the data to greatly reduce the information cached and returned. Diffbot's data is deep, but for most use cases I think only the description, start time, name, and URL is enough. 

And that's literally it - the last bit of code just returns the result:

```python
def handler(pd: "pipedream"):

  pd.respond({
    "status": 200,
    "body": pd.steps["getEvents"]["$return_value"]
  })
```

You can see the entire workflow here: <https://github.com/cfjedimaster/General-Pipedream-AI-Stuff/tree/production/nola-events-p_JZCLpgk>

## Building an App

Ok, so this is probably the jankiest part of the blog post, but I whipped up a quick demo that hits the endpoint and then renders the events. You'll notice right away the display of the event description isn't great. I'm using a bit of CSS to make it better, but a lot more could be done. Also, some events are returning some embedded HTML and such that could be handled as well. I'm considering this a POC and am fine with it being a bit janky. ;) 

Here's the embedded demo:

<p class="codepen" data-height="600" data-default-tab="js,result" data-slug-hash="NPPKjYq" data-pen-title="NOLA Events" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/NPPKjYq">
  NOLA Events</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

<p></p>

Let me know what you think with a comment below!