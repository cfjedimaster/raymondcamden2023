---
layout: post
title: "I threw thousands of files at Astro and you won't believe what happened next..."
date: "2026-02-13T18:00:00"
categories: ["development"]
tags: ["javascript","astro"]
banner_image: /images/banners/stars.jpg
permalink: /2026/02/13/i-threw-thousands-of-files-at-astro-and-you-wont-believe-what-happened-next
description: Working with lots... and lots.... of Markdown files in Astro
---

Ok, forgive me for the *incredibly* over the top title there. Yes, it's clickbait, but I'm also tired after a *very* long week and feeling a little crazy, so just go with me here a bit, I promise it will be worth it. I was curious how well [Astro](https://astro.build/) could handle a large amount of data and I thought - what happens if I threw this blog (well, the Markdown files) at it and tried to render out a site? Here's what I did wrong and what eventually worked (better than I expected).

## Round One

I began by creating a soft link locally from my blog's repo of `posts` to the `src/pages/posts` of a new Astro site. My blog currently has [6742](https://www.raymondcamden.com/stats) posts (all high quality I assure you). Each one looks like so:

```
---
layout: post
title: "Creating Reddit Summaries with URL Context and Gemini"
date: "2026-02-09T18:00:00"
categories: ["development"]
tags: ["python","generative ai"]
banner_image: /images/banners/cat_on_papers2.jpg
permalink: /2026/02/09/creating-reddit-summaries-with-url-context-and-gemini
description: Using Gemini APIs to create a summary of a subreddit.
---

Interesting content no one will probably read here...
```

In my Astro site's `index.astro` page, I tried this first:

```js
const allPosts = Object.values(import.meta.glob('./posts/**/*.md', { eager: true }));
```

And immediately ran into an issue with the `layout` front matter. Astro parses this and expects to find a `post` component in the same directory. My "fix" was to... remove the symbolic link and make a real copy and then use multi-file search and replace to just delete the line. 

That worked... but was incredibly slow. I'd say it took about 70 or so seconds for each load. 

This was... obviously... the wrong approach.

## Round Two - The Right Approach

The solution was simple - use [content collections](https://docs.astro.build/en/guides/content-collections/). This involved moving my content out of the `src/pages` directory and creating a file, `src/content.config.js` to define the collection:

```js
import { defineCollection } from 'astro:content';

import { glob, file } from 'astro/loaders';


const blog = defineCollection({ 
    loader: glob({pattern:"**/*.md",base:"./posts"})
 });

export const collections = { blog  };
```

You an see where I define my `blog` collection using a glob pattern and a base directory. That's literally it. This still took a few seconds to load, but was cached and future reloads were zippy zippy.

## But wait... there's more

With this working, I began building out a few pages just to see things in action. First, a home page that shows ten recent posts with excepts:

```html
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { formatDate, excerpt } from "../utils/formatters.js"

import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
const sortedPosts  = posts.sort((a, b) => {
	return new Date(b.data.date)-new Date(a.data.date);
}).slice(0,10);

---

<BaseLayout pageTitle="Blog">

	{ sortedPosts.map((post:any) => 
	<div>
		<h3><a href={ `/posts/${post.id}` }>{post.data.title}</a></h3>
		<p><i>Published { formatDate(post.data.date)}</i></p>
		<p set:html={ excerpt(post.rendered.html)}></p>
	</div>
	)}
	<p>
		<a href="all.html">Every Post Ever</a>
	</p>
</BaseLayout>
```

I think the import bits here are on top. You can see I need to sort my posts and I do so such that the most recent posts are on top. (In theory this sort would be faster if I pre-processed the string based dates into Date objects once, but the demo was working so fast now I didn't bother.)

Now note the the link. To make this work, I created a new file, `src/pages/posts/[...id].astro`. The rest parameter in the filename (`...id`) is important. I'll explain after sharing the file contents:

```html
---
import BaseLayout from '../../layouts/BaseLayout.astro';

import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');

  return posts.map(post => ({
    params:{ id: post.id },
    props: { post },
  }));

}

const { post } = Astro.props;
const { Content } = await render(post);
---

<BaseLayout pageTitle={post.data.title}>
  <Content />
</BaseLayout>
```

My `id` values are coming from the permalink of my blog posts and look like so: `permalink: /2026/02/09/creating-reddit-summaries-with-url-context-and-gemini`. Notice the forward slashes? This was throwing errors in Astro when I originally named my file `[id].astro`. The rest parameter version fixed that immediately.

That's almost the last issue. With this in place, I could browse a few blog posts and see how they looked. I noticed something odd though. I had a header with three dots in it:

```
## Temporal is Coming...
```

And when rendered out, it turned into trash. I went to Gemini, asked about it, and it turned out to be an issue with Astro's Markdown processor considering the three dots a Unicode ellipsis character. My app didn't have a "real" HTML layout at this point (I added `BaseLayout` later) and was missing: 

```html
<meta charset="utf-8" />
```

As soon as that was added, it rendered just fine!

<p>
<img src="https://static.raymondcamden.com/images/2026/02/ab1.jpg" loading="lazy" alt="Blog home page" class="imgborder imgcenter">
</p>

And how well did it perform when building? At near seven thousand pages, `npm run build` took...

<p>
<img src="https://static.raymondcamden.com/images/2026/02/ab2.jpg" loading="lazy" alt="Pause for effect" class="imgborder imgcenter">
</p>

8 seconds. That's pretty dang good I'd say. 

So, if you want to try this yourself, you can find the source here: <https://github.com/cfjedimaster/astro-tests/tree/main/rayblog>

Note! I thought it was a bit of a waste to check in *all* of my blog posts in this repo so I filtered it down to the last three years. If you want to recreate that I did (and heck, you can probably make it quicker, if you do, drop me a line!), you can clone my posts here: <https://github.com/cfjedimaster/raymondcamden2023>

Photo by <a href="https://unsplash.com/@jeremythomasphoto?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Jeremy Thomas</a> on <a href="https://unsplash.com/photos/the-stars-and-galaxy-as-seen-from-rocky-mountain-national-park-4dpAqfTbvKA?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      