---
layout: post
title: "Building a CRUD Web App with Alpine.js"
date: "2024-07-31T18:00:00"
categories: ["javascript"]
tags: ["alpinejs"]
banner_image: /images/banners/cat_writing_desk.jpg
permalink: /2024/07/31/building-a-crud-web-app-with-alpinejs
description: 
---

One of things I try to encourage here is for my readers to reach out with their questions. That rarely happens, but when it does, I try my best to answer as soon as possible. In this case, I got a great question from a reader back in May and then... life happened. Sorry, Nicholas, but hopefully this isn't too late. His question was pretty simple - could I build an example of using [Alpine.js](https://alpinejs.dev/) for a CRUD interface.

For folks who may not know the term, CRUD refers to:

* (C)reate
* (R)read
* (U)pdate
* (D)elete

You've probably seen a hundred interfaces like this. You have a list of content with links to edit one, delete one, and a link to add a new instance of that content. 

When that reader reached out to me, I agreed to take a look at this, with the stipulation that I'd "fake" the server-side calls. My intent is to demonstrate client-side stuff, not boring old server-side code. (I'm kidding. Mostly.) With that in mind, note that I will *not* be discussing the "proxy" JavaScript methods that fake the server logic. You'll be able to see them if you wish, and I separated them from the rest of the code, but the precise implementation of them is really not important. 

Also, this brings up a really important point. When I talk about Alpine, one of things I discuss is where Alpine is most appropriate. Obviously, this is a matter of opinion, but I generally say Alpine is best for progressive enhancement of a page, not for building a web "app". To me, and again, I'm sharing my opinion here, I generally view an "app" as anything that has two or more "views", or distinct UI components to it. 

CRUD certainly implies two views typically - that list and editing view I mentioned above, but it feels simple enough that I figured Alpine would probably be fine for this, even without building a 'router' or something similar.

That's a lot of preamble, let's get to it. I built this out in stages, so I'll share each stage one at a time.

## Part One - Listing Content

In the first iteration, I focused on two things - setting up my Alpine app to support two views, listing and editing, and then displaying my current list of data.

First, the HTML:

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<div x-data="app">
	<template x-if="listView">
		<div>
			<h2>Cats</h2>
			
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Age</th>
						<th>Gender</th>
					</tr>
				</thead>
				<tbody>
					<template x-for="cat in cats">
						<tr>
							<td x-text="cat.name"></td>
							<td x-text="cat.age"></td>
							<td x-text="cat.gender"></td>
						</tr>
					</template>
				</tbody>
			</table>
		</div>
	</template>
	<template x-if="editView">
		<div>
		edit
		</div>
	</template>
</div>
```

Notice my app is split between two `template` tags that check for either `listView` or `editView` being true. In the list view, I iterate over my data (cats) in a simple table. Here's the JavaScript, again, minus my server related calls:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
		"editView":false,
		"listView":true,
		"cats":[],
		async init() {
			this.cats = await getCats();
		}
  }))
});
```

I want to call out one aspect in particular. When I first wrote this, I used one variable, `view`, that I set to a string. In my HTML, I then had:

```html
<template x-if="view === 'list'">
...
</template>
<template x-if="view === 'edit'">
...
</template>
```

That certainly worked, but I didn't like the logic embedded in the HTML. Slightly more code in JavaScript for cleaner markup seems like a good tradeoff to me. 

You can test this version here:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="JjQEvJL" data-pen-title="Alpine Crud (1)" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/JjQEvJL">
  Alpine Crud (1)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Technically the R in CRUD usually refers to reading one item, at least how I understand it, but in this case I considered it "Read All" and felt like it was a good stopping point. 

## Part Two - Deleting Content

For the next iteration, I added delete support. In my HTML, I just added a new table column with a button:

```html
<td><button @click="deleteCat(cat.id)">Delete</button></td>
```

And here's the JavaScript:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
		"editView":false,
		"listView":true,
		"cats":[],
		async init() {
			await this.readCats();
		},
		async deleteCat(id) {
			if(!confirm("Are you sure?")) return;
			await deleteCat(id);
			await this.readCats();
		},
		async readCats() {
			this.cats = await getCats();
		}
  }))
});
```

Notice I added a new method, `readCats`, so I didn't have to repeat the logic. After a delete is run, I call that so my list of items updates. 

Once again, that was a good stopping point, so here's that version:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="jOjyxzM" data-pen-title="Alpine Crud (2)" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/jOjyxzM">
  Alpine Crud (2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Part Three - Editing Content

Now for the big change - editing support. In this iteration, I had to do multiple different things. I began by adding an edit button:

```html
<template x-for="catOb in cats">
	<tr>
		<td x-text="catOb.name"></td>
		<td x-text="catOb.age"></td>
		<td x-text="catOb.gender"></td>
		<td>
			<button @click="editCat(catOb.id)">Edit</button>
			<button @click="deleteCat(catOb.id)">Delete</button>
		</td>
	</tr>
