---
layout: post
title: "Updating my Watch Site for Algolia Support"
date: "2026-07-29T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/watches.jpg
permalink: /2026/07/29/updating-my-watch-site-for-algolia-support
description: Adding search, via Algolia and Cursor, to my watch site.
---

Alright, so I was supposed to share this a bit quicker, but life, work, etc, kept me busy. I've had this particular change up for a few days but I'm just now getting around to blogging about it. What changes?

* Adding Algolia's MCP to my Cursor environment
* Using Algolia's MCP (what worked, what did not)
* Adding Algolia content as a scheduled service with Netlify
* Adding a basic search front end to [I Watch Watches](https://iwatchwatches.netlify.app/)

Before going on, be sure you've read the [last piece](https://www.raymondcamden.com/2026/07/24/building-agentically-and-celebrating-watches) where I talked about agentic development in general, and specifically how I built the site. 

## If you don't have a log, did it happen?

I've been doing some work with different profiles and my Cursor environment, and in doing so, I lost the chat I had with Cursor about these features. I know it's there but I think I lost it the transition/testing I've been doing. (I *did* find the chat actually, but I'll still probably skip including it directly here.)

## The Plan - in Two Parts

I spelled this out above, but it bears repeating. I wanted to add search to my site and wanted to use [Algolia](https://algolia.com). Algolia makes use of an index that's a copy of your site data. For me that's the RSS feed items from the watch blogs I aggregate. Creating and setting up the index is a one time operation. Populating the index and keeping it up to date is something you do forever. (To be technical, you've got a lot of options in that regard. So for example, in a site with *millions* of updates you could hold off updating your index until a particular time every day or other time period.) So the first operation was setting up that process.

The second part is much simpler - wiring up the search UI. For that I used my interface here as a guide - a nav search field that loads up a search page with results, and another form there so you can quickly change your search.

## Algolia and MCP

Algolia's MCP [docs](https://www.algolia.com/doc/guides/model-context-protocol) were a bit confusing to me. The first example mentioned is the "Algolia Public MCP" - but this is the "per app" MCP I talked about here: ["TIL - Algolia Makes Creating an MCP Server Stupid Easy"](https://www.raymondcamden.com/2026/07/11/til-algolia-makes-creating-an-mcp-server-stupid-easy). In other words, it's an MCP server for your data. 

Instead, you want the [Algolia Productivity MCP](https://www.algolia.com/doc/guides/model-context-protocol#algolia-productivity-mcp), which is what's used to work with your account at a high level. But - right away you see:

"Read-only index access, with an extended set of tools such as analytics."

So the MCP server can't actually make changes to your account, like creating or modifying an index. That's a bit of a bummer (and I let my buddy at Algolia know this), but it does give you MCP access via your agent so you can do things like list your indexes and perform searches right from your AI harness.

Here's a test I did in Cursor: 

<p>
<img src="https://static.raymondcamden.com/images/2026/07/amcp.png" loading="lazy" alt="Cursor Response" class="imgborder imgcenter">
</p>

Pretty standard stuff, but notice both Cursor and Algolia's MCP gracefully handled the fact that I didn't specify a particular index for my account. It was smart enough to recognize which index would most likely have `rolex` as a term. 

One more nit to be aware of. You have to *enable* Algolia MCP. This is [documented](https://www.algolia.com/doc/guides/model-context-protocol/productivity-mcp), but given that the URL is standard (not something special per index, it's for Algolia in general) and given you have to authenticate to use it, it felt weird that I also had to enable it in my account. This is also feedback I shared with my contact at Algolia.

So given I couldn't use the MCP to *create* the index, I just did it myself. By hand. Uphill. In the snow. Both ways. After the 20 to 30 seconds of that work was done, I was ready to start building.

## Index Seeding and Updating

My first choice was a bit difficult. For my blog here, I've got a huge amount of content, and keeping Algolia in sync could be a bit complex. I went with an approach that gets recent items and does an upsert to my index using the batch API.

For I Watch Watches, I decided to use the same API, the same upsert, but to pass everything. My spidey-sense tells me this may be problematic later as the aggregator grows, and I'll probably have to go with a "last 1k" or so filter, but for now it worked. 

In Cursor, I described my ask - create a Netlify scheduled function to upsert my data to my Algolia index. Netlify has my Algolia secrets and serverless functions can use it, so I set Cursor to building it out, and it did a great job. In fact, it did it a bit differently than I would. 

First, it created a core Algolia module in `src/lib/algolia.ts`:

```js
import { algoliasearch } from "algoliasearch";
import { db } from "../db";
import { feedItems } from "../db/schema";

const BATCH_SIZE = 1000;

export type AlgoliaSyncSummary = {
  total: number;
  batches: number;
  indexName: string;
};

function getAlgoliaConfig() {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_SECRET_KEY;
  const indexName = process.env.ALGOLIA_INDEX;

  const missing = [
    !appId && "ALGOLIA_APP_ID",
    !apiKey && "ALGOLIA_SECRET_KEY",
    !indexName && "ALGOLIA_INDEX",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing required Algolia environment variables: ${missing.join(", ")}`);
  }

  return { appId: appId!, apiKey: apiKey!, indexName: indexName! };
}

