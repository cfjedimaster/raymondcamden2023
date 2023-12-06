---
layout: post
title: "Awesome Netlify Updates"
date: "2023-12-06T18:00:00"
categories: ["jamstack"]
tags: ["netlify"]
banner_image: /images/banners/netlify.jpg
permalink: /2023/12/06/awesome-netlify-updates
description: A look at some really cool recent Netlify updates.
---

For about two months now I've had on my queue to write about some of the *incredibly* cool updates [Netlify](https://netlify.com) has released but I just didn't have the time. I've been hosting this blog on Netlify for a few years now and have been incredibly happy with the platform, but the updates the past two months have been both surprising and just really freaking cool. Here's a quick look at what impressed me. As a quick aside, this isn't necessarily everything announced recently and you can take a look yourself at their [blog](https://www.netlify.com/blog/news/) for more changes.

## Caching Improvements

This is an area I haven't really done much in - both on my site or elsewhere. I generally let Netlify worry about the hosting/caching/etc for my site. But one of the first improvements that caught my eye was the ability to add [caching in Edge Functions](https://www.netlify.com/blog/swr-and-fine-grained-cache-control/). I'm going to borrow the code from their post as an example:

```js
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    console.log("Regenerating String")

    const headers = {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=0, must-revalidate", // Tell browsers to always revalidate
        "Netlify-CDN-Cache-Control": "public, max-age=31536000, must-revalidate", // Tell Edge to cache asset for up to a year
    }

    return {
        statusCode: 200,
        body: "Hello, World!",
        headers
    }
};

export { handler };
```

Looks simple enough, but what I really like is that redeploying your site automatically invalidates the cache. Also supported is SWR, which if I read right, lets you return a cached response while the code figures out new data for future requests. 

