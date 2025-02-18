---
layout: post
title: "Building a Web App with BoxLang"
date: "2025-02-18T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_lumberjack.jpg
permalink: /2025/02/18/building-a-web-app-with-boxlang
description: Building a simple web app using the BoxLang framework.
---

I've been building web apps for thirty years now, which frankly is kind of scary to see explicitly spelled out. For a large chunk of that time I built web apps using an application server, ColdFusion, where my templates would dynamically output HTML (or other formats like JSON) to return to the browser. For my non-ColdFusion readers out there, you can just replace ColdFusion with PHP or ASP and you get the basic idea. 

Most recently, I've spent a lot less time on the server and more on the front-end, but I kept coming back from time to time. Earlier this year I looked at [building a simple blog](https://www.raymondcamden.com/2025/01/13/simple-blog-example-in-flask) in the Python-based Flask framework. I thought it would be a good exercise to try something similar with [BoxLang](https://boxlang.io/) as well. So far I've shown how to build a [simple serverless function](https://www.raymondcamden.com/2025/02/14/building-serverless-lambda-functions-with-boxlang) with BoxLang as well as a [command-line script](https://www.raymondcamden.com/2025/02/11/introducing-boxlang-scripting-for-the-jvm), and I've got more I want to say in both those areas, but for today, let's talk about how you can build a web application using BoxLang.

Let me start off by saying that this is a pretty huge topic. Building a large scale, performant web app isn't trivial in any language. For today, I just want to give you the lay of the land so to speak and an idea of what the developer experience is like. For those of you coming from a ColdFusion background, a lot of this will be familiar, but let's just assume you are coming at this fresh. (And honestly, it's been quite a while since I built a ColdFusion app myself so this was a bit of a refresher.)

Ok, so basics:

* I've shown running BoxLang at the command line and in Lambda, but BoxLang can also run in the context of a web server. The one I used for testing is [MiniServer](https://boxlang.ortusbooks.com/getting-started/running-boxlang/miniserver), but [CommandBox](https://boxlang.ortusbooks.com/getting-started/running-boxlang/commandbox) is also an option as well as Docker.
* Like ColdFusion, PHP, ASP, etc, files implicitly created routes. So if I make foo.bxm in the root of my web server, then `/foo.bxm` would be available via a request. (URL rewriting and such would let you customize the URL even further.)
* BoxLang provides automatic and easy access to various web-based scopes like URL and Form. Also, file upload processing is supported.
* BoxLang supports an "Application" level module that gives you a deep level of customization for your app, including handlers for startup of the app itself, request processing, and more. 
* This same application support provides session management and caching as well.
* Also, BoxLang's class support (you saw an example of it in my [serverless post](https://www.raymondcamden.com/2025/02/14/building-serverless-lambda-functions-with-boxlang)) lets you build JSON ready APIs. 

There's a lot more, and the [docs](https://boxlang.ortusbooks.com/boxlang-framework/applicationbx) will be a good introduction, but let's get into some code, shall we?

## What I'm Building

Much like with my first Flask application, I decided to build a very simple blog in BoxLang. Simple as in - a home page with the last ten blog posts and a post page that renders one particular post at a time. That's it. No search, or categories, or CMS and such. All of that could be done of course, but I wanted to keep it simple for now.

While my Flask demo used a static JSON file, I wanted to do something a bit more deep for this. I found a WordPress export from this blog from 2016 and wrote a one-time BoxLang script to parse the XML and enter it into a MySQL database. BoxLang has native support for database operations, but you need to install it as a module. 

This is [documented](https://boxlang.ortusbooks.com/getting-started/installation/modules#mysql) of course, but the command line call was:

```bash
install-bx-module bx-mysql
```

After I had setup a database in MySQL, I wrote this, admittedly ugly, quick hack of a script:

```js
rawdata = fileRead('./2016-01-20.xml');
data = xmlParse(rawdata);
items = data.search(xpath="//item");

datasource = {
	driver:"mysql",
	host:"192.168.68.50",
	port:3306,
	database:"blog", 
	username:"boxlang",
	password:"of course I didn't hard code the pw in my code. of course"
};

writeoutput("already run ray, dont run again"); abort; 

for(item in items) {

	post = {
		title:item.title.xmlText,
		posted:item['wp:post_date'].xmlText,
		body:item['content:encoded'].xmlText,
		slug:slugify(item.title.xmlText)
	}

	queryExecute("insert into posts(title,body,posted,slug) values(:title,:body,:posted,:slug)", 
	{
		title:post.title, 
		body:post.body,
		posted:post.posted,
		slug:post.slug
	}, { datasource:datasource });

	println(post.title);

}
```

Basically, read in the XML and parse it (note the native xpath support), specify my connection settings, then loop over my XML data and insert into the database. Obviously I added that line in the middle with the abort after I ran it and confirmed it worked correctly. Also make note of the `queryExecute` function with bound parameter support. This is the same as in ColdFusion, and true story, the entire reason I downloaded ColdFusion way back in... probably 1997 or so... was because I didn't want to try to figure out database connections in Perl. I'm old yall, like *really* old. 

The last thing I'll note here is the use of a `slugify` function to turn the title into something I could use later in the actual app. This was added after I had worked a bit on the demo. 

At this point, I had a database with a posts table consisting of 5631 posts. 

## The Blog

Ok, so now I started to work on the blog itself. I want to be clear - this version of the blog is incredibly simplistic. I've got logic written in templates that absolutely should be abstracted out and put into classes properly. That's for next time. In all things, start simply and then progressively improve. 

When it comes to templates, you have the ability to write HTML and intermix within BoxLang tags to create dynamic output. My approach here is the same that I'd take when building a client-side application with something like Alpine.js. If it ever becomes difficult to read the HTML, than I've got too much logic in the template and I should refactor. Again though, I'm taking this one step at a time and I'll share with you a better version later this week. 

I started by creating an index page, `index.bxm`:

```html
<h2>Blog Posts</h2> 

<bx:query name="getRecentPosts" datasource="blog">
select title, posted, slug from posts
order by posted desc
limit 10
</bx:query>

<bx:loop query="getRecentPosts">
	<p>
		<bx:output>
		<a href="post.bxm/#slug#">#title#</a>
		</bx:output>
	</p>
</bx:loop>
```

There's two bits of logic here. First, the `bx:query` tag passes a SQL command to my database and returns the result in a variable named `getRecentPosts`. I'll explain how the datasource was setup in a bit.

The next bit, `bx:loop`, does exactly what you expect, looping over a value that, well, can be looped. This includes query results where each loop iteration will be one record from the result. Inside that loop, when I want to output something dynamic, I use the pound sign wrapped around a variable, and surround that with `bx:output`. You can consider this as a 'flag' to the server to look for and parse values. 

The net result of all of this is just raw HTML:

```html
<h2>Blog Posts</h2> <p>
<a href="post.bxm/what-happens-when-you-screw-up-an-ionic-deployment-">What happens when you screw up an Ionic Deployment?</a>
</p>
<p>
<a href="post.bxm/definitelytyped-project-for-ibm-mobilefirst-and-hybrid-mobile-apps">DefinitelyTyped project for IBM MobileFirst and Hybrid Mobile Apps</a>
</p>
<p>
<a href="post.bxm/time-for-angular-2-">Time for Angular 2?</a>
</p>
<p>
<a href="post.bxm/working-with-hugo-on-raymondcamden-com">Working with Hugo on RaymondCamden.com</a>
</p>
<p>

More links here...
```

In order for the datasource to work, I needed to define it at the application level. BoxLang, like ColdFusion, defines an "application" by the presence of a specifically named file, `Application.bx`, in the current directory or any folder higher as well. Once that file exists, the server 'boxes' up any file under it into a named application. 

I mentioned this a bit above, but this one file lets me:

* Define datasources to use within the application
* Define variables that are application-wide
* Enable session support
* Write event hooks for the application, request, session start and end
* And more

I began with this:

```js
class {

	this.name = "blog1";

	this.datasources = {
		blog = {
			driver:"mysql",
			host:"192.168.68.50",
			port:3306,
			database:"blog", 
			username:"boxlang",
			password:server.system.environment.MYSQL_PWORD
		}

	}

}
```

The `datasources` value can name one or more named datasources within my application. I'm picking up the MySQL password via an environment variable in the `server` scope, which is another built-in set of data available under BoxLang. (While you can write to this space, typically it's used for server level values and local environment type stuff.)

Next, I turned to the post page, `post.bxm`. This has to do a few things:

* Pick up the slug that was passed in the URL
* Get the blog post for that slug
* If it doesn't exist, handle it somehow
* Render the blog post

Here's the first version of that logic:

```html
<bx:set postslug = cgi.path_info.replace('/','')>

<bx:query name="getPost" datasource="blog">
select title, posted, body from posts
where slug = <bx:queryparam value="#postslug#">
</bx:query>

<bx:if getPost.recordCount is 0>
	<bx:location url="/">
</bx:if>


<bx:output>
<h2>#getPost.title#</h2>
<p>
	Posted #getPost.posted#
</p>

#paragraphFormat(getPost.body)#
</bx:output>
```

The first line reads in a value from the `CGI` scope which are web server related values available to your code. In this case, the PATH from the URL, minus the initial slash.

I then look it up, and if it doesn't exist, I use `bx:location` to redirect the user back to the home page. 

The rest of the template is just rendering out the result. The `paragraphFormat()` function looks for a line breaks in a string and wraps it with `<p>` tags. This does *not* work perfectly for the content from my WordPress export. In fact, code samples are all twice as big as each line break becomes a paragraph. I could absolutely correct this, but left it alone for now. 

When I started this post, I talked a bit about how I try *not* to put so much logic into a template. Generally anyway. One option to consider here is to simply switch to scripting which you can directly do in the template. Here's that version where the logic is on top and the rendering below:

```html
<bx:script>
postslug = cgi.path_info.replace('/','');

getPost = queryExecute("select title,posted,body from posts where slug=:slug", { slug: postslug }, { datasource:"blog"});

if(getPost.recordCount == 0) location(url="/");
</bx:script>

<bx:output>
<h2>#getPost.title#</h2>
<p>
	Posted #getPost.posted#
</p>

#paragraphFormat(getPost.body)#
</bx:output>
```

This feels a bit better to me, although again, I'd rather have nearly all the logic extract. That's Tomorrow Ray's problem.

## Putting Some Lipstick on the Pig

As one last thing I'll demonstrate, I added a bit of layout to my demo to make it look slightly nicer. For this, I did a 'trick' I've been using in ColdFusion for years. BoxLang (and ColdFusion) support an abstraction technique called custom tags. You can *almost* think of these like web components. I can define a `foo` tag and then use `foo` in my templates. (Kinda. Just go with it for now.) These tags support advanced usage that includes nesting (think about how the TR html tag works within TABLE) and wrapping (think about how the P tag wraps content). 

For my blog, I built a `layout` custom tag that will:

* On the initial call, ie when the tag begins, simply output a header
* On the closing call, ie when the tag closes, output the footer

I could have used an include directive for this, but I prefer the look of "wrapping" my code in the layout.

There's a few ways to call custom tags, but one way is via `bx:module`. So for example, here's the home page wrapped in that call:

```html
<bx:module template="tags/layout.bxm" title="My Awesome BoxLang Blog">

<h2>Blog Posts</h2> 

<bx:query name="getRecentPosts" datasource="blog">
select title, posted, slug from posts
order by posted desc
limit 10
</bx:query>

<bx:loop query="getRecentPosts">
	<p>
		<bx:output>
		<a href="post.bxm/#slug#">#title#</a>
		</bx:output>
	</p>
</bx:loop>

</bx:module>
```

For the posts page, I use the same technique, but ensure I wrap the output, not the earlier code.

```html
<bx:script>
postslug = cgi.path_info.replace('/','');

getPost = queryExecute("select title,posted,body from posts where slug=:slug", { slug: postslug }, { datasource:"blog"});

if(getPost.recordCount == 0) location(url="/");
</bx:script>

<bx:module template="tags/layout.bxm" title="#getPost.title#">

<bx:output>
<h2>#getPost.title#</h2>
<p>
	Posted #getPost.posted#
</p>

#paragraphFormat(getPost.body)#
</bx:output>

</bx:module>
```

Like web components, I can pass any arbitrary argument to the tag. You can see I've used that for the title.

In the custom tag itself, you've got access to `executionMode`, which simply means, "Am I in the beginning of a wrapped call or the end?" (you can also *check* if an end tag exists). Here's my layout logic:

```html

<bx:param name="attributes.title" default="">

<bx:if thisTag.executionMode is "start">

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<link rel="stylesheet" href="/app.css">
	<title><bx:output>#attributes.title#</bx:output></title>
</head>
<body>

	<h1 class="header"><a href="/">My Awesome Blog</a></h1>

	<main>

<bx:else>

	</main>
</body>
</html>

</bx:if>
```

There's no real logic here outside of checking the execution and outputting the title. On top note I use `bx:param` to default a value for the title. 

## Running It

The last thing to do is actually run this lovely blog, which I did with [MiniServer](https://boxlang.ortusbooks.com/getting-started/running-boxlang/miniserver). You can run it just with one command, `boxlang-miniserver`, but I used the following:

```bash
boxlang-miniserver -d -h 0.0.0.0 -p 9000
```

The `-h` and `-p` args specify a host and post where `-d` turns on debugging mode to ensure you get nice errors when you screw up. I never screw up, but let me do so on purpose so you can see an example:

<p>
<img src="https://static.raymondcamden.com/images/2025/02/blog1.jpg" alt="An error" class="imgborder imgcenter" loading="lazy">
</p>

I didn't mention it yet, but BoxLang's application framework lets you define, and customize, how errors are shown, so you could at least show something friendly to users and do things like logging or emailing of the error itself. 

Whew, that's a lot. Let me at least show how the blog looks with my lovely styling:

<p>
<img src="https://static.raymondcamden.com/images/2025/02/blog2.jpg" alt="List of posts" class="imgborder imgcenter" loading="lazy">
</p>

And here's a full post, with some less than optimal rendering on the code in there (again, my fault and I could correct):

<p>
<img src="https://static.raymondcamden.com/images/2025/02/blog3.jpg" alt="One post" class="imgborder imgcenter" loading="lazy">
</p>


Finally, if you want the complete source, you can find it here: <https://github.com/ortus-boxlang/bx-demos/tree/master/webapps/simple_blog_1>

## P.S.

One final note, today, BoxLang released their first release candidate! You can read more about it here: <https://boxlang.ortusbooks.com/readme/release-history/1.0.0-rc.1>