---
layout: post
title: "Extracting Data from Web Pages with AgentQL and BoxLang"
date: "2025-07-16T18:00:00"
categories: ["Development"]
tags: ["boxlang"]
banner_image: /images/banners/black_cat_half.jpg
permalink: /2025/07/16/extracting-data-from-web-pages-with-agentql-and-boxlang
description: Using AgentQL's scraping APIs with BoxLang to extract pure data from a web page.
---

I discovered [AgentQL](https://www.agentql.com/) a few weeks ago and have been thinking about it quite a bit. In a nutshell, it lets you perform queries against a web page. They've got a simple query language that kinda reminds me of GraphQL, but simpler. So for example, consider the page you are on right now - if I wanted to get the tags, I could use this query:

```
{
	tags[]
}
```

And it would return:

```json
{
  "tags": [
    "#development",
    "#boxlang"
  ]
}
```

What if I wanted the links? I could change my query to express this:

```
{ 
    tags[] {
        label
        url
    }
}
```

And then get:

```json
{
  "tags": [
    {
      "label": "#development",
      "url": "https://www.raymondcamden.com/categories/development"
    },
    {
      "label": "#boxlang",
      "url": "https://www.raymondcamden.com/tags/boxlang"
    }
  ]
}
```

Their API supports both integration with Playwright for complex parsing (go to a page, find the search button, enter cats, search, get the results) and simpler 'go to a url and get stuff' workflows as well. They even have a handy browser extension that lets you test directly in the browser (that's how I got the results above).

This API is *seriously* powerful, and I've got some demos for *other* blog posts I want to share soon, but I thought I'd share a quick example of using their REST API with [BoxLang](https://boxlang.io). First, I started with a simple idea - hit my blog home page and turn the list of articles into an array of data. While my blog has an RSS feed, this would be **super helpful** for sites that do not. 

First off - their [docs](https://docs.agentql.com/rest-api/api-reference) for the REST API show it's relatively simple. You pass the URL, the query, your key of course, and that's it. You can pass additional optional arg for thigs like, "wait X seconds before you scrape" and such, and you can even ask for a screenshot, but the basic operation is relatively simple. Let's look at an example:

```python
if(!server.system.environment.keyExists('AGENTQL_API_KEY')) {
	println('Set the AGENTQL_API_KEY value in your environment please.');
	abort;
}

AGENTQL_API_KEY = server.system.environment.AGENTQL_API_KEY;

blog = 'https://www.raymondcamden.com';

// The AgentQL query of the data to be extracted
query = "
{
  blogposts[] {
    url
    title
	date
  }
}
";

body = {
	query: query,
	url:blog
}

bx:http url="https://api.agentql.com/v1/query-data" method="post" result="result" {
	bx:httpparam type="header" name="X-API-Key" value="#AGENTQL_API_KEY#";
	bx:httpparam type="header" name="Content-Type" value="application/json";
	bx:httpparam type="body" value="#body.toJSON()#";
}

writedump(result.fileContent.fromJSON());
```

I begin by checking and getting a key from my local environment, because I never use keys in my code. Ever. (Ok that's a lie, I did for this one and then changed it to use the environment value before blogging. ;) 

My query is looking for blog posts, as an array, and specifically the URL, title, and date. I put this along with the URL into my body and send it to the endpoint. The result contains two keys, `data` and `metadata`. You can see the result below:

```js
{
  data : {
    blogposts : [
        {
        url : "https://www.raymondcamden.com/2025/07/14/cleaning-up-my-print-view-with-css-media-queries",
        title : "Cleaning Up My Print View with CSS Media Queries",
        date : "July 14, 2025"
      },
      {
        url : "https://www.raymondcamden.com/2025/07/13/links-for-you-71325",
        title : "Links For You (7/13/25)",
        date : "July 13, 2025"
      },
      {
        url : "https://www.raymondcamden.com/2025/07/11/using-genai-to-create-a-sdk-from-sample-code",
        title : "Using GenAI to Create a SDK from Sample Code",
        date : "July 11, 2025"
      },
      {
        url : "https://www.raymondcamden.com/2025/07/10/creating-a-calendar-with-boxlang-part-deux",
        title : "Creating a Calendar with BoxLang - Part Deux",
        date : "July 10, 2025"
      },
      {
        url : "https://www.raymondcamden.com/2025/07/08/results-from-my-vibe-coding-live-stream",
        title : "Results from My Vibe Coding Live Stream",
        date : "July 8, 2025"
      },
      {
        url : "https://www.raymondcamden.com/2025/07/07/creating-a-calendar-with-boxlang",
        title : "Creating a Calendar with BoxLang",
        date : "July 7, 2025"
      },
      {
        url : "https://www.raymondcamden.com/2025/07/04/upcoming-code-break-and-live-streams-next-week",
        title : "Upcoming Code Break and Live Streams Next Week",
        date : "July 4, 2025"
      },
      {
        url : "https://www.raymondcamden.com/2025/07/03/building-a-csv-report-cli-tool-in-boxlang",
        title : "Building a CSV Report CLI Tool in BoxLang",
        date : "July 3, 2025"
      },
      {
        url : "https://www.raymondcamden.com/2025/07/02/parsing-csv-in-boxlang-maven-style",
        title : "Parsing CSV in BoxLang - Maven Style",
        date : "July 2, 2025"
      },
      {
        url : "https://www.raymondcamden.com/2025/07/01/take-foxits-new-pdf-apis-for-a-spin",
        title : "Take Foxit's New PDF APIs for a Spin",
        date : "July 1, 2025"
      }
    ]
  },
  metadata : {
    request_id : "eec19ee9-ab54-4a47-a2c1-74983db77361",
    generated_query : [null],
    screenshot : [null]
  }
}
```

Pretty slick, right? Your next question may be - what can we do with this data? What if we took it, and recreated the blog in a *much* simpler HTML version. Check out this version (as it uses some Markdown and my blog didn't like that, I switched to a gist):

{% darkgist "https://gist.github.com/cfjedimaster/058ef68b34cba357494567ceb98c3a80.js" %}

Ok, so the first thing I did was build a quick UDF wrapper for AgentQL - you can see that up top. Now I call the service, and after getting the data:

* Create a Markdown version of the blog posts
* Use the BoxLang [Markdoown](https://boxlang.ortusbooks.com/boxlang-framework/modularity/markdown) module to convert it to HTML
* Save the result to the file system

As I mentioned in the code sample above, you could imagine emailing this significantly lighter version as well. Here's the output:

<div style="background-color: #c0c0c0; padding:15px">
<h1 id="blog-posts-from-httpswwwraymondcamdencom"><a href="#blog-posts-from-httpswwwraymondcamdencom" id="blog-posts-from-httpswwwraymondcamdencom" name="blog-posts-from-httpswwwraymondcamdencom" class="anchor"></a>Blog Posts from <a href="https://www.raymondcamden.com">https://www.raymondcamden.com</a></h1>
<ul>
<li>
<p><a href="https://www.raymondcamden.com/2025/07/14/cleaning-up-my-print-view-with-css-media-queries">Cleaning Up My Print View with CSS Media Queries</a> (Posted July 14, 2025)</p>
</li>
<li>
<p><a href="https://www.raymondcamden.com/2025/07/13/links-for-you-71325">Links For You (7/13/25)</a> (Posted July 13, 2025)</p>
</li>
<li>
<p><a href="https://www.raymondcamden.com/2025/07/11/using-genai-to-create-a-sdk-from-sample-code">Using GenAI to Create a SDK from Sample Code</a> (Posted July 11, 2025)</p>
</li>
<li>
<p><a href="https://www.raymondcamden.com/2025/07/10/creating-a-calendar-with-boxlang-part-deux">Creating a Calendar with BoxLang - Part Deux</a> (Posted July 10, 2025)</p>
</li>
<li>
<p><a href="https://www.raymondcamden.com/2025/07/08/results-from-my-vibe-coding-live-stream">Results from My Vibe Coding Live Stream</a> (Posted July 8, 2025)</p>
</li>
<li>
<p><a href="https://www.raymondcamden.com/2025/07/07/creating-a-calendar-with-boxlang">Creating a Calendar with BoxLang</a> (Posted July 7, 2025)</p>
</li>
<li>
<p><a href="https://www.raymondcamden.com/2025/07/04/upcoming-code-break-and-live-streams-next-week">Upcoming Code Break and Live Streams Next Week</a> (Posted July 4, 2025)</p>
</li>
<li>
<p><a href="https://www.raymondcamden.com/2025/07/03/building-a-csv-report-cli-tool-in-boxlang">Building a CSV Report CLI Tool in BoxLang</a> (Posted July 3, 2025)</p>
</li>
<li>
<p><a href="https://www.raymondcamden.com/2025/07/02/parsing-csv-in-boxlang-maven-style">Parsing CSV in BoxLang - Maven Style</a> (Posted July 2, 2025)</p>
</li>
<li>
<p><a href="https://www.raymondcamden.com/2025/07/01/take-foxits-new-pdf-apis-for-a-spin">Take Foxit's New PDF APIs for a Spin</a> (Posted July 1, 2025)</p>
</li>
</ul>
</div>

As I said before, I've built some more demos, and their service is *way* more powerful than what I'm showing here, but it is hella cool. You can find my demos shown here up on the BoxLang demos repo: <https://github.com/ortus-boxlang/bx-demos/tree/master/misc/agentql>

Photo by <a href="https://unsplash.com/@amir_es_64?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">amir esfahanian</a> on <a href="https://unsplash.com/photos/a-black-cat-sitting-on-a-sidewalk-at-night-rTCa-tmgfGc?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>