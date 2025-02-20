---
layout: post
title: "Building a File Search Script in BoxLang"
date: "2025-02-20T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_warehouse.jpg
permalink: /2025/02/20/building-a-file-search-script-in-boxlang
description: Using BoxLang to index and search against a large set of Markdown files.
---

My [initial blog post](https://www.raymondcamden.com/2025/02/11/introducing-boxlang-scripting-for-the-jvm) on [BoxLang](https://boxlang.io/) used a simple script example to demonstrate how the language can be used to build shell script type utilities and it got me thinking about other ways I could use BoxLang for my own personal tools. A little over three years ago, I [blogged](https://www.raymondcamden.com/2022/01/03/building-a-file-search-script-in-python) about a Python script I built to perform searches, locally, against my blog. My blog content comes from near seven thousand Markdown files and while I've got a good [client-side search](https://www.raymondcamden.com/search/) feature, I was curious what I could from the terminal.

That script did two things:

* Index each of the thousands of Markdown files by reading in the content and parsing the filename into a date and path value
* Taking search input and checking against each and every blob of text

As I said back then, this is horribly inefficient as it has to parse the entire set of files for every search, but in my testing, the indexing aspect took a few seconds so it wasn't too bad. 

I thought it would be useful to try converting that tool to BoxLang, especially as the [docs for CLI scripting](https://boxlang.ortusbooks.com/getting-started/running-boxlang/cli-scripting) were recently updated with more details about how these kind of tools can be built.

The script I'm going to build is *very* tailored to my content, but in theory, could be modified for other types of files, directories, and so forth. 

Ok, let's take a look!

## Building the Index

My 'index' is an in-memory array of data from the file system. For each file, I read in the contents, and then look at the front matter. Front matter on my blog posts is a set of key value pairs in text separated from the main content by three dashes. 

Here's an example from this blog post itself:

```
---
layout: post
title: "Building a File Search Script in BoxLang"
date: "2025-02-20T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/welcome2018.jpg
permalink: /2025/02/20/building-a-file-search-script-in-boxlang
description: Using BoxLang to index and search against a large set of Markdown files.
---

My [initial blog post](https://www.raymondcamden.com/2025/02/11/introducing-boxlang-scripting-for-the-jvm) on 
[BoxLang](https://boxlang.io/) used a simple script example to demonstrate how the language can be used to 
build shell script type utilities and it got me thinking about other ways I could use BoxLang for my own 
personal tools. A little over three years ago, I [blogged](https://www.raymondcamden.com/2022/01/03/building-a-file-search-script-in-python) about a Python script I built to perform searches, locally, 
against my blog. My blog content comes from near seven thousand Markdown files and while I've got a 
good [client-side search](https://www.raymondcamden.com/search/) feature, I was curious what I could 
from the terminal.
```

My intent here is to separate out the main content (after the second `---`) and parse information from the front matter, specifically the date and path. Here's how I accomplished that:

```js
array function makeIndex(path) {
	result = [];
	files = directoryList(path, true, "files", "*.md");

	files.forEach(f => {
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

	return result;
}
```

I assume most of this is pretty self-explanatory, but as always, let me know if something looks weird. I'll also point out that arrays in BoxLang, like ColdFusion, start with 1 and not 0. 

## Searching the Index

To search the index, I just do a simple case-insensitive comparison to the content of the files. This could *absolutely* be made fancier. For example, if I searched for "foo goo", I may want to do an AND search, an OR search, or a phrase search. But as this was a simple utility for me, Ray said it was ok to be lazy.

```js
array function searchIndex(index, terms) {
	result = [];
	index.forEach(i => {
		if(i.content.findNoCase(terms) >= 1) {
			result.push(i);
		}
	});

	return result;
}
```

## Designing the CLI Interface

Ok, so we've got our two main methods and now it's time to use it. The first thing I had to figure out was - how should the search term be provided? I knew it would as an argument, and you saw me use `cliGetArgs()` in the first post, but there's a simple way to do what I did before. In the [docs](https://boxlang.ortusbooks.com/getting-started/running-boxlang/cli-scripting#parsed-arguments), it describes how if you use `--something` or `-somethingelse`, you get default parsing/behavior etc in. 

I decided to support `--term=X` as the main way to get the search term from the user (which again, is just me), but I also wanted to support a case where I *forgot* to pass it in. BoxLang supports prompting for command line arguments as well using `cliRead`. Therefore, I wrote my code to support both:

```js
args = cliGetArgs();
if(!args.options.keyExists('term')) {
	/*
	option 1...
	println("Pass a term: --term=something");
	abort;
	*/
	// option 2
	term = cliRead("Enter the term to search for: ");
} else term = args.options.term;
```

As you'll see in the commented out section, initially I output help when term wasn't passed, but I pivoted to simply asking for the term instead. 

Once I have the term, I do the hard work of calling my two previous methods:

```js
print("Making index...");
index = makeIndex(rootDir);
println(" now searching...");
results = searchIndex(index, term);
```

Note how I used `print` first, to *not* include a new line, and then followed it with a `println` to then start a new line. The variable, `rootDir`, is defined earlier in the script and points to where I checked out my repo. 

Once I get the results, I print a header and the results:

```js
println("Found #numberFormat(results.len())# results in #numberFormat(index.len())# files.");

results.forEach(r => {
	print("#r.date.month()#/#r.date.day()#/#r.date.year()# ");
	println("#char(9)#https://www.raymondcamden.com#r.path#");
});
```

I prefix the path result with my domain, not because I don't remember my website, but in my terminal, it makes it automatically clickable. Here's an example:

<p>
<img src="https://static.raymondcamden.com/images/2025/02/search1.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

In case you're curious, speed was probably just as good as it was in Python, if not better. In my testing, it felt like it took an average of 2-3 seconds per search which is more than fast enough for me.

## Making it Executable

As the *very* last step I wanted to turn it into a 'SheBang' script, or a script I could run without having to specify the BoxLang CLI. According to the [docs](https://boxlang.ortusbooks.com/getting-started/running-boxlang/cli-scripting#shebang-scripts) for this, I just needed to add:

```
#!/usr/bin/env boxlang
```

Once I did that and made it executable, I could then do this:

```bash
./search.sh --term=cats 
```

And that's pretty much it. Normally I'd share this script in the BoxLang demos repo, but as it's really only going to work well in my content, I'll just share it below:

```js
#!/usr/bin/env boxlang

rootDir = "/someplace/raymondcamden2023/src/posts";

array function makeIndex(path) {
	result = [];
	files = directoryList(path, true, "files", "*.md");

	files.forEach(f => {
		fileOb = {};
		fileOb.content = fileRead(f);

		/*
		Now get the front matter
		*/
		fm = fileOb.content.split('---')[2];
		lines = fm.trim().split('#char(10)#');

		lines.each(l => {
			local.parts = l.split(': ');
			if(parts[1] === "date") {
				fileOb.date = parseDateTime(parts[2].replaceAll('"','').trim());
			} else if(parts[1] === "permalink") {
				fileOb.path = parts[2];
			}
		});

		result.append(fileOb);
	});

	return result;
}

array function searchIndex(index, terms) {
	result = [];
	index.forEach(i => {
		if(i.content.findNoCase(terms) >= 1) {
			result.push(i);
		}
	});

	return result;
}

args = cliGetArgs();
if(!args.options.keyExists('term')) {
	/*
	option 1...
	println("Pass a term: --term=something");
	abort;
	*/
	// option 2
	term = cliRead("Enter the term to search for: ");
} else term = args.options.term;

print("Making index...");
index = makeIndex(rootDir);
println(" now searching...");
results = searchIndex(index, term);

println("Found #numberFormat(results.len())# results in #numberFormat(index.len())# files.");

results.forEach(r => {
	print("#r.date.month()#/#r.date.day()#/#r.date.year()# ");
	println("#char(9)#https://www.raymondcamden.com#r.path#");
});
```

<p>
