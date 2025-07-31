---
layout: post
title: "Progressively Enhancing Product Reviews with Chrome AI"
date: "2025-07-31T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/box_cat.jpg
permalink: /2025/07/31/progressively-enhancing-product-reviews-with-chrome-ai
description: Using on-device AI to enhance the display of product reviews.
---

While writing up my [last blog post](https://www.raymondcamden.com/2025/07/29/using-chrome-ai-for-sentiment-analysis) I mentioned that a new idea had occurred to me in regards to employing sentimenet analysis with Chrome's [built-in AI support](https://developer.chrome.com/docs/ai/built-in) (that, remember, is still *way* in beta). At lunch today I took a quick stab at a simple demo of what I had in mind and honestly, I'm pretty happy with how it came out. 

## The Initial Demo

The idea I had was an "imagined" ecommerce site with product reviews. I went to [Google AI Studio](https://aistudio.google.com/) and used a prompt to generate a set of product reviews. I used this prompt: 

<blockquote>
Generate a list of 20 product reviews for a cat carrier named Cat Carrier Ultra 1000. The reviews should be a mix of positive and negative, with some being extremely positive or negative. For each review, include the text, a made up name, and a date formatted like "July 31, 2025" - the dates should be random but from the past month or so
</blockquote>

I also defined a schema in the structured output section:

<p>
<img src="https://static.raymondcamden.com/images/2025/07/product1.jpg" alt="Structured output definition showing reviews as an array, with text/name/date properties" class="imgborder imgcenter" loading="lazy">
</p>

I asked for an array of reviews including a text, name, and date value. This worked fine except the reviews were in random order and set in 2024 for some reason. I just followed up with:

<blockquote>
sort the reviews such that the newest review is first, and use dates in 2025
</blockquote>

This gave me a nice JSON data set I could use (I got 20 back but I'm cutting out a few for length):

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

With this in place, I started off with just a demo to render this out. First, the HTML:

```html
<h2>Product Reviews</h2>

<div id="reviews" class="reviews"></div>
```

And then the JavaScript. I copied the data above as is, but changed it from an object to just an array. I won't include it in the sample below:

```js
let $reviews;

document.addEventListener('DOMContentLoaded', init, false);
async function init() {

	$reviews = document.querySelector('#reviews');
	
	// imagine we got the reviews via API
	let reviewHTML = '';
	reviews.forEach(r => {
		reviewHTML += `
<div class="review">
<p class="review-text">
${r.text}
</p>
<div class="review-author">
<span class="author-name">Reviewed by ${r.name}</span>
<span class="review-date">Reviewed on ${r.date}</span>
</div>
</div>
		`;
	});
	
	$reviews.innerHTML = reviewHTML;

}
```

After a bit of CSS (and I cheated a bit, I asked Gemini for help), I get this nice display:

<p>
<img src="https://static.raymondcamden.com/images/2025/07/product2.jpg" alt="Initial list of product reviews." class="imgborder imgcenter" loading="lazy">
</p>

Ok, let's enhance this with some client-side AI!

## Adding Sentiment Analysis

As I covered in [my previous post](https://www.raymondcamden.com/2025/07/29/using-chrome-ai-for-sentiment-analysis), I do sentiment analysis with the Prompt API by:

* Defining a system message defining what the LLM should do: "You rate the sentiment value of text, giving it a score from 0 to 1 with 0 being the most negative, and 1 being the most positive."
* Use structured output to fully define the shape of the result:

```js
const schema = {
	title:"Sentiment",
	description:"A rating of the sentiment (bad versus good) of input text.",
	type:"number", 	
	minimum:0,
	maxiumum:1
};
```

Given this, I can create a session:

```js
session = await LanguageModel.create({
  initialPrompts: [
    {role:'system', content:'You rate the sentiment value of text, giving it a score from 0 to 1 with 0 being the most negative, and 1 being the most positive.'}
  ]
});
```

And then execute it on ad hoc content like so:

```js
let result = await session.prompt([
		{
			role:"user",
			content: [
				{ type: "text", value:myInputBringsTheBoysToTheYard }
			]
		}], { responseConstraint: schema });
```

Alright, so given that approach, I begin by checking for support, and once again, I'm being lazy and not supporting "you can do this after you download the model..."

```js
async function canDoIt() {
	if(!window.LanguageModel) return false;
	return (await LanguageModel.availability()) === 'available';
}
```

Then later in my `init`:

```js
let canWe = await canDoIt();
if(!canWe) {
  return;
}

console.log('This browser can do AI stuff.');

session = await LanguageModel.create({
  initialPrompts: [
    {role:'system', content:'You rate the sentiment value of text, giving it a score from 0 to 1 with 0 being the most negative, and 1 being the most positive.'}
  ]
});

processProductReviews(reviews);
```

The `return` up there just leaves the `init` function as I'm doing this after everything else. Remember, the idea here is to progressively enhance the experience for folks who can do this, not ruin it for everyone else. 

The magic happens in `processProductReviews`:

```js
async function processProductReviews(reviews) {
	console.log('Kicking off review analyzing.');
	for(let i=0; i<reviews.length; i++) {
		let result = await session.prompt([
			{
				role:"user",
				content: [ { type: "text", value:reviews[i].text } ]
			}], { responseConstraint: schema });
		
		/*
			logic for display is:
			if result is <= 0.2, negative
			if result >= 0.7, positive
		*/
		let $r = document.querySelector('.review:nth-child('+(i+1)+')');

		if(result <= 0.2) {
			console.log('negative');
			$r.classList.add('review-negative');
		} else if(result >= 0.7) {
			console.log('positive');
			$r.classList.add('review-positive');
		} else console.log('neutral');
	
	}
}
```

So, lets break this down. First off, I'm doing this operation in a synchronous fashion over each review in order. In theory, I could do multiple calls at once although I haven't tried that with built-in AI support. My thinking is that this synchronous approach is ok as it will "decorate" from the top up and handle the items the user sees first most likely. I'm not entirely sold on this approach, but it seemed to make sense.

In the loop it's just a simple matter of calling the model with the review text and asking for the score. As the order of review objects matches what I displayed in the DOM, I can use `nth-child` CSS selectors to find them. Now for the part that's a bit arbitrary. I decided the values of .7 and higher would be positive and .2 and lower would be negative. That just seemed to make sense to me, but certainly that could be tweaked. All I do for those conditions is add a CSS class which changes the blue border of the review - as you can see here:

<p>
<img src="https://static.raymondcamden.com/images/2025/07/product3.jpg" alt="Reviews marked by sensitivity" class="imgborder imgcenter" loading="lazy">
</p>

I kinda like how subtle this is, but certainly you could imagine a different way of modifying the review. Also remember that a tool like this could be real useful in an admin interface where customer support specialists are looking at lots of reviews at one time. You get the idea. 

Now usually when I embed these demos, I warn folks that it won't work for them, but in this case, it *does* render the reviews just fine, but most of you won't get the 'enhanced' display. In my not-scientific-at-all testing, I usually saw results within a few seconds. Anyway, let me know what you think!

<p class="codepen" data-height="600" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="raOjKBP" data-pen-title="Prompt to Sentiment (2)" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/raOjKBP">
  Prompt to Sentiment (2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Photo by <a href="https://unsplash.com/@sahandbabali?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Sahand Babali</a> on <a href="https://unsplash.com/photos/brown-cardboard-box-on-white-table-GOiAKzoD12I?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      