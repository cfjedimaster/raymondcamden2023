---
layout: post
title: "Using Intl.RelativeTimeFormat for Localized Relative Timings"
date: "2024-03-07T18:00:00"
categories: ["javascript"]
tags: []
banner_image: /images/banners/cat_watch.jpg
permalink: /2024/03/07/using-intlrelativetimeformat-for-localized-relative-timings
description: A look at how to format relative times in JavaScript
---

I've been singing the praises of the web platform's [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) object for years now, but it still continues to impress me. While I've seen it before, today I came across the [RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) API which looks absolutely fabulous. I played with it a bit and thought I'd share some tips.

## The Basics

The `RelativeTimeFormat` API works like so:

* Given a locale...
* Given a difference (in either a positive or negative value)...
* And given a unit of time, like 'hour' (or 'hours')

Report the difference in the user's desired language. So for example:

* 3 and day, "in 3 days"
* -1 and day, "one day ago"
* 18 and hour, "in 18 hours"

Also, you can specify whether or not to always have a numeric answer. This comes into play when the value of 1 is used. So for example, if you specify 1 and 'day', you can either get, "in 1 day", or "tomorrow". 

Here's an example in code:

```js
const rtf1 = new Intl.RelativeTimeFormat('en');
let diffInDays = rtf1.format(2, 'days');
```

Will return 'in 2 days'. Simple, right? Let's look at the options, and remember the [MDN doc](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat) is your best bet for a full description.

`RelativeTimeFormat` takes a second optional argument for options. Those options include: 

* localMatcher - which gives you more control over what locale is used
* numberingSystem - lets you switch to different ways of representing numbers
* style - can be `long`, `short`, or `narrow` and modifies the output to, well, be shorter. `long` is the default, but in `short` you will see things like 'mo.' instead of 'month'.  
* numeric - I mentioned this above. It can be `always`, the default, or `auto`, and when set to `auto` you'll see stuff like "next month", or "yesterday". 

The `format` method only takes two arguments:

* The number, where a negative value represents the past
* The unit, one of: 'year', 'quarter', 'month', 'week', 'day', 'minute', and 'second'. You can also use the plural forms.

`RelativeTimeFormat` also has a few other related methods you may need I won't cover today, but check the [docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) for info. 

## The Simple Demo

I wanted to play with this myself, so I built a quick demo in CodePen. As a quick aside, when I build demos in CodePen for my blog, I try to avoid using `console` as you can't see it in the embed. To make it easier to share the outputs with you, I used an empty div and this little bit of JavaScript:

```js
const $log = document.querySelector('#log');
const log = s => {
	$log.innerHTML += s + '<br/>';
};
```

This then lets me do stuff like `log('here is the result', foo)`. 

With that out of the way, here's the embed, and you can see two formatters in play - one using the defaults, and one using `numeric=auto` to show you the difference. Also, note that '0' is a valid value for the difference.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="oNObNNX" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/oNObNNX">
  Intl.RelativeTimeFormat</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Easy, right?

<p>
<img src="https://static.raymondcamden.com/images/2024/03/notsofast.webp" alt="Not So Fast" class="imgborder imgcenter" loading="lazy">
</p>

## Using RelativeTimeFormat in the Real World

I think you can see this is an easy API to use, but how do you actually use it with, you know, real data? What I mean is this. Given two dates, what makes sense for the unit? 

For example:

* 3/7/2024 8:00 AM and 3/7/2024 9:20 AM: Do we use minutes or hours? I'd say hours, but I could see minutes being useful.
* 3/7/2024 8:00 AM and 3/6/2023 2:00 PM: Do we use days? Do we use hours?

Also, I think the nature of your content also has a big impact on this decision. For a social media network, I think you would want as precise of a difference as possible: "Ray's Cat posted 'X' one minute ago." Or heck, maybe even to the second: "Ray's Cat posted 'X' 50 seconds ago." 

But would that make sense for a blog, or press release? If you read this post an hour after I post it, I'm probably fine with the difference being reported as 'Today' versus 'One hour ago', or '50 minutes ago'. 

To handle this, we need to first figure out what makes sense for our content, and then handle the technical aspect.

Like most things in life, the 'solution' here will come down to...

<p>
<img src="https://static.raymondcamden.com/images/2024/03/itdepends.jpg" alt="It Depends" class="imgborder imgcenter" loading="lazy">
</p>

Here's one take on handling it. 

Given two dates, in this case, a user selected date and right now, I'm going to do the following:

* Get the difference in milliseconds between the selected date and now.
* Figure out an appropriate unit. If the difference is less than a minute, use seconds. If less than an hour, use minutes. And so forth.
* Then, convert the difference, which was milliseconds, to the value that makes sense for the unit. 

Whew, got that?

I began with this HTML:

```html
<p>
<label for="otherDate">
	Select the date, and a relative value will be passed:
</label>
<input type="datetime-local" id="otherDate">
</p>

<p>
	Relative value: <span id="output"></span>
</p>
```

Note I'm using `datetime-local` as my input type so I can pick both dates and times. Now for the code.

First, some constants:

```js
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const $output = document.querySelector('#output');
const $otherDate = document.querySelector('#otherDate');
```

Then I added a `change` handler to the datetime field:

```js
$otherDate.addEventListener('change', () => {
	let date = new Date($otherDate.value);
	let now = new Date();
	let diff = date - now;
	// negative values are in the past, positive in the future
	let unit = determineUnit(diff);
	console.log(`for ${diff}, unit is ${unit}`);
	let inUnit = toUnit(diff, unit);
	console.log(`value in unit ${inUnit}`);
	$output.innerText = `${rtf.format(inUnit, unit)}`
});
```

As you can see, I get the date, get the difference based on right now, and then call two helper functions. The first determines the unit to use:

```js
// Set of constants that represent how many ms per unit
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
// yeah, this is probably not perfect
const MONTH = 4 * WEEK;
const YEAR = MONTH * 12;

function determineUnit(x) {
	x = Math.abs(x);
	if(x < MINUTE) return 'second';
	if(x < HOUR) return 'minute';
	if(x < DAY) return 'hour';
	if(x < WEEK) return 'day';
	if(x < MONTH) return 'week';
	if(x < YEAR) return 'month';
	return 'year';
}
```

By the way, I skipped `quarter`, but you could modify the code to support that. 

Then I used this function to change the difference to the right value:

```js
// given a value of x, how many of unit is it?
function toUnit(x, unit) {
	if(unit === 'minute') return Math.round(x / MINUTE);
	if(unit === 'hour') return Math.round(x / HOUR);
	if(unit === 'day') return Math.round(x / DAY);
	if(unit === 'week') return Math.round(x / WEEK);
	if(unit === 'month') return Math.round(x / MONTH);
	if(unit === 'year') return Math.round(x / YEAR);
}
```

You can play with the demo below:

<p class="codepen" data-height="300" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="ZEZQEGV" data-editable="true" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/ZEZQEGV">
  Intl.RelativeTimeFormat</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

This works, but brings up yet another issue! Imagine today is March 2nd and I selected February 28th. You could say, rightly, that was 3 days ago. You could also say last month. Last month is simpler, but kinda vague. But maybe months are *really* important in your content. Like, stuff/data/whatever from a previous month has some implications that are important. In that case, you would want to show 'last month', not '3 days ago'.

Again, it depends.

That being said, I *really* love Intl and it's one of my favorite parts of the web platform. I'd love to know if you've used this, or any part of Intl really. Leave me a comment below!