---
layout: post
title: "Adding a PDF Display to Eleventy"
date: "2026-10-21T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/books.jpg
permalink: /2026/10/21/adding-a-pdf-display-to-eleventy
description: Quickly adding a PDF to an Eleventy page with EmbedPDF
---

This will be a short one. I've talked about embedding PDFs on web pages for probably close to ten years now. Blame Adobe. Blame me being a nerd and finding this stuff interesting. Blame whoever. While I've blogged about the topic, I've also actually done that on my site here, in a variety of different ways. 

A while back I realized I wasn't being consistent with how I did... "stuff" here, like call outs, Youtube links, etc. I started a [guide doc](https://github.com/cfjedimaster/raymondcamden2023/blob/main/guide.md) so I'd have a quick way to remember what I did last time, and be more consistent. 

One item on there I had left as "figure it out later" was proper PDF embedding. This week I finally nailed that down. [EmbedPDF](https://www.embedpdf.com/) is a library I've mentioned here before so I leaned on it, and went with an incredibly simple snippet:

```html
<div id="pdf-dis" style="width: 100%; height: 400px; margin-bottom: 30px"></div>
 
<script type="module">
import EmbedPDF, { ZoomMode } from 'https://cdn.jsdelivr.net/npm/@embedpdf/snippet@2/dist/embedpdf.js';
 
EmbedPDF.init({
	type: 'container',
	target: document.getElementById('pdf-dis'),
	src: 'https:// ....',
	theme: { preference: 'system' },
	disabledCategories: ['annotation'],
	zoom: {
		defaultZoomLevel: ZoomMode.FitWidth
	}
});
</script>
```

This does a few things that make sense on my blog, and may not for you. I use the `ZoomMode` feature to make the PDF document automatically be as wide as the container. Honestly, I don't know why this isn't the default, but given that PDFs can specify their own default view, the library may just usually let it decide. The rest of the code is pretty much vanilla from the docs. 

So that's the snippet. To make it a shortcode in Eleventy, I added this to my page which defines all the shortcodes for my blog:

```js
const embedPDF = (id, url, height="500px") => {
  return `
<div id="${id}" style="width: 100%; height: ${height}; margin-bottom: 30px"></div>
 
<script type="module">
import EmbedPDF, { ZoomMode } from 'https://cdn.jsdelivr.net/npm/@embedpdf/snippet@2/dist/embedpdf.js';
 
EmbedPDF.init({
	type: 'container',
	target: document.getElementById('${id}'),
	src: '${url}',
	theme: { preference: 'system' },
	disabledCategories: ['annotation'],
	zoom: {
		defaultZoomLevel: ZoomMode.FitWidth
	}
});
</script>
  `;
};
```

This gets loaded by my Eleventy config script and inside a post, I can:

```
{% raw %}{% embedPDF "pdf-viewer-1", "https://static.raymondcamden.com/assets/document.pdf" %}{% endraw %}
```

Which gives you:

{% embedPDF "pdf-viewer-1", "https://static.raymondcamden.com/assets/document.pdf" %}

I found this useful, and I hope you do too.