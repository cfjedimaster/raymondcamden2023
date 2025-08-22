---
layout: post
title: "Unit Formatting with Intl in JavaScript"
date: "2025-08-22T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/measuring_spoons.jpg
permalink: /2025/08/22/unit-formatting-with-intl-in-javascript
description: Number formatting with units in JavaScript with Intl
---

It's been a little while since I last blogged about my favorite web platform feature, [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl). I think it was maybe two or so years ago when I was prepping for my first conference talk on the topic and using that as an opportunity to dig much deeper into the spec then I had before and wow, I was unprepared for how flexible, and powerful, this functionality is in the browser. 

I blogged about [localized relative timings](https://www.raymondcamden.com/2024/03/07/using-intlrelativetimeformat-for-localized-relative-timings) back in March of 2024 (ah, I remember March 2024, I had a job then), and discussed how to dynamically handle different quantities of time differences. 

More recently, I blogged about [dynamic time durations](https://www.raymondcamden.com/2025/02/13/using-intldurationformat-for-localized-durations) and how best to select the right duration for the formatter object. 

In both cases, the interesting aspect wasn't so much Intl, but rather, how best to *use* Intl when rendering your results. It was a pretty fascinating set of posts I think (ok, I'm biased perhaps) and I'm glad I investigated those parts of the spec.

Today I'm looking at another part of Intl - number formatting with units. When working with [NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat), the `style` option of the constructor reflects what kind of formatting you want to do. The options are:

* decimal (default)
* currency (money money money)
* percent 
* unit

That last one may not be obvious and is the focus of my post today. Unit formatting is used for formatting a number of a certain type of thing, so for example, 5 ounces of water, or 9 pounds of sugar. Intl lets you handle formatting those measurements in a locale specific format. Let's look at some examples.

## What's the Unit, man?

First off, what unit values are supported? There's an API for that! The [`Intl.supportedValuesOf()`] method can return valid values of units like so:

```js
units = Intl.supportedValuesOf('unit');
```

Those values, as of today, in my browser, are:

* acre
* bit
* byte
* celsius
* centimeter
* day
* degree
* fahrenheit
* fluid-ounce
* foot
* gallon
* gigabit
* gigabyte
* gram
* hectare
* hour
* inch
* kilobit
* kilobyte
* kilogram
* kilometer
* liter
* megabit
* megabyte
* meter
* microsecond
* mile
* mile-scandinavian
* milliliter
* millimeter
* millisecond
* minute
* month
* nanosecond
* ounce
* percent
* petabyte
* pound
* second
* stone
* terabit
* terabyte
* week
* yard
* year

I built a simple demo for this that let's you enter an arbitrary numeric value, select a unit, and it renders the results in seven different locales:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="WbQJmzq" data-pen-title="Intl Unit Test1" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/WbQJmzq">
  Intl Unit Test1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## Formatting Bytes

Ok, so the *whole* reason I actually went down this route of research this week was for a simple task - given a file size in bytes, I wanted to format in kilobytes, megabytes, and so forth. I was curious if Intl maybe had this baked in, and it doesn't... not exactly. As with the blog posts I mentioned from earlier, it's up to you to decide what unit of measure to use, i.e., what makes sense, and then you can use Intl to render it properly.

Now, here's where I have to make a confession. I had Googled for this, and Google actually spat out a JavaScript function to do this for me. And... from what I could see... it worked well and was kinda clever. Here's the function it created:

```js
function formatBytes(bytes, locale = 'en-US') {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);

  const formatter = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: units[i],
    unitDisplay: 'narrow', // or 'short', 'long'
    maximumFractionDigits: 2, // Adjust as needed
  });

  return formatter.format(value);
}
```

The clever part comes in from figuring out what 'level' of size to use, from byte to terabyte, but doing a bit of match. Honestly, that never would have occurred to me and is a prime reason I fail those high end coding challenges in interviews. I'm ok with that. Probably the only thing I'd change in that is to swap out the default of `en-US` to `navigator.language`. 

That being, I whipped up another CodePen that takes in a set of inputs and renders them for multiple locales. I'll share the CodePen below, but make special note of this:

```js
let inputs = [1_024, 2_500_000, 5_000_000_000, 123, 5_000_000_000_000];
```

Don't forget that JavaScript lets you add underscores in numbers to make them easier to read. They're completely ignored by the parser. Alright, here's the demo:

<p class="codepen" data-height="700" data-theme-id="dark" data-default-tab="result" data-slug-hash="dPYmXWK" data-pen-title="Untitled" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/dPYmXWK">
  Untitled</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Let me know if you've got any questions, or anything else in `Intl` you would like me to dig into!

<p class="attribution">"<a rel="noopener noreferrer" href="https://www.flickr.com/photos/57768536@N05/11834825614">Round Measuring Spoons</a>" by <a rel="noopener noreferrer" href="https://www.flickr.com/photos/57768536@N05">Theen ...</a> is licensed under <a rel="noopener noreferrer" href="https://creativecommons.org/licenses/by-nc-sa/2.0/?ref=openverse">CC BY-NC-SA 2.0 <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" style="height: 1em; margin-right: 0.125em; display: inline;" /><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" style="height: 1em; margin-right: 0.125em; display: inline;" /><img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" style="height: 1em; margin-right: 0.125em; display: inline;" /><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" style="height: 1em; margin-right: 0.125em; display: inline;" /></a>.</p>