---
layout: post
title: "Table-Sorter Available Via NPM"
date: "2024-06-10T18:00:00"
categories: ["javascript"]
tags: ["web components"]
banner_image: /images/banners/hannes-egler-369155.jpg
permalink: /2024/06/10/table-sorter-available-via-npm
description: My table-sorter tag is now available via NPM.
---

This is just a quick post to say my `<table-sorter>` web component is now available via npm! My thanks go to [Thomas Steiner](https://blog.tomayac.com/) who suggested I take my little CodePen demo and actually publish it. You can find it at NPM here, <https://www.npmjs.com/package/@raymondcamden/table-sorter>, and install it in your project like so:

```
npm install @raymondcamden/table-sorter
```

And holy crap - 79 downloads already? That's pretty cool. You can find the repo here, <https://github.com/cfjedimaster/table-sorter/>, where I've got a few issues (again, thanks to Thomas) for future updates. 

As a reminder, this web component progressively enhances a table so that users can click to sort the table in different ways. You literally just wrap an existing table:

```html
<!-- numeric is optional and lets the component know what columns to treat as numbers -->
<table-sorter numeric="4">
<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Breed</th>
			<th>Gender</th>
			<th>Age</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Luna</td>
			<td>Domestic Shorthair</td>
			<td>Female</td>
			<td>11</td>
		</tr>
		<!-- lots of rows -->
		<tr>
			<td>Apollo</td>
			<td>Persian</td>
			<td>Male</td>
			<td>3</td>
		</tr>	
	</tbody>

</table>
</table-sorter>
```

You can check out an online demo here: <https://cfjedimaster.github.io/table-sorter/demo.html>
