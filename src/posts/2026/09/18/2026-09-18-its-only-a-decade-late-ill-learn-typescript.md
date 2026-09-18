---
layout: post
title: "It's only a decade late, I'll learn TypeScript!"
date: "2026-09-18T18:00:00"
categories: ["development"]
tags: ["javascript","typescript"]
banner_image: /images/banners/typewriter.jpg
permalink: /2026/09/18/its-only-a-decade-late-ill-learn-typescript
description: Some first explorations with TypeScript (and Vite as well!)
---

I've been a bit worried lately. Of course, my friends will tell you that's my norm. But more specifically, I've been worried about my coding skills. As I use AI to generate more and more code, and it does that job well, I kinda miss actually *writing* code. I've also had a bit of writer's block in terms of *topics* to cover, and especially in the area of the web platform. A few days ago it occurred to me - I've never *really* dug into [TypeScript](https://www.typescriptlang.org/). Sure, I've used it, many times, in the fourteen or so years it's been out, but many times I kinda guess at what I'm doing and it was never my default for projects. Partly that's due to my philosophy of avoiding a build step in my projects and just KISS in general. 

But as I said - the inspiration hit me this past week and I thought I'd do some digging. Here's a few initial thoughts and experiments. Oh, and I still used AI a bit and I'll explain exactly how in the post below.

## TypeScript via Vite

Working with TypeScript can be as simple as `npm i -g typescript` and then `tsc somefile.ts`. I decided to use [Vite](https://vite.dev/) instead as it's focused on web projects and most of my development involves web projects. I assume most of my readers know of Vite, but if you somehow have managed to avoid hearing about it or using it yet, it is a *lightning* quick build tool for web projects. By "lightning quick" I mean that I still remember the first time I used it thinking it had failed to actually do anything - that's how quick it works. 

I also appreciated the fact that Vite's CLI supports a [`vanilla-ts`](https://stackblitz.com/edit/vitejs-vite-rnustopr?file=index.html&terminal=dev) scaffold that is really lightweight. On the other hand, I'm not necessarily a fan of what it actually shows as it feels a bit like bad practice, specifically an index file with just one div:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + TS</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

And then injects a bunch of HTML in main.ts:

```js
import './style.css'
import heroImg from './assets/hero.png'
import typescriptLogo from './assets/typescript.svg'
import viteLogo from './assets/vite.svg'
import { setupCounter } from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="center">
  <div class="hero">
    <img src="${heroImg}" class="base" width="170" height="179">
    <img src="${typescriptLogo}" class="framework" alt="TypeScript logo"/>
    <img src="${viteLogo}" class="vite" alt="Vite logo" />
  </div>
  <div>
    <h1>Get started</h1>
    <p>Edit <code>src/main.ts</code> and save to test <code>HMR</code></p>
  </div>
  <button id="counter" type="button" class="counter"></button>
</section>

<div class="ticks"></div>

<section id="next-steps">
  <div id="docs">
    <svg class="icon" role="presentation" aria-hidden="true"><use href="/icons.svg#documentation-icon"></use></svg>
    <h2>Documentation</h2>
    <p>Your questions, answered</p>
    <ul>
      <li>
        <a href="https://vite.dev/" target="_blank">
          <img class="logo" src="${viteLogo}" alt="" />
          Explore Vite
        </a>
      </li>
      <li>
        <a href="https://www.typescriptlang.org" target="_blank">
          <img class="button-icon" src="${typescriptLogo}" alt="">
          Learn more
        </a>
      </li>
    </ul>
  </div>
  <div id="social">
    <svg class="icon" role="presentation" aria-hidden="true"><use href="/icons.svg#social-icon"></use></svg>
    <h2>Connect with us</h2>
    <p>Join the Vite community</p>
    <ul>
      <li><a href="https://github.com/vitejs/vite" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#github-icon"></use></svg>GitHub</a></li>
      <li><a href="https://chat.vite.dev/" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#discord-icon"></use></svg>Discord</a></li>
      <li><a href="https://x.com/vite_js" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#x-icon"></use></svg>X.com</a></li>
      <li><a href="https://bsky.app/profile/vite.dev" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#bluesky-icon"></use></svg>Bluesky</a></li>
    </ul>
  </div>
</section>

<div class="ticks"></div>
<section id="spacer"></section>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
```

I'm probably being *real* nit picky here, but having 99% of the HTML for something in JavaScript versus HTML that gets enhanced feels off to me. But again - I'm being picky, and the actual code spit out is pretty minimal. (I could go on for ages about what's "appropriate" for scaffolded projects and such. Give me a soap box and I'll tell you more.)

So yeah, that's how I started. I pretty much nuked most of the code in main.ts and simplified even more. 

I mentioned earlier I still used a bit of AI in my exploration, and one example was to help clarify things a bit. For example, my very high level basic understanding of TypeScript basically came down to type annotations like so:

```js
let name:string = "Ray";
```

This line in the sample code confused me:

```js
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
```

So I simply asked Claude to explain it:

```
The <HTMLDivElement> (generic type argument)

By default, querySelector returns Element | null. Element is a very generic type — 
TypeScript doesn't know whether it's a div, an input, an SVG circle, etc. That 
matters because different elements have different properties: Element doesn't 
have .value, for example, but HTMLInputElement does.

Writing querySelector<HTMLDivElement>('#app') tells TypeScript: "trust me, the 
thing this selector finds is a div." So the return type becomes 
HTMLDivElement | null instead of Element | null, and you get proper autocomplete 
and type checking for div-specific properties.

Like the !, this is a compile-time-only assertion — TypeScript doesn't verify 
it. If #app were actually a <span>, the code would still compile and run; you'd 
just have a lying type.

Fun fact: in this particular line the generic is technically unnecessary, since 
.innerHTML exists on Element anyway. It's there mostly out of habit/convention 
(this looks like the Vite starter template). It becomes genuinely useful when 
you need element-specific properties like .value, .src, or .checked.
```

Cool. And this is something I've really liked about AI in the past. I feel like my question, a particular syntax being used, wouldn't Google well and AI tools do a better job of getting to the right answer. 

At this point, I felt ready to write something.

## Actually, let's not build for the web...

So when I figured out a good simple thing to build, I realized I didn't actually *need* a web UI for it, at least not initially, so I did a quick pivot and looked up info on [vitest](https://vitest.dev/), a "Vite-native" testing framework. I actually don't have a huge amount of experience with unit tests as so much of my work is educational, demo based, and such, that tests aren't really required. That being said, I've written them, I'm familiar with Jest (which vitest is compatible with), so it seemed like an easy win.

I did a quick `npm i -D vitest` and added this to my `package.json` scripts block: `"test": "vitest"`

This let me run `npm run test` in my terminal and get immediate feedback on what I was writing. 

## Roll the dice...

About five years ago, I thought it would be fun, and surely pretty simple, to build an RPG in Vue.js (here's the first entry: ["Testing Vue.js Application Files That Aren't Components"](https://www.raymondcamden.com/2020/07/17/testing-vuejs-application-files-that-arent-components). I never finished that project, but I don't care - it was fun to work on. 

As part of that project, I built a simple "dice" utility that supported typical D&D dice rolls of the form: xDy. This translates to roll a Y-sided dice X times. It can get fancy too, so `2d6+2` means roll a six sided die two times and then add two tp the final result. (You could imagine a scenario where a player is attempting to do something they are talented at, so the `+2` represents a bonus to their chance to do the thing.)

The code for that looked like so:

```js
export const dice = {

	roll(style) {
		let bonus=0, total=0;
		if(style.indexOf('+') > -1) {
			[style, bonus] = style.split('+');
		} 
		
		let [rolls, sided] = style.split('d');
		
		//console.log(rolls, sided);
		for(let i=0;i<rolls;i++) {
			total += getRandomIntInclusive(1, sided);
		}
		total += parseInt(bonus);
		return total;
	}
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}
```

I thought a good first test would be to attempt to rewrite this in a TypeScript file. I actually broke it out into two files, one for the roll action and a 'util' one for the random number selection. 

I'll share the utility function first as it was the simplest change:

```js
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
```

This was really simple - just adding types to my arguments and result. I also removed `inclusive` from the name as I never see myself needing a non-inclusive random number selection. 

The test for this was pretty simple too:

```js
import { describe, it, expect } from 'vitest'
import { getRandomInt } from './utils'

describe('getRandomInt', () => {
  it('returns a number between min and max', () => {
    const min = 1;
    const max = 2;
    const randomInt = getRandomInt(min, max);
    expect(randomInt).toBeGreaterThanOrEqual(min);
    expect(randomInt).toBeLessThanOrEqual(max);
  })

  it('returns an integer', () => {
    const randomInt = getRandomInt(1, 10);
    expect(Number.isInteger(randomInt)).toBe(true);
  })
});
```

I discovered *after* writing this that you can actually screw with `Math.random()` which is cool af as the kids say, so I may return to this. But now let's turn to the dice stuff which got REALLY complicated, but in a fun way. 

My first version went a bit like this:

```js
import { getRandomInt } from './utils.ts';

export const dice = {

	/*
	xdy

	x rolls of a y sided dice

	xdy+n
	xdy

	x rolls of a y side dice + n
	*/
	roll(styleInput: string): number {
		let bonus:number=0, total:number=0;
        let bonusStr:string='';
        let style = '';

        if(styleInput.indexOf('+') > -1) {
			[style, bonusStr] = styleInput.split('+');
			bonus = Number(bonusStr);
		} else style = styleInput;
		
		const [rollsStr, sidedStr] = style.split('d');
		const rolls = Number(rollsStr);
		const sided = Number(sidedStr);

		//console.log(rolls, sided);
		for(let i=0;i<rolls;i++) {
			total += getRandomInt(1, sided);
		}

		total += Number(bonus);
		return total;
	}
}
```

And you'll notice it's a bit longer than the original version, and I don't mean more characters, I expected that, but some things took me a bit by surprise. Take this (original) line:

```js
let [rolls, sided] = style.split('d');
```

My original code just coerced `rolls` into a number, which is bad, but I tried this and it didn't work:

```js
let [rolls:number, sided: number] = style.split('d');
```

Which is obvious - the result of the string split function is strings. What didn't occur to me at the time was to chain to `map`:

```js
let [rolls, sided] = s.split('d').map(Number);
```

Live and learn, right? I built some basic tests for that and was curious what else I could do. I turned to my AI agent (Claude in this case) and just asked what other 'dice format' options were available, and was pleasantly surprised to discover quite a few. In particular I thought these made sense:

* Keep highest, lowest, using KH or KL. So for example, `3D6KH1` means roll a six sided die three times, keep the highest one. 
* Given a dice string input, what's the lowest value, and what's the highest value?

At this point, I decided to let AI help me write a bit of the code and handle updating the library to be a bit more flexible. The final result supports all of the above:

```js
import { getRandomInt } from './utils.ts';

const VALID_ROLL_REGEX =
    /^(\d*)d(\d+)(?:(kh|kl|dh|dl)(\d+))?([+-]\d+)?$/i;

function validRoll(style: string): boolean {
    return VALID_ROLL_REGEX.test(style);
}

function parseRoll(styleInput: string) {
    if (!validRoll(styleInput)) {
        throw new Error(`Invalid dice roll style: ${styleInput}`);
    }

    const match = styleInput.match(VALID_ROLL_REGEX)!;

    return {
        rolls: match[1] ? Number(match[1]) : 1,
        sided: Number(match[2]),
        keepMode: match[3]?.toLowerCase(),
        keepCount: match[4] ? Number(match[4]) : 0,
        bonus: match[5] ? Number(match[5]) : 0,
    };
}

function applyKeepDrop(
    dice: number[],
    keepMode: string | undefined,
    keepCount: number,
): number[] {
    if (!keepMode || keepCount === 0) {
        return dice;
    }

    dice.sort((a, b) => a - b);

    switch (keepMode) {
        case 'kh':
            return dice.slice(-keepCount);
        case 'kl':
            return dice.slice(0, keepCount);
        case 'dh':
            return dice.slice(0, -keepCount);
        case 'dl':
            return dice.slice(keepCount);
        default:
            return dice;
    }
}

export function roll(styleInput: string): number {
    const { rolls, sided, keepMode, keepCount, bonus } =
        parseRoll(styleInput);

    const dice: number[] = [];

    for (let i = 0; i < rolls; i++) {
        dice.push(getRandomInt(1, sided));
    }

    const total = applyKeepDrop(dice, keepMode, keepCount)
        .reduce((sum, die) => sum + die, 0);

    return total + bonus;
}

export function rollWithAdvantage(styleInput: string): number {
    return Math.max(roll(styleInput), roll(styleInput));
}

export function rollWithDisadvantage(styleInput: string): number {
    return Math.min(roll(styleInput), roll(styleInput));
}

export function minRoll(styleInput: string): number {
    const { rolls, keepMode, keepCount, bonus } = parseRoll(styleInput);
    const dice = Array(rolls).fill(1);

    return applyKeepDrop(dice, keepMode, keepCount)
        .reduce((sum, die) => sum + die, 0) + bonus;
}

export function maxRoll(styleInput: string): number {
    const { rolls, sided, keepMode, keepCount, bonus } =
        parseRoll(styleInput);
    const dice = Array(rolls).fill(sided);

    return applyKeepDrop(dice, keepMode, keepCount)
        .reduce((sum, die) => sum + die, 0) + bonus;
}
```

I won't share the entire test file (don't worry, I'll link to the repo in a bit), but as I mentioned above, you can actually "hack" random and that's really freaking sweet. For example, here is a test for rolls where you drop the lowest value:

```js
it('handles drop lowest', () => {
    const spy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)  // first roll → low
        .mockReturnValueOnce(0.9);  // second roll → high

    const result = roll('2d6dl1');
    expect(result).toBe(6);

    spy.mockRestore();
});
```

Looking at it just now I see the second mock isn't needed - I'll fix that (eventually, honest) - but you get the idea. 

## The bits, and nothing but the bits...

So this isn't a "real" project, but I loved getting my feet wet in TypeScript and - tbh - just writing some darn code. The repo is here: https://github.com/cfjedimaster/typescript-stuff/tree/main/vite-one

I've already got an idea for a next project, one that will actually have a web presence, so I'll share that when I get the time.

And this is where you come in. I'd be willing to bet 99% of you are writing TypeScript daily and have plenty of comments - so let me know. Just be gentle. Please. 