---
layout: post
title: "Help Me Solve an Alpine.js Mystery"
date: "2024-08-01T18:00:00"
categories: ["javascript"]
tags: ["alpinejs"]
banner_image: /images/banners/cat_detective.jpg
permalink: /2024/08/01/help-me-solve-an-alpinejs-mystery
description: Help me figure out some interesting Alpine.js behavior in regards to loops and variables.
---

Yesterday I wrote up my experience in building a simple [CRUD interface using Alpine.js](https://www.raymondcamden.com/2024/07/31/building-a-crud-web-app-with-alpinejs), and in doing so, ran into an interesting issue. While it would be best to read the entire previous article, let me try to break down the issue... or at least as how I saw it.

My Alpine app had a variable, `cats`, that was an array of objects. I looped over them and displayed them in a simple table:

```html
<template x-for="cat in cats">
```

Notice I'm using a variable, `cat`, to represent each element of the array. Here's one example of using it:

```html
<td x-text="cat.name"></td>
```

The application *also* made use of a `cat` variable. This was intended to be used in the edit form. I had logic that would let you select a cat to edit, load the information for that cat and assign it to the variable, and display a form. In that, I used `x-model`. Again, here's one small example:

```html
<label for="name">Name</label>
<input id="name" x-model="cat.name">
```

So far so good? Well, the issue I saw was that when I clicked to edit and the form appeared, the input fields were all blank. The binding in `x-model` wasn't working. 

Honestly, I had no idea what was wrong. There wasn't an error in the console, it just wasn't binding right. Than it occurred to me, what if the `cat` value in the for loop was overwriting/conflicting with my 'regular' Alpine.js variable? To be fair, that seems sensible. While looping over the array you can still access the rest of your variables, so this made sense, and changing my loop variable to `catOb`, it began working.

Woot. High fives all around.

<p>
<img src="https://static.raymondcamden.com/images/2024/08/alpine1.jpg" alt="A cartoon style cat looking at you and giving you a high five. You rule." class="imgborder imgcenter" loading="lazy">
</p>

So today my plan was - build a simpler version of this issue to demonstrate it - blog about it - and just do my best to remember to avoid conflicts when naming my loop iterator variable. 

Except... my simple demo didn't have the error. 

<p>
<img src="https://static.raymondcamden.com/images/2024/08/alpine2.jpg" alt="A cartoon style cat looking disgusted. You don't rule." class="imgborder imgcenter" loading="lazy">
</p>

So... this is what I did. I forked my CodePen from yesterday and reverted the loop variable to `cat` to recreate the problem. It did. I then removed as much as possible, most of the functionality, so I still had the problem. For the life of me, I couldn't reproduce the issue in my new CodePen... until I realized I had not done one thing in my recreation. Let me show what I have.

First, the HTML, which again is a simplified version:

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<div x-data="app">
	<template x-if="showTable">
		<table border=1>
			<template x-for="cat in cats">
				<tr>
					<td x-text="cat.name"></td>
					<td x-text="cat.gender"></td>
				</tr>
			</template>
		</table>
	</template>
	<template x-if="showCat">
		<div>
			<p>
			<form>
			<label for="name">Name</label>
			<input id="name" x-model="cat.name">
			</form>
			</p>
		</div>
	</template>
</div>
```

And here's the JavaScript:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
		"cats":[	
			{"id":1, "name":"ray","gender":"male"},
			{"id":2, "name":"lindy","gender":"female"}
		],
		"cat":{
			"name":"",
			"gender":""
		},
		showTable:true,
		showCat:false,
		async init() {
			console.log('init');
			
			setTimeout(() => {
				console.log('delay test');
				this.showTheCat();
			}, 5000);
			
		},
		async showTheCat() {
			this.cat = await getCat();
			console.log('got cat');
			this.showCat = true;
		}
  }))
});

async function getCat() {
		return new Promise(resolve => {
			resolve({"name":"async kitty", "gender":"moo"})
		});
}
```

It's a bit messy, I apologize. The idea in `init` was to kinda mimic what I had before. An initial view of data, and then an edit interface. Hence the setTimeout. When it fires, my form field shows up and correctly renders a new cat:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="PorpQeG" data-pen-title="trying to repro alpine issue i saw" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/PorpQeG">
  trying to repro alpine issue i saw</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Finally, I decided to not automatically show the cat, but more closer mimic my previous demo. I added:

```html
<td><button @click="showTheCat(cat.id)">show</button></td>
```

I also removed my setTimeout. In theory, this does the *exact* same thing, except it waits for user input. But, look what happens:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="yLdMEgz" data-pen-title="trying to repro alpine issue i saw" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/yLdMEgz">
  trying to repro alpine issue i saw</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Crazy, right? Cats and dogs living together. It's anarchy. 

Honestly, I've got no idea why the user interaction version shows the bug while the "delay 5 seconds" one does not. And honestly, this is all solved by just using a unique variable. But... I want to know *why*! So, can you help? Leave me a comment below please.