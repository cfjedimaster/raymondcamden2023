---
layout: post
title: "Generative AI Images with Gemini and Imagen - an Introduction"
date: "2025-01-30T18:00:00"
categories: ["development"]
tags: ["generative ai", "python"]
banner_image: /images/banners/gemini_painting.jpg
permalink: /2025/01/30/generative-ai-images-with-gemini-and-imagen-an-introduction
description: A look at new APIs coming soon to Google Gemini, Image Generation
---

I've been waiting for this to launch for a few days now, and while technically this isn't quite yet available in Gemini, only [Vertex](https://cloud.google.com/vertex-ai?hl=en), it should be testable in Gemini in the very short term. You can now use Google's APIs to generate *really* high quality images via their [Imagen 3](https://deepmind.google/technologies/imagen-3/) technology. I've got a few blog posts planned that will demonstrate these features (and from what I've been told, even more powerful stuff is coming), but I thought I'd start off today with a simple short example. 

{% comment %}
<p>
<img src="https://static.raymondcamden.com/images/2025/01/ig1.jpg" alt="Prompt was, make me a picture of a cat, and a cat picture was indeed created" class="imgborder imgcenter" loading="lazy">
</p>
{% endcomment %}

To begin, and remember this may not available just yet, take a look at the docs, [Imagen 3 in the Gemini API](https://ai.google.dev/gemini-api/docs/imagen). 

First, let's consider the sample code, that I'm going to modify a bit and I'll explain why in a bit:

```python
from google import genai
from google.genai import types

client = genai.Client(api_key='GEMINI_API_KEY')

response = client.models.generate_image(
    model='imagen-3.0-generate-002',
    prompt='Fuzzy bunnies in my kitchen',
    config=types.GenerateImageConfig(
        negative_prompt= 'people',
        number_of_images= 1,
        include_rai_reason= True,
        output_mime_type= 'image/jpeg'
    )
)

response.generated_images[0].image.save('./result.jpg')
```

I've been doing GenAI stuff for over a year and I continuously find myself surprised at just how short and simple the code is. That's because, as we're all learning now, so much is driven by the prompt. The example above works, but should be a lot more detailed. In the Imagen docs, they show a `show()` method which I *believe* will run the native OS viewer for a file type, but I couldn't get it to work in Windows WSL so I just saved the result. 

The parameters above are a subset and while the rest are documented, as a quick overview you can:

* Specify a prompt, of course ("a cat with a top hat")
* Specify a negative prompt, describing what you *don't* want to see ("dogs")
* The number of images, from 1 to 4.
* For size, unfortunately you can only specify aspect ratios (1:1, 3:4, 4:3, 9:16, 16:9), but you could resize images smaller later. In my testing, the default 1:1 aspect ratio generated an image at 1024x1024.
* Safety related settings, which include a filter level on when to filter out possible bad images, and wether or not people generation is allowed. Right now, you cannot generate pictures of children. 

As an example, given this prompt, "Fuzzy bunnies in my kitchen with a chef watching over them", I got:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/ig2.jpg" alt="Photo of a chef in a blue suit in a kitchen, with a bunch of white bunnies" class="imgborder imgcenter" loading="lazy">
</p>

I took the sample code, and created a more generic script that lets you pass a prompt at the command line. It takes the prompt and for each result, slugifies the prompt into a filename and saves it for you so you can see the options. Here's that complete code:

```python
from google import genai
from google.genai import types

import os 
import sys
from slugify import slugify

if len(sys.argv) < 2:
  print('Usage: python test_imagen.py "prompt"')
  sys.exit(1)
else:
  prompt = sys.argv[1]

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

model_name = "imagen-3.0-generate-002"

result = client.models.generate_image(
    model=model_name,
    prompt=prompt,
    config=types.GenerateImageConfig(
        number_of_images=4,
        output_mime_type="image/jpeg",
        safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
        person_generation="ALLOW_ADULT",
        aspect_ratio="4:3"
    )

)
# Open and display the image using your local operating system.
for x,result in enumerate(result.generated_images):
  filename = f"output/{slugify(prompt)}_{x+1}.png"
  print(f"saving {filename}")
  result.image.save(filename)
```

You can find this in the repo folder I'll share later, but at the command line, I tried:

```
python test_imagen.py "a stylized antique photo of a crescent moon with a cat"
```

And here's two of the results:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/ig3.jpg" alt="Generated image with a cat and moon" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/01/ig4.jpg" alt="Generated image with a cat and moon (2)" class="imgborder imgcenter" loading="lazy">
</p>

I think I could have done a bit better with the prompt to get more of an "old style" photo look. I tried another prompt, "a picture of a cat by a christmas tree in the style of an old color polaroid showing the age of the picture", and the result was much better:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/ig5.jpg" alt="Generated image with a cat and xmas tree, styled to look older" class="imgborder imgcenter" loading="lazy">
</p>

Not to beat a dead horse but, yeah, the prompt *really* matters. 

Right now, there's no Node SDK support, but the REST API is pretty easy. Here's the same sample in Node.js for you:

```js
import slugify from '@sindresorhus/slugify';
import fs from 'fs'; 

const API_KEY = process.env.GEMINI_API_KEY;

if(process.argv.length < 3) {
	console.log('Usage: node node_demo.mjs "prompt"');
	process.exit(1);
}

let prompt = process.argv[2];

let body = {
	instances: [
		{ prompt },
	],
	parameters: {
		aspectRatio:'4:3'
	}
};

let model_name = 'imagen-3.0-generate-002';
let resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model_name}:predict?key=${API_KEY}`, {
  method: 'POST',
  headers: {
	'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
});

let result = await resp.json();
for(let i=0; i<result.predictions.length; i++) {
	let ext = '.png';
	if(result.predictions[i].mimeType == 'image/jpeg') {
		ext = '.jpg';
	}

	let filename = `output/${slugify(prompt)}_${i+1}${ext}`;
	let buffer = Buffer.from(result.predictions[i].bytesBase64Encoded, 'base64');
	fs.writeFileSync(filename, buffer);
	console.log(`Saving ${filename}`);
}
```

I imagine the Node SDK will eventually make this much simpler, but that's not a lot of code for sure. 

So what next? As I said, I plan on blogging a lot more about this in the next couple of days as I've got some good ideas about some powerful stuff that can be done with this. I *strongly* recommend reading the [Imagen prompt guide](https://ai.google.dev/gemini-api/docs/imagen-prompt-guide) as well to get a lot of good ideas on how to best craft your prompts for the API. 

You can find the source code above here as well, <https://github.com/cfjedimaster/ai-testingzone/tree/main/imagen>. As an aside, I used to use Firefly to generate my blog post headers. I modified my test script above in a new file, [make_banner.py](https://github.com/cfjedimaster/ai-testingzone/blob/main/imagen/make_banner.py), to specify the aspect ratio I want. The only thing missing from that script is the resize down to my normal size which I'll add soon.