---
layout: post
title: "Tracking Gemini Models with Pipedream"
date: "2024-05-31T18:00:00"
categories: ["development"]
tags: ["generative ai","pipedream"]
banner_image: /images/banners/cats_assemblyline.jpg
permalink: /2024/05/31/tracking-gemini-models-with-pipedream
description: How I built a "tracking" service for Google Gemini AI models.
---

APIs, tools, consumer features, and heck, pretty much every aspect, of generative AI is changing at an incredibly rapid pace. I mostly focus on just [Google Gemini](https://ai.google.dev/) and even that is pretty difficult to keep up with. Recently, [Linda Lawton](https://www.linkedin.com/in/linda-lawton/) shared that she actually uses an automation script to keep track of the models currently available in Gemini. I thought that was a great idea and decided to see if I could build something similar using [Pipedream](https://pipedream.com). Here's what I came up with.

## Getting Available Models via API

Normally, if I wanted to know what models I had available, I'd go to [AI Studio](https://aistudio.google.com) and just look, or check the [docs](https://ai.google.dev/gemini-api/docs/models/gemini). While that's fine usually, there's actually an API method that can do this programmatically, [list_models](https://ai.google.dev/api/python/google/generativeai/list_models).

Calling this method returns an array of available models, along with information about their features. Here's a **partial** list of the results:

```js
[
  {
    name: 'models/gemini-1.0-pro',
    version: '001',
    displayName: 'Gemini 1.0 Pro',
    description: 'The best model for scaling across a wide range of tasks',
    inputTokenLimit: 30720,
    outputTokenLimit: 2048,
    supportedGenerationMethods: [ 'generateContent', 'countTokens' ],
    temperature: 0.9,
    topP: 1
  },
  {
    name: 'models/gemini-1.0-pro-001',
    version: '001',
    displayName: 'Gemini 1.0 Pro 001 (Tuning)',
    description: 'The best model for scaling across a wide range of tasks. This is a stable model that supports tuning.',
    inputTokenLimit: 30720,
    outputTokenLimit: 2048,
    supportedGenerationMethods: [ 'generateContent', 'countTokens', 'createTunedModel' ],
    temperature: 0.9,
    topP: 1
  },
  {
    name: 'models/gemini-1.0-pro-latest',
    version: '001',
    displayName: 'Gemini 1.0 Pro Latest',
    description: 'The best model for scaling across a wide range of tasks. This is the latest model.',
    inputTokenLimit: 30720,
    outputTokenLimit: 2048,
    supportedGenerationMethods: [ 'generateContent', 'countTokens' ],
    temperature: 0.9,
    topP: 1
  },
  {
    name: 'models/gemini-1.0-pro-vision-latest',
    version: '001',
    displayName: 'Gemini 1.0 Pro Vision',
    description: 'The best image understanding model to handle a broad range of applications',
    inputTokenLimit: 12288,
    outputTokenLimit: 4096,
    supportedGenerationMethods: [ 'generateContent', 'countTokens' ],
    temperature: 0.4,
    topP: 1,
    topK: 32
  }
]
```

Basic Node.js code to get this data is as simple as:

```js
let API_KEY = process.env.GOOGLE_API_KEY;
let modelReq = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
let models = (await modelReq.json()).models;
```

## Automating the Process

To automate the process, I turned to Pipedream. My first step was to set up a schedule. I set it as weekly as I figured that was enough, but heck, I may need to increase it if things continue to progress as quickly as they have been.

My second step was a call to get models. It's basically the code above, but here it is in a Pipedream step:

```js
export default defineComponent({
  async run({ steps, $ }) {

    let API_KEY = process.env.GOOGLE_API_KEY;
    let modelReq = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
    let models = (await modelReq.json()).models;

    return models;
  },
})
```


Next I needed to figure out - how am I going to tell what changed? I decided I'd use Pipedream's [Data Store](https://pipedream.com/docs/data-stores) feature. It's a basic key/value system and can handle arrays of objects as shown above. Pipedream has a built-in step where I can specify my data store name, a key, and a default value:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/models1.jpg" alt="PD step showing getting my key value from the store" class="imgborder imgcenter" loading="lazy">
</p>

To figure out changes, I decided on a simple approach. While I figured it was possible for a model to change something deep, like the default temperature, I figured that would break backwards compatibility and probably would never happen. Instead, I decided to focus just on the model name. I would do two things:

* Look in my cached list of models and see if any were removed.
* Look in my list of models from the API and see if they weren't there before.

The first step looks for models missing:

```js
export default defineComponent({
  async run({ steps, $ }) {

    let old_list = steps.get_record_or_create.$return_value;

    let removed_list = [];
    
    for(let m of old_list) {
      let existingRecord = steps.getModels.$return_value.find(n => n.name === m.name);
      if(!existingRecord) removed_list.push(m);
    }

    return removed_list;
  },
})
```

And the next step looks for new models:

```js
export default defineComponent({
  async run({ steps, $ }) {

    let new_list = [];

    for(let m of steps.getModels.$return_value) {
      let existingRecord = steps.get_record_or_create.$return_value.find(n => n.name === m.name);
      if(!existingRecord) new_list.push(m);
    }

    return new_list;
  },
})
```

At this point, I have two arrays - one for missing models and one for new models. Pipedream has a 'condition' step that lets you apply a basic logical check and end the workflow if it evaluates to false. I went with this check:

```
{% raw %}{{steps.findNewModels.$return_value.length >= 1 || steps.findMissingModels.$return_value.length >= 1}}{% endraw %}
```

At this point, if the workflow is still running, I need to inform me, and I figured a simple email would suffice. I built a code step to generate the text:

```js
export default defineComponent({
  async run({ steps, $ }) {

    let html = `
<h2>Changes to Google Gemini Models</h2>
<p>
The following changes were detected to the list of available Google Gemini models. 
For more information, see the <a href="https://ai.google.dev/gemini-api/docs/models/gemini">model documentation</a>.
Note that this report does not detect changes to existing models.
</p>

<h2>Removed Models</h2>
    `;

    if(steps.findMissingModels.$return_value.length > 0 ) {

      html += '<ul>';
      steps.findMissingModels.$return_value.forEach(m => {
        html += `<li>${m.displayName} (${m.name})</li>`;        
      });
      html += '</ul>';
    } else {
      html += '<p>No changes detected.</p>';      
    }

    html += '<h2>Added Models</h2>';
    if(steps.findNewModels.$return_value.length > 0 ) {

      html += '<ul>';
      steps.findNewModels.$return_value.forEach(m => {
        html += `<li>${m.displayName} (${m.name})</li>`;        
      });
      html += '</ul>';
    } else {
      html += '<p>No changes detected.</p>';      
    }
    
    return html;
  },
})
```

And then a built-in Pipedream step that emails to myself, with the result of the above as the HTML body. 

The final step simply updates the data store, and again, Pipedream makes this easy with a built-in step:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/models2.jpg" alt="The step that updates the store." class="imgborder imgcenter" loading="lazy">
</p>

The first time I ran this, there were no values in the cache so everything was new. I did a quick little hack to remove one from the cache so I could see a slightly more realistic email with one model added:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/models3.jpg" alt="Sample email showing one model added." class="imgborder imgcenter" loading="lazy">
</p>

## The Workflow

If you're a Pipedream user and want the source, you can find it here: <https://github.com/cfjedimaster/General-Pipedream-AI-Stuff/tree/production/monitor-available-models-p_OKCQw5x> And if you *aren't* a Pipedream user, you should absolutely check it out!
