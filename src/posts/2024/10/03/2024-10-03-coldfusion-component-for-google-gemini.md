---
layout: post
title: "ColdFusion Component for Google Gemini"
date: "2024-10-03T18:00:00"
categories: ["coldfusion"]
tags: ["generative ai"]
banner_image: /images/banners/cf_gemini.jpg
permalink: /2024/10/03/coldfusion-component-for-google-gemini
description: A note about my open-source ColdFusion component for Google Gemini's GenAI service.
---

This week I had the pleasure to present on [Google Gemini](https://ai.google.com) at the [ColdFusion Summit](https://cfsummit.adobeevents.com/). If you weren't able to make it, I do plan on giving the talk again on the [ColdFusion Meetup](https://coldfusionmeetup.com/) sometime later this year.

After the presentation, I took my 'rough and ugly' code that called Gemini and decided to wrap it up in a nice ColdFusion component. This allows for (hopefully) easier use. For example:

```js
gemini = new gemini(key="your key", model="gemini-1.5-pro");

result = gemini.prompt('why is the sky blue?');
```

And that's it. The `result` variable will contain two keys, a `raw` value that is exactly what Gemini returned, and a `text` value that narrows down into the text response. 

Multimodal prompts are also somewhat simple:

```js
fileOb = gemini.uploadFile(expandPath('./cat1.png'));

result = gemini.prompt('what is in this picture?', [ fileOb ]);
writedump(result);
```

And you can use multiple files at once:

```js
fileOb2 = gemini.uploadFile(expandPath('./dog1.png'));
result = gemini.prompt('what is different in these pictures??', [ fileOb, fileOb2 ]);
writedump(result);
```

There's still more I'd like to add, specifically support for safety settings and chat, but for now, you can find the code here: <https://github.com/cfjedimaster/gemini.cfc>

I am, admittedly, somewhat rusty with ColdFusion, so I'm happy to take PRs that simply update my syntax to more modern conventions I may have missed. Just let me know!
