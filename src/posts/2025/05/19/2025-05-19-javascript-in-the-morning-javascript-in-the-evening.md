---
layout: post
title: "JavaScript in the morning, JavaScript in the evening..."
date: "2025-05-19T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_at_night.jpg
permalink: /2025/05/19/javascript-in-the-morning-javascript-in-the-evening
description: A look at Intl and the dayPeriod value.
---

I've been a huge fan of the [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) spec for sometime, having done multiple presentations and blog posts on the topic. Every time I think I've explored it completely, I come across another interesting gem. Today I'm going to share one that is possibly not something you would use, but it's a curious feature of the spec I wanted to dig more into.

When formatting dates with [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat), you've got a large set of customizations you can use to display dates exactly as you want. I recently came across an interesting part of the formatting options, [dayPeriod](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#dayperiod). 

According to MDN, this specifies:

<blockquote>
The formatting style used for day periods like "in the morning", "am", "noon", "n" etc. Possible values are "narrow", "short", and "long".
</blockquote>

So consider this:

```js
let result = new Intl.DateTimeFormat('en-US', { dayPeriod:'long' }).format(new Date());
```

Which right now returns, "in the afternoon". You can test it yourself below, and obviously the value will be something different.

<p class="codepen" data-height="300" data-theme-id="dark" data-default-tab="result" data-slug-hash="xbbNYOG" data-pen-title="Untitled" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/xbbNYOG">
  Untitled</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Ok... that's... interesting. Like, I can't imagine having an event calendar and using this in the display. I mean, I think most people understand that 8AM is the morning and 8PM is night. It's possible someone may not know AM vs PM. And of course, if you use a 24 hour clock than it makes even less sense. 

I just really can't see myself using this, but, I was intrigued. When does morning end? When does afternoon switch to night? At least according to the browser that is. So I built a tool to let me test. 

I began with a date that represents today, but at midnight.

```js
const initialDate = new Date();
initialDate.setHours(0,0,0,0);
```

Given that, I then looped over 24 hours and got the result. I also tried all three variations of dayPeriod.

```js
let uniquePeriods = new Set();

for(let i=0;i<24;i++) {

	let formatted = new Intl.DateTimeFormat(locale, {
		"dayPeriod": "long"
	}).format(date);
	
	let short = new Intl.DateTimeFormat(locale, {
		"dayPeriod": "short"
	}).format(date);
	
	let narrow = new Intl.DateTimeFormat(locale, {
		"dayPeriod": "narrow"
	}).format(date);
	
	uniquePeriods.add(formatted);
	log(`Hour: ${padNum(date.getHours())}, day period: ${formatted}, short = ${short}, and narrow = ${narrow}`);
	initialDate.setHours(date.getHours() + 1);
}
```

The `log` function there just writes to HTML, making it easier to see in CodePen. I took this code and added a form field to let you specify a locale. I also was curious how many *unique* values for the day period existed and if that changed by locale. 

Here's how it looks for `en-US`:

```
Hour: 00, day period: at night, short = at night, and narrow = at night
Hour: 01, day period: at night, short = at night, and narrow = at night
Hour: 02, day period: at night, short = at night, and narrow = at night
Hour: 03, day period: at night, short = at night, and narrow = at night
Hour: 04, day period: at night, short = at night, and narrow = at night
Hour: 05, day period: at night, short = at night, and narrow = at night
Hour: 06, day period: in the morning, short = in the morning, and narrow = in the morning
Hour: 07, day period: in the morning, short = in the morning, and narrow = in the morning
Hour: 08, day period: in the morning, short = in the morning, and narrow = in the morning
Hour: 09, day period: in the morning, short = in the morning, and narrow = in the morning
Hour: 10, day period: in the morning, short = in the morning, and narrow = in the morning
Hour: 11, day period: in the morning, short = in the morning, and narrow = in the morning
Hour: 12, day period: noon, short = noon, and narrow = n
Hour: 13, day period: in the afternoon, short = in the afternoon, and narrow = in the afternoon
Hour: 14, day period: in the afternoon, short = in the afternoon, and narrow = in the afternoon
Hour: 15, day period: in the afternoon, short = in the afternoon, and narrow = in the afternoon
Hour: 16, day period: in the afternoon, short = in the afternoon, and narrow = in the afternoon
Hour: 17, day period: in the afternoon, short = in the afternoon, and narrow = in the afternoon
Hour: 18, day period: in the evening, short = in the evening, and narrow = in the evening
Hour: 19, day period: in the evening, short = in the evening, and narrow = in the evening
Hour: 20, day period: in the evening, short = in the evening, and narrow = in the evening
Hour: 21, day period: at night, short = at night, and narrow = at night
Hour: 22, day period: at night, short = at night, and narrow = at night
Hour: 23, day period: at night, short = at night, and narrow = at night

Unique Periods: at night,in the morning,noon,in the afternoon,in the evening (5 total)
```

