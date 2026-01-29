---
layout: post
title: "Interrogate Your PDFs with Chrome AI"
date: "2026-01-29T18:00:00"
categories: ["development"]
tags: ["javascript","generative ai"]
banner_image: /images/banners/cat_on_papers3.jpg
permalink: /2026/01/29/interrogate-your-pdfs-with-chrome-ai
description: Adding a Q/A system to your documents.
---

Yesterday I [blogged](https://www.raymondcamden.com/2026/01/28/summarizing-pdfs-with-on-device-ai) about using [PDF.js](https://mozilla.github.io/pdf.js/) and Chrome's [on-device AI](https://developer.chrome.com/docs/ai/built-in) to create summaries of PDF documents, all within the browser, for free. In that post I mentioned it would be possible to build a Q and A system so users could ask questions about the document, and like a dog with a bone, I couldn't let it go. Last I built not one, but two demos of this. Check it out.

## Version One

Before I begin, note that this version makes use of the [Prompt API](https://developer.chrome.com/docs/ai/prompt-api), which is still behind a flag in Chrome. For this demo to work for you, you would need the latest Chrome and the right flags enabled. The Prompt API is available in extensions without the flag and it wouldn't surprise me if this requirement is removed in the next few months. Than again, I don't speak for Google so take that with a Greenland-sized grain of salt. 

If you remember, I shared the code [yesterday](https://www.raymondcamden.com/2026/01/28/summarizing-pdfs-with-on-device-ai) that parsed a PDF and grabbed the text, so today I'll focus on the changes to allow for questions. 

First, the HTML now includes a text box. I hide this in CSS until a PDF is selected and parsed.

```html
<h2>PDF Q & A</h2>
<p>
Select a PDF and then ask questions. 
<input type="file" id="pdf-upload" accept=".pdf" />
</p>
<div id="chatArea">
	<input id="question"> <button id="ask">Ask about the PDF</button>
	<div id="response"></div>
</div>
```

In the JavaScript, I once again use feature detection:

```js
async function canDoIt() {
	if(!window.LanguageModel) return false;
	return (await LanguageModel.availability()) !== 'unavailable';
}

// in my DOMContentLoaded event handler:

// do an early check
let weCanDoIt = await canDoIt();
if(!weCanDoIt) {
    alert("Sorry, this browser can't use the Prompt API.");
    return;
}
```

After the user has selected a PDF and the text is parsed, I then run `enableChat`:

```js
async function enableChat(text,title) {
	$chatArea.style.display = 'block';
	let session = await LanguageModel.create({
		initialPrompts: [
			{role:'system', content:`You answer questions about a PDF document. You only answer questions about the document. If the user tries to ask about something else, tell them you cannot answer it. Here is the text of the document:\n\n${text}`}
		]
	});
	
	$ask.addEventListener('click', async () => {
		$response.innerHTML = '';
		let q = $question.value.trim();
		if(q === '') return;
		console.log(`ask about ${q}`);
		$response.innerHTML = '<i>working...</i>';
		let response = await session.prompt(q);
		console.log(`response: ${response}`);
		$response.innerHTML = marked.parse(response);
	});
}
```

Note in the system instruction I tell the model to stick to the PDF, so if the user does something cute like, "why are cats better than dogs", the system will direct them back to the document. I had to put two statements about this in the system information as one didn't seem to be good enough.

I'll include the demo below, but assuming most of you won't be able to run it, here's a few examples using an incredibly boring Adobe security document. 

<p>
<img src="https://static.raymondcamden.com/images/2026/01/pdf2.jpg" loading="lazy" alt="result of asking what the document is about" class="imgborder imgcenter">
</p>

That's pretty much the same as the summary, so let's try something specific:

<p>
<img src="https://static.raymondcamden.com/images/2026/01/pdf3.jpg" loading="lazy" alt="result of asking about security levels" class="imgborder imgcenter">
</p>

And finally, here's what happens if I try to go off topic:

<p>
<img src="https://static.raymondcamden.com/images/2026/01/pdf4.jpg" loading="lazy" alt="result of asking about black holes" class="imgborder imgcenter">
</p>

As a reminder, you can't use beefy PDFs in this demo, and unlike yesterday's post, I didn't add a good error handler for that. Sorry!

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="vEKpzRZ" data-pen-title="Chrome AI, PDF.js - QA" data-preview="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/vEKpzRZ">
  Chrome AI, PDF.js - QA</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

## Version Two

I was pretty happy with the initial version, but I was curious if the on-device model could handle creating references to the document? 

I began by keeping the page text in an array instead of one big string: 

```js
let fullText = [];

for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);

    const textContent = await page.getTextContent();

    // Note: 'item.str' is the raw string. 'item.hasEOL' can be used for formatting.
    const pageText = textContent.items.map(item => item.str).join(' ');

    fullText.push(pageText);
}
```

Then I modified by `enableChat` a few ways. First, I created a new block of text that marked the pages:

```js
let pagedText = '';
textArr.forEach((t,x) => {
    pagedText += `
    
Page ${x+1}:
${t}

`;
});
```

I think this could be better, perhaps with a `---` around the page content. Next I modified the system prompt:

```js
let session = await LanguageModel.create({
    initialPrompts: [
        {role:'system', content:`You answer questions about a PDF document. You only answer questions about the document. If the user tries to ask about something else, tell them you cannot answer it. The text is split into pages marked by: "Page X:", where X represents the page number. When you answer questions, always give a reference to the page where you found your answer. Here is the text of the document:\n\n${pagedText}`}
    ]
});
```

Oddly, this wasn't enough. I'd ask a question, but wouldn't get references. However, if I *asked* for references, I did. So the final change was to prefix each user prompt as well:

```js
let response = await session.prompt(`When answering this question, try to include the page number: ${q}`);
```

This seemed to do it:

<p>
<img src="https://static.raymondcamden.com/images/2026/01/pdf5.jpg" loading="lazy" alt="result of adding page references" class="imgborder imgcenter">
</p>

This is not always accurate. For example, when I asked: "what can you tell me about adobe confidential data?", which is covered in detail on page 3, the result focused on page 2. The confidential data classification is *introduced* on page 2, but is covered more in depth on page 3. Maybe improving the page formatting in the prompt would help here, but I'm happy with this demo so far. (If you want a copy of the PDF I tested with, you can find it [here](https://github.com/cfjedimaster/ai-testingzone/blob/main/pdf_test/adobe_security_properly_ocr.pdf).)

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="PwzEdxe" data-pen-title="Chrome AI, PDF.js - QA" data-preview="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;padding-bottom: 10px;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/PwzEdxe">
  Chrome AI, PDF.js - QA</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>
<br>
As I said yesterday, give these demos a spin and let me know what you think!