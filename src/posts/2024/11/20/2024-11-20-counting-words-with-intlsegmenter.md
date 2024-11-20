---
layout: post
title: "Counting Words with Intl.Segmenter"
date: "2024-11-20T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_words.jpg
permalink: /2024/11/20/counting-words-with-intlsegmenter
description: How to use the browser's built-in features to count words.
---

Yesterday, I gave my presentation on [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl), the browser's built-in support for internationalization. I've been using this for a while now, but while researching the spec for my presentation, I ran into multiple cool aspects of it I wasn't aware of. One feature I thought was particularly interesting was the [Segementer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) object. MDN's description is nice and succinct:

<blockquote>
The Intl.Segmenter object enables locale-sensitive text segmentation, enabling you to get meaningful items (graphemes, words or sentences) from a string.
</blockquote>

In particular, I thought the ability to get words would be an interesting use case. In the past, I've either done a lame split on " ", or used regex and word boundaries, but this is problematic in multiple languages. Again, quoting MDN:

<blockquote>
If we were to use String.prototype.split(" ") to segment a text in words, we would not get the correct result if the locale of the text does not use whitespaces between words (which is the case for Japanese, Chinese, Thai, Lao, Khmer, Myanmar, etc.).
</blockquote>

Ok, so given that, how can we use the feature to count words? 

First, you need to create an instance of the Segmenter:

```js
let segmenter = new Intl.Segmenter(navigator.language, { 
    granularity: 'word'
});
```

In the code above, I've specified the browser's current language for the locale (which is the default, but I like specifying it) and used a granularity value of `word`. 

Once I've got that, it's then trivial to use:

```js
let segmenter = new Intl.Segmenter(navigator.language, { 
    granularity: 'word'
});

let input = `
This is my input. There are many like it, but this one is mine. 
My input is my best friend. It is my life.
`;

let words = segmenter.segment(input);
```

The result is an iterator, but we can quickly change that to an array and log it:

```js
console.log(Array.from(words));
```

The result looks like so (note, I removed a bit of data to keep the sample shorter):

```js
[
 {
    segment: '
',
    index: 0,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: false
 },
 {
    segment: 'This',
    index: 1,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: true
 },
 {
    segment: ' ',
    index: 5,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: false
 },
 {
    segment: 'is',
    index: 6,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: true
 },
 {
    segment: ' ',
    index: 8,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: false
 },
 {
    segment: 'my',
    index: 9,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: true
 },
 {
    segment: ' ',
    index: 11,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: false
 },
 {
    segment: 'input',
    index: 12,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: true
 },
 {
    segment: '.',
    index: 17,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: false
 },
 {
    segment: ' ',
    index: 18,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: false
 },
 {
    segment: 'There',
    index: 19,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: true
 },
 {
    segment: ' ',
    index: 24,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: false
 },
 {
    segment: 'are',
    index: 25,
    input: '
' +
      'This is my input. There are many like it, but this one is mine. My input is my best friend. It is my life.
',
    isWordLike: true
 }
]
```

Notice how the results include both words, and the spaces between them, but each result also signifies if it is a word (or word like). We can use this to do a count using `reduce`:

```js
let words = Array.from(segmenter.segment(input))
.reduce((total,v) => {
    if(v.isWordLike) total++;
    return total;
},0);
```

You can see this in action below:

<p class="codepen" data-height="500" data-default-tab="result" data-slug-hash="bGXPeWz" data-pen-title="Segmenter" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/bGXPeWz">
 Segmenter</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
 on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

A bit of warning about this approach. I tested with this input:

```
The properties defined in the format specifies the location-path and the alt-text.
```

And the result I got was 14, not 12. This is because of the two hyphenated words, location-path and alt-text, which are considered two words each, and honestly, I think that makes sense, and I'd *want* it to be counted that way, but it did surprise me. Let me know what you think below!