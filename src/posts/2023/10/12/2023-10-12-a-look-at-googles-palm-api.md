---
layout: post
title: "A Look at Google's PaLM API"
date: "2023-10-12T18:00:00"
categories: ["development"]
tags: ["genai"]
banner_image: /images/banners/catai1.jpg
permalink: /2023/10/12/a-look-at-googles-palm-api
description: A look at Google's PaLM2 Generative AI API
---

Like, I assume, every single developer on the planet, I've been somewhat innudated with GenAI over the past year or so. I find it as fascinating as most folks (ask me about the number of times I've had cat-related conversions with ChatGPT) but while it's fun to play with, I've also been thinking a lot about the *practical* aspects of it, especially via API and integrations. I am still *incredibly* new to all this and, I'll admit, still *way* fuzzy on a lot of details, but I thought I'd share some initial impressions I've had working with Google's LLM, [PaLM 2](https://ai.google/discover/palm2/). 

First and foremost, note that the PaLM API, and MakerSuite, which is a web-based front-end, requires a Google login, and at least the API itself requires asking for access. For me, this took less then twenty-four hours, and I believe this time is even quicker now as Google is shrinking the waitlist. As I said, I had a pretty quick approval and I expect that's what most folks will have, but YMMV.

<p>
<img src="https://static.raymondcamden.com/images/2023/10/p1.png" alt="Welcome email from Google concerning access to PaLM API and MakerSuite" class="imgborder imgcenter" loading="lazy">
</p>

When you load up MakerSuite, you are presented a set of different prompts to start playing with the API:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/p2.png" alt="MakerSuite site showing prompts for text, data, and chat." class="imgborder imgcenter" loading="lazy">
</p>

When I first got here, I went right into the "Text prompt" option as I figured that would be the simplest and most recognizable of the options. Right away, I really appreciated the samples to help get started:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/p3.png" alt="MakerSuite UI for Text promps." class="imgborder imgcenter" loading="lazy">
</p>

I started with this prompt:

```
Write a story about a magic cat who can only do magic when speaking in reverse. 
Also, their magic normally backfires in a humorous and harmless manner. 
The story should be appropriate for a young child.
```

And got:

```
Once upon a time, there was a magic cat named Mr. Mistoffelees. He was a 
very special cat, because he could only do magic when he spoke in reverse.

One day, Mr. Mistoffelees was walking down the street when he saw a 
little girl crying. "What's wrong?" he asked.

"I lost my doll," the little girl said. "I've looked everywhere for it, 
but I can't find it."

Mr. Mistoffelees thought for a moment. "I can help you find your doll,"
 he said. "But I can only do it if you speak in reverse."

The little girl was confused, but she agreed. "Okay," she said. "I'll try."

"Dolla," the little girl said. "Lose, I did."

Mr. Mistoffelees smiled. "Your doll is under the bed," he said.

The little girl ran to her house and looked under the bed. Sure enough, 
there was her doll. She picked it up and hugged it tightly. 
"Thank you," she said to Mr. Mistoffelees. "You're a very kind cat."

"You're welcome," Mr. Mistoffelees said. "I'm always happy to help."

Mr. Mistoffelees continued to use his magic to help people. He made 
lost children find their way home, he helped people find their lost 
pets, and he even helped people find their lost keys. But sometimes, 
his magic would backfire in a humorous way.

One day, Mr. Mistoffelees was trying to help a woman find her 
lost car. He said the magic words in reverse, but instead of making 
the car appear, it made the woman's hair stand on end. The woman 
laughed so hard that she forgot all about her car.

Another time, Mr. Mistoffelees was trying to help a man get a job. He 
said the magic words in reverse, but instead of getting the man a job,
it made the man's tie fall off. The man laughed so hard that he forgot
all about his interview.

Mr. Mistoffelees' magic was always a lot of fun, and it always made 
people happy. He was a very special cat, and he used his magic to 
make the world a better place.
```

This is pretty much on par with what I'd expect from ChatGPT and other services, although I was a bit surprised by the spelling of the cat. For folks curious, it looks to be a misspelling of [Mephistopheles](https://en.wikipedia.org/wiki/Mephistopheles), although if it was going for a pun on "fleas", then that's pretty cool. 

What I gravitated towards right away was the "Get code" button top. Clicking on this brings up four unique options:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/p4.png" alt="Code samples in cuRL, JavaScript, JSON, and Python" class="imgborder imgcenter" loading="lazy">
</p>

While it oddly included the response in the code, I absolutely loved how simple this was! Here's the JavaScript, after I manually removed the response:

```js
const { TextServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");

const MODEL_NAME = "models/text-bison-001";
const API_KEY = "YOUR API KEY";

const client = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(API_KEY),
});

const promptString = `Write a story about a magic cat who can only do magic when speaking in reverse. Also, their magic normally backfires in a humorous and harmless manner. The story should be appropriate for a young child.`;
const stopSequences = [];

client.generateText({
  // required, which model to use to generate the result
  model: MODEL_NAME,
  // optional, 0.0 always uses the highest-probability result
  temperature: 0.7,
  // optional, how many candidate results to generate
  candidateCount: 1,
  // optional, number of most probable tokens to consider for generation
  top_k: 40,
  // optional, for nucleus sampling decoding strategy
  top_p: 0.95,
  // optional, maximum number of output tokens to generate
  max_output_tokens: 1024,
  // optional, sequences at which to stop model generation
  stop_sequences: stopSequences,
  // optional, safety settings
  safety_settings: [{"category":"HARM_CATEGORY_DEROGATORY","threshold":1},{"category":"HARM_CATEGORY_TOXICITY","threshold":1},{"category":"HARM_CATEGORY_VIOLENCE","threshold":2},{"category":"HARM_CATEGORY_SEXUAL","threshold":2},{"category":"HARM_CATEGORY_MEDICAL","threshold":2},{"category":"HARM_CATEGORY_DANGEROUS","threshold":2}],
  prompt: {
    text: promptString,
  },
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
});
```

First off, look how easy the authentication is - I literally just need to paste in my key. I've used a lot of Google APIs in the past and nearly every time the authentication is a pain in the rear. (That's probably completely my fault!) Also note the great use of commenting here for the sample code. I'll be honest and say even with the comments, there's stuff here I don't quite get, but outside of that, I had this running locally near immediately.