</template>
```

Notice I change my `for` loop to use `catOb`, not `cat`. I'll get back to that at the end of this section. Now let's look at the JavaScript:

```js
  Alpine.data('app', () => ({
		"editView":false,
		"listView":true,
		"cats":[],
		"cat":{
			"name":"",
			"age":"",
			"gender":""
		},
		async init() {
			await this.readCats();
		},
		cancel() {
			this.setView('list');
		},
		async deleteCat(id) {
			if(!confirm("Are you sure?")) return;
			await deleteCat(id);
			await this.readCats();
		},
		async editCat(id) {
			console.log('edit', id);
			this.cat = await getCat(id);
			this.setView("edit");
		},
		async readCats() {
			this.cats = await getCats();
		},
		async saveCat() {
			/*
			we can gather data, and it is ok if ID is blank, as
			the 'backend' will figure it out
			*/
			let editedCat = {
				id:this.cat.id,
				name:this.cat.name,
				age:this.cat.age,
				gender:this.cat.gender
			};
			await persistCat(editedCat);
			this.setView('list');
		},
		setView(v) {
			if(v === 'edit') {
				this.listView = false;
				this.editView = true;
			} else {
				this.listView = true;
				this.editView = false;
			}
		}
  }))
});
```

So, a few things to note here. First, `editCat` makes a call to the server to get the cat record (to be honest, my `getCats` already returns all the data, but in a real world, the 'get all' logic may only return some properties) and then fires off a new method to set the view. I made this a method as it's slightly complex - switching the true/false values for two variables. 

Back in HTML, I've got this code now to render a form:

```html
<template x-if="editView">
	<div>
		<h2>Edit Cat</h2>
		<form>
			<label for="name">Name</label>
			<input id="name" x-model="cat.name">
			<label for="age">Age</label>
			<input id="age" x-model.number="cat.age">
			<label for="gender">Gender</label>
			<select x-model="cat.gender">
				<option value="male">male</option>
				<option value="female">female</option>
			</select>
		</form>
		<button @click="cancel">Cancel</button>
		<button @click="saveCat">Save</button> 
	</div>
</template>
```

The cancel button simply resets the view back to the list, while save calls the server method, waits for the result, and then also resets the view. I'm not handling server-side errors here and that is something to consider. 

Ok, so a quick note. Notice how I use a variable, `cat`, to represent the data that's represented in the form? I had issues with it and I couldn't understand why. It was basic `x-model` stuff but it refused to work. Turns out, the `cat` I initially had in my `x-for` was in the same 'state' as my Alpine.js variables. I honestly didn't know that was an issue until today. I'm going to do a blog post on just this issue sometime later.

Anyway, here's the demo:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="zYVNjJR" data-pen-title="Alpine Crud (3)" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/zYVNjJR">
  Alpine Crud (3)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Part Four - Adding Content

For the fourth and final iteration, I added the ability to add data. On the HTML side, it's just:

```html
<p>
	<button @click="addCat">Add Cat</button>
</p>
```

And the JavaScript code:

```js
addCat() {
	this.setView('edit');
},
```

Literally, just switch to the edit view. Since I'm not loading a cat, the form is blank, the `cat` value in my variables is blank, and clicking save there works just fine. Why? Remember in `saveCat`, we do:

```js
let editedCat = {
	id:this.cat.id,
	name:this.cat.name,
	age:this.cat.age,
	gender:this.cat.gender
};

await persistCat(editedCat);
```

I let the back-end code handle determining if it is an addition or edit based on the value of `id`. Of course, my back-end is still fake, but I've worked with systems that simplify this and just let you store data with the system handling add versus update. 

Here's the final demo:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="xxogzGm" data-pen-title="Alpine Crud (4)" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/xxogzGm">
  Alpine Crud (4)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Wrap Up

I hope this is helpful to folks. As I said in the beginning, this type of implementation feels a bit on the edge of what I'd consider using in Alpine, but it did seem to work well and is still *incredibly* lightweight. You could also abstract it out a bit and use it as a generic 'content editor' for a CMS. Let me know if you use this and how you do!
