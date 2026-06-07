---
layout: post
title: "Can GenAI help you win in Vegas? (2026)"
date: "2026-06-07T18:00:00"
categories: ["Uncategorized"]
tags: []
banner_image: /images/banners/cards.jpg
permalink: /2026/06/07/can-genai-help-you-win-in-vegas-2026
description: An update to a previous demo - using Prompt API to help with Blackjack. 
---

No! Thanks for reading. Still here? Cool. So *way* back in 2023, I built a little demo that I thought was kinda cool. Early in 2023 I had used Alpine.js and the excellent [Deck API](https://deckofcardsapi.com/) to build a simple web-based Blackjack game: [Creating a Blackjack Game with Alpine.js and the Deck of Cards API](https://www.raymondcamden.com/2023/07/04/creating-a-blackjack-game-with-alpinejs-and-the-deck-of-cards-api). I then took *that* demo and connected to Google's GenAI API, which back then was named Palm: [Can GenAI help you win in Vegas?](https://www.raymondcamden.com/2023/11/09/can-genai-help-you-win-in-vegas). It's been a few years and I thought I'd take a stab at it again, this time making use of Chrome's [Prompt API](https://developer.chrome.com/docs/ai/prompt-api). Technically I'd have much better luck using a bleeding edge Gemini model via a serverless function, and I may still take a stab at that later, but I thought I'd see how well the Prompt API worked. 

I won't go into all the details on how the game is built, for that, check out the [original post](https://www.raymondcamden.com/2023/07/04/creating-a-blackjack-game-with-alpinejs-and-the-deck-of-cards-api). Also, I won't go over again the UI/UX of AI prompting, which I covered in the [last post](https://www.raymondcamden.com/2023/11/09/can-genai-help-you-win-in-vegas). All I did was add a button: "Ask for Help!", which kicks off the process and then uses a JavaScript `alert` to provide feedback. That's not awesome but I'm fine with that. Ok, I lie, it's Sunday, I've got nothing but laundry to do - so I'll replace it with a native `<dialog>` instead!

To enable this new version, I made a couple of changes. First, I've got a new Alpine method to create the AI session. This is responsible for setting up the system instruction for the model as well:

```js
async createSession() {
	console.log('createSession running');
	this.session = await LanguageModel.create({
		expectedOutputs: [
			{ type:'text', languages: ['en'] }
		],
		initialPrompts: [
			{
				role: 'system',
				content:
							`
You are an expert Blackjack advisor helping a player make decisions in a simplified game (no splitting, no doubling down, no surrender). Your goal is to advise the player whether to 'Hit' or 'Stand' based on standard basic Blackjack strategy.

CRITICAL GAME RULES:
- Goal: Beat the dealer's hand value without exceeding 21 (busting).
- Card Values: Cards 2-10 are face value. Jack, Queen, and King are worth 10. Aces are worth either 1 or 11, whichever is more beneficial without busting.
- Blackjack: A "Blackjack" is strictly a 2-card hand consisting of an Ace and a 10-value card (10, J, Q, K). An Ace and an 8 is just 19, not a Blackjack.
- Soft vs. Hard: A hand with an Ace counted as 11 is a "soft" hand (e.g., Ace + 6 = soft 17). Otherwise, it is a "hard" hand.

INSTRUCTIONS:
You will be provided with the player's current hand and the dealer's visible card.
Respond strictly in the following format:
ACTION: [Choose ONLY "Hit" or "Stand"]
REASON: [A brief, one-sentence logical explanation based on standard Blackjack probabilities and the dealer's visible card]
`,
		},
	],
	monitor(m) {
		m.addEventListener('downloadprogress', (e) => {
			if (e.loaded === 0) return;
			const pct = Math.floor(e.loaded * 100);
			if(pct !== 0 && pct !== 100) this.aiHelp = `Downloading model… ${pct}%`;
		});
	},
});			
```

Note the level of detail in the system instruction. Initially I had just the initial paragraph and a bit about how to return the results. I took this to the Gemini desktop app and asked this:

```
I’ve built a web based Blackjack game. It’s a simplified version that doesn’t 
include splitting or doubling down. As part of the game, I used Chrome’s 
built-in Prompt API to offer advice to the player on whether to hit or stand. 
This works *mostly* ok, but I see mistakes, for example, Chrome’s Prompt API 
once said an Ace + 8 is a blackjack, when it has to be a face card or 10 as 
far as I know. To help me improve the prompt, can you give me a good system 
prompt that briefly, but completely, covers the rules, again though ignoring 
doubling down/splitting/etc. This is the current system instruction:

(I pasted the first version here)
```

I then took its improved prompt and added it to my code. 

Next I had to wire this up to the AI advice button. This is the `askForHelp` method and the referenced schema:

```js
const adviceSchema = {
  type: 'object',
  properties: {
    action: { type: 'string', enum:['HIT','STAND'] },
    reason: { type: 'string' }
  },
  required: ['action', 'reason']
};

async askForHelp() {
	console.log('lets call an (AI) friend');
	if(!this.session) {
		console.log('generating a session');
		this.aiHelp = '<i>Creating the AI session.</i>';
		await this.createSession();
	}
	this.aiHelp = '<i>Asking our AI friend...</i>';

	let totalOb = this.getCount(this.playerCards);

	// string to represent my hand, could be 2-5 cards
	let playerStr = 'My hand consists of:\n ';
	// this could be reduce(), im being lazy
	this.playerCards.forEach(p => {
		playerStr += `${p.value} of ${p.suit.toLowerCase()}\n`;
	});
	
	// string to set the total value for the prompt, helps it
	let totalStr = 'My hand has a total of ';
	if(totalOb.lowCount === totalOb.highCount) {
		totalStr += totalOb.lowCount;
	} else {
		totalStr += `${totalOb.lowCount} or ${totalOb.highCount}`;
	}
	
	let content = `
I'm playing blackjack and the dealer currently has ${this.pcCards[1].value} of ${this.pcCards[1].suit.toLowerCase()}.

${playerStr}

${totalStr} 

Should I hit or should I stay?
	`;
	console.log('content', content);
	let result = JSON.parse(await this.session.prompt(
		[{ role: 'user', content }], 
		{ responseConstraint: adviceSchema }
));
	console.log(result);
	
	let resultMsg = `
You should ${result.action}. Why?
${result.reason}
`;

	this.aiHelp = '';
	this.advice = resultMsg;
	this.$refs.adviceDialog.showModal();
}
```

Ok, there's a few things of note going on here. As with the previous version, I take the current game state and turn it into a prompt where I describe my hand. While working on this version I discovered a pretty big flaw from the previous game. When asking AI for advice, I only described two cards max. Now I ensure I describe my entire hand.

Now you may be wondering, why do I get the total value of my hand - shouldn't the model know how to calculate that? As before, at least in the Prompt API, the answer is no. Initially I removed that bit thinking the system instruction would be enough. But even though my system prompt describes how to get the total of a hand, I still found the model calculating the total wrong. Not all the time, but at least once. So the little helper string went back in. 

The other change in this version is a proper schema to shape the response - give me an action (hit or stay) and a reason. This gets turned into a string and passed to my HTML dialog element. Here's how it looks in action:

<p>
<img src="https://static.raymondcamden.com/images/2026/06/bj2.png" loading="lazy" alt="Screenshot from BJ app" class="imgborder imgcenter">
</p>

In case that's hard to read, the dialog says:

"You should HIT. Why? With a hard 16, you need to improve your hand to stand a chance against the dealer's strong 10."

If I remember right, this advice makes sense, but I find it difficult personally to hit on anything 15 and higher. For that particular round I stayed and the dealer won with Blackjack, so I had no chance. 

In my next test, the dealer was showing a King of Clubs and I had two Aces and the advice was:

"You should STAND. Why? You have a soft 2 or 12 which is a strong hand, and the dealer has a King, making it unlikely they will have a high hand."

That seems crazy, so I went ahead and got a new card which ended up being a seven. At that point the AI suggested staying, which I did, and I still lost as the dealer's other card was a 10. 

In my next round, the dealer was showing a queen and I had a 5 and a 9. The AI suggested hitting which I completely agreed with and of course - I busted. 

I played a few more times, and generally the model's suggestions seemed ok. I could see it being useful if I was a complete novice at the game, but I don't see whipping out my phone and asking AI for help any time soon. (I don't really game myself, but I assume most casinos have rules against this now. Anyone know offhand?)

What do you think? If you've got an up to date Chrome, you can test it here: <https://codepen.io/cfjedimaster/full/KwNbvPq/afbf4079fe199863f11f75957817fcc8>. Note that the first time you download the model it may take 5 to 10 minutes, but that applies across your device as a whole. If you run across another demo using the API you won't need to download it again. 

If you want to take a look at the code, I've embedded it below. The dialog I added could *really* use some styles so if anyone wants to fork and share, let me know!

<p class="codepen" data-height="500" data-pen-title="Blackjack (Chrone AI)" data-default-tab="html" data-slug-hash="KwNbvPq" data-user="cfjedimaster" data-token="afbf4079fe199863f11f75957817fcc8" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/KwNbvPq/afbf4079fe199863f11f75957817fcc8">
  Blackjack (Chrone AI)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

