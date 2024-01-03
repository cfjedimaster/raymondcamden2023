---
layout: post
title: "Function Calling and GenAI"
date: "2024-01-03T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/cat_call2.jpg
permalink: /2024/01/03/function-calling-and-genai
description: What Function Calling means for Generative AI applications.
---

I love when I work on one demo, hit an issue, discover something else and get joyfully distracted into learning something completely different. In this case, it was a suggestion to help with an issue I was having with output from a prompt, and while it wasn't a good solution for what I was doing, it *was* an eye-opening look at a really cool feature of Generative AI - Function Calling.

Now, I'm new to GenAI, and new to this particular feature having been introduced to it a bit less than twenty-four hours ago. I know it's supported by Google AI APIs as well as OpenAI and a quick search around other offerings seems to imply it's a universal thing. 

I want to give a quick shout-out to [Allen Firstenberg](https://prisoner.com/) who helped me wrap my head around this a bit. Any misunderstanding is on me though, not him. 

## What is Function Calling?

Typically in a GenAI application, you issue a prompt and get a response in text, or an image if you're using something like [Firefly](https://firefly.adobe.com). 

Function calling is a bit different. Instead of returning text, the idea is to return the *intent* of your prompt mapped to a particular function.

That probably doesn't make sense, but I think a good way of thinking about it is how Alexa works. Now, I haven't done any Alexa development in a couple of years, but it was *incredibly* cool. When building an Alexa skill, you define the various "intents" that should be supported by it.

Consider a coffee store. When you go in, you probably only want to do one of two things:

* Ask for a menu (i.e. what kinds of coffee do you have)
* Make an order

When building your Alexa skill, you define those two intents, and define what arguments they may take. The first one, "what's on the menu" would take none, but the second one, "I'd like to order an espresso", would have an argument for the product.

You would define a few sample prompts (utterances in Alexa development), and from there, Alexa was smart enough to map random human input. So for example, I could say:

* I need a damn coffee, please.
* I want an espresso if you don't mind.
* I'd like to buy a double frap mocha latte with unicorn sprinkles and magic.

Alexa would map *all* of these to one intent - making an order. Even better, it would then determine the product:

* coffee
* espresso
* double frap mocha latte with unicorn sprinkles and magic

And finally, here's the cool bit. While Alexa did all the work of figuring this out, it would pass to your code something like this:

```json
{
	"intent":"order",
	"product":"coffee"
}
```

This worked *really* well (at least when I last used it) and *kinda* maps to what function calling does. 

## Ok, seriously, what is it?

Alright, so given the above, for our GenAI application, we can consider this feature to be a way to map your input to a function, with intelligent parsing of the input into various arguments.

I'm going to steal an example from the [Google docs](https://ai.google.dev/docs/function_calling) involving movies. In their code sample, they define three functions:

* find_movies
* find_theaters
* get_showtimes

Each of these has arguments. `get_showtimes` as an example has arguments for the location, movie, theater, and date. `find_theaters` is simpler and just requires a location and movie. 

If I use a prompt like `Which theaters in Mountain View show Barbie movie?` then the API attempts to map that to a function *and* figure out the arguments. Here is a portion of the result for that call demonstrating this:

```json
"content": {
	"parts": [
		{
		"functionCall": {
			"name": "find_theaters",
			"args": {
				"movie": "Barbie",
				"location": "Mountain View, CA"
			}
		}
		}
	]
},
```

The important thing to note here is that the result is **not the end!**. Rather, you are expected, much like in Alexa, to take this and implement that logic yourself. The API has handled the parsing and figured out the intent from the prompt, so the hard parts are done, now it's up to you to actually do the boring logic bit. 

## Show me a demo!

So I played with this a bit, of course, and built a simple demo. First off, note that the [Node.js SDK](https://www.npmjs.com/package/@google/generative-ai) does *not* support using this feature yet. However, the REST API was so trivial I'm almost tempted to not ever return to the SDK. 

At a high level, you pass in an object that will contain your prompt and then an array of function_declarations objects that define each function along with its arguments. This is all passed to the endpoint along with your key and... literally that's it. I also found that when I messed things up, Google's API did a really good job of describing what I did wrong. 

Let's look at a function that supports a function (sorry if that's confusing) related to ordering a product:

```js
const API_KEY = process.env.GOOGLE_AI_KEY;

async function runGenerate(prompt) {

  let data = {
    contents: {
      role: "user",
      parts: {
        "text": prompt
      }
    },
    tools: {
      function_declarations: [
		{
			"name":"order_product",
			"description":"order or buy a product",
			"parameters": {
				"type":"object",
				"properties":{
					"product": {
						"type":"string",
						"description":"The product to be ordered."
					},
					"quantity":{
						"type":"number",
						"description":"The amount of the product to be ordered."
					}
				},
				"required":["product"]
			}
		}

      ]
    }
  }

  let resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
    method:'post',
    headers:{
      'Content-Type':'application/json'
    },
    body:JSON.stringify(data)
  });

  return await resp.json();
}
```

In the `tools` section, you can see one function, `order_product`, with a description and two parameters - product and quantity. I've also specified that only the product is required. 

I pass this entire object and just return the response. While I'm absolutely not sure about my use of functions here, at least in terms of using the REST endpoint, it really is that simple which is great for testing. 

Speaking of - I did some quick tests with an array of inputs:

```js
const prompts = [
'I want to order a coffee.',
'I want to buy an espresso.',
'I want to get two espressos',
'Whats on the menu?',
'What time is love?',
'May I buy ten cats?',
'I want to order ten cats'
	];

for(let p of prompts) {
	let result = await runGenerate(p);
	//console.log(JSON.stringify(result,null,'\t'));
	console.log(`For prompt: ${p}\nResponse: ${JSON.stringify(result.candidates[0].content,null,'\t')}\n`);
	console.log('------------------------------------------');
}
```

As you can see, I have a couple 'normal' inputs along with some off-the-wall ones. I was curious what would happen. Let's take a look. 

First one:

```
For prompt: I want to order a coffee.
Response: {
        "parts": [
                {
                        "functionCall": {
                                "name": "order_product",
                                "args": {
                                        "product": "coffee"
                                }
                        }
                }
        ],
        "role": "model"
}
```

Note that quantity is not present. It's optional so that's ok, and I'd expect you would just default to 1. I *tried* to set a default in my function declaration, but it wasn't supported (or, more likely, I did it wrong).

Next:

```
For prompt: I want to buy an espresso.
Response: {
        "parts": [
                {
                        "functionCall": {
                                "name": "order_product",
                                "args": {
                                        "quantity": 1,
                                        "product": "espresso"
                                }
                        }
                }
        ],
        "role": "model"
}
```

Notice this time it *did* supply a quantity. 

Next:

```
For prompt: I want to get two espressos
Response: {
        "parts": [
                {
                        "functionCall": {
                                "name": "order_product",
                                "args": {
                                        "quantity": 2,
                                        "product": "espresso"
                                }
                        }
                }
        ],
        "role": "model"
}
```

Good job picking up the quantity!

Next:

```
For prompt: Whats on the menu?
Response: {
        "parts": [
                {
                        "text": "Sorry, I do not have access to that information."
                }
        ],
        "role": "model"
}
```

So this is a good example of a failure. It *did* return a human-like textual response. I suppose how you handle this depends on the application. A simple thing to do would be to ignore a text `parts` response and consider it an error in general, and perhaps ask for a new prompt.

Next:

```
For prompt: What time is love?
Response: {
        "parts": [
                {
                        "text": "I cannot fulfill this request because I lack the corresponding tools."
                }
        ],
        "role": "model"
}
```

The KLF is sad you don't know the answer to this, Google. 

Next:

```
For prompt: May I buy ten cats?
Response: {
        "parts": [
                {
                        "text": "I am sorry but that is beyond my capabilities."
                }
        ],
        "role": "model"
}
```

This one surprised me. I'm not sure why it failed. Maybe if my function declaration specified a list of possible products it would work better. As I've said - I'm new to this. 

Next: 

```
For prompt: I want to order ten cats
Response: {
        "parts": [
                {
                        "text": "I am sorry, but I cannot process your request. I am not able to order or sell pets such as cats."
                }
        ],
        "role": "model"
}
```

Very similar to the last one. I do find it kind of cool that it returned a different human-ish response which is cool. 

Now, in my testing, I thought I'd try a second function related to querying the price of a product:

```js
{
	"name":"product_price",
	"description":"return the price of a product",
	"parameters": {
		"type":"object",
		"properties":{
			"product": {
				"type":"string",
				"description":"The product to be queried."
			}
		},
		"required":["product"]
	}
}
```

Unfortunately, this made every previous good response switch to this version, even before I added prompts to ask for a price instead. I think... maybe... I didn't quite differentiate them enough for the API to be able to properly route them, but I'd love to hear from others what they think.

In general, it definitely feels more 'fragile' than Alexa, but I'm still absolutely fascinated by this use-case for GenAI. Now that I'm actually supporting comments here, I'd love to know if anyone out there's using this - and if you can - I'd love to see some code. 