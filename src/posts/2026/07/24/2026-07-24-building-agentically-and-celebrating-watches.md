---
layout: post
title: "Building Agentically and Celebrating Watches"
date: "2026-07-24T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_watch.jpg
permalink: /2026/07/24/building-agentically-and-celebrating-watches
description: How I used agentic development in Cursor to build an RSS watch aggregator.
---

I've shared past experiences with vibe coding and it's been a fascinating way to experiment and build on a small scale, but while it works well for POCs and other small utilities (I won't say 'toys' as I've built useful, if small, things now multiple times), it isn't really a "process" and not one that would work over a project with a longer time frame. This is where "Agentic Development" comes in. It's not always referred to as such and it's a huge topic, but let me give you my opinion on it and then demonstrate how I used it to build my newest project, [I Watch Watches](https://iwatchwatches.netlify.app/).

## Agentic Development in a Nutshell

Vibe coding is traditionally defined by a quick prompt passed to an AI agent. There may be a few rounds of changes afterwards, but the process is relatively simple and straightforward. Acceptable for a team of one and smaller projects, but not necessarily a "real" enterprise/larger environment. 

Agentic development integrates your AI agent or harness across an entire development process. Broadly speaking it entails:

* A planning stage where you may start with a prompt, but the agent doesn't write any code, but instead creates a plan. That plan is shared with you and you have the opportunity to adjust as you see fit. Add something, remove something, tweak something, this is where you and the agent agree on not just what is being done, but how. For developers who worry about AI taking your job, this is where your experience comes into play. I *always* validate that the plan makes sense and is building how I (or my organization) would build. 
* An implementation phase where the AI agent takes over - but even here the process can be far different from simple vibe coding. A good harness (like Cursor!) will let you define rules ("always do X") as well as skills ("when doing Y, here is how we do it") which lets you give firm guardrails for how code will be generated. This is especially useful in cases where you are working on a team within a large codebase and need to ensure you follow the established procedures for that project.
* Validation is also part of the process. A good agent/harness will not just build something but also validate that it actually worked. This could also be combined with creating tests to cover new features. 
* On top of validating the change worked, you can also add an additional level of verification, so for example, when a PR is submitted, you can use an agent (at Cursor this is Bugbot, but of course other options exist). 

That's a pretty high level overview, but the end result is that you've got AI agents working for you in a *much* more controlled, and reliable way. Honestly it's already changed how I do a lot of my work even in cases where I've written every bit of code. Having the agent there to help validate and check what I've done is like having a virtual intern who never complains. 

So, how about an example?

## Watches are my bling

I've been a huge fan of watches for pretty much all my life. I remember Swatches as a kid (I literally just signed up for a pre-order for a new one) and as I got older, I started collecting more and more watches and finding myself stopping at jewelry stores just to peruse their collections. I've got some cheap ones, some expensive ones, and some weird ones, but I love them all. 

This is my current favorite and I've got it on right now: [Memento Mori Rose](https://www.camdenwatchcompany.com/products/no253mementomorirosegold)

<p>
<img src="https://static.raymondcamden.com/images/2026/07/watch.png" loading="lazy" alt="Memento Mori" class="imgborder imgcenter">
</p>

Yes, this is a Camden watch, and the name initially caught my attention, but their collection is incredible (I have two). Even better, they literally check the timezone of where their watches are being shipped and will set the watch to the appropriate time. 

My typical way of discovering new watches is either seeing it on a person or seeing it on Facebook. Shockingly, if you Like a few watch ads, you end up seeing a lot more, and honestly I'm fine with that. (Facebook is where I first saw the Camden Watch company.) A few days ago it finally clicked that there's probably a decent amount of watch blogs out there, why not start aggregating them so I can see watches my own way - in my own app. 

## How I Started

So obviously I'm using Cursor (where I work, just as a reminder!) and it's got a dedicated [Plan mode](https://cursor.com/docs/agent/plan-mode). I switched to that and started off with this prompt:

{% mdwrap %}
I want to build an RSS aggregator dedicated to watches. This is for consumers, people who love watches. The stack should be:

Netlify for hosting
Netlify Database to store a table of feeds (name of site, url to site, rss url to site) and a table of feed items. That table drives the UI and is also used to recognized new versus existing feed items.
Astro 7.x (latest Astro)
Front end code should be minimal as it's just rendering database items, but if any code is needed, use vanilla JS or Alpine.js if the code gets complex (again, i tshouldn't)

