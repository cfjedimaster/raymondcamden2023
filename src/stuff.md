---
layout: page
title: Stuff
description: This is where everything ends up...
---

Over the years, I've built many websites, tools, bots, utilities, and while I've probably forgotten more than I remembered, I thought I'd try to list out the more interesting ones here on my "Stuff" page. This is my lab, my playroom, my collection of dumb ideas that were fun to build. Most likely none of what follows will be useful in any real way, but if it brings a smile to your face, that will make me happy.

## Games

As an avid gamer, I've enjoyed building my own web-based games over the years. Here are a few recent examples.

* [My Little Mortal Combat](https://cfjedimaster.github.io/webdemos/my_little_mortal_combat/) - Exactly how it sounds.
* [IdleFleet](https://idlefleet.netlify.app/) - an idle clicker game that has you build a space trading empire.
* [Cat Herder](https://catherder.netlify.app/) - another idle clicker game, although this one requires a bit more attention as you attempt to manage an army of cats.

## Random Sites
* [Oh Shit the Sun](https://oh-shit-the-sun.netlify.app/) - will there be more or less sun today?
* [MD Viewer](https://mdviewerpwa.netlify.app/) - a PWA Markdown viewer. You can install it and it will associate Markdown files locally.
* [Scratching Post](https://cfjedimaster.github.io/webdemos/scratchingpost/) - Cat social network.
* [DCC Achievement Generator](https://dcc.raymondcamden.com/) - Snark achievement messages.
* [Random Dashboard](https://cfjedimaster.github.io/webdemos/randomdashboard/) - random dashboards.
* [Cat Facts](https://codepen.io/cfjedimaster/full/jEbGKpV) - a collection of random cat facts.
* [Dad Joke](https://mydadjoke.netlify.app/) - a simple PWA for showing dad jokes.

## Software

* [lego-screensaver](https://github.com/cfjedimaster/lego-screensaver) - an OSX screensaver that shows a random LEGO set.
* [precipradar](https://github.com/cfjedimaster/precipradar) - an OSX weather radar widget.

## My Recent CodePens

<div id="pens"><i>Loading...</i></div>

<style>
#pens {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
	gap: 1.25rem;
	margin-block: 1.5rem;
}

#pens .penBox {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	border: 1px solid #d8dce2;
	border-radius: 0.75rem;
	background: #fff;
	color: inherit;
	text-decoration: none;
	box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
	transition: transform 150ms ease, box-shadow 150ms ease;
}

#pens .penBox:hover,
#pens .penBox:focus-visible {
	transform: translateY(-3px);
	box-shadow: 0 6px 18px rgb(0 0 0 / 14%);
}

#pens .penBox img {
	display: block;
	width: 100%;
	aspect-ratio: 16 / 10;
	object-fit: cover;
}

#pens .penBox h3 {
	margin: 0;
	padding: 1rem;
	font-size: 1.1rem;
	line-height: 1.35;
}

@media (prefers-reduced-motion: reduce) {
	#pens .penBox {
		transition: none;
	}
}
</style>

## To Do

Add more stuff!

<script>
document.addEventListener('DOMContentLoaded', async () => {

    let $pens = document.querySelector('#pens');
	
	let pens = await fetch('/.netlify/functions/get-codepens').then(r => r.json());
    $pens.innerHTML = '';

	pens.forEach(p => {
		let pen = document.createElement('a');
		pen.className = 'penBox';
		pen.href = p.url;
		pen.target = '_blank';
		pen.rel = 'noopener noreferrer';

		let screenshot = document.createElement('img');
		screenshot.src = p.screenshot;
		screenshot.alt = '';
		screenshot.loading = 'lazy';

		let title = document.createElement('h3');
		title.textContent = p.title;

		pen.append(screenshot, title);
		$pens.append(pen);
    });

});
</script>