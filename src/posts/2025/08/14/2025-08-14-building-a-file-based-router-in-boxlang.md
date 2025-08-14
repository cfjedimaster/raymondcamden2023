---
layout: post
title: "Building a File-Based Router in BoxLang"
date: "2025-08-14T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/arrows.jpg
permalink: /2025/08/14/building-a-file-based-router-in-boxlang
description: Another look at BoxLang's routing feature
---

Earlier this week I took a look at BoxLang's new rewriting feature (("URL Rewriting with BoxLang MiniServer")[https://www.raymondcamden.com/2025/08/11/url-rewriting-with-boxlang-miniserver]). It basically boils down to telling the miniserver app, "here is a file I want you to run on a 404", and given that you can write code for anything you would like, it's really flexible. I like this approach, but it got me thinking, what if BoxLang *also* supported a non-code based rewriting system, something where you can define paths, and rewrites, in a file? I took a stab at architecting such a feature and thought I'd share.

## My Inspiration

My inspiration for this idea comes from Netlify's [robust Redirect/Rewrite support](https://docs.netlify.com/manage/routing/redirects/overview/) which has multiple different features. It can map simple paths to one another and also map dynamic paths. It can even create simple proxies, letting you build apps that use client side code to APIs where you can't expose the keys in JavaScript. I took a look at the various options supported by Netlify and decided to try to tackle a *subset* of them as a proof of concept.

## The File

My input file, `rewrites.txt`, will be a simple text-based and tab-delimited set of input paths and rewrite destinations. Let's start simple:

```
/blog	/news

# We renamed this in 1921
/pr		/pressrelease
```

In the sample above, I've got two rewrite rules and a comment that should be ignored by the engine. In theory, any non-technical person can grok this and add or modify rules easily enough.

## The Engine

And now for the engine itself. Again, starting simple, here is my `rewriter.bxs`:

```js
RW_FILE = './rewrites.txt';

if(!fileExists(RW_FILE)) return;

// load up rewrites and parse it (will cache)
function parseRWFile(contents) {
	rules = [];
	lines = contents.listToArray('#char(10)##char(13)#');
	lines.each(l => {
		parts = l.listToArray(char(9));
		// must have 2, 3 is supported
		if(parts.len() < 2) continue;
		rule = {from:parts[1], to:parts[2]};
		if(parts.len() === 3) rule.code = parts[3];
		rules.append(rule)
	});
	return rules;
}

rules = parseRWFile(fileRead(RW_FILE));

rules.each(r => {

	//straight x to y match
	if(cgi.path_info == r.from) {
		code = r.code?:301;
		// special handling for 200
		if(code !== "200") bx:location url=r.to statusCode=code;
		else {
			// will only work if you redirect to a specifc file, not a directory
			// so ie:   /something /somethingelse/index.bxm 200
			bx:include template=r.to;
			abort;
		}
	}

});

// handle 404
```

Up top, I simply default the filename to look for and do a quick check for its existence. Next I've got a basic file parsing utility that will go over every line in the input, split it by tabs, and ensure there's at least 2 values after the split. I use a third space to optionally let you set a status code for the redirect. 

I iterate over the rules and begin with my first supported logic, a simple A=>B type match. If the `cgi.path_info` matches a from value, I'm going to redirect the user. By default, this is done via `bx:location`, which means the user will see the new URL. Typically this is what you want I'd say, and the user can bookmark the new location if they want. However, you may also want to 'blindly' do the redirect where the location doesn't change. That's when the 200 status code check comes in and I switch to simply including the new template. You'll note for that to work though you need to redirect to a specific file. Here's an example:

```
/blog2	/news/index.bxm	200
```

## Splat!

I love "splat" - as a word it's just fun. That being said, one of the cooler Netlify redirect features is the idea of a wildcard match like so:

```
/prods/*	/products/:splat
```

In this case, everything after the path `/prods/` becomes the `splat` value and the direct will include that. In my loop above, I added support like so:

```js
// something/* to something/:splat
if(r.from.endsWith("*") && r.to.endsWith(":splat")) {
	// first, does our current request match r.from
	normalizedPart = r.from.replace("*","");
	if(cgi.path_info.find(normalizedPart) === 1) {
		splat = cgi.path_info.replace(normalizedPart,"");
		newLocation = r.to.replace(":splat", splat);
		bx:location url=newLocation;
	}
}
```

This just boils down to looking for the asterisk and `:splat`, and then doing string manipulation to handle the redirect. 

This worked well but led to another problem.

## Mapping URLs to Data

