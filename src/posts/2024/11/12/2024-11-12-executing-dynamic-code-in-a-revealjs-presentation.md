---
layout: post
title: "Executing Dynamic Code in a Reveal.js Presentation"
date: "2024-11-12T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_danger.jpg
permalink: /2024/11/12/executing-dynamic-code-in-a-revealjs-presentation
description: A little hack to add some dynamic-ness to my Reveal.js presentations
---

Please take what follows with a Titanic-sized grain of salt and do your best *not* to do what I did, but despite that, I thought this little hack was interesting and I figured I'd share it anyway. I typically use [Reveal.js](https://revealjs.com/) for my presentations, especially when talking about the web platform, as it makes it easy to do slides and demos, all in my browser. 

Usually when I want to embed live code in a slide, I just use a [CodePen](https://codepen.io/) embed. While this works well, sometimes it feels like overkill for real short code samples. I wondered if it would be possible to execute code directly in the slide itself such that I could show a one-liner in the slide, and then the result after. This is what I came up with.

First, consider a slide with some code on it:

```html
<section>
<h2>Example</h2>
<pre><code class="language-js" data-trim>
let now = new Date();

// defaults for everything
console.log(new Intl.DateTimeFormat().format(now));
</code></pre>
</section>
```

In this slide, I create a new Date object and then use Intl.DateTimeFormat to display it. I wanted the final result, which would have been in the console, to show up in the slide.

I decided on a data-attribute that would contain the code for this such that the result of executing the code would be one value only:

```html
<section data-execute="let now = new Date();new Intl.DateTimeFormat().format(now);">
```

I then added a paragraph tag to handle the result:

```html
<p class="fragment result"></p>
```

The `fragment` class there tells Reveal to not display it until I hit the right arrow. Therefore I'd get the code sample first:

<p>
<img src="https://static.raymondcamden.com/images/2024/11/reveal1.jpg" alt="Slide with code sample" class="imgborder imgcenter" loading="lazy">
</p>

And when I hit the right arrow:

<p>
<img src="https://static.raymondcamden.com/images/2024/11/reveal2.jpg" alt="Slide with code sample and executed code" class="imgborder imgcenter" loading="lazy">
</p>

How did I handle it? Reveal.js has support for multiple event handlers, including on a slide change. Here's what I did:

```js
Reveal.on('slidechanged', (event) => {
	if(event.currentSlide.dataset.execute) {

		console.log('going to eval', event.currentSlide.dataset.execute);
		let result = eval(event.currentSlide.dataset.execute);
		let $result = event.currentSlide.querySelector('p.result');
		$result.innerHTML = result;
	}
});
```

Basically, if the DOM for the slide had a data attribute named `execute`, use `eval` on the string and update a paragraph with class `result` inside the slide. 

Overkill? Probably. But this particular presentation had multiple date examples and I really wanted it to show "live" results. If for some reason this abomination interests you, you can find it in my slide deck here: <https://github.com/cfjedimaster/intl-is-your-superhero>

And to be clear, don't use [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval). 
