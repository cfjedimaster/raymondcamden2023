---
layout: post
title: "Using Goodreads Data in Eleventy - Update"
date: "2023-06-08T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/book.jpg
permalink: /2023/06/08/using-goodreads-data-in-eleventy-update
description: A followup to my previous article on Goodreads and Eleventy
---

Yesterday I [shared a blog post](https://www.raymondcamden.com/2023/06/07/using-goodreads-data-in-eleventy) where I detailed how to take your data export from [Goodreads](https://goodreads.com) and make use of it in an Eleventy site. While describing the process, I mentioned that I wasn't terribly confident in the approach. Things got even worse when I tried to make use of the Google Books API as well. (That's not the fault of the API, more just an issue with how Goodreads reported book titles.) Well, today, [Brian Koser](http://koser.us/) reached out and pointed out a *much* easier way to accomplish the same thing. To be honest, I *love* it when I say something and folks point out a way to make it better - it's like free content for my blog! Anyway, here's what Brian shared. 

Turns out, your bookshelves on Goodreads have an RSS feed. I never noticed it before, and thankfully he shared a screenshot I've included below:

<p>
<img src="https://static.raymondcamden.com/images/2023/06/rss.jpg" alt="RSS icon" class="imgborder imgcenter" loading="lazy">
</p>

Each of your shelves at Goodreads has it's own RSS feed which means you can either fetch all your books, a particular shelf, or just your currently reading list. There are, however, some caveats. 

* Keep in mind that client-side code can't load in RSS directly unless CORS has been set up, and I've *never* seen a RSS feed make use of CORS to let you fetch it remotely.
* You could, however, build a serverless proxy to load it. Of course, you wouldn't just mirror the XML because, XML, eww. You would want to parse it first. That being said, I'm going to stick with the build time, Eleventy data approach for my update.
* The RSS feed for "all" books unfortunately caps the list at 100. You could build logic to get a shelf for each year, *if* you organized your books that way. I have a few "year" shelves, but nothing since 2015. But if you did organize like that, it wouldn't be too hard to write code to get N sets of RSS feeds and just concat the results. It would be manual, but only once a year.
* And finally, the RSS feed Goodreads uses has unique fields in it. Here's an example:

```xml
<item>
    <guid><![CDATA[https://www.goodreads.com/review/show/1927334035?utm_medium=api&utm_source=rss]]></guid>
    <pubDate><![CDATA[Mon, 06 Mar 2017 12:02:40 -0800]]></pubDate>
    <title><![CDATA[Empire's End (Star Wars: Aftermath, #3)]]></title>
    <link><![CDATA[https://www.goodreads.com/review/show/1927334035?utm_medium=api&utm_source=rss]]></link>
    <book_id>30213123</book_id>
    <book_image_url><![CDATA[https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1469404967l/30213123._SY75_.jpg]]></book_image_url>
    <book_small_image_url><![CDATA[https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1469404967l/30213123._SY75_.jpg]]></book_small_image_url>
    <book_medium_image_url><![CDATA[https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1469404967l/30213123._SX98_.jpg]]></book_medium_image_url>
    <book_large_image_url><![CDATA[https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1469404967l/30213123.jpg]]></book_large_image_url>
    <book_description><![CDATA[As the final showdown between the New Republic and the Empire draws near, all eyes turn to a once-isolated planet: Jakku.<br /><br />The Battle of Endor shattered the Empire, scattering its remaining forces across the galaxy. But the months following the Rebellion’s victory have not been easy. The fledgling New Republic has suffered a devastating attack from the Imperial remnant, forcing the new democracy to escalate its hunt for the hidden enemy.<br /><br />For her role in the deadly ambush, Grand Admiral Rae Sloane is the most wanted Imperial war criminal—and one-time rebel pilot Norra Wexley, back in service at Leia’s urgent request, is leading the hunt. But more than just loyalty to the New Republic drives Norra forward: Her husband was turned into a murderous pawn in Sloane’s assassination plot, and now she wants vengeance as much as justice.<br /><br />Sloane, too, is on a furious quest: pursuing the treacherous Gallius Rax to the barren planet Jakku. As the true mastermind behind the Empire’s devastating attack, Rax has led the Empire to its defining moment. The cunning strategist has gathered the powerful remnants of the Empire’s war machine, preparing to execute the late Emperor Palpatine’s final plan. As the Imperial fleet orbits Jakku, an armada of Republic fighters closes in to finish what began at Endor. Norra and her crew soar into the heart of an apocalyptic clash that will leave land and sky alike scorched. And the future of the galaxy will finally be decided.]]></book_description>
    <book id="30213123">
      <num_pages>423</num_pages>
    </book>
    <author_name>Chuck Wendig</author_name>
    <isbn>1101966963</isbn>
    <user_name>Raymond</user_name>
    <user_rating>5</user_rating>
    <user_read_at><![CDATA[Mon, 06 Mar 2017 12:02:40 -0800]]></user_read_at>
    <user_date_added><![CDATA[Mon, 06 Mar 2017 12:02:40 -0800]]></user_date_added>
    <user_date_created><![CDATA[Tue, 28 Feb 2017 06:20:51 -0800]]></user_date_created>
    <user_shelves></user_shelves>
    <user_review></user_review>
    <average_rating>3.78</average_rating>
    <book_published>2017</book_published>
    <description>
      <![CDATA[
      <a href="https://www.goodreads.com/book/show/30213123-empire-s-end?utm_medium=api&amp;utm_source=rss"><img alt="Empire&#39;s End (Star Wars: Aftermath, #3)" src="https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1469404967l/30213123._SY75_.jpg" /></a><br/>
                                      author: Chuck Wendig<br/>
                                      name: Raymond<br/>
                                      average rating: 3.78<br/>
                                      book published: 2017<br/>
                                      rating: 5<br/>
                                      read at: 2017/03/06<br/>
                                      date added: 2017/03/06<br/>
                                      shelves: <br/>
                                      review: <br/><br/>
                                      ]]>
    </description>
</item>
```

My XML/RSS is a bit rusty, but I believe you are supposed to specify additional items and I don't see them doing that, but luckily it's easily enough to handle. 

## Parsing the RSS

Alright, as I said above, I'm still going to use Eleventy data which means my information will be as up to date as the last build. I wish I could say I was still reading 1-2 books a week like I did as a kid, but that ship sailed a long time ago. To begin, I got my RSS feed for "all" (keeping in mind it's only 100 items) and parsed it like so:

