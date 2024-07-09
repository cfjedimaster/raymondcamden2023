---
layout: post
title: "Cat Herder V1 Released!"
date: "2024-07-09T18:00:00"
categories: ["development"]
tags: ["javascript","games"]
banner_image: /images/banners/cat_herder.jpg
permalink: /2024/07/09/cat-herder-v1-released
description: Cat Herder is done! Maybe! Kinda...
---

It's been a few weeks since I blogged about [Cat Herder](https://catherder.netlify.app), my latest web game, but over the holiday break I plugged up the last few features missing and decided it was time to "release" it, and by release, I mean set the version number to 1 and see what happens next. 

Since my [last post](https://www.raymondcamden.com/2024/06/07/game-dev-diary-cat-herder---part-2) in June, I've made a few small changes here and there, but the biggest updates in this last release revolve around the cats, and how you get more of them. As I mentioned in my previous posts, I wasn't really sure about making cats "purchasable", that just didn't feel right. Instead, I went with a system that kind of works like levels in a RPG. 

The more purrs you get (which are the currency), the more cats join your home. This was based on a [formula](https://gamedev.stackexchange.com/questions/13638/algorithm-for-dynamically-calculating-a-level-based-on-experience-points/13639#13639) I found on Stack Overflow that felt like it had a good natural progression of XP to level. 

My implementation was two-fold:

1) First, in the heartbeat function, simply see if I've earned enough for a new cat:

```js
if(this.nextCatCost <= this.purrs) {
	console.log('add cat based on purrs');
	this.addCat();
}
```

2) I defined `nextCatCost` based on the SO answer:

```js
get nextCatCost() {
	// https://gamedev.stackexchange.com/a/13639
	// reverse is: XP = level squared / constant
	// constant from that same comment, 0.04
	return (this.cats.length + 1) ** 2 / 0.04;
},
```

As the comment says, it's a bit of a reverse. Given I have X cats now, or I'm X level in the RPG, determine the cost of level X+1. That constant, 0.04, again comes from the SO thread on the topic.

The last big(ish) change was to remove the explicit display of cat happiness and replace it with a random string. I 'group' happiness by either really sad, kinda sad, neutral, happy, and really happy. I defined a set of strings for these values:

```js
let VERY_UNHAPPY = ['$name is growling very angrily.', '$name hisses at you in utter contempt.'];
let UNHAPPY = ['$name is scowling at you.', '$name hisses at you.'];
let NEUTRAL = ['$name looks bored.', '$name yawns.', '$name twiddles their toebeans.'];
let HAPPY = ['$name is purring', '$name stretches out their arms.', '$name arches their back up.'];
let VERY_HAPPY = ['$name is purring contentedly.', '$name rolls around in pure joy.'];
```

Note the of `$name`. In the HTML, I added:

```html
<span x-text="happyLabel(cat.happiness,cat.name)"></span>
```

And then defined that function like so:

```js
happyLabel(h,name) {
	/*
	we have 5 types of labels for cats:
	very unhappy
	unhappy
	neutral
	happy
	very happy
	*/
	if(h < -20) return getRandomArrayEl(VERY_UNHAPPY).replace('$name', name);
	if(h < 0) return getRandomArrayEl(UNHAPPY).replace('$name', name);
	if(h === 0) return getRandomArrayEl(NEUTRAL).replace('$name', name);
	if(h < 20) return getRandomArrayEl(HAPPY).replace('$name', name);
	return getRandomArrayEl(VERY_HAPPY).replace('$name', name);
},
```

Relatively simple, and to be honest, some of the differences between, for example happy and very happy, aren't terribly clear, but that's also kind of the point, right?

So, that's it for now. I've already got an idea for my next game, but I'll probably return to this from time to time, like I've done with [IdleFleet](https://idlefleet.netlify.app).

Check out [Cat Herder](https://catherder.netlify.app) now and let me know what you think! Below is a video version of what I described above.

<iframe width="560" height="315" src="https://www.youtube.com/embed/H0TYycJaz1Q?si=ENLkf94rz9BsdMcX" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>