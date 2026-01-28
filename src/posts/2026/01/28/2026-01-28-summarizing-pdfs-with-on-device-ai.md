---
layout: post
title: "Summarizing PDFs with On-Device AI"
date: "2026-01-28T18:00:00"
categories: ["development"]
tags: ["javascript","generative ai"]
banner_image: /images/banners/cat_on_papers.jpg
permalink: /2026/01/28/summarizing-pdfs-with-on-device-ai
description: Using PDF.js and Chrome AI to summarize PDFs.
---

You can take the man out of the PDFs, but you can't take the PDFs out of the man. Ok, I'm not sure that exactly makes sense, but with a couple years in me of working with PDFs, I find myself using them quite often with my AI demos. For today, I'm going to demonstrate something that's been on my mind in a while - doing summarizing of PDFs completely in the browser, with Chrome's [on-device AI](https://developer.chrome.com/docs/ai/built-in). Unlike the Prompt API, summarization has been released since Chrome 138, so most likely those of you on Chrome can run these demos without problem. (You can see more about the AI API [statuses](https://developer.chrome.com/docs/ai/built-in-apis) if you're curious.)

## Getting PDF Text - Client-Side

There's plenty of options for getting PDF text on the server-side, either via open source libraries or APIs. For this demo I made use of [PDF.js](https://mozilla.github.io/pdf.js/). This is an open source library sponsored by Mozilla that's been around for a while. It supports parsing and rendering PDFs, but for my use-case, I just needed to parse it. The code for that part is actually really simple, once I used Google Gemini to help me with it. 

First I added the library CDN: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js

Next, I followed the advice from Gemini to specify a worker source for performance reasons:

```js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
```

This was suggested by Gemini, but I did followup research and confirmed this makes sense. 

For the actual PDF parsing, I based it on an file input change event, like so:

```js
document.querySelector('#pdf-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        const textContent = await page.getTextContent();

        // Note: 'item.str' is the raw string. 'item.hasEOL' can be used for formatting.
        const pageText = textContent.items.map(item => item.str).join(' ');

        fullText += pageText;
    }

});
```

That's pretty much it, and in my testing, this worked *really* fast, like surprisingly fast. Note that you can get more than just the text of course. My final code gets the title as well so I can render that. Check the [PDF.js docs](https://mozilla.github.io/pdf.js/getting_started/) for a full understanding of everything possible. 

## The Demo

Ok, so given that I can get the PDF text easily enough, it was now time to use the [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api). I've blogged about Chrome AI *many* times now but as a reminder, the process generally looks like so:

* First do feature detection to see if the API is available at all.
* Then see if the API is available, this can return `unavailable`, which means the device isn't able to use the API for a few different reasons, `available` which means it is good to go, or `downloadable` which means the model will be downloaded. This can take some time and you should let the user know.
* Finally, make an instance of the model. Once you have that, you can run `summarize()` and Bob's your uncle.

First, my demo has a bit of HTML, both for the input field and a place to provide output:

```html
<h2>PDF Summarization</h2>
<p>
Select a PDF and Chrome AI will be used to summarize it. 
<input type="file" id="pdf-upload" accept=".pdf" />
</p>
<div id="output"></div>
```

Now, the JavaScript:

```js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', init, false);

let $output;

async function init() {
	
	// do an early check
	if('Summarizer' in window) {
		// You can haz summary
		let available = (await window.Summarizer.availability());
		console.log('available?', available);
		if (available === 'unavailable') {
			// The Summarizer API isn't usable.
			alert("Sorry, this demo will not work for you.");
			return;
		}
	}

	$output = document.querySelector('#output');
	
	document.querySelector('#pdf-upload').addEventListener('change', async (e) => {
		$output.innerHTML = '';
		const file = e.target.files[0];
		if (!file) return;

		const arrayBuffer = await file.arrayBuffer();

		const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

		let fullText = '';

		for (let i = 1; i <= pdf.numPages; i++) {
			const page = await pdf.getPage(i);

			const textContent = await page.getTextContent();

			// Note: 'item.str' is the raw string. 'item.hasEOL' can be used for formatting.
			const pageText = textContent.items.map(item => item.str).join(' ');

			fullText += pageText;
		}

		const meta = await pdf.getMetadata();
		console.log('meta?', meta);
		doSummary(fullText, meta.info.Title || 'No Title Found');

	});

}

async function doSummary(text, title) {
		$output.innerHTML = "<i>PDF text extracted, working on the summary.";

		summarizer = await window.Summarizer.create({
				monitor(m) {
			 		m.addEventListener("downloadprogress", e => {
						console.log(`Downloaded ${e.loaded * 100}%`);
						/*
						why this? the download event _always_ runs at
						least once, so this prevents the msg showing up
						when its already done. I've seen it report 0 and 1
						in this case, so we skip both
						*/
						if(e.loaded === 0 || e.loaded === 1) return;
						$output.innerHTML = `Downloading the Summary model, currently at ${Math.floor(e.loaded * 100)}%`;
				});
			}
	});

	try {
		let summary = await summarizer.summarize(text);
		$output.innerHTML = `<h3>Summary for ${title}</h3>${marked.parse(summary)}`;
	} catch(e) {
		if(e.name === 'QuotaExceededError') {
			$output.innerHTML = 'Unfortunately this PDF was too large!';
		} else {
			$output.innerHTML = `Some other error was thrown: ${e}`;
		}
		console.log(e);
	}
	
}
```

The first half is what I've already covered - getting the text of a PDF file. The only difference is that I added a call to get the metadata of the PDF so I could possibly render the title as well.

The second half, `doSummary`, is where the AI work is done. I create the summary object (using default values, the API actually supports multiple [different styles](https://developer.chrome.com/docs/ai/summarizer-api#api-functions) of summarization) and then attempt to summarize. 

Now - here comes the biggest issue. Right now the model can't summarize large PDFs. You can see I'm handling that with a specific `catch` handler that makes this clear. There is *absolutely* a way around this! One classic way is to do summaries of summaries. Given that PDF.js returns text in pages, I could keep an array of pages, and then do batches of summaries, let's say 10 pages at a time. 10 is a guess and given that a PDF page may have a lot or a little text, it's really something you would need to test and see what works best. For this demo though I kept it simple - just report an error.

You can play with this below, but if you're curious as to the results, here's a few test results. First, I tried a PDF version of my [resume](https://www.raymondcamden.com/resume.html) (note that I've not updated it yet to include Webflow, will do that soon!). 

<p>
<img src="https://static.raymondcamden.com/images/2026/01/pdf1.jpg" loading="lazy" alt="results of parsing my resume" class="imgborder imgcenter">
</p>

That's pretty darn accurate I'd say. Want to try it yourself? Check it out below:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="ogLpGBE" data-pen-title="Test PDF.js for Text / Summary" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/ogLpGBE">
  Test PDF.js for Text / Summary</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

## More Features and Examples

This example just focused on the Summary API, but you could absolutely try other APIs as well. For example, the Prompt API would let you literally ask questions of the PDF (and I may build this), something that I believe Acrobat charges for. (Ahem, no shade being thrown, honest. Mostly.) You could also do language detection and translation. 

My buddy on the Chrome team Thomas Steiner has some great examples of this: <https://chrome.dev/web-ai-demos/document-translator/>

Let me know what you think!