```js
const Parser = require('rss-parser');
let parser = new Parser({
	customFields: {
		item: ['book_image_url','book_small_image_url','book_medium_image_url','book_large_image_url',
		'book_description','book','author_name','isbn','book_published','user_read_at','user_review','user_rating','user_shelves']
	}
});
```

Normally `rss-parser` is much simpler to use, but in order to get the non-standard fields in, I have to pass in a list of custom fields in the `item` property. There's more here than what I specified but I only grabbed what I thought was important. 

To get the items, it's one line:

```js
let feed = await parser.parseURL('https://www.goodreads.com/review/list_rss/7962326?key=Ec1w1KAYYmxfKil4LNjNHm0vEWA2ksM3KjJI2Q5KdXT-MRBJ&shelf=%23ALL%23');
```

Next I need to reformat this into something nicer. As before, I'm going to filter out books I set as wanting to read, but I do it a bit differently:

```js
return feed.items.filter(f => f.user_shelves !== 'to-read')
```

There isn't a shelf for many of my books so I have to just filter out the ones I definitely marked as wanting to read. After filtering, I map to a new shape. This is pretty close to the previous version except now I have images!

```js
return {
	title: i.title,
	images: {
		url:i.book_image_url,
		small:i.book_small_image_url,
		medium:i.book_medium_image_url,
		large:i.book_large_image_url
	},
	description:i.description, 
	numPages: i.book.num_pages[0],
	author:i.author_name,
	link:i.guid,
	review:i.user_review,
	rating:i.user_rating,
	read_at:i.user_read_at!==''?new Date(i.user_read_at):''
}
```

The most critical part here is `read_at`, as I set to a real date when I can, and an empty string when I can't. I don't think that's a great solution as I follow up with this sort:

```js
}).sort((a,b) => {
	return a.read_at - b.read_at;
});
```

And when the date is blank, I should do... something. I just don't honestly know what. I *believe* the dates are read for the sets of books I marked as having read already. While it could be done better, here's the new data file:

```js
const Parser = require('rss-parser');
let parser = new Parser({
	customFields: {
		item: ['book_image_url','book_small_image_url','book_medium_image_url','book_large_image_url',
		'book_description','book','author_name','isbn','book_published','user_read_at','user_review','user_rating','user_shelves']
	}
});

module.exports = async function() {

	let feed = await parser.parseURL('https://www.goodreads.com/review/list_rss/7962326?key=Ec1w1KAYYmxfKil4LNjNHm0vEWA2ksM3KjJI2Q5KdXT-MRBJ&shelf=%23ALL%23');

	return feed.items.filter(f => f.user_shelves !== 'to-read').map(i => {
		return {
			title: i.title,
			images: {
				url:i.book_image_url,
				small:i.book_small_image_url,
				medium:i.book_medium_image_url,
				large:i.book_large_image_url
			},
			description:i.description, 
			numPages: i.book.num_pages[0],
			author:i.author_name,
			link:i.guid,
			review:i.user_review,
			rating:i.user_rating,
			read_at:i.user_read_at!==''?new Date(i.user_read_at):''
		}
	}).sort((a,b) => {
		return a.read_at - b.read_at;
	});

};
```

## Displaying the Books

As I said, I *mostly* matched the shape of books from the previous post. Here's all the books (again, "all" being just 100):

```html
{% raw %}{% for book in goodreads %}
	{{ book.title }}<br>
	Rating: {{ book.rating }}<br>
	Review: {{ book.review }}<br>
	{% if book.read_at %}
	Read {{ book.read_at }}<br>
	{% endif %}
	<p>
{% endfor %}{% endraw %}
```

And even better, the version with images:

```html
<h1>Last 5 Books (with pics)</h1>

{% raw %}{% assign books = goodreads | reverse %}
{% for book in books limit:5 %}
	<div class="books">
		<div>
		<img src="{{ book.images.large }}"><br>
		<a href="{{ book.link }}">{{ book.title }}</a><br>
		Rating: {{ book.rating }}<br>
		Review: {{ book.review }}<br>
		{% if book.read_at %}
		Read at {{ book.read_at }}<br>
		{% endif %}
		</div>
	</div>
{% endfor %}{% endraw %}
```

And now *all* the images work!

<p>
<img src="https://static.raymondcamden.com/images/2023/06/covers.jpg" alt="Example output of books with covers" class="imgborder imgcenter" loading="lazy">
</p>

You can find the source code for this demo here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/goodreadstest2> 

Thank you again to  [Brian](http://koser.us/) for the share!