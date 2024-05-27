---
layout: post
title: "Adding Recommendations to my Blog with Algolia"
date: "2024-05-27T18:00:00"
categories: ["development"]
tags: ["javascript","algolia"]
banner_image: /images/banners/cat_suggestions.jpg
permalink: /2024/05/27/adding-recommendations-to-my-blog-with-algolia
description: A look at using Algolia's Recommendation API for my blog.
---

I've been using [Algolia](https://algolia.com) for my site's [search](/search) functionality for a few years now and it works great, especially once the free tier expanded to cover the size of my content somewhat better. In that time, I've mainly just stuck to basic search functionality and haven't really touched any of the more advanced features. This weekend I took a look at one I've been meaning to play with for some time, [Recommendations](https://www.algolia.com/products/ai-recommendations/). 

My thinking was, of course, a way to recommend/suggest content related to the current blog post you may be reading. This distinction is important because as I looked at the [Recommendations marketing](https://www.algolia.com/products/ai-recommendations/) and [documentation](https://www.algolia.com/doc/guides/algolia-recommend/overview/), the content is *heavily* focused on **product** recommendations. I.e., the typical "you are looking at product X, and these 3 items are often purchased with it" type scenario. That makes perfect sense, but I will say that initially, I assumed what I wanted to do *wasn't* possible, ie, just straight content recommendations. That may be on me for perhaps skimming the docs a bit quickly, but I share this just in case others have the same reaction as well.

Recommendations are covered by the [incredibly generous free tier](https://www.algolia.com/pricing/), but oddly, at least in my look at the pricing page, I don't see that specifically called out. (I've sent my contacts at Algolia feedback on this and certainly, it could just be me missing the obvious.) I was told that the free tier includes 10k "requests" including search. Now, my [search](/search) page barely gets any traffic, I think I'm the one who uses it the most, but my site itself gets quite a bit of traffic and if every page load is making a call for recommendations, that can quickly add up. 

I decided to implement recommendations on my blog with:

* A Netlify serverless function to proxy the calls to Algolia.
* Netlify Blob's as a simple caching system.

As an FYI, Algolia's client-side JavaScript API absolutely supports recommendations and I initially built that locally, but removed it once I realized I'd probably blow away my free tier usage. 

Here's how I built it.

## Enabling Recommendations for My Content

The first step is to actually enable recommendations which can be done in your Algolia dashboard by - clicking "Recommendations". Yeah, I know, obvious. However - this brings you here:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/alg1.jpg" alt="Algolia Recommendations Dashboard" class="imgborder imgcenter" loading="lazy">
</p>

Beneath this and not in the screenshot was a table named, Existing models, which was blank with no way to add to it. From what I could tell, I needed to select one of the options you see above, but had no real clue due to what I mentioned above - the heavy focus on a product use case. Luckily I had help from an Algolian, Juff (sorry buddy, don't know your real name, but thank you) who told me to use the "Alternative recommendations" model. 

This leads you to this UI:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/alg2a.jpg" alt="Recommendation model setup UI" class="imgborder imgcenter" loading="lazy">
</p>

The first question, `data source`, was easy enough, I selected the index for my blog. You can skip the events (for a content-based example like I'm doing), and then add the "key object" attributes, which for my content was my `content` and `title` attributes. 

The final step is to hit that `Start training` button and then go take a quick break. This takes a little while. I didn't time it exactly but given the size of my content (nearing seven thousand blog posts), it felt like a reasonable amount of time. I want to say it was less than thirty minutes or so. 

When done, you get a really nice visualization and even a bit of sample code as well:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/alg3.jpg" alt="Recommendation sample results and sample code" class="imgborder imgcenter" loading="lazy">
</p>

All in all, relatively painless, but I do wish the "content use case" was more obvious.

## Implementation

As I mentioned above, it's relatively straightforward to get recommendations in JavaScript. I had to add a new script tag (I'm using a 'lite' version of the search SDK), and then a bit of code like so:

```js
const algoliarecommend = window['@algolia/recommend'];
const recommendClient = algoliarecommend('0FJBPN4K5D', '8f741f50b983176875b65e252402b140');

// using this instead of href so it works in dev
let url = ('https://www.raymondcamden.com' + window.location.pathname).slice(0,-1);
//console.log(url);

let recommendationData = await recommendClient.getRelatedProducts([
	{
	indexName: 'raymondcamden',
	objectID: url,
	maxRecommendations:5,        
	queryParameters: {
		attributesToRetrieve:"title,date,url"
	}

	},
]);

let recommendations = recommendationData.results[0].hits;
```

I do a bit of manipulation to get the proper object ID. My Algolia content is identified by the URL with no trailing slash at the end. Once I have that though, I just call the `getRelatedProducts` method and that's it. The `queryParameters` bit there is used to reduce the load of data going back and forth, but all in all, it took just a few minutes.

And then I promptly ripped it out. I scaffolded a new Netlify function and wrote the following:

```js
import { getStore } from "@netlify/blobs";

let algCredentials = { appId: process.env.ALG_APP_ID, apiKey: process.env.ALG_API_KEY, indexName: 'raymondcamden' };

// difference in minutes, one day basically
let CACHE_MAX = 24 * 60 * 60 * 1000;

export default async (req, context) => {

  let params = new URL(req.url).searchParams;
  if(!params.get('path')) return new Response("No path!");
  let path = 'https://www.raymondcamden.com' + params.get('path');
  
  const recommendationStore = getStore('recommendations');

  let recos = await recommendationStore.get(path, { type:'json'});
  if(recos) {
    let diff = (new Date() - new Date(recos.cached)) / (1000 * 60);
    //console.log('diff in ms', diff);
    if(diff < CACHE_MAX) return Response.json(recos.recommendations);
  }
  //console.log('Not in cache, or expired');

  let body = { 
    "requests":[
        {
            "indexName":"raymondcamden",
            "model":"related-products",
            "objectID":path,
            "threshold":40,
            "maxRecommendations":5,
            "queryParameters":{
                "attributesToRetrieve":"title,date,url"
            }
        }
    ]
  }

  let resp = await fetch(`https://${algCredentials.appId}-dsn.algolia.net/1/indexes/*/recommendations`, {
    method:'POST',
    headers:{
      'X-Algolia-Application-Id': algCredentials.appId, 
      'X-Algolia-API-Key': algCredentials.apiKey
    },
    body:JSON.stringify(body)
  });

  let results = await resp.json();
  if(results.status && results.status === 404) return Response.json([]);
  //console.log(results);
  let recommendations = results.results[0].hits.map(h => {
    return {
      "date":h.date,
      "url":h.url,
      "title":h.title
    }
  });
  //console.log(`for ${path} found ${recommendations.length} recommendations`);
  await recommendationStore.setJSON(path, { recommendations, cached: new Date() });

  return Response.json(recommendations);
};

