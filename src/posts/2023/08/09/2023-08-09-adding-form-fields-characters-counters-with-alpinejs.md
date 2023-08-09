---
layout: post
title: "Adding Form Fields Character Counters With Alpine.js"
date: "2023-08-09T18:00:00"
categories: ["javascript"]
tags: ["alpinejs"]
banner_image: /images/banners/tip.jpg
permalink: /2023/08/09/adding-form-fields-characters-counters-with-alpinejs
description: Add an interactive character counter with Alpine.js.
---

Nearly three years ago I shared a Vue.js tip on adding "counters" to your form fields. The idea is, if you have a max length on a text area, as an example, it would be nice to let the user know as they type exactly how many characters they've already entered. You can read that old post here: [Vue Quick Shot - Form Field Character Counters](https://www.raymondcamden.com/2020/09/14/vue-quick-shot-form-field-character-counters). As I've been going through my older Vue posts and updating them to [Alpine.js](https://alpinejs.dev/), I thought this would be an excellent candidate and a great example of where I'd use Alpine in development.

## Require a Minimum Number of Characters

This post will pretty much mirror the [old one](https://www.raymondcamden.com/2020/09/14/vue-quick-shot-form-field-character-counters), so let's begin with a simple example where a form field has a minimum number of required characters.

```html
<input type="text" x-model="min1" id="min1" minlength=10>
```

I'm using HTML's built-in validation with the `minlength` attribute and have bound the form field to an Alpine variable `min1`. Now let's add a counter:

```html
<label for="min1">Enter a minimum of 10 characters please: </label>
<input type="text" x-model="min1" id="min1" minlength=10><br/>
Current Length: <span x-text="min1.length"></span>
```

I've used `min1.length` as a quick way to display the current length. Now, I could have used a [computed getter](https://alpinejs.dev/start-here#computed-properties-using-getters), but honestly, that feels like overkill. For completeness' sake, here's an example of how that would look. First the HTML:

```html
Current Length (via Getter): <span x-text="min1Length"></span>
```

And then the JavaScript:

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    min1:'', 
    get min1Length() { return this.min1.length; }
  }))
});
```

So this is where I get on my soapbox a bit and say that *generally* I would rather not have "logic" like `.length` in my HTML. I would usually go with the getter, however with the logic being so simple, I feel it's ok. I appreciate I've got options here and you do you when it comes to your code.

Now let's get a bit fancy. Let's conditionally apply a style when the field doesn't have enough characters. Again, first the HTML:

```html
<p>
<label for="min2">Enter a minimum of 10 characters please: </label>
<input type="text" x-model="min2" id="min2" minlength=10 required><br/>
Current Length: <span x-text="min2.length" :class="toShort?'bad1':''"></span><br/>
</p>
```

You can see the conditional class declaration in the `span` tag, where if `toShort` is true, the class `bad1` is applied. Here's that class:

```css
.bad1 { color: red; }
```

And the JavaScript:

```js
min2:'',
get toShort() { return this.min2.length < 10; }
```

Now as you type, the span will be colored red until the minimum number of characters is added.

But hey, the only thing better than more JavaScript is no (or less at least) JavaScript! 

<p>
<img src="https://static.raymondcamden.com/images/2023/08/shockedcat.gif" alt="Shocked cat" class="imgborder imgcenter" loading="lazy">
</p>

CSS lets you style invalid form fields, and even better, you can combine this with selectors to style *other* things. So here's our third example:

```html
<p>
<label for="min3">Enter a minimum of 10 characters please: </label>
<input type="text" x-model="min3" id="min3" minlength=10 required><br/>
Current Length: <span x-text="min3.length"></span><br/>
</p>
```

I'm still using JavaScript obviously for the `x-model`, but I've done two things. First, I marked the field as actually required and then removed the binding for my class. I then just added this CSS:

```css
#min3:invalid ~ span {
  color: red;
}
```

Now we get the *exact* same result with less JavaScript. 

## Require a Maximum Number of Characters

Now let's flip it around and work with fields that require a maximum number of characters. Adding the character counter is no big deal, but this time we're going to use CSS a bit differently. If the user tries to enter too many characters, they will be blocked, period. (Unless they use devtools, but your backend validation will handle that, right?) In this case, we're going to use CSS to add a *warning* as they approach the max. 

Here's our HTML:

```html
<p>
<label for="max1">Enter a maximum of 10 characters please: </label>
<input type="text" x-model="max1" id="max1" maxlength=10 required><br/>
Current Length: <span x-text="max1.length" :class="tooLong?'warning1':''"></span><br/>
</p>
```

Now I'm using a getter named `tooLong`. Here's that code:

```js
get tooLong() { return this.max1.length > 6 }
```

As you can see, I picked a value (7 and higher) that is "close" to the max of the field. Now as the user types, when they "approach" the max, they will get a visual warning. I used this CSS, and honestly, it's not great, but that's a design thing that could be corrected:

```css
.warning1 { color: pink; font-weight: bold; text-decoration: underline; }
```

You could further enhance this perhaps by using the 'warning' color as you approach, and the 'bad' color at 10, but as we used 'bad' for, well bad stuff, and the max isn't bad, just the max, I'm not sure if that would make sense. Anyway, enjoy the CodePen below!

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="html" data-slug-hash="ExOzwdo" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/ExOzwdo">
  Untitled</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>