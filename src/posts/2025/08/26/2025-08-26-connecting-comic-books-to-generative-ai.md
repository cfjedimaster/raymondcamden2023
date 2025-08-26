---
layout: post
title: "Connecting Comic Books to Generative AI"
date: "2025-08-26T18:00:00"
categories: ["development"]
tags: ["generative ai","python"]
banner_image: /images/banners/comicbooks.jpg
permalink: /2025/08/26/connecting-comic-books-to-generative-ai
description: Parsing comic books and sending them for generative AI summaries
---

I've blogged quite a few times about electronic comic books (most recently earlier this month when I demonstrated a [comic book reader built in BoxLang](https://www.raymondcamden.com/2025/08/05/building-a-comic-book-reader-in-boxlang)). I've been reading comics pretty much my entire life and enjoy building development projects that work with the various file types associated with comics. As a reminder, these typically fall into two categories:

* cbr - A RAR file of scanned images
* cbz - A zip file of scanned images

This week I was wondering - given that GenAI tools are pretty good at understanding images - how well could a GenAI system take a *set* of images, in order, and understand the context of the story behind them. I decided to give it a shot and honestly, I'm pretty impressed by the results.

## How this works - high level

My demo assumes a folder of comic book files and will do the following:

* Scan the folder for `.cbr` and `.cbz` files
* For each, look for a corresponding file with the extension `.txt`, this represents the already generated summary and a comic we can skip
* If there isn't a summary, use the appropriate code to read in the archive
* For each image, upload to Gemini's Files API to temporary store the image
* Send a prompt and the list of images and ask for a summary
* Finally, save the summary to the file system

As usual, I'm making use of the [Google Gemini API](https://ai.google.dev/gemini-api/docs) for my demo. 

OK, let's get into the code.

## Setup

My script begins by importing my dependencies and setting some initial values:

```python
from google import genai
import os 
import io
import zipfile 
import rarfile
import sys

client = genai.Client()

prompt = """
You analyze a set of images from a comic book in order to write a summary of the comic in question. You will be given a set of images, in order, representing each page of the comic book. For each page, you will attempt to determine if it's an ad, and if so, ignore it. When done, you should return a one paragraph summary of the comic.
"""

comic_dir = "./comics"
```

The prompt's job is to setup the task based on the images that will follow. It describes how they are in order and also warns the model that some pages can be advertising. Finally, a one paragraph summary should be enough of a summary for a comic book. 

The last value, `comic_dir`, simply points to the folder of comics.

A note on `rarfile`. As always, RAR support in any language is a royal pain in the rear. For Python, I used the [rarfile](https://rarfile.readthedocs.io/index.html) module which unfortunately *also* requires a CLI installed in your environment as well. For me, this was `unrar` for Ubuntu. Once done it worked fine, but keep in mind it's not just a module install. I'll also point out, and I didn't handle it in this demo, you may find comic books using the `.cbr` extension that are actually zip files. You could try/catch a zip call to flag those. (I did not - sorry.) 

## What comics need processing?

Now I'll get the comics and figure which need to be worked on:

```python
filtered_files = [
    file
    for file in os.listdir(comic_dir)
    if (file.endswith("cbr") or file.endswith("cbz")) and os.path.isfile(os.path.join(comic_dir, file))
]

for comic in filtered_files:
	# check for an existing summary
	summary = f"{os.path.join(comic_dir, os.path.splitext(comic)[0])}.txt"

	gemini_files = []

	if os.path.exists(summary):
		print(f"Summary for {comic} already exists.")
		continue
```

As you can see, my logic to figure out the `summary` simply relies on the existing name with a `.txt` extension instead. 

## Working with Archives and Images

Next, my script needs to split off based on the file type. Remember what I said above about how sometimes `.cbr` files are actually zip - I'm just not going to worry about that for now.

```python
print(f"Summarizing comicbook {comic}")

if comic.endswith("cbz"):
	with zipfile.ZipFile(os.path.join(comic_dir,comic),'r') as zip:
		files = zip.namelist()
		# todo - check and see if we need more image extensions
		images = [file for file in files if (file.endswith("jpg") or file.filename.endswith("jpeg"))]
		for index,image in enumerate(images):
			with zip.open(image, 'r') as imgbin:
				print(f'Uploading image {image} ({index+1} of {len(images)})')
				gemini_files.append(client.files.upload(file=io.BytesIO(imgbin.read()), config={"mime_type":"image/jpeg"}))

elif comic.endswith("cbr"):
	rf = rarfile.RarFile(os.path.join(comic_dir,comic))
	images = [file.filename for file in rf.infolist() if (file.filename.endswith("jpg") or file.filename.endswith("jpeg"))]

	for index,image in enumerate(images):
		print(f'Uploading image {image} ({index+1} of {len(images)})')
		gemini_files.append(client.files.upload(file=io.BytesIO(rf.read(image)), config={"mime_type":"image/jpeg"}))
```

In both cases, I get a list of files in the archive, filter to JPGs, and then upload to Gemini via the Files API. These results are appended to an array. Note that I skip the file system completely, streaming right from the archive to Gemini.

### Perform the Summary

Last but not least is actually performing the AI analysis:

```python
prompt_contents = [prompt] + gemini_files
response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt_contents)
with open(summary,"w") as file:
	file.write(response.text)

print(f"Summary done and saved to {summary}")
```

The Gemini Python SDK lets you pass an array of items to the prompt so I simply create a new array based on my prompt and the uploads. I pass that and save the result to my expected summary filename. I don't check for errors because I'm an S Tier programmer and that's ok. (Ok, it isn't, you should definitely check for errors here.)

