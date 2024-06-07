---
layout: post
title: "Game Dev Diary - Cat Herder - Part 2"
date: "2024-06-07T18:00:00"
categories: ["development"]
tags: ["javascript","games"]
banner_image: /images/banners/cat_herder2.jpg
permalink: /2024/06/07/game-dev-diary-cat-herder---part-2
description: An update to my web game, Cat Herder
---

Welcome to my second game diary for [Cat [Herder](https://catherder.netlify.app), which I'm subtitling - "Rise of the Machines". This update is all about the 'machine' aspect of the game. Let me explain.

Right now each cat (well, you can only have one unless you cheat) has three needs you must manually take care by clicking the right button to match the mood. The idea of the machine feature is that they will automatically handle this for you, providing you have enough of them and the right type.

The first thing I needed to figure out was how to enable this feature. I decided on a one time check to see if you have 75 or more purrs (the currency of the game). This is a one-time check because as you spend purrs, I didn't want to take them away if you went below that threshold. In code, the UI does this:

```html
<template x-if="machinesAllowed">
```

And in code, it's actually two things. First, a boolean variable:

```js
machinesEnabled:false,
```

And then a getter:

```js
get machinesAllowed() {
	if(this.purrs > MACHINE_THRESHOLD) {
		this.machinesEnabled = true;
	}

	return this.machinesEnabled;
},
```

Once this returns true, I open a panel built with a [Shoelace](https://shoelace.style/) `sl-details` web component, wrapping three `sl-card` components:

<p>
<img src="https://static.raymondcamden.com/images/2024/06/ch3.jpg" alt="Panel wrapping 3 machines with nice graphics on top." class="imgborder imgcenter" loading="lazy">
</p>

I generated those images with Adobe Firefly. Each machine handles one particular need - to be ignored, fed, and petted. There's a couple mechanics at play with machines. 

First, the cost is based on the total of all machines together, following a simple bit of math:

```js
get machineCost() {
	return 100 + ((this.boxes + this.petters + this.feeders) * 10);
},
```

I'm actually displaying the cost of machines only in cheat mode now, but may move that to the button itself so you can see. Those buttons all check to see if you can afford to buy one using logic like so:

```html
<sl-button @click="buyBox" :disabled="!canBuyBox">Buy Box</sl-button>
```

And with code like so:

```js
get canBuyBox() {
	return this.purrs >= this.machineCost;
},
```

Currently, all three machines have the *exact* same logic, and I could rewrite it to a `canBuyMachine` method, but I'm keeping them separate for now in case I change my mind about them all sharing the same cost.

Now, as to how the machines work, it's a bit interesting, and remember, none of this is really told to the player, they have to figure it out. The logic is - if you have X cats, for a machine to help it, you must have X of that type. 

So for example, imagine you have 2 cats, and one of each machine. Cat 1 wants to be ignored and cat 2 wants to be fed. Even though you have, in theory, an idle feeding machine, it won't help the cat. Basically, the Nth element of each machine is tied to the Nth cat. Here's that logic:

```js
for(let i=0; i<this.cats.length;i++) {

	let cat = this.cats[i];

	// stuff

	// does a machine help us?
	if(cat.need.action === 'ignore' && this.boxes >= (i+1)) cat.happiness++;
	if(cat.need.action === 'feed' && this.feeders >= (i+1)) cat.happiness++;
	if(cat.need.action === 'pet' && this.petters >= (i+1)) cat.happiness++;


	// more stuff
}
```

The above lives within my main `heartBeat` method which is run every second. 

I think the next thing I'll build is the 'gain cat' mechanism, which I'm still figuring out. I kinda want them to randomly show up, as thats how I've gotten most cats in my life, but I'm not sure yet. 

Want to play it? You can do see here: <https://catherder.netlify.app>. The GitHub repo is here: <https://github.com/cfjedimaster/catherder>

Finally, I recorded a video version of this as well - enjoy!

<iframe width="560" height="315" src="https://www.youtube.com/embed/uRrdrWS7S38?si=pklU5rMCMi9rPp7l" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>

