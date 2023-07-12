---
layout: post
title: "Using PDFs with Algolia and Adobe PDF Extract API"
date: "2023-07-12T18:00:00"
categories: ["development"]
tags: ["algolia","eleventy"]
banner_image: /images/banners/search.jpg
permalink: /2023/07/12/using-pdfs-with-algolia-and-adobe-pdf-extract-api
description: A look at using Adobe's PDF Extract API to integrate with Algolia's Search APIs
---

Over two years ago, I wrote an example of how to add PDF search to your Jamstack site, ["Using PDFS with the Jamstack - Adding Search with Text Extraction"](https://www.raymondcamden.com/2021/06/18/using-pdfs-with-the-jamstack-adding-search-with-text-extraction). In that post, I used the Adobe [PDF Extract API](https://developer.adobe.com/document-services/apis/pdf-extract/) to get the text from a set of PDF files. This was done in an Eleventy data file. This text was then used to drive a client-side search built with the open-source [Lunr](https://lunrjs.com/) project. I like Lunr a lot, but I feel like [Algolia](https://algolia.com) has much better search support, especially for larger datasets. I took a look at what it would entail to build a similar demo with Algolia integration instead. Here's what I found (and I'll share a link to the complete source at the end).

## Setup

I began with an empty [Eleventy](https://11ty.dev) project that included a folder named `pdfs`. In that folder, I dropped 3 PDFs. I knew I'd want those PDFs viewable via the production site, so I ensured they were copied to the output directory. Here's my initial `.eleventy.js` configuration:

```js
module.exports = function(eleventyConfig) {

	eleventyConfig.addPassthroughCopy('src/pdfs');

	return {
		dir: {
			input: "src",
			data: "_data"
		}
	}

};
```

## Processing PDFs

I needed my site to have knowledge of the available PDFs as well as the text inside them. To build that, I used a data file named `pdfs.js` that was responsible for:

* Enumerating the PDFs in the source directory
* Checking for a cached text file in a cache directory
* If not there, use the PDF Extract API to get the contents of the PDF and parse out the text, then cache it.
* Return to Eleventy a list of PDFs and text contents.

I'll share the complete file in a sec, but here's how each of those parts breakdown. First, get my PDFs via `globby`:

```js
let pdf_dir = './src/pdfs/';

let files = await globby(`${pdf_dir}**/*.pdf`);
```

For each file, we loop and figure out the name of the corresponding text file:

```js
for(let i=0; i<files.length; i++) {
	let pdf = files[i];
	let name = pdf.split('/').pop().replace('.pdf','.txt');
```

We check the cache, and if it doesn't exist, call out to get it, otherwise, we read in the cached text:

```js
if(!fs.existsSync(cache_dir + name)) {
	console.log('need to generate', name);
	pdfText = await getPDFText(pdf);
	fs.writeFileSync(cache_dir + name, pdfText, 'utf8');
} else pdfText = fs.readFileSync(cache_dir + name, 'utf8');
```

My `getPDFText` function wraps the call to the Extract API. While the Extract API returns a *lot* of data from a PDF, I only need the text. Here's the function:

```js
async function getPDFText(path) {

	// Used to store the result on the file system
	const output = `./output${nanoid()}.zip`;

	const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);
	const extractPDFOperation = PDFServicesSdk.ExtractPDF.Operation.createNew(),
    	input = PDFServicesSdk.FileRef.createFromLocalFile(
        	path, 
        	PDFServicesSdk.ExtractPDF.SupportedSourceFormat.pdf
    	);

	const options = new PDFServicesSdk.ExtractPDF.options.ExtractPdfOptions.Builder()
	.addElementsToExtract(PDFServicesSdk.ExtractPDF.options.ExtractElementType.TEXT).build()

	extractPDFOperation.setInput(input);
	extractPDFOperation.setOptions(options);

	let result = await extractPDFOperation.execute(executionContext);
	await result.saveAsFile(output);

	let zip = new AdmZip(output);

    let jsondata = zip.readAsText('structuredData.json');
    let data = JSON.parse(jsondata);

	let text = '';
	data.elements.forEach(e => {
		if(e.Text) text += e.Text + '\n';
	});

	// clean up zip
	fs.unlinkSync(output);

	return text;

}
```

You'll notice that the API returns a zip, and to ensure I don't overwrite anything, I save it to a random file name. I then use a Node zip library to parse it and read out the structured data result. From that, I grab the text elements. For more information about what Extract can do, check out our [docs](https://developer.adobe.com/document-services/docs/overview/pdf-extract-api/). As an FYI, Extract, and the rest of the Acrobat Document Services now has a free tier of up to 500 calls per month!

## Populating Algolia

For the next part, I logged into my Algolia dashboard and created a new index. Now, Algolia provides a *lot* of knobs you can tweak for optimal search performance. I did nothing there and got fine results. I just want to point out that you *can* and probably *should* do some thinking about your data, how folks want to search, and so forth. I love that Algolia lets me keep it simple when I want to and get complex when I need to. 

To create my integration, I needed 3 things from Algolia:

* My Application ID
* My Admin key
* The name of my index

Algolia needed one thing from me, my actual data. For that, I built a LiquidJS file responsible for outputting the text and PDF file names in JSON. I named this file `algolia.liquid`:

```html
---
permalink: /algolia.json
---

{% raw %}[
{% for pdf in pdfs %}
{
	"pdf": "{{pdf.pdf}}",
	"text":{{pdf.pdfText | slice:0,9500 | json }}
}{% unless forloop.last %},{% endunless %}
{% endfor %}
]
{% endraw %}
```

Note the use of `slice`. Algolia indexes have a max size per object of 10k characters. I went with 9500 to give "room" for the filename as well. Again, I want to point out that I'm doing things *really* simple in this demo. My data could include more than the name of the file and the text contents. As an example, I could include a date for the PDF. While Algolia has a max size for their objects, there are no real restrictions on *what* I store in the index.

With that, I could start populating my index. Algolia has an excellent Node package (`algoliasearch`), so I installed that. I then needed to decide *when* I'd do the integration. I thought the [`eleventy.after`](https://www.11ty.dev/docs/events/#eleventy.after) event would be perfect. Here's how I used it in my `.eleventy.js` file:

```js
require('dotenv').config();
const fs = require('fs');

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APPID, process.env.ALGOLIA_ADMINKEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX);

module.exports = function(eleventyConfig) {

	eleventyConfig.on('eleventy.after', async ({ dir }) => {
		let data = JSON.parse(fs.readFileSync(dir.output + '/algolia.json', 'utf8'));

		/*
		Algolia requires an objectID for each object. It can generate it, but we 
		want to use the filename. Unfortunately, only the PHP SDK lets you point to a
		property.
		*/
		data.forEach(d => d.objectID = d.pdf);

		await index.saveObjects(data);
	});

	eleventyConfig.addPassthroughCopy('src/pdfs');

	return {
		dir: {
			input: "src",
			data: "_data"
		}
	}

};
```

Pretty simple, right? I initialize my Algolia index with my credentials, read my data, and run one call, `saveObjects`. There is a bit of an issue with the fact that I don't have a unique object ID specified in my data, so you can see where I manually add that with a `forEach`. I'll also point out that the result of the call would provide information about how the index went, but in my case, I'm assuming the best. Nothing wrong with that, right?

## Searching with Algolia

Ok, so at this point, I needed a simple search interface. Last year I wrote a blog post on integrating Algolia with Alpine.js, ["An example of Algolia Search with Alpine.js"](https://www.raymondcamden.com/2022/07/19/an-example-of-algolia-search-with-alpinejs). I decided to make use of that:

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title></title>
	<script src="https://cdn.jsdelivr.net/npm/algoliasearch@4.18.0/dist/algoliasearch-lite.umd.js"
	integrity="sha256-V3GHVlMSAsogT3wL0OY/l4d3fRLa56gNzlnzdIMBIWg="
	crossorigin="anonymous"
	></script>
	<script src="https://unpkg.com/alpinejs@3.1.x/dist/cdn.min.js" defer></script>
	<style>
	[x-cloak] { display: none !important; }
	</style>
</head>
<body>

<div x-data="app" x-cloak>
	<h2>PDF Search</h2>

	<input type="search" x-model="term">
	<button @click="search" :disabled="!searchReady">Search</button>
	<div x-show="noResults">
		<p>
		Sorry, but there were no results.
		</p>
	</div>

	<div x-show="results">
		<h2>Results</h2>
		<p>
		There were <span x-text="totalHits"></span> total matches. Returning the first <span x-text="resultsPerPage"></span> results:
		</p>
		<template x-for="result in results">
			<div>
				<p>
				<a :href="result.url"><span x-text="result.pdf"></span></a>
				</p>
				<p class="snippet" x-html="result.snippet"></p>
			</div>
		</template>
	</div>
</div>

<script>
const appId = '0FJBPN4K5D';
const apiKey = '8f741f50b983176875b65e252402b140';
const indexName = 'eleventy_pdf';

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    init() {
      let client = algoliasearch(appId, apiKey);
      this.index = client.initIndex(indexName);
      this.searchReady = true;
    },
    index:null,
    term:'',
    searchReady:false,
    noResults:false,
    results:null,
    totalHits:null,
    resultsPerPage:null,
    async search() {
      if(this.term === '') return;
      this.noResults = false;
      console.log(`search for ${this.term}`);
      
      let rawResults = await this.index.search(this.term, { 
        attributesToSnippet: ['text']
      });     

      if(rawResults.nbHits === 0) {
        this.noResults = true;
        return;
      }
      this.totalHits = rawResults.nbHits;

      this.resultsPerPage = rawResults.hitsPerPage;
      this.results = rawResults.hits.map(h => {
        h.snippet = h._snippetResult.text.value;
		h.url = `/pdf.html?pdf=${h.pdf}&term=${encodeURIComponent(this.term)}`;
        return h;
      });
    }
  }))
});
</script>
</body>
</html>
```

