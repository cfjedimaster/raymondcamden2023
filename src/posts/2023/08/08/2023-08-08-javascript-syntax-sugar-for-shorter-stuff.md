---
layout: post
title: "JavaScript Syntax Sugar for Shorter Stuff"
date: "2023-08-08T18:00:00"
categories: ["javascript"]
tags: ["javascript"]
banner_image: /images/banners/sugar.jpg
permalink: /2023/08/08/javascript-syntax-sugar-for-shorter-stuff
description: Two quick tips related to writing JavaScript objects
---

Please forgive the somewhat alliterative title of this post. I promise I wasn't going for clickbait! Recently I was looking at some code from a friend of mine and saw something I had not seen in JavaScript before. It obviously worked (and I confirmed myself of course) but I wanted to know *why*. Luckily I've got some smart followers online who helped me out. Here's what I discovered. 

## JavaScript Object Literals

Both of the features I'll demonstrate apply to object literals. Basically:

```js
const person = {
	name: "Ray", 
	age: 50, 
	cool: true
}
```

If you've been doing *anything* in JavaScript for any amount of time, you've probably worked with an object literal from time to time. Both of the features below don't change how these work, but rather help you write them quicker. Both are optional of course and you should use whatever makes sense for you. Finally, both of what I'm going to share are ES6 features and should be universally safe to use. 

## Property Value Shorthands

The first feature, and the one I knew about, let's you skip a common pattern of creating a property of an object with a name of X based on a variable X. So for example:

```js
const name = "Ray";
const age = 50;
const cool = true;

const person = {
	name:name,
	age:age,
	cool:cool
};
```

Obviously in this case the three first lines aren't needed, but imagine they were passed in as arguments or created elsewhere. The shorthand methods lets you skip the X:X syntax:

```js
const name = "Ray";
const age = 50;
const cool = true;

const person = {
	name,
	age,
	cool
};
```

You can mix and match too if you want:

```js
const name = "Ray";
const age = 50;
const cool = true;
const isOld = false;

const person = {
	name,
	age,
	cool,
	isOld:isOld,
	isNotOld: !isOld
};
```

In that example, I've written `isOld` the "full" way and made a new property based on another variable. So this is what I already knew. Now for what I didn't.

## Method Value Shorthand

When I was reviewing my friend's code, I saw something like this:

```js
const cat = {
	meow() {
		return 'Meow!';
	}
}
```

Specifically, the `cat` object literal has a property, `meow`, that is a function. You can of course, mix it up and include anything else:

```js
const cat = {
	name:'Luna',
	meow() {
		return 'Meow!';
	}
}
```

And just to be clear, this is shorthand for:

```js
const cat = {
	name:'Luna',
	meow:function() {
		return 'Meow!';
	}
}
```

Honestly this feels even more useful than the first item I covered. 

## Thanks!

I don't know about you, but I *love* it when I discover stuff like this. I don't know how I missed the method value shorthand. Heck, I probably *saw* it and it just didn't click. I want to send thanks to both [Šime Vidas](https://mastodon.social/@simevidas) and [Dr. Axel Rauschmayer](https://mastodon.social/@rauschma@fosstodon.org) for their help in pointing me to the relevant specs for this feature. You can see our conversation here: <https://mastodon.social/@raymondcamden/110820954856487108>. Any mistakes in my post above are 100% my fault, not theirs. (And give them both a follow. They've both helped me multiple times in the past!)

If you want to see this "running", you can check out the simple CodePen below.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="js" data-slug-hash="wvQbBWj" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0 15px; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/wvQbBWj">
  Shorthand stuff</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Photo by <a href="https://unsplash.com/@levelupfilming?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Jason</a> on <a href="https://unsplash.com/photos/Fbft0pYhbp4?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  