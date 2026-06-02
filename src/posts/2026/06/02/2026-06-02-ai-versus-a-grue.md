---
layout: post
title: "AI versus a Grue"
date: "2026-06-02T18:00:00"
categories: ["Development"]
tags: ["javascript","generative ai"]
banner_image: /images/banners/dark-cave.jpg
permalink: /2026/06/02/ai-versus-a-grue
description: Turning Chrome's Built-in AI to tackle Zork
---

"It is pitch dark. You are likely to be eaten by a grue." If you recognize that quote, congrats, you probably need to see your doctor about pain in your back. (Ok, pain everywhere.) For those of us of a certain age, or folks who like classic games, the Infocom series was a tremendous source of entertainment. Using plain text commands to navigate your environment, players had to use their minds to figure out puzzles and mazes in order to win the game. The IF (Interactive Fiction) community is still strong and of course, I've spoken before about my time playing and coding on MUDs, so with that in mind, I thought I'd try tackling something that I assumed probably wouldn't work well - seeing if Chrome's [built-in AI](https://developer.chrome.com/docs/ai/built-in) could handle playing Zork 1, the most famous of Infocom's library. The short answer is... not so well. But honestly, it was kind of fun to try so I figured I'd share the results.

## Getting Zork

Before I could even begin trying to test AI's ability to play a 50 year old game (almost 50, Zork 1 launched in 1977), I first needed to find a JavaScript implementation. This turned out to be a bit tricky.

I quickly found [ifvms.js](https://github.com/curiousdannii/ifvms.js), an interactive fiction virtual machine library, but it was tailored to running at the command line. Also, there was little to no documentation on how to make sure of the library. The repo mentions another repo, [parchment](https://github.com/curiousdannii/parchment) which lets you play games on the web, but I struggled to find documentation there as well, or documentation specific to my use case.

To help, I went to Claude, and had it load `ifvms.js` and create a 'stubbed' version that I could use via calls like so:

```js
// all of this loads Zork 1...
const res = await fetch('zork1.b64.txt');
const b64 = await res.text();

const binary = atob(b64.trim());
const arrayBuffer = new ArrayBuffer(binary.length);
const view = new Uint8Array(arrayBuffer);
for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
}

engine = new ZorkEngine();
engine.load(arrayBuffer);

// and then later:
let gameResponse = engine.getOutput(); // last thing the game did

// send a command
let lastResponse = engine.send(command);
```

That source file above mentioned in the first line comes from an online source. Zork itself is open source (<https://github.com/historicalsource/zork1>), but I forget where I got my copy of the source. It's not a text file, I renamed it to that when initially attempting to build my demo on CodePen. I believe it was pure binary I converted to base64 and then renamed. 

## Building the Game

So with Claude helping me build the version of `ifvms` I could use interactively, I then had to whip up a quick UI and point Chrome's [Prompt API](https://developer.chrome.com/docs/ai/prompt-api), which as of Chrome 148 is GA to everyone. (Well, everyone on Chrome.) 

My UI was just a giant text area where I'd stream the output from the game and Chrome's inputs. All of that code is kinda basic, so I'll focus on the prompt aspect. Here's how I create my session:

```js
$session = await LanguageModel.create({
    initialPrompts:[
        { 
            role: 'system', 
            content: 
                    `
You are playing the classic text adventure game Zork. You will be given the current game output, and you will 
respond with a single command to play the game. You will not explain your command, just give the command. 

Remember to keep your commands concise and to the point, as if you were playing the game yourself. Do not include 
any extra text or explanations.

Zork is a text-based adventure game where you explore a mysterious underground world filled with treasures, puzzles, 
and dangers. Your goal is to navigate through the various locations, solve puzzles, and collect treasures 
while avoiding traps and monsters.

Here are some examples of commands you might use in Zork:
- "go north"
- "take lamp"
- "open mailbox"
- "look around"
- "inventory"

Do your best to play the game effectively and efficiently, making smart choices based on the current game output.

Try not to keep returning to the same location repeatedly, as that can lead to getting stuck in loops. Instead, 
explore new areas and try different actions to progress through the game. Remember that you can travel in all directions.
                    `
        }
    ],		
    monitor(m) {
            m.addEventListener("downloadprogress", e => {
                console.log(`Downloaded ${e.loaded * 100}%`);
                if(e.loaded === 0 || e.loaded === 1) {
                    $output.innerHTML = '';
                    return;
                }
                $output.innerHTML = `Downloading AI model, currently at ${Math.floor(e.loaded * 100)}%`;
            });
        }		
});
```

As you can see, a majority of this is the big prompt. I iterated over this multiple times to help guide Chrome to effectively solve the game. (Which to be clear, it never did.)

Outside of that, the main loop of the game is this heartbeat function:

```js
async function gameHeartBeat() {

    console.log('in hb');
    let gameResponse = engine.getOutput();
    if(!gameResponse) gameResponse = lastResponse;

    if(gameResponse) {
        $gameoutput.value += gameResponse + '\n';
        $gameoutput.scrollTop = $gameoutput.scrollHeight;

        let command = await $session.prompt(gameResponse);
        lastResponse = engine.send(command);

        $gameoutput.value += `> ${command}\n`;
        $gameoutput.scrollTop = $gameoutput.scrollHeight;

        console.log('Resp',command);
        setTimeout(gameHeartBeat, 1000 * 2);
    }
 
}
```

The variable `$gameoutput` is just a DOM pointer to the `textarea` used to render the game.

Before going any further, I'll note a huge issue with my code and that's the lack of session management. Chrome absolutely provides you a way to monitor that usage and re-init the session when it is nearly filled. I didn't bother with that because I was being lazy when I built this.

I'd also argue that we could help Chrome's model quite a bit by keeping track of a list of rooms it has already visited to help it remember and not loop over the same place. My prompt tries to do that, but I could also help it out myself. 

All in all - this was a quick implementation and the results were... well what you would expect with a lightweight model and me just hacking quickly on it. ;)

Here's a transcript from a text I just did.

```
ZORK I: The Great Underground Empire
Infocom interactive fiction - a fantasy story
Copyright (c) 1981, 1982, 1983, 1984, 1985, 1986 Infocom, Inc. All rights reserved.
ZORK is a registered trademark of Infocom, Inc.
Release 119 / Serial number 880429

West of House
You are standing in an open field west of a white house, with a boarded front door.
There is a small mailbox here.

>                                                                                 West of HouseScore: 0  Turns: 0
> examine mailbox
The small mailbox is closed.

>                                                                                 West of HouseScore: 0  Turns: 1
> open mailbox
Opening the small mailbox reveals a leaflet.

>                                                                                 West of HouseScore: 0  Turns: 2
> read leaflet
(Taken)
"WELCOME TO ZORK!

ZORK is a game of adventure, danger, and low cunning. In it you will explore some of the most amazing territory ever seen by mortals. No computer should be without one!"

>                                                                                 West of HouseScore: 0  Turns: 3
> look around
West of House
You are standing in an open field west of a white house, with a boarded front door.
There is a small mailbox here.

>                                                                                 West of HouseScore: 0  Turns: 4
> go north
North of House
You are facing the north side of a white house. There is no door here, and all the windows are boarded up. To the north a narrow path winds through the trees.

>                                                                                 North of HouseScore: 0  Turns: 5
> go north
Forest Path
This is a path winding through a dimly lit forest. The path heads north-south here. One particularly large tree with some low branches stands at the edge of the path.

>                                                                                 Forest PathScore: 0  Turns: 6
> examine tree
There's nothing special about the tree.

>                                                                                 Forest PathScore: 0  Turns: 7
> go north
Clearing
You are in a clearing, with a forest surrounding you on all sides. A path leads south.
On the ground is a pile of leaves.

>                                                                                 ClearingScore: 0  Turns: 8
> take leaves
In disturbing the pile of leaves, a grating is revealed.
Taken.

>                                                                                 ClearingScore: 0  Turns: 9
> open grating
The grating is locked.

>                                                                                 ClearingScore: 0  Turns: 10
> look around
Clearing
You are in a clearing, with a forest surrounding you on all sides. A path leads south.
There is a grating securely fastened into the ground.

>                                                                                 ClearingScore: 0  Turns: 11
> go south
Forest Path

>                                                                                 Forest PathScore: 0  Turns: 12
> go north
Clearing

>                                                                                 ClearingScore: 0  Turns: 13
> examine leaves
There's nothing special about the pile of leaves.

>                                                                                 ClearingScore: 0  Turns: 14
> go south
```

In my tests, it never seems to get much further in the game than the outer area, but certainly tries hard, so I guess I'll give it a gold star for that.

If you want to try this yourself, you can point Chrome at <https://cfjedimaster.github.io/webdemos/chrome_zork/>. Note that I provide no visual indicator that the model is downloading, you will need to open devtools if you want to see that in action. 

If you want to peruse the code yourself, you can check it out here: <https://github.com/cfjedimaster/webdemos/tree/master/chrome_zork>

Now that I've got a bit more time on my hands (ahem), I may try hacking on this a bit more, but it was certainly fun to see it in action.

Photo by <a href="https://unsplash.com/@sortino?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Joshua Sortino</a> on <a href="https://unsplash.com/photos/photo-of-light-towards-inside-of-cave-rAqzj79GUmA?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      