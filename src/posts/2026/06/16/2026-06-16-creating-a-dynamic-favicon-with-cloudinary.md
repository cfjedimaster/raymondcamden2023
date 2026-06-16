---
layout: post
title: "Creating a Dynamic Favicon with Cloudinary"
date: "2026-06-16T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/icons.jpg
permalink: /2026/06/16/creating-a-dynamic-favicon-with-cloudinary
description: How to use Cloudinary to create dynamic favicons and change them in the browser.
---

Ok, chalk this up to something I may never actually use in production, but I was curious how well the browser would handle changing the favicon of a tab on the fly, and combining that with [Cloudinary](https://cloudinary.com) to dynamically modify the source. The inspiration for this was something simple - Google Calendar's favicon is unique per day, so for example, right now I see this:

<p>
<img src="https://static.raymondcamden.com/images/2026/06/fav1.png" loading="lazy" alt="Google Calendar favicon" class="imgborder imgcenter">
</p>

As there is - at most - 31 days in a month - my assumption is that they simply generated all 31 at some point and in their code serving up the web page, they select the right one. To be honest, it's subtle and I don't always notice it, but it's a nice effect. I decided to take a look at how I'd implement this in Cloudinary with JavaScript.

## The Icon

For my icon, I grabbed this nice cat icon from Flaticon: <https://www.flaticon.com/free-icon/cat_8564642>

<p>
<img src="https://res.cloudinary.com/raymondcamden/image/fetch/https://static.raymondcamden.com/images/2026/06/cat.png" loading="lazy" alt="Cat icon" class="imgborder imgcenter">
</p>

Nice and simple, and not a bad choice for an icon. 

This was originally a png, which you can use for a favicon, but I used Cloudinary's URL transformations to both resize it and turn it into an ICO (I added a linebreak to the URL to help it wrap):

```
https://res.cloudinary.com/raymondcamden/image/ 
fetch/c_fit,w_32/f_ico/https://static.raymondcamden.com/images/2026/06/cat.png
```

The size is handled in `c_fit,w_32`, setting it to 32 pixels wide while `f_ico` changes the format to ICO. 

## Adding Text

Cloudinary's transformations support adding text layers to the image, so the next thing I tried was adding that to the icon:

```
https://res.cloudinary.com/raymondcamden/image/
fetch/c_fit,w_32,o_33/f_ico/l_text:Arial_28_bold_center:1/fl_layer_apply/
https://static.raymondcamden.com/images/2026/06/cat.png
```

In the URL above, the portion beginning `l_text` is where I define my font, size, styling, position and finally, the actual number. I also added an opacity to the icon to make the text stand out. You can see that here, `o_33`, where 33 is the percent and was based on me just playing around until I felt the text was most clear.

You can see it here:

<p>
<img src="https://res.cloudinary.com/raymondcamden/image/fetch/c_fit,w_32,o_33/f_ico/l_text:Arial_28_bold_center:1/fl_layer_apply/https://static.raymondcamden.com/images/2026/06/cat.png" loading="lazy" alt="Cat icon" class="imgborder imgcenter">
</p>

This worked well with 99 as well, but at most I think 2 characters is all you would want to fit in there.

## Putting it Together

Alright, so for my fancy demo, I started off with a bit of HTML and a hard-coded favicon pointing to my cat:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
		<link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css">
    <link rel="stylesheet" href="./style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <link id="favicon" rel="icon" type="image/x-icon" href="https://res.cloudinary.com/raymondcamden/image/fetch/c_fit,w_32/f_ico/https://static.raymondcamden.com/images/2026/06/cat.png">
    <title>Pen</title>
  </head>
  <body>

		<h2>Dynamic Favicon via Cloudinary</h2>
		 <p>
			 This demo shows how to dynamically create a favicon
			 via Cloudinary. It uses a source image that's resized and converted to ICO, but then can also support dynamic text (well, a small amount) written to the icon.
		 </p>
		<p>
			<button id="addBtn">Click me to increase the #</button>
			<button id="resetBtn">Click me to reset the #</button>
		</p>
		<script src="./script.js"></script>
  </body>
</html>
```

Note I've got two buttons. Each time you click the add button, I'm going to update the favicon with a number, while the reset button simply resets to the default. 

Here's the JavaScript:

```js
// Number used in the favicon
let NUMBER = 0;

document.addEventListener('DOMContentLoaded', async () => {

	const $favico = document.querySelector('#favicon');
	const defaultIco = $favico.href;
	
	document.querySelector('#addBtn').addEventListener('click', () => {
		NUMBER++
		setIco();
	});

	document.querySelector('#resetBtn').addEventListener('click', () => {
		NUMBER = 0;
		setIco();
	});
	
	const setIco = () => {
		if(NUMBER > 0) {
			$favico.href = `https://res.cloudinary.com/raymondcamden/image/fetch/c_fit,w_32,o_33/f_ico/l_text:Arial_28_bold_center:${NUMBER}/fl_layer_apply/https://static.raymondcamden.com/images/2026/06/cat.png`;
		} else {
			$favico.href = defaultIco;
		}
	};
	
}, false);
```

I grab a pointer to the favicon link in my HTML and copy out the default href value. Then I simply use two event handlers to handle each button. One increases the number, one resets it to 0. The last bit, `setIco`, just changes the href value.

You can test this yourself here: <https://giving-flower-sunfish.codepen.app>. In my testing with Chrome, it worked well. I saw the favicon update within about a second of clicking. YMMV of course. I just tested in Firefox and it worked just fine as well.

I've embedded the CodePen below, but of course you will need to run the deployed version to see it in action. Enjoy!

<p class="codepen" data-theme-id="dark" data-height="500" data-pen-title="Untitled" data-preview="true" data-version="2" data-default-tab="result" data-slug-hash="pvRNago" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/editor/cfjedimaster/pen/019ed120-9ee6-7141-af43-13ae7c7cc8f1">
  Untitled</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>