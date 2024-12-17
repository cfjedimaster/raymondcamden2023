---
layout: post
title: "Adding PDFs to Your Webpage without JavaScript"
date: "2024-12-17T18:00:00"
categories: ["development"]
tags: []
banner_image: /images/banners/cat_frame.jpg
permalink: /2024/12/17/adding-pdfs-to-your-webpage-without-javascript
description: Using the web browser's built in PDF viewer. 
---

In my time at Adobe, one of the products I evangelized was the [PDF Embed API](https://developer.adobe.com/document-services/apis/pdf-embed/), a JavaScript library for adding PDFs to a web page. I still recommend this library of course, but I was thinking this morning about how you could get similar results without JavaScript. Remember, you *are* allowed to build a web page and not ship any JavaScript. It's ok, I won't tell.

Before looking at what I built, some context to why someone would use a library like Adobe's PDF Embed:

* Browser's have great built-in PDF support, natively, but the display is typically the entire page, which means you lose the context of the rest of your site.
* There's limited to no interaction between the PDF and your code, so if you want to do reporting ("Most users read only X pages of the document") or interaction ("on page load, go to page X and highlight word Y"), you're out of luck. 

## The Simple Solution

That being said, is there a simpler solution to getting a PDF into a web page, in context with the rest of the page? Absolutely - an `iframe`. This is probably obvious, but I don't necessarily see this often "in the wild". Here's a simple example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title></title>
	<style>
	main {
		width: 80%;
		margin: auto;
	}
	</style>
</head>
<body>

<main>
<h2>My Site</h2>

<p>
<a href="https://static.raymondcamden.com/enclosures/cat.pdf">cat.pdf</a>
</p> 

<iframe src="https://static.raymondcamden.com/enclosures/cat.pdf" 
	width="100%" height="700px" loading="lazy"></iframe>
</main>

</body>
</html>
```

I've got two main elements on the site. First, a direct link to the PDF, which honestly isn't needed but I kept it there in case I wanted to hit the PDF directly, and then an iframe pointing to the same thing. I'm able to size the iframe, in this case with attributes, but CSS could have used as well. 

Also note that `iframe` supports lazy loading which means if this element were on a larger page, farther down the viewport, the PDF wouldn't even load at first. However, note that the "how far away until load" logic is a bit different in Chromium browsers. I noticed it was still loading for me even off screen, but if I added a good chunk of padding, it eventually worked as expected. This [comment](https://support.google.com/webmasters/thread/109549866/chrome-new-lazy-loading-parameter-does-not-work?hl=en) on Google's support forums suggests this is expected. I did a similar test in Firefox and the 'window' to get the PDF to not load was somewhat smaller. Just keep in mind, YMMV here, but as it takes all of two seconds to add the attribute, I would do so.

Finally, also note that CSP will play a part here, but my assumption is that you're going to be displaying your own PDFs. If you intend to iframe another site's PDF document, test first!

You can see this demo here: <https://cfjedimaster.github.io/webdemos/iframe_pdf/test1.html>

Note that you want to set the dimensions of your iframe based on the contents of the PDF. The one I used could probably have used a thinner, taller iframe. I point this out to just remind folks that design is not my strongest skill. (Or second strongest...)

## Getting Dynamic 

As I mentioned, one of the things that Adobe's PDF library gives you is more control over the experience, and the ability to use JavaScript to manipulate the PDF a bit. Believe it or not, there's support for *some* of this just by using a tweak to the URL. It's impossible to find on Adobe's site anymore, but I found a [copy](https://pdfobject.com/pdf/pdf_open_parameters_acro8.pdf) of the Acrobat docs for 'Parameters' which work with hash marks. Ie, this URL:

<a href="https://static.raymondcamden.com/enclosures/cat.pdf" target="_blank">https://static.raymondcamden.com/enclosures/cat.pdf</a>

Goes right to the PDF. This URL, however, goes to page 2:


<a href="https://static.raymondcamden.com/enclosures/cat.pdf#page=2" target="_blank">https://static.raymondcamden.com/enclosures/cat.pdf#page=2</a>

If you look at the [documentation](https://pdfobject.com/pdf/pdf_open_parameters_acro8.pdf), there's a number of different options, but support is a bit hit or miss. Setting the page seems to work consisntently. Turning off the toolbar didn't work in Safari. Search, which seems *really* useful, but only worked in Firefox. If you want to use one of these options, again, it's harmless, but test first, and be ok with it not working. Here's a simple example of embedding a PDF and starting on page 2:

```html
<iframe src="https://static.raymondcamden.com/enclosures/cat.pdf#page=2" 
	width="100%" height="700px" loading="lazy"></iframe>
```

And here it is:

<iframe src="https://static.raymondcamden.com/enclosures/cat.pdf#page=2" 
	width="100%" height="700px" loading="lazy"></iframe>

Turning off the toolbar only seemed to work in Chromium for me, but, it does give a bit more focus to the PDF if you are ok removing user controls:

```html
<iframe src="https://static.raymondcamden.com/enclosures/cat.pdf#toolbar=0" 
	width="100%" height="700px" loading="lazy"></iframe>
```

And the result:

<iframe src="https://static.raymondcamden.com/enclosures/cat.pdf#toolbar=0" 
	width="100%" height="700px" loading="lazy"></iframe>

Note that while you can easily use JavaScript to change the `src` value of an iframe, for me, this never worked, even if I included a bit of random junk at the end via `new Date()`. You *could* remove the `iframe` and add a new one, but that feels a bit heavy-handed to me. That being said, it did lead me to my next demo.

## A PDF Viewer

Given that we can change the src of an iframe, it would be possible to build a simple, inline, PDF viewer for multiple documents. I'll begin with a list of two PDFs and a default one visible in the iframe:

```html
<p>
<a href="https://static.raymondcamden.com/enclosures/cat.pdf">cat.pdf</a> ~ 
<a href="https://static.raymondcamden.com/enclosures/gilbane.pdf">gilbane.pdf</a>
</p> 

<iframe src="https://static.raymondcamden.com/enclosures/cat.pdf" 
	width="100%" height="700px" loading="lazy" id="pdfFrame"></iframe>
```

Next, I'll use a bit of JavaScript to handle the clicks:

```js
document.addEventListener('DOMContentLoaded', () => {
	let pdfFrame = document.querySelector('#pdfFrame');
	let pdfLinks = document.querySelectorAll('a[href$=".pdf"]');
	pdfLinks.forEach(p => {
		p.addEventListener('click', e => {
			e.preventDefault();
			let url = e.currentTarget.href;
			pdfFrame.src = url;
		});
	});
});
```

Basically, grab all the links to PDFs, and for each, use an event handler to bypass the normal link and instead update the iframe. You can demo this here:

<https://cfjedimaster.github.io/webdemos/iframe_pdf/test4.html>

You could get more fancy. I could update the browser's URL to specify a particular PDF (`?pdf=gilbane.pdf`) such that if the link was shared with others, and a bit more code was used, the iframe would default to another PDF. 

Also note as I said above, the width and height I picked isn't necessarily the best, and the two PDFs used here don't have the same form factor. I'd expect usually you would want to think about that for your list of PDFs.

Pretty simple, right? If you want to grab a copy of the code I used above, you can find it at my repo here: <https://github.com/cfjedimaster/webdemos/tree/master/iframe_pdf>