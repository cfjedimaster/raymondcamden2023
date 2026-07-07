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