First thing you'll notice is that short and narrow only impact one time, noon. Noon is also the only "specific" period for one hour. There is no "midnight" or any other one time only value. Finally, you can see all the unique values (5) listed. 

What about the French?

```
Hour: 00, day period: du matin, short = matin, and narrow = matin
Hour: 01, day period: du matin, short = matin, and narrow = matin
Hour: 02, day period: du matin, short = matin, and narrow = matin
Hour: 03, day period: du matin, short = matin, and narrow = matin
Hour: 04, day period: du matin, short = matin, and narrow = mat.
Hour: 05, day period: du matin, short = matin, and narrow = mat.
Hour: 06, day period: du matin, short = matin, and narrow = mat.
Hour: 07, day period: du matin, short = matin, and narrow = mat.
Hour: 08, day period: du matin, short = matin, and narrow = mat.
Hour: 09, day period: du matin, short = matin, and narrow = mat.
Hour: 10, day period: du matin, short = matin, and narrow = mat.
Hour: 11, day period: du matin, short = matin, and narrow = mat.
Hour: 12, day period: midi, short = midi, and narrow = midi
Hour: 13, day period: de l’après-midi, short = après-midi, and narrow = ap.m.
Hour: 14, day period: de l’après-midi, short = après-midi, and narrow = ap.m.
Hour: 15, day period: de l’après-midi, short = après-midi, and narrow = ap.m.
Hour: 16, day period: de l’après-midi, short = après-midi, and narrow = ap.m.
Hour: 17, day period: de l’après-midi, short = après-midi, and narrow = ap.m.
Hour: 18, day period: du soir, short = soir, and narrow = soir
Hour: 19, day period: du soir, short = soir, and narrow = soir
Hour: 20, day period: du soir, short = soir, and narrow = soir
Hour: 21, day period: du soir, short = soir, and narrow = soir
Hour: 22, day period: du soir, short = soir, and narrow = soir
Hour: 23, day period: du soir, short = soir, and narrow = soir

Unique Periods: du matin,midi,de l’après-midi,du soir (4 total)
```

This time, short and narrow had a much bigger impact. They also had one less unique value. 

Here's Chinese (`zn-CH`):

```
Hour: 00, day period: 凌晨, short = 凌晨, and narrow = 凌晨
Hour: 01, day period: 凌晨, short = 凌晨, and narrow = 凌晨
Hour: 02, day period: 凌晨, short = 凌晨, and narrow = 凌晨
Hour: 03, day period: 凌晨, short = 凌晨, and narrow = 凌晨
Hour: 04, day period: 凌晨, short = 凌晨, and narrow = 凌晨
Hour: 05, day period: 清晨, short = 早上, and narrow = 早上
Hour: 06, day period: 清晨, short = 早上, and narrow = 早上
Hour: 07, day period: 清晨, short = 早上, and narrow = 早上
Hour: 08, day period: 上午, short = 上午, and narrow = 上午
Hour: 09, day period: 上午, short = 上午, and narrow = 上午
Hour: 10, day period: 上午, short = 上午, and narrow = 上午
Hour: 11, day period: 上午, short = 上午, and narrow = 上午
Hour: 12, day period: 中午, short = 中午, and narrow = 中午
Hour: 13, day period: 下午, short = 下午, and narrow = 下午
Hour: 14, day period: 下午, short = 下午, and narrow = 下午
Hour: 15, day period: 下午, short = 下午, and narrow = 下午
Hour: 16, day period: 下午, short = 下午, and narrow = 下午
Hour: 17, day period: 下午, short = 下午, and narrow = 下午
Hour: 18, day period: 下午, short = 下午, and narrow = 下午
Hour: 19, day period: 晚上, short = 晚上, and narrow = 晚上
Hour: 20, day period: 晚上, short = 晚上, and narrow = 晚上
Hour: 21, day period: 晚上, short = 晚上, and narrow = 晚上
Hour: 22, day period: 晚上, short = 晚上, and narrow = 晚上
Hour: 23, day period: 晚上, short = 晚上, and narrow = 晚上

Unique Periods: 凌晨,清晨,上午,中午,下午,晚上 (6 total)
```

As I don't speak Mandarin and my daughter who does is at work, I'll just trust this makes sense. 

If you want to give this a whirl, you can play with it below.

<p class="codepen" data-height="600" data-theme-id="dark" data-default-tab="result" data-slug-hash="VYYOMNy" data-pen-title="Intl DayPeriod" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/VYYOMNy">
  Intl DayPeriod</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

So, I have to ask, is anyone out there actually using it? I'd love to see a real world use case for this.

Photo by <a href="https://unsplash.com/@ahmed_rizkhaan?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Ahmed  Rizkhaan</a> on <a href="https://unsplash.com/photos/adult-orange-tabby-cat-igRpOPdnkIc?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>