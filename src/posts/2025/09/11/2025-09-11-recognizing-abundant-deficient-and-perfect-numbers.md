---
layout: post
title: "Recognizing Abundant, Deficient, and Perfect Numbers"
date: "2025-09-11T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_and_kittens.jpg
permalink: /2025/09/11/recognizing-abundant-deficient-and-perfect-numbers
description: Determining if a number if abundant, deficient, or perfect.
---

Ok, this post falls into the "I'll never actually use this again" category, which frankly, my normal readers know happens all the time, but it was a fun little diversion and a reminder of why I used to love math so much. 

Yesterday I found out that one of my kids' homework was to look at a set of numbers and determine if they were abundant, deficient, or perfect. Right now you are probably (at least I know I was) asking, "what in the actual heck is that???"

A quick bit of Googling turned up this [explainer](https://www.encyclopedia.com/education/news-wires-white-papers-and-books/numbers-abundant-deficient-perfect-and-amicable) that basically boils it down to a simple principal.

Given a number, find all the divisors of that number, excluding the number itself, and add them up. If the result is less than the original number, it is deficient. If the number is equal, it's perfect. Finally, if the sum is over the input, it's abundant. 

So for example, 6 is considered perfect because the divisors, 1+2+3, equal 6 when added together. 5, which only has a divisor of 1 (remember, you exclude the number itself) is deficient. 12 is abundant (1+2+3+4+6 == 16).

You can read more, and see more variations, on the [Encyclopedia.com](https://www.encyclopedia.com/education/news-wires-white-papers-and-books/numbers-abundant-deficient-perfect-and-amicable) article if you would like. Honestly, I see absolutely see use for this, but I thought - why not whip up a quick demo of this in [BoxLang](https://boxlang.io)

# Version One

The first version I built uses one main method to get divisors, minus the input itself, with a special case for 1:

```js
function getDivisors(n) {
    local.divisors = [];
	if(n === 1) return divisors;
    for (local.i = 1; i <= ceiling(abs(n)/2); i++) {
      if (n % i == 0) {
        divisors.push(i);
      }
    }
    return divisors;
}
```

The result of this is an array of divisors. I then built one function each for the three types of numbers:

```js
function isPerfectNumber(required int x) {
	local.divisors = getDivisors(x);
	local.sum = divisors.reduce((prev, cur) => return cur + prev, 0);
	return sum == x;
}

function isAbundantNumber(required int x) {
	local.divisors = getDivisors(x);
	local.sum = divisors.reduce((prev, cur) => return cur + prev, 0);
	return sum > x;
}

function isDeficientNumber(required int x) {
	local.divisors = getDivisors(x);
	local.sum = divisors.reduce((prev, cur) => return cur + prev, 0);
	return sum < x;
}
```

Fairly simple, right? I whipped up a quick test:

```js
for(i=1;i<30;i++) {
	println("is #i# a perfect number? #isPerfectNumber(i)#");
	println("is #i# an abundant number? #isAbundantNumber(i)#");
	println("is #i# a deficient number? #isDeficientNumber(i)#");
	println("");
}
```

And you can try this yourself below.

<iframe
        allow="fullscreen" 
        width="100%"
        height="700" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJzNUs9rgzAUPutf8dEyiHR0uh1tOgY9j93HDhqT7oGNLpoiDP%2F3RautKLs3h0Dee9%2BP9%2FKU1aKmQuMo6wOdqSpMxXSAXx%2Fu5IVI8m02xMHx%2BRX7HimmwTlHFMDI2hqNsSTuYaowYBcsOVAUg7DjEJJy0keWpJ3E03Pg4pvNqAWQgiN%2BcMWOO7zFcaXflrb6ZhTEQ6b1b%2FfCSev7auyOqg9plBT1uz2l0jAjfywZmYF0jaaT8ha9TifSOMmhorInl7w6ciRWSMZKI8%2BPENYE4PvRjHtig0sq7CiGeM%2FB0cxNvqVWZ4m%2BI5f7pcmDVCRI3pPL3eiyMIx4FNPuJYyH3fJK44zlmq2owprWSFBedgG6b%2BDVRWfrQcF61UksoBrJ8EVT8Ozb%2FkUjG0c3Rc%2FnuYB3r%2FYPrSIstA%3D%3D">
    </iframe>

Finally, given that a number must be one of three types, it's probably easier to just have one function:

```js
function getNumberType(required int x) {
	local.divisors = getDivisors(x);
	local.sum = divisors.reduce((prev, cur) => return cur + prev, 0);
	if(sum < x) return 'deficient';
	if(sum === x) return 'perfect';
	return 'abundant';
}
```

You can try this below:


<iframe
        allow="fullscreen" 
        width="100%"
        height="700" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJxlUD1vgzAQneFXPAlV2EqVQjuCO3Xu1K3qQMw5OYkYanCUqsp%2Fr0kgoQqDJe7eu%2FdhvNUDtxZbGt74wH3remElfmOEr2l11azraQ6Fz68ijtgIC6UUcglHg3cWM6Q400zrIC5cDqS8AKNU0MQN262oNqPE07MM89Vq1gLYIBx%2BCOBwO7vNcT2%2F7ny%2FEyyLaXOKb%2B%2Bdk1Mcm0W6d7%2FfkPv46Ug4%2BvbsqAbbAcdRKLpLuuzjGAQnRO%2F3YXn1E454TUJ0jg6P0N5JqNfZSvjFCpdVJi%2FFjfxy1JwwaU2GNZMd0htg7HYB6cgZ0mfAPKo23tbVmTTGbJ1glRdcvmTFVGnUuZCusSJNOAH3SP53wDJJg6fTH6VCnXw%3D">
    </iframe>

Image from the National Gallery of Art, [Cats and Kittens](https://www.nga.gov/artworks/45859-cat-and-kittens), by an unknown artist.