export const config = {
  path:"/api/get-recommendations"
}
```

From the top, I import what I need and initialize variables and such. The function itself starts off by looking for the URL in a query string variable. If it exists, I check the cache. If it exists in the cache, and most importantly, is less than a day old, I return the cached version.

Otherwise, I hit the Algolia REST API. I do a bit of manipulation on the results to make it simpler (date, url, and title), cache it, and then return it. 

For my blog post on [dyanmically creating variables in Postman](https://www.raymondcamden.com/2024/05/22/dynamically-creating-variables-in-postman), here's the result:

```json
[
    {
        "date": "Mon Jul 24 2017 17:33:00 GMT+0000 (Coordinated Universal Time)",
        "url": "https://www.raymondcamden.com/2017/07/24/using-postman-with-openwhisk",
        "title": "Using Postman with OpenWhisk"
    },
    {
        "date": "Thu Apr 05 2012 10:04:00 GMT+0000 (Coordinated Universal Time)",
        "url": "https://www.raymondcamden.com/2012/04/05/Using-jQuery-to-conditionally-load-requests",
        "title": "Using jQuery to conditionally load requests"
    },
    {
        "date": "Mon May 18 2020 00:00:00 GMT+0000 (Coordinated Universal Time)",
        "url": "https://www.raymondcamden.com/2020/05/18/integrating-netlify-analytics-and-eleventy",
        "title": "Integrating Netlify Analytics and Eleventy"
    }
]
```

Honestly, only the first one feels really on target, but as I've tested with other entries, in general, I feel like I'm getting decent results. 

The last part, and the one that took me the longest, was figuring out how and where to render it. I decided to append a gray box after the "Support" box at the bottom and above the comments:

```js
async function doRecommendations() {

  let url = window.location.pathname.slice(0,-1);
  let recommendationReq = await fetch('/api/get-recommendations?path=' + encodeURIComponent(url));
  let recommendations = await recommendationReq.json();

  console.log(`${recommendations.length} recommendations found`);

  if(recommendations.length === 0) return;

  let formatter = new Intl.DateTimeFormat('en-us', {
    dateStyle:'long'
  });

  let reco = `
		<div class="author-box">
			<div class="author-info">
				<h3>Related Content</h3>
        <ul>
  `;

  recommendations.forEach(r => {
    reco += `
      <li><a href="${r.url}">${r.title} (${formatter.format(new Date(r.date))})</a></li>
    `;
  });

  reco += `
      </ul>
    </div>
  </div>`;

  document.querySelector('div.author-box').insertAdjacentHTML('afterend',reco);
}
```

This code is only run on blog posts as it wouldn't make sense on other pages. 

And that's it. Honestly,  I'm rather pleased by it, but can see myself tweaking the UI later. Let me know what you think and leave a comment below. 