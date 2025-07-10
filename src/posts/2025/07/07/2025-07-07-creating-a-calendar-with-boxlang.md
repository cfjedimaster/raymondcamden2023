---
layout: post
title: "Creating a Calendar with BoxLang"
date: "2025-07-07T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_calendar.jpg
permalink: /2025/07/07/creating-a-calendar-with-boxlang
description: Building a calendar with BoxLang
---

Chalk this up to - "Here's a simple idea for a quick and dirty blog post" that turned into a few hours of my holiday weekend. Not only that, this is probably the first of three or so blog posts so... buck up, buttercup, this is going to be a fun ride. A while ago I had written down (well, typed in, I use Microsoft To Do to record writing ideas) the idea of demonstrating calendar creation with [BoxLang](https://boxlang.io), specifically creating a dynamic calendar, with or without events, either entirely server-side, or using a combination of client-side code with BoxLang providing the API. For today's post, I'm going to focus on (what I had assumed would be) the simplest version - just rendering a calendar for this month.

It's probably been a good ten plus years since I last created a calendar, by hand, in a server-side language, most likely Adobe ColdFusion. But I remembered the basic flow:

* Create an HTML table
* Given that you start a month on a day of the week, begin by rendering the end of the previous month in table cells
* Finish the first week
* Create the rest of the month, ensuring you start and end new table rows where required
* At the end, figure out how "early" you ended the month and add table cells for the next month to 'finish' the row

Seems simple enough... right? While I knew I could create a function to encapsulate all of that, I started off with a simple template script. My plan was to put as much logic as possible up top in the script section, and then handle layout issues beneath that. Let's start there. 

## Version One

I began with this block on top, where I created variables I thought I needed, and as I iterated, added and removed as I tweaked my approach.

```js
today = now();
// for testing
//today = today.add('m',-1);

firstOfThisMonth = today.withDayOfMonth(1);

// used for labelling the calendar
thisMonth = today.format("MMMM yyyy");

// used in case we need to render Prev/Next months
lastMonth = today.add('m',-1);
daysInLastMonth = lastMonth.daysInMonth();

// used to know when the month begins
thisFirstDow = firstOfThisMonth.dayofWeek();
lastDayDow = createDate(today.year(), today.month(), today.daysInMonth()).dayofWeek();
```

I normally remove testing stuff from blog posts, but that first commented out line was real useful in ensuring my code actually worked. 

After creating a variable for the current time, I figure out:

* The first of the month, so I can get the day of the week
* The number of days in the previous month, that helps render the previous month blocks in the table
* What day of the week the last day of the month is - so we figure out if we need to 'finish' the last row.

Next my template has some CSS. I'll wait to share that till I get to the end of this section and share the entire script, but I did the bare minimum. Here's a look at how it renders:

<p>
<img src="https://static.raymondcamden.com/images/2025/07/cal1.jpg" alt="Calendar view" class="imgborder imgcenter" loading="lazy">
</p>

Lovely, isn't it? Ok, now for the rendering. I begin by starting my table, adding the date label and the top level of the table for days of the week:

```html
<bx:output>
<div class="calendarHeader">#thisMonth#</div>
<table class="calendar" border="1">
	<thead>
		<tr>
			<th>Sunday</th>
			<th>Monday</th>
			<th>Tuesday</th>
			<th>Wednesday</th>
			<th>Thursday</th>
			<th>Friday</th>
			<th>Saturday</th>
		</tr>
	</thead>
	<tbody>
```

Now for the first row:

```html
<tr>
<!--- First row of the month is special.... --->
<!--- loop from 1 (Sunday) to first day of week of the month --->
<bx:if thisFirstDow gte 2>
	<bx:loop index="x" from="1" to="#thisFirstDow-1#">
			<td class="previousMonthDay">#daysInLastMonth-thisFirstDow+x+1#</td>
	</bx:loop>
</bx:if>
<bx:loop index="x" from="#thisFirstDow#" to="7">
	<td class="currentMonthDay">#x-thisFirstDow+1#</td>
	<bx:set lastDay = x-thisFirstDow+1>
</bx:loop>
</tr>
```

So basically, I first figure out if the month doesn't start on Sunday, and if so, I render the previous days using the math you see in the loop there. I'll be honest - I kinda guessed at that - reloaded - tweaked - and eventually got it. 

The next loop handles finishing the first row. I'll need to know what the last day of the month, first week size is, so I save it as `lastDay`. 

This next block handles the rest of the days of the month:

```html
<!--- now we loop from the end of the first week to the EOM --->
<bx:loop index="x" from="#lastDay+1#" to="#today.daysInMonth()#">
	<!--- if dow(x)is 1, it's a new row --->
	<bx:set thisDay = createDate(today.year(), today.month(), x)>
	<bx:if thisDay.dayOfWeek() == 1>
		<tr>
	</bx:if>

	<td>#x#</td>

	<bx:if thisDay.dayOfWeek() == 7>
		</tr>
	</bx:if>
</bx:loop>
```

For the most part I think this is relatively simple - the only kinda complex part is determining the day of week. The final bit handles "trailing" days - i.e. months that don't end on Saturday:

```html
<!--- do we have 'trailing' days? --->
<bx:if lastDayDow lt 7>
	<bx:loop index="x" from="#lastDayDow+1#" to="7">
		<td class="nextMonthDay">#x-lastDayDow#</td>
	</bx:loop>
	</tr>
</bx:if>
```

Here's the entire script, and honestly I completely understand if your eyes glaze and you just scroll past: 

```html
<bx:script>
today = now();
// for testing
//today = today.add('m',-1);

firstOfThisMonth = today.withDayOfMonth(1);

// used for labelling the calendar
thisMonth = today.format("MMMM yyyy");

// used in case we need to render Prev/Next months
lastMonth = today.add('m',-1);
daysInLastMonth = lastMonth.daysInMonth();

// used to know when the month begins
thisFirstDow = firstOfThisMonth.dayofWeek();
lastDayDow = createDate(today.year(), today.month(), today.daysInMonth()).dayofWeek();
</bx:script>

<style>
table {
	border-collapse: collapse;
	border: 1px solid black;
	width: 100%;
	height: 700px;
}

th, td {
	border: 1px solid black;
	padding: 5px; 
}

td.previousMonthDay, td.nextMonthDay {
	background-color: #c0c0c0;
}

td {
	text-align: center;
	vertical-align: top;
}

div.calendarHeader {
	text-align: center;
	font-weight: bold;
	font-size: 2em;
	margin-bottom: 5px;

}

</style>

<bx:output>
<div class="calendarHeader">#thisMonth#</div>
<table class="calendar" border="1">
	<thead>
		<tr>
			<th>Sunday</th>
			<th>Monday</th>
			<th>Tuesday</th>
			<th>Wednesday</th>
			<th>Thursday</th>
			<th>Friday</th>
			<th>Saturday</th>
		</tr>
	</thead>
	<tbody>
			<tr>
			<!--- First row of the month is special.... --->
			<!--- loop from 1 (Sunday) to first day of week of the month --->
			<bx:if thisFirstDow gte 2>
				<bx:loop index="x" from="1" to="#thisFirstDow-1#">
						<td class="previousMonthDay">#daysInLastMonth-thisFirstDow+x+1#</td>
				</bx:loop>
			</bx:if>
			<bx:loop index="x" from="#thisFirstDow#" to="7">
				<td class="currentMonthDay">#x-thisFirstDow+1#</td>
				<bx:set lastDay = x-thisFirstDow+1>
			</bx:loop>
			</tr>

			<!--- now we loop from the end of the first week to the EOM --->
			<bx:loop index="x" from="#lastDay+1#" to="#today.daysInMonth()#">
				<!--- if dow(x)is 1, it's a new row --->
				<bx:set thisDay = createDate(today.year(), today.month(), x)>
				<bx:if thisDay.dayOfWeek() == 1>
					<tr>
				</bx:if>

				<td>#x#</td>

				<bx:if thisDay.dayOfWeek() == 7>
					</tr>
				</bx:if>
			</bx:loop>

			<!--- do we have 'trailing' days? --->
			<bx:if lastDayDow lt 7>
				<bx:loop index="x" from="#lastDayDow+1#" to="7">
					<td class="nextMonthDay">#x-lastDayDow#</td>
				</bx:loop>
				</tr>
			</bx:if>
	</tbody>
</table>
</bx:output>
```

This .... works ... and in theory could be nicely wrapped up in a BoxLang component (think web component, re-useable tags I could embed in an application) and some of the ugliness would be hidden, but it just feels gross to me. It feels like, yet again, a good example of why I always failed the Google tech screen. 

That being said... I'm pretty psyched about the next version.

## Version Two - Behold the Power of CSS

After finishing that first version, the thing that struct me the most was that the complexity really seemed to be in the HTML table. I was curious about what CSS options I'd have to possibly simplify the code if I leaned on CSS more. A quick Google turned up something interesting, ["A Calendar in Three Lines of CSS"](https://css-tricks.com/a-calendar-in-three-lines-of-css/). 3 lines of CSS? Surely you jest!

<p>
<img src="https://static.raymondcamden.com/images/2025/07/serious.gif" alt="I am serious, and don't call me Shirley" class="imgborder imgcenter" loading="lazy">
</p>

The approach documented at CSS-Trick is based on an [article](https://calendartricks.com/a-calendar-in-three-lines-of-css/) at the appropriately named "Calendar Tricks" and makes use of a simple CSS grid. The only 'code' aspect you need is to dynamically set the starting position of the grid, which comes from the first day of the month. 

Using their approach, I re-built my demo to just this:

```html
<bx:script>
today = now();

firstOfThisMonth = today.withDayOfMonth(1);

// used for labelling the calendar
thisMonth = today.format("MMMM yyyy");
</bx:script>

<style>
.calendar-wrapper {
  max-width: 280px;
  font: 100% system-ui;
}
.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.first-day {
  <bx:output>
  grid-column-start: #firstOfThisMonth.dayofWeek()#;
  </bx:output>
}

.day-name {
  background: #eee;
}

h1 {
  text-align: center;
}
ol {
  list-style: none;
  margin: 0;
  padding: 0;
  text-align: center;
}

li {
  padding: 2px;
}
</style>

<bx:output>
<div class="calendar-wrapper">
  <h1>#thisMonth#</h1>
  <ol class="calendar">
    
    <li class="day-name">Sun</li>
    <li class="day-name">Mon</li>
    <li class="day-name">Tue</li>
    <li class="day-name">Wed</li>
    <li class="day-name">Thu</li>
    <li class="day-name">Fri</li>
    <li class="day-name">Sat</li>
    
    <li class="first-day">1</li>
    <bx:loop index="x" from="2" to="#today.daysInMonth()#">
      <li>#x#</li>
    </bx:loop>
  </ol>
</div>
</bx:output>
```

The code on top, and bottom, is *way* simpler. Now, to be fair this version doesn't show the previous and following month values, but the simplicity more than makes up for it. Here's that result:

<p>
<img src="https://static.raymondcamden.com/images/2025/07/cal2.jpg" alt="Second calendar output" class="imgborder imgcenter" loading="lazy">
</p>

To be fair, this version would probably make it a bit harder to include events - I'd probably add borders for that - but the logic is so much more easier to work with I think. 

What makes me most happy about this is that usually when I think about moving logic from the backend to the frontend, my brain goes to JavaScript. I don't consider offloading "logic" to CSS. Now I will! 

I plan on doing some here later this week, but you can grab these samples here: <https://github.com/ortus-boxlang/bx-demos/tree/master/misc/calendar>
      