This template loads up Algolia's JavaScript library as well as Alpine.js. Note that the `apiKey` I'm using here is a "search only" Algolia key, not the same as the one used to populate the index. I won't go into too much detail here, as it's covered in that earlier blog post, but basically - take the input - hit the index - let Alpine render the result. Here's an example of how it looks, and remember, the ugly is my fault, not Algolia:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/alg1.jpg" alt="Example of a search result being displayed" class="imgborder imgcenter" loading="lazy">
</p>

One thing I'll point out about this demo is that the link goes to a page, `pdf.html`, where I pass in the name of the PDF and the search term used. This lets me make use of the [Adobe PDF Embed library](https://developer.adobe.com/document-services/apis/pdf-embed/) to display the PDF dynamically. Here's this file with the minimal JavaScript needed to render a PDF passed in via the query string and optionally show a highlighted search term.

```html
---
permalink: /pdf.html
---

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title></title>
	<style>
	#pdf-view {
		width: 50%;
		height: 80vh;
	}
	</style>
</head>
<body>

<h2>PDF Display</h2>

<div id="pdf-view"></div>

<script src="https://acrobatservices.adobe.com/view-sdk/viewer.js"></script>
<script type="text/javascript">
let queryParams = new URLSearchParams(window.location.search);
let search = queryParams.get('term');
let pdf = queryParams.get('pdf');
{% raw %}
document.addEventListener("adobe_dc_view_sdk.ready", async () => {
	let adobeDCView = new AdobeDC.View({clientId: "{{ site.pdfkey }}", divId: "pdf-view"});
	let pdfPromise = adobeDCView.previewFile(
	{
		content:   {location: {url: pdf}},
		metaData: {fileName: pdf}
	}, { enableSearchAPIs: true} );

	/*
	Support recognizing we came in via search
	*/
	if(!search) return;
	
	let adobeViewer = await pdfPromise;
	let apis = await adobeViewer.getAPIs();
	let searchResult = await apis.search(search);
});{% endraw %}
</script>

</body>
</html>
```

This could look a heck of a lot better, but given the example search above ("nasa") and clicking the result, here's what you get:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/alg2.jpg" alt="Rendered PDF embed with NASA highlighted." class="imgborder imgcenter" loading="lazy">
</p>

## Final Considerations

So, this was a 'bare minimum' type demo, not really ready for production deployment. In order for the caching system to work, you would need something that lives between your builds. Luckily that's easy enough with the Netlify Cache plugin. I discussed how to use that here: ["Testing the Netlify Cache Plugin with Eleventy"](https://www.raymondcamden.com/2022/06/26/testing-the-netlify-cache-plugin-with-eleventy).

However, this does bring up an interesting issue. While the Netlify Cache Plugin works just fine, it *is* possible you may blow away that cache at some point. In that case, you would need to re-extract your PDFs all over again. While working on this blog post, I thought of an alternative. You could use a local Node.js script that does the parsing and saves the results, and then just include this in your GitHub repo. There's no reason *not* to. It does add a manual step, but it may be worthwhile in order to ensure you can keep that cached result forever. 

Let me know what you think and if this is something you would use. You can find the complete source code for the demo here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/pdf_cache_algolia>