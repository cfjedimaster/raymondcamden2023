---
layout: post
title: "Sorting Out Your Monarchs with BoxLang"
date: "2025-06-17T18:00:00"
categories: ["development"]
tags: ["boxlang","javascript"]
banner_image: /images/banners/queen_cat.jpg
permalink: /2025/06/17/sorting-out-your-monarchs-with-boxlang
description: Sorting by roman numerals in BoxLang
---

I know what you're thinking right now - a monarch problem? How did Raymond *know* I had a monarch problem? What can I say, with great age comes great wisdom, or, more likely, random code challenges. I've mentioned ["rendezvous with cassidoo"](https://cassidoo.co/newsletter/?utm_source=cassidoo&utm_medium=email&utm_campaign=to-be-afraid-is-to-behave-as-if-the-truth-were) before as one of the newsletters I subscribe to. Authored by the very interesting Cassidy Williams, this short and sweet newsletter always has interesting content and always ends with a basic code challenge, what she calls her 'interview question of the week'. This weeks question was pretty fun:

{% callout %}
Given an array of strings representing the names of monarchs and their ordinal numbers, write a function that returns the list of names sorted first by name and then by their ordinal value (in Roman numerals), in ascending order.
{% endcallout %}

Here's two examples:

```bash
> sortMonarchs(["Louis IX", "Louis VIII", "Philip II", "Philip I"])
> ["Louis VIII", "Louis IX", "Philip I", "Philip II"]

> sortMonarchs(["George VI", "George V", "Elizabeth II", "Edward VIII"])
> ["Edward VIII", "Elizabeth II", "George V", "George VI"]
```

I decided to take a stab at this with [BoxLang](https://boxlang.io) and in doing so, ran into some interesting tidbits I thought I'd share. First, let's handle the Roman problem.

## Those Pesky Romans

Quick trivia question for you. What is the only number you can't represent in Roman numerals?

Zero.

Ok, that being said, my first task was to build a generic "roman numeral to integer" conversion method, and for that, I <strike>totally cheated</strike>went to AI for a bit of help. I knew I was going to be writing in script, and with BoxLang still being kinda new, simply asked for a JavaScript solution:

"write javascript code to convert roman numerals to integers"

I used Google Gemini for this, and one of the things I like about their code solutions is that they almost always provide test calls with expected solutions. Here is their solution. (The original solution made use of `console.log`, so to make it easier for you, dear reader, I made it output to the DOM.)

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="myJjgpw" data-pen-title="Roman to Int" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/myJjgpw">
  Roman to Int</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

The solution seems sensible enough, although I would not have bothered making a variable for the uppercase version of the input. I'd just have done: `s = s.toUpperCase()`. Outside of that, the logic makes sense to me. 

Ok, so now to convert this to BoxLang. I'll share the complete rewrite below, but let me share the interesting bits first.

* Arrays in BoxLang start with 1, not 0. 
* An interesting part of the JS code is that `nextVal` will, one time, reference an index past the end of the length of the string, which is null, *and* check against `romanMap`, which is basically asking the map for a null key. JavaScript handled that, still returning null, but I had to break that apart a bit in BoxLang. 
* BoxLang automatically scopes variables defined in a method to the method itself, so I was able to get rid of `let` and `const`. 
* In the original code, you can see where Gemini mentioned you could throw an error on invalid input instead of NaN. I did that in BoxLang.

And that's basically it. I also changed the console logs to `println` statements instead. You can test this out here:

<iframe
        allow="fullscreen" 
        width="100%"
        height="600" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJytVW1v2jAQ%2Frz8ilsrlaQ0oayttsLo1rFKQyqatHYIqeqHNDnAarAz26FUFf99ZycBAmirtPEpd757nudebBqHhw4cQlfwGUqtIIQfYhpy4NkUZZiA0pLxMWgB5GRc4xhlQBkm6XMaynAKL3nMAhTcTnBnfmDDJepMcgUvdPiAcmHDC0zAXxmbhQlyDWIEehPIIDScUcYjzQQHac5uRY9rV3nw4jiQu%2FphCh2ygX61Xq0FzaP8e0DfZ8X30PiPC%2BPaHJRG156U1ld7VFr9%2FOyYrEXbEGqhqcAOHLfJyNIUZTdUeEMeFWjxs3S4no1uNOBdAD1NxWik%2BqTIxhNbZ9HiERUACY60abZk44mmmmEkJLiMMJttYPCxs0YUULMIHFi9XrQAgI3ct2Ujgkd8vpozpZW7Srpj955XNAisjCd3r8ep8yzeGF00ofFGJLgF%2BxWA%2FT2vbQEWgIlCQ0rStpTBwQH8TUy9%2Bc9yCGIlKO9ClElJizSw4ykV3FVquM8TOM6LsEoFqqjg0%2B5soryHFilLknbZd3BLrIs1%2FlVtNP%2Bb7EGbEuzUixigUjPMh2%2FcdqmCsh92w%2FzOGmCl8WvY3ylZPjGFR8B0TZnbGsYx02xGVKQ6gMs43iauMtV3MDlFV%2FPLmwe2HXIRqe%2F7cDUPp2mCyhjW%2BSVULLKcyklps3XCaaS9HvgXsL92b2vkq3lmdLCs4mqeIo04BpHpNNMtOFlBXA92gVjvEmYXxNkHcK87dMVh0Dk7AgrvnHhWaTmPskfregfbcgcVtbvJTtcghtsQw1dAnFtt%2FW5%2F2KXagJk3ORIi8RMhHs1Dkb%2BewYppGbvJVx4UrLvYmufn7y2hWW2fcYVcma1h%2BhkwH%2B2KaBpN5xGbbfEU%2Fj%2FTnDqWp7zcy%2Btc0ihHy2da6TdLuuHwcovqsiBxFjQyHU1c9Co530IeJ0SM8whT81dBrwUGU1QqHKN9J2h1X0NEvv9B9RsaFTr%2F">
    </iframe>

Cool. The Roman problem is solved! Now to sorting.

## Putting On Our Sorting Hat

Sorting now comes down to a simple callback function provided to the built-in sort method. Here's how I did it:

```js
function sortMonarchs(arr) {
  return arr.sort((a, b) => {
    if(a === b) return 0;
    // split into names if necessary
    parts = a.listToArray(" "); 
    alpha.roman = romanToInt(parts.last());
    alpha.name = parts.slice(1, parts.len())[1];
    parts = b.listToArray(" "); 
    beta.roman = romanToInt(parts.last());
    beta.name = parts.slice(1, parts.len())[1];

    if(alpha.name < beta.name) return -1;
    if(alpha.name > beta.name) return 1;
    if(alpha.name === beta.name) {
      return alpha.roman - beta.roman;
    }
    return 1;
  });
}
```

As per the requirements, I sort by name first, then the value of the roman numeral. I tested like so:

```js
println( sortMonarchs(["Louis IX", "Louis VIII", "Philip II", "Philip I"]));
// should be:  ["Louis VIII", "Louis IX", "Philip I", "Philip II"]

println(sortMonarchs(["George VI", "George V", "Elizabeth II", "Edward VIII"]));
// should be: ["Edward VIII", "Elizabeth II", "George V", "George VI"]
```

You can see the output below:

<iframe
        allow="fullscreen" 
        width="100%"
        height="600" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJylVF1P2zAUfe%2BvuCsSJLSk7aS9NIQNMTRFAm0aDCFVfXAbt7GW2pnt8DHU%2F75rx2mSkmlIy5Pv9bnn3K94dHzcg2O4EPyBSq2AwHexIRx4saGSZKC0ZHwNWgA6Gdd0TWWAESboU04k2cBLidmCgtuUdsYHFi6pLiRX8IKXCyq3Fu44gf4q2APJKNcgVqD3iQzDqLcq%2BFIzwUGau1sRc%2B0pH156PShd1ySHCG3A7yg%2BmsJkWJ7v8PzBne%2BNf%2ByMK3NRGRf2prI%2B26vKui7vxmhtQyOohcYCIxiHaBR5TuUFUfQGPSrQ4kfl8HyLHo3gfQCxxmI0xfqkKNaprdO1eIUFQEZX2jRbsnWqsWZYCQkeQ85JCAxOo4ZQgM1CcmCDgWsBAFt576pGBD%2Fp8%2BUTU1p5ddCMzX3fNQhsGo9eP%2BbYeZbsjW6Z4niXmPAUDloEB30%2FtARboJmiRhRTe5UZHB7Cv5IZTP47HaSoEyq7sCykxEW6s%2BOpMpi1apiXAZw%2BOVirAuUq%2BNgdjZJzmGJmWRZWfQev4jpr6Ne14fxvioU2JdipOwxgqQUth2%2FcdqmCqh92w06iBmGr8Q3urxgsH5miQ2D6SJm%2FlSQJ0%2BwBpTDrAM6T5LVwW2nQodRzXS1%2F3hIY9tC1%2BxeVkPpacCKXqfKIlGXNDo92YACeR4aw8CE6c1nj0hCIosg4HXZcSmI1Ks%2BYNk%2BDAE42VJn%2BcrqkShH5bEH49OBrFQEJMlyqW3EuJXn2%2BoCbABZAsjwlgR1ftQTle2Ejg4wo7flubUqsUUJoea8ytqTeZOhMuw7%2BbOLWplJf%2FE19QfVbxS30jdq7ztUJn9YEu0aeTMIO5FkHshNop1JDqy2rJtpo7Emj0HpfoMW%2B9e265PjI6Yx77XWZ9a9EwRTE9%2F0huPNdHMfG%2BpayjOXQNvpz0zezIqkosgT1pwCzvcgm5y6wxTivE9rL5wsVck2RygRUhjlfZuw3wXJTl9Fl8khkUmp2JDVrATrim9y16Lz3B%2BOqTIw%3D">
    </iframe>

Let me know what you think. Most likely, the code I wrote could be written any "tighter" and if you do end up rewriting it, share a link below!