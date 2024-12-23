---
layout: post
title: "Automating Object Detection with Google Gemini GenAI and Pipedream"
date: "2024-12-23T18:00:00"
categories: ["development"]
tags: ["generative ai", "python","pipedream"]
banner_image: /images/banners/cat_camera.jpg
permalink: /2024/12/23/automating-object-detection-with-google-gemini-genai-and-pipedream
description: A look at building a general purpose object detection routine with generative AI.
---

For my last technical post of the year (although I can't promise I'll stop blogging!), I wanted to share an interesting workflow I built using [Google Gemini](https://ai.google.dev/) and [Pipedream](https://pipedream.com). The idea was somewhat simple - how difficult would it be to build a "general purpose" workflow to look for objects in images and trigger an alert if certain things were found. Here's what I was able to build.

## Step One - Image Input

In my mind, I imagined this workflow would be tied to some service that was either streaming in video or generating still images. You could image a security camera posting new pictures every 30 seconds or so, or some other system that takes a picture at a regular interval. In order to simplify things for this particular demo, I built the workflow to listen for a POST that includes an image. In Pipedream, that meant a URL trigger (Pipedream gives you a unique URL) and I used Postman to test. 

For the trigger, I selected "Return HTTP 204 No Content" as a response, as the service sending in the data shouldn't need to wait for the workflow to finish, nor care what happens. It's just sending in the picture. 

On the Postman side, I did have to do one small tweak. As [documented](https://pipedream.com/docs/limits#http-request-body-size), if your payload is over 512KB (easy with images), you will get a `413 Payload Too Large` error, *unless* you pass in a header, `x-pd-upload-body: 1`. That's easy enough on the Postman side. 

## Step Two - Get the Image

The next step is a code step that attempts to get the image sent to the service. I look for it in the trigger data, and if it exists, download it to `/tmp`, after a few sanity checks on the content type. Here's the Python code I used for this step:

```python
import requests 

def handler(pd: "pipedream"):

  #first, did we have an image?
  if "raw_body_url" not in pd.steps["trigger"]["event"]["body"]:
    pd.flow.exit("No media uploaded to event")

  # what type was it?
  mediaType = pd.steps["trigger"]["event"]["headers"]["content-type"]

  if mediaType.endswith("png"):
    tmpFile = "/tmp/file.png"
  elif mediaType.endswith("jpg"):
    tmpFile = "/tmp/file.jpg"
  elif mediaType.endswith("jpeg"):
    tmpFile = "/tmp/file.jpeg"
  else:
    return pd.flow.exit(f"Invalid content type passed, {mediaType}")

  with requests.get(pd.steps["trigger"]["event"]["body"]["raw_body_url"], stream=True) as response:
    # Check if the request was successful
    response.raise_for_status()
 
    # Open the new file /tmp/file.html in binary write mode
    with open(tmpFile, "wb") as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)
          
    return { "path": tmpFile} 
```

Part of this came right from the Pipedream docs which were real helpful. Note that the step ends with returning the file.

## Step Three - Upload to Gemini

The next step handles uploading the file to Gemini via the Files API. This is a temporary file storage system provided by Google to let you build multimodal prompts with Gemini. Here's that code:

```python
# pipedream add-package google-generativeai
import google.generativeai as genai

def handler(pd: "pipedream"):

  print(pd.steps["get_image"]["$return_value"]["path"])
  # Couldn't return the object directly, not serializable
  file = genai.upload_file(pd.steps["get_image"]["$return_value"]["path"])
  # workaround - return the name, refetch the file ob in the next step
  return file.name
```

Two things to note. First, notice the comment on top. This isn't always required, but helps Pipedream grab the right package from PyPi. Again, this is documented: [Use PyPI packages with differing import names](https://pipedream.com/docs/code/python/import-mappings)

The last thing to note was a bit more trickier. I had attempted to return the result from the `upload_file` operation, but it wasn't a simple object and couldn't be serialized by Pipedream. Returning the name though let me handle this later in the workflow, as you'll see in a bit.

## Step Four - Item Detection

Alright, now for the magic. We need to ask Gemini to try to identify the items in the picture. To handle this, I did a few things:

* I used a system instruction to specify what I wanted Gemini to do.
* I used JSON schema to lock down the result to an array of strings. I had not used JSON Schema in Python before, but I did my initial testing in AI Studio and it's handy `Get Code` button actually generated exactly what I needed!
* I used the Files API to get the file I uploaded in the last step. Now... I could have skipped this step if I just combined action with the previous one. I *try* to keep my Pipedream workflows as simple as possible, but in this case, it may have been better to simply combine this and the last step. Obviously, this was more a 'philosophical' decision on my part and you should feel free to do it the way that makes sense to you.

Here's the complete code for this:

```python
# pipedream add-package google-generativeai
import google.generativeai as genai
# pipedream add-package pip install google-ai-generativelanguage
from google.ai.generativelanguage_v1beta.types import content

import os 
import json 

def handler(pd: "pipedream"):

  generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_schema": content.Schema(
      type = content.Type.OBJECT,
      properties = {
        "response": content.Schema(
          type = content.Type.ARRAY,
          items = content.Schema(
            type = content.Type.STRING,
          ),
        ),
      },
    ),
    "response_mime_type": "application/json",
  }

  # Ok, technically not a new file, just a new file object :) 
  newFile = genai.get_file(pd.steps["upload_to_gemini"]["$return_value"])
  
  model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
    system_instruction="Given an image, you return a list of items found in the image. You sort the results by the items you have the highest confidence in.",
  )

  result = model.generate_content([newFile,"what's in this photo"])
  print(result)
  return json.loads(result.text)
```

## Steps Five and Six - Check for My 'Target'

The fifth step is the most important. In this step, I take a list of things I care about, the "targets", and see if any of the targets match what was found by Gemini:

```python
def handler(pd: "pipedream"):

  # Targets is a list of things we care about
  targets = ["dog","cat","dogs","cats"]
  matches = []
  foundMatch = False 

  for item in pd.steps["item_detection"]["$return_value"]["response"]:
    if item in targets:
      foundMatch = True
      matches.append(item)

  return {"match": foundMatch, "matches": matches }
```

Note that it's possible to match multiple items in one picture and the code correctly handles that. 

The next step simply exits if nothing is found. So, going up to what I said earlier about keeping my Pipedream workflow simple, this too could have been in the previous code block. I just felt it was nicer on it's own:

```python
def handler(pd: "pipedream"):

  if pd.steps["check_for_targets"]["$return_value"]["match"] == False:
    return pd.flow.exit("Ended because no match.")    
```

## Step Seven and Eight - Emailing the Result

Ok, if we get to this part of the workflow, we've got a match. For notification purposes, I went the easy route, using an email. This is done in two steps. The first step creates an HTML string that is then passed to the final step, a 'built-in' Pipedream step that emails the owner of the workflow. This is handy as no email API is required.

Here's the HTML string I came up, and it's pretty boring. I could have included a date and time stamp, but I figured the email itself would have that. I could have even looked for GPS metadata in the picture and included that, but I kinda figure you would know where the images are coming from.

```python
def handler(pd: "pipedream"):

  email = f"""
<p>
Matches were found against your image. Matches were found on these targets:<br>
<strong>{', '.join(pd.steps["check_for_targets"]["$return_value"]["matches"])}</strong>
</p>

<h2>Image</h2>
<img src="{pd.steps["trigger"]["event"]["body"]["raw_body_url"]}" width="400">
  """
    
  return {"email": email}
```

One small thing I don't like about this. You can see I include the image in the email. This is using the fact that Pipedream uploaded the image to temporary file storage. However, the link will *not* last long, which means the email itself will be broken eventually. 

In this case, I'd probably use a 'real' email API, like Sendgrid, and base64 encode the image so it doesn't expire. For now though, I kept it simple. 

## Results

You may find this shocking, but I've got a few pictures of cats at my disposal, so it was easy to test with Postman. When I sent an image with a cat, I quickly got an email alert:

<p>
<img src="https://static.raymondcamden.com/images/2024/12/email.jpg" loading="lazy">
</p>

The complete source code for this workflow may be found here: <https://github.com/cfjedimaster/General-Pipedream-AI-Stuff/tree/production/identify-and-alert-on-cats-p_gYC9o8Y>. If I don't completely lose myself into the holidays, I'm going to make a video version of this as well! 