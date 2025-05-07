---
layout: post
title: "A Sneak Peek at BoxLang's Module Feature"
date: "2025-05-07T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_jigsaw.jpg
permalink: /2025/05/07/a-sneak-peek-at-boxlangs-module-feature
description: An early look at how to build modules with BoxLang
---

Last week I attended and spoke at [Into the Box](https://www.intothebox.org/), a conference hosted by the Ortus folks, the company behind [BoxLang](https://boxlang.io). While there, I attended a talk from [Brad Wood](https://www.codersrevolution.com/) on how BoxLang's module system works. I've been using modules with BoxLang since I first started playing with it. It's how database support is added, mail, PDF, and more. You can see a list of currently released modules [here](https://boxlang.ortusbooks.com/boxlang-framework/modularity). I had been curious as to how this works so I was excited for Brad's presentation. While hearing him go over the details, I got even more excited, and literally built a 'hello world' module in a minute or so while he talked. 

I'm calling this blog post a "sneak peek" because while the module system is baked and ready (as apparent by the existence of multiple modules you can use now), what isn't ready yet is the documentation for creating your own modules. I've got a [bug](https://ortussolutions.atlassian.net/issues/BL-1362?jql=ORDER%20BY%20created%20DESC) filed for this and will probably take a stab at writing this soon, but in the meantime I wanted to share some details about what you can do and how it works. Thanks go to Brad Wood for detailing this in his presentation and I'm using his slides as my reference (for now). 

## What Modules Provide

When a module is registered with BoxLang, it can add to the language:

* BIFs (built in functions)
* Components (these are tags, and can be coded to allow/disallow or require body arguments)
* Classes (which you can then load via a defined import path)
* Jars (for both usage as is, or within the module itself)
* JDBC Drivers
* Interceptors (more on this topic soon, but it's incredibly low level code integration)
* Custom variable scopes

This isn't even 100% of what can be added, but gives you an idea. Taking just the first bullet point above, I could write a module that adds the `raymondCamden()` function to BoxLang. Once installed, your code could then just make use of it. There isn't any name spacing for these functions so it's something to consider when authoring, and installing, as it's possible two modules could use the same function name, but arguably that's probably not much of an issue right now - just something to keep in mind. 

It's also important to note that modules can be defined for the *entire* server or just for one application (a web app or even just a CLI script). 

Ok, cool, let's make one!

## Making a Module

Before we begin, note that modules can be written in Java or BoxLang. I don't write Java (well, I *can*, I just don't want to) so this post is focused on BoxLang modules. 

At the simplest level, a module is a folder with various things under it. At minimum is a `ModuleConfig.bx` class. This class has methods for `configure`, `onLoad`, and `onUnload`. The last two let write custom logic for when the module is loaded or disposed, while `configure` lets you work with any settings your module may have. The class can also be empty if you don't need anything, but I believe you still need the file there.

Next is the `bifs` folder. This is where you define built in functions that your module provides.

Then you've got a `components` folder. Any component here will be available to BoxLang via a defined class path. 

And finally, a `libs` folder where any jars will be loaded and available to your code. What's cool is that a jar here will be specific to your module, which means if *another* module uses a similar jar, or a different version, you won't have any conflicts.

## Creating BIFs

For me, I think most of the modules I may end up creating will focus on adding new functionality to the language via new functions. To do this, you simply drop a class in the `bifs` folder such that the name of the class is the name of the function (although you can tweak that via metadata). 

At minimum, your class will have a `@BoxBIF` annotation and an `invoke` method which is run when someone calls your function.

How about a real, if incredibly trivial, example? I'm going to start in a folder and under it, create a new folder `boxlang_modules`. I'll place my modules under this for testing. Next, I'll create a folder for my specific module, which I'm calling `cat`. In there I'll add this `ModuleConfig.bx`:

```js
class {

	public function configure() {
		println('configure');
	}

	public function onLoad() {
		println('onLoad');
	}

	public function onUnload() {
		println('onUnload');
	}

}
```

I'm not actually doing any logic here, but it shows the event handlers in action. Next, I'll create a `bifs` folder and in that, a file named `meow.bx`:

```js
/**
 * This is a BOXLANG BIF
 *
 * Annotations you can use on a BIF:
 * <pre>
 * // The alias of the BIF, defaults to the name of the Class
 * @BoxBIF 'myBifAlias'
 * @BoxBIF [ 'myBifAlias', 'myOtherBifAlias' ]
 * @BoxMember 'string'
 * @BoxMember { 'string' : { name : '', objectArgument : '' }, 'array' : { name : '', objectArgument : '' } }
 * </pre>
 *
 * The runtime injects the following into the `variables` scope:
 * - boxRuntime : BoxLangRuntime
 * - log : A logger
 * - functionService : The BoxLang FunctionService
 * - interceptorService : The BoxLang InterceptorService
 * - moduleRecord : The ModuleRecord instance
 *
 */
@BoxBIF
class {

    function invoke(string msg="meow") {
        return "Kitty says #msg#";
    }

}
```

On top is a bunch of examples of how the annotations can configure how the BIF runs. I mentioned above the name of the file defines the name of the BIF, but you can customize that with either one or multiple names. Another really cool aspect is that you can define member functions that work with core BoxLang types, so for example, defining an array member function. 

In the example above, I'm just going for the defaults which means I've added `meow` to BoxLang. The `invoke` message defines one argument with a default, but obviously you can do whatever your little heart desires here. 

To test, I can go within the folder I created and use the CLI like so:

```
boxlang --bx-code "meow('ray')"
```

And this gives:

```
configure
onLoad
Kitty says ray
onUnload
```

I can also create a file, let's say `test_meow.bxs`, and use it that way:

```js
/*
Just a quick test script for a module
*/

msg = meow('Raymond');
println('My custom module returned: #msg#');
```

I pushed up these demos here (<https://github.com/ortus-boxlang/bx-demos/tree/master/modules>) if you want to take a quick look. 

## A "Real" Module

So as I said, I played around with a module while listening to Brad (yes, I can multitask!) but later, worked on something a bit more real... RSS support. Back in February I [blogged](https://www.raymondcamden.com/2025/02/26/using-java-libraries-in-boxlang) about using Java libraries in BoxLang and as part of that, I made use of a jar that does RSS parsing. It was pretty easy to do, but even simpler when acting as a module. You can see the final code on the [repo](https://github.com/cfjedimaster/bx-rss) I set up for it, but let me explain how it was built.

First, I created an empty `ModuleConfig.bx`. Literally just:

```js
class {

}
```

My module doesn't need to check any settings or load anything by default, so it's just an empty class. I then added my RSS jar under the `libs` folder. Finally, I added a BIF called `rss.bx`:

```js
import com.apptasticsoftware.rssreader.RssReader;

@BoxBIF
class {

	function init() {
		variables.rssOb = createObject('java', 'com.apptasticsoftware.rssreader.RssReader');
	}

    function invoke(urls) {
	
		if(isSimpleValue(urls)) urls = [urls];

		items = variables.rssOb.read(urls).sorted().toList();

		return items.map(i => {
			result = {
				title:'',
				content:'',
				pubdate:'',
				link:''
			}

			i.getTitle().ifPresent(t => result.title = t);
			i.getLink().ifPresent(l => result.link = l);
			i.getContent().ifPresent(c => result.content = c);
			i.getDescription().ifPresent(c => {
				/*
				 So, some feeds had content, some had this. I think it is safe
				 to say that if this exists and content is blank, just overwrite.
				*/
				if(result.content == '') result.content = c;
			})
			i.getPubDateZonedDateTime().ifPresent(d => {
				result.pubdate = parseDateTime(d);
			});
			return result;
		});

    }

}
```

This adds `rss()` to BoxLang and supports either a simple URL for parsing one feed or an array of feeds to parse multiple at once. So for example:

```js
feedItems = rss('https://www.raymondcamden.com/feed.xml');
```

Would return an array of items from my feed. Simple as that!

## More to Come

So as I said in the beginning, there's a lot of power here, but it all needs to be properly documented. I'm going to be helping with that effort as soon as possible. One of the exciting things about BoxLang is how configurable it is at such a low level. Let me know what you think and give it a shot yourself.
