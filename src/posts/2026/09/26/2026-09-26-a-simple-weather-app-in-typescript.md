---
layout: post
title: "A Simple Weather App in TypeScript"
date: "2026-09-26T18:00:00"
categories: ["development"]
tags: ["javascript","typescript","alpinejs"]
banner_image: /images/banners/typewriter2.jpg
permalink: /2026/09/26/a-simple-weather-app-in-typescript
description: How I built an incredibly simple weather app.
---

Happy Sunday, my fellow nerds. If you've been keeping up with my posts (all 4 of you - thank you!) then you know I've been experimenting with TypeScript (and Vite) recently. This past week I decided to try building a real "app", and of course by app I mean something incredibly small, but a bit "real world"-ish to kind of get a feel for what the development process felt like. 

I decided on a fairly simple weather application. The application would prompt you for a location. That location gets geocoded to longitude and latitude values. With those values, I'd grab a simple weather forecast. After you add one, you can add another, and delete as well. Finally, all the values are stored in local storage so that on reload you get the same values loaded immediately. 

If you actually want to see this - you can head over to <https://weather-app-ts-vite-alpine.netlify.app/>. The complete source may be found here: <https://github.com/cfjedimaster/typescript-stuff/tree/main/weather-demo>. Now let me dig into what I discovered while building it.

## The One Thing

Let me start off with what I think is the biggest thing that clicked with me. While building out the various parts and using (at least some) of the TypeScript features, I immediately ran into probably the biggest win - immediate feedback in my editor when I had screwed things up. And yea, I know that's something TypeScript provided since day one, but it's also a bit different to kind of see it in action while building the app. Especially since I had two or three times when I had to refactor how I was doing things. Having the types in place (specifically for my remote API calls) helped keep things in order across the different moving parts. 

I also found myself being forced to think more about how those parts interacted. So for example, a wrapper to my geocoding service - I instinctively knew what I had wanted - but having it spelled out in code actually made me see possible issues - modify my approach - and so forth - all earlier than I would have in my usual development process. 

Again - this wasn't necessarily a surprise to me. This all fell in line with what I knew about TypeScript and what I had expected. But never having built an app from scratch with TypeScript before it still felt pretty cool to actually see all this play out. 

## The Architecture 

It feels a bit silly to talk about the architecture of such a small little app, but this is how I built out the parts. 