After I supported mapping `/prods/foo` to `/products/foo`, I realized this would only work if `/products/foo/index.bxm` actually existed, which is fine of course. But what if I wanted to map to `/products/index.bxm` and have the value, `foo`, available to the code there?

I began by adding a new rule to my text file: 

```
/products/*	/products/:product
```

And then modified my rewriter code like so:

```js
if(r.from.endsWith("*") && r.to.endsWith(":splat")) {
	// first, does our current request match r.from
	normalizedPart = r.from.replace("*","");
	if(cgi.path_info.find(normalizedPart) === 1) {
		splat = cgi.path_info.replace(normalizedPart,"");
		newLocation = r.to.replace(":splat", splat);
		bx:location url=newLocation;
	}
} else if(r.from.endsWith("*") && r.to.reFind(":[a-zA-Z]+$")) {
	// something/* to something/:name such that something/index.bxm is loaded with request.name == the value
	matchedToken = r.to.mid(r.to.reFind(":[a-zA-Z]+$") + 1, r.to.len());
	normalizedPart = r.from.replace("*","");
	splat = cgi.path_info.replace(normalizedPart,"");
	request[matchedToken] = splat;
	normalizedLocation = r.to.replace(":#matchedToken#","");
	bx:include template="#normalizedLocation#/index.bxm";
	abort;
}
```

Now it handles cases where the end isn't `:splat` and considers it a variable. This is stored in the `request` scope and made available to the included document, which for now assumes `index.bxm`. All in all it means this set of rules:

```
/prods/*	/products/:splat

/products/*	/products/:product
```

Will take a URL like `/prods/catbox` and redirect to `/products/catbox` in the browser while then loading `products/index.bxm` and making a request variable, `product`, contain the value `catbox`. Whew. T

## The Code

Ok, so as I said, this is all a proof of concept and not nearly as powerful as the system Netlify has in place, but it absolutely shows you *could* build something like that. Again, my idea here was to make it easier to both write rules for our app as well make it easier to read those rules later to understand behavior. 

You can find the complete demo here, <https://github.com/ortus-boxlang/bx-demos/tree/master/webapps/rewritedemo/filebased>, and I've included both my text and BoxLang rewrite code below.

First, the text file:

```
/blog	/news
/blog2	/news/index.bxm	200

# We renamed this in 1921
/pr		/pressrelease

/prods/*	/products/:splat

/products/*	/products/:product
```

And now the engine:

```js
RW_FILE = './rewrites.txt';

if(!fileExists(RW_FILE)) return;

// load up rewrites and parse it (will cache)
function parseRWFile(contents) {
	rules = [];
	lines = contents.listToArray('#char(10)##char(13)#');
	lines.each(l => {
		parts = l.listToArray(char(9));
		// must have 2, 3 is supported
		if(parts.len() < 2) continue;
		rule = {from:parts[1], to:parts[2]};
		if(parts.len() === 3) rule.code = parts[3];
		rules.append(rule)
	});
	return rules;
}

rules = parseRWFile(fileRead(RW_FILE));

rules.each(r => {

	//straight x to y match
	if(cgi.path_info == r.from) {
		code = r.code?:301;
		// special handling for 200
		if(code !== "200") bx:location url=r.to statusCode=code;
		else {
			// will only work if you redirect to a specifc file, not a directory
			// so ie:   /something /somethingelse/index.bxm 200
			bx:include template=r.to;
			abort;
		}
	}

	// something/* to something/:splat
	if(r.from.endsWith("*") && r.to.endsWith(":splat")) {
		// first, does our current request match r.from
		normalizedPart = r.from.replace("*","");
		if(cgi.path_info.find(normalizedPart) === 1) {
			splat = cgi.path_info.replace(normalizedPart,"");
			newLocation = r.to.replace(":splat", splat);
			bx:location url=newLocation;
		}
	} else if(r.from.endsWith("*") && r.to.reFind(":[a-zA-Z]+$")) {
		// something/* to something/:name such that something/index.bxm is loaded with request.name == the value
		matchedToken = r.to.mid(r.to.reFind(":[a-zA-Z]+$") + 1, r.to.len());
		normalizedPart = r.from.replace("*","");
		splat = cgi.path_info.replace(normalizedPart,"");
		request[matchedToken] = splat;
		normalizedLocation = r.to.replace(":#matchedToken#","");
		bx:include template="#normalizedLocation#/index.bxm";
		abort;
	}
	
});

// handle 404
```

Photo by <a href="https://unsplash.com/@syinq?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Susan Q Yin</a> on <a href="https://unsplash.com/photos/red-and-blue-arrow-sign-surrounded-by-brown-trees-BiWM-utpVVc?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      