---
layout: post
title: "Using Intl.DurationFormat for Localized Durations"
date: "2025-02-13T18:00:00"
categories: ["javascript"]
tags: []
banner_image: /images/banners/cat_clock.jpg
permalink: /2025/02/13/using-intldurationformat-for-localized-durations
description: An example of using the web platform's duration formatting feature.
---

Last year I had the opportunity to give a talk on the web platform's [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) specification. This made me incredibly happy because in preparing for the presentation, I discovered so many cool features and capabilities of the spec that I had no idea existed. Almost a year ago, I wrote up a [blog post on Intl.RelativeTimeFormat](https://www.raymondcamden.com/2024/03/07/using-intlrelativetimeformat-for-localized-relative-timings), talking about how the API was easy to use, but perhaps a bit difficult when dealing when determining the best values to use when formatting dynamic dates. Today, I'm going to turn my attention to a related spec, [Intl.DurationFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat)

## The Basics

The `DurationFormat` API works like so:

* Given a locale (defaulting to the browser's locale)
* Given a set of values representing time in different units (days, hours, etc)
* Given a 'style' (long, short, narrow, and digital)
* Report the duration in the desired locale

So for example, you can define a duration like so:

```js
let duration = {
	days: 1, 
	hours: 5, 
	minutes: 32
}
```

I can then create a localized string for the duration like so:

```js
let durationFormatter = new Intl.DurationFormat(navigator.language, 
													{ style: 'long' });

dur = durationFormatter.format(duration);
```

Which reports: `1 day, 5 hours, 32 minutes`. Changing the locale to `fr` gives `1 jour, 5 heures et 32 minutes`. That's with the long style, in `short` form you get `1 day, 5 hr, 32 min` and `1 j, 5 h et 32 min`. The narrow form is shorter while `digital` looks more like a digital clock and is better for durations less than a day. For example, if I just pass hours and minutes from the above input, I'd get: `5:32:00`. 

I built a quick demo showing three locales and all four styles that you can play with below.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="LEYEgbo" data-pen-title="Quick DurationFormat Demo" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/LEYEgbo">
  Quick DurationFormat Demo</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## Using DurationFormat with Real Data

Ok, so given the fact that you have to spell out the duration in units, how do you handle dynamic values? You can't just take the difference between two dates because if you pass a large number, the formatter takes it as is. So for example:

```js
let duration = {
	minutes: 360
}
```

This will be reported as 360 minutes, not 6 hours. And to be fair, I feel that's the right behavior. It's formatting exactly what you told it too, and you may indeed want hours. *Typically* though folks want something a bit more 'condensed', ie, a total number of days lets say, then hours, minutes, and maybe seconds. As with my [earlier post](https://www.raymondcamden.com/2024/03/07/using-intlrelativetimeformat-for-localized-relative-timings) on relative time formatting, what you may want to use here depends on your data and your users. 

Given that it's a bit up in the air, let's build a simplistic solution that attempts to break things down to year, months, weeks, days, hours, minutes, and seconds. The API can get more precise, but let's keep it at that. I'd also argue that any duration that may include years, or months, should probably *not* include weeks. I wouldn't tell someone it took three months, one week, and 2 days to do something. Well, heck, I don't know, maybe I would. But 'week' feels like something I'd not use in a larger duration. As with, well just about anything in our field, "it depends". 

I began by adding two date fields:

```html
<p>
<label for="date1">Date 1</label>
<input type="datetime-local" id="date1">
</p>

<p>
<label for="date2">Date 2</label>
<input type="datetime-local" id="date2">
</p>
```

This lets you, my dear reader, test with any values. I then added a dropdown the style:

```html
<p>
<label for="style">Style:</label>
<select id="style">
	<option>long</option>
	<option>short</option>
	<option>narrow</option>
	<option>digital</option>
</select>
</p>
```

Beneath that is an empty div so I can show the result. Now let's turn to the code. First, I've got a bunch of code to check the DOM and register listeners. I want my code to run on any date or style change:

```js
let $result = document.querySelector('#result');
let $style = document.querySelector('#style');
let $date1 = document.querySelector('#date1');
let $date2 = document.querySelector('#date2');

$date1.addEventListener('input', handleDuration, false);
$date2.addEventListener('input', handleDuration, false);
$style.addEventListener('change', handleDuration, false);
```

Next, I defined a set of constants that represent a duration by unit, ie, this is how big a year is versus an hour.

```js
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
// yeah, this is probably not perfect
const MONTH = 4 * WEEK;
const YEAR = MONTH * 12;

```

As the comment says, my `MONTH` logic there is absolutely not precise. Now let's look at the main logic thats run on changes to the form fields:

```js
function handleDuration() {
	let d1 = $date1.value;
	let d2 = $date2.value;
	
	if(!d1 || !d2) return;

	$result.innerHTML = '';
	
	d1 = new Date(d1);
	d2 = new Date(d2);
	let diff = Math.abs(d1.getTime() - d2.getTime());
	console.log(d1, d2, 'diff', diff);
	
	let durationFormatter = new Intl.DurationFormat(navigator.language, 
													{ style: $style.value });

	let result = {
		years:0, 
		months:0,
		weeks:0,
		days:0,
		hours:0, 
		minutes:0,
		seconds:0
	};
	
	if(diff >= YEAR) {
		result.years = Math.floor(diff/YEAR);
		diff -= result.years * YEAR;
	} 

	if(diff >= MONTH) {
		result.months = Math.floor(diff/MONTH);
		diff -= result.months * MONTH;
	}
	
	if(diff >= WEEK) {
		result.weeks = Math.floor(diff/WEEK);
		diff -= result.weeks * WEEK;
	}

	if(diff >= DAY) {
		result.days = Math.floor(diff/DAY);
		diff -= result.days * DAY;
	}

	if(diff >= HOUR) {
		result.hours = Math.floor(diff/HOUR);
		diff -= result.hours * HOUR;
	}

	if(diff >= MINUTE) {
		result.minutes = Math.floor(diff/MINUTE);
		diff -= result.minutes * MINUTE;
	}
	
	if(diff > 0) result.seconds = diff / 1000;
	
	console.log('Result',result);

	let test1Result = durationFormatter.format(result);
	$result.innerHTML += `First Result: ${test1Result}`;
}
```

Basically my logic is - build up a structure for my duration based on seeing if my duration in miliseconds is bigger than a year, then a month, and so on. I can then pass my structure to the `format` function and render it. This *seems* to work ok, check it out below. 

<p class="codepen" data-height="400" data-theme-id="dark" data-default-tab="result" data-slug-hash="RwXmWXm" data-pen-title="Intl.DurationFormat" data-editable="true" data-user="cfjedimaster" style="height: 400px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/RwXmWXm">
  Intl.DurationFormat</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Obviously this could be overkill based on your data. For example, you may know for a fact that your durations will never be over an hour and your users will only care about durations in minutes, not seconds. Let me know if you've used this as I love to hear about `Intl` use in the wild!