## The Results

So I don't necessarily expect you to read the comics, but are the sample results. First are two very old, public domain comics:

<strong>/Strange_Journey_001__1957_09.Americas_Best__noads.narfstar_.txt</strong>

```
This comic book features four distinct tales. "The Phantom Express" 
follows Vance Jackson, a man tormented by his conscience after 
plotting with his partner, Bill Porter, to steal securities. He 
experiences a vivid, nightmarish "dream" of the Phantom Express
 and his partner's betrayal, which he interprets as a warning; 
 however, he soon discovers that Bill was awake and cunningly 
 orchestrated the entire charade to trick Vance into confessing, 
 then absconded with the stolen funds, leaving Vance to take the fall. 
 In "The Bedeviled Vault!", Inspector Curan investigates a bizarre 
 bank robbery involving a goat found in a vault. He uncovers an 
 intricate scheme by Vice-President Thornton Hartshorn and his twin 
 brother, Jim Watts, who used the goat as a diversion while trying to 
 frame Hartshorn as an innocent bystander, only for their "simple" 
 plan to unravel. "Ballast of Gold" recounts the tragic true story 
 of the steamship "Marine" and its ill-fated voyage in 1867, laden 
 with two million dollars in gold and over a thousand souls; caught 
 in a catastrophic storm, the ship sinks, with its honorable Captain 
 Hernoon choosing to go down with his vessel. Finally, "When the Sea 
 Goes Dry!" sees two treasure hunters, Deke and Margot, led by a 
 mysterious guide named Pedro, pursuing legendary Aztec gold in the 
 Caribbean, only to encounter a monstrous octopus and a volcanic 
 eruption. They ultimately realize that Pedro is a guardian of the 
 gold, orchestrating the "curse" and the octopus's attacks to protect 
 his ancestors' treasure, before disappearing as a new mountain rises 
 from the sea.
```

<strong>Strange_Journey_002__John_Sweet_Collection_rangerhouse_movielover_Novus_.txt</strong>

```
This comic book presents a collection of speculative tales. The first, 
"Our Green-Eyed Princess of Dumbrille!", introduces the naive Princess 
Dorinda, who unwittingly grants power to her envious jester, Grune. After 
his treachery is exposed and he is imprisoned, a transformative vision of 
the forgiving princess leads Grune to sincere repentance and a new, loyal 
devotion. Following this, "The Beautiful and the Dumb!" depicts manager 
George's infatuation with the untalented ventriloquist Fifi, only for him 
to discover she is bound by a manipulative "life-long contract" to her 
agent, Henri, revealing a cynical world beneath the glamour. Next, "A Hole
 in the Sky!" plunges Detective Paul Andrews into an investigation of a 
 green-skinned, shape-shifting alien who, impervious to bullets, mocks 
 humanity before transforming into a flying saucer and departing. The 
 final visual story, "Space is a Secret," chronicles the journey of the 
 Argonaut-I crew, who encounter a powerful, fiery woman and a mysterious 
 alien Queen who subtly asserts control over free will, hinting at 
 profound cosmic truths. Additionally, the comic includes a text-only 
 science fiction story, "The Dreadful Vision," detailing a scientist's 
 premonition regarding a woman from Earth and the future of human space 
 exploration.
 ```

 And finally, here's one from a Batman book. As it's copyrighted, you won't find the comic in the GitHub repo, but the summary is:

 <strong>Batman - White Knight 01 (of 08) (2017) (3 covers) (Digital) (Zone-Empire).txt</strong>

 ```
 Batman: White Knight #1 begins with Batman brutally apprehending 
 the Joker at Arkham Asylum. A flashback reveals an earlier, 
 destructive chase through Gotham where the Joker, in a moment of 
 lucidity amidst the chaos, taunts Batman about their codependent 
 "performance." Enraged, Batman violently beats the Joker and 
 force-feeds him an experimental pill, an act controversially 
 recorded by Batgirl. Following this, the Joker, now calling 
 himself Jack Napier, appears to be completely sane and physically 
 recovered. He quickly gains public sympathy, leveraging his 
 transformation to expose Batman's reckless vigilantism and the 
 GCPD's complicity in the city's destruction. Napier announces 
 his intention to sue Batman and the GCPD, declaring that he will 
 be Gotham's new "White Knight," believing he can save the city 
 more effectively and lawfully than the Dark Knight.
 ```

 That's it. As always, let me know what you think. You can find the complete demo here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/comic_summarizer>