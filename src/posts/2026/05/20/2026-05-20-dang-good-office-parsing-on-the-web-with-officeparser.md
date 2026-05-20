---
layout: post
title: "Dang good Office parsing on the web with officeParser"
date: "2026-05-20T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_on_papers.jpg
permalink: /2026/05/20/dang-good-office-parsing-on-the-web-with-officeparser
description: A look at the updated client side library for Office file parsing.
---

A few weeks ago I wrote about using Chrome's built-in AI support to summarize documents - ["Summarizing Docs with Built-in AI"](https://www.raymondcamden.com/2026/04/17/summarizing-docs-with-built-in-ai). This was a followup on an earlier post that was PDF only and made use of an excellent library, [officeParser](https://officeparser.harshankur.com/), to work with Microsoft Office files. This library worked well, but had one issue that made it a bit harder to use. 

Parsing a doc itself was super easy:

```js
const getAST = async (file, config) => (await OfficeParser.parseOffice(file, config));
```

But the issue I ran into was taking that result and turning it into something meaningful for Chrome's model to analyze. PDFs supported a `toText()` method but for other formats I had to do a bit of work to get a text value. For example, here's the code I used to turn an Excel file into CSV:

```js
let arrayBuffer = await file.arrayBuffer();
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
```

Yeah that's not bad, but it did mean a bit of work for each of the different Office types. 

Well, the good news is Harsh Ankur (the author of this awesome library) released a [v7](https://github.com/harshankur/officeParser/blob/master/CHANGELOG.md) that added a `to` method that supports converting files to CSV, Markdown, RTF, PDF, Text, and HTML. Even better, his HTML support isn't just "convert to Markdown then render the Markdown to html", but proper support straight from the parsed doc to create a richer result. 

I went ahead and built a demo you can use to test right now (and this demo doesn't use any of the Chrome AI stuff). I created a simple HTML file with a file field and 4 tabs: Text, Markdown, HTML, CSV. You can select a PDF or Office file and it will render into each of the tabs (well, only Excel will use CSV). The HTML isn't interesting, but here's the JavaScript:

```js
import { OfficeParser } from 'https://esm.sh/officeparser';

let $sourceFile;
let $textResult, $mdResult, $htmlResult, $csvResult;

const supportedFiles = ['pdf','xlsx','docx','pptx'];

document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	console.log('lets go');
	$sourceFile = document.querySelector('#sourceFile');
	$textResult = document.querySelector('#textResult');
	$mdResult = document.querySelector('#mdResult');
	$htmlResult = document.querySelector('#htmlResult');
	$csvResult = document.querySelector('#csvResult');

	$sourceFile.addEventListener('change', filePreview, false);
}

async function filePreview(e) {
	const file = e.target.files[0];
	if (!file) return;
	let ext = file.name.split('.').pop();
	if(!supportedFiles.includes(ext)) return;
	let arrayBuffer = await file.arrayBuffer();
	let data = await getAST(arrayBuffer, {});
	
	let text = await data.to('text');
	$textResult.innerText = text.value;
	
	let md = await data.to('md');
	$mdResult.innerText = md.value;
	
	let html = await data.to('html');
	$htmlResult.contentDocument.open();
	$htmlResult.contentDocument.write(html.value);
	$htmlResult.contentDocument.close();

	if(ext === 'xlsx') {
		$csvResult.innerText = (await data.to('csv')).value;
	} else $csvResult.innerText = 'Only used for Excel files.';
}

const getAST = async (file, config) => (await OfficeParser.parseOffice(file, config));
```

You can play with this below:

<p class="codepen" data-theme-id="dark" data-height="600" data-pen-title="officeParser demo" data-preview="true" data-version="2" data-default-tab="result" data-slug-hash="NPbpNqp" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/editor/cfjedimaster/pen/019e3d03-91b9-7e58-a88f-b730b7371377">
  officeParser demo</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

So - given that - I took a look at my previous [demo](https://codepen.io/cfjedimaster/pen/MYjxbrv) and modified the code to make use of these new features. Here's the new code that gets the text version of a document and passes it to the AI model:

```js
document.querySelector('#upload').addEventListener('change', async (e) => {
    $output.innerHTML = '';
    const file = e.target.files[0];
    if (!file) return;
    
    let ast = await getAST(await file.arrayBuffer());

    let summary = {
        title: ast.metadata?.title ?? 'No Title',
        text: (await ast.to('md')).value
    }

    doSummary(summary);

});
```

Compared to the previous version, this one is over a hundred lines shorter. As I said... ddddaaaaannnnnngggg. You can try out this version below, but note that it is Chrome only. (If folks ask, or heck, even if you don't ask, I may build a Transformer.js version.)

<p class="codepen" data-theme-id="dark" data-height="600" data-pen-title="Chrome AI, Doc Summaries (V3)" data-preview="true" data-default-tab="result" data-slug-hash="PwbpLJQ" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/PwbpLJQ">
  Chrome AI, Doc Summaries (V3)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>