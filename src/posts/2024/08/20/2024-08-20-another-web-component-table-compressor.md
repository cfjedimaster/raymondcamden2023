---
layout: post
title: "Another Web Component - Table Compressor"
date: "2024-08-20T18:00:00"
categories: ["development"]
tags: ["javascript","web components"]
banner_image: /images/banners/cat_compressor.jpg
permalink: /2024/08/20/another-web-component-table-compressor
description: A progressively enhanced web component to truncate tables.
---

Earlier this week I was browsing a site that showed a tabular list of data. It initially showed something like ten rows and had a clickable item that showed the rest of the data. I thought I'd whip up a quick web component that mimicked this functionality. 

My thinking was that you would wrap a regular HTML table (much like my [table sorting component](https://www.raymondcamden.com/2024/06/10/table-sorter-available-via-npm)) and the component would truncate and add the 'click to expand' logic. Now, to be clear, this still means the user is downloading the entire set of data, but visually it would take up less space until the user selects to show the rest of the data. 

Let me share the component here and then I'll explain how it works:

```js
class CompressTable extends HTMLElement {

	constructor() {
		super();
		this.rows = this.hasAttribute('rows') ? parseInt(this.getAttribute('rows'),10) : 50;
	}
	
	connectedCallback() {
		let table = this.querySelector('table');
		if(!table) {
			console.warn('<compress-table> - No table found.');
			return;
		}
		
		// ok, so how big is our table?
		let rows = table.querySelectorAll('tbody tr');
		
		// can we leave if the table is small?
		if(rows.length <= this.rows) return;
		
		// ok, construct a click to show doohicky
		this.showRow = document.createElement('tr');
		let showTd = document.createElement('td');
		showTd.setAttribute('colspan',1000);
		showTd.style.textAlign = 'center';
		showTd.style.cursor = 'pointer';
		showTd.innerText = 'Click to Expand';
		this.showRow.appendChild(showTd);
		this.showRow.addEventListener('click', () => this.returnRows());
		
		// now, store rows this.rows +1 to rowCount
		let selector = `tbody tr:nth-child(n+${this.rows+1}):nth-child(-n+${rows.length})`;
		this.rowsToHide = table.querySelectorAll(selector);
		console.log('rowsToHide', this.rowsToHide.length);
		this.rowsToHide.forEach(r => {
			r.style.display = 'none';
		});
		
		table.querySelector('tbody').appendChild(this.showRow);

	}
	
	returnRows() {
		this.rowsToHide.forEach(r => {
			r.style.display = '';
		});
		this.showRow.style.display = 'none';		
	}
	
}

if(!customElements.get('compress-table')) customElements.define('compress-table', CompressTable);
```

From the top, I begin by looking for a `rows` attribute. If not specified it defaults to 50. The real work begins in `connectedCallback`.

First I check for a table and if one isn't found, just leave. 

```js
let table = this.querySelector('table');
if(!table) {
	console.warn('<compress-table> - No table found.');
	return;
}
```

I then see how many rows we have, and if less than our desired cut off point, just leave:

```js
let rows = table.querySelectorAll('tbody tr');

// can we leave if the table is small?
if(rows.length <= this.rows) return;
```

Next, I create my 'click to expand' portion. I could make the text here something you pass in via an attribute, but left it hard coded for now. Also note the 'hack' of colspan there. I found out that specifying a number larger than the columns in the table seems to have no side effects. Also, according to MDN, the [max value for colspan](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#colspan) is 1000. I had no idea.

```js
// ok, construct a click to show doohicky
this.showRow = document.createElement('tr');
let showTd = document.createElement('td');
showTd.setAttribute('colspan',1000);
showTd.style.textAlign = 'center';
showTd.style.cursor = 'pointer';
showTd.innerText = 'Click to Expand';
this.showRow.appendChild(showTd);
this.showRow.addEventListener('click', () => this.returnRows());
```

Now for the fun part. I needed to hide the rows over my desired cut off point. Turns out, you can do this in CSS because CSS, at least in the last decade, is freaking awesome. Here's how I did it:

```js
// now, store rows this.rows +1 to rowCount
let selector = `tbody tr:nth-child(n+${this.rows+1}):nth-child(-n+${rows.length})`;
this.rowsToHide = table.querySelectorAll(selector);
this.rowsToHide.forEach(r => {
	r.style.display = 'none';
});
```

The final part of this method adds my `click to expand` bit:

```js
table.querySelector('tbody').appendChild(this.showRow);
```

The final *final* bit is the click handler to reveal the hidden table rows and hide the clicker (I could remove it from the DOM I suppose):

```js
returnRows() {
	this.rowsToHide.forEach(r => {
		r.style.display = '';
	});
	this.showRow.style.display = 'none';		
}
```

Actually using it is simple - just wrap your table!

```html
<compress-table rows=20>
	<table>
		<thead>
			<tr>
				<th>Name</th><th>Something</th><th>Age</th>
			</tr>
		</thead>
		<tbody>
<tr><td>Cat 0</td><td>Foo</td><td>0 years old.</td></tr>
<tr><td>Cat 1</td><td>Foo</td><td>2 years old.</td></tr>
<tr><td>Cat 2</td><td>Foo</td><td>4 years old.</td></tr>
<!-- lots of rows here, like, lots and lots -->
<tr><td>Cat 98</td><td>Foo</td><td>196 years old.</td></tr>
<tr><td>Cat 99</td><td>Foo</td><td>198 years old.</td></tr>		
		</tbody>
	</table>
</compress-table>
```

You can play with it below, and folks think it's worthwhile, I'll add it to NPM as well. 

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="LYKQmdq" data-pen-title="Compress Table" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/LYKQmdq">
  Compress Table</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<p>