Here's the result of that:

```js
[
  {
    "candidates": [
      {
        "safetyRatings": [
          {
            "category": "HARM_CATEGORY_DEROGATORY",
            "probability": "NEGLIGIBLE"
          },
          {
            "category": "HARM_CATEGORY_TOXICITY",
            "probability": "NEGLIGIBLE"
          },
          {
            "category": "HARM_CATEGORY_VIOLENCE",
            "probability": "NEGLIGIBLE"
          },
          {
            "category": "HARM_CATEGORY_SEXUAL",
            "probability": "NEGLIGIBLE"
          },
          {
            "category": "HARM_CATEGORY_MEDICAL",
            "probability": "NEGLIGIBLE"
          },
          {
            "category": "HARM_CATEGORY_DANGEROUS",
            "probability": "NEGLIGIBLE"
          }
        ],
        "output": "Once upon a time, there was a magic cat named Mr. Mistoffelees. He was a very special cat, because he could only do magic when he spoke in reverse.\n\nOne day, Mr. Mistoffelees was playing in the forest when he saw a little girl who was crying. \"What's wrong?\" he asked.\n\n\"I'm lost,\" the little girl said. \"I can't find my way home.\"\n\nMr. Mistoffelees smiled. \"Don't worry,\" he said. \"I can help you.\"\n\nHe took a deep breath and said, \"Sdrawkcab eht revo spmuj I.\"\n\nSuddenly, the little girl was surrounded by a bright light. When the light faded, she was standing in front of her house.\n\n\"Thank you!\" she said. \"You're a lifesaver!\"\n\nMr. Mistoffelees smiled. \"You're welcome,\" he said. \"Just remember, my magic only works when I speak in reverse.\"\n\nThe little girl nodded. \"I'll remember,\" she said.\n\nThe next day, the little girl was playing in the forest again when she saw a group of boys picking on a smaller boy.\n\n\"Leave him alone!\" she shouted.\n\nThe boys turned to look at her. \"What are you going to do about it?\" one of them asked.\n\nThe little girl took a deep breath and said, \"Sdrawkcab eht revo spmuj I.\"\n\nSuddenly, the boys were surrounded by a bright light. When the light faded, they were all wearing dresses.\n\nThe boys started to laugh. \"What happened to our clothes?\" they asked.\n\n\"That's what you get for picking on a smaller boy,\" the little girl said.\n\nThe boys ran away, laughing.\n\nThe little girl smiled. \"I guess my magic really does work,\" she said.\n\nMr. Mistoffelees was watching from a nearby tree. He smiled. \"I'm glad my magic could help you,\" he said.\n\nThe little girl smiled back. \"Thanks, Mr. Mistoffelees,\" she said. \"You're the best.\"\n\nMr. Mistoffelees purred. \"You're welcome,\" he said. \"I'm always happy to help.\"\n\nThe little girl and Mr. Mistoffelees continued to play in the forest together. They had many more adventures, and Mr. Mistoffelees' magic always helped them out. But even though his magic was powerful, it was also very silly. And it always seemed to backfire in a humorous way.\n\nOne day, Mr. Mistoffelees was trying to help the little girl get a bird out of a tree. He said, \"Sdrawkcab eht revo spmuj I.\"\n\nSuddenly, the bird flew out of the tree and landed on the little girl's head.\n\nThe little girl laughed. \"Thanks, Mr. Mistoffelees,\" she said. \"But I think I would have been able to get the bird out of the tree myself.\"\n\nMr. Mistoffelees purred. \"You're welcome,\" he said. \"I'm just glad I could help.\"\n\nThe little girl and Mr. Mistoffelees continued to play together. They had many more adventures, and Mr. Mistoffelees' magic always helped them out. And even though his magic was silly, it was always kind and helpful."
      }
    ],
    "filters": [],
    "safetyFeedback": []
  },
  null,
  null
]
```

