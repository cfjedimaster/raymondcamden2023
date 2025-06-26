---
layout: post
title: "Updates to my Table Sorting Web Component"
date: "2025-06-26T18:00:00"
categories: ["development"]
tags: ["javascript","web components"]
banner_image: /images/banners/hannes-egler-369155.jpg
permalink: /2025/06/26/updates-to-my-table-sorting-web-component
description: An update to my Table Sorting component
---

It's been a while since I touched my `<table-sort>` web component, but last night I had a few interesting ideas and thought I'd do a quick update. For folks who may not remember, I first [blogged about this](https://www.raymondcamden.com/2023/03/14/progressively-enhancing-a-table-with-a-web-component) way back in March of 2023. The basic idea was to take an existing table, wrap it in my web component, and sorting would be added automatically. Nice and simple. 

As an example:

```html
<table-sort>
<table>
	<!-- existing table here -->
</table>
</table-sort>
```

The only real "feature" was that if you included `numeric="X"`, it would consider the Xth column as numeric and ensure sorting worked properly. `X` in this context could be one column, or a list, and it was 1-based of course. 

You can see that initial version here:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="OJovJee" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;margin-bottom:15px;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/OJovJee">
  PE Table for Sorting (2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

At some point, and I don't know if I blogged it, I even put it up on npm: <https://www.npmjs.com/package/@raymondcamden/table-sorter> 

## Change One - Support Custom Sorting 

Ok, so what did I change? I recently realized that it would be nice if you could sort by dates. I could have added something along the lines of the `numeric` attribute, but I wanted a more generic solution that could apply to any "weird" sorting use case. To do so, I added support for a `data-sortval` column. Why?

Well, as I said, my initial goal was to make it as simple as possible to use the web component. You shouldn't need to do anything to your table, just wrap and go. While that's the ideal, there's going to be cases where if I ask the HTML developer to do a bit of work, the component can do it's job better as well. 

To enable this, I went with a data attribute in your `td` cell. So for example, imagine you've got dates, you could use the data attribute to store a numeric version of the date, usually being the number of seconds since epoch, but in the example below, I just used simple small values:

```html
<table-sort>
<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Breed</th>
			<th>Gender</th>
			<th>Birthday</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Luna</td>
			<td>Domestic Shorthair</td>
			<td>Female</td>
			<td data-sortval="300">April 8, 1973</td>
		</tr>
		<tr>
			<td>Elise</td>
			<td>Domestic Longhair</td>
			<td>Female</td>
			<td data-sortval="400">May 3, 1990</td>
		</tr>
		<tr>
			<td>Pig</td>
			<td>Domestic Shorthair</td>
			<td>Female</td>
			<td data-sortval="500">June 12, 1991</td>
		</tr>
		<tr>
			<td>Crackers</td>
			<td>Maine Coon</td>
			<td>Male</td>
			<td data-sortval="200">January 1, 1952</td>
		</tr>
		<tr>
			<td>Zuma</td>
			<td>Ragdoll</td>
			<td>Male</td>
			<td data-sortval="100">December 25, 1951</td>
		</tr>
	</tbody>

</table>
</table-sort>
```

Now when it comes time to sort, my code will use the values in the cells for the first three columns, and the value from `data-sortval` for the fourth. I love [data attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes) as they allow for customizations to the web page like this and are easy to use from JavaScript as well. 

This worked great.. until I actually sorted and realized I needed to make another change. 

## Change Two - Rendering the Table

My initial implementation generally worked like so:

* Get the table I'm wrapping.
* Get every cell and copy the data to an array of objects
* On sort, sort my copy of the data and re-render the HTML

The re-rendering was destructive, which meant that if you're original table cells had something custom, perhaps a class applied to cells where the value met certain criteria, it was lost. Essentially this:

```html
<td class="oldMan">52</td>
```

Became this after a sort:

```html
<td>52</td>
```

I knew this was a problem and had opened an [issue](https://github.com/cfjedimaster/table-sorter/issues/2) on my repo a year ago. I finally addressed it by sorting the TR rows in the DOM, preserving any custom attributes in your existing table. 

You can see this in the example below - if you open your browser the `onmouseover` in the very last `td` is preserved on sort.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="OPVdEPM" data-pen-title="Untitled" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/OPVdEPM">
  Untitled</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Ok, that's it! If you want to share any bugs or suggestions, hit up the [repo](https://github.com/cfjedimaster/table-sorter) and you can install this yourself like so: `npm i @raymondcamden/table-sorter`