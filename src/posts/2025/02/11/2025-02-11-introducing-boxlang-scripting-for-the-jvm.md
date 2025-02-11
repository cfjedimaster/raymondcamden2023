---
layout: post
title: "Introducing BoxLang - Scripting for the JVM"
date: "2025-02-11T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_boxes.jpg
permalink: /2025/02/11/introducing-boxlang-scripting-for-the-jvm
description: A quick introduction to BoxLang.
---

The last week or so I've been playing with a new language, which honestly is one of the most fun things I get to do. [BoxLang](https://boxlang.io/) is a dynamic scripting language that runs on the JVM although you don't really need to know a thing about Java to make use of it. It's currently in beta and moving towards an official 1.0 release, but you can absolutely kick the tires on it now (as I have!) and I thought I'd share a bit about what I'm doing with it. 

BoxLang is open source and free, with the company behind it, [Ortus Solutions](https://www.ortussolutions.com/), offering professional services on top. If you come from the ColdFusion world, you know Ortus has been around a while and has created a huge amount of value on top of CFML. If you know nothing at all about ColdFusion, well, that's fine too. ;) 

The runtime is supported in any environment (I've tested it with Ubuntu and Windows) and tiny - 6 megabytes. Heck, a typical React site is probably bigger than that. (I kid... mostly.) It can currently run via command line, Docker, web contexts, and Lambda, with more coming soon (including Microsoft Azure). Along with the language, there is a framework with various services, like caching and scheduling. 

You can dig more into the architecture if you wish and the [docs](https://boxlang.ortusbooks.com/) are pretty extensive as well. There's some things currently missing (I'll show one in a code sample a bit later in this post), but they've been pretty good at updating as I run into issues.

From a practical aspect, I see three main uses for this that appeal to me (although there's more):

* CLI scripts: I typically use Node.js and Python for utility scripts quite a bit.
* Web apps: I've not done a lot of "application server" web apps for a while, but my recent work with Python's Flask library has me thinking about it again. 
* Serverless: BoxLang has a Lambda template and I've tested it - it works - and I'll probably discuss that in my next post. 

I've been doing most of my testing via the CLI, so I thought I'd share a quick example of that first. Before that, if you want to play with BoxLang, I recommend the [IDE extension](https://boxlang.ortusbooks.com/getting-started/ide-tooling) for VS Code, which includes the compiler in it as well and supports debugging and more. This is another topic I want to show off a bit more later. 

## I Can Haz Dad Joke?

First off, the docs have a great ['quick syntax guide'](https://boxlang.ortusbooks.com/getting-started/overview/syntax-style-guide) that provides a lot of high level detail about file types, basic syntax, and more. A basic "script" uses the extension `bxs`. I built one that hits the [Dad Joke API](https://icanhazdadjoke.com/api). Here's the entire thing and I'll explain each bit:

```js
function getDadJoke() {

	bx:http url="https://icanhazdadjoke.com/" result="local.result" {
		bx:httpparam type="header" name="Accept" value="application/json";
	};
	return jsonDeserialize(result.fileContent).joke;
}

writeOutput(getDadJoke());
```

For those of you who know ColdFusion, this will look familiar, but for everyone else, I've just got a basic function, `getDadJoke`, being called at the end there inside the `writeoutput` line. Being the forward thinking 10X engineer I am, I figured it made sense to build a simple function in case I wanted to reuse the logic elsewhere. 

Inside the function, anytime you see `local.`, that's basically assigning a variable local to the function itself. I could have also used the `var` keyword, but `local` lets me treat it as a scope (or structure in this case). I only need it the first time hence the direct access in the last line there. Finally, `bx:http` is just how HTTP is done in BoxLang currently. 

At the command line, I then can call this with: `boxlang dadjoke.bxs`. Running it gives you a random Dad joke:

```
I've just written a song about a tortilla. Well, it is more of a rap really.
```

This worked, but I wanted to make it a bit more flexible. The Dad Joke API supports search, so I thought, why not make my little CLI tool support it too. At the time I write this, it isn't yet documented (but will be soon), but a BoxLang script can use `cliGetArgs()` to pick up on any command line args or flags that were used in the execution. So for example, if I do:

```
boxlang dadjoke.bxs term=cats -d
```

I get this returned by that function:

```js
{
  positionals : [
      term=cats
  ],
  options : {
    d : true
  }
}
```

Given that, I wrote some quick code to scan passed arguments and look for `term`:

```js
cliargs = cliGetArgs();

term = cliargs.positionals.reduce((result,item) => {
	if(item.listGetAt(1, "=") == "term") {
		return item.listGetAt(2, "=");
	}
	return "";
},"");

writeOutput(getDadJoke(term));
```

Again, for folks with no ColdFusion experience, the one part that may stick out is the `listGetAt` call. This is a string function that treats input as a list of items with a delimiter. By treating the input, `term=something` as a list delimited by `=`, I can quickly grab the term if passed in. 

I then modified the function to switch to a search and return a random result:

```js
function getDadJoke(string term="") {

	local.apiURL = "https://icanhazdadjoke.com/";
	if(arguments.term !== "") apiURL &= "search?term=" & urlEncodedFormat(arguments.term);

	bx:http url=apiURL result="local.result" {
		bx:httpparam type="header" name="Accept" value="application/json";
	};

	local.data = JSONDeserialize(result.fileContent);
	// If we searched for a term, we need to get a random joke from the results, otherwise, just .joke
	if(arguments.term !== "") {
		// possible none were found
		if(data.results.len() == 0) return "No jokes found for term: #arguments.term#";
		local.joke = data.results[randRange(1, data.results.len())].joke;
	} else {
		local.joke = data.joke;
	}

	return joke;
}
```

How about a few examples?

```
It was raining cats and dogs the other day. I almost stepped in a poodle.

What do you call a group of disorganized cats? A cat-tastrophe.

Where do cats write notes?
Scratch Paper!
```

Gold, pure gold. You can find the complete script here: <https://github.com/ortus-boxlang/bx-demos/blob/master/samples/dadjoke.bxs>

## What's Next?

As I said, I'm just beginning to play with this and plan to share more, but it's fairly fun so far. You can also try it in the browser at <https://try.boxlang.io/>. I took the first version of my Dad Joke wrapper and ran it there as well:

<iframe 
        width="600"
        height="600" 
        src="https://try.boxlang.io/editor?ro=false&code=eJxNj70OgzAMhGfyFFEmWGAHMVTt1KXP4CamhIYkCk5%2FqHj3JkKVOljyZ53uzkO0krSz%2FIZ0AnV2dywr%2FmGsuL7akcjzGEwv8ra0TaMl2BFWBWpKylq6uRE84BIN9cI4CabeSSSP4ufhIcDM6e0xOSEoDIJbmBMdpESfxA8wMSF4b1JELtRMi7OiY8WWJiDFYHk%2BnXDBoMHoFcs9qh60waOzhJaqOvfq2MbYM2jCSyQfqfx%2Fruq%2BsSpVQw%3D%3D">
    </iframe>

There's a [Slack org](https://boxteam.ortussolutions.com/) you can join as well. I'm there so feel free to join and ask me more!

Header Photo by <a href="https://unsplash.com/@truth6474?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Halogen Condense</a> on <a href="https://unsplash.com/photos/a-couple-of-kittens-sitting-inside-of-a-cardboard-box-s78pyX8IroM?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      