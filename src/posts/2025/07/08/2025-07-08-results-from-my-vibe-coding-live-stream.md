---
layout: post
title: "Results from My Vibe Coding Live Stream"
date: "2025-07-08T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_maze.jpg
permalink: /2025/07/08/results-from-my-vibe-coding-live-stream
description: A summary of what I built in today's stream.
---

Usually for my Code Break shows, I assume if folks miss it they'll just check out the recordings, but while my [earlier session](https://cfe.dev/talkshows/codebreak-07082025/) is fresh in my mind, I thought I'd share a bit more about the session and a look at the code generated. It actually went a *heck of a lot* better than I anticipated to be honest, and was fun. To be clear, it wasn't perfect, and I'll touch a bit on what my tool of choice struggled with, but overall I'm really impressed with what I got built in an hour.

## What I Used and Why

Constant readers here know I almost always use [Google Gemini](https://ai.google.dev/gemini-api/docs) for anything AI related, but I've been trying to branch out a bit lately. Also, I found their Visual Studio Code integration... weird. Not bad but the few times I tried to developer with it I found it a bit awkward. That's probably just me and I probably just need to give it a bit more time, but for today I decided against it.

Instead I decided to use [GitHub Copilot](https://code.visualstudio.com/docs/copilot/overview). Again, in the few times I had tried it previously to today's stream, it just seemed to click a bit better with me. It could be because this support is more "first party" in VSC (i.e., a core part of the product versus an extension like Gemini) but whatever the reason, I felt like it would work better. 

With that in mind, I created an empty directory, opened up the chat interface, and started with a prompt:

```
Web app that generates a randomized maze (of a set size), 
places a player character (@) in the start of the maze, 
marks an exit (+), and then lets the player use keyboard 
controls to navigate the maze. 

We are only using HTML, CSS, and JavaScript. No libraries. 
No React. No Preact. Don't even say the word React. Just 
vanilla JavaScript. No Node.js for the server. 
```

The first paragraph describes what I wanted to build, while the second was based on my experience with other tools really, really, *really* wanting me to use React and me just doing my best to Nope the hell out of that world. 

<p>
<img src="https://static.raymondcamden.com/images/2025/07/nope.jpg" alt="Nope" class="imgborder imgcenter" loading="lazy">
</p>

I also didn't want any kind of server aspect involved, even Node, as I didn't want a build process of any sort - just simple, static HTML, like my grandmother used to make on the weekend, with the lovely smell of div tags in the oven. Glorious I tell ya. 

The initial result was actually really darn good. I especially loved how Copilot dropped the files in my folder with decent names (`index.html`, `script.js`, and `style.css`) and followed my instructions to not create any server or use a JavaScript framework.

If I had been smart, I'd have save all my work in source control (it is now, and I'll link to it in a bit), but for now I'll share a screenshot from the stream that shows how well it worked.

<p>
<img src="https://static.raymondcamden.com/images/2025/07/vibe1.jpg" alt="First maze render" class="imgborder imgcenter" loading="lazy">
</p>

It was, honestly, perfect. Keyboard commands worked fine, I loved the dark theme, and it just plain worked. 

## The Iterations

Now came the fun part. I started doing various iterations, mostly based on UI and some interactions. 

One of the first things I did was have it work on the walls. I wanted it to add a 'brick' effect to the walls so that they looked more like, well, walls. This... did not work terribly well. We went through three or so iterations and then I gave up, and I was fine with that as the wall was a CSS declaration I could come back to later and make prettier if I wanted. 

<p>
<img src="https://static.raymondcamden.com/images/2025/07/vibe2.jpg" alt="Second maze render" class="imgborder imgcenter" loading="lazy">
</p>

I also tweaked the character representation from an @ symbol to an SVG of a stick figure. It's first output was fine, but had a blank white face. When I asked it to add two small eyes to it, again, it did so perfectly. I had some more feedback from my buddy Scott about adding a border around the maze, and again, Copilot added that just fine. 

One of the last things I had Copilot do was change the 'end of maze' routine. Initially it just alerted something like "You made it blah blah blah", but instead, I had it have you go to the next level of the maze, basically just render a new maze and increment a level counter. 

At this point, it did something *really* well. It didn't just build what I requested, but also added a small delay. Here's the relevant part of the code.

```js
if (player.row === exit.row && player.col === exit.col) {
	// Player reached exit: increase level, start new maze
	setTimeout(() => {
		level++;
		startGame();
	}, 200);
}
```

Specifically what impressed me was the timeout. It occurred to me that if instantly went to a new maze, the user may think it glitched out a bit. By adding the slight pause, it's more obvious that a transition happened. I had not even thought of that and it was a great addition. 

All in all, I'm really happy with the result and you can play it here: [Maze Game](https://cfjedimaster.github.io/codebr/vibecoding/app1/app1_premonster/index.html). Try not to look at the URL, trust me on that. ;) 

## Monsters Make Everything Better

So at this point, it was roughly 15 minutes or so before the show was supposed to end and I figured, what the hell, let's add monsters. My prompt was:

```
lets add monsters! for now, represent them as *, add one to the maze, 
and it moves slowly, randomly, unless it sees the player, and in 
that case it will move in the players direction. if the monster touches
the player (or the player touches the monster), the game is over. use
an alert to say as such.
```

This worked better than I expected. The only issue is that the mazes aren't terribly big, and it was pretty easy to get 'stuck' behind the monster, which meant you would have to try to lure it away, which is kinda cool, but also difficult as the monster would forget you if you turned a corner. All in all, a not-so-fun addition, but it made me laugh, and if you want, you try try it here: <https://cfjedimaster.github.io/codebr/vibecoding/app1/>

Want the code? You can find both versions here: <https://github.com/cfjedimaster/codebr/tree/main/vibecoding/app1>

{% liteyoutube "-75xpgYP10Q" %}