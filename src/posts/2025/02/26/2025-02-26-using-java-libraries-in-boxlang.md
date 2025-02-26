---
layout: post
title: "Using Java Libraries in BoxLang"
date: "2025-02-26T18:00:00"
categories: ["development", "serverless"]
tags: ["boxlang"]
banner_image: /images/banners/cat_coffee.jpg
permalink: /2025/02/26/using-java-libraries-in-boxlang
description: A look at how to add Java libraries into BoxLang
---

One of the aspects that makes [BoxLang](https://boxlang.io/) compelling is that it runs on top of the Java Virtual Machine which means you get access to any Java library out there. This is something ColdFusion has as well and in the past, I've integrated Java libraries into my web apps to make use of open source from the Java community. Best of all, you don't really *need* any Java knowledge to do this. Typically libraries will provide good docs and and examples and the mental model of translating a Java example to BoxLang's language is fairly simple. A few days ago, I [blogged](https://www.raymondcamden.com/2025/02/24/using-parallel-looping-in-boxlang) an example of parallel processing in BoxLang and in one of the samples, I did a tiny bit of RSS feed processing. I mentioned at the time that I wasn't doing "real" RSS parsing, just quickly grabbing XML items from the feed. I decided to see if I could find a Java library for "real" parsing and see how difficult it would be to use in BoxLang. Here's what I found. 

## The Java Library

I googled for Java RSS library and came across [rssreader](https://github.com/w3stling/rssreader?tab=readme-ov-file). This library can parse a URL or a file (but oddly not a string for some reason). Unlike other RSS parsing libraries I've seen in the past, it has built in support for parsing multiple feeds at once, and 'mixing them' together in the result, which is dang nice. 

The only issue I ran into here was that the repo didn't have a pre-built jar. I cloned the repo, ran a gradle build, and discovered something had gone haywire locally in terms of my gradle support. That's all just Unbuntu/WSL issues I'm sure won't bite me again and if you want more details, ask me in the comments. While this step took me maybe an hour or so because of that, I expect *usually* folks will have this done in a minute or two.

## Using Jars in BoxLang

The BoxLang docs have a whole section on [Java interop](https://boxlang.ortusbooks.com/boxlang-framework/java-integration) and part of it covers how to load custom Jar files. The first option is to drop it into BoxLang's `lib` path. The second option would be to specify jars or folders of jars in an `Application.bx` file. For a web application, this is absolutely the path I'd use. (Technically this is usable in CLI scripts as well, but I didn't want to go that route.) The last option was to use the `createObject` function and specify the path itself. 

Code-wise, this is one of two ways to get access to a Java library from a jar. The other, the `new java` syntax, is one I'd rather use as it "feels" more proper, but it doesn't support passing the path to the jar. 

So given all that, and that I've got my jar built, I could instantiate the library like so:

```js
rss = createObject("java", "com.apptasticsoftware.rssreader.RssReader","rssreader.jar");
```

As a simple example, this parses my own RSS feed and gets the items.

```js
rss = createObject("java", "com.apptasticsoftware.rssreader.RssReader","rssreader.jar");
items = rss.read('https://www.raymondcamden.com/feed_slim.xml').toList();
```

The result of the `read` operation is a Java Stream so the `toList()` method essentially just collects all the results into an array. Now for the next fun part.

You can easily loop over each item returned, and items have methods to get things like the title, link, and content, but these returned Java [Optional](https://www.developer.com/java/java-optional-object/). I don't really know Java and haven't kept up to date on all the recent changes, but Optionals are a feature that make it easier to deal with values that may not exist. I'll be honest... I'm not entirely sold on the concept, but it's definitely a core feature of Java, and BoxLang actually extends it with their [Attempts](https://boxlang.ortusbooks.com/boxlang-language/syntax/attempts) feature. It's a bit different, but once I used it a few times it wasn't necessarily difficult. I just had to a) recognize that the library was making use of it and then ensure my code used it as well. 

This means you can't just do, `title = item.getTitle()` for example, but this instead:

```js
item.getTitle().ifPresent(t => println("The title is #t#"));
```

Again... this isn't bad, and I get some of the reasoning behind the idea, but it's definitely a bit different. That being said, here's a complete script to print out each items title, link, and date:

```js
rss = createObject("java", "com.apptasticsoftware.rssreader.RssReader","rssreader.jar");
items = rss.read('https://www.raymondcamden.com/feed_slim.xml').toList();

items.each(i => {
	i.getTitle().ifPresent(t => print(t));
	i.getLink().ifPresent(l => print(" #l#"));
	i.getPubDate().ifPresent(d -> print(" #d#"));
	println("#char(10)#");
});
```

## Putting it Together

Ok, so how about I take my little demo from earlier this week - parsing N RSS feeds - and make use of the library to get 'real' results. I began with a function that takes an array of URLS:

```js
array function getItems(required array feeds) {
	
	rss = createObject("java", "com.apptasticsoftware.rssreader.RssReader","rssreader.jar");
	items = rss.read(feeds).sorted().toList();

	return items.map(i => {
		result = {
			title:'',
			content:'',
			pubdate:'',
			link:'',
			feedTitle:'',
			feedLink:''
		}

		i.getTitle().ifPresent(t => result.title = t);
		i.getLink().ifPresent(l => result.link = l);
		i.getContent().ifPresent(c => result.content = c);
		i.getPubDateZonedDateTime().ifPresent(d => {
			result.pubdate = parseDateTime(d);
		});
		result.feedTitle = i.getChannel().getTitle();
		result.feedLink = i.getChannel().getLink();
		return result;
	});

}
```

I do a bit of normalization in that I create a simpler structure, `result`, with just the bits I care about, and then feed them in with values from the RSS item. I also create a proper date/time object, and finally, since I'm working with N different RSS items, I need a way to 'associate' one item with it's parent. (I've got a small concern about this I'll share in my p.s. at the bottom.) I get this from the top level channel object in each item. Oddly, this *doesn't* use Observables. Also, this means a bit of repetition in my data, but as my result is *one* array with items from different feeds mixed together, this handles letting me display the blog where the item came from.

Here's the entire logic to make use of this new utility:

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
	"https://blackgirlbytes.dev/rss.xml",
	"https://kisdigital.com/rss"
];

feed = getItems(urls);
writedump(feed);
println(feed.len() & " items total");
```

This returns a large amount of data in an incredibly quick amount of time. I don't know if the library is running each call in threads, I assume it is, but the performance is great and the data result much better than my initial simple demo. 

All in all, fairly simple. Biggest issue I ran into was compiling that darn jar, but I guess BoxLang is going to turn me into something of a Java developer as well. ;)

p.s. Ok, the main part of this post is done and now I'm just going to ramble a bit. Many years ago I built a ColdFusion blog aggregator to, well, aggregate content from the ColdFusion community, and build something fun in ColdFusion. One thing that concerns me about the 'multi url' support in the Java library I used is that I'm not sure I can "safely" associate an item with the raw RSS url used to fetch it. As an example, maybe I used this for input: `https://raymondcamden.com/feed_slim.xml` - note the lack of `www`. The items returned, including channel info, will include the www, so if I wanted to properly associate a blog based on the URL I used for the feed, I wouldn't have a one to one correlation. I'm considering building an aggregator demo as a BoxLang web app so this is something that's on my mind. So for example, feedLink for my items would be `https://www.raymondcamden.com/`. I could write some kind of logic to handle that, but, it feels messy. So right now my thinking is that when I build the demo, I'll process one feed at a time, but make use of multi-threaded looping that's so easy in BoxLang. We'll see!