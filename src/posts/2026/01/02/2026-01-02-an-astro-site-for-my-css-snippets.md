---
layout: post
title: "An Astro site for my CSS Snippets"
date: "2026-01-02T18:00:00"
categories: ["development"]
tags: ["javascript","astro"]
banner_image: /images/banners/welcome2018.jpg
permalink: /2026/01/02/an-astro-site-for-my-css-snippets
description: A simple Astro site to display CSS snippets.
---

As I think I've mentioned a few times already, I'm learning [Astro](https://astro.build/) and attempting to build random stuff with it just as an excuse to help practice and learn. With that in mind, during the Christmas break and between marathon sessions of Baldur's Gate 3, I built a little site I thought I'd share here on the blog. To be clear, this is nothing special, and doesn't come close to using all of the possible Astro features of course, but it was a useful coding exercise for myself and fun to build. 

The web platform as a whole has gotten dramatically better over the past decade, and CSS improvements are a big part of that. There is a *huge* amount of new CSS features I'm "kinda" aware of but don't really have much experience with. One of the things I do to help me in that regard is keep notes of CSS snippets I find myself using again and again so I don't have to Google for them. I use Microsoft OneNote to track these and just write it down in quick and dirty blocks of text like so:

```
Center vertically in div: 
align-content: center 
 
Center iFrame: 
display:block;margin:auto 

CSS for Borders: 
fieldset {  
     border-style:solid; 
     border-width:thin; 
} 

Table CSS for borders: 
table { 
    border-collapse: collapse; 
    border: 1px solid black; 
    width: 100%; 
    max-width: 500px; 
} 

th, td { 
    border: 1px solid black; 
    padding: 5px;  
} 

Two Cols: 
.twocol { 
    display: grid; 
    grid-template-columns: 33% 66%; 
} 
```

There isn't any additional information here as I know what I'm typically searching for and just do a quick copy, paste, and modify to suit whatever I'm building. 

I thought it might be interesting to take these tips and create a simple Astro site out of them. I'd use one Markdown source file per tip (which admittedly it perhaps overkill for some of these short snippets) and see if Astro could render the code *and* the output. 

If you don't actually care about how I built it, you can go ahead and navigate to <https://css-snippets.netlify.app/> and check it out. Here's a sample of one of the snippets:

<p>
<img src="https://static.raymondcamden.com/images/2026/01/css1.png" loading="lazy" alt="screenshot from site" class="imgborder imgcenter">
</p>

Alright, so here's how I built it.

## Source Markdown

As I mentioned, I wanted my content to be driven by simple Markdown files. For this, I made use of Astro's [content collections](https://docs.astro.build/en/guides/content-collections/) feature. First, I created a directory for my snippets called... `snippets`. In there I placed one Markdown file per snippet. Each file has a title, a set of tags, and the CSS snippet along with HTML to demonstrate it. Here's one for zebra striping table rows:

```
---
title: Zebra stripe a table
tags: ["tables"]
---

<style>
/* just to make it easier to see */
table {
    width: 500px;
}

tbody tr {
  background-color: #0a5b20;
}

tbody tr:nth-child(even) {
  background-color: #000000; 
}
</style>

<table>
    <thead>
    <tr>
        <td>Name</td>
        <td>Age</td>
    </tr>
    </thead>
    <tbody>
    <tr>
        <td>Luna</td>
        <td>13</td>
    </tr>
    <tr>
        <td>Elise</td>
        <td>15</td>
    </tr>
    <tr>
        <td>Pig</td>
        <td>10</td>
    </tr>
    <tr>
        <td>Zelda</td>
        <td>2</td>
    </tr>
    </tbody>
</table>
```

To let Astro know about the collection, I then added `content.config.ts` to the root of my `src` file and defined how it should find those Markdown files:

```js
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const snippets = defineCollection({ 
    loader: glob({pattern: '*.md', base:'./snippets/'}),
});

export const collections = { snippets };
```

This was enough to make it available to my home page.

## Rendering Snippets

First, I added a simple list to my home page. Right now this just lists everything, but I've only got a few snippets. 

```html
---
import { getCollection, getEntry } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
const allSnippets = await getCollection('snippets');
---

<BaseLayout pageTitle="Welcome">

<ul>
{allSnippets.map(snippet => (
	<li><a href=`snippets/${snippet.id}`>{snippet.data.title}</a></li>
))}
</ul>

</BaseLayout>
```

I won't bother sharing the layout file, but will note I made use of a nice little CSS framework, [Simple.css](https://simplecss.org/). 

Next, I added a template that would render one file per snippet. For this, I made an Astro file named `src/pages/snippets/[id].astro`. The `[id]` portion makes it dynamic. This page both handles the logic of "how do I know what routes to support" and "how do I render each one":

```html
---
import { Code } from 'astro:components';
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const snippets = await getCollection('snippets');
  return snippets.map(snippet => ({
    params: { id: snippet.id },
    props: { snippet },
  }));
}

const { snippet } = Astro.props;
---

<BaseLayout pageTitle={snippet.data.title}>

<p>
  Tags:
  {snippet.data.tags.map(tag => (
    <a href=`/tags/${tag}` class="tag">{tag} </a>
  ))}
</p>

<h3>Code</h3>

<Code code={snippet.body} lang="html" />

<h3>Output</h3>
<div set:html={snippet.body}></div>

</BaseLayout>
```

On top you can see where I get my collection and define the paths. I just use the Markdown's id value (which comes from the filename) and pass the content in as well. That's picked up in the template as `snippet` and then rendered both using Astro's native `Code` component for source code rendering and as raw HTML in a div. 

The last part of the site is similar - handling tag pages - but the logic is a bit more complex. First, I added `src/pages/tags/[id].astro`. Here's how I handled the logic:

```html
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { toTitleCase } from '../../utils/formatter.js';

export async function getStaticPaths() {
    const snippets = await getCollection('snippets');
    let tagPages = {};

    snippets.forEach((snippet) => {
        snippet.data.tags.forEach((tag) => {
            if (!tagPages[tag]) {
                tagPages[tag] = [];
            }
            tagPages[tag].push(snippet);
        });
    });

    return Object.keys(tagPages).map((tag) => ({
        params: { id: tag },
        props: { tag, pages:tagPages[tag] },
    }));
}

const { tag, pages } = Astro.props;
---

<BaseLayout pageTitle={toTitleCase(tag)}>

    <ul>
{pages.map(snippet => (
	<li><a href=`/snippets/${snippet.id}`>{snippet.data.title}</a></li>
))}
</ul>

</BaseLayout>
```

Basically, loop over my content, get unique tags, and create an array of pages for each tag. You can see an example of this here: <https://css-snippets.netlify.app/tags/tables/>

## Deployment

The last step was deploying it, and here I had multiple options. I chose Netlify as I host most of my sites there. [Webflow](https://webflow.com) supports Astro apps as well, but they are tied to existing web sites, not really standalone. Even though my GitHub repo has a bunch of Astro crap in it, I used the Netlify CLI to connect it and set it up. Netlify supports dynamic as well as static Astro apps, and you should check their [docs](https://docs.astro.build/en/guides/deploy/netlify/) for more information on that, but for me this was literally about a 5 minute process at most. "It just worked" which is the best thing a dev can say about something. As I shared above, you can browse the site here, <https://css-snippets.netlify.app/>, and if you want to see all of the source, you can find it here: <https://github.com/cfjedimaster/astro-tests/tree/main/css-snippets>

As always, let me know what you think, and I've got my next little Astro site planned already! :) 