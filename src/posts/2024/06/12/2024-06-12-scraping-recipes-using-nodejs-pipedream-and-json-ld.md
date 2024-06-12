---
layout: post
title: "Scraping Recipes Using Node.js, Pipedream, and JSON-LD"
date: "2024-06-12T18:00:00"
categories: ["development"]
tags: ["javascript","pipedream","serverless"]
banner_image: /images/banners/cat_chef.jpg
permalink: /2024/06/12/scraping-recipes-using-nodejs-pipedream-and-json-ld
description: A look at building a recipe scraping service using Node and Pipedream.
---

It's pretty well known now that most, if not all, recipes on the internet are 90% crap and 10% actual recipe, at best. Obviously, there are outliers of course and obviously, if you are sharing your recipes online you are free to do so as you see fit, but speaking for myself, when I click a link to a recipe my assumption is that I'm going to have to "work" to figure out where the actual details are amongst the humorous backstories and other tidbits that don't actually tell you how to make what you're trying to make. 

That's why I love apps like [Saffron](https://www.mysaffronapp.com/). Not only is it incredibly minimal and laser-focused on recipes, it has an incredibly good "recipe importer" service that can translate nearly all URLs into a core set of ingredients and directions. I recommend it, both the website and mobile application. 

Recently I was thinking about what it would take to build my own version of that service. Not the complete recipe hosting app but just the "url to details" aspect. Turns out, one of the creators (Ben Awad) actually blogged about the topic in 2020: ["Scraping Recipe Websites"](https://www.benawad.com/scraping-recipe-websites/).

The blog post details how 75% of the time, he was able to automate the process, and outside of that, had to build a somewhat complex workaround for the remaining percentage. I decided to focus on the "easy" part, specifically parsing recipe metadata included in the HTML with [JSON-LD](https://json-ld.org/). It's a flavor of JSON supporting linked data and can be embedded on a site like so:

```html
<script type="application/json">
json stuff here...
</script>
```

Specifically, the metadata follows standardized structured data schemas supported in Google Search and this is why when you search (on Google at least), you can see "cards" summarizing results on top. Google is able to create those summary cards based on the data contained within the page in JSON-LD. 

<p>
<img src="https://static.raymondcamden.com/images/2024/06/recipe1.jpg" alt="Example showing recipe results in a fake Google search UI" class="imgborder imgcenter" loading="lazy">
</p>

One of those formats supports [Recipes](https://developers.google.com/search/docs/appearance/structured-data/recipe), which means a page containing a recipe can actually support a data-centric version of it, and in theory, all we need to do is *get* that from the page and go to town. Here's an example taken from Google's docs:

```json
{
	"@context": "https://schema.org/",
	"@type": "Recipe",
	"name": "Non-Alcoholic Piña Colada",
	"image": [
	"https://example.com/photos/1x1/photo.jpg",
	"https://example.com/photos/4x3/photo.jpg",
	"https://example.com/photos/16x9/photo.jpg"
	],
	"author": {
	"@type": "Person",
	"name": "Mary Stone"
	},
	"datePublished": "2024-03-10",
	"description": "This non-alcoholic pina colada is everyone's favorite!",
	"recipeCuisine": "American",
	"prepTime": "PT1M",
	"cookTime": "PT2M",
	"totalTime": "PT3M",
	"keywords": "non-alcoholic",
	"recipeYield": "4 servings",
	"recipeCategory": "Drink",
	"nutrition": {
	"@type": "NutritionInformation",
	"calories": "120 calories"
	},
	"aggregateRating": {
	"@type": "AggregateRating",
	"ratingValue": "5",
	"ratingCount": "18"
	},
	"recipeIngredient": [
	"400ml of pineapple juice",
	"100ml cream of coconut",
	"ice"
	],
	"recipeInstructions": [
	{
		"@type": "HowToStep",
		"name": "Blend",
		"text": "Blend 400ml of pineapple juice and 100ml cream of coconut until smooth.",
		"url": "https://example.com/non-alcoholic-pina-colada#step1",
		"image": "https://example.com/photos/non-alcoholic-pina-colada/step1.jpg"
	},
	{
		"@type": "HowToStep",
		"name": "Fill",
		"text": "Fill a glass with ice.",
		"url": "https://example.com/non-alcoholic-pina-colada#step2",
		"image": "https://example.com/photos/non-alcoholic-pina-colada/step2.jpg"
	},
	{
		"@type": "HowToStep",
		"name": "Pour",
		"text": "Pour the pineapple juice and coconut mixture over ice.",
		"url": "https://example.com/non-alcoholic-pina-colada#step3",
		"image": "https://example.com/photos/non-alcoholic-pina-colada/step3.jpg"
	}
	],
	"video": {
	"@type": "VideoObject",
	"name": "How to Make a Non-Alcoholic Piña Colada",
	"description": "This is how you make a non-alcoholic piña colada.",
	"thumbnailUrl": [
		"https://example.com/photos/1x1/photo.jpg",
		"https://example.com/photos/4x3/photo.jpg",
		"https://example.com/photos/16x9/photo.jpg"
		],
	"contentUrl": "https://www.example.com/video123.mp4",
	"embedUrl": "https://www.example.com/videoplayer?video=123",
	"uploadDate": "2024-02-05T08:00:00+08:00",
	"duration": "PT1M33S",
	"interactionStatistic": {
		"@type": "InteractionCounter",
		"interactionType": { "@type": "WatchAction" },
		"userInteractionCount": 2347
	},
	"expires": "2024-02-05T08:00:00+08:00"
	}
}
```

For the most part, I think you can look at this and figure out what each part means easy enough, but the [docs](https://developers.google.com/search/docs/appearance/structured-data/recipe) do provide a great level of detail about each part. For example, if you look at `duration` and see that it is "PT1M33S" you may be confused, but the docs tell us this is a duration in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format. 

Given that we're got docs, in theory, it shouldn't be too hard to automate this, right? Right???

## Step One - Getting the JSON-LD

I began by writing code to attempt to find the script tag with embedded JSON-LD in HTML. I tried via regex... and then gave up. Thankfully, I found this great [StackOverflow](https://stackoverflow.com/a/67898554/52160) post that detailed how to do it with [Cheerio](https://cheerio.js.org/). I've used CHeerio a few times in the past. It's basically jQuery for Node, allowing you to use familiar jQuery syntax with a pure HTML string. 

Based on the SO post, I whipped up this:

```js
async function findLDJSON(u) {
  let req = await fetch(u);
  let html = await req.text();
  let $ = cheerio.load(html);
  let jdjson = $("script[type='application/ld+json']");
  if(jdjson.length === 0) return;
  let content = JSON.parse(jdjson[0].children[0].data);
  /*
  I've seen this be an array, and just a json string with a top level @graph that seems to
  map the array I see elsewhere. So if array, return [0], else look for @graph. graph will
  be an array with one type per, so we'll try to find recipe and return it, which makes the
  check in findRecipe a bit redundant.
  */
  if(Array.isArray(content)) return content[0];
  else {
    if(content['@graph'] && Array.isArray(content['@graph'])) {
      for(let t of content['@graph']) {
          if(t['@type'] === 'Recipe') return t;        
      }
    }
  }
  return;
}
```

For the most part it follows the SO post, but as the long comment suggests, in my testing I saw two types of results. Either a simple array where I could return the first element or an object where the `@graph` element contained what I needed. I think this logic isn't 100% solid, but it seemed to work well in testing.  

The net result from this is a parsed object containing whatever was in the JSON-LD element. (As the `else` block and comments state, when `@graph` is used, I can filter out to Recipes immediately, while in the `if` block we don't actually do that. I definitely think this could be addressed better.) 

## Step Two - Getting the Recipe

The next block of code checks to see if the data was a recipe, and if so, handles simplifying the results. This part gets even more complex. First, the main function:

```js
function findRecipe(jdjson) {
  // @type is an array - not sure if ALWAYS an array
  if(jdjson['@type'].indexOf('Recipe') === -1) return;
  let result = {};
  result.name = jdjson['name'];
  result.image = jdjson['image'];
  result.description = jdjson['description'];
  result.cookTime = durationToStr(jdjson['cookTime']);
  result.prepTime = durationToStr(jdjson['prepTime']);
  result.totalTime = durationToStr(jdjson['totalTime']);
  result.category = jdjson['recipeCategory'] ?? '';
  result.cuisine = jdjson['recipeCuisine'] ?? '';
  result.ingredients = jdjson['recipeIngredient'];
  // todo, parse out to just text? see if types are more complex
  result.instructions = parseInstructions(jdjson['recipeInstructions']);
  result.yield = jdjson['recipeYield'][0];
  
  return result;
}
```

As you can see, I'm doing things like renaming keys from "recipeSomething" to just "something". I'm also rewriting some values. 

First, to translate duration I use a handy package named [TinyDuration](https://github.com/MelleB/tinyduration#readme). This parses the duration value and returns an object containing each unit (years, months, etc) and value. I want to convert this into a simple string so I used this function:

```js
function durationToStr(d) {
  if(!d) return '';
  let parsed = tinyduration.parse(d);
  let result = [];
  if(parsed.hours) {
      result.push(`${parsed.hours} hours`);
  }
  if(parsed.minutes) {
      result.push(`${parsed.minutes} minutes`);
  }
  if(parsed.seconds) {
      result.push(`${parsed.seconds} seconds`);
  }
  
  let formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  return formatter.format(result);
  
}
```

I freaking *love* Intl (and I've been trying to get conferences to accept a talk on it!) and the `ListFormat` function handles automatically creating things like "2 hours and 33 seconds" versus "15 minutes". 

Finally, instructions are simplified as well. They are either an array of strings or an array of objects, including images and things that I just strip out:

```js
function parseInstructions(instructions) {
  let result = [];
  for(let instruction of instructions) {
    if(typeof instruction === 'string') result.push(instruction);
    else {
      if(instruction['@type'] === 'HowToStep') result.push(instruction.text);
    }
  }
  return result;
}
```

## Results

So, did it work? Yep! Mostly anyway. Here's a set of recipe URLs and their results:

### Classic Peanut Butter Cookies

URL: <https://www.allrecipes.com/recipe/10275/classic-peanut-butter-cookies>

Result:

```js
{
  name: 'Classic Peanut Butter Cookies',
  image: {
    '@type': 'ImageObject',
    url: 'https://www.allrecipes.com/thmb/aeMeDEKlRCFKrx-RnghY-4q1BSY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/1-275-classic-peanut-butter-cookies-mfs15-1-8cbd4a21fe5f474982c00fecafae57bf.jpg',
    height: 1500,
    width: 1500
  },
  description: 'These peanut butter cookies are soft, chewy, and absolutely delicious! Easy to make with smooth or crunchy peanut butter for a crowd-pleasing treat.',
  cookTime: '10 minutes',
  prepTime: '15 minutes',
  totalTime: '85 minutes',
  category: [ 'Dessert' ],
  cuisine: [ 'American' ],
  ingredients: [
    '1 cup unsalted butter',
    '1 cup crunchy peanut butter',
    '1 cup white sugar',
    '1 cup packed brown sugar',
    '2 large eggs',
    '2.5 cups all-purpose flour',
    '1.5 teaspoons baking soda',
    '1 teaspoon baking powder',
    '0.5 teaspoon salt'
  ],
  instructions: [
    'Beat butter, peanut butter, white sugar, and brown sugar with an electric mixer in a large bowl until smooth; beat in eggs.',
    'Sift flour, baking soda, baking powder, and salt into a separate bowl; stir into butter mixture until dough is just combined. Chill cookie dough in the refrigerator for 1 hour to make it easier to work with.',
    'Preheat the oven to 375 degrees F (190 degrees C).',
    'Roll dough into 1-inch balls and place 2 inches apart onto ungreased baking sheets. Flatten each ball with a fork, making a crisscross pattern.',
    'Bake in the preheated oven until edges are golden, about 7 to 10 minutes. Cool on the baking sheets briefly before removing to a wire rack to cool completely.'
  ],
  yield: '48'
}
```

### Iced Pumpkin Cookies

I make this once or twice each fall. They are absolutely delicious.

URL: <https://www.allrecipes.com/recipe/10033/iced-pumpkin-cookies/>

Result:

```js
{
  name: 'Iced Pumpkin Cookies',
  image: {
    '@type': 'ImageObject',
    url: 'https://www.allrecipes.com/thmb/FvtXTdFkika4fqBMwIpek7OgudU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/10033iced-pumpkin-cookiesSheilaLaLondeVideo4x3-505c68b332134143961078d4165035b9.jpg',
    height: 1125,
    width: 1500
  },
  description: 'Soft pumpkin cookies made with canned pumpkin, perfectly spiced with cinnamon, nutmeg, and cloves, are drizzled with sweet icing for a cozy fall treat.',
  cookTime: '15 minutes',
  prepTime: '20 minutes',
  totalTime: '65 minutes',
  category: [ 'Dessert' ],
  cuisine: [ 'American' ],
  ingredients: [
    '2.5 cups all-purpose flour',
    '2 teaspoons ground cinnamon',
    '1 teaspoon baking powder',
    '1 teaspoon baking soda',
    '0.5 teaspoon ground nutmeg',
    '0.5 teaspoon ground cloves',
    '0.5 teaspoon salt',
    '1.5 cups white sugar',
    '0.5 cup butter, softened',
    '1 cup canned pumpkin puree',
    '1 egg',
    '1 teaspoon vanilla extract',
    "2 cups confectioners' sugar",
    '3 tablespoons milk',
    '1 tablespoon melted butter',
    '1 teaspoon vanilla extract'
  ],
  instructions: [
    'Preheat the oven to 350 degrees F (175 degrees C). Grease two cookie sheets.',
    'To make the cookies: Combine flour, cinnamon, baking powder, baking soda, nutmeg, cloves, and salt in a medium bowl.',
    'Cream together sugar and butter in a mixing bowl until fluffy, 2 to 3 minutes. Add pumpkin, egg, and vanilla; beat until creamy. Mix in flour mixture until combined. Drop tablespoonfuls of dough onto the prepared cookie sheets; flatten slightly.',
    'Bake in the preheated oven until centers are set, 15 to 20 minutes, switching racks halfway through. Transfer cookies to a wire rack to cool to room temperature, about 30 minutes.',
    'Meanwhile, make the icing: Stir together confectioners&#39; sugar, milk, butter, and vanilla in a bowl until smooth. Add milk as needed, to achieve drizzling consistency.',
    'Drizzle icing over cooled cookies with a fork.'
  ],
  yield: '36'
}
```

## The API

To wrap this all up, I built a [Pipedream](https://pipedream.com) workflow that lets you pass in a URL and get the result in JSON. As an example, take [this recipe](https://www.allrecipes.com/recipe/241152/fried-chicken-wings/) for chicken wings and pass it to the Pipedream endpoint for my workflow:

<https://eon16mr9g3by571.m.pipedream.net/?url=https://www.allrecipes.com/recipe/241152/fried-chicken-wings/>

This gives you:

```json
{
    "success": true,
    "recipe": {
        "name": "Fried Chicken Wings",
        "image": {
            "@type": "ImageObject",
            "url": "https://www.allrecipes.com/thmb/8SI7kuVs0lOwi7PiDvdou4Uzqe8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/241152-fried-chicken-wings-ddmfs-hero-3x4-1260-d37ffaac793c4db7a4ced4ab24a5d2ee.jpg",
            "height": 1125,
            "width": 1500
        },
        "description": "Fried chicken wings tossed in Buffalo wing sauce for the ultimate game day snack. A double coating of seasoned flour makes these wings extra crispy.",
        "cookTime": "10 minutes",
        "prepTime": "10 minutes",
        "totalTime": "50 minutes",
        "category": [
            "Appetizer",
            "Snack"
        ],
        "cuisine": [
            "U.S.",
            "American"
        ],
        "ingredients": [
            "12 small chicken wings",
            "0.25 teaspoon seasoned salt, or to taste",
            "1 cup all-purpose flour",
            "1 teaspoon coarse salt",
            "0.5 teaspoon ground black pepper",
            "0.25 teaspoon cayenne pepper",
            "0.25 teaspoon ground paprika",
            "2 quarts vegetable oil for frying",
            "1 (12 fluid ounce) bottle Buffalo wing sauce (such as Frank's®), or to taste"
        ],
        "instructions": [
            "Gather all ingredients.",
            "Season chicken wings lightly with seasoned salt.",
            "Mix flour, salt, black pepper, cayenne pepper, and paprika together in a wide, shallow bowl. Press wings into flour mixture to coat and arrange in a single layer on a large plate. Refrigerate coated wings for 15 to 30 minutes.",
            "Dredge wings again in flour mixture and return to the plate. Refrigerate wings once more for 15 to 30 minutes.",
            "Heat oil in a deep fryer or large saucepan to 375 degrees F (190 degrees C).",
            "Fry chicken wings in hot oil until crisp and juices run clear, 10 to 12 minutes. An instant-read thermometer inserted into the thickest part of the meat, near the bone, should read 165 degrees F (74 degrees C).",
            "Transfer fried wings to a large bowl. Drizzle sauce over wings and toss to coat.",
            "Serve and enjoy!"
        ],
        "yield": "6"
    }
}
```

You will notice that on the [recipe site](https://www.allrecipes.com/recipe/241152/fried-chicken-wings/), there is an "additional time" that isn't reflected in either the JSON-LD or my result. From what I can see, it isn't defined in the spec so I suppose that makes sense, and the total time is correct so that's good. In theory, you could use some math and always assume that if "COOK + PREP" is less than "TOTAL", just add an "additionalTime" value. 

I'd normally explain the workflow, but it's just an HTTP workflow with my code above split out into steps. Thankfully it's easy to share workflows via GitHub now so I'll do so here: <https://github.com/cfjedimaster/General-Pipedream-Stuff/tree/production/scrape-recipe-p_q6C9jr9>



