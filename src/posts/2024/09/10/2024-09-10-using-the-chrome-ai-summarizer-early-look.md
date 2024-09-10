---
layout: post
title: "Using the Chrome AI Summarizer (Early Look)"
date: "2024-09-10T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_court_reporter.jpg
permalink: /2024/09/10/using-the-chrome-ai-summarizer-early-look
description: A look at Chrome's continued development of on-device Gen AI
---

I've looked at [Chrome's on-device GenAI](https://www.raymondcamden.com/2024/08/13/a-quick-look-at-ai-in-chrome) development a few times now, and as a feature it is moving pretty fast. In fact, that [first post](https://www.raymondcamden.com/2024/08/13/a-quick-look-at-ai-in-chrome) and my [follow up](https://www.raymondcamden.com/2024/08/19/sentiment-analysis-on-device-with-ai-in-chrome) both don't work anymore due to the API changing. I'm fine with that as I knew it was a bleeding edge feature, but I just want to warn folks ahead of time that everything you see here may, no, will change, probably a lot. As before though, I'm keep getting more and more excited about the possibilities here. I'm still not certain this will see the light of day (in mainline Chrome) or expand out to other browsers, but it's quite interesting. 

Most recently, Google has added three new APIs to the feature:

* A summarization API
* A language detection API
* A writer and rewrite API

My understanding of these APIs is that they are basically "directed" hooks into the LLM bundled in the browser. You can already use a freeform prompt for the above, but by having a specific API for these needs, you can get better results out of the model. That seems sensible, especially as prompt writing itself can be somewhat of an art and anything that makes that simpler will be useful. (As it stands, I'd like to see this in the Gemini API as well.) 

For today, I'm looking at the summarization API. The [docs](https://docs.google.com/document/d/1Bvd6cU9VIEb7kHTAOCtmmHNAYlIZdeNmV7Oy-2CtimA/edit) are a bit sparse at this time. The link I just shared there walk you through the setup process, which as I explained in my previous posts is a bit of a thing. 

<p>
<img src="https://static.raymondcamden.com/images/2024/09/sum1.jpg" alt="One does not simply enable Chrome GenAI" class="imgborder imgcenter" loading="lazy">
</p>

Follow the directions, closely, and be prepared to wait a bit for the model to download. I've had numerous conversations with Chrome folks and they all know this needs to be improved. 

The API overview shows you an idea of the simplest use of this - beginning with initialization:

```js
const canSummarize = await ai.summarizer.capabilities();
let summarizer;
if (canSummarize && canSummarize.available !== 'no') {
  if (canSummarize.available === 'readily') {
    // The summarizer can immediately be used.
    summarizer = await ai.summarizer.create();
  } else {
    // The summarizer can be used after the model download.
    summarizer = await ai.summarizer.create();
    summarizer.addEventListener('downloadprogress', (e) => {
      console.log(e.loaded, e.total);
    });
    await summarizer.ready;
  }
} else {
    // The summarizer can't be used at all.
}
```

And then use (for this code sample I'm stealing from the docs, I *greatly* reduced the input text for brevity):

```js
const someUserText = 'Hiroshi (lots of text here, like, lots and lots) it.';

const result = await summarizer.summarize(someUserText);
```

In that same documentation page, there is a list of caveats that I *believe* is mostly out of data. For example, it mentions that the options you pass to the summarizer object are ignored, but I didn't see that myself. It also says you have to destroy and recreate the object for each call to `.summarize`, and again, I'm not seeing that. 

More information about the API cay be found here: [Writing Assistance APIs Explainer](https://github.com/WICG/writing-assistance-apis). As they clearly warn on top:

<blockquote>
This proposal is an early design sketch by the Chrome built-in AI team to describe the problem below and solicit feedback on the proposed solution. It has not been approved to ship in Chrome.
</blockquote>

So take that and all my warnings above to heart. 

If you scroll down to [Detailed design](https://github.com/WICG/writing-assistance-apis?tab=readme-ov-file#detailed-design), you'll find definitions for the options you can pass, which include:

* type: What kind of summary do you want? Includes "key-points", "tl;dir", "teaser", and "headline"
* format: Supports "plain-text" or "markdown"
* length: Supports "short", "medium", "long"

## Demo

So how about a demo? And again, keep in mind that this code probably won't work next Tuesday. I thought a good usecase for this would be summarizing the content of RSS feeds. You could imagine a RSS feed reader built for the web (hey, someone should do that!) that provides summaries of the entries. 

To enable that, I first made use of a serverless function to handle RSS parsing for me. Last year, I built a [generic RSS parser](https://www.raymondcamden.com/2023/10/31/building-a-generic-rss-parser-service-with-cloudflare-workers) on Cloudflare. I say "generic", but the serverless function is limited to a *very* small set of allowed RSS URLs. (To be honest, Cloudflare's free tier is so freaking generous I could probably get rid of that. If someone asks nicely in the comments, I will.) 

That API takes a RSS feed, parses the XML, and returns an array of entries. I started off with a simple bit of HTML that makes use of Alpine.js directives:

```html
<div x-data="app">
	<div x-show="!hasAI">
		Sorry, no AI for you. Have a nice day.
	</div>
	<div x-show="hasAI">
		<div class="row">
			<div class="column">
				<label for="url">RSS URL:</label>
			</div>
			<div class="column column-90">
				<input type="url" id="url" x-model="url">
			</div>
		</div>
		<p>
			<button :disabled="working" @click="loadEntries">Get Entries</button> <span class="status" x-text="status"></span>
		</p>
		<p x-html="result"></p>
	</div>
</div>
```

Basically, enter a URL, hit a button, and it kicks off the process. Now let's look at the code.

```js
// just for feeds with a lot of data
const MAX_ENTRIES = 10;

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
		hasAI:false,
		url:"https://www.raymondcamden.com/feed.xml",
		result:"",
		session:null,
		status:'',
		working:false,
		async init() {
			if(window.ai && window.ai.summarizer) {
				let capabilities = await ai.summarizer.capabilities();
				if(capabilities.available !== 'readily') return;
				this.hasAI = true;
				this.session = await window.ai.summarizer.create({
					sharedContext:'A technical blog post',
					type:'tl;dr',
					length:'medium',
					format:'plain-text'
				});
			}
		},
		async loadEntries() {
			if(this.url === '') return;
			console.log('loading entries for ', this.url);
			this.status = 'Fetching RSS entries';
			this.working = true;
			this.result = '';
			let entriesReq = await fetch(` https://rsstojson.raymondcamden.workers.dev/?feed=${this.url}`);
			let feed = await entriesReq.json();
			if(feed.entries.length > MAX_ENTRIES) feed.entries = feed.entries.slice(0,10);
			
			this.status = `Got ${feed.entries.length} entries. Summarizing now...`;
			
			for(let i=0;i<feed.entries.length;i++) {
				let entry = feed.entries[i];
				let dummyDiv = document.createElement('div');
				dummyDiv.innerHTML = entry.content.replace(/<code .*>.*?<\/code>/g, '');

				let content = dummyDiv.innerText;
				this.result += `<h3>${entry.title.replaceAll('<','&lt;').replaceAll('>','&gt;')}</h3><p>Link: <a href="${entry.link}">${entry.link}</a></p>`;
				
				try {
					let summary = await this.session.summarize(content);
					console.log(summary);
					this.result += `<p><b>Summary:</b> ${summary}</p>`;
				} catch(e) {
					this.result += `<p><b>Error creating summary:</b> ${e.message}</p>`;
				}

				this.result += '<p><hr><p>';
			}
			
			this.status = '';
			this.working = false;
		}
  }))
});
```

I'll skip over the Alpine stuff as that isn't critical. You'll note I check for `window.ai` as well as it actually being ready to use. If so, I create my summarizer object. I went with `tl;dr` and `medium`. The `sharedContext` property isn't really documented but *seems* to direct the summarizer about what *kind* of content is being summarized. I'm honestly not sure. 

Now, the crucial bit came when I actually summarized the text. I noticed quite early that the HTML in my RSS content was not working well and messing up the summaries. In my initial approach, I removed HTML tags and removed code blocks. Once again, [Thomas Steiner](https://mastodon.social/@tomayac@toot.cafe) helped out with a fascinating and potentially better way of doing that:

* Write to a div
* Get the innerText

That worked really well, but I still ended up doing a regex replacement on code blocks as well.

So how well did it work? 

<div style="background-color:#c0c0c0; padding: 10px">
Let's Map Traffic Incidents... Again
Link: https://www.raymondcamden.com/2024/09/06/lets-map-traffic-incidents-again

Summary: In 2010, the author wrote a Proof of Content 911 Viewer using Yahoo Pipes and ColdFusion to scrape data from a local police department's website and display it on Google Maps. This was followed by updates using IBM OpenWhisk and Pipedream to collect and fire off 911 data

Using PDF Content with Google Gemini - An Update
Link: https://www.raymondcamden.com/2024/09/05/using-pdf-content-with-google-gemini-an-update

Summary: Google has made it possible to directly analyze PDF documents using their Gemini API, replacing the need for third-party tools like Adobe PDF Extract. This allows for more accurate and versatile PDF parsing, and the ability to leverage information about the document's structure and context directly from the API.

Next &lt;Code&gt;&lt;Br&gt;, and Vote For My AI Demo!
Link: https://www.raymondcamden.com/2024/09/04/next-codebr-and-vote-for-my-ai-demo

Summary: The summarized text explains the upcoming Google Park and Recreation event and the Gemini API Developer Competition the author is participating in and asks for feedback on the latter.

Using CSV Data with Leaflet
Link: https://www.raymondcamden.com/2024/09/02/using-csv-data-with-leaflet

Summary: With the help of a JavaScript library called Papa Parse, the mesmerizing dataset of ancient shipwrecks from the Data is Plural newsletter was successfully imported into Leaflet to create a mesmerizing map!

Links For You (8/31/2024)
Link: https://www.raymondcamden.com/2024/08/31/links-for-you-8312024

Summary: Spend your long September weekend doing nothing and check out the links the author found that they are excited about, such as the one for an exceedingly cool-looking web component.

Building a General Purpose GeoJSON Viewer with Leaflet
Link: https://www.raymondcamden.com/2024/08/30/building-a-general-purpose-geojson-viewer-with-leaflet

Summary: With Leaflet and GeoJSON, you can create interactive web mapping!

Quick Example using Azure's Node.js SDK for Signed URLs
Link: https://www.raymondcamden.com/2024/08/28/quick-example-using-azures-nodejs-sdk-for-signed-urls

Summary: You can create readable and writable URLs for cloud storage assets and directly upload files to cloud storage using the AWS SDK for Node.js V3 and the Azure Storage Blob SDK.

Mapping with Leaflet
Link: https://www.raymondcamden.com/2024/08/23/mapping-with-leaflet

Summary: For those who missed the previous episode of the "Code" podcast, the incredibly detailed and incredibly fast-paced video revisit of the incredibly popular JavaScript-based mapping library called Leaflet, is available on the webpage; it's well worth watching!

Another Web Component - Table Compressor
Link: https://www.raymondcamden.com/2024/08/20/another-web-component-table-compressor

Summary: Here's a summary of the provided text: If you have a large dataset and want to display it in a table, you can use a web component to create a 'click to expand' feature, allowing the user to see more data without downloading the entire set.

Real-Time Sentiment Analysis on Device with AI in Chrome
Link: https://www.raymondcamden.com/2024/08/19/sentiment-analysis-on-device-with-ai-in-chrome

Summary: Google has created a tool called Google AI that can analyze sentiments in text and could potentially be used to provide helpful feedback before responding to customer service inquiries or writing posts online. While the current version of the tool is not yet suitable for production use, it has the potential to be incredibly useful in the future.
</div>

In some entries, I think it did great. In some, it was definitely off. I feel like it was mostly off on my 'Links For You' posts which typically cover three very different bits of content. At this early stage, I wouldn't go to production with it, but again, it seems pretty promising.

If you want to try this out yourself, and you've gone through the work to enable it in a Dev or Canary Chrome, check it out below:

<p class="codepen" data-height="600" data-default-tab="result" data-slug-hash="rNERjGO" data-pen-title="window.ai test - RSS to Summaries (Strip HTML Better)" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/rNERjGO">
  window.ai test - RSS to Summaries (Strip HTML Better)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<p>
