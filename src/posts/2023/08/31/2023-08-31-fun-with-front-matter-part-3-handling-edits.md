---
layout: post
title: "Fun With Front Matter: Part 3 - Handling Edits"
date: "2023-08-31T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/tip.jpg
permalink: /2023/08/31/fun-with-front-matter-part-3-handling-edits
description: Another example of front matter - signifying edits (both when and why)
---

I hope by now that folks are getting that the point of this series isn't so much technical but inspirational. I think a lot of people approaching front matter tend to keep it rather simple - title, date, tags or categories, and when I envisioned this series I really wanted to explore some more interesting things you could do. Today's entry is an example of that. Given that a (good) blog post **always** contains a date, how would you handle noting a post that's been edited? Here's a simple example. 

## Adding to Front Matter

Let's start by simply adding a new `edited` property to our front matter. Here's an example in a blog post:

```
---
layout: post
title: Gamma Post
tags: posts
date: 2020-10-10 12:00:00
edited: 2021-10-12 12:00:00
---

This is the Gamma post.
```

This post was written, originally, on October 10, 2020, but was edited on October 12, 2021. That was so simple I almost feel dumb sharing it, but we've got to start somewhere, right?

## Displaying the Edit

Originally, my post layout had code like so:

```html
{% raw %}<p><i>Published {{ date | dtFormat }}</i></p>{% endraw %}
```

The `dtFormat` filter looks like so:

```js
const english = new Intl.DateTimeFormat('en');

eleventyConfig.addFilter("dtFormat", function(date) {
    return english.format(date);
});
```

I've said it before and I'll say it again - I *love* [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl). 

Adding support for an edited field then just takes adding a bit of code:

```html
{% raw %}<p><i>Published {{ date | dtFormat }}</i>
{% if edited %}
<i>~ Edited {{ edited | dtFormat }}</i>
{% endif %}{% endraw %}
```

When displayed, you get something like so:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/fwfm5.jpg" alt="Example rendering of an edit." class="imgborder imgcenter" loading="lazy">
</p>

Cool, but let's maybe take it up a notch. Sometimes it would be nice to know *what* was edited. How about optionally supporting a description of the edit. Here's an example:

```
---
layout: post
title: Delta Post
tags: posts
date: 2020-10-06 12:00:00
edited: 2021-10-12 12:00:00
editReason: Fixed bad link.
---
```

Now let's add this to the layout:

```html
{% raw %}<p><i>Published {{ date | dtFormat }}</i>
{% if edited %}
<i>~ Edited {{ edited | dtFormat }}
{% if editReason %}
	({{ editReason }})
{% endif %}
</i>
{% endif %}
</p>{% endraw %}
```

Basically, if an edit, show it, and if an edit reason, show that. Those IFs may get a bit hard to read there, but I think it's acceptable. Here's an example of this rendering.

<p>
<img src="https://static.raymondcamden.com/images/2023/08/fwfm6.jpg" alt="Example rendering of an edit with an associated reason." class="imgborder imgcenter" loading="lazy">
</p>

As with the other posts in this series, you can find the source at my Eleventy repo here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/funwithfrontmatter3>