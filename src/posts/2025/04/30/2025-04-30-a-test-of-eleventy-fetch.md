---
layout: post
title: "A Test of Eleventy Fetch"
date: "2025-04-30T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/cat_dog_fetch.jpg
permalink: /2025/04/30/a-test-of-eleventy-fetch
description: A quick look at the Eleventy Fetch plugin.
---

It has been *quite* some time since I wrote about [Eleventy](https://www.11ty.dev). My last post was a quick announcement about me [upgrading my site to Eleventy 3.0](https://www.raymondcamden.com/2024/10/02/eleventy-30-released-and-in-use-here) and how well that worked. I was going through my list of blog ideas and realized that in March of 2022, yes, 2022, I wrote down that I should take a quick look at Eleventy Fetch:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/fetch1.jpg" alt="To Do Item for this post!" class="imgborder imgcenter" loading="lazy">
</p>

I knew it worked, but I was curious about a few things, for example, invalidating the cache, but apparently this idea got buried and forgotten about until... today! So yes, it works, and works really well and if that's all you care about, hit up the [docs](https://www.11ty.dev/docs/plugins/fetch/) and you're good to go. I had to see this for myself though.

## My API

I began by creating a quick HTTP-based API on [Val Town](https://www.val.town/dashboard). This API just returned the current time:

```js
export default async function(req: Request): Promise<Response> {
  return Response.json({ generated: new Date() });
}
```

You can see this yourself here: <https://raymondcamden-placidyellowptarmigan.web.val.run/>

Not terribly exciting, but *real* easy to see if caching is working correctly. 

I then scaffolded a super simple Eleventy site. I added a global data file named `apidata.js` to return the API:

```js
export default async () => {

	let req = await fetch('https://raymondcamden-placidyellowptarmigan.web.val.run/');
	return await req.json();
	
}
```

And one quick Liquid file on the home page to render it. 

```html
<h2>Hello World</h2>

<p>
Result from the API is {{ apidata.generated }}.
</p>
```

The final bit was to create a new site on Netlify, connect it to the repo for the site, and test out the publication. This worked fine obviously. 

## Adding Fetch

Following the [directions](https://www.11ty.dev/docs/plugins/fetch/) I then installed the plugin:

```
npm install @11ty/eleventy-fetch
```

And modified my global data file like so:

```js
import Fetch from "@11ty/eleventy-fetch";

export default async () => {

	return await Fetch('https://raymondcamden-placidyellowptarmigan.web.val.run/', {
		duration:'1d',
		type:'json'
	});
}
```

As you can see, the plugin adds a new `Fetch` API that takes a URL and then a value for the cache duration (in this case, one day) and another to enable automatic JSON parsing.

I'm testing locally, so I did a quick build, made a note of the time, and ran it again, and confirmed, yep, it worked. The plugin creates a `.cache` folder which includes metadata about the cached request as well as the value. 

So far so good, and useful. 

## Invalidating the Cache

Getting rid of the cache is easy - just delete the `.cache` folder. Do **not** do what I did and delete the files inside of it. That confused the plugin for some reason. When I switched to just completely nuking it, that worked as expected.

## The Production Site

I then did some testing on Netlify itself. I had my site tied to GitHub so every time I did a deploy, it would get the updates, run Eleventy, and deploy. The Fetch plugin warns you against committing your cache folder so I added that to `.gitignore`.

When testing in Netlify, either via commits or a forced deploy, I saw that Netlify was *not* persisting the cache. I was about to just be ok with that. I do a *lot* of builds locally, especially when working on my blog, but only 10-20 builds on Netlify per month or so, but I did some more digging in the docs and came across [this little tip](https://www.11ty.dev/docs/deployment/#using-netlify-plugin-cache-to-persist-cache) that suggests simply adding the [Netlify Cache plugin](https://www.npmjs.com/package/netlify-plugin-cache)

This required adding another npm package (`npm install netlify-plugin-cache`) and a `netlify.toml` file to specify that `.cache` should persist. 

Once again I deployed, made note of the time, and did a few tests to confirm it worked. Both GitHub commits and manual deploys.

## Invalidating the Cache (in Production)

Invalidating the cache in production is simple enough - just trigger a build **and** specify the clear cache option. Obvious, but you may miss this an option if you haven't clicked before:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/fetch2.jpg" alt="Deploy with clear cache" class="imgborder imgcenter" loading="lazy">
</p>

Honestly, even if this plugin didn't work at all in production I'd still find it really useful, especially in cases where an API call is slow and you don't want it running every time you make a quick change. 

You can see all the code here, <https://github.com/cfjedimaster/eleventy-scratch>, and if you are terribly bored, you can see the site here: <https://eleventyscratch.netlify.app/>. 