---
layout: post
title: "Game Dev Diary - Cat Herder - Part 1"
date: "2024-06-03T18:00:00"
categories: ["development"]
tags: ["javascript","games"]
banner_image: /images/banners/cat_herder.jpg
permalink: /2024/06/03/game-dev-diary-cat-herder---part-1
description: A (first) look at a new game I'm building, Cat Herder
---

Over a year ago, I released my first "idle clicker" game, [IdleFleet](https://idlefleet.netlify.app). IdleFleet is a simple "space merchant" game built with Alpine.js. I've worked on it off and on since the initial release (which was in Vue.js by the way) and still have updates I want to add, but a few weeks ago I started work on a new game I'd like to share with you, Cat Herder.

## The Game 

Cat Herder is *very* much in its early stages so while I'll (eventually) link to it, you can't do much with it now. The basic idea is that you have one cat... to start with that is - and have to keep it happy. Cats have three basic moods:

* Wanting to be left alone
* Wanting to be fed
* Wanting to be petted

The UI displays the cat's current mood and provides buttons to respond to the cat's needs:

<p>
<img src="https://static.raymondcamden.com/images/2024/06/ch1.jpg" alt="Cat UI, showing activity, need, buttons" class="imgborder imgcenter" loading="lazy">
</p>

If you think it's crazy to have a button for "ignore", well, no one said being a cat owner was easy. The "H" in the UI above is temporary and represents the numeric value of the cat's happiness. You give the cat what it wants, the number goes up. Do the wrong thing, and it goes down. 

To make things more fun, a cat's mood will change at random intervals. Right now it's a *very* quick interval so I can see it working, but will be slowed down a bit later. 

Giving the cat what it wants raises the happiness and at a certain level, you earn "purrs" which is the game's currency. If you don't make the cat happy enough before it changes its mood, you lose all happiness. Sorry, welcome to being a cat owner. 

When you have multiple cats, it gets a bit overwhelming, which is kind of what I'm going for in the game:

<p>
<img src="https://static.raymondcamden.com/images/2024/06/ch2.jpg" alt="Many cats, all with different moods" class="imgborder imgcenter" loading="lazy">
</p>

What you can't see in the screenshot is that the cats' moods are all changing at different intervals and the boxes are sizing kind of randomly. I thought about fixing the layout but realized - the random resizing actually made the game more challenging. Also, cats. 

The next step is to add purchases. The game will offer three machines - an auto feeder, an auto petter, and a box (for cats that want to be ignored). The idea is that one machine services one cat's needs, so you need to cover all three types, multiple times, to handle your cats, and you'll probably not be able to keep up, which again, is kind of the point. Because... cats. 

I also plan on letting you purchase cats, but I also expect to randomly drop them in from time to time because sometimes we adopt cats, and sometimes they adopt us.

You can play the game, although there really isn't a point yet, here: <https://catherder.netlify.app> 

## The Code

I'm building the game with two technologies, Alpine.js of course, and [Shoelace](https://shoelace.style/) for my UI. Shoelace is a *really* easy to use web component library that works just fine with Alpine. Here's how I'm rendering the cats:

```html
<template x-for="cat in cats">
<sl-card class="cat">
	<div slot="header" x-text="cat.name"></div>
	<p>
		<span x-show="cat.gender === 'male'" x-text="'He'"></span>
		<span x-show="cat.gender === 'female'" x-text="'She'"></span>
		is <span x-text="cat.activity"></span> and wants <span x-text="cat.need.display"></span>.
	</p>
	H: <span x-text="cat.happiness"></span>
	<div slot="footer">
		<sl-button-group>
			<sl-button variant="success" @click="doIt('ignore',cat)">Ignore</sl-button>
			<sl-button variant="success" @click="doIt('feed',cat)">Feed</sl-button>
			<sl-button variant="success" @click="doIt('pet',cat)">Pet</sl-button>
		</sl-button-group>
	</div>
</sl-card>
</template>
```

On the JavaScript side, there really isn't a lot going on yet. Cat names are *not* using the random word libraries I've used in the past but just a simple array of prefixes and names:

```js
let CAT_PREFIX = ['Lord','Lady','Mr','King','Queen','Empress','Emperor','Strange','Delerious'];
let CAT_NAME = ['Fluffy','Pig','Elise','Luna','Grace','Zelda','Sintra','Elvis','Crackers','Smelly Cat','Toebeans','Bob','Mary','Sammy']
```

Stuff like this I'll move out into a different file eventually to make it more manageable. Cat moods are an array of strings for how it's displayed as well as a string for the action that my `click` event matches:

```js
let NEEDS = [
	{ display:'to be left alone', action:'ignore' },
	{ display:'food', action:'feed' },
	{ display: 'petting', action:'pet' }
];
```

The game has an internal 'heartbeat' that will iterate over each cat and check to see if it's time for a mood change:

```js
heartBeat() {
	/*
	For each cat, see if it's time for a mood change, and if so, change it
	*/
	for(let cat of this.cats) {

		// do we purr?
		if(cat.happiness > PURR_THRESHOLD) {
			console.log('chance to purr');
			// need to think about the chance, for now, lets just purr
			this.purrs++;
		}

		// do we change mood?
		if(new Date() > cat.moodChangeTime) {
			cat.activity = getRandomArrayEl(ACTIVITIES);
			cat.need = getRandomArrayEl(NEEDS);

			let duration = getRandomInt(CAT_MOOD_MIN, CAT_MOOD_MAX);
			let now = new Date();
			now.setSeconds(now.getSeconds() + duration);
			cat.moodChangeTime = now;

			// guess what chicken butt
			// TODO: ok, this isn't fair - i think i'll degrade happiness later
			cat.happiness = 0;

		}
	}
},
```

And that's mostly it. You can peruse the complete code here: <https://github.com/cfjedimaster/catherder> I'm not quite ready for PRs yet as it's early, but I would take ones that add to the list of cat prefixes and names. 

Finally, if this was all too much to read, why not watch the video version???

<iframe width="560" height="315" src="https://www.youtube.com/embed/8AAGNajLF2M?si=pZmH4lMFhwZ1qL88" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>
