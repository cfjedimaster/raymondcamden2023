---
layout: post
title: "TIL - submit() versus requestSubmit()"
date: "2024-03-01T18:00:00"
categories: ["javascript"]
tags: []
banner_image: /images/banners/cat_form.jpg
permalink: /2024/03/01/til-submit-versus-requestsubmit
description: How the requestSubmit() function differs from submit()
---

Today I learned (well, technically, a few days ago, the week has been a *lot*), that the web platform supports a [requestSubmit](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit) method. Since the beginning of time (or the beginning of JavaScript), we've been able to submit forms like so:

```js
var myForm = document.getElementById('theform');
myForm.submit();
```

I intentionally used `getElementById` there as a reminder of what we had before jQuery. Given that, why do we need *another* method? Two important requests.

## Reason the First

When using `submit`, any validation of form fields is completely skipped. Consider this form:

```html
<form method="post" id="theForm">
	
	<p>
	<label for="name">Name</label>
	<input id="name" name="name" required>
	</p>

	<p>
	<label for="email">Email</label>
	<input id="email" name="email" type="email" required>
	</p>

	<p>
	<input type="submit">
	</p>
</form>
```

I've got two fields, both required, with the second field using type `email`. If you hit submit, the form will stop itself from POSTing and show errors, but if you submit with JavaScript, that validation is completely ignored. 

I added two more buttons to my HTML:

```html
<p>
	<button id="testSubmit">Test submit()</button>
	<button id="testRequestSubmit">Test requestSubmit()</button>
</p>
```

And wrote some quick JavaScript to demo this:

```js
const $form = document.querySelector('#theForm');

document.querySelector('#testSubmit').addEventListener('click', () => { $form.submit() });

document.querySelector('#testRequestSubmit').addEventListener('click', () => { $form.requestSubmit() });
```

Clicking the first button immediately shows that validation is ignored. Clicking either the main submit button in the form or the tester button shows validation working.

<p>
<img src="https://static.raymondcamden.com/images/2024/03/form1.jpg" alt="Screenshot showing validation being run on the first formfield" class="imgborder imgcenter" loading="lazy">
</p>

## Reason the Second

Not only is validation ignored with `submit()`, any submit handler on the form itself is completely ignored. I added this:

```js
$form.addEventListener('submit', e => {
	console.log('submit fired on form');
	e.preventDefault();
});
```

And again, `submit()` ignores it and `requestSubmit()` runs it fine. I'm *mostly* sure I remember this aspect of `submit()`, but it's definitely been a while since I've thought about it.

Anyway, everyone loves the web platform. (Except Apple.) Here's a CodePen showing this in action if you want to see for yourself. (Which is 100% why most of my blog posts exist.)

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="wvZwNxR" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/wvZwNxR">
  requestSubmit test</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>
<p>