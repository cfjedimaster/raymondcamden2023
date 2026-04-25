---
layout: post
title: "Another Game: My Little Mortal Combat"
date: "2026-04-25T18:00:00"
categories: ["development","games"]
tags: ["javascript"]
banner_image: /images/banners/mlp.jpg
permalink: /2026/04/25/another-game-my-little-mortal-combat
description: A look at my new game.
---

Hello awesome readers! I'm happy to announce my latest web game, [My Little Mortal Combat](https://cfjedimaster.github.io/webdemos/my_little_mortal_combat/), a mashup of two epic franchises, My Little Pony and Mortal Kombat. This began as an idea, just the name, that I recorded in Microsoft To Do in September of 2019. Yes, almost seven years ago. It sat there, at the bottom of my 'idea' list, until about a month ago when in the shower (not joking), it popped up in my head along with the basic mechanics of how the game would play. 

Right now the game is just missing one feature (I'd rather not talk about until I figure out how I'm going to do it) but definitely needs some balancing work. I enjoy playing games without knowing the details of how things work, so if's that you too, head over to the game now and good luck!

<https://cfjedimaster.github.io/webdemos/my_little_mortal_combat/>

## How I Built It

As a web app, I kept it pretty simple. Just HTML, CSS, JavaScript, and Alpine.js. I used AI (Cursor's IDE specifically) to create the UI for the three phases of the game - into, main display, and combat. I also used AI to generate some of the strings used in the game. Opponents have random "evil"-ish titles and I wrote some and then asked AI to generate some more. Some examples:

* Life Eater
* Hoof Smasher
* the Blood Soaked
* the Blood Drinker

Opponents also have random annoying facts. Again, I wrote some, had AI generate some more. 

* doesn't return library books on time.
* likes to ruin the end of movies.
* has been known to sneeze at the buffet.
* steals candy from babies and then throws the candy in the trash—in front of them!
* only speaks in passive-aggressive voice.
* will point out your least favorite body parts.

The actual names of the opponents come directly from a My Little Pony API I found that was open source. 

Here's an example of a randomly generated opponent:

<p>
<img src="https://static.raymondcamden.com/images/2026/04/pony1.png" loading="lazy" alt="Pony!" class="imgborder imgcenter">
</p>

Combat is basic "Rock Paper Scissors" style where you have 3 choices (Attack, Defend, Vogue) and the result is based on what your opponent does. 

Your character, and the opponents, have numerical value for Attack, Defend, and Vogue. When you win a round in a fight, the damage you do is based on that skill. Your total HP is based on level. 

As you can play, if you win or lose, you get gold and XP. Obviously you get a lot more when you win. You can use the gold to train skills. Your XP turns into your level which improves your HP. 

As I said, I definitely think the numbers need tweaking probably, so let me know. You can check out all the code here: <https://github.com/cfjedimaster/webdemos/tree/master/my_little_mortal_combat>

Don't forget, I've got this game and my others listed over on my my [Stuff](https://www.raymondcamden.com/stuff) page. Enjoy!

Photo by <a href="https://unsplash.com/@farvardin?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Felis Amafeles</a> on <a href="https://unsplash.com/photos/five-small-cartoon-ponies-sitting-in-a-row-MI-KCy_foeU?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      