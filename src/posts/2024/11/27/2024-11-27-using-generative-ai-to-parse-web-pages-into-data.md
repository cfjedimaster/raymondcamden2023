---
layout: post
title: "Using Generative AI to Parse Web Pages into Data"
date: "2024-11-27T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_glass_screen.jpg
permalink: /2024/11/27/using-generative-ai-to-parse-web-pages-into-data
description: A look at using GenAI to parse a recipe into pure data.
---

A few months back, I took a look at using JSON-LD to turn a recipe web page into pure data: [Scraping Recipes Using Node.js, Pipedream, and JSON-LD](https://www.raymondcamden.com/2024/06/12/scraping-recipes-using-nodejs-pipedream-and-json-ld). This relied on a recipe actually *using* JSON-LD in the header to describe itself, which is pretty common for SEO purposes. Still, I was curious as to how well generative AI could solve this problem. In theory, this could be a good 'backup' in cases where a site wasn't using JSON-LD and a general exploration of 'parsing' a web page into data. I'll be using [Google Gemini](https://gemini.google.com/app) again, but in theory, this demo would work in other services as well. Here's what I found.

## Converting a Web Page into Structured Data

In order to turn a web page into structured data, I needed a few different things. First, remember that Google's Gemini service supports the ability to use JSON Schema to tell the API how to return a result. (You can find my exploration of that feature here: [Using JSON Schema with Google Gemini](https://www.raymondcamden.com/2024/06/11/using-json-schema-with-google-gemini)).

The code for this isn't difficult, it just becomes part of your request, but crafting the schema correctly can be a bit of work. As I suggested earlier this year, use the [JSON Schema](https://json-schema.org/) website for help and examples. 

As I'm working with recipes, I defined my schema as such:

```js
{
  "description": "A recipe.",
  "type": "object",
	"properties": {
		"name": {
			"type":"string"
		},
		"ingredients": {
			"type":"array",
			"items": {
				"type":"string"
			}
		},
		"steps": {
			"type":"array",
			"items": {
				"type":"string"
			}
		}
	},
	"required": ["name","ingredients","steps"]
}
```

This could be fleshed out more, for example, with a duration properly. I also could have attempted to coerce the ingredients into an array of objects containing the name of the ingredient and quantity. As always, take my blog posts as a starting point and if you build on it, let me know!

The next issue I ran into was actually getting the HTML. Gemini can't be told to go fetch a URL, but my code can. I initially attempted to take the HTML and simply append it to the prompt, but this caused issues. So, I took another approach - simply saving the HTML and uploading it to Gemini for a multimodal prompt. As a reminder, multimodal is just a fancy way of saying "prompt with an associated file or files", and again, I've got a blog post for that to help you: [Using the Gemini File API for Prompts with Media](https://www.raymondcamden.com/2024/05/21/using-the-gemini-file-api-for-prompts-with-media)

Given a string of HTML, here's a simple implementation:

```js
const fileManager = new GoogleAIFileManager(API_KEY);

// Store to a file temporarily - note the hard coded path, should be a uuid
fs.writeFileSync('./test_temp.html', html, 'utf8');

const uploadResult = await fileManager.uploadFile('./test_temp.html', {
	mimeType:'text/html',
	displayName: "temp html content",
});
const file = uploadResult.file;
```

As the comment says, you should absolutely not use a hardcoded path, but rather something dynamic like a UUID. My demo doesn't even clean up the file, but I assume that's a trivial change if folks want to use my code. You may be wondering - can you skip the file system? Unfortunately no, not with the Node SDK. If you switched to using the REST API, you absolutely could and do a direct push, but that's quite a few more steps and not worth the effort, but it *is* possible. 

Next, I designed my system instruction:

```js
const si = `
You are an API that attempts to parse HTML content and find a recipe. You will try to find the name, ingredients, and 
directions. You will return the recipe in a JSON object. If you are unable to find a recipe, return nothing.
`;
```

And my prompt, which is pretty boring:

```
Given the HTML content, attempt to find a recipe.
```

Using this recipe, <https://www.allrecipes.com/recipe/10275/classic-peanut-butter-cookies>, here's what I get back:

```js
{
    "ingredients": [
        "1 cup unsalted butter",
        "1 cup crunchy peanut butter",
        "1 cup white sugar",
        "1 cup packed brown sugar",
        "2 large eggs",
        "2.5 cups all-purpose flour",
        "1.5 teaspoons baking soda",
        "1 teaspoon baking powder",
        "0.5 teaspoon salt"
    ],
    "name": "Classic Peanut Butter Cookies",
    "steps": [
        "Gather all ingredients.",
        "Beat butter, peanut butter, white sugar, and brown sugar with an electric mixer in a large bowl until smooth; beat in eggs.",
        "Sift flour, baking soda, baking powder, and salt into a separate bowl; stir into butter mixture until dough is just combined. Chill cookie dough in the refrigerator for 1 hour to make it easier to work with.",
        "Preheat the oven to 375 degrees F (190 degrees C). Roll dough into 1-inch balls and place 2 inches apart onto ungreased baking sheets. Flatten each ball with a fork, making a crisscross pattern.",
        "Bake in the preheated oven until edges are golden, about 7 to 10 minutes.",
        "Cool on the baking sheets briefly before removing to a wire rack to cool completely."
    ]
}
```

I put this into a simple web app where you could enter a URL, hit parse, and get the simpler version. This is a screenshot from the original, the complete page, where I cut out about 80% of the screenshot and it's still... a lot. Also notice the actual recipe isn't displayed in this portion.

<p>
<img src="https://static.raymondcamden.com/images/2024/11/recipe1.jpg" alt="Screenshot of recipe web site" class="imgborder imgcenter" loading="lazy">
</p>

Compared to my web app version:

<p>
<img src="https://static.raymondcamden.com/images/2024/11/recipe2.jpg" alt="Screenshot of recipe parsed to pure data" class="imgborder imgcenter" loading="lazy">
</p>

I know which version I prefer. So, if you want to see the full code, you can find everything up at my repo: <https://github.com/cfjedimaster/ai-testingzone/tree/main/recipe_scraper> Unfortunately I can't run this live, but folks are free to take my code and run with it. My code is built to power a web app, but you could just as easily take the core logic and put it in a serverless function instead. 