---
layout: post
title: "All Your Dragons Are Belong To Us"
date: "2024-04-02T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/dragon_hoard.jpg
permalink: /2024/04/02/all-your-dragons-are-belong-to-us
description: A description of how I rebuilt an older Twitter bot to tell dragon stories.
---

Forgive the somewhat silly title, but it's not like I haven't been silly here before. Almost four years ago I wrote a little post about a random text-generated app called the "Queen Maker": [Let's Make Everyone a Queen!](https://www.raymondcamden.com/2020/05/15/lets-make-everyone-a-queen). The idea for that app (which lives on at [queenof.netlify.app](https://queenof.netlify.app/)) was to use a random text library called [Tracery](https://github.com/galaxykate/tracery) to generate random short "queen-based" stories. Yeah, that may not make much sense, but read the earlier post or play with the app to see. 

The important bit though was that it was inspired by a cool Twitter bot called [Dragon Hoards](https://twitter.com/dragonhoards). This bot, like many "fun" bots, is now dead, but it still makes me smile when I think about it. On a whim, I reached out to the creator [peat](https://bsky.app/profile/awesomonster.bsky.social) and asked if I could recreate it. They graciously agreed and I got to work. 

If you don't really care how it was built and just want to see it in action, you can follow it on Mastodon at <https://botsin.space/@dragonhoards> or at Bluesky here: <https://bsky.app/profile/dragonhoards.bsky.social>. 

Here's an example toot from Mastodon:

<iframe src="https://botsin.space/@dragonhoards/112199331088567756/embed" class="mastodon-embed" style="max-width: 100%; border: 0; display:block; margin:auto" width="400" allowfullscreen="allowfullscreen"></iframe><script src="https://botsin.space/embed.js" async="async"></script>

## How Dragon (Hoards) Are Made

While I initially wanted to give Tracery another go, I decided against it for various reasons. The library has not been updated in some time, and it would have meant a _lot_ of data entry to make the results more interesting. I began by looking at some sample tweets and breaking it down into a format:

<blockquote>
A #adjective# dragon lives #place#. She #verb# her hoard, which consists of a #number# of #thing#, #number# of #thing#, and #number# of #thing#. She feels #feeling#.
</blockquote>

Specifically, when looking at that, I'd need to create long lists of adjectives, feelings, things, and so forth. Instead, I decided to turn to a library I've used before, [random-word-slugs](https://www.npmjs.com/package/random-word-slugs). While I think the idea for this library was to make it easier to generate random code names or strings for project names, I've used it creatively in the past, most recently for [IdleFleet](https://idlefleet.netlify.app/). 

Bit by bit, I broke it down. So for example, to get the type of Dragon, I wrote this function:

```js
const getDragonType = function() {
  const options = {
    format:'lower',
    partsOfSpeech: ['adjective'],
    categories: {
      adjective: ['color','appearance','personality']
    }
  }
  
  return randomWordSlugs.generateSlug(1, options);
}
```

Notice I'm asking for an adjective, but specifically one using either a color, appearance, or personality. Sample results include:

```
'nice'
'aggressive'
'short'
'muscular'
'witty'
'embarrassed'
'adamant'
'jolly'
'busy'
'clumsy'
```

Using this, I noticed that if I started my string with "A", as in the template above, I'd have an issue with words like `adamant`. Luckily, there's another useful NPM module, [indefinite](https://www.npmjs.com/package/indefinite), which handles this. I added it along with the `capitlize` option to get this:

```
'A bright'
'A victorious'
'An itchy'
'An uptight'
'A proud'
'A beefy'
'A gorgeous'
'A clean'
'An embarrassed'
'A plump'
```

Next up is the location, and while random-word-slugs supports a 'place' category for nouns, I wasn't happy with the result. For this, I decided to create a hard-coded list of places. I perused the Dragon Hoards Twitter account until it seemed like I ran out of new places and wrote up this logic:

```js
const locations = [
  "in an ancient temple", "in a jungle", "by a dusty fountain", "on the shore of an ocean", 
  "on a distant planet", "inside a whirlpool", "on an ancient moon", "on an island", 
  "by a lake", "by a forest lake", "under your bed", "in a unicorn's forest", "far from people", 
  "under a lake", "in a castle in the sky", "on a forgotten mountain", "at the bottom of a whirlpool", 
  "in a nebula", "far away under rocks and stone", "in a mossy grove", "in a sock drawer", 
  "inside an abandoned castle", "at the end of a rainbow", "on a mountain top", "in a moonlit forest", 
  "inside a black hole", "in the ruins of a city", "on a deserted island", "in a jungle", 
  "in a forest temple", "in a long forgotten city", "on a moon", "on a distant planet", 
  "deep inside a well", "in an old mansion", "on a crumbling mountain", "on a forgotten island", 
  "in a haunted house", "on the other side of a rainbow", "on a lonely island", 
  "under a child's bed", "in a castle in the clouds", "in the ruins of a village", 
  "deep in a cave", "under a haunted house", "near a village"  
];

const getLocation = function() {
  return locations[getRandomIntInclusive(0, locations.length-1)]
}
```

`getRandomIntInclusive` simply returns whole numbers in a range and the net result is a random selection from the large list above. 

I used similar logic for the verb related to the dragon's hoard:

```js
const verbs = [
  "sees", "explores", "sorts", "inventories", "loves", "estimates", "guards", 
  "tallies", "reminisces over", "regards", "proud of", "looks over","searches", "investigates",
  "is proud of", "examines", "fiddles with", "counts","admires","loves","admires",
];

const getVerb = function() {
  return verbs[getRandomIntInclusive(0, verbs.length-1)]
}
```

Ok, so now for hoards, which was a bit more complex. I began by crafting the hoard string like so:

```js
let hoards = [];
for(let i=0;i<3;i++) {
	hoards.push(getHoard())
}

let hoardStr = `${hoards[0]}, ${hoards[1]}, and ${hoards[2]}`;
```

And here's `getHoard()`:

```js
const getHoard = function() {
  const options = {
    format:'lower',
    partsOfSpeech: ['adjective'],
    categories: {
      adjective: ['quantity']
    }
  }

  let quantity = randomWordSlugs.generateSlug(1, options);

  const options2 = {
    format:'lower',
    partsOfSpeech: ['noun'],
    categories: {
      noun: ['animals','food','thing']
    }
  }

  let item = pluralize(randomWordSlugs.generateSlug(1, options2));
  let ofWords = ['hundreds','thousands','millions','billions'];
  let joiner = ' ';
  /*
  hard coded logic - may revisit
  */
  if(ofWords.indexOf(quantity) >= 0) joiner = ' of ';
  
  return `${quantity}${joiner}${item}`;
  
}
```

It makes use of two calls to random-word-slugs, one for a quantity, and one for a noun, being either an animal, food, or thing. Notice I use another npm package, [pluralize](https://www.npmjs.com/package/pluralize), to turn the noun into its plural form. I noticed that some numeric quantities needed an 'of' for them to make sense. I was able to hard-code it (see `ofWords`) and while it feels slightly hackish, my inner lazy dragon wholeheartedly approves. Here's some results just from `getHoard()`:

```
'billions of toothbrushes'
'incalculable actions'
'full kilobytes'
'many eggs'
'little addresses'
'abundant kangaroos'
'scarce needles'
'little accidents'
'many books'
'scarce jewelleries'
```

The final bit, the emotion, was simple:

```js
const getFeeling = function() {
  const options = {
    format:'lower',
    partsOfSpeech: ['adjective'],
    categories: {
      adjective: ['condition']
    }
  }
      
  return randomWordSlugs.generateSlug(1, options);  
}
```

Here are some samples from that:

```
'better'
'careful'
'hallowed'
'abandoned'
'helpful'
'bad'
'acrid'
'shy'
'abandoned'
'easy'
```

## Setting up the Automation

The last part is kinda boring, not that it isn't cool, but I've covered it here quite often. Once again I went to [Pipedream](https://pipedream.com) as it's been my platform of choice for services like this for years now. Even better, they are previewing a new version of their builder, and it's a *huge* improvement when building workflows. You can see a video about it below:

<iframe width="560" height="315" src="https://www.youtube.com/embed/aMKkfD42NPg?si=7x_T6GxwKvp2_a4s" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>

My workflow consisted of:

* A scheduled-based trigger, executing once every three hours.
* A code step containing the logic I showed above
* A step to post to Mastodon
* A step to post to Bluesky

I've shared how to work with Mastodon many times already, and I discussed how to use the [Bluesky API](https://www.raymondcamden.com/2024/02/09/using-the-bluesky-api) back in February. As the code hasn't changed, I won't include it here, but you can find the complete workflow here: <https://github.com/cfjedimaster/General-Pipedream-Stuff/tree/production/dragon-hoards-bot-p_QPCWLwy>

Enjoy!