---
layout: post
title: "Fun With Front Matter: Part 4 - Featured Posts"
date: "2023-09-12T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/tip.jpg
permalink: /2023/09/12/fun-with-front-matter-part-4-featured-posts
description: How to use "featured" posts to highlight important content.
---

It's been a few days since my [last post](https://www.raymondcamden.com/2023/08/31/fun-with-front-matter-part-3-handling-edits) in this series. I'd like to blame something in specific but honestly, it's just life. Today's tip will - again - be short and sweet but hopefully helpful. The idea of a "featured" post is that there may be content that, no matter the age or view count in your stats, you want to highlight. It could be your first blog post. A post announcing a new job or life event. Or anything really. How can we use front matter to support this?

## Marking Featured Content

One approach to marking content as featured could be to simply add a `featured` value to the front matter, like so:

```
---
layout: post
title: Gamma Post 7
tags: posts
date: 2023-04-08 12:00:00
featured: true
---
```

This is nice and clear and would probably be what I'd use for... for anything *but* Eleventy. One of Eleventy's features is the ability to quickly 'grab' data by tags. By that I mean, if we use the tag `foo` for a piece of content, we can then later get all content with the same tag using `collections.foo`. So while in general I want this series to be pretty engine agnostic, for now we'll use the `tags` attribute like so:

```
---
layout: post
title: Beta Post
tags: ['posts', 'featured']
date: 2020-10-05 12:00:00
---
```

Note the switch in how the value is written as it's switched from one value to an array. You can also write that like so:

```
---
layout: post
title: Beta Post
tags:
    - posts
    - featured
date: 2020-10-05 12:00:00
---
```

Personally I prefer the shorter approach I think, but just try to be consistent.

## Rendering Featured Posts

As I said above, by using the `tags` approach, we get the benefit of Eleventy making it super easy to work with. I would imagine featured posts would want to be highlighted, so I've added them to the home page, like so:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/fb1.jpg" alt="Blog home page showing a list of blog posts." class="imgborder imgcenter" loading="lazy">
</p>

This comes down to simply using `collections.featured`:

```html
{% raw %}<h2>Featured Posts!</h2>
<ul>
{% for post in collections.featured reversed %}
  <li><a href="{{post.url}}">{{ post.data.title }}</a> ({{ post.date | dtFormat }})</li>
{% endfor %}{% endraw %}
</ul>
```

We could also add a bit of 'flair' on the post page itself, and by flair I mean just a bit of text in a simple demo:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/fb2.jpg" alt="Post with a message stating that it's a featured post." class="imgborder imgcenter" loading="lazy">
</p>

I could also imagine the page layout itself including the list of featured posts, that way the entire list is always visible on every page. 

That's it for this quick tip! You can find the source for this demo here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/funwithfrontmatter4>

p.s. Is any one actually reading these?