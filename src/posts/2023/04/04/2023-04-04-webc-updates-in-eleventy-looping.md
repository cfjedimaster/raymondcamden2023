---
layout: post
title: "WebC Updates in Eleventy - Looping"
date: "2023-04-04T18:00:00"
categories: ["development","jamstack"]
tags: ["javascript","web components","eleventy"]
banner_image: /images/banners/orangejuice.jpg
permalink: /2023/04/04/webc-updates-in-eleventy-looping
description: A look at another new WebC feature - looping
---

Last week I took a look at [updates to WebC support](https://www.raymondcamden.com/2023/03/28/webc-updates-in-eleventy) in Eleventy, specifically if/else support. In that last update, looping support was added as well so I thought I'd build a quick little demo showing it in action. As usual, I ended up finding another new feature/change to WebC so it was good practice at WebC in general. Here's what I came up with. 

For my demo, I decided to build a simple WebC component for a lightbox image gallery. I've made use of [Parvus](https://github.com/deoostfrees/Parvus) before and it's a nice, and pretty simple, library for lightbox UI. Once you have the JavaScript and CSS loaded in your page, you can use by doing two things. 

First, wrap your thumbnails with links to the full-size image, and ensure you use the `lightbox` class:

```html
<a href="path/to/image.jpg" class="lightbox">
  <img src="path/to/thumbnail.jpg" alt="">
</a>
```

Then you just need one line of code:

```js
const prvs = new Parvus();
```

Obviously you can get more complex with it, but in general, it's fairly simple to use. Here's how I built a WebC wrapper for it. I began by creating a `_data` file named `images.json`:

```js
[
  {
    "thumb": "https://placehold.co/200x200/png/red/?.png",
    "url": "https://placehold.co/600x400/png?.png"
  },
  {
    "thumb": "https://placehold.co/200x200/png/blue?.png",
    "url": "https://placehold.co/600x400.png?.png"
  },
  {
    "thumb": "https://placehold.co/200x200/png/green?.png",
    "url": "https://placehold.co/400x600.png?.png"
  },
  {
    "thumb": "https://placehold.co/200x200/png/yellow?.png",
    "url": "https://placehold.co/600x400.png?.png"
  },
  {
    "thumb": "https://placehold.co/200x200/png/black?.png",
    "url": "https://placehold.co/600x400.png?.png"
  },
  {
    "thumb": "https://placehold.co/200x200/png/purple?.png",
    "url": "https://placehold.co/600x400.png?.png"
  }
]
```

My data is an array of objects, each with a `thumb` and `url` key. I'm using a placeholder service to simplify working with unique URLs. With this data, I can then pass it to a WebC component. I created `index.webc`, and added the following:

```html
<lightbox :@images="images"></lightbox>
```

I haven't defined `lightbox.webc` yet, but for now I just add it to my page and pass in my data. There are three ways of passing attributes to WebC components, but it's important to note that if you are passing *complex* data, like an array of objects, you need to use the [dynamic attributes and properties](https://www.11ty.dev/docs/languages/webc/#dynamic-attributes-and-properties) feature. 

Now let's look at the component:

```html
<div webc:root="override">

	<div webc:for="image of images" >
		<a :href="image.url" class="lightbox">
		<img :src="image.thumb">
		</a>
	</div>

</div>

<style webc:scoped>
:host {
	display: flex;
	align-items: center;
	flex-direction: row;
	flex-wrap: wrap;
}

:host img {
	max-width:300px;
	max-height:300px;
	padding: 10px;
}
</style>

<script>
const init = () => {
	new Parvus();
}

document.addEventListener('DOMContentLoaded', init, false);
</script>
```

Let's focus on the top first. My HTML has one main wrapped div (I use `webc:root` to remove `<lightbox>` from the resulting HTML, I don't need it) and then the new feature is in the inner div. I use `webc:for` to loop over the array of data passed to it and output a link to each main image and output the thumbnail. 

The rest of the component handles CSS and JavaScript, and remember that both of these will be bundled up. Let's look at how I use this in my layout Liquid file as this shows another recent change:

```html
{% raw %}<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>{{ title }}</title>
	<link href="/assets/parvus.min.css" rel="stylesheet" />
	<style>
	{% getBundle "css" %}
	</style>
</head>
<body>

{{ content }}

<script src="/assets/parvus.min.js"></script>
<script>
{% getBundle "js" %}
</script>
</body>
</html>{% endraw %}
```

When loading bundled assets, you now use a shortcode, `getBundle`, to inject the bundled up code. (There's also `getBundleFileUrl`.) I struggled with this as I forgot to use `{% raw %}{%{% endraw %}` versus `{% raw %}{{{% endraw %}`.

That's really all there is to it. I still feel like I'm struggling a bit with WebC. As I've said before, not because of anything *wrong* with it, but it's definitely been a bit of a struggle to grok it. I hope these examples are helping others as much as they are helping me. If you would like the full source code, you can find it here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/webc_lightbox>

I also set up a Glitch if you want to see this in action yours: <https://glitch.com/edit/#!/webc-for-demo> Let me know what you think!

p.s. You may notice I used an odd URL in my sample images, specifically the `?.png` part at the end. This is not a requirement of the placeholder service I used, but something Parvus required. When it sees an image URL that doesn't end in a "regular" extension it doesn't consider it to be a real image. I'm filing a bug report on that now. 

