---
layout: post
title: "Creating Reddit Summaries with URL Context and Gemini"
date: "2026-02-09T18:00:00"
categories: ["development"]
tags: ["python","generative ai"]
banner_image: /images/banners/cat_on_papers2.jpg
permalink: /2026/02/09/creating-reddit-summaries-with-url-context-and-gemini
description: Using Gemini APIs to create a summary of a subreddit.
---

A while ago, the [Gemini API](https://ai.google.dev/gemini-api/docs) added a feature to help work with URL content, [URL Context](https://ai.google.dev/gemini-api/docs/url-context). Previously you had to fetch and download the HTML of the page and pass it to the API. This feature allows Gemini to request content (with limits) from public web pages. I thought it would be interesting to test this against Reddit. In the past I've made use of Reddit's APIs, but as they've pretty much destroyed access to those APIs, I thought this could be a good work around. Here's a simple demo I built. 

My demo parses the [Astro](https://www.reddit.com/r/astrojs) subreddit, specifically the `new` feed, and asks for a summary of items that seem to require a developer's help, as well as items that may be critical of Astro. 

I began with my imports and loading in my key from the environment:

```python
import os
from google import genai
from google.genai import types

client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
)
model = "gemini-flash-latest"
```

Next, I built a method for my prompt:

```python
def summarize():

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="""Look at this page in Reddit (https://www.reddit.com/r/astrojs/new/) and scan the titles of the most recent posts to see if anything needs a developer to respond or is overly critical of Astro. When reporting on threads, always include the URL to the thread."""),
            ],
        ),
    ]
    tools = [
        types.Tool(url_context=types.UrlContext()),
    ]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_budget=0,
        ),
        tools=tools,
    )

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config,
    )

    return response.text
```

The prompt is basically what I stated above, and in theory, you could make this method much more generic, taking in a subreddit by name and changing the company name. But the real important bit is the `tools` section which enables URL content. It's basically like an "internet pass" to allow Gemini to hit the URL (or URLs) specified and add it to the prompt. It may be obvious but just in case, yes, the size of the web page will impact the total number of tokens in the prompt. 

The result of this is pretty good. Here's an example from the current set of new posts.

<iframe src="https://static.raymondcamden.com/images/2026/02/report.pdf" loading="lazy" width="100%" height="400px"></iframe>

Ok, that's fine, but I really prefer to have a set format to my output. Typically this is easy - switch to structured output and supply a JSON schema, but oddly that feature is disabled when using URL Context. Turns out there's a simple enough solution - just build another prompt!

Here's the second method I added to my script:

```python
def turn_to_json(input):

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=f"""
I used a previous prompt to parse a URL and provide a report on issues that need a developer, and issues that reflect on the technology.

That prompt made use of URL tools and the SDK does not allow you to create structured output. So I want you to take the output and return it in my designed JSON format. Here is the previous output, in Markdown:
                                     
{input}                                     
"""),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_budget=0,
        ),
        response_mime_type="application/json",
        response_schema=genai.types.Schema(
            type = genai.types.Type.OBJECT,
            required = ["posts"],
            properties = {
                "posts": genai.types.Schema(
                    type = genai.types.Type.ARRAY,
                    items = genai.types.Schema(
                        type = genai.types.Type.OBJECT,
                        required = ["title", "reason", "url"],
                        properties = {
                            "title": genai.types.Schema(
                                type = genai.types.Type.STRING,
                            ),
                            "reason": genai.types.Schema(
                                type = genai.types.Type.STRING,
                            ),
                            "url": genai.types.Schema(
                                type = genai.types.Type.STRING,
                            ),
                        },
                    ),
                ),
            },
        ),
    )

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config,
    )

    return response.text
```

The prompt lets Gemini know that I had a previous prompt and couldn't get structured output. I then specify I *want* structured output, pass in the result from the previous call, and use a specific JSON schema in the call to get my precise response back. Here's the result (and as a quick note, I ran my script a few times between creating a PDF export of the initial response and now so if you see any differences, that's why):

```json
{
  "posts": [
    {
      "title": "Next.js or Astro for scroll-driven, motion-heavy websites? (leaving Gatsby)",
      "reason": "The user is asking for long-term production experience advice on which framework (Next.js or Astro) is better for complex, motion-heavy websites, especially when integrating with a headless CMS. This requires input from experienced Astro developers.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qp6a28/nextjs_or_astro_for_scrolldriven_motionheavy/"
    },
    {
      "title": "Astro Managed Hosting? (for my customer)",
      "reason": "The user is specifically looking for a \"managed hosting\" service for an Astro SSR site (similar to WordPress managed hosting) that will automatically handle Astro updates and service restarts. This is a question for developers who might know of a niche hosting provider or for a hosting provider's developer to potentially address a market gap.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qpar5l/astro_managed_hosting_for_my_customer/"
    },
    {
      "title": "How do you all render rich text from Payload CMS's lexical?",
      "reason": "The user is looking for a common or best-practice solution for rendering rich text and blocks from Payload CMS's lexical editor, noting that the official Astro docs lack an example. This needs a practical code-based answer from developers who have solved this integration.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qof39g/how_do_you_all_render_rich_text_from_payload_cmss/"
    },
    {
      "title": "4 vulnerabilities (2 moderate, 2 high) from upgrading wrangler in Astro",
      "reason": "The user is asking about the seriousness and the best fix for security vulnerabilities flagged by npm audit after upgrading wrangler in an Astro + Cloudflare project. This is a direct request for technical assistance/clarification on security.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qmx8p7/4_vulnerabilities_2_moderate_2_high_from_upgrading/"
    },
    {
      "title": "Help regarding Astro.js + FastAPI",
      "reason": "The user is struggling to deploy a combined Astro.js and FastAPI application to Vercel, running into routing issues. They need assistance with the specific configuration for Vercel, the Astro adapter, and the vercel.json file.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qk880f/help_regarding_astrojs_fastapi/"
    },
    {
      "title": "Experimental Content Security Policy (CSP)",
      "reason": "The user is running into issues with Astro's experimental CSP feature not covering all script/style hashes and is asking for tips from others who have successfully implemented it in production. This is a request for developer-level configuration guidance.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qip31d/experimental_content_security_policy_csp/"
    },
    {
      "title": "How do UI libraries work with islands?",
      "reason": "The user is struggling with how to use a consistent UI library across both static .astro components and hydrated components (like a React island). This is a fundamental architectural question about best practices in an Astro Islands setup and requires a technical answer.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qhb4n3/how_do_ui_libraries_work_with_islands/"
    },
    {
      "title": "Are Astro Templates worth it?",
      "reason": "The user reports a \"very sour taste\" after purchasing a paid template that hasn't been updated since 2022, causing them to abandon it. This is a criticism of the template ecosystem's quality control and longevity.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qp66w2/are_astro_templates_worth_it/"
    },
    {
      "title": "Anyone else feel burned out with all these Astro integrated CMS solutions?",
      "reason": "The user expresses burnout and frustration, stating that the market is \"missing a clear solution\" for a CMS that nails key fundamentals like good markdown integration, image/asset preview inside MDX, and intuitive component integration. This is a direct criticism of the current state of the Astro CMS ecosystem.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qj5k6z/anyone_else_feel_burned_out_with_all_these_astro/"
    },
    {
      "title": "High TTFB and execution latency on Astro SSR routes despite fast app code ( vercel hosted )",
      "reason": "The user is seeing intermittent and high Time to First Byte (TTFB) and execution latency spikes (3-7s) on their Astro SSR admin routes hosted on Vercel, despite the app code being fast. This is a serious performance criticism of the SSR implementation/Vercel adapter under real-world load.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qi98t5/high_ttfb_and_execution_latency_on_astro_ssr/"
    },
    {
      "title": "What's the point of Astro's i18n internationalization features?",
      "reason": "The user criticizes Astro's i18n features, stating they expected something more dynamic but have to \"manually create the folders and route files for each locale,\" \"manually load the translation files,\" and that the built-in utilities are confusing and broken for things like translated URLs and language switching.",
      "url": "https://www.reddit.com/r/astrojs/comments/1qk3rwi/whats_the_point_of_astros_i18n_internationalization/"
    }
  ]
}
```

That's pretty much it. The URL Context tool works as advertised, which is good, but it's kinda weird it Gemini can't map the results to a structured form. That being said, I dig the idea of using a second prompt to improve the results of an initial prompt, and it's something I'll consider in the future as well. 

You can find the complete script here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/reddit_summary>