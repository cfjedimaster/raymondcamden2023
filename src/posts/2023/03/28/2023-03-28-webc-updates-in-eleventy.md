---
layout: post
title: "WebC Updates in Eleventy"
date: "2023-03-28T18:00:00"
categories: ["development","jamstack"]
tags: ["javascript","web components","eleventy"]
banner_image: /images/banners/orangejuice.jpg
permalink: /2023/03/28/webc-updates-in-eleventy
description: Description of updates to WebC
---

It's been a little while since I've blogged about the Eleventy [WebC](https://www.11ty.dev/docs/languages/webc/) feature, and that's good because just recently some nice little nuggets landed in the project. Specifically... 

<iframe src="https://fosstodon.org/@eleventy/110080645931069093/embed" class="mastodon-embed" style="max-width: 100%; border: 0;height: 520px" width="100%" allowfullscreen="allowfullscreen"></iframe>

I want to share a demo of loops later, but I thought I'd first look into `else` and `elseif`, specifically in regards to my first post on WebC back in October: [First Experience Building with Eleventy's WebC Plugin](https://www.raymondcamden.com/2022/10/16/first-experience-building-with-eleventys-webc-plugin)

In that post, I built a WebC file to create a simple placeholder with SVG. The component was incredibly simple, but it needed a bit of logic which wasn't possible in WebC at the time. Luckily I could "escape" by embedding Liquid:

```html
{% raw %}<template webc:type="11ty" 11ty:type="liquid">
{% if width == blank %}
	{% assign width = "199" %}
{% endif %}
{% if height == blank %}
	{% assign height = "199" %}
{% endif %}

<svg ns="http://www.w3.org/2000/svg" 
	width="{{width}}"
	height="{{height}}" viewbox="0 0 {{width}} {{height}}">
	<rect width="100%" height="100%" fill="#ff0000"></rect>
	{% if text %}
	<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">{{ text }}</text>
	{% endif %}
</svg>
</template>{% endraw %}
```

This *worked*, but I wanted to see if I could use the new directives instead. I ended up with this version first:

```html
{% raw %}<svg ns="http://www.w3.org/2000/svg" 
	:width="width?width:199"
	:height="height?height:199" 
  	viewbox="0 0 {{width}} {{height}}">
	<rect width="100%" height="100%" fill="#00cc00"></rect>
	<text webc:if="text" x="50%" y="50%" dominant-baseline="middle" 
	text-anchor="middle" @text="text"></text>
</svg>{% endraw %}
```

You'll notice that both width and height now are dynamic and will use 199 each for a default. Next, I made the `text` element only show up if the `text` attribute was passed. You'll notice though that `viewbox` wasn't updated. 

So... I had a quandary. I knew I could turn `viewbox` into a JavaScript expression, but I wasn't sure how to "embed" a check for undefined variables. I first tried the [nullish coalescing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) which sounded like it would work, but it doesn't support a variable that's not declared. 

I then decided to pivot. What if my logic changed to - you either specify height *and* width, or I default both? I rewrote the component like so:

```html
<svg ns="http://www.w3.org/2000/svg" webc:if="width && height"
	:width="width"
	:height="height" 
    :viewbox="'0 0 '+width+' '+height">
	<rect width="100%" height="100%" fill="#00cc00"></rect>
	<text webc:if="text" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" @text="text"></text>
</svg>
<svg ns="http://www.w3.org/2000/svg" webc:else width="199" height="199"
  viewbox="0 0 199 199">
	<rect width="100%" height="100%" fill="#00cc00"></rect>
	<text webc:if="text" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" @text="text"></text>
</svg>
```

I'm not *terribly* happy with the fact that I have to repeat the code twice, it feels a bit risky in case I make other changes to the SVG, but then again, it's still only a few lines of code. 

If you want to see this in action, you can find the code up on Glitch here: <https://glitch.com/edit/#!/webc-placeholder-latest>. The live version may be found here: <https://glitch.com/edit/#!/webc-placeholder-latest>

p.s. As a quick aside, if you like WebC, check out <https://11ty.webc.fun/> for good examples. 