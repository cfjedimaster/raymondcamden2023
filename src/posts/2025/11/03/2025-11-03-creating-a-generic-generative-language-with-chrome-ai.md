---
layout: post
title: "Creating a Generic Generative Language with Chrome AI"
date: "2025-11-03T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/light_book.jpg
permalink: /2025/11/03/creating-a-generic-generative-language-with-chrome-ai
description: Using on-device AI to parse a template language.
---

As I explore Chrome's [on-device AI](https://developer.chrome.com/docs/ai/get-started) initiatives, one of the things I'm doing is looking at some of my older demos (kinda funny to think of 'old' GenAI demos) and seeing which may make sense in the browser versus API calls. Last July, I investigated [creating a template language parser](https://www.raymondcamden.com/2024/07/10/creating-a-generic-generative-template-language-in-google-gemini) with Google Gemini. The idea was - take a string with tokens that defined a type of word and have Gemini replace it. So for example:

```
{%raw%}My name is {{ name }} and my favorite food is {{ food }}.{%endraw%}
```

I asked Gemini to look for values inside brackets, use that as the seed of a random word, and replace it. So for example:

```
My name is Frederic Dinglehooper the 3rd and my favorite food is sushi.
```

I thought this would be a natural candidate for exploration on the client-side, so I took it for a whirl.

## Attempt One

My first attempt tried to recreate the Gemini demo with nearly the exact same code. So I started off defining a system instruction - this is the same from the previous demo with the addition of the second paragraph:

```js
const SI = `
{%raw%}You are a text parser. Given a prompt with variables wrapped in 
{{ and }}, you will replace that with a value based on the contents of 
the text inside the brackets. So for example, {{noun}}, means to 
replace it with a random noun, and {{animal}}, means to replace it 
with a random animal. You also support storing and remembering 
values. If the string inside the brackets contains a colon, the value
after the colon is the name of a variable. So for example, 
{{noun:itemX}} means to select a random noun and insert it into the 
result, but also store the value in a variable named itemX. If I use
{{itemX}} again, you will use the previous value.

Do NOT return anything but the parsed string with tokens replaced. 
Do not talk about what you are doing. Just return the result. 
`{%endraw%};
```

I've got some code to handle basic DOM manipulation (on clicking a button, read the user's input, then do your magic), that then runs this function to do the actual transformation:

```js
async function runPrompt() {
	
	let input = $input.value.trim();
	if(input === '') return;
	
	if(!session) {
		session = await window.LanguageModel.create({
			initialPrompts: [
				{ role: 'system', content: SI },			
			],
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
					$result.innerHTML = `Downloading, currently at ${Math.floor(e.loaded * 100)}%`;
				});
			}			
		});
	}

	$runBtn.disabled = true;
	console.log(`input is: ${input}`);
	let result = await session.prompt(input);
	$result.innerHTML = marked.parse(result);
	$runBtn.disabled = false;
}
```

This is a fairly simple use of the [Prompt API](https://developer.chrome.com/docs/ai/prompt-api), so it *should* just work. 

And it did! I promise!

And then... it just didn't. I don't know why. I tested it in the morning, and it seemed perfect, I tested it in the afternoon and it 100% failed, or mostly failed. Every now and then it would replace a token, but mostly, it just didn't. You can see this failed attempt below, but note that the Prompt API is still behind a flag on Chrome.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="xbZjGRr" data-pen-title="Generative Story Telling with Chrome AI" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/xbZjGRr">
  Generative Story Telling with Chrome AI</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

## Attempt Two

So - I did what I normally do when I see something weird like this - reach out for help - and my buddy [Thomas Steiner](https://blog.tomayac.com/), devrel at Google, had a simple suggestion. Use JavaScript to handle the tag parsing and then Chrome AI to handle the replacements. I figured I'd give that a short. 

I began with a function to find my tokens:

{% raw %}
```js
const getTokens = s => {
	let tokens = Array.from(s.matchAll(/{{.*?}}/gm));
	/*
	tokens is an array of arrays, such that x[0] is the matched string
	and x[0].index is where it was found. let's convert it to something simpler
	*/
	tokens = tokens.map(t => {
		return { match:t[0], token:t[0].replace(/[{}]/g,'').trim(), index:t.index };
	});
	return tokens;
}
```
{% endraw %}

Note that I return each match including the *actual* match, and the token with brackets. I return the index (where it was found) but I never used it. 

I then wrote a new utility function that literally just takes a word, the token, and generates the new word for it:

```js
const generateString = async p => {
	if(!session) {
		session = await window.LanguageModel.create({
			initialPrompts: [
				{ role: 'system', content: 'You are given a prompt that describes a word, or phrase, and return a random value. So for example, given "noun", you return a random noun. Given "color", you return a random color. Return your result in plain text with no Markdown markup.' },			
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
				});
			}			
		});
	}	
	
	return await session.prompt(p);
};
```

Next, I wrote a function to handle clicks and run the entire process:

```js
async function doParse() {
	$result.innerHTML = '';

	let input = $input.value.trim();
	if(input === '') return;
	console.log(`gonna parse ${input}`);
	$result.innerHTML = '<i>Working...</i>';

	let tokens = getTokens(input);
	let result = input;
	let namedTokens = {};
	console.log('tokens', tokens);
	for(let i=0; i<tokens.length; i++) {
		let t = tokens[i];
		// look for a "named" token
		if(t.token.indexOf(':') >= 0) {
			let [tag, name] = t.token.split(':');
			console.log('tag', tag, 'name', name);
			let newStr = await generateString(tag);
			namedTokens[name] = newStr;
			result = result.replaceAll(t.match, newStr);
		} else {
			let newStr;
			if(namedTokens[t.token]) newStr = namedTokens[t.token];
			else newStr = await generateString(t.token);
			result = result.replaceAll(t.match, newStr);
		}
	};

	$result.innerHTML = result;
}
```

I think the only real interesting part here is the caching aspect. As with the previous demo, I wanted the ability to reuse values in a string, so you could get a name, and then use it a second (or more) time. I have a simple lookup system for that in place.

So how does this run? Pretty good. Since most of you probably won't have the flag enabled, here are some inputs and outputs:

{% raw %}
```
INPUT:
My name is {{name:myname}} and my favorite color is {{ one of red or green }}. 
My favorite season is {{ season }} and I enjoy {{ hobbie }}.

My name was {{ myname }}.	

OUTPUT:
My name is Alice and my favorite color is red. My favorite season is 
Autumn and I enjoy Reading. My name was Alice.
```

And another:

```
INPUT:
A dragon once lived in {{ place }}, where she hoarded over a 
collection of {{ plural items }} while feeling quite 
{{ sad emotion }}.

OUTPUT:
A dragon once lived in Paris, where she hoarded over a 
collection of books while feeling quite melancholy.
```
{% endraw %}

If you want to give it a try, or just see the code, check it out below.


<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="dPGwjyP" data-pen-title="Test finding tokens" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/dPGwjyP">
  Test finding tokens</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

Photo by <a href="https://unsplash.com/@californong?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Nong</a> on <a href="https://unsplash.com/photos/person-holding-string-lights-on-opened-book-9pw4TKvT3po?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      