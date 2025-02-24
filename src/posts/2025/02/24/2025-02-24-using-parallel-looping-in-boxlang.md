---
layout: post
title: "Using Parallel Looping in BoxLang"
date: "2025-02-24T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/black_cat_running.jpg
permalink: /2025/02/24/using-parallel-looping-in-boxlang
description: Enabling parallel execution in BoxLang for massive (possibly!) speed boosts.
---

Last week I wrote about [converting a Python file search script](https://www.raymondcamden.com/2025/02/20/building-a-file-search-script-in-boxlang) to BoxLang. In that post (and the [original Python version](https://www.raymondcamden.com/2025/02/11/introducing-boxlang-scripting-for-the-jvm)) I mentioned how the utility wasn't terribly efficient as it needed to recreate an index every time it ran. Despite this, the performance was pretty good, taking about two seconds or so to generate the file index from near seven thousand Markdown files. Right after I shared that post, [Luis Majano](https://luismajano.com/) shared an interesting performance tweak I had missed. 

In BoxLang (and to be fair, this is a feature both Lucee and ColdFusion have as well), when you loop over arrays, structures, and queries, you can enable parallel execution by simply adding an additional argument to the loop. You also have control over the number of threads used as well. 

Let's consider a simple very unrealistic example of this:

```js
input = [];
// dummy data
input.set(1,6,"foo");

start = getTickCount();
input.each(i => {
	print('.');
	sleep(1000 * 10);
});
println('');

end = getTickCount() - start;
println('Elapsed time: #end/1000# seconds.');
```

I create an array of six strings and then loop over each element. For each, I print an indicator to the string so I know something's actually happening, and then I pause execution with the `sleep` command for 10 seconds. I'm using `getTickCount()` before and after for basic timing tests. As you can imagine, this takes 60 seconds. (Slightly above of course.) 

Enabling parallel execution is as easy as this:

```js
start = getTickCount();
input.each(i => {
	print('.');
	sleep(1000 * 10);
},true, 20);
println('');
```

Like, literally, that's it. Now, to be clear, this is absolutely not something you can use in all situations. Heck, maybe not even half the time. It depends. But let's consider my search script. This is the block that iterated over the files:

```js
files.each(f => {

	fileOb = {};
	fileOb.content = fileRead(f);

	/*
	Now get the front matter
	*/
	fm = fileOb.content.split('---')[2];
	lines = fm.trim().split('#char(10)#');

	lines.each(l => {
		parts = l.split(': ');
		if(parts[1] === "date") {
			fileOb.date = parseDateTime(parts[2].replaceAll('"','').trim());
		} else if(parts[1] === "permalink") {
			fileOb.path = parts[2];
		}
	});

	result.append(fileOb);
});
```

And here's the modified version:

```js
files.each(f => {

	fileOb = {};
	fileOb.content = fileRead(f);

	/*
	Now get the front matter
	*/
	fm = fileOb.content.split('---')[2];
	lines = fm.trim().split('#char(10)#');

	lines.each(l => {
		parts = l.split(': ');
		if(parts[1] === "date") {
			fileOb.date = parseDateTime(parts[2].replaceAll('"','').trim());
		} else if(parts[1] === "permalink") {
			fileOb.path = parts[2];
		}
	});

	result.append(fileOb);
}, true, 20);
```

I'm able to use this feature because it doesn't matter what order items are added to my index. In my testing, it was taking around 3.5 seconds to make the index. As I said then, that seemed fair. With this change, it now takes less than a second, about 750-850ms on average. 

How about another example? Imagine I've got a set of URLs, RSS feeds, that I want to parse and aggregate? I built a simple RSS parser that does, well nothing. A real RSS parser would do it's best to standardize the results to make it easier to work with entries. My code just handles RSS vs Atom and doesn't get any fancier than that:

```js
public function getRSS(u) {
	bx:http url=u result="result";
	/*
	lame test for entry vs item
	*/
	entries = xmlSearch(xmlParse(result.fileContent),"//*[name()='entry']");
	if(entries.len() == 0) {
		entries = xmlSearch(xmlParse(result.fileContent),"//*[name()='item']");
	}
	return entries;
}
```

Here's my first take at creating the aggregation:

```js
urls = [
	"https://www.raymondcamden.com/feed_slim.xml",
	"https://scottstroz.com/feed.xml",
	"https://remotesynthesis.com/feed.xml",
	"https://rss.slashdot.org/Slashdot/slashdotMain",
	"https://www.themarysue.com/feed/",
	"https://cfe.dev/rss.xml",
	"https://recursive.codes/blog/feed",
	"https://www.bennadel.com/rss",
	"https://2ality.com/feeds/posts.atom",
	"https://cassidoo.co/rss.xml",
	"https://blackgirlbytes.dev/rss.xml"
];

aggregate = {};
total = 0;
start = getTickCount();
urls.each(u => {
	entries = getRSS(u);
	aggregate[u] = entries;
	total += entries.len();
});
duration = getTickCount() - start;

println('Done aggregating #urls.len()# feeds for a total of #total# entries. This took #duration/1000# seconds.');
```

These 11 feeds comprise over 600 entries as some of the RSS feeds don't return the latest content, but instead all of the content. On average, this execution took between 4 to 7 seconds. Now, the parallel version:

```js
aggregate = {};
total = 0;
start = getTickCount();
urls.each(u => {
	entries = getRSS(u);
	aggregate[u] = entries;
	total += entries.len();
}, true, 20);
duration = getTickCount() - start;

println('Done aggregating #urls.len()# feeds for a total of #total# entries. This took #duration/1000# seconds.');
```

Note that this works because order isn't important - I'm just sticking results in the structure keyed by URL. The timing on this version is between .7 and 1.7 seconds. 

You can read more about this in the [docs](https://boxlang.ortusbooks.com/boxlang-language/syntax/arrays#multi-threaded-looping) (that link is specifically for arrays, but as I said, this feature can be used in structures and queries) as well as read more about [threading](https://boxlang.ortusbooks.com/boxlang-language/syntax/threading) in BoxLang specifically. I put the initial demo and HTTP demo up in the `bx-demos` GitHub repo here: <https://github.com/ortus-boxlang/bx-demos/tree/master/syntax-samples>