Netlify followed up this announcement with news of a [Purge API](https://www.netlify.com/blog/cache-tags-and-purge-api-on-netlify/) which details how you can use tagging and an API for further control of the cache. If I read it correctly (and again, I'll point out this is an area I haven't really worked with), it looks like you can use tags as a way to handle cache purging based on very specific needs, letting you delete one part of your cache while ignoring another. 

Both of the blog posts listed above also have links to demo repositories so definitely check that out, and here are those two articles again for easy reading:

* [SWR &amp; Fine Grained Cache Control on Netlify](https://www.netlify.com/blog/swr-and-fine-grained-cache-control/)
* [Cache-tags & Purge API on Netlify](https://www.netlify.com/blog/cache-tags-and-purge-api-on-netlify/)

## Netlify Functions 2.0

Netlify Functions were first introduced back in 2018, and while there's *many* serverless providers out there, I really appreciated how I could bundle both my Jamstack site along with my serverless functions all in one repo. I really prefered that versus using an external provider. 

Now this feature has been majorly updated with the [2.0 release](https://www.netlify.com/blog/introducing-netlify-functions-2-0/). The changes are numerous.

First, the entire way you write a function has changed, including access to additional [context information](https://docs.netlify.com/functions/api/#netlify-specific-context-object) and how you return information. Here's what Hello World looks like now:

```js
export default async (req, context) => {

  return new Response("Hello World")
}
```

I'm especially interested in the `geo` data available in the context object. So for example, here is what it returns when I hit code using it:

```json
{
    "city": "Lafayette",
    "country": {
        "code": "US",
        "name": "United States"
    },
    "subdivision": {
        "code": "LA",
        "name": "Louisiana"
    },
    "timezone": "America/Chicago",
    "latitude": 30.181,
    "longitude": -92.0477
}
```


Along with that - you now also get:

* Custom endpoint: Previously doable via redirect rules, now your code can simply specify a route.
* Routing: Even cooler, you can specify a route with parameters, like `/cats/:id`, and those parameters are then available in your code.
* Method matching: You can now specify that a function only works for particular HTTP methods.
* Easier streaming of data.

If you want, you can test out the geo context stuff here: <https://netlify-scratch.netlify.app/whereami>

The code for this is::

```js
export default async (req, context) => {

  return new Response(JSON.stringify(context.geo), {
    headers:
      { 'Content-Type':'application/json' }
    
  });

};

export const config = {
  path: "/whereami"
}
```

Also, check out this great article by my buddy Brian Rinaldi on migrating to the new syntax: [Updating Your Netlify Functions to 2.0](https://remotesynthesis.com/blog/netlify-functions-2-0/). It's important to note that you do not *need* to migrate, the "old" way will continue to work.

Here is the related blog post on Functions 2.0:

* [Introducing Netlify Functions 2.0](https://www.netlify.com/blog/introducing-netlify-functions-2-0/)
* [Docs](https://docs.netlify.com/functions/overview/)

## Built-in Image Optimization

I've been a *huge* fan of [Cloudinary](https://www.cloudinary.com) since first discovering their service a year ago (check out my [posts](https://www.raymondcamden.com/tags/cloudinary) on them for examples). If you aren't aware, they let you do an *incredible* amount of image transformations literally on the fly just by crafting a URL. I'm not surprised at all that Netlify announced a [beta for their own image CDN](https://www.netlify.com/blog/introducing-netlify-image-cdn-beta/). Currently, they support three transformations - resizing, cropping, and formatting. 

Here's an example:

```html
<img src="/.netlify/images?url=/images/bigcat.jpg&w=200">
```

The original image was 900x900, but routed via the Image CDN, it gets proportionally resized to a width of 200 and returns a much smaller image. Even cooler, you can use a redirect rule to simplify this (I borrowed this from their docs):

```
/transform-small/* /.netlify/images?url=/:splat&w=50&h=50 200
```

If you want to see this line, check out: <https://netlify-scratch.netlify.app/>. As a quick aside, this works just fine locally when using `netlify dev` which is handy!

Here's more information:

* [Introducing Netlify Image CDN Beta](https://www.netlify.com/blog/introducing-netlify-image-cdn-beta/)
* [Docs](https://docs.netlify.com/image-cdn/overview/)

## Blob Support

Unfortunately, this feature has nothing to do with this...

<p>
<img src="https://static.raymondcamden.com/images/2023/12/blob.jpg" alt="The classic Blob from the old sci-fi movie" class="imgborder imgcenter" loading="lazy">
</p>

Instead, this [announcement](https://www.netlify.com/blog/introducing-netlify-blobs-beta/) refers to a simple unstructured data storage system available to your site. Data can be scoped to a site or deploy and exists within a particular 'store'. Both "regular" and binary data can be stored, making it useful for many different use cases. Here's an incredibly trivial hit counter:

```js
import { getStore } from "@netlify/blobs";

export default async (req, context) => {

  const store = getStore("hitcounter");
  let hits = await store.get("hits");
  if(!hits) hits = 0;
  hits++;
  await store.set("hits", hits);

  return new Response(JSON.stringify({hits}), {
    headers:
      { 'Content-Type':'application/json' }
    
  });

};

export const config = {
  path: "/hits"
}
```

In the code above, I have a store, `hitcounter`, and one value, `hits`, which is a simple number. I deployed this to the `/hits` path and you can see it here in action: <https://netlify-scratch.netlify.app/hits>

One quick thing to note if you try this locally. Don't forget you want to run `netlify link` to 'connect' your local site to your Netlify deployed site. If you forget, you'll get an error but it wasn't immediately clear how simple it was to fix. 

I'm not sure I'd throw out my database just yet, but this looks to be a really good, and built-in, feature. I want to play more with it later and will share what I build. Again, here's the related links:

* [Introducing Netlify Blobs Beta](https://www.netlify.com/blog/introducing-netlify-blobs-beta/)
* [Docs](https://docs.netlify.com/blobs/overview)

## Wrap Up

So yeah, I started this post off by saying I was a very satisfied customer of [Netlify](https://www.netlify.com), but I got to say I was blown away by the amount of updates over the past few months. If this is any indication about the future of the service, I'm going to continue being a happy customer!