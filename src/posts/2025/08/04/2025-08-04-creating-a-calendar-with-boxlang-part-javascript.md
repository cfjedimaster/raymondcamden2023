---
layout: post
title: "Creating a Calendar with BoxLang - Part JavaScript"
date: "2025-08-04T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_calendar.jpg
permalink: /2025/08/04/creating-a-calendar-with-boxlang-part-javascript
description: Third and final part to my calendars with BoxLang post
---

So back in early July, I wrote up two blog posts on building a calendar with [BoxLang](https://boxlang.io). If you forgot or (*gasp!*) didn't see them, you can read the first two parts here:

* [Creating a Calendar with BoxLang](https://www.raymondcamden.com/2025/07/07/creating-a-calendar-with-boxlang)
* [Creating a Calendar with BoxLang - Part Deux](https://www.raymondcamden.com/2025/07/10/creating-a-calendar-with-boxlang-part-deux)

In the first post, I simply focused on rendering a calendar, which is *mostly* easy but can get a bit tricky based on the HTML/CSS you used. This is one of those cases where CSS can actually make things a *heck* of a lot easier than a table approach. The follow-up then made the calendar dynamic using an `events` class that output static (mostly) data. I say 'mostly' because I wanted static dates that were based around the current month so the demo would always have something to show based on when you ran it. 

This third and final piece was planned, but ran into a bug that was fixed in the [BoxLang 1.4.0 release](https://www.ortussolutions.com/blog/boxlang-v140-our-biggest-release-yet) from this weekend. Woot! With that new release, I can share this final version, which honestly isn't a big deal technically, but does demonstrate a pretty different approach from the [last version](https://www.raymondcamden.com/2025/07/10/creating-a-calendar-with-boxlang-part-deux). Now, instead of generating the calendar completely on the server, instead I'll make use of [FullCalendar](https://fullcalendar.io/) to render the calendar in JavaScript with BoxLang providing the data via HTTP.

Let's do the BoxLang change first. Here's the original class I built:

```js
class {

	public array function getEvents() {

		events = [];

		// so, 3 events last month, 4 events this month, 3 events next months
		today = now();

		// 3 events for last month
		lastMonth = today.add('m',-1);
		events.push({
			title:'Event #events.len()+1#',
			eventStart: lastMonth.withDayOfMonth(1).withHour(9).withMinute(0).withSecond(0),
			eventEnd: lastMonth.withDayOfMonth(1).withHour(10).withMinute(0).withSecond(0),
		});

		events.push({
			title:'Event #events.len()+1#',
			eventStart: lastMonth.withDayOfMonth(13).withHour(12).withMinute(0).withSecond(0),
			eventEnd: lastMonth.withDayOfMonth(13).withHour(14).withMinute(0).withSecond(0),
		});

		events.push({
			title:'Event #events.len()+1#',
			eventStart: lastMonth.withDayOfMonth(20).withHour(9).withMinute(0).withSecond(0),
			eventEnd: lastMonth.withDayOfMonth(20).withHour(12).withMinute(0).withSecond(0),
		});

		// 4 for this month
		events.push({
			title:'Event #events.len()+1#',
			eventStart: today.withDayOfMonth(8).withHour(13).withMinute(0).withSecond(0),
			eventEnd: today.withDayOfMonth(8).withHour(15).withMinute(0).withSecond(0),
		});

		events.push({
			title:'Event #events.len()+1#',
			eventStart: today.withDayOfMonth(16).withHour(10).withMinute(0).withSecond(0),
			eventEnd: today.withDayOfMonth(16).withHour(12).withMinute(0).withSecond(0),
		});

		events.push({
			title:'Event #events.len()+1#',
			eventStart: today.withDayOfMonth(18).withHour(6).withMinute(0).withSecond(0),
			eventEnd: today.withDayOfMonth(18).withHour(8).withMinute(0).withSecond(0),
		});

		events.push({
			title:'Event #events.len()+1#',
			eventStart: today.withDayOfMonth(28).withHour(14).withMinute(0).withSecond(0),
			eventEnd: today.withDayOfMonth(28).withHour(16).withMinute(0).withSecond(0),
		});

		// 3 for next month
		nextMonth = today.add('m',1);
		events.push({
			title:'Event #events.len()+1#',
			eventStart: nextMonth.withDayOfMonth(2).withHour(9).withMinute(0).withSecond(0),
			eventEnd: nextMonth.withDayOfMonth(2).withHour(10).withMinute(0).withSecond(0),
		});

		events.push({
			title:'Event #events.len()+1#',
			eventStart: nextMonth.withDayOfMonth(15).withHour(12).withMinute(0).withSecond(0),
			eventEnd: nextMonth.withDayOfMonth(15).withHour(14).withMinute(0).withSecond(0),
		});

		events.push({
			title:'Event #events.len()+1#',
			eventStart: nextMonth.withDayOfMonth(22).withHour(9).withMinute(0).withSecond(0),
			eventEnd: nextMonth.withDayOfMonth(22).withHour(12).withMinute(0).withSecond(0),
		});	

		return events;

	}
}
```

As I said, it's static, but a bit dynamic as the data is all based around the current date and time. Normally this would be a lot shorter and based on a database query or some other logic. If I want to turn this into something a client-side library can use, I have to take this one line of code:

```js
public array function getEvents() {
```

And change it to:

```js
remote array function getEvents() {
```

Literally, that's it. As long as the class is under web root, I can then make an HTTP call to `events.bx` and pass a query param to specify the method to run, in this case: `events.bx?method=getEvents`. Now, as I said, this is a simple little demo, and in more complex cases it may involve a step or two more. For example, a class may not under web root, may be cached in the application and so forth. In cases like that, you can create a new class under your web root specifically to proxy calls to the cached internal classes. This can also do things like adding their own caching layer, validation, and more. But for now, I just flipped the bit and I've got an API. 

The next step is to work with FullCalendar. For my demo, I went with the simplest version of their quick starts that [just add a script tag](https://fullcalendar.io/docs/initialize-globals) and a few lines of code. This is their initial version from the quick start, with a bit of additional CSS to size the calendar:

```html
<!DOCTYPE html>
<html lang='en'>
  <head>
    <meta charset='utf-8' />
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.18/index.global.min.js'></script>
    <script>

      document.addEventListener('DOMContentLoaded', function() {
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: 'dayGridMonth'
        });
        calendar.render();
      });

    </script>
	<style>
	div#calendar {
		margin-left: 50px;
		margin-right: 50px;
		width: 100%;
		max-width: 700px;
	}
	</style>
  </head>
  <body>
    <div id='calendar'></div>
  </body>
</html>
```

Their [docs](https://fullcalendar.io/docs) are pretty intensive, but I focused on event sourcing and specifically, [sourcing the events as an array](https://fullcalendar.io/docs/events-array), which at minimum requires an array of events that include a title, start, and optionally end values. There's definitely more, but that's the bare minimum and also works well with my date. 

Here's the modified JavaScript:

```js
document.addEventListener('DOMContentLoaded', async () => {
	let events = await (await fetch('./events.bx?method=getEvents')).json();

	// xform for fullcalendar
	events = events.map(e => {
		return {
			title:e.title,
			start:e.eventStart,
			end:e.eventEnd
		}
	});

	var calendarEl = document.getElementById('calendar');
	var calendar = new FullCalendar.Calendar(calendarEl, {
		initialView: 'dayGridMonth',
		events
	});
	calendar.render();
});
```

I now make a call to the BoxLang class to get my events and modify the values to match what FullCalendar wants. Finally, I smply pass it to the constructor. Here's how it looks, and keep in mind, I didn't do *any* stying on this and I absolutely *could* have to make it match a site theme and so forth:

<p>
<img src="https://static.raymondcamden.com/images/2025/08/cal1.jpg" alt="Calendar example" class="imgborder imgcenter" loading="lazy">
</p>

To add interactivity I'd need to write a bit more JavaScript, but this demonstrates the basic process. It's also a good reminder when using BoxLang for web apps that you always have a choice between what you do server-side versus client-side. Options are good! 

If you want to see any of these calendar examples, head over to the BoxLang GitHub repo here, <https://github.com/ortus-boxlang/bx-demos/tree/master/misc/calendar>