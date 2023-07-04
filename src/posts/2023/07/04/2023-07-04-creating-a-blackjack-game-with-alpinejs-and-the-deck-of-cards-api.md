---
layout: post
title: "Creating a Blackjack Game with Alpine.js and the Deck of Cards API"
date: "2023-07-04T18:00:00"
categories: ["javascript"]
tags: ["alpinejs"]
banner_image: /images/banners/cards.jpg
permalink: /2023/07/04/creating-a-blackjack-game-with-alpinejs-and-the-deck-of-cards-api
description: How I built a simple Blackjack game using an API that handles card decks.
---

Some time ago I ran across a pretty fascinating service, the [Deck of Cards API](https://deckofcardsapi.com/). This API handles everything imaginable related to working with decks of cards. It handles creating a shuffled set of cards (containing one or more decks), dealing out a card (or cards), and even reshuffling. Even better, it includes card images you can use if you don't want to find your own:

<p>
<img src="https://deckofcardsapi.com/static/img/KH.png" loading="lazy">
<img src="https://deckofcardsapi.com/static/img/AH.png" loading="lazy">
</p>

It's an incredibly feature-filled an API and best of all, it's completely free. No need for even a key. I've known about this API for a while and have contemplated building a card game with it, but realized that games can quickly go from simple to fairly complex. In fact, my friends *strongly* urged me not to spend time on this, and honestly, they were probably right, but I've got a *long* history of building code demos that don't make sense. ;)

For my demo, I went with the following rules:

* Obviously, basic Blackjack rules, try to get close to 21 as possible without going over.
* No betting, just one hand at a time.
* No doubling down or splitting.
* Dealer has a "soft 17" rule. (I'm mostly sure I've done that right.)
* The game uses six decks (I read somewhere that it was a standard).

## Game Setup

Initially, the player and computer both have an array representing their hands. 

```js
playerCards:[], 
pcCards:[],
```

The `deal` method handles setting up the hands for both players:

```js
async deal() {
	// first to player, then PC, then player, then PC
	this.playerCards.push(await this.drawCard());
	// for the dealer, the first card is turned over
	let newcard = await this.drawCard();
	newcard.showback = true;
	this.pcCards.push(newcard);
	this.playerCards.push(await this.drawCard());
	this.pcCards.push(await this.drawCard());
},
```

Two things to point out. First, I deal to the player, then the PC (or dealer, name-wise I kinda go back and forth), and then back again. I also modify the card result object to have `showback` set such that I can render the back of the card for the dealer.

Here's how that's done in HTML:

```html
<div id="pcArea" class="cardArea">
	<h3>Dealer</h3>
	<template x-for="card in pcCards">
		<!-- todo: don't like the logic in template -->
		<img :src="card.showback?BACK_CARD:card.image" :title="card.showback?'':card.title">
	</template>
</div>
<div id="playerArea" class="cardArea">
	<h3>Player</h3>
	<template x-for="card in playerCards">
		<img :src="card.image" :title="card.title">
	</template>
</div>
```

`BACK_CARD` is simply a constant: 

```js
const BACK_CARD = "https://deckofcardsapi.com/static/img/back.png";
```

## Game Logic

So at this point, I could hit the app, and get a Blackjack hand:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/cards1.jpg" alt="Demo of the cards displayed" class="imgborder imgcenter" loading="lazy">
</p>

At the bottom, I used a div to display the current status:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/cards2.jpg" alt="White status box asking the player what they want to do." class="imgborder imgcenter" loading="lazy">
</p>

My logic was like so:

* Begin with the player, and let them hit or stand
* If they hit, add a new card and see if they busted. 
* If they stand, let the dealer player.

Let's focus on the player first. To hit, we simply add a card:

```js
async hitMe() {
	this.hitMeDisabled = true;
	this.playerCards.push(await this.drawCard());
	let count = this.getCount(this.playerCards);
	if(count.lowCount >= 22) {
		this.playerTurn = false;
		this.playerBusted = true;
	}
	this.hitMeDisabled = false;
},
```

Bust checking was a bit complex. I built a function to get the 'count' for the hand, but in Blackjack, Aces can be 1 or 11. I figured out (and hope I'm right), that you can never have two 'high' aces, so my function returns a `lowCount` and `highCount` value where for the high version, if an Ace exists, it's counted as 11, but only one. Here's that logic:

```js
getCount(hand) {
	/*
	For a hand, I return 2 values, a low value, where aces are considered 1s, and a high value, where aces are 11. Note that this fails to properly handle a case where I have 3 aces
	and could have a mix... although thinking about it, you can only have ONE ace at 11, so 
	maybe the logic is:  low == all aces at 1. high = ONE ace at 11. fixed!
	*/
	let result = {};
	// first we will do low, all 1s
	let lowCount = 0;
	for(card of hand) {
		if(card.value === 'JACK' || card.value === 'KING' || card.value === 'QUEEN') lowCount+=10;
		else if(card.value === 'ACE') lowCount += 1;
		else lowCount += Number(card.value);
		//console.log(card);				
	}
	//console.log('lowCount', lowCount);
	let highCount = 0;
	let oneAce = false;
	for(card of hand) {
		if(card.value === 'JACK' || card.value === 'KING' || card.value === 'QUEEN') highCount+=10;
		else if(card.value === 'ACE') {
			if(oneAce) highCount += 1;
			else {
				highCount += 10;
				oneAce = true;
			}
		}
		else highCount += Number(card.value);
	}
	//console.log('highCount', highCount);
	return { lowCount, highCount };
},
```

If the player busts, we end the game and let the user start over. If they stand, it's time for the dealer to take over. That logic was simple - hit while below 17 and either bust or stand. In order to make it a bit more exciting, I used a variable and async function, `delay`, to slow the dealer's actions so you can see them play out in (kinda) real-time. Here's the dealer's logic:

```js
async startDealer() {
	/*
	Idea is - I take a card everytime I'm < 17. so i check my hand, 
	and do it, see if im going to stay or hit. if hit, i do a delay though
	so the game isn't instant.
	*/	

	// really first, initial text
	this.pcText = 'The dealer begins their turn...';
	await delay(DEALER_PAUSE);

	// first, a pause while we talk
	this.pcText = 'Let me show my hand...';
	await delay(DEALER_PAUSE);

	// reveal my second card
	this.pcCards[0].showback = false;

	// what does the player have, we need the best under 22
	let playerCount = this.getCount(this.playerCards);
	let playerScore = playerCount.lowCount;
	if(playerCount.highCount < 22) playerScore = playerCount.highCount;
	//console.log('dealer needs to beat', playerScore);

	// ok, now we're going to loop until i bust/win
	let dealerLoop = true;
	while(dealerLoop) {
		let count = this.getCount(this.pcCards);
		
		/*
		We are NOT doing 'soft 17', so 1 ace always count as 11
		*/
		if(count.highCount <= 16) {
			this.pcText = 'Dealer draws a card...';
			await delay(DEALER_PAUSE);
			this.pcCards.push(await this.drawCard());
		} else if(count.highCount <= 21) {
			this.pcText = 'Dealer stays...';
			await delay(DEALER_PAUSE);
			dealerLoop = false;
			this.pcTurn = false;
			if(count.highCount >= playerScore) this.pcWon = true;
			else this.playerWon = true;
		} else {
			dealerLoop = false;
			this.pcTurn = false;
			this.pcBusted = true;
		}
	}
}
```

FYI, `pcText` is used in the white status area as a way of setting game messages. 

And basically - that's it. If you want to play it yourself, check out the CodePen below, and feel free to fork it and add improvements:

<p class="codepen" data-height="500" data-default-tab="result" data-slug-hash="YzRZYqV" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/YzRZYqV">
  Blackjack (Don't do this, Ray)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<p></p>

<p>
Photo by <a href="https://unsplash.com/@jacc?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Jack Hamilton</a> on <a href="https://unsplash.com/s/photos/deck-of-cards?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
</p>