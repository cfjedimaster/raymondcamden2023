---
layout: post
title: "Creating Bootstrap WebC Components in Eleventy"
date: "2023-06-19T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/bootstrap.jpg
permalink: /2023/06/19/creating-bootstrap-webc-components-in-eleventy
description: Using WebC to make working with Bootstrap simpler.
---

For some time now as I've explored [web components](https://www.raymondcamden/tags/web+components), it's occurred to me that web components could be a great way to make working with [Bootstrap](https://getbootstrap.com/) simpler. Not that Bootstrap is necessarily difficult, but I've always thought it would be cool to take something like so:

```html
<div class="card" style="width: 18rem;">
  <div class="card-body">
    <h5 class="card-title">Card title</h5>
    <h6 class="card-subtitle mb-2 text-body-secondary">Card subtitle</h6>
    <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
  </div>
</div>
```

And write it as so:

```html
<card>
	<title>Card title</title>
	<subtitle>Card subtitle</subtitle>
    <p>Some quick example text to build on the card title and make up the bulk of the card's content.</p>
</card>
```

This would *absolutely* be possible with web components (except for the fact that web components need to have two words, not one), but it brings up an important problem. The web component would make it easier for me to use Bootstrap but would do absolutely nothing for the people actually using my website. I'd be improving developer experience (DX) while sacrificing user experience (UX). The "sacrifice" isn't terribly bad, but as I would be using JavaScript to basically just spit out HTML, it's not necessarily the "right" thing to do. 

Of course, this is where [WebC](https://www.11ty.dev/docs/languages/webc/) can save the day. I get the DX locally of a simpler interface to Bootstrap and the UX of shipping plain HTML as everything is done in the build process. With that in mind, I thought I'd take a quick look at building a few Bootstrap components. Here's what I came up with.

## Initial Setup

Before I got started, I looked at the basic Bootstrap starter template and built that as an Eleventy layout.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bootstrap demo</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" 
	integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous" webc:keep>
	<style webc:keep>
	.container {
		margin-top: 25px;
	}
	</style>
  </head>
  <body data-bs-theme="dark">

	<div class="container" @raw="content"></div>

	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" 
	integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" 
	crossorigin="anonymous" webc:keep></script>
  </body>
</html>
```

Note that I needed to add `webc:keep` so WebC didn't try to roll it up into its asset bundling. It doesn't support remote URLs anyway, but I still needed it.

## Starting Simple - Badges and Alerts

I decided to start simply and build a WebC component for both the [Alert](https://getbootstrap.com/docs/5.3/components/alerts/) and [Badge](https://getbootstrap.com/docs/5.3/components/badge/) components. These are *really* simple in that they just wrap content and have few options. 

These were simple, but ran into an issue with the WebC language - you can't access attributes "in code" when using WebC. While you can use JavaScript in a [setup block](https://www.11ty.dev/docs/languages/webc/#using-javascript-to-setup-your-component), that code can't introspect arguments passed to the component. Because of this, I went to JavaScript for the entire component. Here's `bs-alert.webc`:

```html
<!---
Can't use type as webc:type will be used for a default
--->

<script webc:type="js" webc:root>
if(!alerttype) {
	alerttype = 'primary'
}
`<div class="alert alert-${alerttype} ${type}" role="alert">
	<slot></slot>
</div>`;
</script>
```

Note the comment on top that while I wanted to use `type` as an attribute, it conflicted with the `webc:type` attribute. 

And here is `bs-badge.webc`:

```html
<!---
Can't use type as webc:type will be used for a default
--->
<script webc:type="js" webc:root>
if(!badgetype) {
	badgetype = 'primary'
}
`<span class="badge bg-${badgetype} ${type}">
	<slot></slot>
</span>`;
</script>
```

Both are basically the same. Using them looks like so:

```html
<bs-badge>Cat</bs-badge>
<bs-badge badgetype="secondary">Secondary Cat</bs-badge>
<bs-badge badgetype="success">Success Cat</bs-badge>

<bs-alert>
Default alert 
</bs-alert>

<bs-alert alertType="danger">
Danger alert 
</bs-alert>

<bs-alert alertType="success">
Success alert 
</bs-alert>
```

By the way, WebC components can absolutely be one word. I could have used both `<alert>` and `<badge>`, but I kinda felt like I wanted a differentiator between my "regular" HTML and my Bootstrap WebC components. That was a personal choice.

## More Advanced - Cards

For my next component, I built a wrapper for the Bootstrap [Card](https://getbootstrap.com/docs/5.3/components/card/) component, one of my favorites in the Bootstrap library. This time I'll start with the usage examples:

```html
<bs-card title="Title is Ray" header="Header is here" subtitle="I'm a subtitle.">
	This is a card with all 3 attributes.
</bs-card>

<p></p> 

<bs-card title="Via Placeholder" header="Cats For All">
	<p>
	<img src="https://placekitten.com/250/250">
	</p>
</bs-card>

<p></p>

<bs-card title="title">
	<p>
	Para 1a
	</p>
	<hr>
	<p>
	Para 2
	</p>
</bs-card>
```

And now let's look at the component:

```html
<div class="card">
	<div class="card-header" webc:if="header" @text="header"></div>
	<div class="card-body">
		<h5 class="card-title" webc:if="title" @text="title"></h5>
		<h6 class="card-subtitle mb-2 text-body-secondary" webc:if="subtitle" @text="subtitle"></h6>
		<div class="card-text">
			<slot></slot>
		</div>
	</div>
</div>	
```

Pretty simple, right? Notice how the header, title, and subtitle all make use of `webc:if` to decide if they need to render. This makes them optionally show each part of the card UI based on input.

## Master Class - Accordions

So, the Bootstrap [Accordion](https://getbootstrap.com/docs/5.3/components/accordion/) ended up being the most complex to build. For this, I ended up with two components - one for the wrapper, and one for each part of the accordion. Here's how it looks in use:

```html
<bs-accordion id="accordion1">
	<bs-accordion-item header="Header One" expanded="false">
	This is my first accordion item.
	</bs-accordion-item>
	<bs-accordion-item header="Header Two" expanded="true">
	This is my second accordion item.
	</bs-accordion-item>
</bs-accordion>
```

The `bs-accordion.webc` file is simplest:

```html
<div class="accordion" :id="id">
	<slot></slot>
</div>
```

The item component was harder. I ended up "giving up" on WebC as a template language itself and just switched to Liquid:

```html
{% raw %}<template webc:type="11ty" 11ty:type="liquid">

<div class="accordion-item">
	<h2 class="accordion-header">
		{% unless expanded %}
			{% assign myexpanded = "false" %}
		{% else %}
			{% assign myexpanded = expanded %}
		{% endunless %}

		<button class="accordion-button" type="button" data-bs-toggle="collapse" 
		data-bs-target="#{{ uid }}" aria-expanded="{{ myexpanded }}" aria-controls="{{ uid }}">{{ header }}</button>
	</h2>
	<div id="{{uid}}" class="accordion-collapse collapse {% if myexpanded == 'true' %}show{% endif %}" data-bs-parent="#accordionExample">
		<div class="accordion-body">
			<slot></slot>
		</div>
	</div>
</div>
</template>
{% endraw %}
```

Also, notice that I needed to assign a unique ID to connect the button to the div inside it. WebC for some time now has had an undocumented feature, `uid`, where each component can use this to get a unique ID for itself. I had to use a bit of logic to handle the `expanded` attribute which is optional for my wrapper.

## Try It Yourself

The source code for this demo may be found on my Eleventy GitHub repo here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/webc_bootstrap>. However, I ported it over to Glitch to make it even easier to play with:

<div class="glitch-embed-wrap" style="height: 420px; width: 100%;">
  <iframe
    src="https://glitch.com/embed/#!/embed/webc-bootstrap?path=.eleventy.js&previewSize=100"
    title="webc-bootstrap on Glitch"
    allow="geolocation; microphone; camera; midi; encrypted-media; xr-spatial-tracking; fullscreen"
    allowFullScreen
    style="height: 100%; width: 100%; border: 0;">
  </iframe>
</div>

<br/>

Photo by <a href="https://unsplash.com/@minhctran?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Minh Tran</a> on <a href="https://unsplash.com/s/photos/bootstrap?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  