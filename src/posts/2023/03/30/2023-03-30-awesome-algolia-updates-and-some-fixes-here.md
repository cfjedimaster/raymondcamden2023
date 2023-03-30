---
layout: post
title: "Awesome Algolia Updates (and some fixes here...)"
date: "2023-03-30T18:00:00"
categories: ["development"]
tags: ["algolia"]
banner_image: /images/banners/search.jpg
permalink: /2023/03/30/awesome-algolia-updates-and-some-fixes-here
description: News about Algolia's free tier changes and some fixes here.
---

I've been a *huge* fan, and user, of [Algolia](https://algolia.com) for a while now. I first wrote about it back in 2020 when I described how I [added Algolia search to Eleventy](https://www.raymondcamden.com/2020/06/24/adding-algolia-search-to-eleventy-and-netlify). Later on, I described how one might [migrate to Algolia from Lunr](https://www.raymondcamden.com/2022/08/09/how-to-migrate-from-lunr-to-algolia-a-technical-guide). All in all, I've been very happy with Algolia and my usage on this blog. Honestly, I feel like I'm the only one who makes use of my [search](/search) page but I do so nearly daily so it's critical to me. (And recently, a friend reached out specifically about my search and I'll discuss that below.)

The only real issue I ran into when using Algolia here was the size of my content. Algolia's free tier maxed out at ten thousand records. That's very generous and my blog has a bit over six thousand posts so I was definitely covered, but more than once I attempted an operation that needed to temporarily duplicate my content and I'd hit that limit. That's alright as I just found ways to handle it with a bit more code.

So - luckily - that isn't a problem anymore! Yesterday, Algolia [announced](https://www.algolia.com/blog/algolia/introducing-new-developer-friendly-pricing/) a pretty significant change to their free tier. Now the total number of records you can store is one freaking million. That's huge! Also, they previously had features that were not available under the free tier. That's been changed as well and *everything* is available. Their commercial plan is also significantly cheaper too. 

You can find more details on their [pricing](https://www.algolia.com/pricing/) page. I will point out one important thing though. To get these new limits, you will need to create a new Algolia application and index. That's very quick and if you use the CLI, you can copy settings from one index to another, but I was lazy and just did it by hand. (I also didn't configure my index very much so there wasn't much I needed to do.)

All in all, I think this is a great change, and as I thought their free tier was already pretty generous, it's definitely way beyond that now. 

Alright, so I mentioned I had some fixes here. It turns out that when I first made my index, I did not correctly index my post dates. They worked fine for display, but there weren't properly sorted. I kinda didn't notice it until a friend pointed it out. Algolia [documents](https://www.algolia.com/doc/guides/managing-results/refine-results/sorting/how-to/sort-an-index-by-date/) what's required for this and even has a great example of showing a date that may be used for display as well as one used for sorting. 

My fix was pretty easy. I use a JSON file (two actually, one for incremental updates, and one for a complete rebuild I can run from the CLI) that generates the content I want to index. Here's how it looks:

```js
{% raw %}---
permalink: /algolia_new.json
---

{% assign posts = collections.posts | reverse %}
[
{% for post in posts %}
	{
		"title": {{post.data.title | json }},
		"date":"{{ post.date }}",
		"url":"{{ post.url | prepend: site.url }}",
		"content":{{ post.templateContent | algExcerpt | json }},
		"tags":[
	        {% for tag in post.data.tags %}
            {{ tag | json }}{% unless forloop.last %},{% endunless %}
            {% endfor %}
		],
		"categories":[
            {% for cat in post.data.categories %}
                {{ cat | json }}{% unless forloop.last %},{% endunless %}
            {% endfor %}
		]

	}{% unless forloop.last %},{% endunless %}
{% endfor %}
]{% endraw %}
```

Here's an example from the built version:

```js
{
	"title": "WebC Updates in Eleventy",
	"date": "Tue Mar 28 2023 18:00:00 GMT+0000 (Coordinated Universal Time)",
	"url": "https://www.raymondcamden.com/2023/03/28/webc-updates-in-eleventy",
	"content": "It's been a little while since I've blogged about the Eleventy WebC feature, and that's good because just recently some nice little nuggets landed in the project. Specifically...\n\nI want to share a demo of loops later, (stuff cut out here...)",
	"tags": [
		"javascript",
		"web components",
		"eleventy"
	],
	"categories": [
		"development",
		"jamstack"
	]
},
```

That date value is what I was originally sorting with and it's not valid. As the [docs](https://www.algolia.com/doc/guides/managing-results/refine-results/sorting/how-to/sort-an-index-by-date/) specify, it needs to be a Unix time stamp. Luckily, that was trivial in Liquid, but I had to dig a bit:

```js
{% raw %}---
permalink: /algolia_new.json
---

{% assign posts = collections.posts | reverse %}
[
{% for post in posts limit:5 %}
	{
		"title": {{post.data.title | json }},
		"date":"{{ post.date }}",
		"date_timestamp": {{  post.date | date:'%s' }},
		"url":"{{ post.url | prepend: site.url }}",
		"content":{{ post.templateContent | algExcerpt | json }},
		"tags":[
	        {% for tag in post.data.tags %}
            {{ tag | json }}{% unless forloop.last %},{% endunless %}
            {% endfor %}
		],
		"categories":[
            {% for cat in post.data.categories %}
                {{ cat | json }}{% unless forloop.last %},{% endunless %}
            {% endfor %}
		]

	}{% unless forloop.last %},{% endunless %}
{% endfor %}
]{% endraw %}
```

The important part is the `%s` mask for dates. Here's how it looks in JSON;

```js
"date": "Tue Mar 28 2023 18:00:00 GMT+0000 (Coordinated Universal Time)",
"date_timestamp": 1680026400,
```

Once I had that, and it was updated in my index, my search page began working correctly. I still have some work to do there. I want to add pagination as well as sorting by relevance. Having multiple sorts wasn't an option before as I'd need to use either a replica, and I'd go over the max records, or a virtual replica, which wasn't available in the free tier. That's all not a problem now!