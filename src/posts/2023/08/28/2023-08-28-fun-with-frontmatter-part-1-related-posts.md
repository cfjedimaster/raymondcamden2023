---
layout: post
title: "Fun With Frontmatter: Part 1 - Related Posts"
date: "2023-08-28T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/tip.jpg
permalink: /2023/08/28/fun-with-frontmatter-part-1-related-posts
description: A series on doing more with your Jamstack site's front matter
---

I'm kicking off a little series of tips today that's been sitting in my "Blog Ideas" queue for some time. The idea, "Fun with Frontmatter", was based on the idea of taking a look at some of the fun/interesting/hopefully useful things you could include in your Jamstack site's front matter. More than just title, date, and so forth, but useful features you could add to your site driven by data in your content's front matter. Some of these things are features I've talked about before, but I thought a little series would be fun to explore this week. All of my examples will use [Eleventy](https://www.11ty.dev) but could be applied to any other project. With that out of the way, let's get started!

## Tagging Related Posts

In this first blog post, I'm going to discuss how to handle "related posts". Typically this means, I'm writing about subject X, and there are a few older articles I think my readers may want to review as well. Normally on my blog, I just link to them in either the introduction or conclusion of a post. But let's consider a simple way to automate this process in our front matter and Eleventy layout templates.

The first decision we need to make is if this will be 'bidirectional' - i.e., if post A says it's related to post B, should post B be related to A? I'm going to say no. In my opinion, I typically want folks to go back and look at those older posts, but folks landing on those older posts may not need to read the newer ones. I do have a blog post in this series coming up that will address that, but for now, I'm going with the idea that these links will be one-way.

OK, easy enough. Next, we need to figure out how to add related posts to our front matter. I use YAML in my Eleventy front matter, and while YAML is easy, it can get a bit complex when you leave simple key/value pairs. 

<figure>
<img src="https://static.raymondcamden.com/images/2023/08/fwfm1.jpg" alt="A look at how simple YAML is..." class="imgborder imgcenter" loading="lazy">
<figcaption>A look at how simple YAML is...</figcaption>
</figure>

The syntax for arrays, or at least one syntax, looks like so:

```
---
layout: post
title: Gamma Post
tags: posts
date: 2020-10-10 12:00:00
related:
    - One thing
    - Leads
    - To another
---
```

In the front matter above, `related` designates an array with each array item beneath it, indented. Note that tabs are <strong>not</strong> allowed in YAML! I entered four spaces for each item.

So that's how to define an array. The next question is... what exactly do we put there??? When I'm working on my blog, for example, I've got a folder named `posts` that includes over six thousand Markdown files. These files are separated by folders based on year and then by month. We need a unique identifier here that can be used to directly associate with one other piece of content. 

If we look at page content, you will see this:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/fwfm2.jpg" alt="Dump of page object" class="imgborder imgcenter" loading="lazy">
</p>

Looking at the available options, one possible solution would be to use `fileSlug`, but that may change in the future, especially if your site grows to a point where you begin re-organizing your content. 

What *shouldn't* ever change though is the `url` value. So let's use that. Given a small sample site (I'll share a link to the source in a bit), I specified the list like so:

```
---
layout: post
title: Gamma Post
tags: posts
date: 2020-10-10 12:00:00
related:
    - /posts/delta/
    - /posts/alpha/
---
```

Now that we've tagged the posts, it's time to use them.

## Displaying Related Posts

In my simple blog, each post makes use of a `post` template that looks like so:

```html
{% raw %}---
layout: layout
---

<h2>{{ title }}</h2>
<p><i>Published {{ date | dtFormat }}</i></p>

{{ content }}{% endraw %}
```

As a mostly arbitrary decision, I decided to display related posts *after* the main content. Obviously, there are other options, like on top, or the side. First, though, check to see if any related posts exist.

```
{% raw %}{% if related %}
<h3>Related Posts</h3>
{% endif %}{% endraw %}
```

Inside, I'm going to use an ordered list. I'll get my related posts by passing my array of content to a filter I'll write in a second named `getRelated`. Eleventy filters don't have access to collections, so I pass that as the second argument. If you haven't seen this syntax before it may be a bit confusing, but `related` will be the first argument and `collections.posts` the second.

```
{% raw %}{% if related %}
<h3>Related Posts</h3>
	<ul>
	{% assign posts = related | getRelated: collections.posts %}
	{% for post in posts %}
		<li><a href="{{ post.url }}">{{ post.data.title }}</a></li>
	{% endfor %}
	</ul>
{% endif %}{% endraw %}
```

Note that I'm just linking to the post and showing the title. It would also make sense to include the date. Now let's look at the filter.

```js
eleventyConfig.addFilter("getRelated", function(relatedPosts, posts) {
    let related = [];
    posts.forEach(p => {
        if(relatedPosts.includes(p.data.page.url)) related.push(p);
    });
    return related;
});
```

Given that our first argument is an array of related posts, we want to filter the larger array, `posts`, to those that are in the array. I suppose I could have used `.filter` as well. The net result would be just the related articles. Here's a screenshot of that post:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/fwfm3.jpg" alt="Screenshot showing related posts working correctly." class="imgborder imgcenter" loading="lazy">
</p>

You can find the source for this demo here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/funwithfrontmatter> I hope this helps, and tomorrow I'll have another tip to share. Enjoy!
