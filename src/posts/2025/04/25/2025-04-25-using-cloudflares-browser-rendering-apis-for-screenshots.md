---
layout: post
title: "Using Cloudflare's Browser Rendering APIs for Screenshots"
date: "2025-04-25T18:00:00"
categories: ["development"]
tags: ["python"]
banner_image: /images/banners/cat_photo_laptop.jpg
permalink: /2025/04/25/using-cloudflares-browser-rendering-apis-for-screenshots
description: Using the Cloudflare Browser Rendering APIs for Screenshots
---

I've been a Cloudflare fan for a while now, but have mainly focused on their [Workers Serverless platform](https://workers.cloudflare.com/). I was aware, of course, that they did a lot more, but I just haven't had the time to really look around and explore. Recently I was doing some investigation into "url to screenshot" services and discovered that Cloudflare had this, and not only that, it's part of a suite of browser APIs that are really freaking awesome. 

Cloudflare's [Browser Rendering](https://developers.cloudflare.com/browser-rendering/) APIs do things like:

* Get the HTML of a page, but *after* JavaScript has executed, allowing it to get dynamic HTML
* Render a PDF to PDF
* Scrape HTML via selectors
* Parse out content via JSON schema (I'm absolutely going to be testing this soon)
* Convert a page to Markdown
* And of course, make screenshots

The [capture screenshot](https://developers.cloudflare.com/browser-rendering/rest-api/screenshot-endpoint/) is incredibly flexible. While you can just pass it the URL, you can also do things like:

* Specify a viewport size 
* Modify the CSS and JavaScript on the page (could be useful for hiding full page modals)
* Pass your own HTML instead of using a URL
* Wait until a selector is visible

And more. I linked to the doc just above, but it's pretty minimal, the [reference page](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/screenshot/methods/create/) for the API shows a lot more options you can tweak. 

Best of all - this is available on the free tier. The [limits](https://developers.cloudflare.com/browser-rendering/platform/limits/) are reasonable, but note that there is a max of 6 calls per minute (again, on the free tier), so keep this in mind if you are attempting to grab a bunch of screenshots at once. 

Ok, how about a quick demo? I wrote a simple Python script that lets me pass a URL, and an optional width and height to the command line. The script will then hit the API, generate the image, and save it to a slugified version of the URL:

```python
import os 
import sys
import requests 
from slugify import slugify

cfAccountId = os.environ.get('CF_ACCOUNTID')
cfKey = os.environ.get('CF_BR_KEY')

if len(sys.argv) < 2:
  print('Usage: python screenshot.py url <<width, defaults to 720>> <<height, defaults to 1280>>')
  sys.exit(1)
else:
  url = sys.argv[1]
  width = 720
  height = 1280
  if(len(sys.argv) > 2):
    width = int(sys.argv[2])
  if(len(sys.argv) > 3):
    height = int(sys.argv[3])

req = requests.post(f"https://api.cloudflare.com/client/v4/accounts/{cfAccountId}/browser-rendering/screenshot", 
	json={ 
		"url":url,
		"viewport": {
			"width":width,
			"height":height,
		}
	}, 
	headers={"Authorization": f"Bearer {cfKey}", "Content-Type": "application/json"}
)

if req.status_code == 200:
	filename = slugify(url) + '.png'
	with open(filename, 'wb') as f:
		f.write(req.content)
		print(f"Saved to {filename}")
else:
	print("Error", req.json())
```

This is kind of ridiculously simple but that's what you want in an API. As I mentioned above, the [reference](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/screenshot/methods/create/) shows a huge number of additional options you can pass, but this script will let you test out basic stuff. How about some quick examples?

First, this blog, with default width (720) and height (1280):

<p>
<img src="https://static.raymondcamden.com/images/2025/04/ss1.jpg" alt="Screenshot from my blog" class="imgborder imgcenter" loading="lazy">
</p>

And here's a larger version, width 1720 and height 1200 (the image here has been shrunk to about 700 wide for display):

<p>
<img src="https://static.raymondcamden.com/images/2025/04/ss2.jpg" alt="Screenshot from my blog, wider" class="imgborder imgcenter" loading="lazy">
</p>

Notice how the responsive design correctly renders in both options. 

So as I said, this is a pretty cool API, and I've got some thoughts on how to use within a [BoxLang](https://boxlang.io) application soon. I also want to dig into other aspects, *especially* the structured data aspect, something I've used GenAI for in the past. If you've used any of the browser rendering APIs from Cloudflare, please let me know in a comment below.

