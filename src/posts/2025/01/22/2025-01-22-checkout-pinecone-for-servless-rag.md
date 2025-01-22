---
layout: post
title: "Checkout Pinecone for Serverless RAG"
date: "2025-01-22T18:00:00"
categories: ["development"]
tags: ["generative ai", "python","pinecone"]
banner_image: /images/banners/cat_pinecone1.jpg
permalink: /2025/01/22/checkout-pinecone-for-serverless-rag
description: Pinecone offers a super easy API for building RAG applications.
---

In my quest this year to expand my AI knowledge outside of Gemini, I was recently introduced to [Pinecone](https://www.pinecone.io/). Pinecone provides the ability to create and setup a vector database via serverless, which by itself is darn handy, but it also provides a *super* convenient wrapper called their Assistant that makes it even easier. I've played with this a bit over the past few days and thought I'd share some of what I found. Before I do that though, check out their [pricing](https://www.pinecone.io/pricing/) information to see if it makes sense. What made me happy is that the "Starter" level absolutely let me kick the tires and test things out which I really appreciate. To do this day I've yet to do any real demos with ChatGPT because there's no free developer tier. 

I started my look at Pinecone going through the [database quickstart](https://docs.pinecone.io/guides/get-started/quickstart), which has you creating vectors from ad hoc data. As I've only really worked with files and RAG, seeing this, raw (not the best term) was helpful. The guide then has you create the index, upset the vectors (upsert is a fancy way of saying, "add this information to the storage system if it doesn't already exist", just FYI!), create a vector of a query, and then execute it.

All of this was 100% new to me, and honestly, I didn't understand it completely, but it mostly made sense and considering I did it all from a bit of Python code, it was pretty impressive. 

I then took a look at [Pinecone Assistant](https://docs.pinecone.io/guides/assistant/understanding-assistant), which takes all of the above and simplifies it quite a bit. It lets you create an assistant, associate files with it, and then query it. There is an excellent [quick start](https://docs.pinecone.io/guides/get-started/assistant-quickstart) which breaks down the steps into:

* Creating the assistant
* Uploading files
* Sending queries

From what I can tell, this can only be done via their Python SDK, but looking at the [reference](https://docs.pinecone.io/reference/api/2025-01/assistant/list_assistants) REST information, I don't think it would be difficult at all in Node.js or other languages. Also, and this is cool, their dashboard lets you do all of the above via the web, so at minimum, you could handle the setup and seeding aspect via the web and not code if you want. Here's an example assistant based on an Adobe security PDF I uploaded. I was able to ask the question right in the tool, see the response, and note that it backs up the responses with references:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/pc1.jpg" alt="Screenshot from Pinecone web UI" class="imgborder imgcenter" loading="lazy">
</p>

Ok, so what would a 'real world' (ish!) type implementation look like? I built a demo with two scripts. The first script is responsible for setup and in theory, is only run once, and again, could have been done on the web as well, but I was curious as to how much work it would be to create a script for this process I could, in theory, check into source, use in the future, etc. 

I began by importing my libraries, and defining the name of my assistant:

```python
from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message
import os, sys, time

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])

assistant_name = "shakespeare-assistant"
```

Next, I ask for a list of assistants, see if mine exists, and if not, create it:

```python
# Step one, figure out if we need to make the assistant

assistants = pc.assistant.list_assistants()
matches = [x for x in assistants if x.name == assistant_name]
if not matches:
	print(f"Creating assistant {assistant_name}")

	assistant = pc.assistant.create_assistant(
		assistant_name, 
		instructions="Answer for readers of a high school level. Use American English spelling and vocabulary.", 
		timeout=30 
	)
else:
	print(f"{assistant_name} already exists")
```

I probably should have moved my `instructions` into a variable as well so it's easier to update. Ok, for the next step, I want to see if the assistant is actually ready. It does take a few seconds to setup, and their SDK/API makes it easy to check, so I shouldn't be lazy, right?

```python
# Step two, check the status of the assistant to ensure its status is Ready
ready = False

while not ready:
	assistant = pc.assistant.describe_assistant(assistant_name)
	if assistant.status == "Ready":
		print(f"Assistant {assistant_name} is ready.")
		ready = True
	else:
		if assistant.status == "Failed":
			print("Assistant failed to initialize.")
			sys.exit(1)
		else:
			print(f"Assistant status is {assistant.status}. Waiting for Ready.")
			time.sleep(5)

# Get the assistant now that it's done
assistant = pc.assistant.Assistant(assistant_name)
```

I assume that makes sense, but I want to call out that last line. In a bit, I'm going to need to inspect what's in the assistant, so that last line grabs a reference to it.

Alright, the next part simply looks for PDFs in a folder, in this case, the local folder:

```python
pdfs = []
for file in os.listdir("./"):
	if file.endswith(".pdf"):
		pdfs.append(file)

print(f"Found {len(pdfs)} PDFs we may need to add to our index.")
```

Now that we have a list of PDF files, we can compare the local list to what's in the assistant, and upload as necessary:

```python
currentfiles = assistant.list_files()
for file in pdfs:
	matches = [x for x in currentfiles if x.name == file]
	if not matches:
		print(f"Uploading {file}")
		response = assistant.upload_file(
			file_path=file,
			timeout=None
		)
	else:
		print(f"{file} already uploaded")
```

Now, at this point, I stopped in my script, but correctly noted:

```python
# At this point, setup is done. We _could_ add a step to loop until Available, but in theory, btw we get 
# to the next step, it's not a concern. Maybe I'm being lazy too. ;)
print("Script done, may need to wait for PDFs to process.")
```

It wouldn't be *too* hard to go ahead and loop over each file and ensure it's ready, but the upload/processing happened so quickly, it felt like overkill. At the end, I'll share links to the complete file.

For the next bit, I just wrote a little script that let me pass prompts at the CLI:

```python
from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message
import os, sys

if len(sys.argv) < 2:
  print("Pass your prompt as an argument.")
  sys.exit(1)
else:
  prompt = sys.argv[1]

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])

assistant_name = "shakespeare-assistant"

assistant = pc.assistant.Assistant(assistant_name)
```

After my setup code, here's how simple it is to pass the query:

```python
msg = Message(role="user", content=prompt)
resp = assistant.chat(messages=[msg])
```

If you scroll down to the sample output in [step five](https://docs.pinecone.io/guides/get-started/assistant-quickstart#5-chat-with-the-assistant) in the quickstart, you can see a sample of what's returned. It's quite extensive, but what I care about is the actual result:

```python
print(resp.message.content)
```

And the citations, which includes both the file name and the specific pages. This part is *so* important to help verify the results. (As a quick aside, don't forget you can link to a specific page in a PDF, I demonstrated this [here](https://www.raymondcamden.com/2024/12/17/adding-pdfs-to-your-webpage-without-javascript#getting-dynamic)). 

```python
print("Citations:")

for citation in resp.citations:
	
	for x,ref in enumerate(citation["references"]):
		print(f"Reference {x+1} - pages {ref['pages']} in file {ref['file']['name']}")
```

My PDFs consist of three Shakespeare plays, so I first tried this:

```bash
python assistant_demo2.py "which play should I read if I'm into romance?"
```

And got:

<div style="background-color: #c0c0c0; padding: 10px;margin-bottom:10px">
<p>
If you are into romance, you might enjoy reading "Romeo and Juliet." This play is about two young lovers, Romeo and Juliet, who come from feuding families, the Montagues and the Capulets. Despite their families' hatred for each other, they fall in love at first sight and quickly decide to get married. Their love story is filled with passion, secret meetings, and tragic events, making it one of the most famous romantic tales in literature.
</p>
<p>
Another option is "A Midsummer Night's Dream," which also has romantic elements. This play involves four young Athenians who are caught in a complicated love tangle. Lysander and Demetrius both love Hermia, who loves Lysander, while Helena loves Demetrius. Their romantic adventures take them into a magical forest where fairies interfere with their affections, leading to humorous and enchanting situations.
</p>
<p>
Both plays offer unique takes on romance, so you might enjoy reading either one depending on whether you prefer a tragic love story or a more whimsical and comedic one.
</p>

Citations:<br>
Reference 1 - pages [7] in file romeo-and-juliet_PDF_FolgerShakespeare.pdf<br>
Reference 2 - pages [7] in file romeo-and-juliet_PDF_FolgerShakespeare.pdf<br>
Reference 1 - pages [6] in file a-midsummer-nights-dream_PDF_FolgerShakespeare.pdf<br>
</div>

If you want, you can grab my complete scripts here, <https://github.com/cfjedimaster/ai-testingzone/tree/main/pinecone>, and as I said, I'm really impressed with how easy this was to setup. I'll probably be playing with it more.