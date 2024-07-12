---
layout: post
title: "Scraping Recipes on the Web - Now with Display and Print"
date: "2024-07-12T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_cookbook.jpg
permalink: /2024/07/12/scraping-recipes-on-the-web-now-with-display-and-print
description: A followup to my previous post showing how to both scrape AND display recipes.
---

A few weeks back I wrote up the process of building an API that looks for JSON-LD on a web page containing recipe information, parse it, and return it as pure data. You can (and should before continuing on) that post here: [Scraping Recipes Using Node.js, Pipedream, and JSON-LD](https://www.raymondcamden.com/2024/06/12/scraping-recipes-using-nodejs-pipedream-and-json-ld). When I first shared this, someone (I forget your name, but thank you!) asked the natural follow up question - can we then render this to HTML or PDF? The answer is, of course, I just had to stop being lazy and build a proper web app. I fired up [Glitch](https://glitch.com) and created the following little demo.

<p>
<img src="https://static.raymondcamden.com/images/2024/07/recipe1.jpg" alt="Screenshot of Web App" class="imgborder imgcenter" loading="lazy">
</p>

It isn't the prettiest demo, but it gets the job done - converting a recipe site that's 90% adds/commentary to just the basics. To give you an idea of the change, the total network load on my app after loading the recipe is 140kb. 128 of that is just the image. 

On the real site, which is *still* loading crap, clocks in at 6.7MB. Wow. 

So, here's what I did. I began with minimal HTML. Up until a few seconds ago I had a hard-coded form value to make testing easier, but just now I moved it to an HTML comment:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="https://glitch.com/favicon.ico" />
    <title>Recipe Displayer</title>
    <link rel="stylesheet" href="/style.css" />
    <script src="/script.js" defer></script>    
  </head>
  <body>
  
    <h2>Recipe Displayer</h2>
    <p>
      Enter the URL of a site containing a recipe. I will call an API to try to
      parse out the crap, return the pure data, and then render it nicely below.
    </p>
    <p>
      <!-- Good for testing: https://www.allrecipes.com/recipe/241152/fried-chicken-wings/ -->
      <input type="url" id="recipeURL" placeholder="Enter URL here." /> 
      <button id="parseBtn">Parse</button>
    </p>

    <div id="status"></div>
    
    <div id="result"></div>
  </body>
</html>
```

The JavaScript code handles listening for the click event, calling the API I built in the [last post](https://www.raymondcamden.com/2024/06/12/scraping-recipes-using-nodejs-pipedream-and-json-ld), and then rendering the results. Note that I do not use 100% of the result, which is fine, and I used my best design skills for the render. I assume 99% of you can do better:

```js
document.addEventListener('DOMContentLoaded', init, false);

let $parseBtn, $recipeURL, $statusDiv, $resultDiv;

async function init() {
  console.log('loaded');
  $parseBtn = document.querySelector('#parseBtn');
  $recipeURL = document.querySelector('#recipeURL');
  $statusDiv = document.querySelector('#status');
  $resultDiv = document.querySelector('#result');
  
  $parseBtn.addEventListener('click', doParse, false);
}

async function doParse() {
  let url = $recipeURL.value.trim();
  if(url === '') return;
  console.log('will try to parse',url);
  
  $statusDiv.innerHTML = `Attempting to parse recipe from <strong>${url}</strong>`;
  $parseBtn.setAttribute('disabled','disabled');
  
  let req = await fetch(`https://eon16mr9g3by571.m.pipedream.net/?url=${url}`);
  let result = await req.json();
  console.log(result);
  
  $parseBtn.removeAttribute('disabled');
  $statusDiv.innerHTML = '';

  if(!result.success) {
    $resultDiv.innerHTML = `
    <p>
    Sorry, we were not able to parse a recipe from this URL.
    </p>
    `;
    return;
  }

  $statusDiv.innerHTML = '<button onClick="printRecipe()">Print This</button>';
  displayRecipe(result.recipe);
  
}

function displayRecipe(r) {
  let result = `
  <h2>${r.name}</h2>
  `;
  
  // switched to inline CSS for better print support
  if(r.image) result += `<p><img src=${r.image.url} style="max-width: 500px"></p>`;
  
  result += `
  <p>
  ${r.description}
  </p>
  
  <p>
  Prep Time: ${r.prepTime}<br>
  Cook Time: ${r.cookTime}<br>
  Total Time: ${r.totalTime}<br>
  </p>

  <h3>Ingredients</h3>
  <ul>
  `;
  
  
  r.ingredients.forEach(i => {
    result += `<li>${i}</li>`;
  });
  
  result += `
  </ul>
  
  <h3>Directions</h3>
  <ol>
  `;
  
  r.instructions.forEach(i => {
    result += `<li>${i}</li>`;
  });
  
  result += '</ol>';

  $resultDiv.innerHTML = result;
}

function printRecipe() {
  // Credit: https://stackoverflow.com/a/12997207/52160
  let prtContent = $resultDiv;
  var WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
  WinPrint.document.write(prtContent.innerHTML);
  WinPrint.document.close();
  WinPrint.focus();
  WinPrint.print();
  WinPrint.close();
  
}
```

The only real interesting part honestly is that last bit handling the print. Initially, I was going to add a 'Download to PDF', but I figure opening a print dialog lets you choose between printing it as is or saving it as a PDF. One thing I don't like is the print button using `onClick`, but as I don't have it visible until you get a good result, I didn't want to worry about adding the event handler and removing it, or remembering I already added it and so forth. I figured it was a quick and dirty way to get the job done. 

You can play with this yourself here: <https://display-recipe.glitch.me/>. The code is all available at Glitch here: <https://glitch.com/edit/#!/display-recipe>.