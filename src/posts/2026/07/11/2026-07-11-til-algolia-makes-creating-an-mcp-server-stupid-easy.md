---
layout: post
title: "TIL - Algolia Makes Creating an MCP Server Stupid Easy"
date: "2026-07-11T18:00:00"
categories: ["development"]
tags: ["algolia","generative ai"]
banner_image: /images/banners/mcp.png
permalink: /2026/07/11/til-algolia-makes-creating-an-mcp-server-stupid-easy
description: Algolia makes it incredibly easy to turn your search data into an MCP server.
---

A few days ago I was chatting with [Chuck Meyer](https://www.linkedin.com/in/chuckm/) (devrel for [Algolia](https://algolia.com)) and I casually mentioned, "It sure would be cool if Algolia had an easy way to turn my search index into an MCP server." He promptly responded, "Of course, you complete and utter dufus, which is why we already *have* that feature." (Not an exact quote.) This is *exactly* the kind of thing I love to hear. I've been using Algolia for my [search](/search) here for *years* and honestly have not paid much attention to the new additions on their platform. That was a mistake. Let me show you how dang easy they made this.

## First - what's Algolia?

Chuck, forgive me, I'm going to do a horrible job summarizing your entire company into a few sentences. [Algolia](https://algolia.com) provides search as a service. You create an index (or multiple) that represent what you want to search, whether it be textual content (like this blog) or ecommerce products (perhaps Dungeon Crawler Carl merch). Via multiple ways, you populate this index and keep it up to date (when you create/edit/delete content locally, you make a corresponding edit to your index). 

Once the index is created (and tuned, you can do a *lot* to tune how your index works), you can then search it. My [search](/search) is just one simple example, but it's one JavaScript library and a few lines of code. 

That's basically it. Well no, there's a *lot* more, but at least for my implementation here, that's basically it. 

## Second - what's MCP?

MCP boils down to "if a person is needing to do some kind of action, an MCP server can tell the AI agent, hey, I handle that, just hand it off to me!" At Webflow, for example (sorry, you lay me off you don't get links), the MCP server handled API calls to your Webflow site and integrated with Cursor, Claude, and other agents. If you asked something like, "What Webflow sites do I have", because the Webflow MCP server was added to your agent, and authenticated, it could handle doing the appropriate API calls and returning it such that your agent could document the result. 

For a documentation site, an MCP server can help you use free form questions about the docs and get responses in your AI agent. 

## Third - Ok, now what?

To enable it in Algolia, you log in to your dashboard and select the appropriate application (an application can have one or more indexes), and then click Generate AI in the navigation. In the sub nav, you'll have a section titled "MCP Servers / Public", and then in that UI, just click the "Create Public MCP Server" button.

On that UI, you can select what indexes and tools to enable. I've only got one "real" index, so I picked that and gave my server an incredibly useful and informative name:

<p>
<img src="https://static.raymondcamden.com/images/2026/07/alg1.png" loading="lazy" alt="Algolia MCP Settings" class="imgborder imgcenter">
</p>

On the next page, you can select which tools you want enabled. I picked everything, but I'm not using the Recommendation product so I probably should turn that off.

<p>
<img src="https://static.raymondcamden.com/images/2026/07/alg2.png" loading="lazy" alt="Algolia MCP Settings - Tool selection" class="imgborder imgcenter">
</p>

The end result is the URL to your MCP server. Mine is https://0FJBPN4K5D.algolia.net/mcp/1/vMOWpYc9RK6FuHnWxZcoyg/mcp. At this point, you follow your "usual procedure" on adding MCP to your tools. I tested in a few, including Cursor of course.

## Actually using it...

Two big use cases come to mind for this:

* Externally, this creates a *very* powerful way for users to interact with your documentation. Most documentation for technical products already include this, including [Algolia's docs](https://www.algolia.com/doc) of course. But the target user here is your audience.
* Internally, this could be very powerful. As a content writer, I can already use the existing Algolia search as a quick way to see, "did I blog about X", but with my MCP server, I can ask deeper questions, and even use it to help create *new* content.

I did some testing related to both of these scenarios, not terribly deep, but enough to be pretty impressed. 

In `agy`, the Antigravity CLI (Google Gemini's models), I asked:

<blockquote>
search Ray's mcp server for his opinion on React
</blockquote>

And the response was near perfect:

{% mdwrap %}
Based on the search results from Ray's MCP server (which indexes his blog posts), Raymond Camden's view of React has transitioned from passive avoidance to active experimentation, and finally to deliberate
  exclusion.

Here is a summary of Ray's opinion on React:

### 1. Historical Apprehension & Vue/Alpine Preference (Pre-2025)

• Early Thoughts (2015): Ray attended a React session by Brian Holt at Fluent Conf in 2015. While he noted that writing ES6 classes with React felt "pretty freaking cool," he did not end up adopting it.
• "Not for Me" (2023): In a September 2023 post, Ray shared Josh Collinsworth's article "Things you forgot (or never knew) because of React", commenting that React had always felt like a "good framework
that's not for me". He preferred Vue.js for full web apps and later Alpine.js for lightweight interactivity.

### 2. The "Let's Learn React" Experiment (March–May 2025)

• Giving it a "Fair Shake" (March 2025): Ray attempted to learn the framework during his Code Break livestream series, in a session titled "I Don't like React. Let's Learn React!" He clarified: "To be clear,
it isn't that I dislike React, it's just that every time I've looked at the code, it just didn't gel with me."
• The Struggle and Ditching (May 2025): The learning process proved to be "painful" and did not go well. By May 2025, Ray decided to stop, stating: "I'm ditching any further exploration of React for now, but
instead turning my attention to something I think is really fun - building desktop apps."

### 3. Banning React & "Vanilla FTW" (Late 2025)

• Running Joke with AI (July–September 2025): Ray began specifically instructing AI coding tools to avoid React altogether: "We are only using HTML, CSS, and JavaScript. No libraries. No React. No Preact.
Don't even say the word React. Just vanilla JavaScript." He noted that AI assistants "really, really, really want" to use React, prompting him to actively decline it.
• My Tech Stack (December 2025): In his "My Tech Stack (2025)" post, Ray summarized: "Vanilla JavaScript FTW! I'll still go to Alpine.js for more complex needs, but I don't use Vue anymore and I definitely
don't use React if I can help it."

### Summary Conclusion

Ray's ultimate opinion is that React is a popular and powerful framework but is not for him. He values simplicity, lightweight payloads, and vanilla web standards, preferring to build with Vanilla
JavaScript, Alpine.js, Eleventy, and Astro.
{% endmdwrap %}

"deliberate exclusion" is the name of my Goth band.

In Cursor, I added the MCP server via the app settings and took the approach of the content creator. I asked:

<blockquote>
using Ray's MCP server, what do you recommend for a new blog post?
</blockquote>

And here's what Cursor and my MCP server came back with:

{% mdwrap %}
Based on Ray's MCP server search data, here are my top recommendations for his next blog post — ranked by how naturally they follow what he's already writing.

## 1. **"Automating Blog Reviews with Cursor Hooks"** (strongest pick)

This is the most obvious sequel. In [Turning my Cursor Performance Work into a Repeatable Skill](https://www.raymondcamden.com/2026/07/08/turning-cursor-performance-work-repeatable-skill), he explicitly says he *plans to look into automations with Cursor later* and that he initially considered hooks before choosing manual skills.

A post that walks through:
- When hooks beat skills (and vice versa)
- Wiring `/precheck` or performance review to run on commit/save
- What he learned from the manual-first approach

…would close a loop he's already teed up across his last three posts.

---

## 2. **"I Built an MCP Server for My Blog"**

This fits his current arc and hasn't been written yet. He's covered Algolia extensively ([Adding Recommendations](https://www.raymondcamden.com/2024/05/27/adding-recommendations-to-my-blog-with-algolia), [PDF search](https://www.raymondcamden.com/2023/07/12/using-pdfs-with-algolia-and-adobe-pdf-extract-api), [BoxLang integration](https://www.raymondcamden.com/2025/09/15/integrating-algolia-with-boxlang)), and he's now at Cursor helping with AI adoption.

A post on exposing his blog index via MCP would be timely and meta — especially showing real queries like "what should I write next?" or "what has Ray covered on Eleventy?" He could even note that trending recommendations aren't configured yet (the MCP server's `trending-items` and `trending-facets` models return index errors), which sets up a natural follow-up.

---

## 3. **"My Complete Cursor Skills Workflow for Blogging"**

He's building a small skill ecosystem:

| Change type | Skill |
|---|---|
| New blog post | `/prepublish` |
| Eleventy / Netlify / engine | `/precheck` |
| Performance review | web-perf skill |

A single "here's my full workflow" post would tie together `/prepublish`, `/precheck`, and the performance skill into one narrative. That's very aligned with his new role and gives readers a concrete adoption story, not just feature demos.

---

## 4. **"Making My Blog AI-Friendly (and What It Cost Me)"**

His [performance review post](https://www.raymondcamden.com/2026/07/07/asking-cursor-to-review-my-blog-for-performance) already touches this — Markdown copies, content-negotiation edge function, unintended build-time cost from globbing 6k+ files. A dedicated post could go deeper:
- Why he added `.md` endpoints and content negotiation
- The performance tradeoffs Cursor found
- How MCP/search fits into the "AI can read my blog" story

---

## 5. **Practical follow-ups on recent threads**

| Thread | Idea |
|---|---|
| CSS accessibility series | Part 3: keyboard testing with real screen readers, or applying the pattern to checkboxes |
| [Use AI to not use AI](https://www.raymondcamden.com/2026/06/22/use-ai-to-not-use-ai-as-much) | When to reach for AI vs. write it yourself — a decision framework |
| [Links For You (7/5/26)](https://www.raymondcamden.com/2026/07/05/links-for-you-7526) | Another links roundup (~2 week cadence; he's due around now) |
| Transformers.js (mentioned Jul 2025) | Eleventy build-time related posts without Algolia API calls |

---

## My pick

**#1 (Cursor Hooks)** if he wants to continue the Cursor-on-my-blog series.

**#2 (MCP Server)** if he wants something fresh that showcases his new role and ties together Algolia + AI tooling in one post readers can actually try.

Both build directly on what the MCP index shows as his hottest recent topics: **generative AI**, **Eleventy**, and **Cursor workflows**.
{% endmdwrap %}

In case you just skimmed, it literally suggested, as the second suggestion, the blog post I'm right now. Great minds, right?

## TLDR

You can add an MCP server to Algolia indexes in 5 minutes. Actually less than that - it took me longer to remember what 2FA app I used with their dashboard. 

Oh, and like most of Algolia's products, this falls into their [Build](https://www.algolia.com/pricing) tier which is free up to a certain amount of usage, which I've never hit. I've told Chuck before they are too damn generous with their free tier and thankfully they've ignored me. 

Let me know what you think - are you using this? Are you using Algolia at all? Leave me a comment below as I'd love to hear from some folks who may already be using this. 