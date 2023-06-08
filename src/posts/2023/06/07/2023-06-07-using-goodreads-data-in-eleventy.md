---
layout: post
title: "Using Goodreads Data in Eleventy"
date: "2023-06-07T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/books.jpg
permalink: /2023/06/07/using-goodreads-data-in-eleventy
description: An example of using exported Goodreads data in an Eleventy site.
---

I've been a [Goodreads](https://www.goodreads.com/) user for a few years now, and much like how I use other 'tracking' services, I'm not there for other folks' reading lists or recommendations, but instead, as a way to track what I've read. I especially like looking back over the past year and being reminded of the books I really enjoyed. Recently, myself and others were talking on Mastodon about how to work with this kind of data, other services, and so forth. Goodreads does not have an API unfortunately (it used to, but it shut it down) but they do let you export your data. I decided to take a look at this and see if (and how) it could be used in Eleventy. Here's what I found.

<strong>Edit on June 8, 2023: Be sure to see my update [here](/2023/06/08/using-goodreads-data-in-eleventy-update).</strong>

## Getting your Goodreads data

So, according to this [web page](https://help.goodreads.com/s/article/How-do-I-get-a-copy-of-my-data-from-Goodreads), you can request a copy of your data at any time. I followed the directions there and was presented with a cheerful warning that it could take up to <strong>thirty days</strong> for my request to be processed. 

<p>
<img src="https://static.raymondcamden.com/images/2023/06/waiting.gif" alt="Still waiting" class="imgborder imgcenter" loading="lazy">
</p>

Surprisingly, I requested my data on Sunday afternoon and it was ready by Monday. By no means should you assume that's a standard response rate, but it's probably closer to the normal response time than thirty days. 

Your data export is a zip. You extract that zip and you get... more zips. Lots, and lots of zips. I unzipped them, removed the zips, and here's the list of files I got.

<p>
<img src="https://static.raymondcamden.com/images/2023/06/files.jpg" alt="Lots and lots of JSON files" class="imgborder imgcenter" loading="lazy">
</p>

In case you don't feel like counting, that's <strong>thirty-nine</strong> different files. Honestly, I wasn't sure which file was the one I needed, but I found the relevant information in `review.json`. I don't typically write reviews for books on Goodreads. I'll do a quick start rating, but as I said, I use Goodreads more as a personal log and assume no one else but me gives a darn about what I've read.

The file is an array of records, oddly starting off with one that's more metadata than data:

```json
{
"explanation": [
	"Your shelving and review of a book."
]
},
```

After this is a long (well for me, as I said I've been using it for a while) list of books. My particular data set begins with a lot of books that I set as have been previously read. I believe I did this when I first started. I didn't try to log every single book I've read, that would be impossible, but I probably spent a few minutes adding the ones that came to mind. I only point this out because many of these records don't have data about *when* I read them. 

Here's an example:

```json
{
	"rating": 4,
	"read_status": "read",
	"review": "(not provided)",
	"started_at": "(not provided)",
	"read_at": "(not provided)",
	"comments_count": 0,
	"last_comment_at": "(not provided)",
	"last_revision_at": "2012-02-28 11:18:52 UTC",
	"created_at": "2012-02-28 11:18:52 UTC",
	"updated_at": "2012-02-28 11:18:52 UTC",
	"user": "Raymond",
	"book": "Fahrenheit 451",
	"includes_spoilers": "No",
	"notes": "(not provided)",
	"likes_count": 0
},
```

Later on, when I started recording books as I read them, the data is a bit more complete. Here's an example where I felt really compelled to leave a review:

```json
  {
    "rating": 1,
    "read_status": "read",
    "review": "I feel bad giving this one star as it wasn't a poorly written book, but I absolutely hated the main character so much I just despised the entire read. Sure, it was funny, but a funny story about an asshole is still a story about an asshole. ",
    "started_at": "2014-05-28 07:00:00 UTC",
    "read_at": "2014-06-05 12:13:45 UTC",
    "comments_count": 0,
    "last_comment_at": "(not provided)",
    "last_revision_at": "2014-12-27 15:33:41 UTC",
    "created_at": "2014-05-28 16:03:14 UTC",
    "updated_at": "2016-07-12 09:17:06 UTC",
    "user": "Raymond",
    "book": "Options: The Secret Life of Steve Jobs",
    "includes_spoilers": "No",
    "notes": "(not provided)",
    "likes_count": 0
  },
  ```

  It's important to note that the information about the actual book is next to nothing. You get a title in the `book` property and that's it. Alright, so what can we do with it?

  ## Converting Goodreads data for Eleventy

  For my first demo, I simply copied `review.json` to my project root and then added a new file, `goodreads.js`, to the `_data` directory. This file reads in the JSON and helps simplify it a bit for Eleventy:

  ```js
  const fs = require('fs');

module.exports = () => {

	let reviewData = JSON.parse(fs.readFileSync('./review.json', 'utf8'));

	let books = reviewData.filter(b => (b.read_status === 'read' || b.read_status === 'currently-reading')).map(r => {
		return {
			rating: r.rating, 
			review: r.review !== '(not provided)'?r.review:'',
			started_at: r.started_at !== '(not provided)'?new Date(r.started_at):'',
			read_at: r.read_at !== '(not provided)'?new Date(r.read_at):'',
			title: r.book
		}

	});
	
	return books;
}
```

The first thing I do is filter to items that are marked `read` or `currently-reading`. I had a few records in my data set for books I *wanted* to read and this clears that out. It also removes that first 'meta' item from the array.

Next, I rewrite the data to be a bit simpler. The original data uses `(not provided)` a lot for null values, so you can see where I check for that. I also go ahead and parse the dates. Finally, I rename `book` to `title`. 

With this done, I can use it in a template, like so:

```html
<h1>All the Books</h1>

{% raw %}{% for book in goodreads %}
	{{ book.title }}<br>
	Rating: {{ book.rating }}<br>
	Review: {{ book.review }}<br>
	{% if book.started_at %}
	Started at: {{ book.started_at }}<br>
	{% endif %}
	{% if book.read_at %}
	Read {{ book.read_at }}<br>
	{% endif %}
	<p>
{% endfor %}{% endraw %}
```

It's not pretty, but here's the end of the list:

<p>
<img src="https://static.raymondcamden.com/images/2023/06/books1.jpg" alt="List of books" class="imgborder imgcenter" loading="lazy">
</p>

Most likely you'll want to show your most recent books. That can be done like so:

```html
{% raw %}{% assign books = goodreads | reverse %}
{% for book in books limit:5 %}
{% endraw %}
```

The data is already sorted from oldest to newest so a simple reverse is all you need. You could add the `read_status` value and just display what you're currently reading too. 

## Put some lipstick on that pig...

As I said, the actual book data is limited to just the title. I thought it would be cool if I could get more information. Shockingly, there doesn't seem to be an Amazon API for this. I did find a "Product Advertising API", but it didn't feel right to me. Shockingly (yes I like using that word), Google actually has an API for this and it's free: [Google Books API](https://developers.google.com/books). 

The Google Books API lets you search for books and returned detailed information for them. This includes cover images and I thought that would be great to add to the display. I created an `.eleventy.js` file and built a short code:

```js
const GOOGLE_KEY = process.env.GOOGLE_KEY;

eleventyConfig.addAsyncShortcode('bookcover', async function(book) {
	let search = `intitle:"${book.title}"`;
	let resp = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(search)}&maxResults=1&printType=books&key=${GOOGLE_KEY}`);
	let data = await resp.json();
	if(data.error) {
		console.log(data);
		return '';
	}
	if(data.items && data.items.length >= 1) {
		let foundBook = data.items[0];
		return `<img src="${foundBook.volumeInfo.imageLinks.thumbnail}">`;
	} else return '';

});
```

To use the API, I request a "title" match to help ensure it matches right, I also set the `printType` to `book` to differentiate from magazines and other publications. My code assumes the first result is right (more on that in a second) and returns an image pointing to the cover thumbnail.

So how well did it work? Pretty bad! From what I can tell, the issue is that many of my books are part of a series. So for example, the book may be called "Ruin and Rising", but Goodreads marks it as "Ruin and Rising (The Shadow and Bone Trilogy, #3)". This made most of my tests return nothing. 

While this feels totally unsafe, I added this regex:

```js
book.title = book.title.replace(/ \(.*, #[0-9]+\)/, ''); 
```

And it worked. But like I said, it doesn't necessarily feel safe. But it worked. So... yeah.

<p>
<img src="https://static.raymondcamden.com/images/2023/06/books2.jpg" alt="List of books with covers" class="imgborder imgcenter" loading="lazy">
</p>

## Thoughts?

I got something working, but honestly, I'm not sure how much I'd trust this in production. My hope is that maybe someone sees this code and does the work to make it a bit more stable. With that in mind, feel free to take the code from here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/goodreadstest>