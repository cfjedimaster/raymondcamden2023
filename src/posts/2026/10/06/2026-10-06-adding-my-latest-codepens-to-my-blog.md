---
layout: post
title: "Adding My Latest CodePens to My Blog"
date: "2026-10-06T18:00:00"
categories: ["development"]
tags: ["eleventy"]
banner_image: /images/banners/pen_paper.jpg
permalink: /2026/10/06/adding-my-latest-codepens-to-my-blog
description: Using the CodePen API to add them to my site.
---

I've been a fan of CodePen for many, many years, and it's one of the few services I spend money on to help support. A few months back, they released an entirely new version that dramatically improved the service (CodePen 2.0) and it just made me more happy I was a supporter. Just a few days ago they [announced more changes](https://codepen.io/changelog/2026-10-02) including a full [API](https://blog.codepen.io/docs/api/api-v2/). I thought it would be fun to add a display of my recent pens. Yes, I thought that would be fun, because that's the kind of nerd I am. 

## Adding Dynamic Content to a SSG

It has been a *very* long time since I blogged about anything related to static site generators. There's no particular reason for that, but I figure this is a good time to bring up the topic again, specifically about how static sites can include dynamic content. There's two main paths to this.

The first is getting content at build time. For Eleventy, this is done with data files that are executed at build time and can return ad hoc data for use in your templates. As an example of that, the list of books I'm reading on my [Now](https://www.raymondcamden.com/now) page are gathered via a GraphQL query:

```js
const HARDCOVER_BOOKS = process.env.HARDCOVER_BOOKS;

export default async function() {

    if(process.env.SKIP_REMOTE_DATA) return [];
    if(!HARDCOVER_BOOKS) return [];
    let req;

    let body = `
    {
    user_books(
        where: {user_id: {_eq: 65213}, status_id: {_eq: 2}}
    ) {
        book {
            title
            image {
                url
            }
            contributions {
                author {
                    name
                }
            }
        }
    }
    }
    `.trim();

    try {
        req = await fetch('https://api.hardcover.app/v1/graphql', {
            method:'POST', 
            headers: {
                'authorization':HARDCOVER_BOOKS,
                'Content-Type':'application/json'
            },
            body:JSON.stringify({query:body})
        });
    } catch (e) {
        console.log('Hardcover API error', e);
        return [];
    }

    let data = (await req.json()).data.user_books.map(ob => ob.book);
    /* normalize authors */
    data = data.map(b => {
    b.authors = b.contributions.reduce((list,c) => {
        if(c.author) list.push(c.author.name);
        return list;
        },[]);
        return b;
    });

    return data;

};
```

The list of books returned there can then be rendered in my page template:

{% raw %}
```html
<div class="films">
{% for book in hardcover_books  %}
  <div class="film">
  {% if book.image != null %}
  <img src="https://res.cloudinary.com/raymondcamden/image/fetch/c_fit,w_216/{{book.image.url}}" alt="Cover of {{ book.title }}">
  {% else  %}
  <img src="https://res.cloudinary.com/raymondcamden/image/fetch/c_fit,w_216/https://static.raymondcamden.com/images/no_cover_available.jpg" alt="No Cover Available">
  {% endif %}
  "{{ book.title  }}" by {{ book.authors | join: ', ' }}
  </div>
{% endfor %}
</div>
```
{% endraw %}

As you can tell by the class names, I use the same logic for the films I've watched. In both cases, the data doesn't change terribly often so I'm ok with it being a bit out of date. I also publish *something* to the blog every week so it's never too far behind.

That's option 1. Option 2 is to use JavaScript and an API. That ensures the content is always 100% up to date but it has other trade offs. Some APIs don't have CORS support and APIs requiring keys that can't be in client-side code. In that case, I simply use a serverless function which Netlify makes pretty simple.

## Getting my Pens

Ok, so given that I've decided to fetch my CodePens via JavaScript on the front-end via a serverless function, I first created a key in CodePen's settings, added to my Netlify configuration, and then wrote a quick and dirty function:

```ts
import { Context } from '@netlify/functions'

export default async (request: Request, context: Context) => {
  try {

    const CP_KEY = process.env.CODEPEN_KEY;

    const req = await fetch('https://api.codepen.io/v2/pens?sort=updated&direction=desc&access=Public&template=false&per_page=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CP_KEY}`,
        'Content-Type': 'application/json'
      }});
    
    let data = await req.json();

    // now lets do some mapping 
    data = data.map((pen: any) => {
      return {
        title: pen.title,
        url: pen.urls.editor,
        created_at: pen.created_at,
        updated_at: pen.updated_at,
        screenshot: pen.screenshot_urls.small
      }
    });

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return new Response(error.toString(), {
      status: 500,
    })
  }
}
```

I'm filtering by public pens and pens that aren't templates, sorted by last updated, and capping the list to 10. Then I map the data to a *much* smaller set of information as I only need part of what's returned in my front end. 

Then all I needed to do was add it to my [stuff](/stuff) page:

```js
let $pens = document.querySelector('#pens');

let pens = await fetch('/.netlify/functions/get-codepens').then(r => r.json());

pens.forEach(p => {
	let pen = document.createElement('a');
	pen.className = 'penBox';
	pen.href = p.url;
	pen.target = '_blank';
	pen.rel = 'noopener noreferrer';

	let screenshot = document.createElement('img');
	screenshot.src = p.screenshot;
	screenshot.alt = '';
	screenshot.loading = 'lazy';

	let title = document.createElement('h3');
	title.textContent = p.title;

	pen.append(screenshot, title);
	$pens.append(pen);
});
```

Sweet. Of course, I think I'm the only person who visits either my [stuff](/stuff) or [now](/now) pages, but they make me happy!