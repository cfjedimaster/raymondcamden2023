---
layout: post
title: "First Stab at a BoxLang Log Viewer"
date: "2025-08-20T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_logs2.jpg
permalink: /2025/08/20/first-stab-at-a-boxlang-log-viewer
description: A simple web app for rendering BoxLang logs.
---

The [BoxLang](https://boxlang.io) folks have a proper "administrator" desktop client coming in the future, but lately I've been finding myself needing a quick way to work with logs and preferring a web-based tool versus using `tail` in my terminal (I know, I'm crazy like that). I thought I'd take a stab (Halloween is coming soon, can you tell?) at a simple web application that could do what I wanted - let me quickly view a log. 

## Logs - Just exactly where are they?

I had a vague idea of where my logs were, but if I'm building a tool that others may use (I'll be linking to the repo at the end) than I'd need that to be dynamic. 

My initial attempt made use of the fact that BoxLang code can get access to the current runtime via `getBoxRuntime()`. The [docs](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/system/getboxruntime) for this function are a bit sparse, but that's mostly because the object returned from this is an instance of the Java class. This link, <https://apidocs.ortussolutions.com/boxlang/latest.html>, will take you to the latest Java source for BoxLang.

From there, you can dig down to the [BoxRuntime](https://apidocs.ortussolutions.com/boxlang/1.4.0/ortus/boxlang/runtime/BoxRuntime.html) class and start looking into the various available methods. 

My first code was pretty simple:

```js
public function getLogDirectory() {
	return getBoxRuntime().getConfiguration().asStruct().logging.logsDirectory;
}
```

Basically, get the runtime, get the configuration, map it to a structure, and get the log directory. I figured out that last part by simply dumping the result from `asStruct()` and figuring out what I needed.

This worked, but Brad Wood had some interesting comments about this use case. He mentioned (and if I misspeak, blame me, not him), that it's better to get the current Box `context` instead. He mentioned that configuration could be changed based on how it's being run, and while unlikely, this version was safer:

```js
public function getLogDirectory() {
	// below per advice from Brad
	return getBoxContext().getConfig().logging.logsDirectory;
}
```

I perhaps didn't do the best job there channeling Brad's reasoning, but, I truly appreciate how BoxLang makes it easier to get access to low level settings like this. Given this, I placed this within a class, along with two more methods:

```js
class {

	public function getLogDirectory() {
		// below per advice from Brad
		return getBoxContext().getConfig().logging.logsDirectory;
	}

	public function getLogs() {
		return directoryList(path=getLogDirectory(),filter="*.log",listInfo="query");
	}

	public function getLog(l) {
		/*
		Don't just do fileExists as we'd have to block path traversal attacks, instead getLogs
		and ensure it's in there
		*/
		goodLog = getLogs().columnData('name').find(l) gte 1;
		if(!goodLog) throw('Log not valid');
		return fileRead(getLogDirectory() & "/" &  l);
	}

}
```

My class supports getting the log directory, getting a list of logs, and getting the contents of a log. As mentioned, I do a bit of checking in `getLog()` to prevent path traversal types of attacks. Right now I'm just returning the contents, but at the end of this post, I'll share some thoughts about what I would change here. 

## The App

The web app itself is a grand total of two pages supported by a bit of JavaScript and CSS. I went with [Bootstrap](https://getbootstrap.com/) for the UI. I've been preferring [Shoelace](https://shoelace.style/) generally, but thought I'd try the old reliable again. To support that, I created a BoxLang component I can use as a wrapper. I created `components/layout.bxm` like so:

```html
<bx:param name="attributes.title" default="">

<bx:if thisComponent.executionMode is "start">
<!doctype html>
<html lang="en" data-bs-theme="dark">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><bx:output>#attributes.title#</bx:output></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr" crossorigin="anonymous">
    <script src="//unpkg.com/alpinejs" defer></script>
  </head>
  <body>

    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" href="/">Home</a>
        </button>
      </div>
    </nav>

    <div class="container my-5">

<bx:else>

    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js" integrity="sha384-ndDqU0Gzau9qJ1lfW4pNLlhNTkCfHzAVBReH9diLvGRem5+R9g2FzA8ZGN954O5Q" crossorigin="anonymous"></script>
    <script src="table-sorter.js"></script>
    <script src="app.js"></script>
  </body>
</html>

</bx:if>
```

It's got little to no logic outside of sniffing for a title attribute and checking the 'mode' of execution, which basically boils down to, am I in the 'opening' of my layout or end. I can then use this like so:

```html
<bx:component template="components/layout.bxm" title="BL Log Viewer">

<p>
Stuff and things. Glorious things. Involving cats.

</bx:component>
```

The home page is just a simple tabular view of the logs:

```html
<bx:set logs = application.logService.getLogs()>

<bx:component template="components/layout.bxm" title="BL Log Viewer">

<h1>Logs</h1>

<bx:output>
<table-sort numeric=2>
<table class="table table-striped table-bordered">
	<thead>
		<tr>
			<th>Name</th>
			<th>Size</th>
			<th>Last Modified</th>
		</tr>
	</thead>
	<tbody>
		<bx:loop query="logs">
			<tr>
				<td><a href="log.bxm?log=#urlEncodedFormat(name)#">#name#</a></td>
				<td data-sortval="#size#">#round(size/1024,2)# KB</td>
				<td>#dateTimeFormat(dateLastModified)#</td>
			</tr>
		</bx:loop>
	</tbody>
</table>
</table-sort>
</bx:output>
</bx:component>
```

You'll notice I'm wrapping the table in my web component, [TableSort](https://github.com/cfjedimaster/table-sorter) (which I oddly called 'talbe-sorter' on GitHub - I need to rename that soon). This web component adds sorting to tables by simple wrapping and progressively enhancing an existing data. The only thing I needed to add on top of that was `numeric=2`, which means treat the second column as a number, and `data-sortval="#size#"` as a way to provide the pure, numeric size of the log file. Note I'm rendering the size in kilobytes. When I get a chance, I'll write a good generic function to render B/KB/MB/GB/etc.

Here's the home page in all its loveliness:

<p>
<img src="https://static.raymondcamden.com/images/2025/08/log1.jpg" alt="Render of the log listing" class="imgborder imgcenter" loading="lazy">
</p>

The next page is a bit more complicated. For now, I'm getting the entire log (and yes, if that's raising red flags in you, stand by) and render it to a textarea. But I also wanted basic sorting as well. For that, I turned to [Alpine.js](https://alpinejs.dev/). I'm actually *quite* rusty with Alpine, it's probably been months since I used it for anything interesting, so that integration took a bit longer than expected just because I had forgotten so much, but once it was done, it worked perfectly. Ok, first the HTML:

```html
<bx:script>
bx:param name="url.log" default="";

// for now it's just the contents, may be more complex later
try {
	logContents = application.logService.getLog(url.log);
} catch(e) {
	bx:location url="/";
}

</bx:script>

<bx:component template="components/layout.bxm" title="BL Log Viewer - #url.log#">

<bx:output>
<h1>#url.log#</h1>

<div x-data="app">
<input placeholder="Type to filter" class="form-control" style="margin-bottom: 5px" x-model="filter">
<textarea class="form-control" style="height: 500px" x-ref="logTextArea">
#logContents#
</textarea>
</div>

</bx:output>

</bx:component>
```

This is fairly simple - get the log, render it in the textarea. But you'll notice a few connections to Alpine via the `x-` attributes. This is handled by the JavaScript:

```js
document.addEventListener('alpine:init', () => {

	Alpine.data('app', () => ({
		filter:'',
		origlogcontents:'',
		init() {
			console.log('alpine init');
			this.origlogcontents = this.$refs.logTextArea.value;
			
			this.$watch('filter', (curr) => {
				if(curr == '') {
					this.$refs.logTextArea.value = this.origlogcontents;
				} else this.$refs.logTextArea.value = this.origlogcontents.split('\n').filter(l => l.indexOf(curr) >= 0).join('\n');
			});
			
		}
	}));

});
```

Basically - on any change to the filter field, I need to update the textarea. I kept a copy of the original and can use that when searching. As it's a log, I'm considering it as an array of lines that I can filter via simple string match. (I should probably make it case-insensitive as well.) Here's a basic view:

<p>
<img src="https://static.raymondcamden.com/images/2025/08/log2.jpg" alt="Rendering a log" class="imgborder imgcenter" loading="lazy">
</p>

And here's a filtered version:

<p>
<img src="https://static.raymondcamden.com/images/2025/08/log3.jpg" alt="Filtered log" class="imgborder imgcenter" loading="lazy">
</p>

You can find the complete source here, <https://github.com/ortus-boxlang/bx-demos/tree/master/webapps/logviewer>

## So about those logs...

Kudos to you if you can see the issues that are going to come out of this demo, specifically, file size. Right now if I click on a multi-gig log file, BoxLang will need to read it completely, it will be sent to the user completely, and even worse, JavaScript is making a copy of it in ram to allow for filtering. This is all going to fail miserably, so what can we do?

First off, BoxLang supports reading in a 'slice' of a file. Via [FileSeek](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/io/fileseek), you could move to a position in a file. [FileReadLine](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/io/filereadline) could then be used N times to read in a 'slice'. In this case, the code would need to determine some 'reasonable' about of content and return that. You could then either use JavaScript to allow for loading in more content, but you'll need to dump previous data before your RAM usage rockets up. 

To be honest, given the power of the average browser and machine running it, even on mobile, I think you could load in quite a bit of a log before things go south, certainly more than a person would want to casually scroll through. You could even consider dynamically disabling filtering in cases like this.

Obviously, "huge log handling" is a problem that's been solved by other folks much smarter than me, so I feel ok using this for my casual needs locally, and I hope you find it useful as well. Let me know, and feel free to send some PRs my way on the [repo](https://github.com/ortus-boxlang/bx-demos/tree/master/webapps/logviewer) with any suggested changes.

Photo by <a href="https://unsplash.com/@okta?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Tania Malréchauffé</a> on <a href="https://unsplash.com/photos/a-cat-sitting-on-top-of-a-pile-of-wood-AqKinW-2OJM?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      