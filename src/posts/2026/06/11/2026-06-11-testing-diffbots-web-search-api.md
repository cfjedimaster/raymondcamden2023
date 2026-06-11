---
layout: post
title: "Testing Diffbot's Web Search API"
date: "2026-06-11T18:00:00"
categories: ["development"]
tags: []
banner_image: /images/banners/search.jpg
permalink: /2026/06/11/testing-diffbots-web-search-api
description: Testing a new API from Diffbot, Web Search
---

It's hard to believe I first experimented with [Diffbot](https://www.diffbot.com/) nearly five years ago. You can see that first post up on the Adobe Medium account - [Natural Language Processing, Adobe PDF Extract, and Deep PDF Intelligence](https://medium.com/adobetech/natural-language-processing-adobe-pdf-extract-and-deep-pdf-intelligence-31ae07139b66). Since then I've tested out various APIs and features from them and was lucky enough to connect with them recently about a new initiative, a [web search API](https://docs.diffbot.com/reference/web-search-get).

There's multiple examples of this out in the wild already, but most just scrape/hack against Google. Google *had* an API, the Custom Search JSON API (I even [covered it](https://www.raymondcamden.com/2020/03/22/implementing-google-custom-search-engines-json-api-in-the-jamstack) back when folks still talked about the JAMStack) but the API is now deprecated and officially turning off January 1, 2027. 

Diffbot's API (which quietly launched about two weeks ago) is against their own crawled index. Why does this matter? Honestly the docs do a *damn* good job of explaining why you should care (emphasis mine):

"Candidates are retrieved and reranked with a cross encoder model trained to rank <strong>factual relevance over popularity</strong>, primary sources over domain monopolies, and organic page rank over <strong>paid spend</strong>.

The net effect is search results that <strong>assume the user is not an idiot</strong>. A search for "hypothyroidism" returns relevant research study papers alongside content from publicly administered websites and reputable non-profit institutions."

Assuming users aren't idiots?!?!

<p>
<img src="https://static.raymondcamden.com/images/2026/06/cotton.jpg" loading="lazy" alt="Bold move cotton" class="imgborder imgcenter">
</p>

Alright, so what's the API actually like? Cribbing from the docs, you make a `GET` to `https://llm.diffbot.com/api/v1/web_search/` with:

* Your search term as `text` in a query param
* A max number of results via `size` that defaults to 10
* An optional `maxTokens` value related to processing of the results
* Lastly, a Diffbot key passed via an `Authorization` header

As of *today*, the API itself has no limits:

"Usage is currently unmetered while we open Web Search API up for public testing.
Don't be the person to screw this up for everyone."

I'd expect in the future this will change and I'd check their main [rate limits doc](https://docs.diffbot.com/reference/rate-limits) for the latest info. 

As for actually using it, they've got a great [Python SDK](https://github.com/diffbot/diffbot-python) which makes this incredibly simple:

```python
from diffbot import Diffbot

db = Diffbot(token="YOUR_TOKEN")
results = db.web_search("diffbot knowledge graph")
for r in results["search_results"]:
    print(r["score"], r["title"], r["pageUrl"])
    print(r["content"])
```

But with the REST API being so simple, I thought I'd build a quick demo in JavaScript and use my new favorite home for stuff like this, [val.town](https://val.town). 

## Building a Web Search Alert

So this is probably the *simplest* implementation (and in the last hour the Diffbot team literally added new stuff to the docs, which means more content, woot) but I built a simple system that:

* Once a week, hits the Diffbot Web Search API looking for a term
* Filters the results based on the score value to only consider higher quality results
* Emails it to me

You, my highly intelligent reader, are probably already thinking of ways to tweak that, and as I said, I plan to follow up on this (tomorrow probably), but here's the entirety of the system in one file:

<iframe width="100%" height="600px" src="https://www.val.town/embed/x/raymondcamden/diffbot-search-alert/main.ts" title="Val Town" frameborder="0" allow="web-share" allowfullscreen></iframe>

I've got my key in an environment variable I snag first, and then define some core values:

* My search term (and yes, you can craft more complex queries than just my name)
* A max number of results 
* A filter to apply on the results

Then it's just a matter of hitting the endpoint. I take the results and filter based on my minimum desired value (scores go from 0 to 1 and in my testing, 0.5 helped). 

Each result contains the URL of the result, the title, the score, and a portion of the content. For my email, I show each of the values, but I was a bit torn on how to handle the `content` value. It's markdown and I can easily turn Markdown into HTML, but it's a part of a web page and greatly screws up an HTML email. 

So how does it look?

<p>
<img src="https://static.raymondcamden.com/images/2026/06/df1.png" loading="lazy" alt="Email example" class="imgborder imgcenter">
</p>

Ok, that's not *terribly* exciting, but you get the idea. I think where this starts to get cool is in combination with other tools as well. You will probably *not* be surprised to know this is covered in their [AI skills](https://github.com/diffbot/diffbot-skills) as well, and I'm going to demonstrate that soon as well. Check it out for yourself and let me know what you think!