---
layout: post
title: "Creating a Web Component for Reveal.js"
date: "2023-04-22T18:00:00"
categories: ["development"]
tags: ["web components"]
banner_image: /images/banners/slides.jpg
permalink: /2023/04/22/creating-a-web-component-for-revealjs
description: Creating Reveal.js presentations from web components.
---

I've been a fan of [Reveal.js](https://revealjs.com/) for *many* years. Reveal.js is a web-based presentation framework that makes it (mostly) easy to create slides with just basic HTML. I don't mind Powerpoint at all, and it's incredibly powerful, but when I'm presenting on web topics (which is, usually, 99% of the time), I don't like the experience of "alt-tabbing" from a running Powerpoint to code or browser tabs. Reveal.js helps me avoid that. 

Using Reveal (I'm getting tired of typing the dot jay ess) is relatively simple. You add a script tag. You add two link tags for CSS (one for the core CSS and one for a theme) and then start writing HTML. The `section` tag is used for each slide. Here's an example of how easy it is, from their docs:

```html
<html>
  <head>
    <link rel="stylesheet" href="dist/reveal.css">
    <link rel="stylesheet" href="dist/theme/white.css">
  </head>
  <body>
    <div class="reveal">
      <div class="slides">
        <section>Slide 1</section>
        <section>Slide 2</section>
      </div>
    </div>
    <script src="dist/reveal.js"></script>
    <script>
      Reveal.initialize();
    </script>
  </body>
</html>
```

In the snippet above, you can see the two `section` tags representing each slide. There's quite a bit to it and if you want to see more, check out their [demo](https://revealjs.com/?demo), but for today, I was curious if I could simplify the creation of Reveal presentations with web components. Here's what I came up with.

## Version One

First, I'll share the HTML I wanted to use. I actually wrote this first and then began building the web component so I could see it update itself. 

```html
<reveal-preso theme="beige">
	<section>Slide 1b</section>
	<section>Slide 2</section>
	<section>Slide 3</section>
	<section data-background-color="aquamarine">
		<h2>🍦</h2>
	</section>
	<section data-background-image="https://placekitten.com/800/800">
		<h2>Image</h2>
	</section>	
</reveal-preso>
```

My HTML makes use of the web component, `reveal-preso`, and supports a `theme` attribute. Inside the component are a set of `section` tags for the slides. (As an FYI, I could have also built a `reveal-slide` child tag, and I *will* do that in my next post!) I don't have any script or link tags at all. Now let's look at the component definition.

```js
class RevealPreso extends HTMLElement {
	constructor() {
		super();
	}
	
	connectedCallback() {

		this.theme = 'black';
		if(this.hasAttribute('theme')) {
			this.theme = this.getAttribute('theme');
		}

		let currentHTML = this.innerHTML;
		this.innerHTML = `
<div class="reveal">
	<div class="slides">
		${currentHTML}
	</div>
</div>
		`;
		
		// load reveal.js
		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.async = true;
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.js';
		document.head.appendChild(script);
		
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type='text/css';
		link.href = 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.css';
		document.head.appendChild(link);

		const theme = document.createElement('link');
		theme.rel = 'stylesheet';
		theme.type='text/css';
		theme.href = `https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/theme/${this.theme}.min.css`;
		document.head.appendChild(theme);
		
		script.addEventListener('load', () => {
			Reveal.initialize();
		});

	}
}

if(!customElements.get('reveal-preso')) customElements.define('reveal-preso', RevealPreso);
```

As you can see, this is relatively simple. My `connectedCallback` rewrites the inner HTML such that it's wrapped with the `divs` that Reveal expects. I then dynamically load all three resources - my JavaScript and both CSS resources. I've got an event listener on the script such that when it's been loaded, I can initialize the presentation. From what I could see (via Googling and Stack Overflow), there's no `onload` for CSS scripts. I saw a few suggested workarounds, but I decided to keep it simple and just worry about the JavaScript resource. I accept that may be problematic. One more issue - my code checks for the theme argument one time only. If you were to change it via JavaScript later, it would not pick up on that. (If I may be so bold as to suggest a best practice here, I'd probably suggest you *always* have code to recognize changes to attributes or clearly document what's not going to work.) Here's how it looks:

<p class="codepen" data-height="700" data-default-tab="result" data-slug-hash="MWPJgMJ" data-user="cfjedimaster" style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/MWPJgMJ">
  WC Reveal</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Personally, I think this is pretty cool! But notice that it expects the *entire* web view. That's the default for Reveal and probably how most people would use it, but I really wanted to see if it was possible to *embed* Reveal along with other web content. Here's how I did that.

## Version Two

First, I checked the docs. I had only ever used Reveal as a full web view presentation and I didn't know if the framework itself supported. Turns out, it absolutely has an [embedded](https://revealjs.com/presentation-size/#embedded) mode. There's also support for [multiple embedded](https://revealjs.com/initialization/#multiple-presentations) presentations. This requires two things - a slight change to how you initialize the Reveal object and supplying specific dimensions of the container holding your presentation.

I began by modifying my HTML a bit:

```html
<h2>Preso</h2>

<p>
	Here is my preso. It brings all the boys to the yard.
</p>

<reveal-preso height="700px" theme="dracula">
	<section>Slide 1b</section>
	<section>
		<h2>Plan</h2>
		<ul>
			<li class="fragment">Phase One - Collect Underpants</li>
			<li class="fragment">Phase Two - ?</li>
			<li class="fragment">Phase Three - Profit</li>
		</ul>
	</section>
	<section>Slide 3</section>
	<section data-background-color="aquamarine">
		<h2>🍦</h2>
	</section>
	<section data-background-image="https://placekitten.com/800/800">
		<h2>Image</h2>
	</section>	
</reveal-preso>

<footer>
End of page.
</footer>
```

I've got some basic crap on top and bottom, and in the `reveal-preso` tag, I've added a `height`. My component is going to support both `height` and `width`, but it will default both. Now let's look at the updated component:

```js
class RevealPreso extends HTMLElement {
	constructor() {
		super();
	}
	
	connectedCallback() {
		console.log('connected callback called');
		
		// defaults
		this.width = '100%';
		this.height = '500px';
		this.theme = 'black';
		if(this.hasAttribute('width')) {
			this.width = this.getAttribute('width');
		}
		if(this.hasAttribute('height')) {
			this.height = this.getAttribute('height');
		}
		if(this.hasAttribute('theme')) {
			this.theme = this.getAttribute('theme');
		}

		let currentHTML = this.innerHTML;
		this.innerHTML = `
<div class="reveal" style="width: ${this.width}; height: ${this.height}">
	<div class="slides">
		${currentHTML}
	</div>
</div>
		`;
		
		// load reveal.js
		const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.js';
		document.head.appendChild(script);
		
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type='text/css';
		link.href = 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.css';
		document.head.appendChild(link);

		const theme = document.createElement('link');
		theme.rel = 'stylesheet';
		theme.type='text/css';
		theme.href = `https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/theme/${this.theme}.min.css`;
		document.head.appendChild(theme);

		script.addEventListener('load', () => {
		 Reveal(this.querySelector( '.reveal' ), {
				embedded: true,
				keyboardCondition: 'focused' // only react to keys when focused
		 }).initialize();
		
		});

	}
}

if(!customElements.get('reveal-preso')) customElements.define('reveal-preso', RevealPreso);
```

I've updated the code to look for `height` and `width` now and default both. When I rewrite the inner HTML content, I include those values. Lastly, I changed how I initialize the presentation. You can see this in action here:

<p class="codepen" data-height="800" data-default-tab="result" data-slug-hash="GRYrRmK" data-user="cfjedimaster" style="height: 800px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/GRYrRmK">
  WC Reveal (2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

There are still things I'd tweak here. I'd definitely add support for changing the height and width. Reveal itself also supports recognizing changes to it's size. One note - I did do a quick test with 2 presentations on the page, and it worked, but it only shows one theme which I believe there is no workaround as Reveal expects only one theme CSS. It may be possible, but I'm not sure. 

## Next Version?

As I said earlier, I want to iterate on this one more time. I want to create a child tag, `reveal-slide` (or perhaps something shorter) and look into importing the tag from another JavaScript resource. I also want to support dynamically changing the height and width. I'll work on this tomorrow or later this month. As always, let me know what you think!