the app right now will one public page, the main page showing feed items aggregated. generally an aggregator is a list of links with title, time posted, the blog name, and a brief synopsis. that would be ok, but im kinda open to other UX options - perhaps a Card list of items in rows left to right (to the edge of screen of course)

we also need a way to search + perhaps a filtering by tag system, although i checked two feeds and both didnt have categories or tags - so lets assume just search

i will provide (at the very end of this prompt) a JSON list of feeds to begin with. (adding, editing, and deleting feeds is a V2 issue)

design wise, i like dark, but lets support light/dark mode and store the preference in local storage so it persists

feeds are driven by a serverless function. Astro supports API routes and in theory i could build a cron job, but lets use a Netlify Serverless function that has a CRON schedule (once a day i think) is fine. that function gets all the feeds, gets each item, and uses the item url as a unique identifier in the database to recognize if it needs to add an item

i believe that's it. ask your follow up questions and also i want to see 2 to 3 design mocks for the front end before you begin
{% endmdwrap %}

My stack was Astro, on Netlify, using their built-in database support, which is not something I've actually used before. Note I gave direction on how aggregation should occur, specifically Netlify CRON-based serverless functions.

When I submitted this, I got a few follow-up questions including my mocks. At some point (honestly I can't find it now), I directed Cursor to *not* implement search for now. (If you visit the site today, search *does* work, but that was a second session which I'll turn into a second post.) I also said I wanted pagination with ten items per page, but I told Cursor to ensure that number was easily configurable. I'd say the follow-up questions and back and forth was probably about ten more minutes of work. When done, this plan was created. Note that the links below won't work as they are local to my project. They absolutely did work post creation which was super helpful to verify how things were done. 

{% mdwrap %}
# Build I Watch Watches

## Foundation and database
- Scaffold Astro 7 with the Netlify adapter and server rendering in [`astro.config.mjs`](astro.config.mjs); add Netlify Database, Drizzle beta packages, and RSS/Atom parsing dependencies.
- Define `feeds` and `feed_items` schemas in [`src/db/schema.ts`](src/db/schema.ts). Enforce uniqueness on feed URLs and article URLs, relate items to feeds, and index publication time for newest-first rendering.
- Add a generated migration under [`drizzle/`](drizzle/) that creates both tables and seeds the six supplied feeds. Netlify will apply hosted migrations during deploy; local setup will use the Netlify Database CLI.

## Daily feed ingestion
- Implement [`netlify/functions/update-feeds.ts`](netlify/functions/update-feeds.ts) using the modern Netlify scheduled-function API with `schedule: "@daily"`.
- Fetch the six feeds concurrently, parse both RSS and Atom, normalize title/link/date/synopsis, extract an image from common enclosure/media/content fields, and insert new items with an article-URL conflict guard.
- Isolate failures per feed with `Promise.allSettled`, log feed-level outcomes, and keep execution within the scheduled function’s 30-second limit.

## Public Astro page
- Define `ITEMS_PER_PAGE = 10` in [`src/config.ts`](src/config.ts) so the page size can be changed in one place after reviewing live data.
- Query feed items server-side in [`src/pages/index.astro`](src/pages/index.astro) using a validated `?page=` parameter, a total-count query, and database `LIMIT`/`OFFSET`; join source names and links, then render the first item on each page as the featured story and the other nine as a responsive magazine card grid matching Mock 2.
- Add semantic previous/next and numbered pagination controls, preserving a canonical first-page URL and returning an empty/not-found state for page numbers beyond the available results.
- Create small reusable Astro components under [`src/components/`](src/components/) for the header, featured article, and article cards, including graceful image fallbacks and semantic external links.
- Add global responsive styling in [`src/styles/global.css`](src/styles/global.css): refined serif headings, sans-serif metadata, dark graphite/gold default styling, a complete light theme, and mobile/tablet layouts.
- Add minimal vanilla JavaScript for a no-flash theme preference stored in `localStorage`. Render the search field as a clearly disabled/non-operational control ready for later Algolia wiring.

