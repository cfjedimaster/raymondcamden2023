---
layout: post
title: "Parsing Markdown in BoxLang - Take 3"
date: "2025-05-14T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_two_papers.jpg
permalink: /2025/05/14/parsing-markdown-in-boxlang-take-3
description: BoxLang now supports Markdown processing via a module.
---

Ok, so I promise this will be my last post on using Markdown with [BoxLang](https://boxlang.io). At least the last one this month. ;) I first covered the topic last month, ["Parsing Markdown in BoxLang"](https://www.raymondcamden.com/2025/04/18/parsing-markdown-in-boxlang) where I demonstrated using the [Flexmark](https://github.com/vsch/flexmark-java) Java library in BoxLang code. I then [followed up](https://www.raymondcamden.com/2025/04/21/parsing-markdown-in-boxlang-take-2) with a revised edition that used BoxLang's Java integration a bit nicer. So, those posts are still very valid, still useful for showing you how to make use of the JVM from BoxLang, and with the vast library of open-source Java stuff out there, that's a good thing. But... you don't need to do any of that for Markdown, because now it's even easier! If you prefer to consume this post while listening to my silky smooth voice, check out the video at the end.

There is now an official [Markdown module](https://boxlang.ortusbooks.com/boxlang-framework/modularity/markdown) for BoxLang, making use of the same Java library I had used. To install, simply run:

```
install-bx-module bx-markdown
```

Once you do that, you've got two new functions, `markdown` for conversion of Markdown to HTML, and `htmlToMarkdown`, for converting HTML to Markdown. Here's a simple example:


{% darkgist "https://gist.github.com/cfjedimaster/18b724d6464336edef0c5271bd20d841.js" %}

I won't bother showing the output as it's what you expect I think, and, I used it in the next example showing the reverse:

{% darkgist "https://gist.github.com/cfjedimaster/2cb0031a14a98e655bc4e0dffcfb7488.js" %}

Finally, you also get a component that allows for usage like so:

```html
<!---
If you use variable="foo", it will store the result, not print it.
--->
<bx:markdown>

# Hello World

This is some markdown text. I'm making it <bx:output>#dateFormat(now())#</bx:output>.

Here's a list, just because:

* Ray
* Lindy
* Cats
* Beer

Finally, an image: ![https://unsplash.it/640/425?random](https://unsplash.it/640/425?random)

</bx:markdown>
```

I'm probably biased as I do a *lot* with Markdown, but I'm really happy to see this as an "official" module for BoxLang. Check out the video version below:

{% liteyoutube "n38fGSyUbOA" %}