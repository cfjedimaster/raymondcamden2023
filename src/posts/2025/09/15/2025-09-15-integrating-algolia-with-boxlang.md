---
layout: post
title: "Integrating Algolia with BoxLang"
date: "2025-09-15T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_searching.jpg
permalink: /2025/09/15/integrating-algolia-with-boxlang
description: Integrating Algolia's REST API in BoxLang
---

I've been using [Algolia](https://algolia.com) for my search on this blog for *years* and absolutely love the service. At a high level, Algolia is a hosted search service that lets you easily create search indexes (think of it as a search optimized version of your content) while also providing easy libraries to add a search UI to your page itself. If you type in the search bar on top and perform a search, you'll see this yourself. My site here is static, all simple flat files with no database, so a solution like Algolia is vital. I thought I'd take a look at integrating Algolia's REST APIs with [BoxLang](https://boxlang.io) and was able to build a quick demo in less than an hour. Here's what I did.

## Initial Setup

As I said, I've been using Algolia for years, but if you're new to the platform, you'll have to sign up of course. Their [pricing page](https://www.algolia.com/pricing) documents the particulars, but you'll not have to pay a thing to test, and in fact, I don't pay for Algolia as well. Their free tier includes up to one million records (yes, a *million*) and ten thousand searches, so you can absolutely consider Algolia for a whole range of sites. 

Once you've got an account, you need to hop into the dashboard and create an Application, which is a top level container for your account (you can have more than one, but one is enough for testing) and then beneath that, an index. Roughly, an index is like a database. I've got one for my blog, and I made one for this demo. Each index has multiple different things you can configure for optimal searching and such, but the out of the box defaults are fine for quick testing. 

Finally, in your account settings you can get your keys. You will have a "Search API Key", which can be shared publicly as it just does that - search - and an "Admin API Key" which does CRUD on your index. You'll need that value for the code I'm going to show. 

There's a lot more to Algolia than I'm showing today, and I'd recommend checking out the [docs](https://www.algolia.com/doc/) for a deeper look. I'm just going to do the bare minimum to demonstrate an integration with BoxLang.

## My Content

In order to have something to search, I used my blog content here as a base, specifically, the Markdown files for content from 2025. These Markdown files have YAML-based front matter on top and text beneath them. 

Here's an example where I removed a bunch of the content to keep it shorter. The frontmatter on top is like metadata for the content:

<script src="https://gist.github.com/cfjedimaster/05b45f2f1a82ad9880ac3cf5d0f4fe77.js"></script>

For this demo, the content covers 118 different blog articles. All high quality, super serious, important blog posts. 

## Working with the Index

The first thing to know about Algolia and your index is, you need to ensure you keep a one to one connection between the data on your side and the data in the index. There's *multiple* different ways of handling that, but for this example, I'm going to keep it rather simple and use a BoxLang script that will:

* Read and parse my Markdown files
* Use the Algolia REST API to update the index

The [Algolia REST API](https://www.algolia.com/doc/api-reference/rest-api/) covers the full aspect of the all the things you can do, and SDKs exist for other languages if you want to skip doing direct calls. 

To keep things simple, we'll make use of ["Add a new record"](https://www.algolia.com/doc/rest-api/search/#tag/Records/operation/saveObject) endpoint which nicely handles adding or updating values based on a primary key (more on that in a moment). This makes our logic much easier as we can simply gather our data, send em to Algolia, and let them worry about if the record is new or not. 

I created a script, `source_index.bxs`, that handles this. The first portion handles getting and parsing my content:

```js
function fmParse(s) {
	local.fm = s.reFind('---(.*?)---(.*)', 1, true);

	/*
	I'm a bit rusty on reFind, but fm.match will be an array where [2] is the str I want.
	I'm not 100% confident of this
	*/
	//writedump(fm);
	if(fm.match.len() != 3) {
		return { data:{}, contents:markdown(s) };
	}
	
	local.data = yamlDeserialize(fm.match[2]);

	local.content = fm.match[3];
	return { data:data, contents:markdown(content) }
}

// Get our content
content = directoryList(path: "src", recurse: true, filter: path -> path.endsWith(".md"));

// Parse our content
data = [];

content.forEach(c => data.append(fmParse(fileRead(c))));
println("I've parsed #data.len()# items to send to our index.");
```

Note that I make use of BoxLang [Yaml module](https://boxlang.ortusbooks.com/boxlang-framework/modularity/yaml) to handle parsing the frontmatter. The net result of this block is - all of my blog posts will be returned in an array consisting of objects that have `data` and `contents` keys. Note that I'm using the HTML version of my content and it may be better to use the simple text version instead. 

Now for the fun part - getting this to Algolia. I read in my credentials from the environment:

```js
algoliaAppId = getSystemSetting("ALGOLIA_APP_ID");
algoliaAdminId = getSystemSetting("ALGOLIA_ADMIN_ID");
algoliaIndex = getSystemSetting("ALGOLIA_INDEX");

algoliaBaseURL = "https://#algoliaAppId#.algolia.net";
```

That last statement is how the REST API works, your endpoint matches your application ID value. Next, we send to Algolia:

```js
/*
for each, we will do an Add/Replace call with our object data. algolia can make it's own primary
key, but we will use the permalink value from our content
*/
data.forEach(d => {

	record = {
		// CASE MATTERS!
		objectID:d.data.permalink,
		title:d.data.title, 
		date:d.data.date,
		content:d.contents.left(9_000),
		link:d.data.permalink
	};

	bx:http url="#algoliaBaseURL#/1/indexes/#algoliaIndex#" method="post" result="result" {
		bx:httpparam type="header" name="x-algolia-application-id" value="#algoliaAppId#";
		bx:httpparam type="header" name="x-algolia-api-key" value="#algoliaAdminId#";
		bx:httpparam type="body" value="#record.toJSON()#";
	}

	if(result.statusCode !== 201) {
		println("Something went wrong...");
		writedump(result);
		abort;
	}

});

println("Indexing complete!");
```

So, for each blog post, I make a new `record` object. If I don't give it a primary key in the form of the `objectID` value, Algolia will assign it, but my blog content has a `permalink` value that is unique and works perfectly for this. I also pass the title, date, content, and link. Note that Algolia records max out at 10K characters each, so I use the first 9K which leaves more than enough room for the other properties.

Sending it to Aloglia is a simple matter of hitting the endpoint with the data. 

What's cool is - at this point you can go into your Algolia dashboard, confirm the records were added, and *immediately* start doing searches. Here's a screenshot from mine:

<p>
<img src="https://static.raymondcamden.com/images/2025/09/agl1a.jpg" alt="Screenshot from Algolia dashboard" class="imgborder imgcenter" loading="lazy">
</p>

I cannot stress how useful this is. If you don't get good results here, there's no point going forward. You can easily clear the index from the dashboard, tweak your code, and test, all before writing anything to search the content in your app. Here's an example showing matches for `cats`:

<p>
<img src="https://static.raymondcamden.com/images/2025/09/alg2.jpg" alt="Searcg result" class="imgborder imgcenter" loading="lazy">
</p>

## The Search Interface

So, this is the easy part. If I'm building a web app with BoxLang, I just use the front end. There's an [entire frontend widget for this called InstantSearch](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/js/) that lets you tweak things quite a bit. But if I want to stick to BoxLang, I can build a CLI search instead, once again making use of the REST API. 

Here's the class I built for that purpose:

```js

class {

	// credentials:
	algoliaAppId = getSystemSetting("ALGOLIA_APP_ID");
	algoliaAdminId = getSystemSetting("ALGOLIA_ADMIN_ID");
	algoliaIndex = getSystemSetting("ALGOLIA_INDEX");

	algoliaBaseURL = "https://#algoliaAppId#.algolia.net";

	function main(args) {
		if(args.len() === 0) {
			println("Pass a search term via the command.");
			abort;
		} else local.term = args[1].trim();

		println("Searching for: #term#");
		results = search(term);
		println("There were #results.nbHits# total results for this term:#char(10)#");
		results.hits.forEach(h => {
			println("#h.title# (https://www.raymondcamden.com#h.link#) ");
		});
	}

	function search(required string term) {

		// lots and LOTS of options here: https://www.algolia.com/doc/rest-api/search/#tag/Search/operation/searchSingleIndex
		local.body = {
			query:term
		};

		bx:http url="#algoliaBaseURL#/1/indexes/#algoliaIndex#/query" method="post" result="local.result" {
			bx:httpparam type="header" name="x-algolia-application-id" value="#algoliaAppId#";
			bx:httpparam type="header" name="x-algolia-api-key" value="#algoliaAdminId#";
			bx:httpparam type="body" value="#body.toJSON()#";
		}

		return result.fileContent.fromJSON();

	}
}
```

It reads in a term from the command line and passes it to the `search` method. As the comment says, there is a *huge* amount of things you can tweak when searching, but I'm just passing the search term and that's it. I get a result set back that includes `hits` (an array of records) and a total `nbHits`. The result records are pretty cool and include information on *how* the match was found, but I literally just print out the title and the link (my blog root URL and the permalink). Here's an example of this in action:

<p>
<img src="https://static.raymondcamden.com/images/2025/09/alg3.jpg" alt="Search result example" class="imgborder imgcenter" loading="lazy">
</p>

It may be a bit hard to see, but I misspelled Python as `pyuthon` and Algolia handled that with grace. There's a *lot* that goes on in terms of taking your input and performing the search, and again, I'd suggest checking the [Algolia docs](https://www.algolia.com/doc/) for more information there.

Want the code? You can find the demo here, <https://github.com/ortus-boxlang/bx-demos/tree/master/misc/algolia>. Note that you'll need your own credentials, and index, to test it out. Let me know what you think and leave me a comment below!

Photo by <a href="https://unsplash.com/@centelm?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Clément Falize</a> on <a href="https://unsplash.com/photos/cat-behind-walls-b9K_LTz079c?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      