---
layout: post
title: "Building a Web Version of Your Mastodon Archive with Eleventy"
date: "2024-07-04T18:00:00"
categories: ["javascript","jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/kitten_sparklers.jpg
permalink: /2024/07/04/building-a-web-version-of-your-mastodon-archive-with-eleventy
description: Turning your Mastodon archive into a web site with Eleventy
---

A couple of days ago [Fedi.Tips](https://social.growyourown.services/@FediTips), an account that shares Mastodon tips, asked about how non-technical users could make use of their Mastodon archive. Mastodon makes this fairly easy (see this [guide](https://fedi.tips/how-to-download-your-mastodon-post-archive/) for more information), and spurred by that, I actually started work on a simple(ish) client-side application to support that. (You can see it here: <https://tootviewer.netlify.app>) This post isn't about that, but rather, a look at how you can turn your archive into a web site using [Eleventy](https://11ty.dev). This is rather rough and ugly, but I figure it may help others. Here's what I built.

## Start with a Fresh Eleventy Site

To begin, I just created a folder and `npm` installed Eleventy. I'm using the latest 2.0.1 build as I'm not quite ready to go to the 3.X alpha. 

## Store the Archive

I shared the [guide](https://fedi.tips/how-to-download-your-mastodon-post-archive/) above, but to start, you'll need to request and download your archive. This will be a zip file that contains various JSON files as well as your uploaded media. 

My thinking is that I wanted to make it as easy as possible to use and update your Eleventy version of the archive, so with that in mind, I created a folder named `_data/mastodon/archive`. The parent folder, `_data/mastodon`, will include custom scripts, but inside `archive`, you can simply dump the output of the zip. 

## Expose the Data

Technically, as soon as I copied crap inside `_data`, it was available to Eleventy. That's awesome and one of the many reasons I love Eleventy. While the data from the archive is "workable", I figured it may make sense to do a bit of manipulation of the data to make things a bit more practical. 

To be clear, everything that follows is my opinion and could probably be done better, but here's what I did.

First, I made a file named `_data/mastodon/profile.js` which serves the purpose of exposing your Mastodon profile info to your templates. Here's the entire script:

```js
// I do nothing except rename actor
let data = require('./archive/actor.json');

module.exports = () => {
	return data;
}
```

So, I started this file with the intent of removing stuff from the original JSON that I didn't think was useful and possibly renaming things here and there and... I just stopped. While there are a few things I think could be renamed, in general, it's ok as is. I kept this file with the idea that it provides a 'proxy' to the archived file and in the future, it could be improved. 

For your toots, the Mastodon archive stores this in `outbox.json` file. I added `_data/mastodon/toots.js`:

```js
let data = require('./archive/outbox.json');

module.exports = () => {
	return data.orderedItems.filter(m => m.type === 'Create').reverse();
}
```

This is slightly more complex as it does two things - filtered to the `Create` type, which is your actual toots, and then sorts then newest first. (That made sense to me.) Again, there's probably an argument here for renaming/reformatting the data, but I kept it as is for now.

## Rendering the Profile

With this in place, I could then use the data in a Liquid page like so:

```html
{% raw %}<h2>Mastodon Profile</h2>

{{ mastodon.profile.name }} ({{ mastodon.profile.preferredUsername }})<br>

{{ mastodon.profile.summary }}

<h2>Properties</h2>

<p>
<b>Joined:</b> {{ mastodon.profile.published | dtFormat }}
</p>

{% for attachment in mastodon.profile.attachment %}
<p>
	<b>{{ attachment.name }}: </b> {{ attachment.value }}
</p>
{% endfor %}{% endraw %}
```

Right away you can see one small oddity which I could see being corrected in `profile.js`, your join date is recorded as a `published` property. I really struggled with renaming this but then got over it. Again, feel free to do this in your version! That `dtFormat` filter is a simple `Intl` wrapper in my `.eleventy.js` config file.

Ditto for `attachment` which are the 'extra' bits that get displayed in your Mastodon profile. You can see them here:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/m1.jpg" alt="Screenshot of my Mastodon profile" class="imgborder imgcenter" loading="lazy">
</p>

With no CSS in play, here's my profile rendering on my Eleventy site:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/m2.jpg" alt="Screenshot of my Mastodon profile via Eleventy" class="imgborder imgcenter" loading="lazy">
</p>

That's the profile, how about your toots?

## Rendering the Toots

I just love the word "toot", how about you? I currently have nearly two thousand of them, so for this, I decided on pagination. My `toots.liquid` file began with:

```
---
pagination:
    data: mastodon.toots
    size: 50
    alias: toots
---
```

That page size is a bit arbitrary and honestly, feels like a lot on one page, but it was a good starting point. My initial version focused on rendering the date and content of the toot:

```html
{% raw %}<style>
div.toot {
	border-style: solid;
	border-width: thin;
	padding: 10px;
	margin-bottom: 10px;
}
</style>

<h2>Toots</h2>

{% for toot in toots %}
<div class="toot">
<p>
	Published: {{ toot.published | dtFormat }}
</p>

<p>
{{ toot.object.content }}
</p>

<p>
<a href="{{ toot.object.url }}" target="_new">Link</a>
</p>
</div>
{% endfor %}{% endraw %}
```

At the end of the page, I added pagination:

```html
{% raw %}<hr>

<p>
Page: 
{%- for pageEntry in pagination.pages %}
<a href="{{ pagination.hrefs[ forloop.index0 ] }}"{% if page.url == pagination.hrefs[ forloop.index0 ] %} aria-current="page"{% endif %}>{{ forloop.index }}</a></li>
{%- endfor %}
</p>{% endraw %}
```

While not terribly pretty, here's how it looks:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/m3.jpg" alt="Screenshot of my Mastodon Toots" class="imgborder imgcenter" loading="lazy">
</p>

Not shown is the list of pages, which at 50 a pop ended up at **thirty-seven** unique pages. I don't think anyone is going to paginate through that, but there ya go.

## Supporting Images

One thing missing from the toot display was embedded attachments, specifically images. In the zip file, these attachments are stored in a folder named `media_attachments` with multiple levels of numerically named subdirectories. A toot may refer to it in JSON like so:

```json
"attachment": [
	{
		"type": "Document",
		"mediaType": "image/png",
		"url": "/media_attachments/files/112/689/247/193/996/228/original/38d560658c00a4e8.png",
		"name": "A picture of kittens dressed as lawyers. ",
		"blurhash": "ULFY0?s,D%~W~p%Js+^+xpt6tR%LRQaeoes.",
		"focalPoint": [
			0.0,
			0.0
		],
		"width": 2000,
		"height": 2000
	}
],
```

Not every attachment is an image, but I turned to Eleventy's [Image plugin](https://www.11ty.dev/docs/plugins/image/) for help. It handles *everything* possible when it comes to working with images. Using a modified version of the example in the docs, I built a new shortcode named `mastodon_attachment` to support this:

```js
eleventyConfig.addShortcode('mastodon_attachment', async function (src, alt, sizes) {
	/*
	todo, support other formats
	*/

	let IMG_FORMATS = ['jpg','gif','png','jpeg'];

	let format = src.split('.').pop();
	if(IMG_FORMATS.includes(format)) {

		// check for valid image 
		let mSrc = './_data/mastodon/archive' + src;
		let metadata = await Image(mSrc, {
			widths: [500],
			formats: ['jpeg'],
		});

		let imageAttributes = {
			alt,
			sizes,
			loading: 'lazy',
			decoding: 'async',
		};

		// You bet we throw an error on a missing alt (alt="" works okay)
		return Image.generateHTML(metadata, imageAttributes);

	}

	// do nothing
	console.log('mastodon_attachment sc - unsupported ext', format);
	return '';

});
```

Breaking it down, it looks at the `src` attribute and if it's an image, uses the Image plugin to create a resized version as well as return an HTML string I can drop right into my template. I went back to my `toots.liquid` template and added support like so:

```html
{% raw %}{% if toot.object.attachment %}

	{% for attachment in toot.object.attachment %}

		{% mastodon_attachment attachment.url, attachment.name %}

	{% endfor %}

{% endif %}{% endraw %}
```

The `name` value of the attachment ends up being the `alt` for the image, and currently, I just ignore non-images, but you could certainly do something else, like link to it perhaps for downloading at least. Here's an example of it in use:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/m4.jpg" alt="Screenshot of a toot with an image" class="imgborder imgcenter" loading="lazy">
</p>

## Show Me the Code!

Ok, this was all done in about an hour or so, and as I think I said, it's ugly as sin, but in theory, if you make it prettier then you're good to go. You can deploy, wait a few months and get a new archive, unzip, and deploy again. Feel free to take this code and run - you can't make it any uglier. ;)

<https://github.com/cfjedimaster/eleventy-demos/tree/master/masto_archive>

