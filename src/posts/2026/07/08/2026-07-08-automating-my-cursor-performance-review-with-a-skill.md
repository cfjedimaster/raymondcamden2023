---
layout: post
title: "Turning my Cursor Performance Work into a Repeatable Skill"
date: "2026-07-08T18:00:00"
categories: ["Development"]
tags: ["generative ai", "eleventy"]
banner_image: /images/banners/robots.jpg
permalink: /2026/07/08/turning-cursor-performance-work-repeatable-skill
description: How I went from a one-shot review to a repeatable skill in Cursor
---

Yesterday, I wrote about using Cursor to [review my blog for performance](https://www.raymondcamden.com/2026/07/07/asking-cursor-to-review-my-blog-for-performance). Cursor (and again, for full disclosure I work here now ;) did a *dang* good job of finding performance issues with my site, handling the huge size and various languages, platforms, and so forth. As I said, it worked well, but I wanted to look into making this more of a repeatable process. 

I'm saying "repeatable", not "automated", on purpose here. I *can* automate the process, but a full performance review feels much more like something I should run when I think it makes sense, for example, when I know I've tweaked my blog at the 'code' level versus writing cat-related blogs. I do plan to look into automations with Cursor later, but for now, what I've done is something I'll run when I think it makes the most sense. 

## What's a skill again?

At the simplest level, a skill simply gives direction to an AI agent on how to perform a task. It also describes itself in such a way that your AI agent knows when to invoke the skill. This is done in a simple Markdown file that can, and probably should, be checked into your repo. 

So for example, if I had a skill related to checking the health of my cat, my AI agent should be smart enough to recognize when it should use the skill based on my prompt. So for example:

* I'm worried about Donut's health, anything I can do?
* Sir Fluffalot is doing fine, but what steps can I do to ensure she's healthy?

That's a pretty quick summary but you get the idea. Where the benefit comes in is helping document and describe a process that you need to run again and again, or a process your organization/team/herd of cats needs to standardize on and wants to be consistent. 

## Turning my performance review into a skill

When I first did my performance review, I kept the prompt pretty simple. I did this on another machine so I don't have it in front of me, but I believe it was literally as simple as:

<blockquote>
Review this site and tell me of any performance improvements you can find.
</blockquote>

That generated the review I shared in my [last post](https://www.raymondcamden.com/2026/07/07/asking-cursor-to-review-my-blog-for-performance) and guided my development. 

Cursor provides a few ways to make skills:

* Since it's just a Markdown file, you can just make a file, old school like we did in the old days. 
* Cursor has a skill to make skills: `/create-skill i need a skill to help with cat care`
* You can also just ask Cursor to do this in a prompt.

The last option is what I did, asking Cursor to make a skill like my [`prepublish`](https://github.com/cfjedimaster/raymondcamden2023/blob/main/.agents/skills/prepublish/SKILL.md) one. 

Cursor responded with:

{% mdwrap %}
Created a **`precheck`** skill as the engine-code counterpart to `prepublish`. It lives in both skill directories, same as your blog skill:

- `.claude/skills/precheck/SKILL.md`
- `.agents/skills/precheck/SKILL.md`

## How to use it

Before committing engine changes, run:

```
/precheck
```

Or ask something like “review my engine changes before I commit.”

## What it does

1. **Finds scope** — Uses `git diff` / `git status` and filters to engine paths (`eleventy.config.js`, `config/`, `src/_data/`, `netlify/`, `scripts/`, Algolia/search templates, client JS). Ignores `src/posts/`.
2. **Smoke test** — Runs `SKIP_REMOTE_DATA=1 npx eleventy` when config, data, or search templates changed.
3. **Reviews** — Groups findings as Critical / Warning / Note, focused on build breaks, deploy/runtime issues, performance (collection loops, async shortcodes, caching), and Algolia/search compatibility.
4. **Applies fixes only on request** — Same handoff pattern as `prepublish`; you commit when ready.

## Your workflow

| Change type | Skill |
|-------------|-------|
| New blog post | `/prepublish` |
| Eleventy, Netlify, JS/TS engine | `/precheck` |

No hooks involved — you invoke it manually when you want it.

If you want the description tuned so it auto-suggests itself when you say “commit my eleventy changes,” I can adjust the frontmatter trigger phrases.
{% endmdwrap %}

A note on the last paragraph of the response. I had started my conversation with Cursor initially thinking I was going to automate it with a hook, but changed my mind. That's why it's mentioned here. The last bit "frontmatter trigger phrases" goes back to what I said earlier - a skill is both a guide on how to do something as well as a description of when it should be run. 

The result was pretty astounding I think, specifically in how Cursor recognized the "engine" parts of my blog versus the "content" bits. It did this well in the one off so I'm not surprised, but I love having the various parts spelled out specifically in the skill itself. Like yesterday, I'll share the entire skill at the end, but let me talk a bit about what it did when I tried running it. 

## Running the Skill

When I ran the skill, I didn't expect it to find anything as my last commit was just a blog post. Cursor responded as such mentioning there was nothing staged. It noted two files that were dirty but not important:

{% mdwrap %}
**Precheck result: nothing in scope to review.**

Your working tree has two changes, neither in the engine paths this skill covers:

| File | Status | In scope? |
|------|--------|-----------|
| `package-lock.json` | modified | No — lockfile only; syncs `@netlify/edge-functions` already in `package.json` |
| `src/test.liquid` | untracked | No — scratch page (moon-phase font test), not engine/build code |

No staged changes. No diffs under `eleventy.config.js`, `config/`, `src/_data/`, `netlify/`, `scripts/`, search/feed templates, client JS, or deploy config.

**Stopping here** per the skill workflow.

---

If you meant something else:

- **Recent commits** (e.g. `1117ccc2 perf changes`) — say “precheck the last N commits” and I’ll review those engine diffs.
- **Before you commit** `package-lock.json` — worth committing alongside the existing `package.json` dep so installs stay reproducible; no code review needed.
- **`src/test.liquid`** — looks like a local experiment; don’t commit unless you want it published.

Want me to review a specific commit or branch instead?
{% endmdwrap %}

I asked it to review the last two and it also noticed they didn't have anything relevant either - but what got me excited was that it went ahead and looked at one more and noted relevant changes there. Here's how that response ended:

<blockquote>
Want me to precheck 1117ccc2 (or 1117ccc2 + 06626459 together)? That is where the meaningful review would be.
</blockquote>

As I mentioned, I didn't do *everything* in the initial performance check, so I figured, why not, and I approved this scan. It noted two places I had used `rss-parser` and not yet added the timeout change so I went ahead and let Cursor make those changes as well. 

## The Skill

Here's the [skill](https://github.com/cfjedimaster/raymondcamden2023/blob/main/.agents/skills/prepublish/SKILL.md) created by Cursor. Let me know what you think! Also, check out Cursor's [docs on Skills](https://cursor.com/docs/skills) - it's not just specific to Cursor and is a great reference in general.

{% mdwrap %}
{% raw %}
---
name: precheck

description: Review engine and infrastructure changes before commit. Use when the user runs /precheck, asks to review site engine code, or wants a pre-commit check on JavaScript/TypeScript, Eleventy config, Netlify functions, or build tooling — not blog posts.

---

# Precheck engine review

Run this before committing changes to the site's core engine — Eleventy config, build filters, data fetchers, Netlify functions, search/indexing, or client JS that affects builds or performance. Blog posts in `src/posts/` are out of scope; use `prepublish` for those.

## Step 1 — Find the changes

Use git to determine what changed:

```bash
git status --short
git diff
git diff --cached
```

Filter to engine-relevant paths only:

| Area | Paths |
|------|-------|
| Eleventy entry | `eleventy.config.js` |
| Engine modules | `config/**/*.js` |
| Build-time data | `src/_data/*.js` |
| Netlify runtime | `netlify/functions/**`, `netlify/edge-functions/**` |
| Maintenance scripts | `scripts/**` |
| Search / feeds | `src/misc/algolia_*.liquid`, `src/search.liquid`, `src/feed*.liquid`, `src/sitemap.njk`, `src/llms.liquid` |
| Client JS | `src/assets/js/**`, `src/assets/service-worker.js` |
| Deploy config | `netlify.toml`, `src/_redirects` |

**Exclude:** `src/posts/**`, static pages (`about.md`, `speaking.md`, etc.), images/CSS unless they affect build behavior, `_site/`, `node_modules/`.

If nothing in scope changed, say so and stop. If both engine files and blog posts changed, review only the engine files unless the user asks otherwise.

Confirm in one line which files you are reviewing before proceeding.

## Step 2 — Build smoke test

If any of these changed — `eleventy.config.js`, `config/**`, `src/_data/**`, search/feed templates — run a local build:

```bash
SKIP_REMOTE_DATA=1 npx eleventy
```

Report success or paste the error. If the change is limited to `netlify/functions/**`, `scripts/**`, or client JS with no template/config impact, skip the build and note why.

Do not auto-fix build failures. Diagnose and report.

## Step 3 — Code review

Read every changed in-scope file. Review for:

### Build breaks
- Broken imports, mixed ESM/CJS (`scripts/rebuildalgolia.js` is CommonJS; the rest is ESM)
- Collection mutations in `getPosts` / `categories` — permalink and `outputPath` changes affect every post
- New `_data` files that ignore `SKIP_REMOTE_DATA=1` (local dev must not require live API keys)
- `eleventy.after` markdown copy hook — path bugs silently skip posts for content negotiation
- Algolia JSON shape in `src/misc/algolia_*.liquid` — must stay compatible with `deploy-succeeded` partial reindex and `scripts/rebuildalgolia.js`

### Runtime / deploy breaks
- Netlify functions: missing env vars, timeout risk, uncached Algolia calls
- Edge function `content-negotiation.ts` — must not break HTML serving for normal browsers
- `deploy-succeeded` — partial Algolia update logic; a bad filter can leave the index stale

### Performance
- Work added inside `getPosts` or other per-post loops (runs on every build)
- New async shortcodes or `_data` fetchers without caching (`@11ty/eleventy-fetch` pattern in `stoot.js`)
- `cssmin` filter global cache — stale output if inputs change without cache invalidation
- `htmlmin` transform — CI-only; errors are swallowed; new HTML patterns may minify badly
- Client JS: blocking scripts, large bundles, service-worker cache busting

### Correctness and safety
- Secrets or API keys hardcoded instead of env vars
- Error handling that fails open vs fails closed (especially fetchers returning `[]` on error)
- Redirect or header changes in `netlify.toml` / `src/_redirects` with unintended side effects

**Do NOT** nitpick style, naming, or formatting unless it risks a real bug. This site has no linter; focus on things that break builds, deploys, search, or page performance.

Present findings grouped by severity:

1. **Critical** — will break build, deploy, or search; must fix before commit
2. **Warning** — likely problem under load, in CI, or at runtime
3. **Note** — worth knowing, optional improvement

Each item: one or two sentences, file path, and line number when possible. Do not rewrite code — point at the issue and let the user decide.

## Step 4 — Apply changes

Ask which suggestions to act on. Apply only what is confirmed. Then stop — the user handles the actual commit/push.
{% endraw %}
{% endmdwrap %}
