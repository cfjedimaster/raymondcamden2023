---
layout: post
title: "Comparing Google's Image Generation Models"
date: "2025-04-08T18:00:00"
categories: ["development"]
tags: ["generative ai", "python"]
banner_image: /images/banners/cat_two_photos.jpg
permalink: /2025/04/08/comparing-googles-image-generation-models
description: Comparing the results of two generative AI image models
---

Last month I [blogged](https://www.raymondcamden.com/2025/03/14/generative-images-with-gemini-new-updates) about Gemini's new image generation support. Previously they had one model, [Imagen 3](https://deepmind.google/technologies/imagen-3/), but recently they added support to the Gemini Flash model as well. It's been on my to do list for a while now to do a proper comparison. While what follows isn't exhaustive at all, it does give you some quick examples of the differences. Before I begin, a reminder about the two models:

* The Gemini Flash model is best for generating images and text (in fact, you can't tell it *not* to generate text, but it won't always do so and you can ignore it).
* The Imagen model gives you better quality, control over the aspect ratio, and the ability to generate multiple images at once.

Finally, you can test Gemini's image support for free while Imagen costs. According to the current [pricing figures](https://ai.google.dev/gemini-api/docs/pricing), it costs 3 cents per image. This is pretty low, but I waited to do these comparisons until I got some free GCP credit as a Google Developer Expert. 

## The Code

While I don't expect anyone to actually use this, here's the code I used for my testing purposes. For the most part it's just, "do this prompt for Imagen and again for Gemini", but the Gemini call is done in a loop as you can't specify the number of results. I've got a different key for imagen so it uses different authentication.

```python
from google import genai
from google.genai import types
import os 
import sys
from slugify import slugify

"""
Defines the number of images. Imagen supports this, Gemini does not, so we loop for Gemini
"""
IMG_COUNT = 2

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
IMAGEN_API_KEY = os.environ.get('IMAGEN_API_KEY')

geminiClient = genai.Client(api_key=GEMINI_API_KEY)
imagenClient = genai.Client(api_key=IMAGEN_API_KEY)

if len(sys.argv) < 2:
  print('Pass a prompt to this script for testing.')
  sys.exit(1)
else:
  prompt = sys.argv[1]

def makeGeminiImage(prompt,idx):
	response = geminiClient.models.generate_content(
		model="gemini-2.0-flash-exp",
		contents=prompt,
		config=types.GenerateContentConfig(response_modalities=['Text', 'Image'])
	)

	for part in response.candidates[0].content.parts:
		if part.inline_data is not None:
			filename = f"output/gemini_{slugify(prompt)}_{idx+1}.png"
			print(f"saving {filename}")
			with open(filename, "wb") as file:
				file.write(part.inline_data.data)

def makeImagenImage(prompt,total):

	response = imagenClient.models.generate_images(
		model='imagen-3.0-generate-002',
		prompt=prompt,
		config=types.GenerateImagesConfig(
			number_of_images=total,
		)
	)

	# Open and display the image using your local operating system.
	for x,result in enumerate(response.generated_images):
		filename = f"output/imagen_{slugify(prompt)}_{x+1}.png"
		print(f"saving {filename}")
		result.image.save(filename)


# Do imagen first
print(f"Creating {IMG_COUNT} images with Imagen...")
makeImagenImage(prompt,IMG_COUNT)

print(f"Creating {IMG_COUNT} images with Gemini...")
for i in range(IMG_COUNT):
	makeGeminiImage(prompt,i)
```

When this runs, it creates two images each and uses a file name based on the model, slug, and what number result it was. You can find the source for this here: <https://github.com/cfjedimaster/ai-testingzone/blob/main/imagen/compare_gemini_imagen.py>

## The Results

Ok, so here are the prompts and results. For each image, I used Paint.net to resize the width to a max of 500 pixels wide. You don't have precise control over the size with either of the models, but you get consistent results back and could use server side code to resize. 

The first prompt is:

<blockquote>
a black cat under a clear moonlit sky, fireflies flit in the background
</blockquote>

First, Gemini:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-black-cat-under-a-clear-moonlit-sky-fireflies-flit-in-the-background_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-black-cat-under-a-clear-moonlit-sky-fireflies-flit-in-the-background_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

And now, Imagen:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-black-cat-under-a-clear-moonlit-sky-fireflies-flit-in-the-background_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-black-cat-under-a-clear-moonlit-sky-fireflies-flit-in-the-background_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>


Next up is:

<blockquote>
a polaroid photo of a cat under a christmas tree, set in the 1970s, the photo has a bit of damage
</blockquote>

First, Gemini:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-polaroid-photo-of-a-cat-under-a-christmas-tree-set-in-the-1970s-the-photo-has-a-bit-of-damage_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-polaroid-photo-of-a-cat-under-a-christmas-tree-set-in-the-1970s-the-photo-has-a-bit-of-damage_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

And now, Imagen:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-polaroid-photo-of-a-cat-under-a-christmas-tree-set-in-the-1970s-the-photo-has-a-bit-of-damage_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-polaroid-photo-of-a-cat-under-a-christmas-tree-set-in-the-1970s-the-photo-has-a-bit-of-damage_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

The quality differences here really stand out, although one could argue the lower quality Gemini results kinda work as well given the prompt for an old photo.

Next:

<blockquote>
a cartoon drawing of a cat dressed as a super hero shown flying across a cityscape towards the camera
</blockquote>

First, Gemini:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-cartoon-drawing-of-a-cat-dressed-as-a-super-hero-shown-flying-across-a-cityscape-towards-the-camera_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-cartoon-drawing-of-a-cat-dressed-as-a-super-hero-shown-flying-across-a-cityscape-towards-the-camera_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

And now, Imagen:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-cartoon-drawing-of-a-cat-dressed-as-a-super-hero-shown-flying-across-a-cityscape-towards-the-camera_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-cartoon-drawing-of-a-cat-dressed-as-a-super-hero-shown-flying-across-a-cityscape-towards-the-camera_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Next:

<blockquote>
a black and white inked artistic picture of a cat
</blockquote>

First, Gemini:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-black-and-white-inked-artistic-stylized-picture-of-a-cat_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-black-and-white-inked-artistic-stylized-picture-of-a-cat_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

And now, Imagen:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-black-and-white-inked-artistic-stylized-picture-of-a-cat_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-black-and-white-inked-artistic-stylized-picture-of-a-cat_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Almost done, promise. Next:

<blockquote>
a painting of a cat done in the style of money
</blockquote>

First, Gemini:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-painting-of-a-cat-done-in-the-style-of-monet_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-painting-of-a-cat-done-in-the-style-of-monet_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

And now, Imagen:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-painting-of-a-cat-done-in-the-style-of-monet_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-painting-of-a-cat-done-in-the-style-of-monet_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Notice how both Gemini results came out like a photo of a painting. I can see wanting that in some cases, but I much preferred the Imagen results here. A better prompt probably would have helped Gemini.

And finally, testing text generation:

<blockquote>
a comic style picture of a cat holding a sign that says "free cats"
</blockquote>

First, Gemini:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-comic-style-picture-of-a-cat-holding-a-sign-that-says-free-cats_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/gemini_a-comic-style-picture-of-a-cat-holding-a-sign-that-says-free-cats_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

And now, Imagen:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-comic-style-picture-of-a-cat-holding-a-sign-that-says-free-cats_1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/04/imagen_a-comic-style-picture-of-a-cat-holding-a-sign-that-says-free-cats_2.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Imagen "wins" again, although I've got no idea what the "POOOW" sign is about. 

Let me know what you think, and if you are using either of these models now, I'd also love to know. Leave me a comment below.