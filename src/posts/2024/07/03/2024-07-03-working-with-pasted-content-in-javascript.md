---
layout: post
title: "Working with Pasted Content in JavaScript"
date: "2024-07-03T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_paste.jpg
permalink: /2024/07/03/working-with-pasted-content-in-javascript
description: How to handle pasted content with vanilla JavaScript.
---

This began as me wanting to build an [Alpine.js](https://alpinejs.dev/) application that handled pasted input, but I realized before I looked into handling this with Alpine, it made sense to start with basic vanilla JavaScript at first. I've worked with the clipboard before, mainly storing information to it, but this was the first time I looked at handling input from the clipboard. The web platform handles it rather nicely, but as with most things, there are a few interesting things you need to be aware of. Here's what I found.

## Listening To the Event

The first thing you need to do is actually listen to the event. While you probably listen on a part of a DOM, it made the most sense to me to listen at the window level:

```js
window.addEventListener('paste', e => {
	// do stuff
});
```

Easy peasy.

## Handling the Event

Now comes the fun part. When the event is fired, your event object gets a [`clipboardData`](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent/clipboardData) object. This object is used both for reading and writing to the clipboard. You can, if you choose, prevent the default paste behavior with the usual `e.preventDefault()`. This will impact pasting into form fields for example. 

There are then two ways you can access the data from the paste. The first involves the [`getData`](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/getData) method which as you would expect, gets data from the clipboard. The MDN docs say you have to specify the type of the data, giving `text/plain` and `text/uri-list` as examples. Let's look at how this works. 

If you do:

```js
let data = e.clipboardData.getData('text/plain');
```

You get the text of the pasted content. What's interesting is that if you copy HTML, you get a plain text copy of the HTML. That's expected, but could be handy if you wish to disregard any formatting. If you want the HTML, you can do:

```js
let data = e.clipboardData.getData('text/html');
```

Interestingly enough, if you take this result and add it to the DOM, it looks great. For example, consider this super simple HTML/CSS block:

<p class="codepen" data-height="300" data-default-tab="result" data-slug-hash="KKLOLxJ" data-pen-title="Scratch" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/KKLOLxJ">
  Scratch</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Note the use of a background color for the body as well as a specific `P` color. If I select the text from that, and paste it into my app where I'm testing the API, it actually renders with the styles:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/paste1.jpg" alt="Screenshot of rendered HTML" class="imgborder imgcenter" loading="lazy">
</p>

If you `console.log` that result, you can see the clipboard contained a lot more HTML (I added line breaks for readability):

```html
<meta charset='utf-8'>
<span style='color: rgb(255, 192, 203); font-family: Times; font-size: 25px; font-style: normal; 
font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 700; letter-spacing: normal; 
orphans: 2; text-align: start; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px;
 -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(0, 0, 0); 
 text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; 
 display: inline !important; float: none;'>Hello World</span>
```

That's text, but what if you paste a file? For example, on my desktop, I can select one or more files, copy, and then paste. In that event, the `clipboardData` object contains a `files` array, and this works just like an `input[type=file]` DOM element. You can read and work with the files for whatever purposes you desire. 

So for example:

```js
if(e.clipboardData.files.length) {
	console.log('handle a file');
	/*
	Files can be 2 or more, but we'll focus on 1 for img preview
	*/
	let file = e.clipboardData.files[0];
	console.log(e.clipboardData.files.length);
	if(file.type.startsWith('image/')) {
		console.log('image in cb');
		previewImage(file);
	}
	// more stuff
```

The `previewImage` function is just a utility to read and display the image in the DOM:

```js
function previewImage(file) {
	let reader = new FileReader();

	reader.onload = e => {
		img.src = e.target.result;
	}

	reader.readAsDataURL(file);
    
}
```

Taken together, you could check for `.files` to look for binary data, and then run `getData` to see if you've got anything there. Or vice-versa. Whatever makes sense for your application. 

To see this in action, I built a little CodePen. When you paste in text, it *should* render to the DOM the plain text and HTML version of it. If you copy and paste an image specifically, it should render it.

<p class="codepen" data-height="300" data-default-tab="result" data-slug-hash="RwmXNea" data-pen-title="Paste1" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/RwmXNea">
  Paste1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

You could, absolutely, handle non-images and more than one file. You would need some way to render it in the DOM and that would be an exercise for the reader. (I am on vacation after all. ;) But again, this is just like an `input[type=file]`. Once the user *gives* you the file, you can work with it. That also includes using it in a API call via `fetch` or a form post. 

## What about Word and Acrobat?

Now for something interesting. As a quick text, I opened up a Word document. When I copied a block of text from it, the clipboard contained an image *and* text. This means the simple if/else block I used above may not be appropriate, or, it may make sense to reverse the order and look for data before files. You can also get `text/html` from a Word paste if you feel like seeing an abomination.

Acrobat did not send along a file object, but did support both plain text and HTML well. Hit up the CodePen above and let me know what you see. 