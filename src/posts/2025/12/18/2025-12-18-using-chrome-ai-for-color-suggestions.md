---
layout: post
title: "Using Chrome AI for Color Suggestions"
date: "2025-12-18T18:00:00"
categories: ["development"]
tags: ["javascript","generative ai"]
banner_image: /images/banners/color-palette.jpg
permalink: /2025/12/18/using-chrome-ai-for-color-suggestions
description: Using AI to suggest RGB colors in response to a basic text prompt. 
---

Today's blog post came to me on the way to dropping of my kids at school and made *complete* sense to me, but I've also got the flu and am heavily medicated, so take that for what you will. The idea was simple, given a description of something in the real world, could I use AI to generate RGB colors that would represent that abstract idea. I thought this could be a good use of Chrome's [built-in AI](https://developer.chrome.com/docs/ai/built-in) model and decided to whip up a quick demo. 

The front end is pretty simple, just a form for you to enter your description and a place for the results:

```html
<h2>Description to Color</h2>
<p>
	In the form field below, describe the color you are trying to recreate and Chrome AI will attempt to match it with RGB colors.
</p>
<div class="twocol">
	<div>
	<p>
		<textarea id="input"></textarea>
	</p>
	<p>
		<button disabled id="runBtn">Determine Color</button>
	</p>
	</div>
	<div id="result"></div>
</div>
```

The JavaScript is where the magic lies of course. I'll skip over the DOM manipulation stuff and focus on the parts specific to Chrome's AI implementation. First, I created a schema to constrain my results:

```js
const colorResultSchema = {
	type:"object", 
	properties: {
		description:{
			type:"string"
		},
		colors: {
			type:"array", 
			items: {
				type:"string"
			}
		}
	}
};
```

Essentially I wanted the model to explain it's results at a high level, and then just return a list of colors. 

Next, here's how I create my session from the model - the important bit being the system prompt:

```js
session = await window.LanguageModel.create({
    initialPrompts: [
        { role: 'system', content: 'You take a description of a color and attempt to match the description to 1-5 different RGB colors that could be used on a web site. You will return an explanation of your results along with a list of RGB values in hexadecimal format.' },			
    ],
    monitor(m) {
        m.addEventListener("downloadprogress", e => {
            console.log(`Downloaded ${e.loaded * 100}%`);
            /*
                    why this? the download event _always_ runs at
                    least once, so this prevents the msg showing up
                    when its already done. I've seen it report 0 and 1
                    in this case, so we skip both
                    */
            if(e.loaded === 0 || e.loaded === 1) return;
            $result.innerHTML = `Downloading, currently at ${Math.floor(e.loaded * 100)}%`;
        });
    }			
});
```

And the last bit is just taking the user's prompt, running it, and displaying the results:

```js
let result = await thisSession.prompt(input, { responseConstraint: colorResultSchema });
result = JSON.parse(result);

$result.innerHTML = `
<h2>Result</h2>
<p>
${result.description}
</p>
<p>
`;
for(let i=0;i<result.colors.length;i++) {
    $result.innerHTML += `RGB: ${result.colors[i]} <div class="swatch" style="background-color: ${result.colors[i]}"></div><br>`
}
```

I'm going to embed the demo below, but as the [Prompt API](https://developer.chrome.com/docs/ai/prompt-api) is still behind a flag, here's some screenshots:

<p>
<img src="https://static.raymondcamden.com/images/2025/12/aicolor.jpg" loading="lazy" alt="the color of trees in winter" class="imgborder imgcenter">
</p>

Bonus points if you identify this prompt:

<p>
<img src="https://static.raymondcamden.com/images/2025/12/aicolor2.jpg" loading="lazy" alt="The sky above the port was the color of television, tuned to a dead channel" class="imgborder imgcenter">
</p>

You can see the full code, and play with it yourself (again, if you enable that flag in Chrome), below:

<p class="codepen" data-height="600" data-theme-id="dark" data-default-tab="result" data-slug-hash="pvyMEGM" data-pen-title="Description to Color" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em; ">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/pvyMEGM">
  Description to Color</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>
<br>


Header photo by <a href="https://unsplash.com/@kommumikation?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Mika Baumeister</a> on <a href="https://unsplash.com/photos/yellow-orange-and-blue-textile-NSI6XtbabNw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      