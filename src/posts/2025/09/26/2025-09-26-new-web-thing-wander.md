---
layout: post
title: "New Web Thing - Wander"
date: "2025-09-26T18:00:00"
categories: ["misc"]
tags: ["javascript"]
banner_image: /images/banners/wander.jpg
permalink: /2025/09/26/new-web-thing-wander
description: About a new thing I built for the web, Wander
---

I've built a few web games in the past ([IdleFleet](https://idlefleet.netlify.app/) and [Cat Herder](https://catherder.netlify.app/) are two examples), but what I'm sharing today doesn't really fit into the category of a game. This is going to sound *terribly* pretentious and I apologize in advance, but what I'm sharing today is more an "experience" for lack of a better term. It's part technical exploration, and part cathartic dumping, and just kinda weird. But honestly, the web needs more weird and I'm happy to contribute to that. 

As with most of the things I've built, I think it's more interesting if you *experience* it first before taking a look at what's behind it, so with that in mind, click this to open up what I built in a new tab: <a href="https://cfjedimaster.github.io/webdemos/wander/" target="_blank">https://cfjedimaster.github.io/webdemos/wander/</a>. 

As a warning, there's no help text, no explanation. It just is. So be prepared to be confused a bit. 

## What is Wander?

Wander is a few things. Technically, it's a procedurally generated landscape that you can explore. The "world", as it is, is defined in a series of "plates", where each plate is what you see on screen currently:

<p>
<img src="https://static.raymondcamden.com/images/2025/09/w1.jpg" alt="Screen shot of Wander plate" class="imgborder imgcenter" loading="lazy">
</p>

