---
layout: post
title: "Generative Images with Gemini (New Updates)"
date: "2025-03-14T18:00:00"
categories: ["development"]
tags: ["generative ai", "python"]
banner_image: /images/banners/cat_blank_canvas.jpg
permalink: /2025/03/14/generative-images-with-gemini-new-updates
description: A look at updates to Google Gemini's Image Generation Capabilities
---

Back in January of this year, I [wrote up](https://www.raymondcamden.com/2025/01/30/generative-ai-images-with-gemini-and-imagen-an-introduction) my experience testing out Google's [Imagen 3](https://deepmind.google/technologies/imagen-3/) APIs to generate dynamic images. A few days ago, Google updated their support with new experimental support in Flash. I've been playing with this the last few days and have some code and samples to share with you, but before that, what exactly changed?

## Gemini and Imagen 3

There are now *two* different models, and different APIs, to generate images with Google's AI platform. The new one is Gemini 2.0 Flash Experimental and the previous one (the one covered in my [blog post](https://www.raymondcamden.com/2025/01/30/generative-ai-images-with-gemini-and-imagen-an-introduction)) is Imagen 3. 

Of course the next question is, why two, and what do you pick? The [docs](https://ai.google.dev/gemini-api/docs/image-generation#choose-a-model) do a great job of explaining the differences, and I'll share that here:

<blockquote>
If context is important, than Gemini 2.0 is the right choice. Gemini 2.0 is best for producing contextually relevant images, blending multimodal outputs (text + images), incorporating world knowledge, and reasoning about images. You can use it to create accurate, contextually relevant visuals embedded in long text sequences. You can also edit images conversationally, using natural language, while maintaining context throughout the conversation.
<p><p>
If image quality is your top priority, then Imagen 3 is a better choice. Imagen 3 excels at photorealism, artistic detail, and specific artistic styles like impressionism or anime. Imagen 3 is also a good choice for specialized image editing tasks like updating product backgrounds, upscaling images, and infusing branding and style into visuals. You can use Imagen 3 to create logos or other branded product designs.
</blockquote>

I'll also add that the Gemini modal has a free tier and Imagen does not. The price tag though is fairly small, 3 cents a pop. Not in this post, but next week I may follow up with a comparison and actually shell out a few cents to do so. (I kinda feel like I should get some credit though for GCP as I'm basically advocating for the API for free. ;)

Another important thing is that the Gemini API will always output text and images. Now, you can just ignore the text. You'll see me do that in demos and you'll want to keep that in mind when building your own examples. Speaking of...

## Text to Image

The simplest demo is just taking a text prompt and outputting an image. With a hard coded prompt, it's as simple as:

```python
from google import genai
from google.genai import types
import os

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

prompt = "A cat wearing a fedora."

response = client.models.generate_content(
	model="models/gemini-2.0-flash-exp",
	contents=prompt,
	config=types.GenerateContentConfig(response_modalities=['Text', 'Image'])
)

for part in response.candidates[0].content.parts:
	if part.inline_data is not None:
		filename = f"output/cat.png"
		print(f"saving {filename}")
		with open(filename, "wb") as file:
			file.write(part.inline_data.data)	
```

And here's the output. Note that for most of the results I'll show in this post, I've changed the size post-production. Gemini's image API model does *not* let you specify a size or aspect ratio. You *can* ask it to, for example, "generate a landscape photo of..." and it generally respects that, but keep in mind you may need to add it to your prompt yourself.

<p>
<img src="https://static.raymondcamden.com/images/2025/03/cat.png" alt="Generated cat picture." class="imgborder imgcenter" loading="lazy">
</p>

I'd call that pretty decent. And as always, I kinda skimped on the prompt there. The more detail you provide, the better results you'll get. Changing the prompt to:

```
A black long haired cat wearing a grey fedora. She is looking towards the camera.
```

Gives:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/cat2.jpg" alt="Generated cat picture, better prompt." class="imgborder imgcenter" loading="lazy">
</p>

You can make this generic by just checking for the prompt from the CLI:

```python
from google import genai
from google.genai import types
import os
import sys
from slugify import slugify

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

if len(sys.argv) < 2:
  print('Usage: python gemini_text_to_image.py "prompt"')
  sys.exit(1)
else:
  prompt = sys.argv[1]

response = client.models.generate_content(
	model="models/gemini-2.0-flash-exp",
	contents=prompt,
	config=types.GenerateContentConfig(response_modalities=['Text', 'Image'])
)

for part in response.candidates[0].content.parts:
	if part.inline_data is not None:
		filename = f"output/{slugify(prompt)}.png"
		print(f"saving {filename}")
		with open(filename, "wb") as file:
			file.write(part.inline_data.data)	
```

You can find this source here: <https://github.com/cfjedimaster/ai-testingzone/blob/main/imagen/gemini_text_to_image.py>

## Text to Image and Text

As described above, the Gemini model is going to include text along with image results, and that can be pretty powerful. One example prompt is recipe based, "Generate an illustrated recipe for a paella." I decided to build a demo around this by letting you pass the type of recipe via the command line and then generating a Markdown file that included the recipe and images. Here's that demo:

```python
from google import genai
from google.genai import types
import os
import sys
from slugify import slugify

if len(sys.argv) < 2:
  print('Usage: python recipe_tester.py "name of recipe"')
  sys.exit(1)
else:
  recipe = sys.argv[1]


client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

contents = [f'Generate an illustrated recipe for {recipe}. Include ingredients and cooking instructions.']

response = client.models.generate_content(
	model="models/gemini-2.0-flash-exp",
	contents=contents,
	config=types.GenerateContentConfig(response_modalities=['Text', 'Image'])
)

os.makedirs(f"output/{slugify(recipe)}", exist_ok=True)

recipeMD = f"""
# {recipe.title()} Recipe

"""

for x,part in enumerate(response.candidates[0].content.parts):
	if part.text is not None:
		recipeMD += f"""
{part.text}

"""
		#print("TEXT: " + part.text)
	elif part.inline_data is not None:
		
		filename = f"output/{slugify(recipe)}/img_{x}.png"
		print(f"saving {filename}")
		with open(filename, "wb") as file:
			file.write(part.inline_data.data)

		recipeMD += f"""
![Figure](img_{x}.png)

"""		
with open(f"output/{slugify(recipe)}/recipe.md", "w") as file:
	file.write(recipeMD)

print(f"Done, saved to output/{slugify(recipe)}/recipe.md")
```

I didn't put a lot of effort into the generated Markdown. I could have even converted it to HTML at the end. But it basically takes the output and appends text as is, and images as an image with Markdown code. 

The results from this was... hit or miss. The Google example of paella seemed to work well. But I tried multiple different cookie recipes and it failed *really* badly. I'm not sure why. In my most recent test it was able to generate ingredients, but disregarded the request for actual cooking instructions. I then tried chicken and sausage gumbo, and it was... ok. You can see it below (and here's a direct [link](https://static.raymondcamden.com/images/2025/03/chicken-and-sausage-gumbo/recipe.html)).

<iframe src="https://static.raymondcamden.com/images/2025/03/chicken-and-sausage-gumbo/recipe.html" height="500px" width="100%"></iframe>

Some of the formatting appears a bit off, and the roux doesn't look quite thick enough, but I'd probably still eat it. 

As a followup (next week though) I'm going to take another stab at this using a JSON schema to see if I can better shape the results. 

You can find this demo here: <https://github.com/cfjedimaster/ai-testingzone/blob/main/imagen/recipe_tester.py>

## Editing Images

Another interesting aspect of the API is the ability to give it a source image and ask for an edit. As an example, I gave it this source:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/rar1.jpg" alt="Picture of me with weird glasses." class="imgborder imgcenter" loading="lazy">
</p>

And asked Gemini to replace the glasses with something more serious. 

<p>
<img src="https://static.raymondcamden.com/images/2025/03/ray_fixed.jpg" alt="Picture of me with weird glasses." class="imgborder imgcenter" loading="lazy">
</p>

The glasses are slightly big for me, but honestly I think it did a great job. The code for this simply involves adding a file upload and passing it to the model:

```python
from google import genai
from google.genai import types
import os
from slugify import slugify

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

file_ref = client.files.upload(file="ray1.jpg")

contents = ["Edit this image to replace the glasses with something more serious.", file_ref]

response = client.models.generate_content(
	model="models/gemini-2.0-flash-exp",
	contents=contents,
	config=types.GenerateContentConfig(response_modalities=['Text','Image'])
)


for part in enumerate(response.candidates[0].content.parts):
	if part.inline_data is not None:

		filename = f"output/ray_fixed_{x}.png"
		print(f"saving {filename}")
		with open(filename, "wb") as file:
			file.write(part.inline_data.data)
```

## Stylish Images

One of the features of Adobe Firefly (and, helpful reminder, you still can't sign up for it and there's no way to trial it, so, there ya go) is the ability to provide a source image as a style reference. This is kinda cool as you can use a generic image with certain colors and other elements, present a prompt, and get a result that looks inspired by the result. 

I tried this with Gemini and was impressed. First, here is my source style image:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/purple_fire.jpg" alt="Purple fire" class="imgborder imgcenter" loading="lazy">
</p>

And here's my code. It's pretty similar to the last one except for my prompt:

```python
from google import genai
from google.genai import types
import os
from slugify import slugify

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

file_ref = client.files.upload(file="purple_fire.jpg")

contents = ["Using this image as a source, make a picture of a cyberpunk cat holding a futuristic laptop.", file_ref]

response = client.models.generate_content(
	model="models/gemini-2.0-flash-exp",
	contents=contents,
	config=types.GenerateContentConfig(response_modalities=['Text','Image'])
)

for part in enumerate(response.candidates[0].content.parts):
	if part.inline_data is not None:

		filename = f"output/style_demo_{x}.png"
		print(f"saving {filename}")
		with open(filename, "wb") as file:
			file.write(part.inline_data.data)
```

And here's the result: 

<p>
<img src="https://static.raymondcamden.com/images/2025/03/style_demo.jpg" alt="Purple cyberpunk cat" class="imgborder imgcenter" loading="lazy">
</p>

Again, I think this is really well done. You can grab this demo here: <https://github.com/cfjedimaster/ai-testingzone/blob/main/imagen/style.py>

## Logo Inclusion

While talking to some folks about these demos, a Googler also suggested trying out logos. My first attempt didn't work well at all and I believe it's because the logo had a transparency. When I removed it and made it use a simple white background (which I had to look up how to do), it worked a lot better. 

Using this image:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/empire2.jpg" alt="Empire logo" class="imgborder imgcenter" loading="lazy">
</p>

And this prompt:

```
Using this image as a logo, apply it to a flag waving by a drab government building. The flag should have nothing on it but the logo itself.
```

I got this:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/logo_demo.jpg" alt="Result of logo demo" class="imgborder imgcenter" loading="lazy">
</p>

I'm not going to share the entire code for this demo as the only change was the input and prompt, but you can find it here: <https://github.com/cfjedimaster/ai-testingzone/blob/main/imagen/logo.py>

## Thoughts?

I'm pretty impressed by the results in general, although I'm still curious as to what went wrong with the cookie recipes. I'm going to dig into these demos a bit more next week, but don't forget you can use this <strong>right now, for free</strong>, with Google Gemini. Let me know what you think in the comments below. 