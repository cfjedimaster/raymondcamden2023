---
layout: post
title: "Connecting Cloudflare Workers with Service Bindings"
date: "2023-08-11T18:00:00"
categories: ["serverless"]
tags: ["cloudflare"]
banner_image: /images/banners/cloudflare.jpg
permalink: /2023/08/11/connecting-cloudflare-workers-with-service-bindings
description: Using service bindings to connect one Cloudflare Worker to another
---

I'll warn you ahead of time and say this post isn't too much more than what you can find in the documentation, but I wanted to see it work for myself so I had to setup a test locally. Cloudflare [Service bindings](https://developers.cloudflare.com/workers/configuration/bindings/about-service-bindings/) are a way for one Worker to connect to another. That seems simple enough, but while it defines a "connection", that connection is completely internal to the Cloudflare environment. I.e., incredibly fast with much lower latency. Let's consider a simple example.

## The Receiver

I began by creating a worker, named `backworker`, with just a simple message:

```js
export default {
	async fetch(request, env, ctx) {
		return new Response('Hello from Backworker');
	},
};
```

## The Front

I struggled with what to call that header, "front end" felt like a loaded term as it implies HTML, etc. Anyway, I made a second worker named `frontworker`. In order to "connect" it to the back, you need to edit your `wrangler.toml`:

```
services = [
  { binding = "backlogic", service = "backworker" }
]
```

Two things to note here. The `service` value points to the name of the worker where the binding is how you will address it. I suppose normally you would make these the same. I chose a different name just so I could ensure it worked properly. 

In order for this worker to communicate with the other, you use the `env` object and binding name in your code. Here's how it looks:

```js
export default {
	async fetch(request, env, ctx) {
		const backResponse = await env.backlogic.fetch(request.clone());
		let resp = await backResponse.text();
		return new Response(`Hello from front, back said: ${resp}`);
	},
};
```

You use `fetch` to communicate, which is a network call, but remember this is going to be internal only. It does need a request object which can only be read once, hence the use of `request.clone()`. As I didn't bother changing my other service to return JSON, I just get the text response and include it in the response here. 

## Testing

When working locally, you will need to have both workers running. While I wasn't sure it was required, I ensured I started `backworker` first, and then `frontworker`. The CLI noted the binding:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/wb1.jpg" alt="Terminal output showing that it recognized the binding to backworker." class="imgborder imgcenter" loading="lazy">
</p>

Opening it up and running gives you what you expect:

```
Hello from front, back said: Hello from Backworker
```

That's mostly it, but there's one more cool aspect. If my intent is for `backworker` to never be used by itself, I can actually disable its route in the dashboard:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/wb2.jpg" alt="URL route disabled" class="imgborder imgcenter" loading="lazy">
</p>

Now the worker is no longer available publicly, but the front one works just fine: <https://frontworker.raymondcamden.workers.dev/>

If you would like to test this yourself, you can clone the two workers from my new demo repository here: <https://github.com/cfjedimaster/cloudflareworkers-demos>

Photo by <a href="https://unsplash.com/@pwittke?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Patrick Wittke</a> on <a href="https://unsplash.com/photos/QIj214dLQjM?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  