* Once again, I used Vite.
* On top of that, I used Alpine.js. In case you missed it, my [last blog post](https://www.raymondcamden.com/2026/09/22/a-simple-alpinejs-template-with-vite-and-typescript) discussed how to do this.
* The main page handles displaying the 'weather cards' along with a simple form to add new locations.
* When a location is entered, I use the excellent [Geocodio](https://www.geocod.io/) API to translate it into longitude and latitude.
* With that information, I use the [Pirate Weather](https://pirateweather.net/) API to get the forecast.

## The UI

As mentioned above, this was a Vite and Alpine app, but I also decided to try adding a UI library in as well. I picked [Web Awesome](https://webawesome.com/) primarily for the Card element. I've used this library in the past (when it was called Shoelace) and I really like it, especially as it uses web components. They also make it easy to only import what you need. 

In my `main.ts`, this came down to:

```ts
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
```

With this in place, it was a simple matter to use the components. As an example:

```html
<div class="wa-flank:end wa-gap-xs">
<wa-input placeholder="New Location (America, Canada, Mexico, UK only)" x-model="newLocation"></wa-input>
<wa-button variant="brand" @click="addLocation(newLocation)">Add</wa-button>
</div>
```

Make note of the classes on the `div` tag there. That comes from Web Awesome's various utility classes and this was a place where I leaned on my AI tool to help. 

Here's the entirety of the main HTML page which shows you both Web Awesome in play as well as my Alpine directives:

```html
<!doctype html>
<html lang="en" class="wa-dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Weather Demo</title>
  </head>
  <body>
    <div x-data="app" class="container wa-stack">

      <header>
        <h1>Weather Demo</h1>
      </header>

      <template x-if="locations.length === 0"> 
        <p>No locations added yet. Add a location to get started.</p>
      </template>
      <div class="wa-grid wa-gap-1" style="--min-column-size: 30ch;">
      <template x-for="(location,index) in locations" :key="location.name">
        <wa-card class="card-basic" >
          <h3 slot="header" x-text="location.name"></h3>
          <wa-button appearance="plain" @click="removeLocation(index)" slot="header-actions">
            <wa-icon name="trash" variant="solid" label="Delete"></wa-icon>
          </wa-button>
          <template x-if="location.weather">
            <p x-html="`Temperature: ${location.weather.temperature}°F<br/>Condition: ${location.weather.summary}<br>Low: ${location.weather.low}°F<br/>High: ${location.weather.high}°F`"></p>
          </template>
          <template x-if="!location.weather">
            <p>Loading weather data...</p>
          </template>
        </wa-card>
      </template>
        </div>

      <div class="wa-flank:end wa-gap-xs">
      <wa-input placeholder="New Location (America, Canada, Mexico, UK only)" x-model="newLocation"></wa-input>
      <wa-button variant="brand" @click="addLocation(newLocation)">Add</wa-button>
      </div>

    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

## The Three "Services"

I'm using "services" in quotes there as it feels a bit overly dramatic to name it as such, but I broke out three parts into their own files - one for geocoding, one for the weather, and one for storage. Let's start with storage first.

This file wraps the calls to LocalStorage and in theory - I could easily switch out to IndexedDB in the future - but I'd have to mark the functions `async` of course:

```ts
import type { SavedLocation } from './types';

// This is where it's stored in localStorage. 
const KEY = 'weather-locations';

// Type guard: checks at runtime that an unknown value really is a SavedLocation.
// localStorage can contain anything (old versions of your app, manual edits),
// so we validate instead of trusting it.
// Ray, in case you forget, the value is means that if the function returns true, 
// it's ok for TS to consider the value as of type SavedLocation
function isSavedLocation(value: unknown): value is SavedLocation {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === 'string' &&
    typeof v.longitude === 'number' &&
    typeof v.latitude === 'number'
  );
}

export function getLocations(): SavedLocation[] {
  const locations = localStorage.getItem(KEY);
  if(!locations) return [];

  const parsed = JSON.parse(locations);
  return Array.isArray(parsed) ? parsed.filter(isSavedLocation) : [];
}

export function addLocation(location: SavedLocation): void {
  const locations = getLocations();
  locations.push(location);
  localStorage.setItem(KEY, JSON.stringify(locations));
}

export function removeLocation(index: number): void {
  const locations = getLocations();
  locations.splice(index, 1);
  localStorage.setItem(KEY, JSON.stringify(locations));
}
```

The first thing you see on top is importing a type that defines what a 'stored location' is in terms of my application. From that file, here is the definition:

```ts
export type SavedLocation = {
  name: string;
  longitude: number;
  latitude: number, 
  weather?: WeatherData;
};
```

This should mostly make sense - the name comes from the user, the longitude and latitude from the geocoding service. 

The weather part actually comes *after* the app loads in the existing values from local storage and hits the weather API. There's a part of me that looks at that and thinks maybe I should have a type for the "stored" value and one for the "live" value. I also think I could possibly cache the weather so that on reload it's quicker, but weather data is the kind of thing that gets stale pretty quickly. 

Here's that file:

```ts
import type { WeatherData } from './types';

const KEY = import.meta.env.VITE_PIRATE_KEY as string;

export async function getWeather(lat: number, lng: number): Promise<WeatherData> {
    const req = await fetch(`https://api.pirateweather.net/forecast/${KEY}/${lat},${lng}?units=us&exclude=minutely,hourly,alerts,flags`);
    const res = await req.json();

    return {
        summary: res.currently.summary,
        temperature: res.currently.temperature,
        low: res.daily.data[0].temperatureLow,
        high: res.daily.data[0].temperatureHigh
    };

}
```

And here's the type:

```ts
export type WeatherData = {
  summary: string;
  temperature: number;
  low: number;
  high: number;
}
```

Finally, here's the geocoding wrapper:

```ts
import type { GeoCodedLocation } from './types';

// Only the fields we use from Geocodio's "simple" format
type GeocodioSimpleResponse = {
  lat?: number;
  lng?: number;
};

const KEY = import.meta.env.VITE_GEOCODIO_KEY as string;

export async function geoCode(location: string): Promise<GeoCodedLocation> {
    const req = await fetch(`https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(location)}&format=simple&api_key=${KEY}`);
    const res = (await req.json()) as GeocodioSimpleResponse;

    if(!res || !res.lat || !res.lng) {
        throw new Error('No results');
    }

    return { lat: res.lat, lng: res.lng };
}
```

You'll notice I do the HTTP call slightly different here. I've got an inline type here that defines what is being used from Geocodio. I'll be honest and say I want to think about these two approaches and figure out when I should use each. I mean, when you look at `GeoCodedLocation`:

```ts
export type GeoCodedLocation = {
  lat: number;
  lng: number;
};
```

I honestly don't get the point of the inline type as well. I was having AI help me a bit, so it's on me to nail down if this makes sense in the context of the file. I'll be returning to that soon.

## The Core App

Now let's put it together with my core file - which is mainly Alpine.js specific:

```ts
import Alpine from 'alpinejs';

import '@awesome.me/webawesome/dist/styles/webawesome.css';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import './style.css';

import type { SavedLocation } from './types';
import { getLocations, addLocation, removeLocation } from './storage';
import { getWeather } from './weather';
import { geoCode } from './geocode';

Alpine.data('app', () => ({
  locations: [] as SavedLocation[],
  newLocation: '',
  init() {
    this.locations = getLocations();
    if(this.locations.length > 0) {
      this.hydrateWeather();
    }
  },
  async addLocation(location: string) {
    if(!location) return;
    const geo = await geoCode(location);
    const newLoc: SavedLocation = { name: location, longitude: geo.lng, latitude: geo.lat };
    this.locations.push(newLoc);
    // just noticed my method is addLocation as is the imported one. works but - eww. 
    addLocation(newLoc);
    this.newLocation = '';
    // in theory it is wasteful to hydrate ALL of them, but it's a super quick call
    this.hydrateWeather();
  }, 
  removeLocation(index: number) {
    this.locations.splice(index, 1);
    // same issue with naming - advice?
    removeLocation(index);
  },
  async hydrateWeather() {
    for(const loc of this.locations) {
      const weather = await getWeather(loc.latitude, loc.longitude);
      loc.weather = weather;
    }
  }
}));

Alpine.start();
```

If you actually took the time to read all that, you can see I wrote a few questions to myself. By accident, I ended up having Alpine methods with the same name as methods in my services, and that *really* bugs me... but it also works... so... yeah. It's kinda clear that `this.something` is Alpine and `something` is being imported in, but I still don't care for that. How would you rename things? (And I'd assume the rename would be on the Alpine side.) 

I also notice a few lines where I didn't define my type. A quick search shows that by adding `strict:true` to my `tsconfig.json` would fix that. I know in the past I've seen that in projects and it's annoyed the heck out of me, so I get why Vite's scaffold doesn't include it, but for my next project, I'm going to turn that on so I can be a bit more precise in my learning with TypeScript.

## Your Turn!

Ok, I know blogging is dead (again) and no humans read these posts again, but if you are reading this, and know TypeScript well, I'd **love** any and all feedback! Give me a comment below and help me keep learning this.

Photo by <a href="https://unsplash.com/@patrickian4?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Patrick Fore</a> on <a href="https://unsplash.com/photos/black-corona-typewriter-on-brown-wood-planks-0gkw_9fy0eQ?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>