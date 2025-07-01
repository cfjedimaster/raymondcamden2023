---
layout: post
title: "Take Foxit's New PDF APIs for a Spin"
date: "2025-07-01T18:00:00"
categories: ["development"]
tags: ["foxit","python"]
banner_image: /images/banners/foxes.jpg
permalink: /2025/07/01/take-foxits-new-pdf-apis-for-a-spin
description: An introduction to Foxit's new PDF APIs
---

Back in May I [announced](https://www.raymondcamden.com/2025/05/20/my-new-role-api-evangelist-at-foxit/) my new role at [Foxit](https://foxit.com) as an API evangelist. At the time, I couldn't talk much about what I was working on (although the title kinda gives it away), but yesterday we launched our new offering and I can finally share some news about it, and even better, some code.

So, the TLDR is that we launched a new [API offering and developer portal](https://developer-api.foxit.com/). These APIs are all related to document management and PDFs, so much like I was doing in my previous role at the company famous for subscription-based desktop apps, which is nice as I can bring my existing expertise to the table. 

Our APIs fall into four basic categories:

* [PDF Services](https://developer-api.foxit.com/pdf-services/) - a set of basic PDF manipulation APIs like converting to and from PDF, optimizing and so forth
* [Document Generation](https://developer-api.foxit.com/document-generation/) - APIs related to creating dynamic PDFs from a Word template
* [eSign](https://developer-api.foxit.com/esign/) - not new, but part of the new umbrella, APIs related to electronic signing 
* [Embed](https://developer-api.foxit.com/pdf-embed/) - PDF embedding library for the web

We're still ironing out a few kinks, but there's going to be some rapid updates to the offerings. You can [sign up](https://app.developer-api.foxit.com/pricing) to get credentials and there's a free tier, not trial, so you can absolutely kick the tires before you commit to buying anything. How about a quick example?

## Converting to PDF

The simplest example is just converting an Office document to PDF. The PDF Services tools all fall into a similar flow.

* You upload your document.
* You start a job.
* You check the job. 
* You download the result. 

Let's take this bit by bit. The [Upload API](https://docs.developer-api.foxit.com/?_gl=1*73oyjq*_gcl_aw*R0NMLjE3NDk4MjY3NTkuQ2p3S0NBandsX1hCQmhBVUVpd0FXSzJoem00QTh5TnlDRVI0a1l3WXVDOGFTUm1ZZGNBOENBd1ZIVnNFNDV2dXlyeG0tT2F0NHZGc3B4b0NFckFRQXZEX0J3RQ..*_gcl_au*ODUxMjM2NDg5LjE3NDc4NDIyMzU.#707a9a9d-7664-4587-bfaa-9151acc59069) requires your credentials and the binary bits of your data. Here's a Python wrapper for that:

```python
def uploadDoc(path, id, secret):
	
	headers = {
		"client_id":id,
		"client_secret":secret
	}

	with open(path, 'rb') as f:
		files = {'file': (path, f)}

		request = requests.post(f"{HOST}/pdf-services/api/documents/upload", files=files, headers=headers)
		return request.json()
```

This returns a document ID value. Here's an example calling it, where `CLIENT_ID` and `CLIENT_SECRET` are my credentials loaded from environment variables:

```python
doc = uploadDoc("../../inputfiles/input.docx", CLIENT_ID, CLIENT_SECRET)
```

Next, I'll call the [Word to PDF endpoint](https://docs.developer-api.foxit.com/?_gl=1*73oyjq*_gcl_aw*R0NMLjE3NDk4MjY3NTkuQ2p3S0NBandsX1hCQmhBVUVpd0FXSzJoem00QTh5TnlDRVI0a1l3WXVDOGFTUm1ZZGNBOENBd1ZIVnNFNDV2dXlyeG0tT2F0NHZGc3B4b0NFckFRQXZEX0J3RQ..*_gcl_au*ODUxMjM2NDg5LjE3NDc4NDIyMzU.#7372d7c0-32c2-4d4b-81ba-978be220b66d), which only requires the document ID from the previous call. Again, I've got a Python wrapper:

```python
def convertToPDF(doc, id, secret):
	
	headers = {
		"client_id":id,
		"client_secret":secret,
		"Content-Type":"application/json"
	}

	body = {
		"documentId":doc	
	}

	request = requests.post(f"{HOST}/pdf-services/api/documents/create/pdf-from-word", json=body, headers=headers)
	return request.json()
```

Here's how I call it using the previous result:

```python
task = convertToPDF(doc["documentId"], CLIENT_ID, CLIENT_SECRET)
```

The result of the operation is a `task` ID that can then be checked to see how the process is going. This [API](https://docs.developer-api.foxit.com/?_gl=1*73oyjq*_gcl_aw*R0NMLjE3NDk4MjY3NTkuQ2p3S0NBandsX1hCQmhBVUVpd0FXSzJoem00QTh5TnlDRVI0a1l3WXVDOGFTUm1ZZGNBOENBd1ZIVnNFNDV2dXlyeG0tT2F0NHZGc3B4b0NFckFRQXZEX0J3RQ..*_gcl_au*ODUxMjM2NDg5LjE3NDc4NDIyMzU.#bc0e3e42-f88d-4137-8b6b-935e1fed4c36) returns a task object containing things like the status, progress, and so forth. Here's my implementation of a function that loops until the task is done or an error is thrown:

```python
def checkTask(task, id, secret):

	headers = {
		"client_id":id,
		"client_secret":secret,
		"Content-Type":"application/json"
	}

	done = False
	while done is False:

		request = requests.get(f"{HOST}/pdf-services/api/tasks/{task}", headers=headers)
		status = request.json()
		if status["status"] == "COMPLETED":
			done = True
			# really only need resultDocumentId, will address later
			return status
		elif status["status"] == "FAILED":
			print("Failure. Here is the last status:")
			print(status)
			sys.exit()
		else:
			print(f"Current status, {status['status']}, percentage: {status['progress']}")
```

This could probably fancier. Anyway, here's the call:

```python
result = checkTask(task["taskId"], CLIENT_ID, CLIENT_SECRET)
```

The final part, assuming everything works ok, is to use [Download API](https://docs.developer-api.foxit.com/?_gl=1*73oyjq*_gcl_aw*R0NMLjE3NDk4MjY3NTkuQ2p3S0NBandsX1hCQmhBVUVpd0FXSzJoem00QTh5TnlDRVI0a1l3WXVDOGFTUm1ZZGNBOENBd1ZIVnNFNDV2dXlyeG0tT2F0NHZGc3B4b0NFckFRQXZEX0J3RQ..*_gcl_au*ODUxMjM2NDg5LjE3NDc4NDIyMzU.#98d26936-d8f3-48f9-8661-3b1af13bc85b) to get the bits. Again, a wrapper:

```python
def downloadResult(doc, path, id, secret):
	
	headers = {
		"client_id":id,
		"client_secret":secret
	}

	with open(path, "wb") as output:
		
		bits = requests.get(f"{HOST}/pdf-services/api/documents/{doc}/download", stream=True, headers=headers).content 
		output.write(bits)
```

And honestly, that's it. All of the rest of the PDF Services APIs are tiny variations of that flow. Here's the complete script just to show you the entirety of the operation:

```python
import os
import requests
import sys 
from time import sleep 

CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
HOST = os.environ.get('HOST')

def uploadDoc(path, id, secret):
	
	headers = {
		"client_id":id,
		"client_secret":secret
	}

	with open(path, 'rb') as f:
		files = {'file': (path, f)}

		request = requests.post(f"{HOST}/pdf-services/api/documents/upload", files=files, headers=headers)
		return request.json()

def convertToPDF(doc, id, secret):
	
	headers = {
		"client_id":id,
		"client_secret":secret,
		"Content-Type":"application/json"
	}

	body = {
		"documentId":doc	
	}

	request = requests.post(f"{HOST}/pdf-services/api/documents/create/pdf-from-word", json=body, headers=headers)
	return request.json()

def checkTask(task, id, secret):

	headers = {
		"client_id":id,
		"client_secret":secret,
		"Content-Type":"application/json"
	}

	done = False
	while done is False:

		request = requests.get(f"{HOST}/pdf-services/api/tasks/{task}", headers=headers)
		status = request.json()
		if status["status"] == "COMPLETED":
			done = True
			# really only need resultDocumentId, will address later
			return status
		elif status["status"] == "FAILED":
			print("Failure. Here is the last status:")
			print(status)
			sys.exit()
		else:
			print(f"Current status, {status['status']}, percentage: {status['progress']}")
			sleep(5)

def downloadResult(doc, path, id, secret):
	
	headers = {
		"client_id":id,
		"client_secret":secret
	}

	with open(path, "wb") as output:
		
		bits = requests.get(f"{HOST}/pdf-services/api/documents/{doc}/download", stream=True, headers=headers).content 
		output.write(bits)

doc = uploadDoc("../../inputfiles/input.docx", CLIENT_ID, CLIENT_SECRET)
print(f"Uploaded doc to Foxit, id is {doc['documentId']}")

task = convertToPDF(doc["documentId"], CLIENT_ID, CLIENT_SECRET)
print(f"Created task, id is {task['taskId']}")

result = checkTask(task["taskId"], CLIENT_ID, CLIENT_SECRET)
print(f"Final result: {result}")

downloadResult(result["resultDocumentId"], "../../output/input.pdf", CLIENT_ID, CLIENT_SECRET)
print("Done and saved to: ../../output/input.pdf")
```

## What's Next?

As I said, we literally just launched this about twenty-four hours ago and we've got a lot more coming down the pipe. If this interests you, check out the [site](https://developer-api.foxit.com/), and you can join our [forum](https://developerforums.foxit.com/) to ask questions. (Although feel free to leave a comment below.) I've got a live webinar coming up July 17th that you can [register](https://register.gotowebinar.com/rt/8274327924071612249) for to see these APIs in action, and I hope to see you there. We also have a developer blog launching soon on the main site, so I'll be doing most of my blogging there. Finally, I've got a repo, <https://github.com/foxitsoftware/developerapidemos>, of code demos supporting these APIs. I've got Python examples for everything, and Node examples for *some* things. Check it out. 

Photo by <a href="https://unsplash.com/@icedcocoa?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Hoyoun Lee</a> on <a href="https://unsplash.com/photos/a-couple-of-foxes-cuddle-together-on-the-ground-m9Sn_6wzNW4?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      