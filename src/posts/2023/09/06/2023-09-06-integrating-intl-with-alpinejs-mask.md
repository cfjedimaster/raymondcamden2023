---
layout: post
title: "Integrating Intl with Alpine.js Mask"
date: "2023-09-06T18:00:00"
categories: ["javascript"]
tags: ["alpinejs"]
banner_image: /images/banners/mask.jpg
permalink: /2023/09/06/integrating-intl-with-alpinejs-mask
description: A look at the Alpine.js Mask plugin and integrating it with the Intl spec.
---

I've been using Alpine.js for quite a while now (although I still make silly mistakes, see the p.s. at the end) but haven't yet looked at the "official" plugins. Listed in the [docs](https://alpinejs.dev/start-here), those plugins include:

* [Intersect](https://alpinejs.dev/plugins/intersect) - a simple hook to recognize when an element is visible (I plan on blogging about this later)
* [Persist](https://alpinejs.dev/plugins/persist) - a simple hook to add persistence to Alpine data (another plugin I plan on blogging about)
* [Focus](https://alpinejs.dev/plugins/focus) - a way to manipulate focus
* [Collapse](https://alpinejs.dev/plugins/collapse) - a simple UI plugin for collapsible content
* [Morph](https://alpinejs.dev/plugins/morph) - another UI plugin that attempts to transform one set of HTML into another (I honestly don't quite get this one - yet)
* And finally, Mask.

## Masking Fields with Alpine

The [Mask](https://alpinejs.dev/plugins/mask) plugin adds a "mask" to an input field. This is a pretty common UX pattern where an input field will expect data in a particular form, and as you type, it will automatically force it into that form. I use the word "force" because, at least to me, sometimes these types of fields can be incredibly annoying. As an example, a field looking for a day (M/D/Y) that auto-inserts the slash but doesn't stop you from entering a slash will typically result in me having two slashes. Why? Because I type fast and don't even see the slash inserted. Then I have to back up and delete it and typically I make the same mistake again. I end up "fighting" with the field and it's more annoying than helpful.

That being said, as I played with the examples on the Alpine docs, I didn't have any trouble and it seemed to work really well. 

To add the plugin, you can simply add another script tag, but ensure you put it before the core Alpine one. Here's an example from their docs:

```html
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/mask@3.x.x/dist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

And then you use the `x-mask` directive to define the format of the field. So for example, to define a date mask, you could use:

```html
<input x-mask="99/99/9999">
```

When defining the mask, the letter 'a' allows for any alphabetical letter, `9` maps to digits, and `*` to any character. So above, I'm basically saying: Number number slash (auto typed), number number slash (auto type), followed by four numbers.

Here's a CodePen using the example from the docs. Note the use of `placeholder` to let the user know we mean the American style of dates.

<p class="codepen" data-height="450" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="QWzGRwr" data-editable="true" data-user="cfjedimaster" style="height: 450px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/QWzGRwr">
  Alpine Mask testing</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

One thing I'll note about this example - you'll want to keep the input type set to text (or blank, which defaults to text) otherwise the UI of the browser's date field conflicts with Alpine's plugin. It also means if you need a real date object out of the field you'll need to parse it. For the heck of it, here's an example where I bind a value, `realDate`, to the input field. 

<p class="codepen" data-height="450" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="yLGVWJQ" data-editable="true" data-user="cfjedimaster" style="height: 450px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/yLGVWJQ">
  Alpine Mask testing (1)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

This works for the most part but needs to handle invalid dates better as you can enter a day value of 99. 

## Dynamic Masks

The plugin also allows for dynamic masks. This is done by adding `:dyanmic` to the markup. I'll start off with their example for credit cards:

```html
<input x-mask:dynamic="
    $input.startsWith('34') || $input.startsWith('37')
        ? '9999 999999 99999' : '9999 9999 9999 9999'
">
```

Note the magic keyword, `$input`, refers to what's in the field currently.

Instead of defining it inline, you can also just pass the name of a function, and Alpine will run that function with the input as an argument. Here's an example that attempts to do basic mapping on a US phone number:

<p class="codepen" data-height="450" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="poqNmwq" data-editable="true" data-user="cfjedimaster" style="height: 450px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/poqNmwq">
  Alpine Mask testing (1a))</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

The dynamic part kicks in by looking at the beginning of the number. If the user includes 1 for the international number, I format it differently, and since the format inserts a `+` in front, the logic has to handle the *initial* state of just starting with a `1` and then switching to `+1`. This is probably not perfect, but it gives you an idea of how flexible the plugin can be.

## Money, money, money

Finally, the plugin has a special feature just for money. The simplest form is:

```html
<input x-mask:dynamic="$money($input)">
```

This will do two things. It will automatically add commas for thousands separators and use a decimal for, well decimal inputs. I don't think I need to show a demo of this, but the [docs](https://alpinejs.dev/plugins/mask#money-inputs) have a few you can try quickly. What interests me is the additional arguments that `$money` support. After `$input`, you can pass up to three optional arguments. In order they are:

* The decimal separator. In their docs, they show specifying a `comma` for values like so: 999,99. 
* The thousands separator. The same places that tend to use commas for decimals tend to use periods for thousands. So for example:  9.999,99.
* And finally, you can specify a different number for precision. Honestly, I'm not sure when you would use that in money. 

If you wanted to set the mask for France, which uses a space for thousands and a comma for decimals, you could use this: `$money($input, ',', ' ')`.


According to this random [doc](https://docs.oracle.com/cd/E19455-01/806-0169/overview-9/index.html) on Oracle's site, America and Great Britain are actually two of the *few* places to use a period for decimals. 

<p>
<img src="https://static.raymondcamden.com/images/2023/09/the-more-you-know.gif" alt="The More You Know" class="imgborder imgcenter" loading="lazy">
</p>

Ok, so given that we can be flexible in how we set up the money mask, can we use the browser's built-in [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) support to make it dynamic based on the user's locale? Yes, we can!

Thanks to a great [post on StackOverflow](https://stackoverflow.com/a/51411310/52160), you can build a simple function that wraps Intl's [formatToParts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/formatToParts) method. This method runs a format on your input but returns it in parts, not just the formatted value.

Here's an example based on MDN docs that displays each of the parts:

<p class="codepen" data-height="450" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="bGOByXz" data-editable="true" data-user="cfjedimaster" style="height: 450px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/bGOByXz">
  Intl Format to Parts</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

You can see how the `group` and `decimal` part is called out. I adapted the code from the [StackOverflow answer](https://stackoverflow.com/a/51411310/52160) to return both:

```js
const getSeparators = (locale) => {
	let numberWithDecimalSeparator = 1111.1;
	let result = { decimal: '.', group: ',' };
	let parts = Intl.NumberFormat(locale).formatToParts(numberWithDecimalSeparator);
	parts.forEach(p => {
		if(p.type === 'decimal') result.decimal = p.value;
		if(p.type === 'group') result.group = p.value;
	});
	return result;
}
```

I combined this with another function to get the current locale:

```js
const getUserLocale = () => {
  if (navigator.languages && navigator.languages.length) {
    return navigator.languages[0];
  }
  return navigator.language;
};
```

Given that I can now get the locale and the locale specific portions, I can then add this to my Alpine app like so:

<p class="codepen" data-height="450" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="OJrRWVe" data-editable="true" data-user="cfjedimaster" style="height: 450px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/OJrRWVe">
  Alpine Mask testing</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

Basically, I just the Alpine `init` method to grab the separators and make use of them in HTML: `x-mask:dynamic="$money($input,decimal,group)"`

Simple... mostly. :) Anyway, I hope this helps, and let me know if you have any questions!

p.s. When I first worked on the above demo, it didn't work right, and I was stymied. Turned out I had forgotten a basic Alpine.js tenant where when referencing values in HTML you simply use the name, for example: `<span x-text="someVariable"></span>`. But in JavaScript, you use the `this` scope:  `console.log(this.sameVariable)`. My code was failing because I was doing `$money($input, this.decimal, this.group)`. Thank you to [trych](https://github.com/trych) for pointing that out!