export async function syncFeedItemsToAlgolia(): Promise<AlgoliaSyncSummary> {
  const { appId, apiKey, indexName } = getAlgoliaConfig();
  const client = algoliasearch(appId, apiKey);

  const rows = await db
    .select({
      id: feedItems.id,
      title: feedItems.title,
      url: feedItems.url,
      synopsis: feedItems.synopsis,
      publishedAt: feedItems.publishedAt,
    })
    .from(feedItems);

  const objects = rows.map((row) => ({
    objectID: String(row.id),
    title: row.title,
    url: row.url,
    synopsis: row.synopsis,
    published_at: row.publishedAt ? row.publishedAt.toISOString() : null,
  }));

  if (objects.length === 0) {
    return { total: 0, batches: 0, indexName };
  }

  const responses = await client.saveObjects({
    indexName,
    objects,
    batchSize: BATCH_SIZE,
  });

  return {
    total: objects.length,
    batches: responses.length,
    indexName,
  };
}
```

And then it built the serverless function which ended up being much smaller with the core logic abstracted.

```js
import type { Config } from "@netlify/functions";
import { syncFeedItemsToAlgolia } from "../../src/lib/algolia";

export default async (req: Request) => {
  const body = await req.json().catch(() => ({}));

  try {
    const result = await syncFeedItemsToAlgolia();
    const summary = {
      next_run: body?.next_run ?? null,
      ...result,
    };

    console.log("Algolia sync complete", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Algolia sync failed", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  schedule: "@daily",
};
```

Running locally, I was able to use curl to run this function and then the Algolia MCP to search and confirm it actually worked. 

## Searching

Algolia has multiple options for performing searches, but for me the basic JavaScript SDK is all I need. I asked Cursor to implement that following the pattern I have on my blog here and as I described above. Cursor wired up the search in the top nav, built a new page, `search.astro`, and mostly followed the same pattern I did here. Here's the complete Astro page:

```html
---
import Header from "../components/Header.astro";
import { SITE_NAME } from "../config";
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title={`Search · ${SITE_NAME}`} description="Search watch articles and news">
  <div class="site-shell">
    <Header />

    <main class="search-page">
      <h1>Search</h1>

      <form class="search-page-form" action="/search" method="get" role="search">
        <input
          id="search-input"
          type="search"
          name="search"
          placeholder="Search watches, brands, or articles"
          autocomplete="off"
        />
        <button type="submit">Search</button>
      </form>

      <p id="search-status" class="search-status" aria-live="polite"></p>
      <div id="search-results" class="search-results"></div>

      <p class="search-attribution">
        Search by
        <a href="https://www.algolia.com/" target="_blank" rel="noopener noreferrer">Algolia</a>
      </p>
    </main>
  </div>
</BaseLayout>

<script is:inline src="https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.umd.js"></script>
<script is:inline>
  (() => {
    const appId = "0FJBPN4K5D";
    const apiKey = "8f741f50b983176875b65e252402b140";
    const indexName = "iwatchwatches";

    const statusEl = document.getElementById("search-status");
    const resultsEl = document.getElementById("search-results");
    const inputEl = document.getElementById("search-input");

    const params = new URLSearchParams(window.location.search);
    const term = (params.get("search") || "").trim();

    if (inputEl) {
      inputEl.value = term;
    }

    if (!term) {
      statusEl.textContent = "Enter a search term above to find articles.";
      return;
    }

    if (typeof algoliasearch !== "function") {
      statusEl.textContent = "Search is temporarily unavailable.";
      return;
    }

    statusEl.textContent = "Searching…";

    const client = algoliasearch(appId, apiKey);
    const index = client.initIndex(indexName);
    const dateFormatter = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function formatDate(value) {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return dateFormatter.format(date).toUpperCase();
    }

    index
      .search(term, {
        hitsPerPage: 50,
        attributesToRetrieve: ["title", "url", "synopsis", "published_at"],
      })
      .then((response) => {
        const hits = response.hits || [];
        const count = response.nbHits ?? hits.length;

        if (hits.length === 0) {
          statusEl.textContent = "Sorry, but there were no results.";
          resultsEl.innerHTML = "";
          return;
        }

        statusEl.textContent =
          count === 1
            ? "There was one result for this search."
            : `There were ${count} results for this search.`;

        resultsEl.innerHTML = hits
          .map((hit) => {
            const title = escapeHtml(hit.title || "Untitled");
            const url = escapeHtml(hit.url || "#");
            const synopsis = hit.synopsis ? escapeHtml(hit.synopsis) : "";
            const published = formatDate(hit.published_at);

            return `
              <article class="search-result">
                <h2 class="search-result-title">
                  <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
                </h2>
                ${published ? `<p class="search-result-meta">${published}</p>` : ""}
                ${synopsis ? `<p class="search-result-synopsis">${synopsis}</p>` : ""}
              </article>
            `;
          })
          .join("");
      })
      .catch(() => {
        statusEl.textContent = "Search failed. Please try again.";
        resultsEl.innerHTML = "";
      });
  })();
</script>
```

In case you're curious, the key embedded in code is safe - it's a read only search key. 

## Show me the code...

If you want to see everything behind the aggregator, you can check out the repo here: <https://github.com/cfjedimaster/iwatchwatches>. Note that the readme was updated by Cursor and it did a dang good job. It handled updating the configuration as well as the `Changes` section.

The next change will be somewhat larger - a web based interface to add new feeds to the site - behind authentication of course. 

Photo by <a href="https://unsplash.com/@shahrukh_rehman1?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Shahrukh Rehman</a> on <a href="https://unsplash.com/photos/silver-and-black-chronograph-watch-05IxAEjVNl0?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>