---
layout: post
title: "Adventures in Vibe Coding - Really, Really Big Numbers"
date: "2025-05-08T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_vibe_coding.jpg
permalink: /2025/05/08/adventures-in-vibe-coding-really-really-big-numbers
description: Using AI to help me write a function for working with large numbers.
---

I continue to be *really* against the term 'vibe coding', but also continue to be fascinated by the idea of working with GenAI to help craft/enhance applications in an iterative, conversation-based manner. [Ashley Willis](https://ashley.dev/blog/) recently released an incredibly well done post on the topic, ["What Even Is Vibe Coding?"](https://ashley.dev/posts/what-even-is-vibe-coding/), where she goes into detail on her take on the term and what it means for the industry. I think it is an excellent post and I want to highlight one part that really resonated with me:

<blockquote>
It scaffolds layouts, creates routes, fills in placeholder content, basically roughs out the shape of the thing I described. I still review it, refactor it, test it, and shape it into something I’d actually ship. But that first pass? It saves me hours. And more importantly, it frees up mental space so I can focus on the interesting parts.
</blockquote>

This has been my impression as well and also syncs up with what I loved about both serverless and low-code solutions. Anything that helps get me to the 'fun' parts of a project is, usually, a tool worth having in my toolbelt. 

I thought I'd share an example of this I worked on yesterday. For a while now, I've played a few idle clicker games that have an interesting way to handle large numbers. For numbers in the trillions and lower, they will abbreviate to a shorthand form and use the letters K, M, B, and T to indicate the value. So for example, 301M represents some number that rounds to 301 million. As an aside, the web platform has this baked in already via Intl, you can read about that here: ["Using Intl for Short Number Formatting"](https://www.raymondcamden.com/2023/01/04/using-intl-for-short-number-formatting).

What's interesting is what these games do *over* a trillion (where Intl fails to go any higher). Immediately after 999T, they will switch to using "AA" for the indicator. Then BB, then CC, and so forth. After ZZ? AAA. And then BBB, etc. Usually they will replace KKK with KFC for obvious reasons. 

I like this a lot. It's easy to grok the scale and apparent that 100DD is less than 9AAA. In the past, I've taken a stab at coding such a solution, but I never could get it working quite right. My brain could see the logic... a bit... but I failed to ever actually implement it. So, why not ask for help? In my case, I turned to [Google Gemini](https://gemini.google.com/).

## Round One

I began with what I thought was a pretty comprehensive prompt. I'd discover soon that I was missing a few things, but here's how I started:

<blockquote>
I need to write a function that helps format incredibly large numbers in JavaScript. For values over one hundred thousand, it should start using K, for example: 321K. For values in billions and trillions, it should use B and T. When the numbers go over 999 trillion, it should use a new numbering scheme using letters starting with AA. From AA it goes to BB, then CC and so forth. After ZZ, it goes to three letters, AAA. There is an exception for three Ks ("KKK") which should be rendered as KFC instead to avoid negative connotations with the KKK.
</blockquote>

The output was rather interesting. It spit out a function and then a large number of testing statements. This is only a portion of the output:

```js
// Test cases
console.log("--- Standard Formatting ---");
console.log("500:", formatLargeNumber(500)); // 500
console.log("99999:", formatLargeNumber(99999)); // 99999
console.log("100000:", formatLargeNumber(100000)); // 100K
console.log("321000:", formatLargeNumber(321000)); // 321K
console.log("1234567:", formatLargeNumber(1234567)); // 1235K (due to rounding in formatValuePart if Math.round(1234.567*10)/10)
```

I took all the code, threw it up on CodePen, and immediately got an error. Now, I'll admit - I had not read every single line of code. I should have. Because in the large block of test statements was this gem (be sure to scroll to the right):

```js
console.log("Infinity:", formatLargeNumber(Infinity)); // InfinityAA, InfinityBB etc. depends on magnitude.
                                                    // Actually, `log10(Infinity)` is `Infinity`, so `k` becomes `Infinity`.
                                                    // `Math.floor(Infinity/26)` is `Infinity`, so `numLetters` is `Infinity`.
                                                    // `Infinity % 26` is `NaN`.
                                                    // So, Infinity will break it.
```

Yep, it broke it. I didn't notice that it then carried on with a *revised* edition of the function that handled it. It then output a *huge* amount of text to explain how it was built. I really dug this. 

## Round Two

I realized I had missed some details, so I responded with this:

<blockquote>
This is close. Let's adjust. I want, at most, 3 numbers in any result. So numbers over 1000 should use K as well, so 1.24K for 1240 for example. In general, all results should have, at most, 3 numbers in the result. We don't count the period or the letter.
</blockquote>

Once again, it worked up a revision with a lots of tests and once again, I realized I had missed something.

## Round Three

<blockquote>
Another adjustment is needed, the input will never be a floating point value, it will always be an integer, and always positive
</blockquote>

I felt guilty, but Gemini responded. It also 'told' me:

<blockquote>
Okay, that simplifies things by removing the need to handle negative numbers, non-integers, or NaNs at the input. The core logic for scaling and formatting the numeric part to "at most 3 digits" remains crucial.
</blockquote>

I really appreciate it noting that it was going to simplify. This time the code was perfect. Oh crap...

## Round Four

I noticed that it was not using "M" for millions. I had not mentioned that in my initial prompt so that's on me I suppose, but I responded with:

<blockquote>
oops, i do want to support millions. can you fix that?
</blockquote>

I haven't shared it yet in this post, but over each iteration, Gemini was doing a damn good job talking about the changes. Here's an example:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/rbn1.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Now comes the cool part. In it's final output, it screwed up the output a bit. I was testing via [AI Studio](https://aistudio.google.com) and I could see where it messed up the Markdown output response and code wasn't properly formatted. I *could* have copied and pasted a few times but decided to push my luck:

<blockquote>
your output in the last response was broken, can you output just the code again please
</blockquote>

Gemini had no problem with that and output just what I wanted. Here's the final result

```js
function formatLargeNumber(num) {
    // Assuming num is always a positive integer as per prior constraints.
    // If num could be 0, one might add: if (num === 0) return "0";

    const formatValuePart = (val) => {
        // val is the scaled value (e.g., num / 1000), which can be a float.
        // This function formats val to a string with at most 3 digits,
        // like "123", "12.3", "1.23". It also handles rounding and capping.

        // Cap values that would round to 1000 or more for this tier's unit at 999.
        if (val >= 999.5) return "999";

        // Format as XXX (e.g., 100 to 999)
        if (val >= 99.95) { // Rounds to 100 or more
            return Math.round(val).toString();
        }

        // Format as XX.X (e.g., 10.0 to 99.9)
        if (val >= 9.995) { // Rounds to 10.0 or more
            const roundedOneDecimal = Math.round(val * 10) / 10;
            const s = roundedOneDecimal.toFixed(1);
            return s.endsWith(".0") ? s.slice(0, -2) : s; // "10.0" -> "10"
        }

        // Format as X.XX (e.g., 0.01 to 9.99), or X, or XX
        // Handles cases like 0.001 -> "0.01"
        if (val < 0.005 && val > 0) return "0.01"; // Smallest display for non-zero scaled values

        const roundedTwoDecimal = Math.round(val * 100) / 100;
        // If it rounded to 0.00 but was originally positive (e.g. 0.0049)
        if (roundedTwoDecimal === 0 && val > 0) return "0.01";

        const s = roundedTwoDecimal.toFixed(2);
        if (s.endsWith(".00")) return s.slice(0, -3); // "1.00" -> "1"
        if (s.endsWith("0")) return s.slice(0, -1);   // "1.10" -> "1.1"
        return s;
    };

    // AA+ System (numbers >= 1 Quadrillion, or 1000 Trillion)
    if (num >= 1e15) {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        // Calculate 'k': 0-indexed step for letter sequence (AA k=0, BB k=1, ..., AZ k=25, BA k=26 ...)
        // Each step 'k' corresponds to a 1000x increase in magnitude from 1e15.
        let k = Math.floor(Math.log10(num / 1e15) / 3);
        if (k < 0) k = 0; // Safety for numbers very close to 1e15 that might dip due to precision

        let divisor = Math.pow(10, 15 + k * 3);
        let scaledValue = num / divisor;

        // If scaledValue would round to 1000 or more, it means we should use the next 'k' (next suffix)
        // This keeps the numeric part smaller, e.g., 999.7AA becomes 1.00BB (approx)
        if (Math.round(scaledValue) >= 1000 && k < (26 * 4 - 1) /* Practical limit on k, e.g., ZZZZ */) {
            k++;
            divisor = Math.pow(10, 15 + k * 3);
            scaledValue = num / divisor;
        }

        const numLetters = 2 + Math.floor(k / 26); // AA (k=0-25), AAA (k=26-51), etc.
        const letterIndex = k % 26;
        const charToRepeat = alphabet[letterIndex];
        let suffix = charToRepeat.repeat(numLetters);

        if (suffix === "KKK") {
            suffix = "KFC";
        }
        return formatValuePart(scaledValue) + suffix;
    }

    // Trillions (1T to 999.99...T, displayed up to 999T)
    if (num >= 1e12) {
        const scaledValue = num / 1e12;
        // If scaledValue >= 999.5, formatValuePart will cap it at "999". E.g., 999.7T becomes "999T".
        return formatValuePart(scaledValue) + 'T';
    }

    // Billions (1B to 999.99...B, displayed up to 999B)
    if (num >= 1e9) {
        const scaledValue = num / 1e9;
        return formatValuePart(scaledValue) + 'B';
    }

    // Millions (1M to 999.99...M, displayed up to 999M)
    if (num >= 1e6) { // Added Million tier
        const scaledValue = num / 1e6;
        return formatValuePart(scaledValue) + 'M';
    }

    // Thousands (1K to 999.99...K, displayed up to 999K)
    // As per "numbers over 1000 should use K"
    if (num >= 1e3) {
        const scaledValue = num / 1e3;
        return formatValuePart(scaledValue) + 'K';
    }

    // Base case: numbers less than 1000 (1 to 999)
    // num is a positive integer here. formatValuePart handles it.
    return formatValuePart(num);
}

// Test cases (assuming positive integer inputs)
console.log("--- With Millions (M) Support ---");
console.log("Input: 5, Expected: 5, Actual:", formatLargeNumber(5));
console.log("Input: 123, Expected: 123, Actual:", formatLargeNumber(123));
console.log("Input: 999, Expected: 999, Actual:", formatLargeNumber(999));

console.log("\nK Suffix:");
console.log("Input: 1000, Expected: 1K, Actual:", formatLargeNumber(1000));
console.log("Input: 1240, Expected: 1.24K, Actual:", formatLargeNumber(1240));
console.log("Input: 12300, Expected: 12.3K, Actual:", formatLargeNumber(12300));
console.log("Input: 123400, Expected: 123K, Actual:", formatLargeNumber(123400));
console.log("Input: 999000, Expected: 999K, Actual:", formatLargeNumber(999000));
console.log("Input: 999499, Expected: 999K, Actual:", formatLargeNumber(999499));
console.log("Input: 999500, Expected: 999K, Actual:", formatLargeNumber(999500)); // Still 999K as it's < 1M

console.log("\nM Suffix:");
console.log("Input: 1000000, Expected: 1M, Actual:", formatLargeNumber(1000000));
console.log("Input: 1230000, Expected: 1.23M, Actual:", formatLargeNumber(1230000));
console.log("Input: 1234567, Expected: 1.23M, Actual:", formatLargeNumber(1234567)); // 1234567 / 1e6 = 1.234567. formatValuePart(1.234567) rounds to "1.23"
console.log("Input: 999000000, Expected: 999M, Actual:", formatLargeNumber(999000000));
console.log("Input: 999499999, Expected: 999M, Actual:", formatLargeNumber(999499999)); // 999.499999M -> 999M
console.log("Input: 999500000, Expected: 999M, Actual:", formatLargeNumber(999500000)); // 999.5M -> 999M (capped by formatValuePart)

console.log("\nB Suffix:");
console.log("Input: 1000000000, Expected: 1B, Actual:", formatLargeNumber(1000000000));
console.log("Input: 1230000000, Expected: 1.23B, Actual:", formatLargeNumber(1230000000));
console.log("Input: 999000000000, Expected: 999B, Actual:", formatLargeNumber(999000000000));
console.log("Input: 999500000000, Expected: 999B, Actual:", formatLargeNumber(999500000000));

console.log("\nT Suffix:");
console.log("Input: 1000000000000, Expected: 1T, Actual:", formatLargeNumber(1000000000000));
console.log("Input: 567000000000000, Expected: 567T, Actual:", formatLargeNumber(567000000000000));
console.log("Input: 999999999999999, Expected: 999T, Actual:", formatLargeNumber(999999999999999));

console.log("\nAA+ System:");
console.log("Input: 1e15, Expected: 1AA, Actual:", formatLargeNumber(1e15));
console.log("Input: 1.23e15, Expected: 1.23AA, Actual:", formatLargeNumber(1.23e15));
console.log("Input: 9.994e17, Expected: 999AA, Actual:", formatLargeNumber(9.994e17)); // 999.4 AA
console.log("Input: 9.995e17, Expected: 1BB, Actual:", formatLargeNumber(9.995e17));   // 999.5 AA -> promotes to 1BB
console.log("Input: 1e18, Expected: 1BB, Actual:", formatLargeNumber(1e18));
// Using BigInt for constructing very large test numbers to avoid precision loss before calling the function
// Note: The formatLargeNumber function itself still takes a standard Number.
// For numbers > Number.MAX_SAFE_INTEGER (approx 9e15), precision is lost when converting BigInt to Number.
// However, for demonstrating the logic with these huge magnitudes, this is illustrative.
console.log("Input: 1e90 (BigInt to Number), Expected: 1ZZ, Actual:", formatLargeNumber(Number(BigInt("1") * BigInt("10")**BigInt("90"))));
console.log("Input: 1e93 (BigInt to Number), Expected: 1AAA, Actual:", formatLargeNumber(Number(BigInt("1") * BigInt("10")**BigInt("93"))));
console.log("Input: 1e123 (BigInt to Number), Expected: 1KFC, Actual:", formatLargeNumber(Number(BigInt("1") * BigInt("10")**BigInt("123"))));
console.log("Input: 2.5e123 (BigInt to Number), Expected: 2.5KFC, Actual:", formatLargeNumber(Number(BigInt("25") * BigInt("10")**BigInt("122"))));
```

I have this running in a CodePen, but as it uses `console.log`, you will need to view the 'live' version of it and open dev tools: <https://codepen.io/cfjedimaster/live/OPPwNKo>

Or... maybe not. I responded to Gemini with:

<blockquote>
one last request - change the console.log messages to use a function called logIt. logIt will append values to a DOM element with the id log. I'll handle adding a div tag with that ID to my html
</blockquote>

Here's the function it created:

```js
function logIt(...args) {
    const logElement = document.getElementById('log');
    if (logElement) {
        const message = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.stringify(arg); // Basic object stringification
                } catch (e) {
                    return arg.toString();
                }
            }
            return String(arg);
        }).join(' ');

        const entry = document.createElement('div'); // Or 'p' or 'pre'
        entry.textContent = message;
        logElement.appendChild(entry);
    } else {
        // Fallback to console.log if the 'log' element isn't found
        console.log(...args);
        if (args.length > 0 && typeof args[0] === 'string' && args[0].startsWith("---")) {
            console.warn("Warning: DOM element with id='log' not found. Falling back to console.log.");
        }
    }
}
```

There's a few things interesting here. First off, I'd never both with error handling in my own code for something so simple. Yes, I should, but if I'm just doing a quick demo, I would have been lazy. I also like how it handles complex values like `console.log` does. Again, I would have been too lazy for that. It even shared this bit:

```js
// To make sure the logIt function works when the script is run:
// You would typically put your script tag at the end of the <body>
// or wrap the test calls in a DOMContentLoaded event listener:
/*
document.addEventListener('DOMContentLoaded', () => {
    // ... all the logIt calls here ...
});
*/
```

That's absolutely right - but I can skip worrying about that in CodePen. I then decided to YOLO and ask:

<blockquote>
i want to make my div block for log messages have a retro terminal look. it should take up 100% of the view port, use a monochrome look, have a font appropriate for old computers. can you give me *just* the css for that?
</blockquote>

It worked brilliantly and even offered a blinking cursor effect that I skipped. You can now see this below:

<p class="codepen" data-height="600" data-theme-id="dark" data-default-tab="result" data-slug-hash="yyyxbVE" data-pen-title="Big Ass Number Formatting" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/yyyxbVE">
  Big Ass Number Formatting</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

p.s. So I did one more vibe coding experiment I really don't see the need to blog about it but I'll link it just in case you're curious: [Shall We Play a Game?](https://cfjedimaster.github.io/ai-testingzone/wopr/ww3.html)