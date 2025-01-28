---
layout: post
title: "Using Generative AI to Help in Customer Service"
date: "2025-01-28T18:00:00"
categories: ["development"]
tags: ["generative ai", "python","pinecone"]
banner_image: /images/banners/cat_qa.jpg
permalink: /2025/01/28/using-generative-ai-to-help-in-customer-service
description: How generative AI and RAG can help answer support questions.
---

Ok, before I begin, let me be absolutely clear. I do not think AI can replace customer support. I do think it can *supplement* and help customer support however, and I'd like to share an example of what this could look like. Imagine your service has a customer service form or email address. Typically, you type in your question, send it off, and wait. But what if you could provide an AI generated answer immediately while the person waits? At worse it doesn't help. At best, it could be exactly what they need and the request could be terminated saving everyone time. Let's consider an example of this.

## Setting up the AI/RAG System

Let's start with the most complex part, the AI/RAG system. I say "most complex", but everything I'm about to show took about five or so minutes. I've been blogging about [Pinecone](https://pinecone.io) lately as it's incredibly easy to setup. You can see my [previous posts](https://www.raymondcamden.com/tags/pinecone) for more information, but the TLDR is:

* Sign up for a free account and log into their dashboard
* Create a new assistant
* Upload a PDF

And that's it. At that point, you can either use the dashboard to ask questions and test things out, or go immediately into code.

For my demo, I used a public domain copy of the Dungeons and Dragons basic rules. This is from 2018 so it isn't the most recent copy, but it's got a lot of great content and works really well for this demo. 

I made a new assistant named "dandd" (not a great name), uploaded the PDF, and did a quick test right inside Pinecone:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/email1.jpg" alt="Screenshot from PC dashboard" class="imgborder imgcenter" loading="lazy">
</p>

Note how the response has links to sources in multiple places. I've mentioned this before but that's super useful as a way to verify responses. 

At this point, we're done with that aspect. It's literally that simple. 

## Setting up the Workflow

For the workflow, I turned to [Pipedream](https://pipedream.com) yet again for my workflow. The entire thing took four steps. 

In the first step, I setup an email trigger. Pipedream gives me an email address and if anyone sends an email to it, the workflow will trigger. 

The second step is where I had to actually do work. I took the body of the email and simply passed it as a prompt to Pinecode. Here's that code:

```python
# pipedream add-package pinecone
# pipedream add-package pinecone-plugin-assistant
from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message
import os

def handler(pd: "pipedream"):

  pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
  assistant = pc.assistant.Assistant(assistant_name="dandd")

  print(pd.steps["trigger"]["event"]["body"]["text"])
  msg = Message(role="user",content=pd.steps["trigger"]["event"]["body"]["text"])
  resp = assistant.chat(messages=[msg])
  return resp.message.content
```

I wish it were more complex, honest. But that's all it needs. Do note that the first two lines there (the comments) are special Pipedream directives to help it correctly load in the libraries. 

The response from this will be the answer to the prompt based on the email.

The third step simply creates an HTML string. I want to wrap the result from Pinecone with language that *clearly* lets the user know that a real human is working on their question and the AI response is just a (hopefully) helpful response in the meantime:

```python
import markdown

def handler(pd: "pipedream"):

    html = f"""
<p>
Your support question has been received and will be answered as soon as possible. We took your
question and passed it to our expert AI system to see if we could quickly answer youir question:
</p>

<h2>AI Answer</h2>

{markdown.markdown(pd.steps["run_query"]["$return_value"])}

<p>
Please note we will still attempt to answer your question as soon as possible.
</p>
    """

    return html
```

Note that the response from Pinecone is Markdown so I parse it to HTML.

The final step is a bit special for this particular demo, a built-in Pipedream step that emails the owner of the account, me. Now, in a real world workflow, you would use one of the many email services available, like Sendgrid, to actually email the person who sent the email. For my needs it was ok to just send the email directly to me. 

## Results

So, did it work? Here's a few tests and responses. First I sent an email asking about classes that use melee weapons:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/email2.jpg" alt="Email response" class="imgborder imgcenter" loading="lazy">
</p>

I then asked how characters heal in a campaign - I honestly wasn't sure about this as I've never *really* played D and D:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/email3.jpg" alt="Email response" class="imgborder imgcenter" loading="lazy">
</p>

For my final test, I actually sent in a few questions:

```
1. do weapons take damage and can they break?

2. do spells have a recharge time where you can't cast them again?

3. what monsters use breath attacks?
```

For that final question, I didn't expect great detail as I know D and D has a separate manual just for monsters, but keep in mind that if I *had* that PDF, I could easily add it to my Pinecone assistant. Anyway, here's what I got back:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/email4.jpg" alt="Email response" class="imgborder imgcenter" loading="lazy">
</p>

That's it. In some customer service systems, an issue or request record is automatically created. I'd imagine a great improvement to this workflow would be to include a link so that if the user is happy with the response, they could click to confirm and close the request immediately. 

The source code for this workflow may be found here: <https://github.com/cfjedimaster/General-Pipedream-AI-Stuff/tree/production/untitled-workflow-1-28-2025-2-19-pm-p_A2ClORN>