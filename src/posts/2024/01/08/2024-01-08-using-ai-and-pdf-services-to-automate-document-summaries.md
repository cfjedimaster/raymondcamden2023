---
layout: post
title: "Using AI and PDF Services to Automate Document Summaries"
date: "2024-01-08T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/cat_notes.jpg
permalink: /2024/01/08/using-ai-and-pdf-services-to-automate-document-summaries
description: How to use two APIs to generate summaries of PDF documents.
---

I first discovered [Diffbot](https://www.diffbot.com/) way back in 2021 when I built a demo of their APIs for the Adobe Developer blog (["Natural Language Processing, Adobe PDF Extract, and Deep PDF Intelligence"](https://blog.developer.adobe.com/natural-language-processing-adobe-pdf-extract-and-deep-pdf-intelligence-31ae07139b66)). At that time, I was impressed with how easy Diffbot's API was and also how quickly it responded. I had not looked at their API in a while, but a few days ago they announced new support for summarizing text. I thought this would be a great thing to combine with the [Adobe PDF Extract API](https://developer.adobe.com/document-services/apis/pdf-extract/). Here's what I found.

First off, if you want to try this yourself, you'll need:

* Adobe PDF Services [credentials](https://acrobatservices.adobe.com/dc-integration-creation-app-cdn/main.html?api=pdf-extract-api). These are free and you get 500 transactions per month for free. For folks who may not know, I work for Adobe and this is one of the products I cover.
*  Diffbot [credentials](https://app.diffbot.com/get-started). They provide a free two-week trial but no free tier. That being said, I've had to reach out to them a few times when building stuff and they've provided really great support for me so I definitely think they're worth you checking out. 

Alright, let's look at how a summary flow might work.

## Step One - Extract the Text

The [Extract API](https://developer.adobe.com/document-services/apis/pdf-extract/) (sorry, the "Adobe PDF Extract API", wait, this is my blog, I can shorten things!) is pretty powerful. It uses AI to intelligently parse a PDF to correctly find each and every element detail in the document. So text, fonts, colors, position, and so forth. It can also find images and tabular data as well which leads to some pretty powerful use cases. (For a good example of this, see my [blog post](https://medium.com/adobetech/digging-out-data-with-adobe-pdf-extract-api-cf4b1712f05a) where I scan multiple scientific journals to collect and aggregate astronomical data and create reports.) 

For this demo, we literally just need the text. For that, I'll make use of the REST APIs. The "flow" for nearly all aspects of the PDF services available are:

* Exchange credentials for an access token
* Ask to upload a file for input (in this case, a PDF to be extracted)
* Upload the document
* Kick off the job
* Poll for completion
* Download the bits

Note that there are also SDKs you can use, but I've found our REST APIs so simple I just hit the endpoints directly. Here's the script I wrote to do the Extract process. It's basically everything I said above and pointing to a source PDF in my local filesystem. 

```js
/*
This demo is a two step process. This file, step one, handles extracting and storing the JSON from a PDF.
*/
import 'dotenv/config';
import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const SOURCE_PDF = '../../source_pdfs/boring_adobe_security_doc.pdf';
const REST_API = "https://pdf-services.adobe.io/";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
}

async function getAccessToken(id, secret) {

	const params = new URLSearchParams();
	params.append('client_id', id);
	params.append('client_secret', secret);

	let resp = await fetch('https://pdf-services-ue1.adobe.io/token', { 
		method: 'POST', 
		headers: {
			'Content-Type':'application/x-www-form-urlencoded'
		},
		body:params 
	});

	let data = await resp.json();
	return data.access_token;
}

async function getUploadData(mediaType, token, clientId) {

	let body = {
		'mediaType': mediaType
	};
	body = JSON.stringify(body);

	let req = await fetch(REST_API+'assets', {
		method:'post',
		headers: {
			'X-API-Key':clientId,
			'Authorization':`Bearer ${token}`,
			'Content-Type':'application/json'
		},
		body: body
	});

	let data = await req.json();
	return data;
}

async function uploadFile(url, filePath, mediaType) {

	let stream = fs.createReadStream(filePath);
	let stats = fs.statSync(filePath);
	let fileSizeInBytes = stats.size;

	let upload = await fetch(url, {
		method:'PUT', 
		redirect:'follow',
		headers: {
			'Content-Type':mediaType, 
			'Content-Length':fileSizeInBytes
		},
		duplex:'half',
		body:stream
	});

	if(upload.status === 200) return;
	else {
		throw('Bad result, handle later.');
	}

}

async function pollJob(url, token, clientId) {

	let status = null;
	let asset; 

	while(status !== 'done') {
		let req = await fetch(url, {
			method:'GET',
			headers: {
				'X-API-Key':clientId,
				'Authorization':`Bearer ${token}`,
			}
		});

		let res = await req.json();

		status = res.status;
		if(status === 'done') {
			asset = res;
		} else {
			await delay(2000);
		}
	}

	return asset;
}

async function downloadFile(url, filePath) {
	let res = await fetch(url);
	const body = Readable.fromWeb(res.body);
	const download_write_stream = fs.createWriteStream(filePath);
	return await finished(body.pipe(download_write_stream));
}

async function extractJob(asset, token, clientId) {
	let body = {
		'assetID': asset.assetID
	}

	let resp = await fetch(REST_API + 'operation/extractpdf', {
		method: 'POST', 
		headers: {
			'Authorization':`Bearer ${token}`, 
			'X-API-KEY':clientId,
			'Content-Type':'application/json'
		},
		body:JSON.stringify(body)
	});

	return resp.headers.get('location');

}

let accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
console.log('Got our access token.');

let uploadedAsset = await getUploadData('application/pdf', accessToken, CLIENT_ID);

await uploadFile(uploadedAsset.uploadUri, SOURCE_PDF, 'application/pdf');
console.log('Source PDF Uploaded.');

let job = await extractJob(uploadedAsset, accessToken, CLIENT_ID);
console.log('Job created. Now to poll it.');

let result = await pollJob(job, accessToken, CLIENT_ID);
console.log('Job is done.'); 

await downloadFile(result.content.downloadUri, 'extract.json');
console.log('All done.');
```

Ok, hopefully, you're still reading. In general, I try to avoid posting giant blocks of code like that, but if you focus on the lines at the end, you'll see I'm just hitting utility functions that do what I described in the flow above. Authenticate, ask to upload a PDF, kick off a job, check it, and download the result. 

One note I'll add. Extract returns a zip file containing a JSON result set, and optionally, tables and images. One nice thing about the REST API is that I can get directly to the JSON and just store it. 

The JSON result can be quite huge. For my source PDF (an incredibly boring Adobe security document) of three pages, the resulting JSON is 4560 lines long. You can find my source PDF [here](https://github.com/cfjedimaster/document-services-demos/blob/main/source_pdfs/boring_adobe_security_doc.pdf) and the raw output from Extract [here](https://github.com/cfjedimaster/document-services-demos/blob/main/random_demos/extract_diffbot_summary/extract.json). Instead of putting all 4.5k lines here, let me show a snippet - two unique elements found by the API:

```json
{
	"Bounds": [
		44.62139892578125,
		756.9429931640625,
		245.0037841796875,
		766.3184967041016
	],
	"Font": {
		"alt_family_name": "* Arial",
		"embedded": true,
		"encoding": "Identity-H",
		"family_name": "* Arial",
		"font_type": "CIDFontType0",
		"italic": false,
		"monospaced": false,
		"name": "*Arial-6539",
		"subset": false,
		"weight": 400
	},
	"HasClip": false,
	"Lang": "en",
	"Page": 0,
	"Path": "//Document/Sect/P",
	"Text": "Adobe Vendor Security Review Program White Paper ",
	"TextSize": 8.5,
	"attributes": {
		"SpaceAfter": 18
	}
},
{
	"Bounds": [
		0.0,
		0.0,
		630.0,
		820.7799987792969
	],
	"ClipBounds": [
		548.72802734375,
		739.1929931640625,
		602.5444488525391,
		820.7799987792969
	],
	"Page": 0,
	"Path": "//Document/Sect/Figure",
	"attributes": {
		"BBox": [
			548.9779999999737,
			739.4429999999993,
			587.61599999998,
			790.920999999973
		],
		"Placement": "Block"
	}
},
```

In the sample above, you can see the first element is textual, and contains a `Text` property, while the second one is a figure. For my demo, I just need to use the `Text` property when it exists. Let's see that in action.

## Step Two - Create the Summary

I mentioned earlier that the Diffbot API was fairly simple to use. Let me demonstrate that. 

First, I'll set up some variables and read in the JSON I got from the first step. To be clear, I could do everything in one process, but there's really no point in running Extract more than once. What's cool is - I could actually do *multiple* calls on the result. As an example, one other cool feature Diffbot has is to get entities from text, i.e., what a document is speaking about (people, places, etc). Anyway, here's the beginning:

```js
/*
In this file, we take the result from our Extract operation and pass it to Diffbot
*/

import 'dotenv/config';
import fs from 'fs';

const DIFFBOT_KEY = process.env.DIFFBOT_KEY;
const SOURCE_JSON = './extract.json';
const data = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf8'));

console.log(`Read in source data from ${SOURCE_JSON}.`);
```

Next, I need to parse out the text from the Extract result:

```js
let text = data.elements.reduce((text, el) => {
	if(el.Text) text += el.Text + '\n';
	return text;
},'');
```

Next, I craft an HTTP request to Diffbot. Check their [docs](https://docs.diffbot.com/reference/nl-post) for more information.

```js
let fields = 'summary';
let url = `https://nl.diffbot.com/v1/?fields=${fields}&token=${DIFFBOT_KEY}`;
	
let body = [{
	content:text, 
	lang:'en',
	format:'plain text'
}];

console.log('Passing text to Diffbot.'); 

let req = await fetch(url, { 
	method:'POST',
	body:JSON.stringify(body),
	headers: { 'Content-Type':'application/json' }
});

let result = await req.json();
```

And that's it. As a finals tep, I simply output it:

```js
console.log(`Summary of PDF:\n${result[0].summary}`);
```

Given the source PDF, the final result is:

```
Adobe has a vendor security review program that evaluates vendors that collect, store, process, 
transmit, or dispose of Adobe data outside of Adobe-controlled physical offices or data center 
locations. The VSR program includes requirements for vendors to follow when handling sensitive 
data and assigns a risk level score to vendors based on their compliance with Adobe standards. 
If a vendor fails the VSR program, Adobe holds discussions with the business owner to understand 
the details of the vendor's security practices and determine whether or not to continue working with them.
```

My three-page PDF is now one simple paragraph. You can imagine how useful this would be for organizations with millions of documents. Combine this with other services (like the entities feature I mentioned previously) and it makes working with large libraries that much easier. 

## Try It!

If you want to check this out yourself, you can grab all the code here: <https://github.com/cfjedimaster/document-services-demos/tree/main/random_demos/extract_diffbot_summary>. As I said, everything here can be tested for free, so give it a shot and let me know what you think in a comment below.