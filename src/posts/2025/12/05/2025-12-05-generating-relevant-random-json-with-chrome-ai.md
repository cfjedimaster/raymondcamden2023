---
layout: post
title: "Generating Relevant Random JSON with Chrome AI"
date: "2025-12-07T18:00:00"
categories: ["development"]
tags: ["javascript","generative ai"]
banner_image: /images/banners/cat_statues.jpg
permalink: /2025/12/07/generating-relevant-random-json-with-chrome-ai
description: Creating random, unique new JSON values
---

A few weeks ago I blogged a demo where I used Chrome's on-device AI feature to parse a "generic template language" and return random strings. If you're so inclined (and of course you are), you can read that post here: ["Creating a Generic Generative Language with Chrome AI"](https://www.raymondcamden.com/2025/11/03/creating-a-generic-generative-language-with-chrome-ai). The idea was to give the AI model a template string that described what was random, and how it was random (this is a name, this is a number, this is a color, etc) and have the model fill in the blanks with appropriate values. 

At [work](https://webflow.com), I've been digging into our platform and trying to learn as much as possible. One of the cooler features of Webflow is the CMS. You define a collection (type of content) which has a name and a set of fields. Each field has properties that define it. As an example, here's my Cat collection:

<p>
<img src="https://static.raymondcamden.com/images/2025/12/col1.jpg" loading="lazy" alt="Cat collection consisting of fields" class="imgborder imgcenter">
</p>

Make note of the custom fields there. Along with and slug, and some metadata fields, they make up a definition of "Cat" that I can use within my site. One of the cooler features of this part of the product is that when you first define the collection, it offers to make some random content for you, and when it does, it does it "appropriately". By that I mean it's not just lorem ipsum, but relevant values. In particular, "Breed" had multiple different real cat breeds, and the names were on target as well. 

I found this darn handy and it got me thinking recently how I could recreate it with Chrome AI. Specifically:

* Given a name that describes the content
* Given a basic JSON shape
* Generate a random value with sensible data

I was able to get it working - mostly - and here's the result.

## Version One 

For my first version, I built a simple form that asked for two things - the name of the content your JSON was describing, and a JSON packet that described the shape of the content. I also pre-loaded some content so I'd have less to type:

```html
<p>
	Enter a basic JSON object that will be used as a sample. It should look something like the predefined sample below. Also enter a name that represents what the JSON object represents, so for example, a "person", or "cat".
</p>
<p>
	<label for="name">Name:</label> <input id="name" value="cat">
</p>
<p>
	<label for="input">JSON Sample</label>
	<textarea id="input">
{
		"name":"string",
		"age":"number",
		"gender":"string",
		"breed":"string"
}
	</textarea>
</p>
<p>
	<button disabled id="runBtn">Run</button>
</p>

<div id="result"></div>
```

Out of the box, my demo says it's describing a cat with properties for name, age, gender, and breed. Now, let's look at the JavaScript. I'm going to skip over some of the basic DOM manipulation stuff and instead focus ont he AI related code. 

With that in mind, here's how I setup the session:

```js
session = await window.LanguageModel.create({
    initialPrompts:[
        { role: 'system', content: 'You generate a random JSON object based on an input consisting of a name that represents the type of content and a JSON object that has keys and types, like name:string. Given that you know the name of the content, like "person", when you see a field like name and its a string, you should generate a random name. If the name of the content represented an animal, and a field was breed, you would pick a relevant breed for that animal. When returning a result, ONLY return the sample JSON object. No commentary, just the JSON.' }
    ],
    monitor(m) {
        m.addEventListener("downloadprogress", e => {
            console.log(`Downloaded ${e.loaded * 100}%`);
            
            if(e.loaded === 0 || e.loaded === 1) return;
            $result.innerHTML = `Downloading, currently at ${Math.floor(e.loaded * 100)}%`;
        });
    }
}); 
```

I'm rather proud of that system prompt. I usually don't do a good job there but this is pretty clear I think. Now, when the user submits the form, this is run:

```js
let result = await session.prompt(`
The name of the JSON object is ${name} and it is described like so:
${input}
`);
console.log(result);
$result.innerHTML = marked.parse(result);
```

Pretty simple, right? So how does it work? Using the out of the box defaults I used in the form, I get:

```json
{
  "name": "Whiskers",
  "age": 3,
  "gender": "female",
  "breed": "Siamese"
}
```

```json
{
  "name": "Luna",
  "age": 2,
  "gender": "female",
  "breed": "Maine Coon"
}
```

```json
{
  "name": "Jasper",
  "age": 5,
  "gender": "male",
  "breed": "Ragdoll"
}
```

That's pretty good! But as you'll note in the JavaScript above, I'm expecting Markdown back. In fact, this is actually what I got:

<script src="https://gist.github.com/cfjedimaster/564ee3e6f2e5aff95c089d89fd8c9890.js"></script>

With this in mind, I started on a second version to try to get *just* the JSON back. You can play with the full demo of the first version below:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="jEqQmBd" data-pen-title="Chrome AI to JSON" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/jEqQmBd">
  Chrome AI to JSON</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

## Version Two

Normally when I want to have control over the generation of model output, I turn to [structured output](https://developer.chrome.com/docs/ai/prompt-api#pass_a_json_schema). You generate JSON schema that matches your desired output, pass it to the model, and then your result should match it exactly. The issue I had though was that my JSON itself was dynamic. I had no idea what was going to be passed, which means I couldn't determine what schema to use. Turns out - there's actually *multiple* libraries out there that will take sample data and attempt to turn it into a JSON schema. 

I came across [schematized](https://www.jsdelivr.com/package/npm/schematized) which does exactly that. Here's an example from their docs:

```js
import SchemaBuilder from 'schematized' // Typescript & ESM

const builder = new SchemaBuilder()

// Consume JSON
builder.addObject({
  token: '74aea1a53d68b77e4f1f55fa90a7eb81',
  role: ['Basic'],
})

// Produce JSON Schemas!
const schema = builder.toPrettySchema()
```

Which produces:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "token": {
      "type": "string",
      "maxLength": 32,
      "minLength": 32
    },
    "role": {
      "type": "array",
      "items": {
        "type": "string",
        "maxLength": 5,
        "minLength": 5
      }
    }
  },
  "required": [
    "role",
    "token"
  ],
  "additionalProperties": false,
  "maxProperties": 2,
  "minProperties": 2
}
```

That seemed logical enough, so I gave it a try. I imported the library and built a schema from the form input:

```js
builder.addObject(JSON.parse(input));
let schema = builder.toSchema();
```

This is then passed to the `prompt` call:

```js
let result = await session.prompt(`
The name of the JSON object is ${name} and it is described like so:
${input}
`, { responseConstraint: schema });
```

And... it worked... kinda. But I noticed something odd with my results. Here's the result, again using my default JSON from the form:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "additionalProperties": false,
  "maxProperties": 4,
  "minProperties": 4,
  "properties": {
    "name": {
      "type": "string",
      "maxLength": 6,
      "minLength": 6
    },
    "age": {
      "type": "string",
      "maxLength": 6,
      "minLength": 6
    },
    "gender": {
      "type": "string",
      "maxLength": 6,
      "minLength": 6
    },
    "breed": {
      "type": "string",
      "maxLength": 6,
      "minLength": 6
    }
  },
  "required": [
    "age",
    "breed",
    "gender",
    "name"
  ],
  "type": "object"
}
```

See the issue? Each property ended up with a min and max length based on my input. Schematized supports passing in multiple examples to create better output, so it's not really the libraries fault, but these constraints were screwing up my output. It's kinda lame, but I went with this approach:

```js
builder.addObject(JSON.parse(input));
let schema = builder.toSchema();

/*
The schema is a bit too strict on min and max length, so remove it
*/
for(let p in schema.properties) {
    if(schema.properties[p].maxLength) delete schema.properties[p].maxLength;
    if(schema.properties[p].minLength) delete schema.properties[p].minLength;
};
```

Now when I run, I get almost perfect results:

```json
{"name": "Whiskers", "age": "3", "gender": "Female", "breed": "Siamese"}
```

```json
{"name": "Mittens", "age": "5", "gender": "Female", "breed": "Persian"}
```

```json
{"name": "Shadow", "age": "2", "gender": "Male", "breed": "Bengal"}
```

I say almost perfect because my age went from being really numeric to a string, but if you remember, this is how it looked in the input:

```
"age":"number",
```

The quotes there around number, when sent to Schematized, made it think it should be a string, and to be honest, I don't blame it. I could absolutely do some magic on my input and look for "number" and change it, but, I figured that was enough for this simple experiment for now. As before, you can see the full code, and test (if you've enabled the right flags) below:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="PwNxmEa" data-pen-title="Chrome AI to JSON V2" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/PwNxmEa">
  Chrome AI to JSON V2</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>


CC0 licensed photo by Shinya B from the WordPress Photo Directory: https://wordpress.org/photos/photo/873640b0d0/