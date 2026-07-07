---
layout: post
title: "Asking Cursor to Review My Blog for Performance"
date: "2026-07-07T18:00:00"
categories: ["Development"]
tags: ["generative ai", "eleventy"]
banner_image: /images/banners/running-cat.jpg
permalink: /2026/07/07/asking-cursor-to-review-my-blog-for-performance
description: How I asked Cursor to review my blog for performance and what it found.
---

Last week I decided to try something interesting. I opened my blog up in Cursor and asked for a basic performance review. That seems like a no-brainer, but keep in mind, my [blog's source code](https://github.com/cfjedimaster/raymondcamden2023) clocks in at near **seven thousand** files (ignoring `node_modules` of course), so this wasn't some small request.

My blog is built with the [Eleventy](https://www.11ty.dev/) static site generator. It's a mix of JavaScript and Markdown primarily, with a *huge* portion of the codebase being Markdown and not 'code' per se, but me rambling on about cats and Star Wars. There's also Liquid templates which are parsed into HTML by a JavaScript library. But that doesn't quite tell the whole story. 

In Eleventy, when converting my Markdown into HTML, it also applies the Liquid template syntax to Markdown which means my blog posts can actually be dynamic, at build time anyway. This impacts how fast the site builds in ways I can completely forget about down the road. 

This is why I let Cursor look over the entire code base instead of ignoring my Markdown ([Cursor docs on ignore files](https://cursor.com/docs/reference/ignore-file)), and I'm glad I did. I'll share the complete report at the end of this post, but let me talk about the highlights. 

## RSS Parsing and a dead Mastodon server

The biggest fix Cursor discovered concerned code I had to work with, and render, Mastodon posts. I've got a shortcode that given a server and username will find the last post via the RSS feed generated for the account. I use another shortcode that renders the post into HTML.

Cursor discovered I had multiple calls out to `botsin.space`, a Mastodon server that was built to target bots and unfortunately had to be shut down. I had multiple blog posts trying to get content from that server. The code, which made use [rss-parser](https://www.npmjs.com/package/rss-parser), would get a quick failure but was keeping an HTTP socket open until it timed out, roughly 70 seconds later. 

To be clear, the 'bug' here was in my implementation, not the RSS library. The fix was pretty simple. Going from:

```js
import Parser from 'rss-parser';

const parser = new Parser();
```

To:

```js
import https from 'https';
import Parser from 'rss-parser';

const parser = new Parser({
  requestOptions: {
    timeout: 5000,
    agent: new https.Agent({ keepAlive: false }),
  },
});
```

This alone helped, but I also found instances in my Markdown where I was calling out to botsin.space and replaced it with mastodon.social (where I moved my bots). 

## Trying to be AI friendly had an unintended consequence

A few months back I made a change to my blog to be more AI friendly. That involved two steps:

* For every post, I now have a copy of the Markdown version. So for example, this <https://www.raymondcamden.com/2026/07/06/my-new-role-helping-ai-adoption-at-cursor> goes to HTML, and you can go to <https://www.raymondcamden.com/2026/07/06/my-new-role-helping-ai-adoption-at-cursor/index.md> for the Markdown
* I used a Netlify Edge serverless function to sniff for a content request that prefers plain text or Markdown, what an AI agent would send, and redirects to that automatically. You can see that code here: <https://github.com/cfjedimaster/raymondcamden2023/blob/main/netlify/edge-functions/content-negotiation.ts>

To enable the Markdown copy, my `eleventy.config.js` uses an event handler for builds:

```js
eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const inputDir = dir.input;   
    const outputDir = dir.output; 

    // blog posts only
    const mdFiles = glob.sync("posts/**/*.md", {
        cwd: inputDir,
        ignore: ["node_modules/**"],
    });

    for (const file of mdFiles) {
        const srcPath = path.join(inputDir, file);
        /*
        My input file looks like so:
        src/posts/2026/03/04/2026-03-04-dyanimically-adjusting-image-text-for-contrast.md
        I need to save to

        outputdir/2026/03/04/dynamically etc
        */
        let newFile = file.replace('posts', '');
        newFile = newFile.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}-/,'');
        newFile = newFile.replace('.md','/index.md');

        const destPath = path.join(outputDir, newFile);


        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
    }
});
```

The important bit is the glob. When I run my blog locally, I have an `.eleventyignore` file which ignores blog posts from 2003 to 2024 or so, basically 90% of my blog posts (I [blogged a lot more](/stats) in the old days). However, my glob wasn't using that and every change resulted in 6k+ files being copied. Locally that meant every change I made while writing a post would take about 3 seconds to process. That's not bad in theory, but I tend to write, check the HTML, edit, etc, quickly, and I absolutely noticed times when I'd have to reload again because I reloaded too quickly the first time. 

For the fix, I went back to Cursor and simply asked for help and the response was perfect:

{% callout %}
The simplest fix is to stop globbing and copy only posts Eleventy actually built. The eleventy.after event gives you a results array of everything Eleventy processed, which already respects all ignore sources.
{% endcallout %}

I missed this in Eleventy's [docs on the event](https://www.11ty.dev/docs/events/#eleventy-after) that's 100% on me. I let Cursor update the code:

```js
eleventyConfig.on("eleventy.after", async ({ directories, results }) => {
    const inputDir = directories.input;
    const outputDir = directories.output;

    // Only copy posts Eleventy actually built (respects .eleventyignore)
    const postResults = results.filter((r) => {
        const rel = path.relative(inputDir, r.inputPath);
        return rel.startsWith(`posts${path.sep}`) && rel.endsWith('.md');
    });

    // rest of event...
```

## Bypassing API calls locally

One last thing it suggested that I implemented involved my `_data` files. These files use remote APIs to fetch data for my site, most of which you can see on my [Now](/now) page. I had code to look for a local run, or a lack of an environment variable for a key. My code though was a bit of a hack, like looking for `/home/ray`, and that failed on new machines where my local username didn't match. It didn't dramatically impact my builds, but Cursor pointing this out made me build a nicer solution - which was just to look for an environment variable instead, one I include in my npm scripts now:

```json
"dev2": "SKIP_REMOTE_DATA=1 eleventy --serve --quiet",
```

(The use of 'dev2' is another story and related to a bug in the Netlify CLI.)

## Wrap Up

Ok, I work at Cursor, I'm biased, but of course other tools could create similar results. I'm just impressed by how *deep* Cursor looked into my code and found things that I never would have realized. As I write this and save, I'm seeing build times of 0.33 seconds or so, which is freaking great. My "full" builds aren't necessarily faster, but that's fine. (Netlify and Eleventy both perform incredibly well with a typical site build of less than four minutes.) 

Here's the complete initial report Cursor created.

{% mdwrap %}
{% raw %}
site_performance_recommendations.md
Open File
View Rendered
# Site Performance Recommendations

Analysis of the `raymondcamden2023` Eleventy build (June 30, 2026).

## Summary

Local builds report **~4–5 seconds** of actual Eleventy work, but the full process takes **~72 seconds**. Most of that gap is not template rendering — it is the Node process waiting on open I/O handles after Eleventy finishes.

| Metric | Value |
|--------|-------|
| Active posts built (2023+) | ~463 |
| Total markdown files on disk | 6,784 |
| Files written per build | ~571 |
| Files in `_site` (including markdown copies) | ~13,785 |
| Eleventy-reported build time | ~4–5s |
| Actual wall-clock build time | ~72s |

---

## 1. Biggest Win: Fix the ~67s Post-Build Hang

After Eleventy prints `Wrote 571 files`, the Node process sits idle for about **67 more seconds** before exiting. Profiling shows it waiting in the event loop on open I/O handles.

### Root cause

The `lasttoot` shortcode in `config/shortcodes/index.js` uses `rss-parser` without disabling HTTP keep-alive. A failing fetch to `botsin.space` (visible in build logs) leaves a socket open until it times out (~70s).

This post still runs the shortcode at build time:

```
src/posts/2023/03/17/2023-03-17-another-week-another-mastodon-bot-random-album-cover.md
```

```liquid
{% capture "lasttoot_rac" %}
{% lasttoot "botsin.space", "randomalbumcover" %}
{% endcapture %}

{% stoot "botsin.space", lasttoot_rac %}
```

### Verification

- A single failed `botsin.space` RSS fetch via `rss-parser` fails in ~0.8s, but the process does not exit for ~71s.
- Adding `keepAlive: false` drops total time to **under 1 second**.
- Successful fetches to other hosts (e.g. Letterboxd) exit in ~0.3s with no hang.

### Recommended fix

Update `lasttoot` (and the `_data` RSS files) to disable keep-alive:

```js
import https from 'https';
import Parser from 'rss-parser';

const parser = new Parser({
  requestOptions: {
    timeout: 5000,
    agent: new https.Agent({ keepAlive: false }),
  },
});
```

Alternatively, migrate `lasttoot` to `@11ty/eleventy-fetch` (as `stoot` already does in `config/shortcodes/stoot.js`).

### Expected impact

Full builds should drop from **~72s to ~5s** locally, with similar improvement on Netlify.

---

## 2. High Impact: Stop Copying 6,784 Markdown Files After Every Build

The `eleventy.after` hook in `eleventy.config.js` copies **all** posts to `_site`, including years ignored by `.eleventyignore`:

```js
eleventyConfig.on("eleventy.after", async ({ dir }) => {
  const mdFiles = glob.sync("posts/**/*.md", {
    cwd: inputDir,
    ignore: ["node_modules/**"],
  });

  for (const file of mdFiles) {
    // ... copies every file ...
    fs.copyFileSync(srcPath, destPath);
  }
});
```

- **6,784** markdown files exist on disk
- Only **~463** are actively built (2023+)
- `.eleventyignore` excludes 2000–2022 but the after-hook ignores that
- `_site` grows to **~13,785** files because of this

### Recommended fix

- Respect the same ignore rules as `.eleventyignore`
- Only copy files Eleventy actually built
- Or move archived posts out of `src/posts/` entirely

### Expected impact

- ~1s saved on the copy loop itself
- Much faster deploy uploads
- Smaller `_site` output

---

## 3. Medium Impact: Expensive Templates

### `/all` page — O(years × posts) loop

File: `src/misc/all.liquid`

```liquid
{% for year in (firstYear..thisYear) reversed %}
  {% for post in posts %}
    {% if postYear == year %}
```

This nested loop iterates all posts for every year. A prior benchmark noted **~3.6s+** for this page alone.

**Fix:** Pre-group posts by year in a collection or JS data file and iterate once.

### `algolia_full.liquid` — all posts, full content

File: `src/misc/algolia_full.liquid`

Runs `templateContent | algExcerpt` across every post in one JSON file. The regex work on full rendered HTML adds up across ~463 posts.

**Fix:** Generate this only in CI/deploy, or only when search index content changes. (`algolia_new.liquid` already limits to 5 posts for deploy hooks.)

### Tag pagination generates many pages

Files: `src/tags.liquid`, `src/tag_feeds.liquid`

Both paginate over **all collections** (not just tags), generating two pages per collection entry.

**Fix:** Use an explicit tag list instead of `collections` as pagination data.

---

## 4. Medium Impact: Build-Time Network Calls

| Source | Issue |
|--------|--------|
| `src/_data/medium.js` | RSS fetch every build |
| `src/_data/letterboxd_films.js` | RSS fetch every build |
| `src/_data/hardcover_books.js` | GraphQL fetch when `HARDCOVER_BOOKS` env var is set |
| `lasttoot` / `stoot` in ~4 posts | Mastodon API/RSS at build time |

### Notes

- `untappd_beers.js` already short-circuits locally when `ELEVENTY_ROOT` includes `/raymondcamden2023`
- `medium.js` and `letterboxd_films.js` only skip on `/home/ray` — inconsistent with local dev on other paths
- `/bots` page (`src/misc/bots.md`) already loads toots **client-side**; build-time `stoot`/`lasttoot` embeds in old posts may not be worth the complexity

### Recommended fix

- Add a consistent `SKIP_REMOTE_DATA` env flag (or broaden the local path short-circuit)
- Use `@11ty/eleventy-fetch` with disk cache for all remote data
- Consider replacing build-time Mastodon embeds with static IDs or client-side loading

---

## 5. Lower Impact / Polish

### `htmlmin` transform in CI

In `eleventy.config.js`, HTML minification runs on every `.html` file when `process.env.CI` is set. Netlify gzip/brotli may make this redundant.

### Eleventy incremental mode

Use `eleventy --incremental` during dev when editing a single post.

### Netlify build cache

Cache `node_modules` and `.cache/eleventy-fetch-*` between deploys (Eleventy Fetch cache already exists under `.cache/`).

### Comment includes

5,111 legacy comment `.inc` files under `src/_includes/comments/`. The `hasAnyComments` / `commentInclude` shortcodes do sync `fs.existsSync` on every post via `src/_includes/mydisqus.liquid`. Minor cost, but could precompute a Set at build start.

### `@rknightuk/eleventy-plugin-post-graph`

Bundles its own Eleventy 2.x copy — housekeeping item, not a major speed issue. Only used on `src/misc/postgraph.md`.

### Archived posts on disk

6,784 markdown files remain in `src/posts/` even though 2000–2022 are in `.eleventyignore`. Moving archives out of the input tree reduces repo noise and glob scan scope.

---

## Suggested Priority

1. **Fix `lasttoot` / `rss-parser` keep-alive** (~67s saved — do this first)
2. **Limit the `eleventy.after` markdown copy** to active posts only
3. **Optimize `/all` and `algolia_full.liquid`**
4. **Add a consistent skip flag** for remote `_data` fetches in dev
5. **Enable incremental builds + Netlify caching**

---

## Posts Still Using Build-Time Mastodon Shortcodes

These active (2023+) posts invoke `stoot` and/or `lasttoot` at build time:

- `src/posts/2024/10/23/2024-10-23-getting-and-displaying-a-mostodon-post-in-client-side-javascript.md`
- `src/posts/2023/08/14/2023-08-14-building-a-mastodon-bot-with-cloudflare-workers.md`
- `src/posts/2023/03/17/2023-03-17-another-week-another-mastodon-bot-random-album-cover.md` (includes failing `lasttoot` to botsin.space)
- `src/posts/2023/02/17/2023-02-17-links-for-you.md`
- `src/posts/2023/02/15/2023-02-15-building-a-mastodon-bot-listing-page-in-eleventy.md` (examples in `{% raw %}` blocks; not executed)

---

## Current Stack (for context)

- **Site generator:** Eleventy (11ty) v3
- **Hosting:** Netlify
- **Content:** Markdown posts under `src/posts/`
- **Templates:** Liquid, EJS, Nunjucks
- **Output:** Static HTML in `_site/`
{% endraw %}
{% endmdwrap %}

Photo by <a href="https://unsplash.com/@tschannik?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Yannik Zimmermann</a> on <a href="https://unsplash.com/photos/a-cat-that-is-walking-across-a-street-aT432COAiFs?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>