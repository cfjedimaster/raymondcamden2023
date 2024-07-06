---
layout: post
title: "Add Squirrelly Support to Eleventy"
date: "2024-07-06T18:00:00"
categories: ["javascript","jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/squirrel_computer.jpg
permalink: /2024/07/06/add-squirrelly-support-to-eleventy
description: How to add Squirrelly support to Eleventy
---

I'm supposed to be on vacation but writing about Eleventy [two days ago](https://www.raymondcamden.com/2024/07/04/building-a-web-version-of-your-mastodon-archive-with-eleventy) has got it fresh on my mind, also, I can't pass up an opportunity to use "squirrelly" in a blog title. I subscribe to three or four different email newsletters related to web development. It's fairly normal to see the same link shared among a few of them. Most recently an example of this was the [Squirrelly](https://squirrelly.js.org/) library. This is, yet another, JavaScript template language and I thought I'd take a look at it in my spare time. Given that Eleventy makes it easy to add other template languages, how long does it take you to add support for it?

## Step One - Make Your Eleventy project

Technically this isn't even a step, any folder can be processed with the `eleventy` CLI, but assume you've got a new or existing one you want to add Squirrelly to.

## Step Two - Install Squirrelly

This is done via `npm`:

```bash
npm install squirrelly --save
```

## Step Three - Add Support to Eleventy

Now for the fun part. Given an Eleventy configuration file, first, include Squirrelly:

```js
let Sqrl = require('squirrelly');
```

Next, let Eleventy know to process files using the template. This doesn't tell it *how* to, just to pay attention to it and include it in the output: You can use any extension you want and I went with `sqrl` as it matched the variable I used to instantiate the library.

```js
eleventyConfig.addTemplateFormats('sqrl');
```

Now to tell Eleventy how to actually support the library's template language. For this, I used Eleventy's [docs for custom templates](https://www.11ty.dev/docs/languages/custom/) and Squirrel's [introductory docs](https://squirrelly.js.org/docs/get-started/first-template):

```js
eleventyConfig.addExtension('sqrl', {

    compile: async (inputContent) => {

        return async (data) => {
            return Sqrl.render(inputContent, data);
        };
    },
});
```

The `compile` function is passed the input of the template and returns a function that accepts the compiled data that is available to every template. To be clear, this is the 'usual' Eleventy data which comes from multiple sources, is combined, etc. 

That's it. Done. Less than five minutes perhaps. Here's the complete Eleventy config file I used for my testing:

```js
let Sqrl = require('squirrelly');

module.exports = function(eleventyConfig) {

	eleventyConfig.addGlobalData('site', { name:'test site', foo:'goo'});

	eleventyConfig.addTemplateFormats('sqrl');

	eleventyConfig.addExtension('sqrl', {

		compile: async (inputContent) => {

			return async (data) => {
				return Sqrl.render(inputContent, data);
			};
		},
	});

};
```

Let's build a `.sqrl` template:

```html
{% raw %}---
name: ray
number: 3
somearray: 
    - ray
    - may
    - "zay zay"
---

<p>
hello world
</p>

<p>
name: {{ it.name }}
</p>

<p>
site.name: {{ it.site.name }}
</p>

<p>
{{ @if (it.number === 3) }}
Number is three
{{ #elif (it.number === 4) }}
Number is four
{{ #else }}
Number is five
{{ /if}}
</p>

{{! console.log('hi from squirrel') }}

<hr>

{{@each(it.somearray) => val, index}}
<p>
Display this
The current array element is {{val}}
The current index is {{index}}
</p>
{{/each}}{% endraw %}
```

I literally just copied over sample code from their docs and confirmed that page data (see the front matter on top) and global data worked and... yeah, that was it. 

If you want this sample code to start off testing Squirrelly, you can find it here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/squirrelly> 

If you want to learn more about Squirrelly, check out the site here: <https://squirrelly.js.org/>

