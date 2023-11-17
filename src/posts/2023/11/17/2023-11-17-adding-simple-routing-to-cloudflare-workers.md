---
layout: post
title: "Adding Simple Routing to Cloudflare Workers"
date: "2023-11-17T18:00:00"
categories: ["javascript"]
tags: ["cloudflare","serverless"]
banner_image: /images/banners/line-routes.jpg
permalink: /2023/11/17/adding-simple-routing-to-cloudflare-workers
description: Using itty-router in a serverless Cloudflare Worker.
---

I've been "playing" with serverless for years now, but honestly still feel new to it. When it comes to organization in a project that uses serverless functions, I've typically tried to build one function per operation. So for example, if I had a need to get a list of cats, I'd have one function. If I had a need to get information about a cat based on an identifier, I'd probably build a second one. That being said, I recently came across an example Cloudflare function that did something cool - it used a router, specifically the *very* lightweight [itty-router](https://itty.dev/itty-router). Let me share an example of how it works.

## What is a Router?

So I kinda assume most folks know what I mean when I say "router" in terms of code, but it's absolutely possible you may not. A router lets you specify a set of URLs, both static and dynamic, and control what code is executed. Examples of places where stuff like this is used would be Express for the server, and also Vue Router for client-side applications. Here's a pseudo-code example:

```js
routerService.get('/cats', () => {
	// hit the database and return cats
});

routerService.get('/dogs', () => {
	// hit the database and return cats, because dogs, ick
});

routerService.post('/cats', () => {
	// check input and add a new cat to the database
});
```

Here I've used some abstract "router service" to define three URL routes as well as the methods used for each. I've got two simple GET requests mapped to logic and then a POST that allows for adding new data. 

Most routers take this a step further and allow for dynamic route mapping. So for example:

```js
routerService.get('/cats', () => {
	// hit the database and return cats
});

routerService.get('/cats/:id', () => {
	// hit the database and return one cat, based on the ID value in the URL
});
```

In this, the router service will differentiate between a request to `/cats` versus a request to `/cats/5`. It will also "grab" that end value from the URL and provide it as a variable, `id`. 

Most routers can do a *lot* more than that, but I wanted to give you a high level idea before going forward. 

## itty-router and CloudFlare

To use itty-router in Cloudflare, first install it as a dependency in your worker folder:

```
npm i itty-router
```

Next, include it in your code:

```js
import { Router } from 'itty-router';

const router = Router();
```

Then you can start using it. Here's a complete example:

```js
import { Router } from 'itty-router';

const router = Router();

const CATS = [
	{name:'Luna', gender:'female', age: 12 },
	{name:'Pig', gender:'female', age: 10},
	{name:'Elise', gender:'female', age: 111},
	{name:'Zelda', gender:'female', age: 1},
	{name:'Grace', gender:'female', age: 13},
];

router.get('/', async (req) => {
	return new Response(JSON.stringify(CATS));
});

router.get('/:name', async (req) => {
	const name = req.params.name;
	let cat = CATS.filter(c => c.name.toUpperCase() === name.toUpperCase());
	return new Response(JSON.stringify(cat));
});

export default {
	async fetch(request, env, ctx) {
		return router.handle(request);
	},
};
```

In the worker above, I've got a hard-coded set of data to keep it simple. I've defined two routes. One to the worker with nothing in the URL that returns all the data. One with a dynamic name that attempts to find a match in the data. 

The 'real' core of the function (the `default` export) simply passes the logic to my router. 

Now to be clear, a router is *not* required to support this. Cloudflare Workers give you access to the URL used to request the code so you could 'manually' build this inside your `fetch` function there, but I know I *much* prefer this version. 

And it gets even better. The `itty-router` package includes other useful bits. Consider this version:

```js
import { Router, json } from 'itty-router';

const router = Router();

const CATS = [
	{name:'Luna', gender:'female', age: 12 },
	{name:'Pig', gender:'female', age: 10},
	{name:'Elise', gender:'female', age: 111},
	{name:'Zelda', gender:'female', age: 1},
	{name:'Grace', gender:'female', age: 13},
];


router.get('/', async (req) => {
	return CATS;
});

router.get('/:name', async (req) => {
	const name = req.params.name;
	return CATS.filter(c => c.name.toUpperCase() === name.toUpperCase());
});

export default {
	async fetch(request, env, ctx) {
		return router.handle(request).then(json);
	},
};
```

I've imported a `json` function that I can use in `fetch`. Now my router functions *only* return data and the JSON part is handled for me. 

At this point, I was already pretty impressed by `itty-router`, but *then* while looking into the docs, I saw their `CORS` support, and check this out:

```js
import { Router, json, createCors, error } from 'itty-router';

const { preflight, corsify } = createCors();

const router = Router();

const CATS = [
	{name:'Luna', gender:'female', age: 12 },
	{name:'Pig', gender:'female', age: 10},
	{name:'Elise', gender:'female', age: 111},
	{name:'Zelda', gender:'female', age: 1},
	{name:'Grace', gender:'female', age: 13},
];

router.all('*', preflight);

router.get('/', async (req) => {
	return CATS;
});

router.get('/:name', async (req) => {
	const name = req.params.name;
	return CATS.filter(c => c.name.toUpperCase() === name.toUpperCase());
});

export default {
	async fetch(request, env, ctx) {
		return router.handle(request).then(json).catch(error).then(corsify);
	},
};
```

Literally about two seconds of work to add CORS support. Now the code above shows the *default* CORS support - you can absolutely tweak it to your liking, but dang is that easy!

If you want to see this simple example in action, you can hit it up at <https://routetest.raymondcamden.workers.dev/> and <https://routetest.raymondcamden.workers.dev/Luna>. The complete source code for the worker may be found here: <https://github.com/cfjedimaster/cloudflareworkers-demos/tree/main/routetest>

## More Ramblings

The above example barely scratches the surface of what the `itty-router` can do, and I highly encourage you to [check the docs](https://itty.dev/itty-router) to see the other features as well. Now, I still kinda feel like I'm going to keep my serverless functions rather simple in terms of what each one supports, but I'm going to be more open to adding a "bit" of flexibility, and `itty-router` will be my goto tool for this. As always, I'm curious to know what you think, so let me know!

Photo by <a href="https://unsplash.com/@bogdan_karlenko?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Bogdan Karlenko</a> on <a href="https://unsplash.com/photos/a-close-up-of-a-wall-with-a-pattern-on-it-36b7JBzhfF4?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
  