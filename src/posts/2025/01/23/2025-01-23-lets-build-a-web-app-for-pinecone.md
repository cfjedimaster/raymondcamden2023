---
layout: post
title: "Let's Build a Web App for Pinecone"
date: "2025-01-23T18:00:00"
categories: ["development"]
tags: ["generative ai", "python","pinecone"]
banner_image: /images/banners/cat_pinecone2.jpg
permalink: /2025/01/23/lets-build-a-web-app-for-pinecone
description: A followup to my last post where I build a Flask web app to wrap Pinecone's RAG service.
---

Yesterday I blogged about [Pinecone's](https://www.pinecone.io/) excellent RAG as a service system for quickly building generative AI systems: ["Checkout Pinecone for Serverless RAG"](https://www.raymondcamden.com/2025/01/22/checkout-pinecone-for-serverless-rag). It was so easy, I decided to take a look into what it would take to build a "real" application around their service. With that in mind, I whipped up a quick [Flask](https://flask.palletsprojects.com/) application to demo just that. I'm still *very* new to Flask, so take this with a grain of salt, and design isn't my strong point, but who cares, let's dig in!

First off, a quick reminder of what I demonstrated yesterday. I used Pinecone's Python SDK to:

* Create an "Assistant", which you can think of as a collection of documents.
* I uploaded a directory of PDF files.
* I then built a simple CLI tool that let me ask questions about those documents.

With that in mind, I wanted to build the following:

* A web app that begins with a prompt.
* When the user enters a prompt, it runs server-side code to integrate with Pinecone. 
* The results are rendered in the web page.

Now, this is where things get cool. Since Pinecone returns citations, we can actually let you load, and view, the PDF, and even go to the page in question. I demonstrated that last year: ["Adding PDFs to Your Webpage without JavaScript"](https://www.raymondcamden.com/2024/12/17/adding-pdfs-to-your-webpage-without-javascript)

Here's a screen shot of the application in action. I apologize if it's a bit hard to read...

<p>
<img src="https://static.raymondcamden.com/images/2025/01/pc2.jpg" alt="Screen shot from the app" class="imgborder imgcenter" loading="lazy">
</p>

On the left side you can see the result from Pinecone, and beneath it, a list of citations. The main file is clickable, as well as the pages, and if you click a specific page, it loads that particular page. 

## The Server Side

So, how was this built? From the Flask side, this is the entirety of the code that handles routing and such. Since my application has two routes, its ludicrously short:

```python
from flask import Flask
from flask import render_template, request

from pineconewrapper import PineconeWrapper

app = Flask(__name__)
pineconeWrapper = PineconeWrapper()

@app.route("/")
def homepage():
	return render_template('index.html')

@app.post("/handlePrompt")
def handlePrompt():
	prompt = request.json["prompt"]
	print(f"testing prompt, {prompt}")
	result = pineconeWrapper.executePrompt(prompt)
	return result
```

The first route just loads my homepage. We'll get to that in a bit. The second route waits for a POST from the frontend code that includes the prompt. Interesting thing about that code in the route - you can only use `request.json` if the caller uses `application/json` in the `Content-Type` header. So I probably should have some error checking there. (In the future. Honest.) 

The call out to Pinecone is done in a simple Python class:

```python
from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message
import os

class PineconeWrapper:
	
	def __init__(self):
		self.assistant_name = "shakespeare-assistant"
		self.pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
		self.assistant = self.pc.assistant.Assistant(self.assistant_name)

	def executePrompt(self, prompt):
		
		msg = Message(role="user", content=prompt)
		resp = self.assistant.chat(messages=[msg])
		
		result = {
			"content": resp.message.content,
			"citations": []
		}

		for citation in resp.citations:	
			for ref in citation["references"]:
				result["citations"].append({
					"pages": ref["pages"],
					"file": ref["file"]["name"]
				})
				
		return result		
```

If you need to, check [yesterday's post](https://www.raymondcamden.com/2025/01/22/checkout-pinecone-for-serverless-rag) for more about the code, but even if you didn't read that post, it's probably simple enough to tell what's going on, which is a testament to Pinecone's SDK design. 

Alright, let's turn our attention to the front end.

## The Client Side

The HTML is relatively simple - I've got an input field and then various divs to handle data that will be loaded via JavaScript:

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title></title>
{% raw %}<link rel="stylesheet" href="{{ url_for('static', filename='app.css') }}">
{% endraw %}</head>
<body>

<h2>Shakespeare Front End</h2>

<div class="twocol">
	<div>
		<p>
		<input id="prompt" placeholder="Enter your prompt here" value="what are the major themes?">
		<button id="submit">Submit</button>
		</p>

		<div id="output"></div>
		<div id="citations"></div>

	</div>
	<div>
		<iframe id="pdfviewer"></iframe>
	</div>
</div>

<script src="https://cdn.jsdelivr.net/npm/marked@15.0.6/lib/marked.umd.min.js"></script>
{% raw %}<script src="{{ url_for('static', filename='app.js') }}"></script>
{% endraw %}</body>
</html>
```

I'm using a bit of CSS too and you can see that at the repository link I'll share at the end.

Now for the JavaScript. First, a bunch of setup stuff. I've said this before, but when I have variables referring to DOM nodes, I like using a dollar sign in front (kinda reminds me of jQuery). 

```js
document.addEventListener('DOMContentLoaded', init, false);

let $prompt, $submit, $output, $citations, $pdfviewer;

async function init() {
	$prompt = document.querySelector('#prompt');
	$submit = document.querySelector('#submit');
	$output = document.querySelector('#output');
	$citations = document.querySelector('#citations');
	$pdfviewer = document.querySelector('#pdfviewer');

	$submit.addEventListener('click', handleSubmit, false);
}
```

The next bit handles the button click:

```js
async function handleSubmit(e) {
	e.preventDefault();
	let prompt = $prompt.value.trim();
	if(prompt === '') return; 

	console.log(`Going to test with: ${prompt}`);
	$submit.disabled = true;
	$submit.innerText = 'Processing...';

	let resp = await fetch('/handlePrompt', {
		method:'POST',
		headers: {
			'Content-Type':'application/json',
		},
		body: JSON.stringify({prompt}),
	});

	let result = await resp.json();
	
	$submit.disabled = false;
	$submit.innerText = 'Submit';

	$output.innerHTML = `<h2>Result</h2> ${marked.parse(result.content)}`;

	// handle displaying citations
	let chtml = '<h2>Citations</h2>';
	for(let i=0; i<result.citations.length; i++) {

		let pageHTML = '';
		for(page of result.citations[i].pages) {
			pageHTML += `<a href="${result.citations[i].file}#page=${page}" class="pdflink">${page}</a> `;
		}

		chtml += `
<p>
File: <a href="${result.citations[i].file}" class="pdflink">${result.citations[i].file}</a><br>
Pages: ${pageHTML}<br>
</p>
		`;

	}

	$citations.innerHTML = chtml;

	document.querySelectorAll('.pdflink').forEach((el) => {
		el.addEventListener('click', handlePDFLink, false);
	});

}
```

That's quite a few lines of code, but it's honestly all just DOM manipulation. Get the prompt, disable the button, call out to the API, and then work with the results. If any of that doesn't make sense, just ask below! The important bits are in the citation area. You'll notice I use a class, `pdflink`, for those links, and have an event handler attached to them. Let's look at that code.

```js
function handlePDFLink(e) {
	e.preventDefault();
	// hard coding /static which is maybe a Flask no no
	$pdfviewer.src = '/static/' + e.target.href.split('/').pop();
}
```

Yeah, so kind of lame, but basically, get the URL, just the filename, and update the iframe to point to it. As you can see in the comment, I *should* have the `static` prefix come from Flask somehow, as it's possible to rename that and Flask provides a utility just for those purposes, but it was good enough. 

I'll also note, when you get results from Pinecone, the citations include a link to a cloud version of the file. You *could* use that, but I felt it was more 'real world' to assume I'd have mine own copy of the documents as well. 

If you want to see the complete example, you can grab the source here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/pinecone/webdemo>. I want to reiterate, I'm new to Flask, and Pinecone, but all of this together was less than an hours work, which is dang impressive (for both Flask and Pinecone). Let me know what you think!
