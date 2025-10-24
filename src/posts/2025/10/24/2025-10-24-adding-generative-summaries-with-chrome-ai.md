---
layout: post
title: "Adding Generative Summaries with Chrome AI"
date: "2025-10-24T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_on_papers3.jpg
permalink: /2025/10/24/adding-generative-summaries-with-chrome-ai
description: Using the Summarizer API to enhance product reviews.
---

Earlier this year (sigh, when I had a job), I built a demo using [Chrome's built-in AI support](https://developer.chrome.com/docs/ai/built-in) to do something I thought was really interesting - [progressively enhance product reviews](https://www.raymondcamden.com/2025/07/31/progressively-enhancing-product-reviews-with-chrome-ai) to make it easier to see which were trending negative versus positive. It was a great example (imo!) of how AI support could enhance the experience in supported browsers without impacting the experience for others. That demo was on my mind this week, and it occurred to me that it would also be a great place to add summarization.

The [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api) is now fully released, for Chrome that is, and does not need a flag enabled or anything like that. I've blogged about this API a few times already, most recently when I used it to [summarize comic books](https://www.raymondcamden.com/2025/09/12/using-chrome-ai-to-summarize-comic-books). The [docs](https://developer.chrome.com/docs/ai/summarizer-api) do a great job covering the API, but essentially it works pretty much just like the other ones:

* You first check to see if the API exists at all (`'Summarizer' in window` perhaps)
* You then check if it's available, or needs to be downloaded
* You create an instance of the summarizer, with options for the type and length of summary and more
* And then pass your input and get the summary.

I thought this would be a great addition to my "product review" page from the earlier demo. As a reminder, I used Gemini to generate a JSON array of reviews for a cat carrier. Here's part of the data:

```json
{
  "reviews": [
    {
      "date": "July 31, 2025",
      "name": "Sarah L.",
      "text": "Absolutely the best carrier I've ever owned! The Cat Carrier Ultra 1000 is a lifesaver. So sturdy and my cat, who usually hates carriers, seems calm and comfortable inside. A solid 10/10!"
    },
    {
      "date": "July 30, 2025",
      "name": "Mark Z.",
      "text": "An absolute nightmare to assemble. The instructions are useless and the parts don't fit together properly. After an hour of struggling, I gave up. It's now just a pile of expensive plastic in my garage. Avoid at all costs."
    },
    {
      "date": "July 29, 2025",
      "name": "David C.",
      "text": "Game changer! This carrier is worth every penny. The locking mechanism is genius - no more escape artist kitties. Plus, it's surprisingly lightweight for how durable it is. I'm buying another one for my other cat."
    },
    {
      "date": "July 28, 2025",
      "name": "Olivia Q.",
      "text": "This carrier arrived with a huge crack down the side. The box was fine, so it must have been shipped that way. Terrible quality control. I returned it immediately and will never buy from this brand again."
    },
    {
      "date": "July 19, 2025",
      "name": "Amanda S.",
      "text": "I'm happy with my purchase of the Cat Carrier Ultra 1000. It's well-ventilated and easy to clean, which is a big plus. Assembly was straightforward. A good value for the price."
    },
    {
      "date": "July 18, 2025",
      "name": "Steven K.",
      "text": "For the price, I was expecting better. The plastic has some sharp edges from the molding process that I had to file down myself. Not a huge deal, but shows a lack of quality control."
    },
    {
      "date": "July 17, 2025",
      "name": "Kevin H.",
      "text": "This is a pretty good carrier. The front gate is easy to open and close, and it feels sturdy. I wish it had a small storage pocket for papers, but otherwise, no complaints. Does the job well."
    }
  ]
}
```

Ok, let's get to it.

## HTML/CSS Design Changes

My initial review page simply took the reviews and rendered them out as a bunch of divs. I added a block on top for my summary:

```html
<div id="summaryBlock">
	<p><button id="summaryBtn">Summarize Reviews</button></p>
</div>
```

And made it initially invisible:

```css
div#summaryBlock {
	display:none;
}
```

My thinking here was two fold - if the feature was available, I'd reveal the div (which gives a slight vertical 'shift' I'm not a fan of) and reveals the button. To use this API, you do need to have some form of user interaction, so I've tied it to a button. Also, not everyone is a fan of generative AI so I don't want to force it on them. (Just look at poor Windows Notepad.)

## The JavaScript

I'll share the complete demo below, but let me focus on the important bits of code. First off, a simple feature detector:

```js
async function canDoIt() {
	if(!window.Summarizer) return false;
	return (await Summarizer.availability()) !== 'unavailable';
}
```

When my application starts up, if the feature detector returns a good result, I'm going to reveal that div and add an event handler:

```js
// in my DOMContentLoaded
$summaryBlock = document.querySelector('#summaryBlock');
$summaryBtn = document.querySelector('#summaryBtn');

let canWe = await canDoIt();
if(!canWe) {
    return;
}

console.log('This browser can do AI stuff.');
$summaryBlock.style.display = 'block';
$summaryBtn.addEventListener('click', doSummary, false);
```

The `doSummary` function is where the magic happens, but honestly, this too is fairly simple:

```js
async function doSummary() {
	$summaryBtn.innerText = 'Working...';
	$summaryBtn.setAttribute('disabled', 'disabled');
	if(!summarizer) {
		summarizer = await window.Summarizer.create({
				monitor(m) {
			 		m.addEventListener("downloadprogress", e => {
						console.log(`Downloaded ${e.loaded * 100}%`);
						/*
						why this? the downloadp event _always_ runs at
						least once, so this prevents the msg showing up
						when its already done. I've seen it report 0 and 1
						in this case, so we skip both
						*/
						if(e.loaded === 0 || e.loaded === 1) return;
						$summaryBlock.innerHTML += `Downloading, currently at ${Math.floor(e.loaded * 100)}%`;
					});
				}
			});		
	}
	
	let content = reviews.reduce((str, r) => {
		return str + '\n\n' + r.text;	
	}, '');
	
	let summary = await summarizer.summarize(`The following text are a series of reviews for the product. Provide a summary.\n\n${content}`);
	$summaryBlock.innerHTML = `<h3>AI Generated Summary</h3>\n ${marked.parse(summary)}`;
}
```

I initialize the Summary object with all the defaults, but as I mentioned, you do have control over the style and length of summarization. It's totally possible that better choices can be made here. Once done, I parse the Markdown (which could be plain text instead if I wish) and add it to the DOM. I also go out of my way to mark it as AI generated so folks know for sure where it came from. 

Given my sample data, this is the result I get:

* The Cat Carrier Ultra 1000 receives mixed reviews, with many users praising its sturdiness, ventilation, and secure locking mechanisms, while others report issues with assembly, quality control, and durability.
* Some customers found the carrier to be a game changer for vet visits due to its comfort and safety features, while others experienced problems with broken parts, sharp edges, or flimsy components.
* The carrier's weight and design were also points of contention, with some finding it cumbersome to carry and others wishing for additional features like storage pockets.

From what I can tell, this is a real good summary of the results. I'd love to try it on a few hundred just to see how long it takes. Here's the complete demo below, and for once, a good portion of you may be able to try it:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="QwyrmMd" data-pen-title="Review Summary" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/QwyrmMd">
  Review Summary</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

As always, let me know what you think. Love it, hate it, concerned about the Saints ever having a winning record, leave a comment below!

Photo by <a href="https://unsplash.com/@smeshny?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Siarhei Palishchuk</a> on <a href="https://unsplash.com/photos/an-orange-and-white-cat-laying-on-top-of-a-pile-of-papers-DGf00UD9f5o?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      