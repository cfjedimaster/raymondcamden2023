---
layout: post
title: "Doing Evil Things with Generative AI and Recipes"
date: "2025-02-06T18:00:00"
categories: ["development"]
tags: ["generative ai", "python"]
banner_image: /images/banners/evil_cat.jpg
permalink: /2025/02/06/doing-evil-things-with-generative-ai-and-recipes
description: A look at using gen ai to make recipes really, really bad.
---

Let me preface this blog post with a very clear and direct message. Do not do what I did. This is a bad use of generative AI. This is pure silliness with no real practical value whatsoever. This is a really, really, bad idea. But it was fun as hell, so here goes. 

Last year I did two investigations into recipe parsing on the web. As we all know, most recipe sites go out of their way to make the actual recipe, you know, the thing you want to read, obfuscated and buried beneath a lot of stuff that is... well not the actual recipe. I first investigated JSON-LD and using that to parse web recipes into data: [Scraping Recipes Using Node.js, Pipedream, and JSON-LD](https://www.raymondcamden.com/2024/06/12/scraping-recipes-using-nodejs-pipedream-and-json-ld). This worked *really* well. I then followed it up with a more generic approach using Gemini and generative AI: [Using Generative AI to Parse Web Pages into Data](https://www.raymondcamden.com/2024/11/27/using-generative-ai-to-parse-web-pages-into-data). This worked pretty good as well, and could be adapted for other purposes and types of content. 

This came up in conversation with my friends today, and on a whim, because, this is how my 50+ year brain works, I wondered if it was possible to take a nice, filtered out recipe and go the *other* way? I.e., fill it with crap and obfuscate the simple recipe into a SEO-ridden nightmare and wall of text?

Yes, the answer is yes, you can. Let's get started, shall we?

<p>
<img src="https://static.raymondcamden.com/images/2025/02/cats.gif" alt="Evil cat rubbing hands together" class="imgborder imgcenter" loading="lazy">
</p>

I began by prototyping in Gemini's [AI Studio](https://aistudio.googl.ecom). I used this as a system instruction:

```
You take a simple recipe and do your best to expand upon it with 
superfluous text, including a made up story about the author's 
childhood and why the recipe means so much to them. You should 
make the actual recipe incredibly difficult to find.
```

I then took this recipe my buddy Scott shared with me:

<div style="background-color: #c0c0c0; padding: 10px">

**Mississippi Pot Roast Recipe**

Ingredients:

* 1 (3-pound) chuck roast
* ½ (12-ounce) jar pepperoncini peppers (with juice)
* ½ cup unsalted butter
* 1 (1-ounce) packet ranch dressing mix
* 1 (1-ounce) packet au jus gravy mix
* Salt and pepper to taste

Instructions:

* Place the chuck roast in the bottom of a slow cooker.
* Sprinkle the ranch dressing mix and au jus gravy mix over the top of the roast.
* Add the butter and pepperoncini peppers (with juice) on top.
* Season with salt and pepper to taste.
* Cover and cook on low for 8 hours or until the meat is tender and easily shredded with a fork.
* Serve with mashed potatoes, crusty bread, or in sandwiches.

Shopping List

* 1 (3-pound) chuck roast
* ½ (12-ounce) jar pepperoncini peppers (with juice)
* ½ cup unsalted butter
* 1 (1-ounce) packet ranch dressing mix
* 1 (1-ounce) packet au jus gravy mix
* Salt and pepper

</div>

And the result was spectacular:

<div style="background-color: #c0c0c0; padding: 10px">

Oh, Mississippi Pot Roast. Where do I even begin? This isn't just a recipe; it's a time capsule. A portal back to simpler days, filled with laughter, scraped knees, and the comforting aroma of… well, probably not this, because we didn't have slow cookers back then.

You see, growing up in… let's just call it a 'coastal region,' pot roasts weren't exactly a staple. We were more about the seafood paella. But one summer, my aunt Mildred, bless her heart, came to visit. Mildred was from Mississippi, and she brought with her a suitcase full of stories, a thick Southern drawl, and this recipe.

I remember being a picky eater, turning up my nose at anything that wasn't fish sticks or ice cream. But Mildred insisted. She said this pot roast was 'magic,' capable of curing any bad mood. She might have said it with a wink, but the point is that this stuck. After a great deal of digging in my memories, here is the recipe:

First, procure the following ingredients, they're rather important: one should plan to have about 3-pounds of chuck roast. Additionally, there must be one half (12-ounce) jar pepperoncini peppers (with juice). The butter must be unsalted. 1 (1-ounce) packet ranch dressing mix. A similar sized packet, 1 (1-ounce), of au jus gravy mix is also required. Salt and pepper to taste is, of course, assumed, however is listed for completeness.

Now, in a methodical way, we can start to assemble the recipe. Carefully place the chuck roast in the bottom of a slow cooker. Once you've placed it, sprinkle the ranch dressing mix and au jus gravy mix over the top of the roast. After that, add the butter and pepperoncini peppers (with juice) on top. At this point, season with salt and pepper to taste. Once seasoned, cover and cook on low for 8 hours or until the meat is tender and easily shredded with a fork. Finally, serve with mashed potatoes, crusty bread, or in sandwiches.

And that, my friends, is Mississippi Pot Roast. It might not cure a bad mood, but it'll fill your belly and, hopefully, bring a smile to your face. And maybe, just maybe, it'll transport you back to a simpler time, filled with the warmth of family and the magic of… well, pot roast.

</div>

Beautiful. I could have stopped there, but then my buddy Todd had a suggestion - I should also add a bunch of snarky comments from folks asking for modifications, complainig, and so forth. And for fun, a few random political ones as well. 

That sounded great. So I modified my system instruction to include:

```
Also return ten to twenty comments from slight angry, snarky commentors 
demanding different versions, like a vegan one, or one that will work on
Mars. the comments should not be helpful in anyway. Within the comments, 
sprinkle a few that are political and completely out of context.
```

The results were delicious:

<div style="background-color: #c0c0c0; padding: 10px">

VeganVixen: Can this be made vegan?

WokeWarrior77: This is cultural appropriation!

BirdBrain: Can I use turkey instead of beef?

CalorieCounter: What is the nutritional information?

DisappointedDiner: I tried this and it was terrible. My roast was dry!

SpaceChef: How do I make this on Mars? I need specific instructions for Martian atmosphere.

SimpleSimon: This recipe is too complicated. Can you make it simpler?

PepperHater: What if I don't like pepperoncini peppers?

PeacefulProtester: This recipe supports the military industrial complex!

DairyDisaster: I am allergic to dairy, what can I substitute for the butter?

PressureCookerPro: Can I make this in an Instant Pot?

TruthSeeker: This recipe is fake news!

GlutenFreeGal: Is there a gluten-free version of this recipe?

SaltySue: My roast came out too salty. What did I do wrong?

OrganicOnly: This recipe uses too many processed ingredients.

SelfSufficientSally: Please provide instructions on how to raise the cow, slaughter it, and butcher the roast. This recipe is incomplete.

</div>

That last one was *perfect*.

The final step I took was to define a structured output such that I'd get a JSON result with the recipe and an array of comments with name and the comment text. In case you're curious, this is how that looks in AI Studio:

<p>
<img src="https://static.raymondcamden.com/images/2025/02/recipe.jpg" alt="Visual editor for the output schema" class="imgborder imgcenter" loading="lazy">
</p>

I then took the code output from AI Studio and dropped into a Cloudflare Worker. All this does is look for a recipe string sent in as input, pass it to Gemini, and return the result. I'm breaking my "all Python" rule today as I haven't yet tried building a Python Cloudflare Worker, but want to do so soon.

```js
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

export default {
	async fetch(request, env, ctx) {

		const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

		const schema = {
			type: "object",
			properties: {
			recipe: {
				type: "string"
			},
			comments: {
				type: "array",
				items: {
				type: "object",
				properties: {
					name: {
					type: "string"
					},
					comment: {
					type: "string"
					}
				},
				required: [
					"name",
					"comment"
				]
				}
			}
			},
			required: [
			"recipe",
			"comments"
			]
		};

		const model = genAI.getGenerativeModel({
			model: "gemini-2.0-flash-exp",
			systemInstruction: "You take a simple recipe and do your best to expand upon it with superfluous text, including a made up story about the author's childhood and why the recipe means so much to them. You should make the actual recipe incredibly difficult to find. Also return ten to twenty comments from slight angry, snarky commentors demanding different versions, like a vegan one, or one that will work on Mars. the comments should not be helpful in anyway. Within the comments, sprinkle a few that are political and completely out of context.\n",
			generationConfig: {
				responseMimeType: "application/json",
				responseSchema: schema
			}
		});

		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
			"Access-Control-Max-Age": "86400",
	    };

		let { recipe } = await request.json();

		let result = JSON.parse((await model.generateContent(recipe)).response.text());

		return Response.json(result, {
			headers: {
				'Content-Type':'application/json;charset=UTF-8',
				'Access-Control-Allow-Origin':'*',
				'Access-Control-Allow-Methods':'GET'
			}
		});

	},
};
```

I then deployed, and because I wanted to see it live, I built a demo in CodePen using Alpine.js. Now, this is using my key on the Cloudflare side so I'll have to shut it down if it gets too much traffic, but for now, have some fun with it. 

<p class="codepen" data-height="800" data-theme-id="dark" data-default-tab="result" data-slug-hash="RNbXwjm" data-pen-title="Evil SEO Recipe Machine" data-editable="true" data-user="cfjedimaster" style="height: 800px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/RNbXwjm">
  Evil SEO Recipe Machine</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Enjoy! 