A plate consists of a series of open spaces and obstacles (`#`), where the subject (`@`) can navigate using keyboard controls. (No WASD, sorry, just arrows.) I'm using the term "subject" as this isn't a game. (Although you'll see me user the word `player` in code.) 

The plate is just a 2D array where I fill the inner portion with obstacles. Why inner portion? As you navigate around the plate, when you get to the edge and continue, a new plate is created. If I didn't keep the edges clear, it's possible you would enter into an obstacle. I also didn't want to simply avoid where the player enters as it's possible you would be 'wrapped' in obstacles and couldn't explore further. 

This is less maze and more... landscape with things in it. Yeah, vague, but that was kind of the mood I was going for. 

The plates themselves are persisted in the browser via IndexedDB. When you start, I generate and persist one for you, and as you explore, more are added. I keep track of their location such that if you return in the direction you travelled, and then come back, the same one is loaded. 

In theory, this means you could explore until the browser starts blocking your storage calls and considering how small each plate is, that would be a very, very long time. 

Oh, and I'm using [Alpine.js](https://alpinejs.dev/) to handle the UI/UX. Let's dig into the code a bit, eh?

## The World 

First, here's the initial data (most of it) and `init`:

```js
Alpine.data('app', () => ({
	PLATE_SIZE: {
		width: 20, 
		height: 20
	},
	NUM_OBSTACLES:100,
	db:null,
	plate:[],
	plateLocation: [0, 0],
	playerLocation:null,
	whisper:'',
	async init() {
		this.db = await this.setupDb();
		// start the player roughly in the middle
		this.playerLocation = [ Math.floor(this.PLATE_SIZE.width/2), Math.floor(this.PLATE_SIZE.height/2) ];
		this.plate = await this.getPlate(this.plateLocation);
		// start initial hb, after this it's called with a random interval
		setTimeout(() => { this.whisperHeartBeat() }, 30 * 1000);
	},
```

The call to `setupDb` initializes my IndexedDB database. About two years ago I [blogged about IndexedDB and Alpine.js](https://www.raymondcamden.com/2023/11/26/using-indexeddb-with-alpinejs) if you want a good introduction to the topic. Here's my database setup:

```js
async setupDb() {
	return new Promise((resolve, reject) => {

	let request = indexedDB.open('wander', 1);

	request.onerror = event => {
		alert('Error Event, check console');
		console.error(event);
	}

	request.onupgradeneeded = event => {
		console.log('idb onupgradeneeded firing');

		let db = event.target.result;

		let objectStore = db.createObjectStore('plates', { keyPath: 'location' });
	};
	
	request.onsuccess = event => {
		resolve(event.target.result);
	};
	});
},	
```

Of note - I've got one object store, `plates`, and the unique identifier is the `location` value, i.e. where the plate sites in the world.

Now things get a bit complex. The `init` function gets the initial plate located at `0,0`. This will attempt to load a persisted plate, and if it doesn't exist, generate a new one. 

```js
async getPlate(location) {
	console.log(`Request to get plate for ${location}`);
	/*
	My logic is: see if the plate exists in the database, if not, make it
	*/
	plate = await this.loadPlate(location);
	if(!plate) {
		console.log('we didnt have a plate, so need to make one');
		plate = this.generatePlate(this.PLATE_SIZE, this.playerLocation, this.NUM_OBSTACLES);
		console.log("NEW PLATE generated");
		await this.persistPlate(location, plate);
	}
	// place the player
	plate[this.playerLocation[0]][this.playerLocation[1]] = "@";
	return plate;
}, 
```

Here's load plate:

```js
async loadPlate(loc) {
	console.log('loadPlate', loc);
	return new Promise((resolve, reject) => {
		/* 
		loc is an array, the location of the plate, but we store it as a string
		to keep it simple 
		*/
		loc = loc.join(',');
		let transaction = this.db.transaction(["plates"]);

		let objectStore = transaction.objectStore("plates");
		let request = objectStore.get(loc);
		request.onerror = (event) => {
			console.log("Error loading by pk", event);
		};
		
		request.onsuccess = (event) => {
			console.log("on success", event.target);
			if(event.target.result) resolve(event.target.result.plate);
			else resolve();
		};
	});
},
```

And if returns null, here is how I generate a new plate:

```js
generatePlate(size,player,numObstacles) {
	console.log(`I'm creating a new plate sized ${JSON.stringify(size)}, and ensuring ${player} is not obscured.`);
	let plate = [];
	for(let x=0;x<size.width;x++) {
		plate.push([]);
		// first, fill it with the grand void of nothingness
		for(let y=0;y<size.height;y++) {
			plate[plate.length-1].push(' ');
		}
	}	

	// now, give numObstacles, I'm going to modify this by +/- X%, randomly
	let totalObstacles = numObstacles + Math.floor(getRandomIntInclusive(-25,25)/100 * numObstacles);
	console.log(`I'll be adding ${totalObstacles} obstacles`);
	let obstacles = 0;
	/*
		This loop will add obs to the plate, but it has to ensure we don't
		put them in a 'buffer' around the player, we don't want to trap them.
		
		Modified to not do the borders either
	*/
	while(obstacles <= totalObstacles) {
		let possibleX = getRandomIntInclusive(1, this.PLATE_SIZE.width-2);
		let possibleY = getRandomIntInclusive(1, this.PLATE_SIZE.height-2);
		if(Math.abs(possibleX - player[0]) < 2 && Math.abs(possibleY - player[1]) > 2) {
			//console.log('bypassing, too close for ',possibleX,possibleY);
			continue;
		}

		
		plate[possibleX][possibleY] = "#";
		obstacles++;
	}
	return plate;
},
```

Finally, every new plate gets stored based on its location:

```js
async persistPlate(loc, plate) {
	return new Promise((resolve, reject) => {
		let plateRecord = {
			location:loc.join(','),
			plate
		}

		let transaction = this.db.transaction(["plates"], "readwrite");
		let store = transaction.objectStore("plates");
		console.log(plateRecord);
		let request = store.put(plateRecord);
		request.onerror = event => {
			console.log("error storing plate", event);
		}
		request.onsuccess = event => {
			console.log("plate stored", event);
			resolve(event);
		}
	});
},
```

Rendering of the plate is done over in HTML:

```html
<table @keyup.up.window="move('up')" @keyup.down.window="move('down')" @keyup.right.window="move('right')" @keyup.left.window="move('left')" tabindex="1">
	<template x-for="(row,idx) in plate" :key="idx">
		<tr>
			<template x-for="(col,idx2) in row" :key="idx2">
				<td><span x-text="col"></span></td>
			</template>
		</tr>
	</template>
</table>
```

So, movement was kind of fun. You can see the handlers in the HTML above. Of special note is the use of `window` to tie the event handlers to the Window object. Without that, you would need to click on the table to focus it in order for them to work. 

## The Atmosphere

Ok, so there's a bit more code to talk about, but this is also the part where I get a mushy. Feel free to stop reading now, I wouldn't blame you.

This year has been, without a doubt, the second worse year of my life. I cannot adequately explain the feelings I've had being laid off, twice, and trying to land a job in a landscape that's incredibly bad. I've been to therapy, but not lately, and I should probably return, but I'm also contracting now and any time away from work is time spent not earning and I'd have difficulty focusing with that in mind. It's not all bad! I've had some incredibly *good* times this year as well. It's just... a lot. 

Part of the appeal of writing Wander is to give a digital form to what I'm feeling. Without a job I feel aimless, worthless, and worse. I truly believe that as a father, and husband, I am not worthless, but those nice sane thoughts have to deal with a multitude of other not-so-sane emotions fighting for their part of my internal CPU. 

Matthew Inman (creator of the Oatmeal) has a great comic about [intrusive thoughts](https://theoatmeal.com/blog/horrible_therapist_game). This led to a fun as hell game, Horrible Therapist, but the comic itself really spoke to me. 

I wanted to give voice to some of those thoughts, some of which, ok many, are somewhat dark, but also hopeful, silly, and honestly just a bit weird/random. To reflect this in Wander, I added whispers. In HTML, it's just this:

```html
<div class="fadeDiv">
	<div class="fade-overlay-top"></div>
	<span x-html="whisper"></span>
</div>
```

A bit of CSS is used to fade out the `div` such that the content at top is dimmer. When Wander starts, a 'heart beat' function is kicked off which will randomly display a whisper. It keeps track of how many are shown and trims it when 5 are on screen:

```js
whisperMessage(s) {
	/*
	if 5 lines, delete one
	*/
	let lines = this.whisper.split('\n');
	if(lines.length >= 5) lines.shift();
	this.whisper = lines.join('\n');
	this.whisper += s + '<br>\n';
},
whisperHeartBeat() {
	let msg = MSGS[getRandomIntInclusive(0, MSGS.length-1)];
	console.log('selected msg', msg, new Date());
	this.whisperMessage(msg);
	setTimeout(() => { this.whisperHeartBeat() }, getRandomIntInclusive(30,90) * 1000);
}
```

The `MSGS` array is an array of strings. As I said, some dark, some weird, some just random. Here's a portion:

```js
const MSGS = [
	"There is a rustle somewhere near you.",
	"Does this ever end?",
	"You almost see the sun through the clouds.",
	"A bird flies by, but you lose sight of it quickly.",
	"Is there anybody here?",
	"You can't remember what day it is.",
	"You can still see their eyes.",
	"You can still remember their smell.",
	"They are better off without you.",
	"It will get better soon.",
	"It's almost over.",
	"This is never going to end.",
	"This has to end, right?",
	"Is the sun setting?",
	"You hum to yourself.",
	"Your muscles are cramping.",
```

And here's how it looks (and yes, I see the typo, I've fixed it):

<p>
<img src="https://static.raymondcamden.com/images/2025/09/w2.jpg" alt="Whispers" class="imgborder imgcenter" loading="lazy">
</p>

And that's basically it. I've got to say, I'm *really* happy I built this. As I said, it's weird, but I miss the old days of the web where you would often find things like this. We need more of that. 

Image by <a href="https://pixabay.com/users/dominikakukulka-16037370/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=5284232">Dominika Kukułka</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=5284232">Pixabay</a>
