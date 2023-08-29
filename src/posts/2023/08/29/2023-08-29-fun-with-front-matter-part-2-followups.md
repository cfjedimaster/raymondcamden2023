---
layout: post
title: "Fun With Front Matter: Part 2 - Follow-ups"
date: "2023-08-29T18:00:00"
categories: ["jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/tip.jpg
permalink: /2023/08/29/fun-with-front-matter-part-2-followups
description: Using front matter to specify a follow up to your content.
---

Today I'm following up (heh, get it) on the series I started yesterday on interesting use cases for your Jamstack site's front matter. In [yesterday's post](https://www.raymondcamden.com/2023/08/28/fun-with-frontmatter-part-1-related-posts), I described how to use front matter to define a list of "related posts" to a blog post. Today's post is a natural follow-up to that one and deals with... well follow-ups!

When I was describing the behavior of related posts in my demo yesterday, I mentioned that the "relationship" would be one way. So post A may be related to B and C, and we would render that, but it would not automatically create a relationship *from* B to A. As I said in the post, I can definitely see people disagreeing with that, but I had in mind a more natural way for an older post to be related to newer content, a follow-up. 

## Defining the Follow-Up

So unlike the previous post where I had to define an array in front matter, this time I'm going to use a simple key/value pair. Here's an example:

```
followup: /posts/beta/
```

As discussed in the last post, I need *some* way to link to another post and the URL seems like a natural fit. That was easy!

## Displaying the Follow-Up

Now that I've got a way to define a follow-up, let's look at how to display it. As with the previous post, my example code uses a `post` layout where I define how blog posts are rendered. Previous, the content above where the blog post would go was rather simple:

```html
{% raw %}<h2>{{ title }}</h2>
<p><i>Published {{ date | dtFormat }}</i></p>{% endraw %}
```

In my opinion, if I've written a follow-up to a post it should be noted on top, so I'm going to add it there:

```html
{% raw %}<h2>{{ title }}</h2>
<p><i>Published {{ date | dtFormat }}</i></p>
{% if followup %}
	{% assign followupPost = followup | getByURL: collections.posts %}
	<p><strong>Followup:</strong> <a href="{{ followupPost.url }}">{{ followupPost.data.title }}</a></p>
{% endif %}
{% endraw %}
```

The change here is to simply check for the existence of the `followup` data, and if so, display it. To get the post we'll call a new filter named `getByURL`. Remember that we need to pass the actual data (the URL) as well as the collection of data to check. 

Let's look at that code now.

```js
eleventyConfig.addFilter("getByURL", function(url, posts) {
    return posts.reduce((prev, p) => {
        if(p.data.page.url === url) return p;
        else return prev;
    });
});
```

I got fancy and made use of `reduce` to transform the array of posts to one object based on the URL. Nice and simple. Here's an example of it being rendered:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/fwfm4.jpg" alt="Example rendering of a follow-up" class="imgborder imgcenter" loading="lazy">
</p>

And that's it! Yes, this is a pretty trivial use of front matter, but as I said, I think it pairs well with the previous post. You can find the source code for this tip here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/funwithfrontmatter2>

## Extra Credit

Ok, if you want, you can stop reading now. In my [original post](https://www.raymondcamden.com/2023/08/28/fun-with-frontmatter-part-1-related-posts), I mentioned how I wanted this series of posts to be Jamstack engine agnostic, but that I'd be using Eleventy as it's my favorite. I want to share a quick tip that's specific to Eleventy and this post.

If you remember from yesterday's post, I had an array of URLs pointing to related content. The filter to transform those URLs into an array of pages looked like so:

```js
eleventyConfig.addFilter("getRelated", function(relatedPosts, posts) {
    let related = [];
    posts.forEach(p => {
        if(relatedPosts.includes(p.data.page.url)) related.push(p);
    });
    return related;
});
```

In today's post, I'm doing similar logic, but for just *one* URL. One nice thing that Eleventy supports is the ability for [one filter to call another](https://www.11ty.dev/docs/filters/#access-existing-filters-in-your-configuration-file), and that means I can rewrite the above logic (assuming I've got a site using both) to be a bit simpler:

```js
eleventyConfig.addFilter("getRelated", function(relatedPosts, posts) {
    return relatedPosts.map(p => eleventyConfig.getFilter('getByURL')(p, posts));
});
```

Now I simply map the passed-in array to an array of pages using the `getByURL` filter. This example can be found in the same repository linked above. 