## Configuration and verification
- Configure Netlify build/function settings in [`netlify.toml`](netlify.toml), document local database initialization, migrations, feed refresh, and deployment in [`README.md`](README.md), and ensure [`.gitignore`](.gitignore) excludes `.netlify` and local artifacts.
- Verify Astro type checking/build, migration validity, pagination boundaries and configurable page size, both theme states, responsive layouts, empty database behavior, malformed feed handling, and idempotent duplicate ingestion.
{% endmdwrap %}

I told Cursor to execute and it went to work. When it was done, I got this:

{% mdwrap %}
## Assistant

I Watch Watches is built and passing `astro build` / `astro check`.

**What’s in place**
- Astro 7 SSR + Netlify adapter
- Netlify Database schema (`feeds`, `feed_items`) with migrations + seed of your 6 feeds
- Daily scheduled function at `netlify/functions/update-feeds.ts` (`@daily`), unique on article URL
- Mock 2 UI: featured story + card grid, light/dark via `localStorage`, disabled search placeholder
- Pagination at 10/page via `ITEMS_PER_PAGE` in [`src/config.ts`](src/config.ts)

**To run locally**
```bash
npx netlify database init --yes   # if not already set up
npm run db:migrate
npx netlify dev
curl http://localhost:8888/.netlify/functions/update-feeds
```

After deploy, trigger that function once so the first articles land before the daily cron.
{% endmdwrap %}

I love, love, love how it ended with clear instructions on how to test myself, specifically the Netlify CLI database stuff that I'd never used before. And I knew how to run a Netlify serverless function already, but the `curl` command was a handy reminder. (As an FYI, a CRON serverless function for Netlify *can* be called via HTTP locally, but not in production. That's handy!)

At this point I was able to test and it worked perfectly... almost. One blog's items were returning broken images. I asked Cursor about that:

```
it looks like the media for ablogtowatch all return broken images. investigate why
```

And here's the response. Honestly, I do not think I could have figured this out on my own:

{% mdwrap %}
Found it: aBlogtoWatch's image server uses referer-based hotlink protection.

The feed parsing is fine — we extract a valid URL like `https://www.ablogtowatch.com/wp-content/uploads/2026/07/CronusArt-RT06-SP-FI-768x346.jpg` from the `<img>` inside `content:encoded`. The URL itself works. What breaks is loading it from *our* page. Test results against that exact URL:

- No `Referer` header → **200**, image served
- Browser user agent, no referer → **200**
- Browser user agent + cross-site `Referer` (what a browser sends when our page embeds their image) → **403**

So the CDN in front of aBlogtoWatch rejects any image request whose referer isn't their own site. Hodinkee, Fratello, etc. don't do this, which is why only aBlogtoWatch cards show broken images.

Two ways to fix it:

1. **Add `referrerpolicy="no-referrer"` to the `<img>` tags** in `ArticleCard.astro` and `FeaturedArticle.astro`. The browser then omits the referer entirely, and their server returns 200 (confirmed above). One-line change, no infrastructure.
2. **Proxy through Netlify Image CDN** (`/.netlify/images?url=...` with their domain in the remote-images allowlist). More robust — also normalizes sizes and formats — but the fetch originates from Netlify with no referer anyway, so it solves the same problem with more moving parts.

Option 1 is the fix I'd make; want me to apply it?
{% endmdwrap %}

I selected the first option and let Cursor implement it. 

After this, I made a few more changes:

* Initially the footer just repeated the title. I had it link to my blog instead.
* Cursor can generate favicons, so I asked for three options and picked one. When I did, Cursor went ahead and wired it into the HTML.

## What's Next

I hope this made sense and I hope the power and flexibility of how I built it is clear. As I mentioned, I've already done improvements, but I want to cover that in the next blog post. You can find the site here, <https://iwatchwatches.netlify.app/>. I may spring for a real domain later. You can find the code here, <https://github.com/cfjedimaster/iwatchwatches>