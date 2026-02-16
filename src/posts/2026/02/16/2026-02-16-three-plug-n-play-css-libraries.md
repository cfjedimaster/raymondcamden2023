---
layout: post
title: "Three Plug-N-Play CSS Libraries"
date: "2026-02-16T18:00:00"
categories: ["development"]
tags: ["css"]
banner_image: /images/banners/cats_yellow.jpg
permalink: /2026/02/16/three-plug-n-play-css-libraries
description: Three different simple CSS libraries
---

For probably over a decade, when I wanted to make a demo/site look nice and didn't really care about making it unique, I'd go to [Bootstrap](https://getbootstrap.com/). Bootstrap had a nice, clean look and as I was usually employing it for demos, or admin screens, I didn't care if it looked like every other Bootstrap site. While Bootstrap was *mostly* simple, it's also wordy as heck. Bootstrap has an insane love affair with div tags and even a simple Bootstrap page feels like the line number goes up 4X. Again, that's *fine*, but I found myself wishing for something a bit simpler. That's where the frameworks I'm sharing today come in. For the most part, these libraries require little to no work on your part. You add a CSS library (or two), and everything just gets better. You *can* optionally update your markup a bit, but in general, these libraries are great for the "I don't care, just make it nice and clean" approach that works great for demos and POCs. 

As an example of what I would *not* consider to be "plug-n-play", is the excellent [Shoelace](https://shoelace.style/) library, which requires you to use web components to make use of the library. I really like Shoelace, but the options I'm sharing below are even simpler to use.

To demonstrate what these libraries do out of the box, I'll use this HTML as a template:

```html
<html>
	<head>
	</head>
	
	<body>
		<h1>Sample Page</h1>
		
		<p>
			This is some content. There is other content like my content, but this is my content.
		</p>
		
		<form>
			<p>
			<label for="name">Your Name:</label>
			<input type="text" id="name">
			</p>
			<p>
			<label for="email">Your Email:</label>
			<input type="text" id="email">
			</p>
			<p>
				<label for="comments">Your Comments:</label>
				<textarea id="comments"></textarea>
			</p>
			<p>
				<input type="submit">
			</p>
		</form>
		
		<h2>Cats</h2>
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Gender</th>
					<th>Age (Years)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Luna</td><td>Female</td><td>13</td>
				</tr>
				<tr>
					<td>Grace</td><td>Female</td><td>12</td>
				</tr>
				<tr>
					<td>Pig</td><td>Female</td><td>10</td>
				</tr>
				<tr>
					<td>Zelda</td><td>Female</td><td>2</td>
				</tr>
				<tr>
					<td>Wednesday</td><td>Female</td><td>1</td>
				</tr>
			</tbody>
		</table>
	</body>
</html>
```

It's got a few headers, text, a form, and a table. For comparison's sake with the libraries below, here's how this is rendered:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="OPXYRjM" data-pen-title="CSS PNP - Milligram" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/OPXYRjM">
  CSS PNP - Milligram</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

## Milligram

First one up is also the simplest, [Milligram](https://milligram.io/). The most difficult thing about using it is remembering that it has 2 "L"s in the name, not one. Thanks go to [Todd Sharp](https://recursive.codes/) for sharing this one. Installation is really simple for this library, three CSS links:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.css">
```

After that, there's nothing else to do. Customization options exist, for example, changing the type of button, but there's not much else to it. Here's an example of my default HTML template using the library:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="vEKwXLM" data-pen-title="CSS PNP - Miligram" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/vEKwXLM">
  CSS PNP - Miligram</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

One thing you'll notice is a lack of padding on the sides. In the past I've added a quick `body` style with padding, but if you look at the docs for their [grid](https://milligram.io/#grids) system, you can see that wrapping the content with `<div class="container">` is enough to add padding and center the content. I've made that tweak below:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="ogLRzWm" data-pen-title="CSS PNP - Milligram (2)" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/ogLRzWm">
  CSS PNP - Milligram (2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

All in all, a good update with just two lines of code added.

## Simple.css

Next up is an option I found about a month or so ago and it's currently my favorite, [Simple.css](https://simplecss.org/). Like Milligram, you simply drop in a CSS link:

```html
<!-- Minified version -->
<link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css">
```

There's both a minified and un-minified version. Here's our default HTML with the library applied:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="WbxBGMp" data-pen-title="CSS PNP - Naked" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/WbxBGMp">
  CSS PNP - Naked</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

Gorgeous. Notice it has dark mode support built-in, but if you want, you can force one mode only. There are a few additional things you can do if you want some additional formatting, for example, adding a header or footer will get you a nicely formatted, well, header and footer. In the embed below, I wrapped the `h1` on top:

```html
<header>
<h1>Sample Page</h1>
</header>		
```

And added a footer:

```html
<footer>
    <p>Copy &copy; 2026 Raymond Camden</p>
</footer>
```

And here's how that renders:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="NPrVRYd" data-pen-title="CSS PNP - Simple.css" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/NPrVRYd">
  CSS PNP - Simple.css</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

## Oat

Last up is an option that literally came to my attention three or four hours ago (and when I realized this was a good third option, it motivated this post), [Oat](https://oat.ink/). As an aside, the link there (in case you don't click) is <https://oat.ink/>. I don't think I've ever seen a `.ink` TLD before. Unlike the other two options, this one requires one CSS and one JavaScript library:

```html
<link rel="stylesheet" href="https://unpkg.com/@knadh/oat/oat.min.css">
<script src="https://unpkg.com/@knadh/oat/oat.min.js" defer></script>
```

Initially, this looks a lot like Milligram, including the lack of spacing:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="NPrVREj" data-pen-title="CSS PNP - Naked" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/NPrVREj">
  CSS PNP - Naked</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

As with Milligram, and heck, using the same HTML, you can quickly fix this with their grid system by wrapping your content with `<div class="container">`. Their [docs](https://oat.ink/components/) demonstrate all the various modifications the library adds to a page, including a few web components you get via the JavaScript library, for example, here's a basic [tabs](https://oat.ink/components/#tabs) component:

```html
<ot-tabs>
  <div role="tablist">
    <button role="tab">Account</button>
    <button role="tab">Password</button>
    <button role="tab">Notifications</button>
  </div>
  <div role="tabpanel">
    <h3>Account Settings</h3>
    <p>Manage your account information here.</p>
  </div>
  <div role="tabpanel">
    <h3>Password Settings</h3>
    <p>Change your password here.</p>
  </div>
  <div role="tabpanel">
    <h3>Notification Settings</h3>
    <p>Configure your notification preferences.</p>
  </div>
</ot-tabs>
```

As one more example, I added tabs to the page, the grid system, and added dark mode support by including `data-theme="dark"` to the `body` tag:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="qENGaLG" data-pen-title="CSS PNP - Oak" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/qENGaLG">
  CSS PNP - Oak</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

## More?

If any of yall know of more options like this, I'd love to hear about them. Just drop me a comment below. As I mentioned, Simple.css is my favorite now, but I'm going to give Oat a try in the next demo I build. 

<a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a> licensed <a href="https://wordpress.org/photos/photo/8636531357/">photo</a> by <a href="https://wordpress.org/photos/author/benimub/">Umesh Balayar</a> from the <a href="https://wordpress.org/photos/">WordPress Photo Directory</a>.