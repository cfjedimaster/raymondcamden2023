---
layout: post
title: "Summarizing Docs with Built-in AI"
date: "2026-04-17T18:00:00"
categories: ["development"]
tags: ["javascript","generative ai"]
banner_image: /images/banners/cat_on_papers.jpg
permalink: /2026/04/17/summarizing-docs-with-built-in-ai
description: Expanding my AI summarization demo for all Office docs
---

Back in January of this year, I blogged about on-device summarization of PDFs: [Summarizing PDFs with On-Device AI
](https://www.raymondcamden.com/2026/01/28/summarizing-pdfs-with-on-device-ai). In that post, I made use of Chrome's [Summary API](https://developer.chrome.com/docs/ai/summarizer-api) and [PDF.js](https://mozilla.github.io/pdf.js/) to create summaries of PDFs completely within the browser. I thought I'd take a look at extending that demo into more document types, specifically Office. And even more specifically - Word, Excel, and PowerPoint. Here's what I came up with.

## officeParser FTW

So here comes the fun part. Last weekend I had this demo completely done using a few different libraries. Then - earlier this week one of the developer newsletters I subscribe to shared [officeParser](https://officeparser.harshankur.com/). This nifty library handles Office, PDF, even Open Office formats. It also includes the metadata for files which is handy as heck. I forked my initial demo and removed all the extra libraries, leaving only officeParser.

The library can return incredibly detailed information about the structure of the your doc as well as a plain text view. What I found in my testing is that the plain text view didn't seem like it would work well in my demo. For example, an XLS file was kinda glommed all together. I reached out to the developer and he is planning on a `toMarkdown` feature that will make this easier, but for now what I did was get the complex data and write my own custom code to 'shape' it well for AI.

Generally speaking the first part was stupid easy - and I got this from the docs:

```js
const getAST = async (file, config) => (await OfficeParser.parseOffice(file, config));
```

Now let's dig into the code a bit.

## Working with Docs

I'm going to skip over the DOM manipulation aspects as that's not terribly interesting. My code basically has a file input field and when you select a file, a process is fired off to:

* get the text, again, with formatting to hopefully make it better for AI
* pass it to the Summary API for... summarization. :)

Let's focus on the "get text" aspect. My file input handler has this logic:

```js
if(file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
    summary = await processDoc(file);
} else if(file.name.toLowerCase().endsWith('.pdf')) {
    summary = await processPDF(file);
} else if(file.name.toLowerCase().endsWith('.ppt') || file.name.toLowerCase().endsWith('.pptx')) {
    summary = await processPPT(file);
    // i add a flag to powerpoint so my summary func knows it has to deal with the text
    summary.powerpoint = true;
} else if(file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx')) {
    summary = await processXLS(file);
    // i add a flag to powerpoint so my summary func knows it has to deal with the text
    summary.excel = true;
} else {
    // in theory we can't get here, so just a return is fine
    return;
}

doSummary(summary);
```

My expectation is that the `summary` will be an object with two fields: `text` and `title`. I also use a flag for PowerPoint and Excel to help direct the Summary API to more properly handle the text. 

Now let's break down these functions. Doc and PDF are the easiest:

```js
async function processDoc(f) {
	let arrayBuffer = await f.arrayBuffer();
	let data = await getAST(arrayBuffer, {});
	
	return {
		text: data.toText(), 
		title:data.metadata?.title ?? 'No Title'
	}
	
}

async function processPDF(f) {
	const arrayBuffer = await f.arrayBuffer();
	let data = await getAST(arrayBuffer, {});
	console.log(data, data.toText());

	return {
		text: data.toText(), 
		title:data.metadata?.title ?? 'No Title'
	}

}
```

For Excel, as I mentioned earlier I got the raw data and examined it, and then wrote some utility bits to turn my sheets into (roughly) CSV form:

```js
async function processXLS(f) {
	let arrayBuffer = await f.arrayBuffer();
	let data = await getAST(arrayBuffer, {});

	const getCSV = s => {
		let result = '';
		let rows = s.children.filter(c => c.type === 'row');
		console.log(rows[0]);
		rows.forEach(r => {
			let data = [];
			let cells = r.children.filter(c => c.type === 'cell');
			cells.forEach(c => data.push(c.text));
			result += data.join(', ') + '\n';

		});
		return result;
	};
	
	let result = {
		text:'',
		title:data.metadata?.title ?? 'No Title'
	}

	let sheets = data.content.filter(c => c.type === 'sheet');
	sheets.forEach(s => {
		result.text += getCSV(s);
		result.text += '\n\n';
	});
	
	return result;
}
```

PowerPoint was a bit more complex as I had to create a separation between slides, and get deeply nested text nodes. I ignored anything that wasn't text.

```js
async function processPPT(f) {
	let arrayBuffer = await f.arrayBuffer();
	let data = await getAST(arrayBuffer, {});
	let result = {
		text:'',
		title:data.metadata?.title ?? 'No Title'
	}
	
	const getText = c => {
		let result = '';

		c.forEach(kid => {
			if(kid.text) {
				result += kid.text;
				if(kid.type === 'paragraph') result += '\n';
				else result += ' ';
			}
			if(kid.children) {
				kid.children.forEach(gk => {
					if(gk.text) {
						result += gk.text;
						if(gk.type === 'paragraph') result += '\n';
						else result += ' ';
					}
				});
			}
		});
		return result;
	}

	let content = data.content.filter(c => c.type === 'slide');
	result.text = content.reduce((prev, cur) => {
		return prev += getText(cur.children) + '\n-------------\n';
	}, '');

	return result;
}
```

One thing special here is that sometimes items on the same line were two nodes, hence me only adding newlines after paragraphs.

## The Fancy AI

The code to do summarization is something I've shown before, the only thing I did unique here was try to warn the system about my PowerPoint and Excel data:

```js
async function doSummary(summaryOb) {
	console.log(summaryOb);
	$output.innerHTML = "<i>File text extracted, working on the summary.";
	let sharedContext = null;
	
	if(summaryOb.powerpoint) {
		sharedContext = 'This is extracted text from a Powerpoint file. Slides are separated by ----';
	} else if(summaryOb.excel) {
		sharedContext = 'This is extracted text from a Excel file in CSV format.'
	}
	
	let summarizer = await window.Summarizer.create({
		type:'tldr',
		length:'long',
		sharedContext, 
		monitor(m) {
            m.addEventListener("downloadprogress", e => {
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
		let summary = await summarizer.summarize(summaryOb.text);
		$output.innerHTML = `<h3>Summary for ${summaryOb.title}</h3>${marked.parse(summary)}`;
	} catch(e) {
		if(e.name === 'QuotaExceededError') {
			$output.innerHTML = 'Unfortunately this document was too large!';
		} else {
			$output.innerHTML = `Some other error was thrown: ${e}`;
		}
		console.log(e);
	}
	
}
```

All in all, it worked well. It did feel like I filled the context window with Excel pretty quickly. My initial text file had 1000 rows and that threw a quota error. I had to get it down to 200 to properly parse. 

If you are on the latest Chrome, in theory, this will work for you, but as always, let me know!

<p class="codepen" data-theme-id="dark" data-height="600" data-pen-title="Chrome AI, Doc Summaries (V2)" data-preview="true" data-default-tab="result" data-slug-hash="MYjxbrv" data-user="cfjedimaster" style="height:600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/MYjxbrv">
  Chrome AI, Doc Summaries (V2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>