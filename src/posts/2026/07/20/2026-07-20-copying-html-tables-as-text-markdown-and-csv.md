---
layout: post
title: "Copying HTML Tables as Text, Markdown, and CSV"
date: "2026-07-20T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_table.jpg
permalink: /2026/07/20/copying-html-tables-as-text-markdown-and-csv
description: Adding a simple way to copy HTML tables into different formats
---

Earlier today and in a non web-related conversation, I saw someone talk about copying tabular data into different formats, like plain text and CSV. It got me thinking - this could be a useful feature for web sites and surely something pretty trivial to do in JavaScript. So I whipped up a quick demo.

First, I added a table of course:

```html
<table id="table1">
	<thead>
		<tr>
			<th>Name</th>
			<th>DOB</th>
			<th>Gender</th>
			<th>Breed</th>
		</tr>
	</thead>
	<tbody>
	<tr><td>Whiskers</td><td>2019-03-14</td><td>Male</td><td>Maine Coon</td></tr>
	<tr><td>Luna</td><td>2020-07-22</td><td>Female</td><td>Siamese</td></tr>
	<!-- bunch more rows -->
	<tr><td>Nala</td><td>2022-04-18</td><td>Female</td><td>Persian</td></tr>
	<tr><td>Molly</td><td>2022-01-11</td><td>Female</td><td>LaPerm</td></tr>				
	</tbody>
</table>
```

Alright, so to enable this feature, I thought data attributes might be nice. This would let you use it on anything, a button, a link, image, etc. The data attribute would be responsible for pointing to the table (via an id) and specifying a format. Here's an example:

```html
<!-- data-copy defaults to text -->
<a href="" data-table="table1">Copy as Text</a> ~ 
<a href="" data-table="table1" data-copy="md">Copy as Markdown</a> ~
<a href="" data-table="table1" data-copy="csv">Copy as CSV</a>
```

Now all I need to do is wire it up to code that looks for `data-table` and adds the appropriate handlers. The first part is trivial:

```js
const links = document.querySelectorAll('*[data-table]');
```

Note that while I named the variable `links`, you can still use this with buttons or images. 

I loop over each match and first get the table referenced, throwing an error in console if it doesn't exist:

```js
links.forEach(l => {
	let table = document.querySelector(`#${l.dataset.table}`);
	if(!table) {
		console.error(`Unable to connect to table with id ${l.dataset.table}`);
		return;
	}
