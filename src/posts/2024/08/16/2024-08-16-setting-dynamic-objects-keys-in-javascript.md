---
layout: post
title: "Setting Dynamic Objects Keys in JavaScript"
date: "2024-08-16T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_keys.jpg
permalink: /2024/08/16/setting-dynamic-objects-keys-in-javascript
description: A look at an ES6 feature that I didn't recognize.
---

It's always a good day when you get pleasantly surprised by JavaScript, even more so when you find that it's a feature that's been around for a while (ES6, which according to Google was standardized in June of 2015). Earlier today I saw some syntax that didn't look quite right to me. Here's a simple example of it:

```js
let type = 'name';

let person = {
    [type]:'Ray'
}
```

Specifically, the thing that surprised me was this portion:

```js
[type]:'Ray'
```

If you `console.log` the code above, you get:

```js
{ name: 'Ray' }
```

And then it makes sense. This syntax allows you to set a dynamic key in an object literal, much like:

```js
person[type] = 'Ray';
```

Apparently, this has been around for nearly ten years and I never noticed it. Or, more likely, maybe I saw it and it didn't click in my head what was going on. 

Officially you can refer to this as 'Computed keys in object literals' and can read more in Dr. Axel's Exploring JS book here: [30.7.2 Computed keys in object literals](https://exploringjs.com/js/book/ch_objects.html#object-literals-computed-keys)

Thanks to [Dr. Axel](https://2ality.com/), [Tane Piper](https://tane.dev/), and [Caleb](https://mastodon.social/@0x33@mastodon.online) for all chiming in on Mastodon when I asked about this.


