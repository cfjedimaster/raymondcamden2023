---
layout: post
title: "Links For You (3/8/25)"
date: "2025-03-08T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2025/03/08/links-for-you
description: Happy Links and Happy Trees
---

Happy afternoon, programs. I just got back one of my kid's soccer games (unlike last season, the weather is pleasant and not scorching hot) and I've got a Saturday now that is 100% open! Which means I'll get a lot done! (Or, more likely, play video games.) So that I can more quickly get to all the important chores and cleaning I'm not going to do, let's get to the links.

## Code Listings via API

First up is a two-fer kinda. [Showcode](https://showcode.app/) is an excellent web app to create screenshots from code. It supports numerous languages, numerous display options, and so forth, and creates really good output. As an example:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/code1.jpg" alt="Code screen shot" class="imgborder imgcenter" loading="lazy">
</p>

While it's a great webapp, they *also* have a cool [API](https://api.showcode.app/docs/) that lets you automate the process. Here's an example taken from their docs:

```python
import requests

token = '...'
url = 'https://api.showcode.app/generate'

payload = {
    "settings": {
        "width": 600,
        "height": 400,
        "background": "hyper-cotton-candy",
        "themeName": "github-dark",
        "title": "Hello from API!"
    },
    "editors": [
        {
            "language": "php",
            "value": "class Foo extends Bar {\n    public function baz() {\n        return 'zal';\n    }\n}"
        }
    ]
}

response = requests.post(url, headers={
    "Authorization": f"Bearer {token}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}, json=payload)

with open('screenshot.png', 'wb') as f:
    f.write(response.content)
```

This produces:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/code2.jpg" alt="Python code sample image" class="imgborder imgcenter" loading="lazy">
</p>

Thanks go to my buddy [Todd Sharp](https://recursive.codes/) for finding and sharing this with me.

## Voice Coding

Next up is a post by one of the coolest folks in tech now, Salma Alam-Naylor, discussing how she's learning to [code with her voice](https://whitep4nth3r.com/blog/how-i-learned-to-code-with-my-voice/). After developing pain in her hands, she realized she'd need to adjust her work style in order to keep developing. Her post goes into detail about how she's addressing that and the tools she's trying. She's also got a YouTube video on the topic:

{% liteyoutube "QYkjgd6_s4o" %}

## Gemini as a Code Assistant

Next isn't really an article per se, more a product announcement. As my readers know, my primary GenAI focus has been with Google Gemini. Recently, they created multiple new tools to help with code writing and review. That includes a GitHub action, Firebase support, and most importantly, a Visual Studio Code extension. You can read about [all three](https://codeassist.google/products/individual) or just right to the docs for the [VSC extension](https://developers.google.com/gemini-code-assist/docs/overview#supported-features-gca). There is a free tier and I've been using it for over a week now. I'm not quite sure yet if it's better than the free GitHub version from Microsoft. Since switching, it feels like this one hasn't been quite as helpful, or in my face, as the Microsoft one, but it's also possible I just have noticed as much. Mostly, I think I need to kick the tires a bit more and make myself pay attention when it offers help. That being said, it's free and no risk, so it's worth a shot. Over the past few months I've absolutely changed my mind about the usefulness of these types of tools and I expect to keep using them until, well heck, until I retire probably. 

## Just For Fun

And lastly, I recently discovered Youtuber [matt one](https://www.youtube.com/@matt_one) who has done some *incredible* mashups. Here's my current favorite mashing up two of my favorite bands/songs.

{% liteyoutube "vNpTADYfYz0" %}

I will say he uses some... questionable AI video at times but the music is spot on.