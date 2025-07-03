---
layout: post
title: "Building a CSV Report CLI Tool in BoxLang"
date: "2025-07-03T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/pennies.jpg
permalink: /2025/07/03/building-a-csv-report-cli-tool-in-boxlang
description: Using CSV support and BoxLang to build a CLI-based report tool.
---

Remember some time ago (yesterday) when I [wrote about](https://www.raymondcamden.com/2025/07/02/parsing-csv-in-boxlang-maven-style) CSV parsing in [BoxLang](https://www.boxlang.io) using the `opencsv` Java library and Maven? As I said then, my initial impetus for that post was to recreate my ColdFusion Hackathon project, but once I got it working, it turned out to be really useful for something completely different.

## The Data

If you're on a desktop machine and look down to your right, you'll notice I've got an ad from from [EthicalAds](https://www.ethicalads.io/advertisers/). I've been using them as an ad network for a bit over a year now. I'm not going to get rich anytime soon with the money I've earned, but it's the first ad network in a while that felt low key and less "in your face". My expenses here are pretty minimal, and the money earned from them covers it just barely, so I come out ahead. (Approximately enough to get one six pack of 'good' beer.) 

My traffic has been mostly stable this year, but has had a slight uptick the past two or three months. The EthicalAds report system makes it easy to check my earnings, but one thing it doesn't show is a "month by month" view of earnings. I could go into their dashboard and check a month at a time manually, but why do something by hand in 5 minutes that I could automate in 30???

The earnings report has a handy CSV export function, so I set it up to display data for a complete year (June 30th 2024 to June 30th 2025) and downloaded that data. Here's a few rows from that export:

```
index,views,clicks,ctr,ecpm,revenue,revenue_share
"Jun 30, 2025 (Mon)",218,0,0.0,2.5586697247706427,0.5577900000000001,0.39045300000000005
"Jun 29, 2025 (Sun)",106,0,0.0,2.596320754716981,0.27520999999999995,0.19264699999999996
"Jun 28, 2025 (Sat)",91,0,0.0,2.4438461538461542,0.22239000000000003,0.155673
"Jun 27, 2025 (Fri)",219,0,0.0,2.9222831050228315,0.6399800000000001,0.44798600000000005
"Jun 26, 2025 (Thu)",257,0,0.0,2.592801556420234,0.6663500000000001,0.46644500000000005
"Jun 25, 2025 (Wed)",301,0,0.0,2.481495016611296,0.7469300000000002,0.5228510000000001
"Jun 24, 2025 (Tue)",266,0,0.0,2.5290225563909785,0.6727200000000002,0.4709040000000001
"Jun 23, 2025 (Mon)",263,0,0.0,2.203041825095057,0.5794,0.40558
"Jun 22, 2025 (Sun)",115,0,0.0,2.5464347826086953,0.29284,0.20498799999999998
"Jun 21, 2025 (Sat)",97,0,0.0,2.3290721649484536,0.22592,0.158144
"Jun 20, 2025 (Fri)",228,0,0.0,2.456184210526316,0.56001,0.392007
```

Each line represents one day of stats. From this, I wanted to build a tool that would aggregate the data into months and show me the results. Enter BoxLang.

## The Code

Before we get into the code, remember that yesterday I covered [how to add CSV support](https://www.raymondcamden.com/2025/07/02/parsing-csv-in-boxlang-maven-style) to BoxLang with the opencsv Java package. My initial code simply imported what I needed, and parsed in the file:

```js
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderHeaderAware;
import com.opencsv.exceptions.CsvException;
import java.io.FileReader;
import java.io.IOException;
import java.util.List;


function readCSV(path) {
	reader = new CSVReaderHeaderAware(new FileReader(path));
	result = [];
	while(row = reader.readMap()) {
		result.append(row);
	}
	return result;
}

adInfo = readCSV('ethicalads-report.csv');
```

I dumped this and noticed that the *very* last row of data was a 'totals' row, so I spent 8 hours vibe coding and added:

```js
// last row is a total row
adInfo.pop();
```

Boom - data imported. Now, I'm going to loop over my raw data and a) parse the date, b) copy over the values I care about which are earnings, and because I was curious, views and clicks:

```js
data = [];

adInfo.each(a => {
	d = parseDateTime(a.index, "MMM dd, yyyy (EEE)");

	// round revenue to hundreds
	revenue = ((a.revenue_share * 100).round())/100;

	data.unshift({ date: d, revenue:revenue, views:a.views, clicks:a.clicks });
});
```

Notice I also rounded the earnings a bit. I'm no Gus Gorman after all. (The first person to identify that name and image below without Googling gets 500 Ray Respect points.)

<p>
<img src="https://static.raymondcamden.com/images/2025/07/gus.jpg" alt="Gus Gorman from Superman III" class="imgborder imgcenter" loading="lazy">
</p>

At this point, I've got an array of values that consist of a valid date, the amount earned in rounded cents, views, and clicks. I now needed to aggregate this information over a set of months. Here's how I accomplished that:

```js
/*
Ok, for round one, I want a report of month/year + total revenue for that month
*/
report = [];
data.each(d => {
	m = month(d.date);
	y = year(d.date);
	key = '#m#/#y#';

	exists = report.find(value => {
		if(value.key === key) return true;
		return false;
	});

	if(exists == 0) {
		report.push({
			key:key, 
			month: m,
			year: y, 
			total: 0, 
			views: 0, 
			clicks: 0
		});
		exists = report.len();
	}

	report[exists].total += d.revenue;
	report[exists].views += d.views;
	report[exists].clicks += d.clicks;
});
```

I create a key based on the month and year of the data and if it doesn't already exist, add it to my final array with default values. After that, I then update the three values: total, views, and clicks. 

The final part is just rendering it to screen:

```js
println('DATE#char(9)##char(9)#TOTAL$#char(9)#VIEWS#char(9)#CLICKS');
report.each(r => {
	println('#r.key##char(9)##char(9)##r.total##char(9)##numberFormat(r.views)##char(9)##r.clicks#');
});
```

And voila - why I'm not retiring and living off my blog anytime soon:

```
DATE            TOTAL$  VIEWS   CLICKS
6/2024          0.34    199     0
7/2024          3.53    2,150   9
8/2024          10.46   7,005   9
9/2024          12.05   6,983   3
10/2024         10.75   8,180   8
11/2024         9.52    8,272   8
12/2024         12.75   8,620   20
1/2025          8.31    8,412   8
2/2025          8.99    7,756   11
3/2025          10.01   8,243   23
4/2025          8.83    5,811   12
5/2025          11.03   6,310   12
6/2025          10.86   5,952   5
```

Here's the complete script so you can see it in its entirety. As always, let me know if you have any questions:

```js
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderHeaderAware;
import com.opencsv.exceptions.CsvException;
import java.io.FileReader;
import java.io.IOException;
import java.util.List;


function readCSV(path) {
	reader = new CSVReaderHeaderAware(new FileReader(path));
	result = [];
	while(row = reader.readMap()) {
		result.append(row);
	}
	return result;
}

adInfo = readCSV('ethicalads-report.csv');
// last row is a total row
adInfo.pop();

data = [];

adInfo.each(a => {
	d = parseDateTime(a.index, "MMM dd, yyyy (EEE)");

	// round revenue to hundreds
	revenue = ((a.revenue_share * 100).round())/100;

	data.unshift({ date: d, revenue:revenue, views:a.views, clicks:a.clicks });
});

/*
Ok, for round one, I want a report of month/year + total revenue for that month
*/
report = [];
data.each(d => {
	m = month(d.date);
	y = year(d.date);
	key = '#m#/#y#';

	exists = report.find(value => {
		if(value.key === key) return true;
		return false;
	});

	if(exists == 0) {
		report.push({
			key:key, 
			month: m,
			year: y, 
			total: 0, 
			views: 0, 
			clicks: 0
		});
		exists = report.len();
	}

	report[exists].total += d.revenue;
	report[exists].views += d.views;
	report[exists].clicks += d.clicks;
});

println('DATE#char(9)##char(9)#TOTAL$#char(9)#VIEWS#char(9)#CLICKS');
report.each(r => {
	println('#r.key##char(9)##char(9)##r.total##char(9)##numberFormat(r.views)##char(9)##r.clicks#');
});
```

Photo by <a href="https://unsplash.com/@cameramandan83?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Dan Dennis</a> on <a href="https://unsplash.com/photos/brown-round-coins-on-brown-wooden-surface-pZ56pVKd_6c?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      