```

Next, I check the type, defaulting to text:

```js
let type = l.dataset.copy || 'text';
```

The final bit is to assign the click handler:

```js
l.addEventListener('click', async e => {
	e.preventDefault();
	console.log(`about to copy table ${table.id} to ${type}`);
	let data = getRawData(table);
	let formattedData = formatData(data, type);
	await navigator.clipboard.writeText(formattedData);
});
```

For each, I get the raw data from the HTML table, convert it to the right format, and then write to the clipboard. (Check out my [article](https://master.dev/blog/writing-to-the-clipboard-in-javascript/) on working with the clipboard in JavaScript.) 

`getRawData` just iterates through the table's DOM creating a 2D array:

```js
const getRawData = t => {
	let data = [];
	t.querySelectorAll('tr').forEach(r => {
		let row = [];
		r.querySelectorAll('th, td').forEach(d => {
			row.push(d.innerText);
		});
		data.push(row);
	});
	return data;
}
```

`formatData` is a bit more complex and I used AI to help me with each of the main sections. I added support for plain text, Markdown, and CSV:

```js
const formatData = (data,type) => {
	let numCols, colWidths, lines, buildRow, buildDivider;
	
	switch(type) {
		case "text": 

			numCols = Math.max(...data.map(r => r.length));
			// Compute max width for each column
			colWidths = Array(numCols).fill(0);
			for (const row of data) {
			for (let i = 0; i < numCols; i++) {
				const cell = row[i] !== undefined ? String(row[i]) : '';
				colWidths[i] = Math.max(colWidths[i], cell.length);
			}
			}
		
			buildDivider = () =>
			'+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
		
			buildRow = (row) =>
			'|' + colWidths.map((w, i) => {
				const cell = row[i] !== undefined ? String(row[i]) : '';
				return ' ' + cell.padEnd(w) + ' ';
			}).join('|') + '|';
		
			lines = [];
			lines.push(buildDivider());
			lines.push(buildRow(data[0])); // treat first row as header
			lines.push(buildDivider());
			for (let i = 1; i < data.length; i++) {
			lines.push(buildRow(data[i]));
			}
			lines.push(buildDivider());
		
			return lines.join('\n');

		case "md":
		case "markdown": 
			numCols = Math.max(...data.map(r => r.length));
			
			buildRow = (row) =>
				'| ' + Array.from({ length: numCols }, (_, i) =>
					row[i] !== undefined ? String(row[i]) : ''
				).join(' | ') + ' |';
		
			lines = [];
			lines.push(buildRow(data[0])); // header
			lines.push('| ' + Array(numCols).fill('---').join(' | ') + ' |');
			for (let i = 1; i < data.length; i++) {
				lines.push(buildRow(data[i]));
			}
		
			return lines.join('\n');

		case "csv": 
			const escapeCell = (value) => {
			const str = value !== undefined && value !== null ? String(value) : '';
			// Quote if it contains comma, quote, or newline
			if (/[",\n\r]/.test(str)) {
				return '"' + str.replace(/"/g, '""') + '"';
			}
			return str;
			};
		
			return data.map(row => row.map(escapeCell).join(',')).join('\n');
			
	}
}
```

With my test table (and I'm stripping out a bit here for brevity), here's the plain text version:

```
+----------+------------+--------+----------------------+
| Name     | DOB        | Gender | Breed                |
+----------+------------+--------+----------------------+
| Whiskers | 2019-03-14 | Male   | Maine Coon           |
| Luna     | 2020-07-22 | Female | Siamese              |
| Oliver   | 2018-11-05 | Male   | British Shorthair    |
| Max      | 2019-06-25 | Male   | Sphynx               |
| Stella   | 2021-05-04 | Female | American Curl        |
| Rocky    | 2018-09-20 | Male   | Burmese              |
| Molly    | 2022-01-11 | Female | LaPerm               |
+----------+------------+--------+----------------------+
```

Here's the Markdown:

```
| Name | DOB | Gender | Breed |
| --- | --- | --- | --- |
| Whiskers | 2019-03-14 | Male | Maine Coon |
| Luna | 2020-07-22 | Female | Siamese |
| Oliver | 2018-11-05 | Male | British Shorthair |
| Max | 2019-06-25 | Male | Sphynx |
| Stella | 2021-05-04 | Female | American Curl |
| Rocky | 2018-09-20 | Male | Burmese |
| Molly | 2022-01-11 | Female | LaPerm |
```

And here's CSV:

```
Name,DOB,Gender,Breed
Whiskers,2019-03-14,Male,Maine Coon
Luna,2020-07-22,Female,Siamese
Oliver,2018-11-05,Male,British Shorthair
Max,2019-06-25,Male,Sphynx
Stella,2021-05-04,Female,American Curl
Rocky,2018-09-20,Male,Burmese
Molly,2022-01-11,Female,LaPerm
```

I wrapped this all up in a function that you could add to your page. After adding it, don't forget to actually add the links/button/etc to enable it. 

There's two issues with my code that come to mind, and I'd love people to comment in with their ideas. First, both the text and Markdown assume the first row is a header. In theory that might not always be accurate. I could update the code to see if the first cell in the first row is `th` versus `td`, but that kinda feels like overkill. 

The second issue that comes to mind is user feedback. Usually these types of things will provide some kind of visual feedback ("Data copied!"). My code does not. I honestly don't quite know how I'd do that. Perhaps a data attribute that would replace the text (assuming it's a link or button) temporarily? I'm not sure. 

If you've got ideas, leave me a comment below. Here's the demo: 

<p class="codepen" data-height="500" data-pen-title="Copy Table As (2)" data-version="2" data-default-tab="result" data-slug-hash="xbgJOyP" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/editor/cfjedimaster/pen/019f80d2-42ea-7545-83bb-8f112023abce">
  Copy Table As (2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>