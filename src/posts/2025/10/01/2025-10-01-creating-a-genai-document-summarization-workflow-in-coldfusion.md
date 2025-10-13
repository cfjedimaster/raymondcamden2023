---
layout: post
title: "Creating a GenAI Document Summarization Workflow in ColdFusion"
date: "2025-10-01T18:00:00"
categories: ["coldfusion","generative ai"]
tags: []
banner_image: /images/banners/cat_filing_papers.jpg
permalink: /2025/10/01/creating-a-genai-document-summarization-workflow-in-coldfusion
description: Using generative AI to summarize documents with ColdFusion
---

So this post comes from - I'm mostly sure - me forgetting to show a simple, but powerful demo at my presentation recently at the 
[ColdFusion Summit](https://cfsummit.adobeevents.com/). It's nice and simple, but pretty darn useful so I decided to write a quick blog post about it and highlight the code. 

## What's a Document Workflow?

Simply put, a document workflow is any process you would use to handle incoming documents. As an example, and one I've built many times over the past few years, you can use a workflow to convert all your incoming documents into PDF for easier handling. [pdfRest](https://pdfrest.com/) has APIs for this and I'll likely share a demo of them soon. (ColdFusion itself can convert HTML, PPTX, Word, and some image types to PDF natively.) In my demo, the workflow is simple:

* Scan a folder of PDFs
* For each PDF, see if we have a summary file stored
* For each PDF without a summary, use Google Gemini GenAI APIs to create the summary
* Store the summary

In my case, I'm using the file system to store the summary, but if you've got a database table that keeps track of your document resources, that could be used as well. 

## The Code

The first part of the process simply finds the PDFs:

```js
sourcePDFs = directoryList(path=expandPath("../pdfs"),filter="*.pdf");
```

Now, I need to loop over each file, and for each, I look for a file with the same name, but a `txt` extension itself. This represents the cached summary:

```js
for(i=1;i<=sourcePDFs.len();i++) {

	// do we _need_ to analyze this?
	possibleTextFile = sourcePDFs[i].replace(".pdf",".txt");
	possibleSummary = fileExists(possibleTextFile);

	writeoutput("<p><strong>Summary for #sourcePDFs[i]#</strong></p>");

	if(possibleSummary) {
		summary = fileRead(possibleTextFile);
		writeoutput(summary);
	} else {
```

Ok, now for the fun part - creating the summary via Google Gemini. The first step is to upload it to Gemini:

```js
fileOb = uploadFile(sourcePDFs[i]);
```

This is done via this function:

```js
function uploadFile(path) {
	var mimeType = fileGetMimeType(path);
	var fileSize = getFileInfo(path).size;
	var result = "";
	var body  = {
		"file": {
			"display_name":getFileFromPath(path),
			"mimeType":mimeType
		}
	};

	cfhttp(url="https://generativelanguage.googleapis.com/upload/v1beta/files?key=#application.GEMINI_API_KEY#", method="post", result="result") {
		cfhttpparam(type="header", name="Content-Type", value="application/json");
		cfhttpparam(type="header", name="X-Goog-Upload-Protocol", value="resumable");
		cfhttpparam(type="header", name="X-Goog-Upload-Command", value="start");
		cfhttpparam(type="header", name="X-Goog-Upload-Header-Content-Length", value=fileSize);
		cfhttpparam(type="header", name="X-Goog-Upload-Header-Content-Type", value=mimeType);
		cfhttpparam(type="body", value="#serializeJSON(body)#");
	}

	cfhttp(url=result.responseheader['X-Goog-Upload-URL'], method="put", result="result") {
		cfhttpparam(type="header", name="Content-Length", value=fileSize);
		cfhttpparam(type="header", name="X-Goog-Upload-Offset", value="0");
		cfhttpparam(type="header", name="X-Goog-Upload-Command", value="upload, finalize");
		cfhttpparam(type="file", name="file", file=path);
	}

	return deserializeJSON(result.fileContent).file;

}
```

You'll notice a *heck* of a lot of headers there. In pretty much all aspects of Gemini's APIs, this one was the most trouble to figure out. You can read more details of that back in my post from last year: [Using Google Gemini's File API with ColdFusion](https://www.raymondcamden.com/2024/09/23/using-google-geminis-file-api-with-coldfusion)

The net result of this is that Gemini will have our PDF (for a short time, and we can force a deletion if need be) that can be referenced in prompts.

Which of course, brings us to that part:

```js
result = promptWithFile("
Please act as an expert summarizer. Analyze the provided PDF document and create a concise and comprehensive summary of its key contents. Your summary should focus on the main arguments, conclusions, and any significant data or findings. It should be written in a clear, neutral tone and be easy for a non-expert to understand.
", fileOb);
```

The `promptWithFile` method wraps calls to Gemini:

```js
// earlier in the script:
model_id = "gemini-2.5-flash";

function promptWithFile(prompt, file) {
	var result = "";

	var body = {
		"contents": [
			{
			"role": "user",
			"parts": [
				{
				"text": prompt
				},
				{
				"file_data": { "file_uri":file.uri }
				}
			]
			}
		],
		"generationConfig": {
			"temperature": 1,
			"topK": 64,
			"topP": 0.95,
			"maxOutputTokens": 8192,
			"responseMimeType": "text/plain"
		}
	};

	cfhttp(url="https://generativelanguage.googleapis.com/v1beta/models/#model_id#:generateContent?key=#application.GEMINI_API_KEY#", method="post", result="result") {
		cfhttpparam(type="header", name="Content-Type", value="application/json");
		cfhttpparam(type="body", value="#serializeJSON(body)#");
	}

	return deserializeJSON(result.fileContent);
}
```

Unlike the API to work with files, the Gemini REST APIs are incredibly simple. The body of the call is perhaps a bit complex - you need to correctly include your prompt and a reference to the file, but it's relatively simple once you've done a few calls. The last bit is to simply return the result after parsing it from JSON.

Finally, I store the result:

```js
	try {
		summary = md2HTML(result.candidates[1].content.parts[1].text);
		writeoutput(summary);
		fileWrite(possibleTextFile, summary);
	} catch(any e) {
		/* The day I built this, Gemini was having "issues" - aren't we all? */
	}
```

The `md2HTML` command simply converts the Markdown result to HTML. I covered this in yet another blog post from almost exactly a year ago: [Parsing Markdown in ColdFusion](https://www.raymondcamden.com/2024/09/16/parsing-markdown-in-coldfusion)

The final result is a web page showing file names and summaries, but honestly, I'd expect something like this to be run on a schedule with minimal to no output. As an example of the output, this is what it said about my [resume](/resume):

<hr>
<p>
<p>The provided document details the extensive career of Raymond Camden, an accomplished Developer Evangelist and Advocate with a strong focus on building developer communities and promoting successful API adoption.</p>
<p><strong>Key Highlights:</strong></p>
<ul>
<li><strong>Developer Advocacy and Evangelism Expertise:</strong> Camden possesses a proven track record in fostering relationships with developers, ensuring their success, and acting as a trusted voice within technical communities. His responsibilities consistently involve advocating for developers, gathering feedback for engineering teams regarding API design and usability, and contributing to the overall developer experience.</li>
<li><strong>Prolific Content Creation and Thought Leadership:</strong> A significant aspect of his work involves creating a vast array of educational and inspirational content. This includes writing over six thousand blog posts, publishing multiple technical books (e.g., on Vue.js, Serverless Applications, Static Sites, Apache Cordova, and ColdFusion), and delivering over 30 presentations and workshops (at Adobe) and 20+ (at HERE Technologies) to global audiences.</li>
<li><strong>Demonstrated Impact and Growth:</strong> At Adobe, he significantly increased developer signups by 33% through new documentation and revamped resources. He introduced over 100,000 developers to APIs via his content and presentations. He also played a key role in launching new API offerings and frameworks at Foxit, Adobe, Auth0, and IBM.</li>
<li><strong>Technical Collaboration and Mentorship:</strong> Camden frequently collaborates with engineering and product teams to guide new releases, improve API frameworks, and refine onboarding processes. He has also actively mentored other developer evangelists, helping expand and develop teams.</li>
<li><strong>Diverse Industry Experience:</strong> His experience spans various major technology companies, including Foxit, Adobe (in multiple roles), HERE Technologies, American Express, Auth0, and IBM, working with diverse platforms and technologies from web and mobile development (HTML5, Apache Cordova) to serverless (OpenWhisk), Node.js, and API services.</li>
<li><strong>Technical Skills:</strong> His skill set includes developer evangelism and advocacy, technical writing and editing, API development and usage, generative AI, JavaScript, the Web Platform, Node.js, Python, and public speaking.</li>
</ul>
<p>In essence, Raymond Camden is presented as a highly experienced and impactful developer advocate, recognized for his exceptional ability to create comprehensive content, drive developer engagement and adoption, influence product development, and lead within technical communities.</p>
<hr>

Not bad I'd say. Reading that you would think I'd land a job easy-peasy! You can find the complete script here: <https://github.com/cfjedimaster/gemini-ai-preso/blob/main/demos/coldfusion/pdf_summarizer.cfm> To test, you'll need to get your own Gemini API key, which you can do, *for free*, so there's no excuse to not give it a try. 