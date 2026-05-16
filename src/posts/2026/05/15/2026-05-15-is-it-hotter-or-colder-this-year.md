---
layout: post
title: "Is it hotter or colder this year?"
date: "2026-05-15T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_rain2.jpg
permalink: /2026/05/15/is-it-hotter-or-colder-this-year
description: Using data to see how current temperatures compare. 
---

Where I live could generously be called "warm", but is usually closer to the surface of the sun, especially in late summer. That's why when the weather is *not* oppressively hot, I try my best to enjoy it. We're mid-May now and honestly, this spring has been... pleasant. Suspiciously pleasant but I'll take what I can get. 

The last few weeks I've been telling myself that the weather must be a good bit cooler than last year, and I finally decided to do something about it. I worked with Claude and created a little web app that:

* Lets you enter a free form address and then use [Geocoding](https://www.geocod.io/) to convert it to a proper longitude and latitude. This is a super simple geocoding API with a generous free tier. Do note though it's North America only. 
* Uses the [Pirate Weather](https://pirateweather.net/en/latest/) API to get historical weather information. Date wise, I'm using this week, and then the same days over the previous four days.

As I mentioned, I worked with Claude on this and let it design the layout and write the code initially. I was kinda impressed by one part - the `mapWithConcurrency` function that lets you pass an array of async function with a desired max number to run at once. It handles doing the batching and returning the final result. That makes the calls for the weather data a bit more gentle on the provider.

However - I noticed it was taking a *long* time to finish. In theory, I'm doing 7 times 5 (this week plus four previous years) of calls which is 35 which doesn't *seem* like a lot, but I did some digging. Claude had used an endpoint that was a bit old. Doing some more research I switched to the proper endpoint... which didn't support CORS.

Oh no! 

Oh - actually - I just moved to this to [val.town](https://val.town) and built a quick server side proxy. It takes in the same arguments that's send to my client side code (lat, lng, and a timestamp), and passes it to the historical Pirate Weather endpoint. So here's the frontend code - again - this is being driven by a concurrency function:

```js
async function fetchDayTemperatures(lat, lng, unixSeconds) {
  let req = await fetch(PIRATE_WEATHER_API_BASE, {
    method: "POST",
    body: JSON.stringify({
      lat,
      lng,
      unixSeconds,
    }),
  });
  return await req.json();
}
```

And here's the backend code:

```js
export default async function (req: Request): Promise<Response> {
  const body = await req.json();
  const key = Deno.env.get("PIRATE");

  const url = new URL(
    `https://timemachine.pirateweather.net/forecast/${key}/${body.lat},${body.lng},${body.unixSeconds}`,
  );
  url.searchParams.set("units", "us");
  url.searchParams.set("exclude", "minutely,hourly,alerts,flags");

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Weather lookup failed.");
  }

  const day = payload.daily?.data?.[0];
  if (!day) {
    throw new Error("Weather data did not include a daily summary.");
  }

  return Response.json({
    timezone: payload.timezone,
    high: day.temperatureMax,
    low: day.temperatureMin,
  });
}
```

I barely modified this from the original client side code - only switching to an environment variable for the API (their API is free, but I might as well) and returning a proper `Response` object.

Here's a screenshot of it in action:

<p>
<img src="https://static.raymondcamden.com/images/2026/05/weather.png" loading="lazy" alt="Screenshot" class="imgborder imgcenter">
</p>

You can try this yourself here: <https://weathercomparison.val.run/>. If you want to see the code, and possibly fork the val, you can do so here: <https://www.val.town/x/raymondcamden/weather-comparison>

## So, was it cooler?

No. I was wrong. Last year was cooler than this year, but the three years before that were all higher, with 2022 being pure hell. I remember that year seeing the city working on a road that had literally buckled because of heat. 

Photo by <a href="https://unsplash.com/@peteralbanese?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Peter Albanese</a> on <a href="https://unsplash.com/photos/black-and-white-cat-on-glass-window-K9_Igf8ZpC0?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      