---
layout: post
title: "Adding Your Buttondown Email Stats to Your Website"
date: "2024-06-17T18:00:00"
categories: ["development"]
tags: ["serverless","javascript"]
banner_image: /images/banners/cat_mailman.jpg
permalink: /2024/06/17/adding-your-buttondown-email-stats-to-your-website
description: How to use Buttondown's API to get your subscriber count.
---

I've been using [Buttondown](https://buttondown.email/) for almost a full year now (I blogged about the setup [here](https://www.raymondcamden.com/2023/07/31/update-for-my-subscribers)). After having a few issues with Mailchimp and my newsletter, I was pleasantly surprised by how easy Buttondown was and how quick it was to set up. I ended up paying for it as I knew I'd end up paying for *some* solution and Buttondown worked great and wasn't expensive. 

For a while now, I've had a custom-built [stats](/stats) page on my blog that's primarily built for me. It reports on multiple different parts of my site and its biggest use is to let me quickly judge how well I'm keeping to my publishing schedule (a post a week). One stat it *didn't* have that I've been checking manually is a count of how many subscribers I've got to my newsletter. Here's how I added that support.

First, I took a look at the [API documentation](https://docs.buttondown.email/api-introduction) and more specifically, the [Listing subscribers](https://docs.buttondown.email/api-subscribers-list) endpoint. The sample code for this was incredibly simple:

```js
const BASE_URL = "https://api.buttondown.email";
const ENDPOINT = "/subscribers";
const METHOD = "GET";

const headers = {
  Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
};

fetch(`${BASE_URL}/v1${ENDPOINT}`, {
  method: METHOD,
  headers,
})
.then((res) => res.json())
.then((json) => console.log(json));
```

This returns a paginated set of results, but what I care about is the `count` property. I can basically ignore the actual data and just return that. By default, this endpoint returns all subscribers, even those that haven't actually verified their subscription, but that can be modified by passing a `type=regular` query string in the call. 

With that working, I created a new Netlify serverless function:

```js
let BD_KEY = process.env.BUTTONDOWNKEY;

export default async (req, context) => {

	let request = await fetch(`https://api.buttondown.email/v1/subscribers?type=regular`, {
	headers: {
	Authorization: `Token ${BD_KEY}`,
	},
	});

	let data = await request.json();
	let result = { buttondownCount: data.count };

	return Response.json(result);
};

export const config = {
	path:"/api/get-stats"
}
```

Pretty trivial, right? I named this `get-stats` and you can see the path uses that as well, and I'll admit, that's pretty generic. But it occurred to me that I may have more 'small' stats like this in the future and I could simply add to the function. Notice how the `result` object returns the stat in `buttondownCount`. In theory, I can just add more crap there as I, well, get more crap. 

The very last bit was a small amount of client-side code to fetch this and if you're curious, just view the source on that [stats](/stats) page yourself, but I noticed this weekend when adding it that I'm still using Vue.js. I'll be changing to Alpine.js sometime this week. 

Anyway, I hope this helps, and don't forget, you can sign up for my newsletter using the simple form below. The newsletter simply sends you a notification when I release new blog posts. Like this one. :)