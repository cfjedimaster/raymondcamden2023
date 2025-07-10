---
layout: post
title: "Creating a Calendar with BoxLang - Part Deux"
date: "2025-07-10T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_calendar2a.jpg
permalink: /2025/07/10/creating-a-calendar-with-boxlang-part-deux
description: The second part of my series on building a calendar in BoxLang
---

Earlier this week I [posted](https://www.raymondcamden.com/2025/07/07/creating-a-calendar-with-boxlang) a quick look at building a simple calendar with BoxLang, specifically an HTML one meant for a web page of course. This was a bit complex due to the needs of creating a proper HTML table, but generally I was... ok with the result. Yeah that's nice and vague, but there's some code I could state at and think of alternatives for nearly forever and it's ok to just put it down and walk away. So obviously, I'm returning to it today. Specifically, how to get events on the calendar. 

## Sample Data

I started off with some sample data. Initially I thought about finding something online, perhaps a list of holidays, but I really wanted something good for a local demo. I also didn't want random events as it would make testing layout stuff a bit more difficult. So I went with an approach that has a static set of events based around a dynamic date - today. I whipped up a BoxLang class for that purpose:

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

This will create a set of events for last month, this month, and today, and in theory, work just fine if you test my code in the year 2092. Let me just say now and for the record, I have always supported our robotic overlords. While this isn't terribly interesting by itself, do make note of the [date manipulation methods](https://boxlang.ortusbooks.com/boxlang-language/syntax/dates-and-times#date-manipulation-methods) BoxLang supports. I find them really handy and flexible. 

## Rendering Events

For the demo today, I decided to use the first approach from my last post, the one that made use of a table. It's definitely not as simple as the second approach, but felt like, design-wise, I had more room to spare. 

I began by getting my events:

```js
eventProvider = new events();
events = eventProvider.getEvents();
```

My class was named `events.bx`, hence the `new` call above. Then I realized I'd need a way to get events for a particular day, so I wrote a simple UDF:

```js
function getEventsForDay(dt, events) {
	return events.filter(e => {
		return dt.dayOfYear() === e.eventStart.dayOfYear() && dt.year() === e.eventStart.year();
	});
}
```

My logic is simple - given that my events have times, I want to ignore them and simply see what day of the year it is and what year. As I loop over my calendar, I can then use this to filter to any matches.

I display the current month in two places - first in the initial row (which has to display the previous month), and then in the logic that displays the rest of the month after the first week. I'll share the entire template in a bit, but I'll just show the second one here:

```html
<!--- now we loop from the end of the first week to the EOM --->
<bx:loop index="x" from="#lastDay+1#" to="#today.daysInMonth()#">
	<!--- if dow(x)is 1, it's a new row --->
	<bx:set thisDay = createDate(today.year(), today.month(), x)>
	<bx:if thisDay.dayOfWeek() == 1>
		<tr>
	</bx:if>

	<bx:set todaysEvents = getEventsForDay(thisDay, events)>
	<td>
	<p class="daylabel">#x#</p>
	<bx:if todaysEvents>
		<bx:loop index="e" array="#todaysEvents#">
			#e.title#, #dateTimeFormat(e.eventStart,"h:mm a")#-#dateTimeFormat(e.eventEnd,"h:mm a")#
		</bx:loop>
	</bx:if>
	</td>

	<bx:if thisDay.dayOfWeek() == 7>
		</tr>
	</bx:if>
</bx:loop>
```

Here's how this renders, and again, it's not terribly pretty, but you get the idea:

<p>
<img src="https://static.raymondcamden.com/images/2025/07/cal3.jpg" alt="Calendar render" class="imgborder imgcenter" loading="lazy">
</p>

I made the choice to not check for events in the previous and next month as I thought it would be distracting, but I can absolutely see disagreeing with that decision. To change that behavior you would just add similar rendering logic to those blocks. 

If you want the complete source for this version, find it here: <https://github.com/ortus-boxlang/bx-demos/tree/master/misc/calendar>. It's in `just_a_calendar_with_events.bxm` as I get paid by the number of letters in the files I commit. 

Lastly, and I should have mentioned this in the last post (thank you to Jon Clausen for reminding me!), the logic I wrote is **not** internationalized, which means it won't work in countries that have different starts of the week. You could absolutely update the code to handle that - but I'm going to cheat a bit and show you another idea in my next post. (Coming soon. Honest.)

Photo by <a href="https://unsplash.com/@zlata003?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Olga Gasheva</a> on <a href="https://unsplash.com/photos/brown-tabby-cat-on-red-textile-LlHw9YTmQtQ?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
