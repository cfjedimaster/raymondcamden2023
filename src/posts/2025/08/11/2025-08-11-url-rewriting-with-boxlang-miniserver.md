---
layout: post
title: "URL Rewriting with BoxLang MiniServer"
date: "2025-08-11T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_on_paper.jpg
permalink: /2025/08/11/url-rewriting-with-boxlang-miniserver
description: A look at URL rewriting support with the BoxLang MiniServer
---

[BoxLang](https://boxlang.io) recently released it's 1.4 version, and one of the cooler parts of that update was many improvements to [MiniServer](https://boxlang.ortusbooks.com/getting-started/running-boxlang/miniserver). MiniServer is a lightweight web server that makes it easy to spin up and test BoxLang web applications. 

Updates in the last version included automatic `.env` loading (which is coming soon to the `boxlang` CLI as well), websocket support, health checks, and more, but the one I care the most about is [URL Rewriting](https://boxlang.ortusbooks.com/getting-started/running-boxlang/miniserver#url-rewrites) support. 

Rewrite support is fairly simple. To turn it on, pass `--rewrites` when running `boxlang-miniserver`. This will use the file `index.bxm` for any request that doesn't match a file (no matter what the extension). You can also specify a particular file as well: `boxlang-miniserver --rewrites router.bxs`. 

When you running MiniServer this way and make a request for something that can't be found, your file will run and you can inspect the request (typically via `cgi.path_info`) to decide what to do. Here's an example from the docs:

```js
switch( cgi.path_info ) {
    case "/":
        // Home page
        include "views/home.bxm";
        break;

    case "/products":
        // Products listing
        include "views/products.bxm";
        break;

    case "/products/":
        // Individual product (extract ID from URL)
        productId = listLast( cgi.path_info, "/" );
        request.productId = productId;
        include "views/product-detail.bxm";
        break;

    default:
        // 404 page
		bx:header statusCode=404;
        include "views/404.bxm";
}
```

I think the most interesting part of that example is the third one where you can enable clean URLs in the form of, `/product/500` or `/product/999`. For the most part, this all "just" works, but I thought I'd kick the tires a bit and build out two demos.

## Building a Mini Blog Server with MiniServer

I've already built a [simple blog](https://www.raymondcamden.com/2025/02/18/building-a-web-app-with-boxlang) in BoxLang earlier this year when I was first learning the platform. I thought it would be interesting to see if I could get BoxLang to grok my 'real' blog source files and URL structure. My blog uses [11ty](https://www.11ty.dev/) which is a powerful state site generator built in Node. I've configured my blog to look for blog posts under `posts` folder. As I've got way too many blog posts, I've organized them by year, month, and day. 

Each blog consists of front-matter on top, and excellent enterprise-grade content in Markdown. Here's an example from the post I wrote this weekend:

{% darkgist "https://gist.github.com/cfjedimaster/73e7d464ebca9f1b0c5bcb847329c09d.js" %}

Looking at the front matter, you can see the `permalink` option is how I define my URLs here. As a test, I took a year's worth of posts, copied it under a new folder in a directory called `posts`, and whipped up a simple BoxLang class to handle:

* Recursively reading in all the Markdown files under it.
* Find the front matter and parse it with the [BoxLang Yaml](https://boxlang.ortusbooks.com/boxlang-framework/modularity/yaml) module.
* Render the Markdown using the [BoxLang Markdown](https://boxlang.ortusbooks.com/boxlang-framework/modularity/markdown) module.
* Support returning all posts as well as being able to look up a post via it's permalink.

Here's the class in question, and keep in mind I wrote this incredibly quickly and just to server the demo:

```js
class {

	property name="postDirectory" type="string";

	private function fmParse(s) {
		data = {};
		fm = s.reFind('---(.*?)---(.*)', 1, true);
		/*
		I'm a bit rusty on reFind, but fm.match will be an array where [2] is the str I want.
		I'm not 100% confident of this
		*/
		//writedump(fm);
		if(fm.match.len() != 3) {
			return { data:{}, contents:markdown(s) };
		}
		
		data.append(yamlDeserialize(fm.match[2]));

		content = fm.match[3];

		return { data:data, contents:markdown(content) }
	}

	public function getPosts() {

		blogCache = cache();
		return blogCache.getOrSet('postCache', () => {
			println('not in cache');
			posts = [];
			postFiles = directoryList(path=variables.postDirectory, recurse=true, filter="*.md");

			postFiles.each(p => {
				contents = fileRead(p);
				post = fmParse(contents);
				// parse .date to a full date
				post.data.date = parseDateTime(post.data.date);
				posts.append(post);
			});

			// do a quick date sort
			posts.sort(function(a,b) {
				return dateCompare(b.data.date, a.data.date);
			});

			return posts;
		}, 60 * 60);

	}

	public function findPostByPermalink(permalink) {
		posts = getPosts();
		match = posts.find(p => {
			return p.data.permalink === permalink;
		});
		if(match === 0) return;
		else return posts[match];

	}
}
```

While BoxLang had no trouble finding and parsing my files *really* quickly, I did go ahead and add an hour cache to the `getPosts` method to make it instantaneous. 

Cool, now let's use it. First, I set up a quick `Application.bx` file:

```js
class {
	this.name = "rewrite_blog_demo";

	public function onApplicationStart() {
		application.blogService = new blogService(postDirectory=expandPath('./posts'));
	}

	public function onRequestStart() {
		// remove me
		application.blogService = new blogService(postDirectory=expandPath('./posts'));
	}
}
```

Yes, I left the "remove me" block in there. I was going to remove it before posting, but figured I'd share the hack I did to make development a bit easier. BoxLang web applications support an `applicationStop` method you can use for a 'more proper' way to restart an application, but for this simple test, this particular hack was fine. Ok, now to the home page:

```html
<bx:script>
posts = application.blogService.getPosts().slice(1,10);

</bx:script>

<h2>Blog Posts</h2>

<bx:loop item="post" array="#posts#">
	<bx:output>
	<p>
	<a href="#post.data.permalink#">#post.data.title#</a> (#post.data.date.dateFormat('short')#)
	</p>
	</bx:output>
</bx:loop>
```

I begin by getting my posts and slicing it to the top 10. I then loop over each, print out the title and date, and link to the permalink. Here's a subset of the output HTML:

```html
<h2>Blog Posts</h2>
<p>
<a href="/2025/08/07/integrating-location-data-with-built-in-chrome-ai-for-better-image-insights">Integrating Location Data with Built-in Chrome AI for Better Image Insights</a> (8/7/25)
</p>
<p>
<a href="/2025/08/05/building-a-comic-book-reader-in-boxlang">Building a Comic Book Reader in BoxLang</a> (8/5/25)
</p>
```

Alright, let's look at the rewriter template, `rewriter.bxs`:

```js
/*
Ok, so technically, we should validate the path, ensure it matches /YYYY/DD/MM/slug, 
but for now I'm just going to assume it does
*/
post = application.blogService.findPostByPermalink(cgi.path_info);
if(post) {
	request.post = post;
	bx:include template="post.bxm";
} else bx:location url="/";
```

As the comment says, I'm kinda assuming I'm only running for blog post requests. The `cgi.path_info` value will match exactly the permalink and so the `findPostByPermalink` should return the right data, and if not, I simply redirect back. 

A better approach would be to sniff for a permalink type structure and redirect on a bad one, and then use a 404 header result for other responses. 

The final bit is just my basic post template:

```html
<bx:output>
<p><a href="/">Home</a></p>
<h2>#request.post.data.title#</h2>

#request.post.contents#
</bx:output>
```

As I said, basic, but you get the idea. Check out the full demo on the [BoxLang demos repo](https://github.com/ortus-boxlang/bx-demos/tree/master/webapps/rewritedemo/blogdemo). Now let's kick it up a notch!

## Cloudinary in BoxLang 

I've been a huge fan  of [Cloudinary](https://cloudinary.com) for years now and use it in multiple places on this blog. They provide an incredibly powerful, URL-based API for image and video transformations. By that I mean you can take your image tag, redirect it to Cloudinary and by adding stuff to the end of the URL, perform a near infinite number of transformations on images.

So naturally I thought - lets rebuild that in BoxLang!

Now to be clear, what I ended up building isn't even 1% of what Cloudinary supports. It was really just a test to see what I could do with rewrites and the BoxLang [image module](https://boxlang.ortusbooks.com/boxlang-framework/modularity/image-manipulation). 

I began with a simple idea. You would request an image in the web app, and if you added X/Y to the end of the path, the image would be resized to fit that bounding box. (Initially I was going to support passing a width only, but this exposed a bug in the image module you'll see mentioned in my code.) I then went a step further and added support for 3 effects: grayscale, blur, and negative. 

Here's the rewriter script I built:

```js

if(cgi.path_info.findNoCase('/img/') === 1) {
	imgPath = cgi.path_info.replaceNoCase('/img/','');
	/*
	formats are:
	file 
	file/w (change to width of w - not working - https://ortussolutions.atlassian.net/browse/BLMODULES-81 )
	file/w/h (change to width of w and height of h)
	file/w/h/effect where effect is one of: grayscale/blur/negative
	*/
	parts = imgPath.split('/');
	img = expandPath('./source/') & parts[1];

	if(!fileExists(img)) {
		println('file didnt exist');
		bx:header statusCode=404; 
		return;
	}

	img = imageRead(img);

	if(parts.length >= 4) {
		effect = parts[4];
		if(effect === "grayscale") img.grayscale();
		if(effect === "blur") img.blur(20);
		if(effect === "negative") img.negative();
	}

	if(parts.length >= 3) {
		img.scaleToFit(parts[2], parts[3]);
	} else if(parts.length == 2) {
		// unfortunately, buggy right now
		img.scaleToFit(parts[2]);
	} else if(parts.length == 1) {
		// another small bug, if you don't do _something_ with the image, getBlob fails. Bug is filed.
		img.info();
	}

	bx:header name="Content-Type" value="image/jpeg"; 
	bx:content variable="#img.getBlob()#";

}
```

As you can see, I basically load up the image in a source directory, perform the relevant transformations, and return the binary data. While working on the blog post I uncovered another issue with the image module which is corrected with the `img.info()` throwaway line. This issue basically relates to the image now returning the right data unless I did *something* to it, hence the `info` call that does nothing. 

Ok, so how is it used? Here's two examples:

```html
<p>
<img src="/img/20250106_073555.jpg/500/500">
</p>
<p>
<img src="/img/20250106_073555.jpg/500/500/grayscale">
</p>
```

And here's the result:

<p>
<img src="https://static.raymondcamden.com/images/2025/08/rw1.jpg" alt="Image resized and grayscaled" class="imgborder imgcenter" loading="lazy">
</p>

Pretty snazzy, right? I could also do some caching here to improve performance, but as I said, this was just a proof of concept. You can find the complete demo here: <https://github.com/ortus-boxlang/bx-demos/tree/master/webapps/rewritedemo/imgdemo>

As always, let me know what you think and leave me a comment below. When I don't get comments I believe I may have died without knowing it and I'm just a ghost. I get the same feeling when the faucets in the bathroom don't turn on. Freaky, I know.

Photo by <a href="https://unsplash.com/@luandmario?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Maria Lupan</a> on <a href="https://unsplash.com/photos/pink-dress-hanging-on-white-wall-bSOJY2RrmGg?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      