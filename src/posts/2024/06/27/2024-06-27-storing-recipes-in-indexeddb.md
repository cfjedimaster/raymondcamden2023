---
layout: post
title: "Storing Recipes in IndexedDB"
date: "2024-06-27T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_kitchen.jpg
permalink: /2024/06/27/storing-recipes-in-indexeddb
description: A look at storing recipe information in IndexedDB
---

The last two sessions of my show, [`<Code><Br>`](https://cfe.dev/talkshow/code-break/), were taken up talking about one of my favorite web platform features, [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). This is a topic I've covered many years on the blog (I even wrote a [book](https://www.amazon.com/gp/product/1491935111/ref=as_li_tl?ie=UTF8&tag=raymondcamd06-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1491935111&linkId=239944c4f3cbf1e35ce47f4eb857b2a7) on it back in 2016) so I thought it would be a good topic for the show. (I will include links to those episodes at the end of this post.)

In the first session, Sue, one of the folks watching the live stream, suggested I use recipes as an example of data to persist in the browser. I thought this was **perfect** as recipe data can get quite complex. You can see an example of that in the post I wrote earlier this month on [scraping recipes](https://www.raymondcamden.com/2024/06/12/scraping-recipes-using-nodejs-pipedream-and-json-ld). For the context of the live stream, I decided to keep things a bit simple. My recipe data looked like so:

* A string property for the name.
* A string property for ingredients, using a textarea in the frontend so you could write them all out.
* A string property for directions, again using a textarea. 

Here's how that UI looked:

<p>
<img src="https://static.raymondcamden.com/images/2024/06/idb1.jpg" alt="Screenshot of web UI for entering recipes" class="imgborder imgcenter" loading="lazy">
</p>

As you will see if you watch the video, the UI was simple and worked well for quickly entering data. It's absolutely not the best, but it got the job done.

The last thing I did in the second session was add search. This was done by using an index on the recipe's title and using a fuzzy string match that basically said, if you entered "foo", look for "fooa" to "fooz". This worked... kinda. I didn't realize till later that if I had a recipe with the *exact* name "foo", then my search for "foo" wouldn't work. I fixed that in the version I'll show in a bit. I also didn't correctly handle case. Sigh. But ignoring that, here's how that filter worked:

```js
let transaction = db.transaction(['recipes'],'readonly');
transaction.onerror = e => {
	reject(e);
};

let store = transaction.objectStore('recipes');

let index = store.index('recipetitles');
let range = IDBKeyRange.bound(filter + 'a', filter + 'z');
let result = [];

index.openCursor(range).onsuccess = (event) => {
	const cursor = event.target.result;
	if (cursor) {
		result.push(cursor.value);
		cursor.continue();
	} else {
		resolve(result);
	}
}
```

So ignoring the issues I found later, at the end of the second live stream, I had a basic, if not pretty, recipe database stored on the client. Today I decided to take a look at how I could make this a bit more complex and better suited for actual recipes. 

## Improving the Recipe Object

I began with two important changes - changing both ingredients and directions to an array of data. For ingredients, I thought it made sense to have an array of objects with each element consisting of a name and quantity value. For directions, just an array.

Now, on the IndexedDB side, this is a non-issue. Period. You just pass your data as you see fit and it's stored. It was much more of an issue on the UI/UX side. I decided to take the easy way out. I kept the textareas in and added a bit of text:

<p>
<img src="https://static.raymondcamden.com/images/2024/06/idb2.jpg" alt="New UI" class="imgborder imgcenter" loading="lazy">
</p>

In case it's a bit hard to read, for ingredients I now say: 

```
Ingredients: (Enter one ingredient per line. Use the format: Name, Qty)
```

And for directions:

```
Directions: (Separate steps with a blank link.)
```

The direction bit is ok, and honestly, I'd probably not even say anything, just handle it. The ingredient thing is absolutely not something I'd put into production. It's too brittle. But again, my desire here was to focus on the database portion, not the actual UI/UX of this app. 

My code to handle this looks like so:

```js
let ingredientsRaw = $ingredientsField.value;

ingredientsRaw.split('\n').forEach(i => {
	let [name, qty] = i.split(', ');
	ingredients.push({ name, qty });
});
```

For directions:

```js
let directionsRaw = $directionsField.value;

directionsRaw.split('\n\n').forEach(d => directions.push(d));
```

Easy peasy. As I said, IndexedDB is fine with you passing an object that has objects under it. I spent more time on the UI than the DB. 

My next change was to add support for durations. Recipes need to say how long it takes to make them so this is an important bit of info. I simply added a new number field to my form and included it in my code when saving values. 

## Improving Search

Well, here's where things went a bit insane. Given that I had title search working (with a few issues), I decided to add not one, but two more search options - max duration and ingredients. Let me walk you through these changes.

For the title search, as I mentioned, I had an issue with case and matching the exact string. I fixed this in two ways:

You can't do a case-insensitive search in IndexedDB. So I decided to make a new property of my recipe object, `title_lower`. I then modified my index to use that property:

```js
store.createIndex('recipetitles','title_lower');
```

To handle the "foo" doesn't match "foo" issue, I modified my range to start with the string and go up to z:

```js
// name is the recipe name, which I call title in the db, so, yeah, oh well
let range = IDBKeyRange.bound(name.toLowerCase() + '', name.toLowerCase() + 'z');
```

To support searching durations, I added an index for that:

```js
store.createIndex('recipedurations','duration');
```

And then, an index for ingredients. Ingredients is an array, but you can make an index on that by using the `multiEntry` flag:

```js
store.createIndex('recipeingredients','ingredients_names', {multiEntry:true, unique:false});
```

So far so good. Now is when things get a bit intense. IndexedDB doesn't really support complex searches. You can easily search along *one* index, but not two or more at once. You can make an index on multiple properties, but that isn't (as far as I know) going to support a search with just one property being defined. I could definitely be wrong here (and please, fork the code and let me know!), so here is how I decided to attack it.

First, I added the filters on top:

<p>
<img src="https://static.raymondcamden.com/images/2024/06/idb3.jpg" alt="Filter by name, duration, and ingredient" class="imgborder imgcenter" loading="lazy">
</p>

I won't bother showing the code here, but I've got JavaScript listening for all three fields and calling out to get recipes when there is an input event fired on them. 

When I do a filter, I've got an object containing the values from the DOM called `filter`. It contains values, or blanks, for `title`, `duration`, and `ingredient`. 

I decided to perform searches for all three. For each though, I check to see if I'm the only filter, and if so, I return early. Also, if my filter returns nothing, I can leave early as well. 

```js
let result = [];
let byTitle = [];
let byDuration = [];
let byIngredient = [];

if(filter.title) {
	byTitle = await searchRecipesByName(filter.title);
	console.log('byTitle', byTitle);
	if(byTitle.length === 0) { resolve([]); return; }
	// can leave early if doing nothing else
	if(!filter.duration && !filter.ingredient) { resolve(byTitle); return; }
}

if(filter.duration) {
	byDuration = await searchRecipesByDuration(filter.duration);
	console.log('byDuration', byDuration);
	if(byDuration.length === 0) { resolve([]); return; }
	if(!filter.title && !filter.ingredient) { resolve(byDuration); return; }
}

if(filter.ingredient) {
	byIngredient = await searchRecipesByIngredient(filter.ingredient);
	console.log('byIngredient', byIngredient);
	if(byIngredient.length === 0) { resolve([]); return; }
	if(!filter.title && !filter.duration) { resolve(byIngredient); return; }
}
```

This is your reminder that when inside a Promise (I didn't show it, but this code is indeed inside a Promise), the `resolve` and `reject` methods **do not** end the execution of the function. 

I then had the following issue. We only get past the code above if we have 2 or 3 arrays of objects. We only want to return the items that appear in all the arrays. This seemed easy with two arrays. I had a complete mental break from handling 3 arrays, especially 2 or 3 arrays. 

I asked on Mastodon, and [@falk@qoto.org](https://qoto.org/@falken) had an interesting solution. Basically, figure out how many arrays you have. Then loop over each array and count how many times a particular ID shows up. Once done, you return the objects with IDs that were 'seen' X times, with X being the number of arrays, 2 or 3. I took a stab at it, and it seems to work.

```js
let numArrays = 0;
if(filter.title) numArrays++;
if(filter.duration) numArrays++;
if(filter.ingredient) numArrays++;
let idBag = {};
let obBag = {};

if(filter.title) {
	for(t of byTitle) {
		if(!idBag[t.id]) idBag[t.id] = 1;
		else idBag[t.id]++;
		obBag[t.id] = t;
	}
}
if(filter.duration) {
	for(t of byDuration) {
		if(!idBag[t.id]) idBag[t.id] = 1;
		else idBag[t.id]++;
		obBag[t.id] = t;
	}
}
if(filter.ingredient) {
	for(t of byIngredient) {
		if(!idBag[t.id]) idBag[t.id] = 1;
		else idBag[t.id]++;
		obBag[t.id] = t;
	}
}

for(let id in idBag) {
	if(idBag[id] === numArrays) result.push(obBag[id]);
}

resolve(result);
```

This struck me as kind of janky (not his solution, my implementation), but... logically it seemed to make sense. Also, this feels like the kind of thing that a person who passes the Google interview test would know how to do in one line. That's not me. 

If you want to check out the code, you can do so here: <https://github.com/cfjedimaster/codebr/tree/main/idb3>

You can demo this online here, but remember, the UI/UX is not ideal: <https://cfjedimaster.github.io/codebr/idb3/index.html>

And as promised, here are the live stream sessions. Enjoy.

<iframe width="560" height="315" src="https://www.youtube.com/embed/oUiBvEkNSYU?si=1gAWjfdGB6dMGkWN" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>

<iframe width="560" height="315" src="https://www.youtube.com/embed/4FSlKrGGb80?si=Dy235cAzz1-x-Alc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>