I find the safety ratings aspect the most fascinating, as it looks to be a great way to add 'guardrails' to your automated responses. 

After I had played with this, I took a look at the "Data prompt" feature: 

<p>
<img src="https://static.raymondcamden.com/images/2023/10/p5.png" alt="Data prompt UI" class="imgborder imgcenter" loading="lazy">
</p>

From what I could tell, this feature lets you take a sample list of data, and based on that input, you can then add *additional* rows of data and have PaLM specify the corresponding second column. I used the 'Opposites' sample as it seemed the simplest:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/p6.png" alt="Sample tabular data for opposites" class="imgborder imgcenter" loading="lazy">
</p>

Running with their sample works as expected:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/p7.png" alt="With wrong and fast as inputs, you get right and slow as responses" class="imgborder imgcenter" loading="lazy">
</p>

I tried "Dumb", "Cold", and "Left", and got:


<p>
<img src="https://static.raymondcamden.com/images/2023/10/p8.png" alt="Given dumb, cold and left, I got: No content, hot, and right" class="imgborder imgcenter" loading="lazy">
</p>

As you can see, it failed to find an opposite to dumb, but worked correctly for the others. The code for this, from what I can see, simply 'formats' the tabular data in a prompt:

```js
const { TextServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");

const MODEL_NAME = "models/text-bison-001";
const API_KEY = "YOUR API KEY";

const client = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(API_KEY),
});

const Word = 'Left';
const promptString = `Find a word or phrase with opposite meaning.
Word: Strong
Opposite: Weak
Word: Thick
Opposite: Thin
Word: Sparse
Opposite: Dense
Word: Sloppy
Opposite: Organized
Word: ${Word}
Opposite:`;
const stopSequences = [];

client.generateText({
  // required, which model to use to generate the result
  model: MODEL_NAME,
  // optional, 0.0 always uses the highest-probability result
  temperature: 0.7,
  // optional, how many candidate results to generate
  candidateCount: 1,
  // optional, number of most probable tokens to consider for generation
  top_k: 40,
  // optional, for nucleus sampling decoding strategy
  top_p: 0.95,
  // optional, maximum number of output tokens to generate
  max_output_tokens: 1024,
  // optional, sequences at which to stop model generation
  stop_sequences: stopSequences,
  // optional, safety settings
  safety_settings: [{"category":"HARM_CATEGORY_DEROGATORY","threshold":1},{"category":"HARM_CATEGORY_TOXICITY","threshold":1},{"category":"HARM_CATEGORY_VIOLENCE","threshold":2},{"category":"HARM_CATEGORY_SEXUAL","threshold":2},{"category":"HARM_CATEGORY_MEDICAL","threshold":2},{"category":"HARM_CATEGORY_DANGEROUS","threshold":2}],
  prompt: {
    text: promptString,
  },
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
});
```

One thing to note though is that variables are allowed in prompts, which is pretty cool. When I ran this, the output (specifically the `output` value in JSON, I'm ignoring the result of the result) was short and sweet: "Right", which is nice. My guess is the more complex and complete your table, the better this will work. 

So... first impressions - I'm *really* digging how well MakerSuite lets me test in the web and how quickly I'm able to take that to code and start working. So impressed that yesterday I built a "real" demo with this in about twenty minutes. I'll be sharing that tomorrow!
