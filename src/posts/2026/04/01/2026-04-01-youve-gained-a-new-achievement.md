---
layout: post
title: "You've gained a new achievement"
date: "2026-04-01T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/trophy.jpg
permalink: /2026/04/01/youve-gained-a-new-achievement
description: A DCC-inspired achievement generator.
---

For the past month or so I've been obsessed with a book series that's apparently been popular and I just didn't realize - Dungeon Crawler Carl. Without giving too much away, it's basically about a person, and his glorious cat, who get caught up in a real world RPG. I'm currently on book 3 (of 8) and am enjoying every page of it. It's *incredibly* funny and cool at the same time. If you haven't checked it out yet, I highly recommend picking up the first book and giving it a shot. I don't think you'll regret it.

<p>
<img src="https://static.raymondcamden.com/images/2026/04/iamyelling.jpg" loading="lazy" alt="A cat by a keyboard saying I AM YELLING, CARL" class="imgborder imgcenter">
</p>

As I mentioned, the book series involves a man (and his cat, the cat is crucial) experiencing a real-world RPG and like a RPG, it's got achievements as the character progress through the dungeon. For those of you aren't gamers, most games now will give you an achievement for performing some task. These achievements give you nothing but bragging rights and a slight feeling of accomplishment, but some folks get really excited about them.

In the books, the main characters will also get achievements and typically the achievement is *incredibly* snarky and sarcastic. As an example:

<div class="callout">
<strong>New achievement! Why aren’t you wearing pants?</strong><br>
You entered the dungeon wearing no pants. Dude. Seriously?

<strong>Reward</strong>: You've received a Gold Apparel Box!
</div>

And another:

<div class="callout">
<strong>New achievement! You’ve entered a guildhall!</strong><br>
Congratulations. You know how to open doors.

<strong>Reward</strong>: That sense of fulfillment you feel? That’s reward enough.
</div>

These almost always make me LOL and I thought - what if I could make a simple web tool to generate these on the fly? I did so, using Chrome's [built-in AI](https://developer.chrome.com/docs/ai/built-in) feature, which as of today is still behind a flag, so if you want to play with this, you'll need to follow the [instructions](https://developer.chrome.com/docs/ai/prompt-api) on which flags to enable in your browser. If you've done that, and don't care about *how* this tool was built, you can head over to the demo now: <https://dcc.raymondcamden.com/>

## The Code

The code behind this was a rather simple usage of the Chrome [Prompt API](https://developer.chrome.com/docs/ai/prompt-api). Here's the code that initializes the session:

```js
session = await LanguageModel.create({
    initialPrompts:[
                { 
                    role: 'system', 
                    content: 
`Generate an achievement announcement in the style of 
the Dungeon Crawler Carl series. You will be given a 
prompt to base the achievement on, which will be an 
ordinary, mundane task. The achievement you generate
should have the snarky, over the top prose associated 
with the book.

do not comment about carl at all, or have any other output 
except the achievement title, text, and rewards` 
                }
            ],		
        monitor(m) {
                m.addEventListener("downloadprogress", e => {
                    console.log(`Downloaded ${e.loaded * 100}%`);
                    if(e.loaded === 0 || e.loaded === 1) {
                        $status.innerHTML = '';
                        return;
                    }
                    $status.innerHTML = `Downloading AI model, currently at ${Math.floor(e.loaded * 100)}%`;
                });
            }		
    });
```

Make note of the system instruction which is what guides the model when generating content. Your input is basically a "mundane" thing you've done, like wash dishes or take out the trash. When you've entered that and hit submit, I then simply get the achievement:

```js
let achievement = JSON.parse(await session.prompt(input, {  
    responseConstraint: schema,
  }));
```

Notice the `responseConstraint` value? This is how I get precise results back, in my case an achievement title, the text, and a list of rewards. This is defined earlier in my code:

```js
let schema = {
	"type": "object",
	"properties": {
		"title": {
			"type":"string"
		},
		"achievementText": {
			"type":"string"
		},
		"rewards": {
			"type":"array",
			"items":{
				"type":"string"
			}
		},
  },
  "additionalProperties": false
};
```

And that's pretty much it. The rest of the code is straight up DOM manipulation.

## The Design

As for the look and feel of the app, I made use of Cursor and one simple prompt:

<blockquote>
im going to be building a tool that uses Chrome AI to generate random achievements in the style of Dungeon Crawler Carl. i need your help with a design. i dont need you to do any of the javascript, just create my scaffold for me. its one web page and the title should be, "DCC Achievement Generator". There is a prompt, "What mundane thing did you get done?", a form field for the task, and then it will render out the achievment. 

Achievements have a title, a body of text, and a list of rewards (bulleted list). Create a nice design for the achievement as well (just make something up for now)
</blockquote>

I'm just now noticing the typo and thankfully Cursor didn't complain. I let it output my HTML and CSS and then simply copied that over to CodePen so I could start working on the actual implementation. I think the only work I needed to do was add some IDs to the HTML in order for my JavaScript to connect to what it needed to update. The design Cursor created was just fine:

<p>
<img src="https://static.raymondcamden.com/images/2026/04/dcc2.jpg" loading="lazy" alt="A screenshot of the app" class="imgborder imgcenter">
</p>

In case you can't read that, my input was: `i wrote a blog post` and the achievement I received was:

<div class="callout">
<strong>The Scroll of Slightly Above Average Prose</strong><br>
By the gods...you *authored* a blog post? A digital missive of words, painstakingly crafted (or, let's be honest, hastily assembled) and disseminated across the ethereal web? A feat of remarkable… mediocrity? Fear not, adventurer! While not slaying a dragon or retrieving a legendary artifact, you have demonstrated a modicum of linguistic dexterity. A tiny flicker of creativity in the vast darkness of internet noise. Consider yourself mildly commended. It's not much, but it's… something.
<br><br>
<strong>Rewards</strong>:<br>
<ul>
<li>A digital badge of… acknowledgment.</li>
<li>The fleeting satisfaction of knowing you’ve added to the collective human output.</li>
<li>A slightly less judgmental stare from your cat.</li>
<li>Potentially, an increase in internet karma. (Results may vary.)</li>
</div>

## Results May Vary

If you've got the flags enabled and try it out, please share your results, and let me know what you think. Feel free to fork the pen and modify to your heart's content. Also... Mongo is appalled! 

<p class="codepen" data-theme-id="dark" data-height="500" data-pen-title="DCC Generator" data-preview="true" data-version="2" data-default-tab="js" data-slug-hash="qEaxdmg" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/editor/cfjedimaster/pen/019d3084-ca56-7b39-bb6b-5a67093a283e">
  DCC Generator</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Photo by <a href="https://unsplash.com/@giorgiotrovato?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Giorgio Trovato</a> on <a href="https://unsplash.com/photos/yellow-and-white-trophy-_XTY6lD8jgM?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      