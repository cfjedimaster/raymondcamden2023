---
layout: post
title: "Getting Structured Data from Web Pages with AI and Re-usable Specs"
date: "2026-11-05T18:00:00"
categories: ["Uncategorized"]
tags: []
banner_image: /images/banners/cat-stove.jpg
permalink: /2026/11/05/getting-structured-data-from-web-pages-with-ai-and-re-usable-specs
description: 
---

As I say from time to time, every now and then I build something as a proof of concept and the result is... ok? I'm not really sure if the idea actually made sense and if the final result is usable, but the exploration was interesting enough that I think it warrants sharing with you good people. That's what today's post is. 

This demo all began with a simple idea - how do you handle getting RSS like content from a site that doesn't actually have an RSS feed? This typically relies on looking at the page as data to be parsed.

For a while now, there have been multiple good ways to turn a web page into structured data. As an example, [AgentQL](https://www.agentql.com/) lets use a GraphQL-like syntax to parse web pages. I blogged about it here: [Extracting Data from Web Pages with AgentQL and BoxLang](https://www.raymondcamden.com/2025/07/16/extracting-data-from-web-pages-with-agentql-and-boxlang).

Another way of handling this is via an API from [Diffbot](https://diffbot.com) - the [List API](https://www.diffbot.com/docs/extract/list). This is focused on "list" type pages, so not so much a recipe but a page with a set of content, like a news homepage for example. The Diffbot team actually built a cool demo of this called [RSS Anything](https://rss.diffbot.com/). To be honest, you (all of you) out there should be paying more attention to Diffbot in general - they've got some *incredibly* powerful APIs. 

And of course, you can tie a JSON schema to a call to a GenAI service as another route as well. I blogged about this using Gemini way back in 2024: [Using Generative AI to Parse Web Pages into Data](https://www.raymondcamden.com/2024/11/27/using-generative-ai-to-parse-web-pages-into-data)

All of these solutions work well, although you should expect some work to get the right results, which is to be expected. However, all of these solutions also require a GenAI API call for each and every request. That can add up. Also, it can take time for your model to actually do the work. 

So given that - I investigated another approach:

* Use GenAI to do a "scan" of the URL and attempt to discover the DOM elements that match to the list of data on the data.
* Turn those DOM elements into a simple JSON specification.
* Use a "dumb" simple script that can then hit the URL, apply the spec as a way to parse the content, and return structured data.

In the above process, the first two steps there are "slow and expensive", relatively, but only done one time. The final step should be pretty quick. There is an inherent drawback to this approach that if the site design changes it can break the spec, but in theory, you tie that to a process that regenerates the spec and run it again.

As I said in the beginning, this turned out... OK I suppose. Let me share what I created.

## The Parser

The first tool is `generate.mjs`:

```js
import { GoogleGenAI } from "@google/genai";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const MODEL = "gemini-3.8-flash";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const DEFAULT_REQUIRED_FIELDS = ["title", "link", "date"];
const FIELD_SCHEMA = {
  type: "object",
  properties: {
    sel: { type: "string", description: "Optional CSS selector relative to the item." },
    attr: { type: "string", description: "Optional HTML attribute to read." },
    match: { type: "string", description: "Optional JavaScript regular expression." },
    format: { type: "string", description: "Output template for regex capture groups." },
    base: { type: "string", description: "Optional URL prefix for root-relative values." },
  },
  additionalProperties: false,
};

export function buildSpecSchema(requiredFields = DEFAULT_REQUIRED_FIELDS) {
  if (
    !Array.isArray(requiredFields) ||
    requiredFields.length === 0 ||
    requiredFields.some((field) => typeof field !== "string" || field.length === 0) ||
    new Set(requiredFields).size !== requiredFields.length
  ) {
    throw new TypeError("requiredFields must be a non-empty array of unique field names");
  }

  return {
    type: "object",
    properties: {
      error: { type: "string" },
      item: { type: "string" },
      dedupe: { type: "string" },
      minItems: { type: "integer", minimum: 1 },
      fields: {
        type: "object",
        properties: Object.fromEntries(requiredFields.map((field) => [field, FIELD_SCHEMA])),
        required: requiredFields,
        additionalProperties: false,
      },
    },
    anyOf: [
      { required: ["error"] },
      { required: ["item", "dedupe", "minItems", "fields"] },
    ],
    additionalProperties: false,
  };
}

function renderPrompt(template, { requiredFields, url, html }) {
  return template{% raw %}
    .replace("{{REQUIRED_FIELDS, e.g. title, link, date}}", requiredFields.join(", "))
    .replace("{{URL}}", url)
    .replace("{{HTML}}", html);{% endraw %}
}

export async function generateSpec(url, requiredFields = DEFAULT_REQUIRED_FIELDS) {
  if (typeof url !== "string" || !url) {
    throw new TypeError("url must be a non-empty URL string");
  }
  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new TypeError("url must use HTTP or HTTPS");
  }
  const responseJsonSchema = buildSpecSchema(requiredFields);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from the process environment");
  }
  const ai = new GoogleGenAI({ apiKey });

  const pageResponse = await fetch(parsedUrl, {
    headers: { "User-Agent": BROWSER_USER_AGENT },
  });
  if (!pageResponse.ok) {
    throw new Error(
      `Failed to fetch ${parsedUrl.href}: ${pageResponse.status} ${pageResponse.statusText}`,
    );
  }
  const html = await pageResponse.text();
  const template = await readFile(new URL("./plan.md", import.meta.url), "utf8");
  const prompt = renderPrompt(template, { requiredFields, url: parsedUrl.href, html });

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema,
    },
  });
  const text = result.text;
  if (!text) {
    throw new Error("Gemini API returned no generated JSON content");
  }
  return JSON.parse(text);
}

// CLI entry point
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [url] = process.argv.slice(2);
  if (!url) {
    console.error("Please provide a URL. Usage: node generate.mjs <url>");
    process.exitCode = 1;
  } else {
    const spec = await generateSpec(url);
    console.log(JSON.stringify(spec, null, 2));
  }
}
```

It takes a URL at the CLI and then starts processing on it with `generateSpec`. This function does a bit of error checking and then moves on to generating the schema. `buildSpecSchema` is used to generate that JSON schema and it's what's eventually passed to Google's Gemini API. I built this script with my AI agent and honestly, this part feels a bit over-engineered, but it gives you an idea of what it's asking of the API when parsing. 

The function fetches the web page and grabs the text. It then reads `plan.md` which is a template for the prompt:

{% raw %}
```
You generate extraction specs that a fixed interpreter will run against HTML pages
to turn a list of items (articles, products, posts) into structured records. You
do not write code. You output one JSON object and nothing else.

## Spec format

{
  "item":     CSS selector matching each repeated item container,
  "dedupe":   name of the field used to drop duplicates (usually "link"),
  "minItems": minimum number of items a healthy page should yield,
  "fields": {
    "<name>": {
      "sel":    optional CSS selector, relative to the item; first match is used
                (omit to use the item element itself),
      "attr":   optional attribute to read; omit to read the element's text,
      "match":  optional JavaScript regex with capture groups, applied to the value,
      "format": output template for the regex groups, e.g. "$1-$2-$3"
                (required if "match" is present),
      "base":   optional URL prefix, prepended when the value starts with "/"
    }
  }
}

The interpreter normalizes whitespace, takes the first match of "sel", and returns
an empty string when something is not found. It supports nothing beyond this format.

## Required fields

Produce these fields: {{REQUIRED_FIELDS, e.g. title, link, date}}.

## Rules

1. Selectors must match the HTML I give you. Do not guess at class names or
   attributes that do not appear in it.
2. Prefer stable hooks over styling hooks: data-* attributes, semantic elements,
   and URL patterns beat generated or layout-specific class names.
3. "item" must select exactly one element per distinct item, not the page's
   navigation, footers, or ad modules. If the same item appears in several
   modules, that is fine because "dedupe" handles it.
4. If a field is not present as text or an attribute but is encoded elsewhere
   (for example a date inside the URL path), extract it with "match"/"format"
   from the attribute that contains it.
5. Keep regexes simple and anchored to literal context, with no nested
   quantifiers, to keep them fast.
6. Set "minItems" to roughly half the number of items you can identify in the
   sample, so it flags a broken page without being brittle.
7. Do not invent fields I did not ask for.

## Output

Return only the JSON object, with no markdown fences and no commentary.
If the page has no repeated item list that can satisfy the required fields,
return {"error": "<one-sentence reason>"}.

## Page

URL: {{URL}}

HTML:
{{HTML}}
```
{% endraw %}

That itself is also updated (see `renderPrompt`) and finally it's passed to Gemini. Whew. So how well did it work?

I first tried CNN, and it worked mostly ok:

```json
{
  "item": "li[data-open-link]",
  "dedupe": "link",
  "minItems": 10,
  "fields": {
    "title": { "sel": ".container__headline-text" },
    "link": { "attr": "data-open-link", "base": "https://www.cnn.com" },
    "date": {
      "attr": "data-open-link",
      "match": "/(\\d{4})/(\\d{2})/(\\d{2})/",
      "format": "$1-$2-$3"
    }
  }
}
```

You'll notice it has values for date, but it's never able to get dates as CNN doesn't actually have dates by all of their stories. 

My blog, which has a proper RSS feed of course, returned:

```json
{
  "item": "article.post-card",
  "dedupe": "link",
  "minItems": 3,
  "fields": {
    "title": {
      "sel": "h2 a"
    },
    "link": {
      "sel": "h2 a",
      "attr": "href",
      "base": "https://www.raymondcamden.com"
    },
    "date": {
      "sel": "time",
      "attr": "datetime"
    }
  }
}
```

And as a third example, I parsed the GitHub page showing [my repos](https://github.com/cfjedimaster?tab=repositories) (which GitHub has APIs for and such, so definitely not needed), and got this:

```json
{
  "item": "li[itemprop=\"owns\"]",
  "dedupe": "link",
  "minItems": 15,
  "fields": {
    "title": {
      "sel": "a[itemprop=\"name codeRepository\"]"
    },
    "link": {
      "sel": "a[itemprop=\"name codeRepository\"]",
      "attr": "href",
      "base": "https://github.com"
    },
    "date": {
      "sel": "relative-time",
      "attr": "datetime"
    }
  }
}
```

## The Data Scraper

Ok, so as I mentioned, the next part is just "dumb" parsing. My script is called `extract.mjs`:

```js
// Usage: node extract.mjs cnn.spec.json https://example.com/
// Requires: npm install cheerio   (Node 18+ for global fetch)
import * as cheerio from "cheerio";
import { readFile } from "node:fs/promises";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

function readField($el, f) {
  const $t = f.sel ? $el.find(f.sel).first() : $el;
  let v = f.attr ? $t.attr(f.attr) : $t.text();
  v = (v ?? "").replace(/\s+/g, " ").trim();
  if (f.match) {
    const m = v.match(new RegExp(f.match));
    v = m && f.format ? f.format.replace(/\$(\d)/g, (_, i) => m[i] ?? "") : "";
  }
  if (f.base && v.startsWith("/")) v = f.base + v;
  return v;
}

export function extract(html, spec) {
  const $ = cheerio.load(html);
  const seen = new Set();
  const items = [];
  $(spec.item).each((_, el) => {
    const row = {};
    for (const [name, f] of Object.entries(spec.fields)) row[name] = readField($(el), f);
    const key = row[spec.dedupe ?? "link"];
    if (!key || seen.has(key)) return;
    seen.add(key);
    items.push(row);
  });
  return items;
}

// The cheap check that decides whether the agent needs to regenerate the spec.
export function check(items, spec) {
  if (items.length < (spec.minItems ?? 1)) return false;
  const complete = items.filter((r) => Object.values(r).every(Boolean));
  /*
  console.log('complete', complete.length);
  return complete.length / items.length >= 0.9;
  So the original logic was - most of the results need to be complete - i'd say
  as long as complete >= minItems, we are ok
  */
 return complete.length >= (spec.minItems ?? 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [specPath, url] = process.argv.slice(2);
  if (!specPath || !url) {
    console.error("Usage: node extract.mjs <spec-path> <url>");
    process.exit(1);
  }

  const spec = JSON.parse(await readFile(specPath, "utf8"));
  const response = await fetch(url, {
    headers: { "User-Agent": BROWSER_USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  const items = extract(html, spec);
  console.log(JSON.stringify(items, null, 2));
  if (!check(items, spec)) {
    console.error("SANITY CHECK FAILED: spec likely needs regenerating");
    process.exit(1);
  }
}
```

Basically - grab the bits and use [Cheerio](https://www.npmjs.com/package/cheerio) to parse it using the selectors from the specification JSON. 

How well did it work? First is CNN. I was wrong in terms of dates - sometimes it *did* find it. Also, the result set was *huge*, but from what I can see, accurate. I removed some from the output below just to keep things sane:

```json
[
  {
    "title": "CNN Headlines",
    "link": "https://www.cnn.com/watch",
    "date": ""
  },
  {
    "title": "Watch CNN’s coverage and analysis after historic election",
    "link": "https://www.cnn.com/watch/cnn-stream",
    "date": ""
  },
  {
    "title": "CNN’s John King listens to voters’ reactions to midterm results",
    "link": "https://www.cnn.com/videos/title-2599145?episode=2599155&source=subwall:vod:episode-2599155&iid=related-embed_streaming-now",
    "date": ""
  },
  {
    "title": "And for everyone asking: the polls were right",
    "link": "https://www.cnn.com/videos/title-2572883?episode=2601600&source=subwall:vod:episode-2601600&iid=related-embed_streaming-now",
    "date": ""
  },
  {
    "title": "Your phone is now a casino. What’s it doing to your brain?",
    "link": "https://www.cnn.com/videos/title-2585292?episode=2585332&source=subwall:vod:episode-2585332&iid=related-embed_streaming-now",
    "date": ""
  },
  {
    "title": "Interactive Q&A: What does the blue wave mean?",
    "link": "https://www.cnn.com/videos/title-2586772?episode=2586791&source=subwall:vod:episode-2586791",
    "date": ""
  },
  {
    "title": "What Democrats can now do to stop Trump",
    "link": "https://www.cnn.com/videos/title-2573118?episode=2601417&source=subwall:vod:episode-2601417&iid=related-embed_streaming-now",
    "date": ""
  },
  {
    "title": "Democrats to have their largest House majority since the 2008 election",
    "link": "https://www.cnn.com/2026/11/05/politics/live-news/midterm-election-congress",
    "date": "2026-11-05"
  },
  {
    "title": "Republicans quickly turn against Pete Hegseth after midterms rout",
    "link": "https://www.cnn.com/2026/11/04/politics/pete-hegseth-impeachment-trump",
    "date": "2026-11-04"
  },
  {
    "title": "Democratic socialist Nithya Raman will defeat Karen Bass in LA mayor’s race, CNN projects",
    "link": "https://www.cnn.com/2026/11/05/politics/nithya-raman-los-angeles-mayor-karen-bass",
    "date": "2026-11-05"
  },
  {
    "title": "El-Sayed on Vice President Vance",
    "link": "https://www.cnn.com/el-sayed-vance-trump-midterm-loss-vrtc",
    "date": ""
  },
  {
    "title": "19-year-old unseats longtime Republican lawmaker",
    "link": "https://www.cnn.com/2026/11/05/politics/video/19-year-old-wins-seat-in-massachusetts-state-house-ldn-digvid-vrtc",
    "date": "2026-11-05"
  },
  {
    "title": "Ted Cruz on GOP’s midterm losses",
    "link": "https://www.cnn.com/2026/11/05/politics/video/ted-cruz-podcast-reaction-midterm-election-vrtc-ldn-digvid",
    "date": "2026-11-05"
  },
  {
    "title": "Why Alaska Senate race could take a while",
    "link": "https://www.cnn.com/2026/11/05/politics/video/why-the-alaska-senate-race-could-take-a-while-vrtc",
    "date": "2026-11-05"
  },
  {
    "title": "Mamdani reacts to El-Sayed win",
    "link": "https://www.cnn.com/2026/11/05/politics/video/mamdani-on-el-sayed-win-ldn-digvid-vrtc",
    "date": "2026-11-05"
  },
  {
    "title": "Voters disappointed with Congress, says DeSantis",
    "link": "https://www.cnn.com/2026/11/05/politics/video/desantis-says-voters-were-disappointed-with-congresss-productivity-digvid-vrtc-hnk",
    "date": "2026-11-05"
  },
  {
    "title": "Sen. Kelly: ‘Hegseth has been a disaster’",
    "link": "https://www.cnn.com/2026/11/05/world/video/how-democrats-plan-to-end-the-war-in-iran-in-january-hnk-dig-vid-vrtc",
    "date": "2026-11-05"
  },
  {
    "title": "Is the MAGA era over?",
    "link": "https://www.cnn.com/2026/11/04/politics/video/trump-maga-era-after-midterm-elections-digvid-vrtc",
    "date": "2026-11-04"
  },
  {
    "title": "What’s next in Mississippi?",
    "link": "https://www.cnn.com/2026/11/04/politics/video/dispatch-from-mississippi-vv",
    "date": "2026-11-04"
  },
  {
    "title": "Mamdani on Americans rebuking Trump admin",
    "link": "https://www.cnn.com/2026/11/05/politics/video/mamdani-on-americans-rebuking-trump-administration-midterms-digvid-vrtc-hnk",
    "date": "2026-11-05"
  },
  {
    "title": "Sen.-elect Annie Andrews joins CNN after big win",
    "link": "https://www.cnn.com/2026/11/05/politics/video/people-are-tired-sen-elect-annie-andrews-joins-cnn-after-big-win-hnk-digvid-vrtc",
    "date": "2026-11-05"
  },
  {
    "title": "‘Woke is so back’: The internet buzzes with memes after blue wave",
    "link": "https://www.cnn.com/2026/11/05/politics/video/woke-is-so-back-the-internet-buzzes-with-memes-after-blue-wave-digvid-vrtc",
    "date": "2026-11-05"
  },
  {
    "title": "Bryon Donalds says GOP must focus on lowering costs",
    "link": "https://www.cnn.com/2026/11/05/politics/video/florida-governor-elect-says-gop-must-focus-on-lowering-costs-digvid-vrtc-hnk",
    "date": "2026-11-05"
  },
  {
    "title": "KLB will be governor where her ancestors were enslaved",
    "link": "https://www.cnn.com/2026/11/04/politics/video/keisha-lance-bottoms-governor-ancestors-enslaved-vrtc",
    "date": "2026-11-04"
  },
  {
    "title": "MAGA accepts election losses, but not happily",
    "link": "https://www.cnn.com/2026/11/04/politics/video/midterms-maga-media-reaction-vrtc",
    "date": "2026-11-04"
  },
  {
    "title": "Jeffries, Schumer team up",
    "link": "https://www.cnn.com/2026/11/04/politics/video/democrats-jeffries-schumer-agenda-trump-manu-raju-vrtc",
    "date": "2026-11-04"
  },
  {
    "title": "Talarico says he is ready to work with Trump",
    "link": "https://www.cnn.com/2026/11/04/politics/video/border-security-democrat-james-talarico-erin-burnett-vrtc-digvid",
    "date": "2026-11-04"
  },
  {
    "title": "Blue wave hits South Carolina",
    "link": "https://www.cnn.com/2026/11/04/politics/video/blue-wave-democrats-south-carolina-annie-andrews-darline-graham-midterms-cmm-vrtc",
    "date": "2026-11-04"
  },
  {
    "title": "Raskin and Crenshaw clash",
    "link": "https://www.cnn.com/2026/11/04/politics/video/raskin-and-crenshaw-midterms-impeachment-vrtc",
    "date": "2026-11-04"
  },
  {
    "title": "Trump talks ballroom after election",
    "link": "https://www.cnn.com/trump-ballroom-construction-election-shellacking-vrtc",
    "date": ""
  },
  {
    "title": "DeSantis: ‘Close to an extinction level event’",
    "link": "https://www.cnn.com/2026/11/04/politics/video/fl-gov-desantis-calls-midterm-results-close-to-an-extinction-level-event-for-the-gop",
    "date": "2026-11-04"
  },
  {
    "title": "The last time Dems won Kansas",
    "link": "https://www.cnn.com/2026/11/04/politics/video/no-booze-no-rain-and-the-great-depression-the-last-time-dems-won-in-kansas-digvid-vrtc",
    "date": "2026-11-04"
  },
  {
    "title": "Hakeem Jeffries on Dems’ win",
    "link": "https://www.cnn.com/2026/11/04/politics/video/jeffries-press-conference-massive-win-digvid",
    "date": "2026-11-04"
  },
  {
    "title": "Trump speaks after GOP losses",
    "link": "https://www.cnn.com/trump-ballroom-construction-democrats-win-vrtc",
    "date": ""
  },
  {
    "title": "Jeffries on blue wave and MAGA",
    "link": "https://www.cnn.com/2026/11/04/politics/video/jeffries-says-ending-iran-war-will-be-top-of-house-democrats-agenda",
    "date": "2026-11-04"
  },
  {
    "title": "Politico cold calls Trump",
    "link": "https://www.cnn.com/2026/11/04/politics/video/politico-phone-call-donald-trump-midterm-election-vrtc-ldn-digvid",
    "date": "2026-11-04"
  },
  {
    "title": "Dems celebrate gains in speeches",
    "link": "https://www.cnn.com/2026/11/04/politics/video/democrats-historic-wins-celebration-speech-digvid-vrtc",
    "date": "2026-11-04"
  },
  {
    "title": "Texans revel in state’s flip to blue",
    "link": "https://www.cnn.com/2026/11/04/politics/video/texans-go-honking-to-celebrate-state-turning-blue",
    "date": "2026-11-04"
  },
  {
    "title": "Midterms bring historic firsts",
    "link": "https://www.cnn.com/2026/11/04/politics/video/candidates-who-made-history-digvid-vrtc",
    "date": "2026-11-04"
  }
]
```

Next, my blog, which again doesn't *need* this, but was a useful test:

```json
[
  {
    "title": "Links For You (11/1/26)",
    "link": "https://www.raymondcamden.com/2026/11/01/links-for-you-11126",
    "date": "2026-11-01"
  },
  {
    "title": "Generating PDF Invoices from Word Templates with officeParser",
    "link": "https://www.raymondcamden.com/2026/10/27/generating-pdf-invoices-from-word-templates-with-officeparser",
    "date": "2026-10-27"
  },
  {
    "title": "Building the Unicorn-themed app of my dreams with TinyJS",
    "link": "https://www.raymondcamden.com/2026/10/23/building-the-unicorn-themed-app-of-my-dreams-with-tinyjs",
    "date": "2026-10-23"
  },
  {
    "title": "Adding a PDF Display to Eleventy",
    "link": "https://www.raymondcamden.com/2026/10/21/adding-a-pdf-display-to-eleventy",
    "date": "2026-10-21"
  },
  {
    "title": "Links For You (10/19/26)",
    "link": "https://www.raymondcamden.com/2026/10/19/links-for-you-101926",
    "date": "2026-10-19"
  },
  {
    "title": "Generating PDFs from Word Templates with officeParser",
    "link": "https://www.raymondcamden.com/2026/10/17/generating-pdfs-from-word-templates-with-officeparser",
    "date": "2026-10-17"
  }
]
```

And finally, my list of repos:

```json
[
  {
    "title": "cfjedimaster",
    "link": "https://github.com/cfjedimaster/cfjedimaster",
    "date": "2026-11-05T04:14:28Z"
  },
  {
    "title": "myfamilyallowance",
    "link": "https://github.com/cfjedimaster/myfamilyallowance",
    "date": "2026-11-03T15:15:33Z"
  },
  {
    "title": "raymondcamden2023",
    "link": "https://github.com/cfjedimaster/raymondcamden2023",
    "date": "2026-11-02T19:30:22Z"
  },
  {
    "title": "webdemos",
    "link": "https://github.com/cfjedimaster/webdemos",
    "date": "2026-10-27T15:35:23Z"
  },
  {
    "title": "tinyjsdemos",
    "link": "https://github.com/cfjedimaster/tinyjsdemos",
    "date": "2026-10-23T14:36:34Z"
  },
  {
    "title": "typescript-stuff",
    "link": "https://github.com/cfjedimaster/typescript-stuff",
    "date": "2026-10-02T17:29:36Z"
  },
  {
    "title": "boxlang-mega-samples",
    "link": "https://github.com/cfjedimaster/boxlang-mega-samples",
    "date": "2026-09-04T15:18:14Z"
  },
  {
    "title": "precipradar",
    "link": "https://github.com/cfjedimaster/precipradar",
    "date": "2026-08-31T18:42:45Z"
  },
  {
    "title": "lego-screensaver",
    "link": "https://github.com/cfjedimaster/lego-screensaver",
    "date": "2026-08-24T21:11:42Z"
  },
  {
    "title": "cursor_python_sdk_cli_demo",
    "link": "https://github.com/cfjedimaster/cursor_python_sdk_cli_demo",
    "date": "2026-08-22T16:44:41Z"
  },
  {
    "title": "gemini-ai-preso",
    "link": "https://github.com/cfjedimaster/gemini-ai-preso",
    "date": "2026-08-13T18:48:45Z"
  },
  {
    "title": "file-preview",
    "link": "https://github.com/cfjedimaster/file-preview",
    "date": "2026-08-12T17:59:01Z"
  },
  {
    "title": "doc_qa",
    "link": "https://github.com/cfjedimaster/doc_qa",
    "date": "2026-08-08T22:03:37Z"
  },
  {
    "title": "awesome-public-real-time-datasets",
    "link": "https://github.com/cfjedimaster/awesome-public-real-time-datasets",
    "date": "2026-07-28T14:50:23Z"
  },
  {
    "title": "iwatchwatches",
    "link": "https://github.com/cfjedimaster/iwatchwatches",
    "date": "2026-07-24T16:18:49Z"
  },
  {
    "title": "oh-shit-the-sun",
    "link": "https://github.com/cfjedimaster/oh-shit-the-sun",
    "date": "2026-07-20T21:54:35Z"
  },
  {
    "title": "async-preso",
    "link": "https://github.com/cfjedimaster/async-preso",
    "date": "2026-07-16T21:53:18Z"
  },
  {
    "title": "pythondemos",
    "link": "https://github.com/cfjedimaster/pythondemos",
    "date": "2026-06-22T17:18:55Z"
  },
  {
    "title": "hermes-agent",
    "link": "https://github.com/cfjedimaster/hermes-agent",
    "date": "2026-06-10T18:10:43Z"
  },
  {
    "title": "General-Pipedream-Stuff",
    "link": "https://github.com/cfjedimaster/General-Pipedream-Stuff",
    "date": "2026-05-13T21:44:53Z"
  },
  {
    "title": "vite-stuff",
    "link": "https://github.com/cfjedimaster/vite-stuff",
    "date": "2026-04-30T14:54:17Z"
  },
  {
    "title": "astro-tests",
    "link": "https://github.com/cfjedimaster/astro-tests",
    "date": "2026-03-23T13:31:40Z"
  },
  {
    "title": "astrodocs",
    "link": "https://github.com/cfjedimaster/astrodocs",
    "date": "2026-03-23T06:58:38Z"
  },
  {
    "title": "intl-is-your-superhero",
    "link": "https://github.com/cfjedimaster/intl-is-your-superhero",
    "date": "2026-03-09T19:50:39Z"
  },
  {
    "title": "coldfusion-social-wrappers",
    "link": "https://github.com/cfjedimaster/coldfusion-social-wrappers",
    "date": "2026-02-27T16:20:40Z"
  },
  {
    "title": "ai-testingzone",
    "link": "https://github.com/cfjedimaster/ai-testingzone",
    "date": "2026-02-09T21:01:42Z"
  },
  {
    "title": "populate-data-into-webflow-cms",
    "link": "https://github.com/cfjedimaster/populate-data-into-webflow-cms",
    "date": "2026-02-02T15:49:46Z"
  },
  {
    "title": "writing",
    "link": "https://github.com/cfjedimaster/writing",
    "date": "2026-01-23T14:53:05Z"
  },
  {
    "title": "personalsit.es",
    "link": "https://github.com/cfjedimaster/personalsit.es",
    "date": "2026-01-16T14:28:53Z"
  },
  {
    "title": "js-webflow-api",
    "link": "https://github.com/cfjedimaster/js-webflow-api",
    "date": "2026-01-08T21:27:07Z"
  }
]
```

There ya go. If you want to try this yourself, you can grab the code here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/rsstest>. You will need to provide your own key of course. 

Before I leave, I do want to touch on what I think is an important aspect of this particular demo, and that is I think it's sensible to think of cases where you can use AI to build a tool to let you *not* use AI in the future. A topic I wrote about earlier this year: [Use AI to not use AI (as much)](https://www.raymondcamden.com/2026/06/22/use-ai-to-not-use-ai-as-much)