---
layout: post
title: "Using Chrome AI to Summarize Comic Books"
date: "2025-09-12T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_books.jpg
permalink: /2025/09/12/using-chrome-ai-to-summarize-comic-books
description: Testing how well Chrome's AI can parse comic books
---

A few weeks back, I blogged about [analyzing comic books with gen ai](https://www.raymondcamden.com/2025/08/26/connecting-comic-books-to-generative-ai), and honestly, it worked really darn well. I extracted the pages with Python, and send them to Google Gemini to create the summary. I was naturally curious to see if this could be done entirely on device, using [Chrome's AI support](https://developer.chrome.com/docs/ai/built-in). Here's what I found.

First, a reminder - a few days ago I [updated my web-based comic book reader](https://www.raymondcamden.com/2025/08/28/building-a-web-based-comic-book-reader) and described that process. The code I'm sharing today is built upon that first application, so if you missed that post, I'd strongly suggest reading it first. (And if you don't want to miss any of my posts, don't forget to [subscribe](/subscribe)!).

## How It Works

Alright - so given that we've got a way to handle zip and rar based e-comics, how do we integrate AI into the picture?

Remember that my [web demo](https://www.raymondcamden.com/2025/08/28/building-a-web-based-comic-book-reader) handles you dropping a `.cbr` or `.cbz` file onto the web page, checking the contents of the archive, and then using the respective library ([zip.js](https://gildas-lormeau.github.io/zip.js/) or [Unarchive.js](https://xenova.github.io/unarchiver.js/)) to extract one image a time. My code figures out the total number of pages (images) and uses simple buttons to let you navigate through them. I say simple, but honestly it was a bit complex to set up, so again, I definitely recommend reading that previous post. 

On the AI side, we're going to make use of two core features:

* First, the [Prompt API](https://developer.chrome.com/docs/ai/prompt-api), and specifically, the [multimodal capabilities](https://developer.chrome.com/docs/ai/prompt-api#multimodal_capabilities) that allow us to examine images. The context window doesn't allow us to pass *all* the images in a comic book, so we'll use the API to analyze each page of the book, one by one, and generate a summary of what's on the page for each.
* Given our pages are being turned into summaries, we can use the [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api) to create a summary of summaries, which in theory, cover the entire book. 

Let's dive into the code.

## Kicking off the Process

As I've mentioned multiple times now to read the previous post, I'll skip over the stuff covered there, and instead focus on the AI centric part. The `displayComic` method is what's used after the zip or rar has been parsed. It sets up the UI and such and enables navigation. In the first iteration, my zip and rar methods returned a "reader" function that's used to display the image. For my AI work, I knew I needed the raw binary data (or think I did, I could be wrong there), so I modified both functions to return a 'binreader' function.

In `handleRar`, it's the `getBin` part:

```js
async function handleRar(d) {
	const getData = async p => {
		let data = await p.read();
		return URL.createObjectURL(data);
	}

	const getBin = async p => {
		return await p.read();
	}

	let archive = await Unarchiver.open(d);

	// todo - remove Thumbs.db if possible
	let entries = archive.entries.filter(e => e.is_file);

	displayComic(entries, getData, getBin);
}
```

In `handleZip`, it's getBlob:

```js
async function handleZip(d) {

	const getB64 = async p => {
		return await p.getData(new zip.Data64URIWriter());
	}

	const getBlob = async p => {
		return await p.getData(new zip.BlobWriter());
	}

	console.log('processing zip');
	const blob = new Blob([d], { type: 'application/octet-stream' });
	const reader = new zip.ZipReader(new zip.BlobReader(blob));
	console.log('got a reader');
	const entries = (await reader.getEntries()).filter(e => !e.directory && !e.filename.endsWith('Thumbs.db'));
	//console.log(entries);
	displayComic(entries, getB64, getBlob);
}
```

Let me say right away that if I were shipping this to production, I'd absolutely look at simplifying this such that each method returned one helper function that could be used both for display and AI. 

When `displayComic` is done setting up UI and such, it kicks off a call to start the fancy AI process: `	handleAISupport(pages, reader, binreader);`

This first method is all about checking for support and setting stuff up, let's take a look:

```js
async function handleAISupport(pages, reader, binreader) {
	if(!window.LanguageModel) {
		$aiSummary.innerHTML = "<p>Sorry, your browser does not support built-in AI.</p>";
		return;
	}

	let status = await LanguageModel.availability();

	if(status === 'unavailable') {
		$aiSummary.innerHTML = "<p>AI support is unavailable, sorry.</p>";
		return;
	}

	console.log('status', status);
	$aiSummary.innerHTML = 'Setting up the prompt model.';

	session = await LanguageModel.create({
		initialPrompts: [{
			role:"system", 
			content:`You analyze images that are part of a comic book. Each image represents one page of a story. I will prompt you with the image as well as any previous summary from earlier pages. You should summarize the current image and use any previous summary to help guide you with the current page. Your summary should be one paragraph that is no more than three to four sentences and focused on describing what is being shown on the page. Do not give your opinion on the art or color. Just summarize what happens on the page.`
		}],
		expectedInputs: [ {type:"image" }],
		expectedOutputs: [{
    		type: "text",
    		languages: ["en"]
		}],
		monitor(m) {
			m.addEventListener('downloadprogress', e => {
				console.log(`AI model downloaded ${e.loaded * 100}%`);
				$aiSummary.innerHTML = `<p>AI support is enabled, but must be downloaded. Currently at ${Math.floor(e.loaded * 100)}%.</p>`;				
				
			});
		}
	});

	let availability = await Summarizer.availability();
	console.log('summarizer availability', availability);
	$aiSummary.innerHTML = 'Setting up the summary model.';
	summarizer = await Summarizer.create({
		format:'plain-text',
		length:'long',
		type:'tldr',
		monitor(m) {
				m.addEventListener('downloadprogress', (e) => {
				console.log(`Downloading summarizer: ${e.loaded * 100}%`);
				$aiSummary.innerHTML = `<p>AI summaries are enabled, but must be downloaded.Currently at ${Math.floor(e.loaded * 100)}%.</p>`;				
			});
		}
	});	

	doAISummary(pages, reader, binreader);
}
```

The first half checks for the Prompt AI and if it can, sets it up. The prompt I used came about from multiple iterations of trying to force the model to focus on the content, what's going on basically, and not comment on the art style and such. It... worked... mostly. 

The second half focused on the Summarizer API. I specified a `tldr` style summary, long form, and in plain text. 

Note for both I'm updating the UI if a download is required as it could take a while to get those models the first time. 

Now for the real work! Let's look at the beginning of `doAISummary`:

```js
async function doAISummary(pages, reader, binreader) {
	$aiSummary.innerHTML = "<p>Starting work on AI Summary.</p>";
	summaries = [];
	let newSession = await session.clone();
```

As a quick aside, I passed `reader` to this function and didn't use it. I freaking love that feature of modern editors. Did I fix that, no, but I love it. The method begins by giving some UI feedback. This process is *not* zippy, so it's going to be important. I'm going to be doing a summary for each page, so I initialize an array for that.

The next line is *incredibly* important. In my tests, when I'd loop over each page and ask for a summary, I quickly found myself overfilling the context window of the model. In my testing, this did *not* throw an error in my console and led to a lot of debugging. My Google contacts can't reproduce the issue, but the work around was quite simple - just cloning the session (remember that points to the Prompt API instance). You'll see me user this again in the next block:

```js
// note, start at 1 to skip cover
for(let i=1;i<Math.min(50,pages.length);i++) {
	console.log(`doing page ${i+1}`);
	console.log(`${newSession.inputUsage}/${newSession.inputQuota}`);
	if(newSession.inputUsage/newSession.inputQuota > .75) {
		console.log('need to nuke the session, getting close to full');

		newSession = await session.clone();
	}
	let response = await newSession.prompt([{
		role:"user", 
		content: [
			{ type:"image", value: await binreader(pages[i]) },
		]
	}], { responseConstraint: paragraphSchema });

	console.log('resp?', JSON.parse(response));
	if(response !== 'COVER') summaries.push(response);
	$aiSummary.innerHTML = `<p>Analyzed page ${i+1}.</p>`;

}
```

I iterate over each page (to a max of 50), and also check my usage to see if I'm nearing quota. If I get to over 75 percent, I nuke my copy of the session with a new clone. I pass the image to the prompt to get the summary. I forgot to share this earlier, but here's my schema I used to try to get Chrome to give me a simple paragraph:

```js
// used to help guide Chrome AI
const paragraphSchema = {
  "title": "Clean Paragraph",
  "description": "A single paragraph of text without multiple consecutive newlines.",
  "type": "string",
  "pattern": "^[^\\n]*(\\n[^\\n]*)*$"
};
```

Finally, note the the UI update. In my testing, it took about 2-3 seconds per page. That's not too bad, but for a 'regular' comic of 30-ish pages, that's a good minute long process, so I wanted to ensure the user knew things were being worked on. 

The last portion is rather simple:

```js
if(summaries.length) {

	let summary = await summarizer.summarize(summaries.join('\n\n'), {
		context: 'Your input is a series of summaries of pages from a comic page. From these summaries, attempt to create a summary of the whole comic book.',
	});
	console.log(summary);
	$aiSummary.innerHTML = `<p><strong>AI Generated Summary:</strong> ${summary}</p>`;
	
} else $aiSummary.innerHTML = "<p>I was unable to generate summaries, I'm truly sorry.</p>";
```

So how well does it? Eh.... kinda ok. It's definitely not as good as the pure Gemini example. It's promising, but probably needs more tweaking to improve the quality.

In my test of "Batman White Knight #1", I got this result:

<blockquote>
 Batman is fighting the Joker in Gotham City, with many intense and chaotic scenes of action and confrontation. Batman is captured, restrained, and possibly even frozen. Commissioner Gordon struggles to contain the Joker, who is causing widespread terror. The comic also features Batman's dedication to his role, his relationship with Alfred, and a futuristic medical situation. The story also highlights the creation of "The Wild Storm" comic book series and promotes DC Comics' graphic novel catalog.
</blockquote>

One thing you'll note is that it includes items that come from ads. I had made an attempt to avoid that, but didn't have much luck. As a summary, it's not great, but like I said, I think it could possibly be improved. 

Want to take a shot at it? You can find the source [here](https://github.com/cfjedimaster/ai-testingzone/tree/main/comic_web_ai), and if you are using Chrome Canary with the right flags and such, test it out here: <https://cfjedimaster.github.io/ai-testingzone/comic_web_ai/> 

Image by <a href="https://pixabay.com/users/filtrovany_fotographer-12611373/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=4239897">Сергей Ноженко</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=4239897">Pixabay</a>