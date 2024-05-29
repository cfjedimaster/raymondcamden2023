---
layout: post
title: "Update to My Table Sorting Web Component"
date: "2024-05-29T18:00:00"
categories: ["development"]
tags: ["javascript","web components"]
banner_image: /images/banners/hannes-egler-369155.jpg
permalink: /2024/05/29/update-to-my-table-sorting-web-component
description: A quick update to an earlier post.
---

Just a quick note. Last year, I [blogged](https://www.raymondcamden.com/2023/03/14/progressively-enhancing-a-table-with-a-web-component) a demo of a web component that lets you wrap an existing HTML table and progressively add table sorting. I'm rather proud of that demo and was actually planning on doing a quick video about it, but while testing I encountered two small bugs that somehow missed my earlier rigorous testing. (And by rigorous testing I mean a few minutes of clicking around.) 

Specifically, the issue is in the "when clicking to sort, notice if we sorted this column before and if so, reverse the sort" area: 

```js
sortCol(e,i) {
	let sortToggle = 1;
	if(this.lastSort === i) {
		this.sortAsc = !this.sortAsc;
		if(!this.sortDir) sortToggle = -1;
	}

	this.lastSort = i;
	
	this.data.sort((a,b) => {
		if(a[i] < b[i]) return -1 * sortToggle;
		if(a[i] > b[i]) return 1 * sortToggle;
		return 0;
	});
	
	this.renderTable();
}
```

In the function above, `i` simply refers to the index of the column that is being sorted. My thinking at the time was - the default is ascending, but if you are clicking the same column as last time, reverse it.

There are two bugs here:

* One, I'm using `sortDir` which doesn't even exist. I must have renamed it to `sortAsc` and missed it. That was an easy fix.
* The second issue was harder to find. I clicked to sort a column a few times, then clicked another column a few times, then came back, and noticed the *second* click wouldn't properly change the direction. Why? Because I never revered `sortAsc` to true on a new column.

So the fix looks like this:

```js
sortCol(e,i) {
	let sortToggle = 1;
	if(this.lastSort === i) {
		this.sortAsc = !this.sortAsc;
		if(!this.sortAsc) sortToggle = -1;
	} else this.sortAsc = true;
	
	this.lastSort = i;
	
	this.data.sort((a,b) => {
		if(a[i] < b[i]) return -1 * sortToggle;
		if(a[i] > b[i]) return 1 * sortToggle;
		return 0;
	});
	
	this.renderTable();
}
```

I'm going to edit the older blog post now and correct the samples, but if you just want to see the finished version, here it is:

<p class="codepen" data-height="500" data-default-tab="js,result" data-slug-hash="dyENNNb" data-pen-title="PE Table for Sorting (2) - Edited" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0 15px; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/dyENNNb">
  PE Table for Sorting (2) - Edited</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<p>
