---
layout: post
title: "Creating Images with Generative AI via Conversation"
date: "2025-03-19T18:00:00"
categories: ["development"]
tags: ["generative ai", "python"]
banner_image: /images/banners/cat_talking_painting.jpg
permalink: /2025/03/19/creating-images-with-generative-ai-via-conversation
description: Creating a chat interface with Gemini for generating images
---

Last week, I [blogged](https://www.raymondcamden.com/2025/03/14/generative-images-with-gemini-new-updates) about updates to Google's Gemini APIs in regards to image generation. That post detailed how there are now two models for generating images with the experimental Gemini Flash model having a nice free tier. One of the interesting features of the API is the ability to edit existing images, in other words, pass an image to Gemini and via a prompt, have Gemini update it. I thought it would be kind of fun to see if I could build a 'chat' interface for this model, one where you could simply talk to Gemini and have it work on your image along with you. 

Now to be clear, this is no different than what you can do now at the [Gemini website](https://gemini.google.com), but I figured it would give me yet another chance to play with [Flask](https://flask.palletsprojects.com/en/stable/). Here's what I built.

## Image Chat

Image Chat is a Flask web application with a simple interface. It begins by asking you what you want to create:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/chat1.jpg" alt="UI of web app asking the user to enter a prompt" class="imgborder imgcenter" loading="lazy">
</p>

This prompt is sent to the Flask app server, passed to code that talks to Gemini, and the response is rendered.

<p>
<img src="https://static.raymondcamden.com/images/2025/03/chat2.jpg" alt="Result (cat picture) shown, based on prompt" class="imgborder imgcenter" loading="lazy">
</p>

I can then ask for changes, for example, adding a moon:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/chat3.jpg" alt="Result (cat picture) shown, based on prompt" class="imgborder imgcenter" loading="lazy">
</p>

You get the idea, I can keep asking for tweaks and modifications and see where Gemini takes it. That's the user experience of the application, now for the code.

## The Front End

The front end of the application is a grand total of one HTML file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>Image Chat</title>
{% raw %}	<link rel="stylesheet" href="{{ url_for('static', filename='app.css') }}">
{% endraw %}</head>
<body>

	<main>
	<p>
	Welcome to Image Chat. This tool lets you have an interactive conversation with Google Gemini's image generation capabilities
	to work on and improve an image. To begin, simply describe what you would like to start with, for example, "Create a picture of a cat."
	</p>

	<div id="log">
	</div>

	<p>
	<input id="chat" placeholder="Enter your message" value=""> <button id="send">Send</button>
	</p>
	</main>

<!-- Ray, ensure you need this -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/15.0.6/marked.min.js"></script>
{% raw %}<script src="{{ url_for('static', filename='app.js') }}"></script>
{% endraw %}</body>
</html>
```

You can see the intro, an empty div where I'll log activity, the form field for user input. As the comment at the bottom says, I loaded the Marked library for processing Markdown, but I didn't end up needing it. I'll explain why I thought I might need it in a minute. 

Now for the JavaScript:

```js
let $chat, $send, $log;
let currentImage;

document.addEventListener('DOMContentLoaded', init, false);
async function init() {

	$chat = document.querySelector('#chat');
	$send = document.querySelector('#send');
	$log = document.querySelector('#log');

	$send.addEventListener('click', sendMessage, false);

}

async function sendMessage() {
	let msg = $chat.value.trim();
	if(msg === '') return;

	$send.disabled = true;
	console.log('user message: ', msg);
	
	$chat.value = '';

	$log.innerHTML += `
	<p class="userMessage">You said: ${msg}</p>
	`;

	let body = {};
	body.message = msg;

	if(currentImage) body.picture = currentImage;

	let resp = await fetch('/chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	let data = await resp.json();

	console.log('server response: ', data);
	
	// todo, text response
	let result = '';

	if(data.picture) {
		currentImage = data.picture;
		result += `
<img src="data:image/png;base64,${data.picture}">
		`;
	}

	$log.innerHTML += result;

	$send.disabled = false;

}
```

The code starts off by setting up some DOM pointers and an event listener for my button. When the button is clicked I send the input, and *possibly* the current image, to the server. I say possibly because on the first use of the application, there isn't an existing image. So yes, I'm basically passing the image back and forth, and that *kinda* bugs me a little bit. In theory, I could keep the image on the server, but I'd need to handle multiple users, cleanup, and so forth. I know Flask supports sessions so that would be an option, but for this little demo I was fine passing it back and forth. The comment about 'text' response goes back to what I said about the Markdown library. 

As I mentioned in my [last post](https://www.raymondcamden.com/2025/03/14/generative-images-with-gemini-new-updates), Gemini's image generation must be tied to a request for text and images, so your code has to handle both. However, in my testing, I didn't always see text returned. My server-side code is returning any text, but I never saw Gemini actually return any, so for now, the front end doesn't really support it.

## The Back End

So the server is yet another simple Flask server. I'll start with the main application:

```python
from flask import Flask
from flask import render_template, request 
from gemini import Gemini 
import os 

app = Flask(__name__)

gemini = Gemini(os.environ['GEMINI_KEY'])

@app.route("/")
def hello_world():
	return render_template('index.html')

@app.post("/chat")
def handleChat():
	body = request.get_json()
	message = ""
	if "message" in body:
		message = body["message"]
	picture = None
	if "picture" in body:
		picture = body["picture"]
	print(f"received msg {body["message"]}")
	result = gemini.handleChat(message, picture)

	return result
```

Basically two routes, the index that loads the homepage and the endpoint that my JavaScript calls, `/chat`. I grab the values out of the JSON body sent and pass it off to a Gemini class:

```python
from google import genai
from google.genai import types 	
import base64
import io 

class Gemini:

	def __init__(self,key):
		self.client = genai.Client(api_key=key)
		self.model = "models/gemini-2.0-flash-exp"

	def handleChat(self, message, picture=None):

		prompt = [message]

		if picture is not None:
			print("WE HAVE AN EXISTING PIC")
			decoded_bytes = base64.b64decode(picture)
			bytes_io = io.BytesIO(decoded_bytes)
			file_ref=self.client.files.upload(file=bytes_io, config={ "mime_type":"image/png" })
			prompt.append(file_ref)


		response = self.client.models.generate_content(
			model=self.model, 
			contents=prompt,
			config=types.GenerateContentConfig(response_modalities=['Text', 'Image'])
		)

		# Ok, so our result will contain text and pictures, we want to gather all the 
		# text, if any, and return ONE picture

		result = {
			"text": "",
			"picture": ""
		}

		for part in response.candidates[0].content.parts:
			if part.text is not None:
				result["text"] += part.text
			elif part.inline_data is not None:
				if result["picture"] == "":
					result["picture"] = base64.b64encode(part.inline_data.data).decode('utf8')

		print("done making stuff, here is my result text if any")
		print(result["text"])
		return result
```

For the most part, this is just what I had in the last post, outside of the fact that I changed the file upload code to support base64 strings versus files on the local filesystem. That was new to me. For the response, I simply gather up what Gemini gave me, which will also be a base64 image, and return it. 

## Wrap Up

That's it. I still don't have a good place to host my Python apps, but if you want the complete source code, you can find it here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/image_chat>