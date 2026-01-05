---
layout: post
title: "Turning Recipe Data into an Astro Content Collection"
date: "2026-01-05T18:00:00"
categories: ["development"]
tags: ["javascript","astro"]
banner_image: /images/banners/cat-stove.jpg
permalink: /2026/01/05/turning-recipe-data-into-an-astro-content-collection
description: Converting text-based recipe data into Astro content.
---

As I continue to dig into, and learn, [Astro](https://astro.build), I thought I'd take a look at creating custom [content collections](https://docs.astro.build/en/guides/content-collections/). Content collections are pretty much exactly how they sound - collection of content items you can use within your Astro site. If you go through the *excellent* [Astro tutorial](https://docs.astro.build/en/tutorial/0-introduction/) you will find this discussed at the end in the final [optional step](https://docs.astro.build/en/tutorial/6-islands/4/) step. Content collections aren't required - you can build dynamic sets of data just using file system operations (and that's how the tutorial has you build the blog) - but they make it easier (imo) to re-use content throughout the site. 

I encourage you to check out the [docs](https://docs.astro.build/en/guides/content-collections/), but generally content collections come down to three types:

* A glob pointing to a folder of Markdown, MDX, Markdoc, JSON, YAML, or TOML files.
* A pointer to one file that has multiple records of data (think big ass JSON file or CSV)
* Anything and everything else if you're willing to write code for a [custom loader](https://docs.astro.build/en/guides/content-collections/#building-a-custom-loader)

For my demo today, I decided to revisit a post from 2022, ["Use Your Saffron Recipes in the Jamstack"](https://www.raymondcamden.com/2022/04/11/use-your-saffron-recipes-in-the-jamstack).

## Recipes and Saffron

For many years, I made use of [Saffron](https://www.mysaffronapp.com/), an elegant web-site/mobile app for recipe management. It supports reading and parsing ugly recipe URLs (which I've covered on this blog quite a bit) as well as letting you manage recipes in different cookbooks. It is a *damn* good site, but I hit the limit of the free tier a few months back and as I don't really use the import feature much, switched to simply using OneNote instead. That being said, I *absolutely* think it's a cool site and worth the $$ if you want the additional storage above their free tier. 

One more reason to like them is that you can, at any point, without wait, get an export of your data. This will give you a zip file of recipes in text file format which look like so:

```
Title: Soft and Chewy Chocolate Chipless Cookies
Description: 
Source: Sofi | Broma Bakery
Original URL: https://bromabakery.com/chocolate-chipless-cookies/
Yield: 16,16 cookies
Prep: 15 minutes
Cook: 11 minutes
Total: 1 hour
Cookbook: Deserts
Section: Cookies
Image: 
Ingredients: 
	3/4 cup unsalted butter
	1 cup brown sugar, packed
	1/4 cup granulated sugar
	1 egg + 1 egg yolk, room temperature
	1 tablespoon vanilla extract
	1 3/4 cup all purpose flour
	3/4 teaspoon baking soda
	1 teaspoon sea salt + more for sprinkling
Instructions: 
	Brown the butter over medium heat, stirring constantly until the butter begins to foam and turns a golden brown, emitting a nutty aroma. Make sure you only brown the butter lightly. When butter browns the liquid evaporates off which can dry out your dough. As soon as the butter starts to turn brown and smell nutty, take it off the heat to prevent any more liquid from escaping. Take butter off the heat and allow to cool.
	In a large mixing bowl combine the cooled brown butter, brown sugar, and white sugar. Beat until mixed together. Add in the egg, egg yolk, and vanilla extract. Mix well.
	In separate bowl mix together the flour, salt and baking soda. Mix half the dry ingredients into the wet until everything comes together. Slowly add in the remaining flour a little bit at a time, stopping if the dough starts to get too dry.
	Refrigerate the cookie dough for at least a half hour, or overnight.
	When you are ready to bake the cookies, preheat the oven to 350°F and line a cookie sheet with parchment paper. Use a 1 ounce cookie scoop to scoop the cookie dough out into balls, placing them 2 inches apart on the prepared sheet. Bake for 11 minutes*, or until the edges are just golden brown and the centers have puffed up but are still gooey.
	Allow to cool before eating!
```

The format follows a pattern of "Key: Value", but with multiple line items being tabbed over from the key defined on the previous line. Back in 2022 for my [original post](https://www.raymondcamden.com/2022/04/11/use-your-saffron-recipes-in-the-jamstack), I wrote a simple function that parsed this data into a basic JavaScript object. Here's the version I have now (slightly modified from the original):

```js
function parseRecipe(txt:string) {
	let result:any = {};
	let lastKey = '';

	let lines = txt.split('\n');

	for(let i=0;i<lines.length;i++) {
		//if the line starts with a tab, its a continuation
		if(lines[i].indexOf('\t') === 0) {		
			result[lastKey] += lines[i].replace('\t', '') + '\n';
		} else {
			let key = lines[i].split(':')[0];
			let rest = lines[i].replace(`${key}: `,'');
			result[key] = rest;
			lastKey = key;
		}
	}

	// lowercase keys and remove spaces, should i also remove the upper case keys?
	for(let key of Object.keys(result)) result[key.toLowerCase().replace(/ /g,'')] = result[key];

	// special handle for ingredients and instructions to turn into arrays
	if(result.ingredients) result.ingredients = result.ingredients.split('\n').map((i:string) => i.trim()).filter((i:string) => i.length > 0);
	if(result.instructions) result.instructions = result.instructions.split('\n').map((i:string) => i.trim()).filter((i:string) => i.length > 0);
	return result;

}
```

The only real "fancy" part here is how I handle noting the multiline line data by looking for tab characters. 

## Creating the Astro Content Collection

To create my Astro custom content collection, I started by defining `src/content.config.ts`. This file is where all collections are defined, in my case my demo only has the one:

```js
import { defineCollection } from 'astro:content';
import fs from 'node:fs/promises';

function parseRecipe(txt:string) {
	let result:any = {};
	let lastKey = '';

	let lines = txt.split('\n');

	for(let i=0;i<lines.length;i++) {
		//if the line starts with a tab, its a continuation
		if(lines[i].indexOf('\t') === 0) {		
			result[lastKey] += lines[i].replace('\t', '') + '\n';
		} else {
			let key = lines[i].split(':')[0];
			let rest = lines[i].replace(`${key}: `,'');
			result[key] = rest;
			lastKey = key;
		}
	}

	// lowercase keys and remove spaces, should i also remove the upper case keys?
	for(let key of Object.keys(result)) result[key.toLowerCase().replace(/ /g,'')] = result[key];

	// special handle for ingredients and instructions to turn into arrays
	if(result.ingredients) result.ingredients = result.ingredients.split('\n').map((i:string) => i.trim()).filter((i:string) => i.length > 0);
	if(result.instructions) result.instructions = result.instructions.split('\n').map((i:string) => i.trim()).filter((i:string) => i.length > 0);
	return result;

}

const recipes = defineCollection({ 
	loader: async () => {
		/*
		can't use Astro's glob here because it's doesn't support .txt files
		*/
		const files = (await fs.readdir('./recipes')).filter((file) => file.endsWith('.txt'));
		let r = [];

		for(const file of files) {
			let contents = await fs.readFile(`./recipes/${file}`, 'utf-8');
			let recipe = parseRecipe(contents);

			r.push({
				id: file.replace('.txt',''),
				slug: file.replace('.txt',''),
				recipe
			});

		}

		return r;
   }
});

export const collections = { recipes };
```

Basically - scan the folder of recipes (where I extracted the zip Saffron exported) and add the information to an array. Per the Astro docs, I ensured I defined an `id` and `slug` value to uniquely identify the data. 

## Using the Collection

Once defined, it's rather trivial to use the information. On my index page, I simply list out all of the recipes:

```html
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';

const allRecipes = await getCollection('recipes');
---

<BaseLayout pageTitle="Recipes">
  <div class="recipe-container">
    <h1 class="recipe-title" style="font-size: 2.8em; margin-bottom: 40px;">All Recipes</h1>
    {allRecipes.map((recipe) => (
      <div class="recipe-card">
        <h2
          class="recipe-title"
          style="font-size: 2em; text-align: left; margin-bottom: 10px;"
        >
          <a href={`/recipes/${recipe.id}`} style="text-decoration: none; color: inherit;">
            {recipe.data.recipe.title}
          </a>
        </h2>
        {recipe.data.recipe.description && (
          <p class="recipe-description" style="text-align: left; font-style: normal;">
            {recipe.data.recipe.description}
          </p>
        )}
      </div>
    ))}
  </div>
</BaseLayout>
```

And then defined a dynamic route for each recipe in `src/pages/recipes/[id].astro`:

```html
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const recipes = await getCollection('recipes');
  return recipes.map(recipe => ({
    params: { id: recipe.id },
    props: { recipe },
  }));
}

const { recipe } = Astro.props;
const { title, description, source, ingredients, instructions } = recipe.data.recipe;
---

<BaseLayout pageTitle={title}>
  <div class="recipe-container">
    <div class="recipe-card">
      <h1 class="recipe-title">{title}</h1>

      {description && <p class="recipe-description">{description}</p>}
      {source && <p class="recipe-source">From: {source}</p>}

      {
        ingredients && (
          <>
            <h3>Ingredients</h3>
            <ul class="ingredient-list">
              {ingredients.map((item: string) => (
                <li>{item}</li>
              ))}
            </ul>
          </>
        )
      }

      <h3>Instructions</h3>
      <ol class="instruction-list">
        {instructions.map((step: string) => (
          <li>{step}</li>
        ))}
      </ol>
    </div>
  </div>
</BaseLayout>
```

I used Google Gemini to help me define a simple layout and deployed it to Netlify here: <https://astro-recipes-demo.netlify.app/>. For the most part, it worked well, but one recipe, and it just so happens the first one, <https://astro-recipes-demo.netlify.app/recipes/bananabread/>, has weird formatting for instructions, but that's the fault of the source data as it was one of the few that had hard-coded numbers in the instruction text. Ignore that and check out my [basic bread](https://astro-recipes-demo.netlify.app/recipes/basicbreadsavory/) with savory stuff recipe instead. 

You can find the complete source for this app here: <https://github.com/cfjedimaster/astro-tests/tree/main/recipes>

As a quick note, I could also make use of the Cookbook and Section values from Saffron if I wanted to make this more complex and depending on how this first week back in 2026 goes, I may do just that. Enjoy!

Photo by <a href="https://unsplash.com/@rliiaz?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Lia</a> on <a href="https://unsplash.com/photos/a-black-and-white-cat-sitting-on-top-of-a-stove-RROJ0DKymio?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      