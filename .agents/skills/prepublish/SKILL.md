---
name: prepublish
description: Review a new blog post before publishing. Trigger immediately whenever the user asks to "check", "review", or "prepublish" a blog post, or says "check my latest blog post". Finds the latest post by its dated path under `src/posts/`, then spell-checks and offers content suggestions — without touching tone.
---

# Prepublish blog post review

Run this right before pushing a new post. Blog posts live in `src/posts/YYYY/MM/DD/` as `.md` files.

## Step 1 — Find the post

Do NOT use git to figure out which post is newest. Use the dated path under `src/posts/` — sort highest year → month → day and pick the most recent `.md` file.

A reliable command: `find src/posts -type f -name '*.md' | sort -r | head -5`. The first entry is the latest post; the rest are there in case there's a tie or the user wants to pick another.

If multiple `.md` files share the newest date directory, ask the user which one. Otherwise, confirm in one line ("Reviewing `path/to/post.md` — sound right?") before proceeding.

## Step 2 — Spell check

Read the post and surface misspellings. Ignore code blocks, fenced code, inline `code`, URLs, and proper nouns the user clearly intended (product names, people, libraries).

Present findings as a short list: `word → suggestion (line N)`. Don't auto-edit. Ask which corrections to apply, then apply them with Edit.

## Step 3 — Content review

Read the post end-to-end and give feedback focused on substance, not tone:

- **Things that sound stupid or unclear** — sentences that don't land, claims that need backing, awkward logic jumps.
- **Gaps worth filling** — missing context a reader would want, an example that would help, a link the user usually includes (docs, repo, related post).
- **Factual / technical accuracy** — flag anything that looks wrong or outdated. If the post references code, check it makes sense.
- **Loose ends** — TODO markers, "fill this in", broken-looking links, placeholder text.

**Do NOT** comment on tone, voice, snark level, casual phrasing, or stylistic choices. The user likes their voice; leave it alone.

When you look at the front matter, if you see banner_image set to 'welcome2018.jpg', flag that as a mistake and suggest updating it to a more relevant image.

## Step 4 — Apply changes

Ask which suggestions to act on. Apply only what's confirmed. Then stop — the user handles the actual publish/push.
