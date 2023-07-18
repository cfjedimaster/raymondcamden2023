---
layout: post
title: "Alpine.js and Form Fields"
date: "2023-07-18T18:00:00"
categories: ["javascript"]
tags: ["alpinejs"]
banner_image: /images/banners/eggs.jpg
permalink: /2023/07/18/alpinejs-and-form-fields
description: A look at Alpine.js and form field bindings - with examples.
---

A few years back, I wrote up a detailed blog post on how Vue.js handled form field bindings: ["Vue and Form Fields"](https://www.raymondcamden.com/2020/01/27/vue-and-form-fields). The idea behind the post was that even though we knew things "just worked", it might be helpful to see different form fields in action and show the bindings between them and Vue's data. As I've been doing more and more with [Alpine.js](https://alpinejs.dev), I thought it would be useful to update that post with Alpine examples. Best of all, while building the demo for this post I discovered I was incorrect about how Alpine handles one particular type of form field, so I learned something in the process. (And hopefully, you will too!) Let's get started. 

## The Simple Input

Let's start off with the simplest types, that is:

* input type="text"
* input type="email"
* input type="number"
* input type="password"
* input type="search"
* input type="tel"
* input type="url"
* input type="hidden"

These all have virtually the same UI, with the exception of `password` and `search`, and basically the same UX. For these, you can use `x-model` to bind to your data and everything works as expected. 

There are two things I'll point out though. First, when using `type="number"`, remember that the value of a form field is going to be a string. If you were to do any math with a variable bound via `x-model` and forget this fact, you'll be reminded pretty quickly. Like Vue, Alpine has directives you can apply to quickly fix this:

```html
<p>
<label for="number1">number:</label>
<input x-model.number="number1" id="number1" type="number">
</p>
```

In this case, adding `.number` is all that's required. 

Another interesting side case is this:

```html
<p>
<label for="text2">text (maxlength=5):</label> 
<input x-model="text2" id="text2" type="text" maxlength=5>
</p>
```

Given this value in our JavaScript:

```js
text2:'Raymond Camden',
```

What do you think will be rendered?

<p>
<img src="https://static.raymondcamden.com/images/2023/07/af1.jpg" alt="Form field showing the complete text" class="imgborder imgcenter" loading="lazy">
</p>

Yep, the entire string is shown. To be clear, this is expected, JavaScript can bypass the `maxlength` attribute. If the user edits the field though, they will only be able to delete characters until the `maxlength` value.

## The Weirder Inputs

Now let's turn our attention to the slightly weirder input types.

Let's begin with:

* input type="button"
* input type="submit"
* input type="image"

For `button` and `submit`, using `x-model` is going to set the relevant values for each, but only the button type will show the value. So given:

```html
<p>
<label for="button1">button:</label> 
<input x-model="button1" id="button1" type="button">
</p>
```

Where `button1` is the literal string "button1", you get:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/af2.jpg" alt="Button with text, button1" class="imgborder imgcenter" loading="lazy">
</p>

That's probably not too surprising, but there you go. For `image`, it works as long as you have a valid image URL for your data:

```html
<p>
<label for="image1">image:</label>
<input :src="image1" id="image1" type="image">
</p>
```

And then in JavaScript:

```js
image1:'http://placekitten.com/g/200/300',
```

How about `type="color"`? It also works, but be sure to specify a valid HTML color:

```html
<p>
<label for="color1">color:</label> 
<input x-model="color1" id="color1" type="color">
</p>
```

And in JavaScript:

```js
color1:'#cc8800',
```

Per the [MDN spec](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color) I learned that you can mix upper and lower case with hex, but the value will be lower-cased. I validated that by using `#cC8800` and Alpine reported it the same *until* I picked a new color at which point the hex was in lowercase. I don't necessarily see this biting anyone, but keep in mind that if you are doing any kind of special validation, you will want to check in lowercase only. 

For our final "weird" input, consider `input type="range"`. Visibly this looks the most unique, but it still takes a simple value. However, keep in mind that like `input type="number"`, the output will be a string, and to use it properly as a number in Alpine, you will want to add the directive like so:

```html
<p>
<label for="range1">range:</label> 
<input x-model.number="range1" id="range1" type="range" min="1" max="10">
</p>
```

## The Date Inputs

Now let's turn our attention to the various date-based inputs:

* input type="date"
* input type="datetime-local"
* input type="month"
* input type="time"
* input type="week"

Luckily, there's nothing special at all to report here. You do, however, want to be aware of how to *set* these values if you have defaults in Alpine. So for example, month values look like so:

```
2023-04
```

And week values look like so:

```
2023-W02
```

My suggestion is that if you need to default these and you're struggling, don't default them, just output the value, and play around to get an idea of how to format your values right. A good resource for this is, of course, on MDN: [Date and time formats used in HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Date_and_time_formats)

Whew, almost done!

## Radio Fields

Radio fields in HTML are defined by having the same name, but different values. In Alpine, you would define your options as an array:

```js
radio1Values: ['pizza', 'donuts', 'beer', 'hamburgers' ],
```

And define the selected item, if any, as a string:

```js
radio1: 'beer',
```

And render it in HTML as such:

```html
<p>
radio:<br/> 
<template x-for="(rbv, idx) in radio1Values">
<span>
<input x-model="radio1" :value="rbv" type="radio" 
		:id="'radio1'+idx"/> <label :for="'radio1'+idx" x-text="rbv"></label><br/>
</span>
</template>
</p>
```

Some things to note here. I used the loop index to generate unique IDs for each radio field. Alpine has a 'magic' `$id` function that could have been used as well. I need a unique ID so I can use a `label` that associates correctly. 

## Checkbox Fields

Checkboxes work very similarly to radio fields with the exception that two or more values can be selected. While the value of a radio field will be one value, the value of a checkbox field will be an array, no matter how many items are selected. This may be easy to miss if you are rendering out the value to HTML, as the string version of the array won't be evident. To make it really clear, I added this to my demo Alpine application:

```js
init() {
	this.$watch('checkbox1', (newVal,oldVal) => {
		console.log('checkbox1 is now ', newVal);
	});
	this.$watch('radio1', (newVal,oldVal) => {
		console.log('radio1 is now ', newVal);
	});
}
```

In order to set a default, you will want to ensure you use an array as well:

```js
checkbox1: ['red', 'blue'],
checkbox1Values: ['red', 'blue', 'green', 'orange' ], 
```

## File Fields

I was surprised to not find this in the Alpine docs (or maybe I missed it), but you *can't* use `x-model` with file fields. Why? Because these form fields point to resources on the user's machine, the browser prevents JavaScript from writing values to the field. Otherwise, it could be used for shenanigans. 

You can, of course, read from, and react to, values in the fields. Here's one way:

```html
<input @change="setFile" id="file1" type="file">
```

And in JavaScript:

```js
setFile(e) {
	console.log('file picked', e.target.files[0].name);
}
```

## Select Fields

Now for the one that tripped me up. When working with select fields, you typically define a set of options as an array. So for example:

```js
select1Values: ['cinemax', 'showtime', 'hbo', 'cbs' ],
```

A default value would just be a string:

```js
select1: 'hbo', 
```

In HTML, you may try this:

```html
<p>
select:<br/> 
<select x-model="select1">
	<template x-for="sel in select1Values">
	<option x-text="sel"></option>
	</template>
</select>
</p>
```

Which won't work! Why? (And I had to look this up myself.) When Alpine's parses the HTML template, it's going to set up the model *before* it loops over the values. Luckily there's a mostly easy fix:

```html
<p>
select:<br/> 
<select x-model="select1">
	<template x-for="sel in select1Values">
	<option x-text="sel" :selected="sel === select1"></option>
	</template>
</select>
</p>
```

As you can see, I've bound the selected property so that it's true when the current loop value matches the `x-model`. A multiple select gets a bit more complex. First, like checkboxes, the value will be an array. Here's how you could set a default:

```js
select2: ['showtime', 'cbs'], 
```

And in your HTML, you use an array method to determine if the option is selected:

```html
<p>
select multiple:<br/> 
<select x-model="select2" multiple>
	<template x-for="sel in select2Values">
	<option x-text="sel" :selected="select2.includes(sel)"></option>
	</template>
</select>
</p>
```

As a reminder, like checkboxes, the value of a multiple select will always be an array. 

## Textareas

Ok, I don't know why I saved this till the end, maybe because of the alphabetical sort I (kinda) had going on, but there's absolutely nothing special at all about textareas. Don't forget your defaults can include newlines:

```js
textarea1:`This is my text area
It is better than yours...`,
```

## Demo

If you want to see all of these fields in one big ugly page, check out the CodePen below, and as always, I hope this was helpful!

<p class="codepen" data-height="500" data-default-tab="js,result" data-slug-hash="jOQxzqG" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/jOQxzqG">
  Alpine Form Examples</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>
