---
layout: post
title: "Looking at the JavaScript Promise Collection Methods"
date: "2024-02-12T18:00:00"
categories: ["javascript"]
tags: []
banner_image: /images/banners/two_cats_promise1.jpg
permalink: /2024/02/12/looking-at-the-javascript-promise-collection-methods
description: A look at Promise methods that work on an array of inputs.
---

Let me begin by saying that "Promise Collection Methods" is not something I've seen mentioned elsewhere, but is my own way of referring to the various methods of the [Promise API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that work with multiple promises. They are:

* Promise.all
* Promise.allSettled
* Promise.any 
* Promise.race

I've used `Promise.all` many times in the past, and I was *aware* of the other methods but had not taken the time to actually build a demo of them. This weekend I changed that. After spending a few hours in Sanctuary grinding my Necro character, I put down the controller and picked up the laptop. Here's what I built. As a note, everything shown here works in modern browsers, but you can check MDN for more information on compatibility if you need. 

## The Helper Functions

Before getting into the important code, I built some methods to help me test things out, help me display stuff, and so forth. First, I knew I was going to build this on CodePen (I'll be embedding it below) and I wanted something would visually display in the browser, so I added this HTML:

```html
<div id="log"><pre></pre></div>
```

And wrote this little utility:

```js
const log = s => { document.querySelector('#log pre').innerHTML += s + '\n'  };
```

This lets me then use `log("like, whatever")` in my code and have it rendered out to the browser instead of the developer console.

Next, a function to handle returning promises with different times and optionally in an error state:

```js
const makePromise = (name, secs, fail=false) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if(!fail) { log(`Good result for ${name}`); resolve(`Resolve from ${name}`); }
			else { log(`Bad result for ${name}`); reject(`Fail from ${name}`); }
		}, secs * 100);
	});
}
```

Here's a few examples of it in use:

```js
makePromise('Todd', 3);
makePromise('Scott', 1);
```

This will create two promises. One resolves in three seconds, the other in 1. Next:

```js
makePromise('Ray', 2, true);
```

This will reject as an error in two seconds.

Also, note that I use the `log` method here so I can see stuff resolving in real-time. This will become important later.

Finally, I wrote a simple delay function:

```js
const delay = x => { 
	return new Promise(resolve => setTimeout(resolve, x*1000));
}
```

This will let me stuff like:

```js
delay(4);
```

As a quick and hacky way to delay a few seconds. In theory, I could have made `makePromise` make use of it, but I didn't bother updating it. Alright, let's get started.

## Promise.all

The [`all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) method has the following behavior:

Given an array of Promises, resolve when all are done, or immediately when any throw an error. 

It resolves with an array of results that match the results of inputs. Here's my first test:

```js
log('TEST ONE - Promise.all(all good)');
let test = [
	makePromise('alpha', 3),
	makePromise('bob', 1),
	makePromise('charly', 3)
];

results = await Promise.all(test);	
log('Results from test with Promise.all');
log(JSON.stringify(results));
```

Looking at the code, you can see that `bob` will return before `alpha` and `charly`. Here's the output:

```
Good result for bob
Good result for alpha
Good result for charly
Results from test with Promise.all
["Resolve from alpha","Resolve from bob","Resolve from charly"]
```

Notice that even though the order was different than the input, the results match the input which is great. 

Now let's throw an error into the mix:

```js
log('\n\nTEST TWO  - Promise.all (one bad)');	
test = [
	makePromise('alpha', 3),
	makePromise('failwhale', 1, true),
	makePromise('charly', 3)
];

try {
	let results = await Promise.all(test);
} catch(e) {
	log(`Expected failure in test: ${e}`);
}
```

I wrapped the call in a `try/catch` to handle the rejection. Here's the output:

```
TEST TWO  - Promise.all (one bad)
Bad result for failwhale
Expected failure in test: Fail from failwhale
Good result for alpha
Good result for charly
```

Notice that my handler fires as soon as the error occurs, but the other promises are still running. You don't have to use `try/catch`. Since the result of `Promise.all` is itself a promise, you can use the `catch` method of Promise instead:

```
log('\n\nTEST TWO A - Promise.all (one bad), modified handler.');	
Promise.all(test).then(results => log('all good')).catch(e => log('one bad'));
```

This returns, as you would expect, just `one bad`. 

## Promise.allSettled

While `Promise.all` is good for when you're pretty sure everything is going to work out ok (and remember, a Fetch call to an API may run just fine, but the API itself may return with an error), you may find [`allSettled`] method a bit more flexible. It's behavior is:

Given an array of Promises, resolve when all are done and report on the success or failure of each Promise.

This means you can now rely on knowing when everything is done and handle the success or failure of each one by one. Here's an example:

```js
log('\n\nTEST THREE - Promise.allSettled (all good)');
test = [
	makePromise('alpha', 3),
	makePromise('bob', 1),
	makePromise('charly', 3)
];

results = await Promise.allSettled(test);	
log('Results from test with Promise.allSettled');
log(JSON.stringify(results,null,'\t'));
```

The result now is a bit different:

```json
[
	{
		"status": "fulfilled",
		"value": "Resolve from alpha"
	},
	{
		"status": "fulfilled",
		"value": "Resolve from bob"
	},
	{
		"status": "fulfilled",
		"value": "Resolve from charly"
	}
]
```

Now we get both the value from the `resolve` as well as a `status` flag. Here's an example with a failure. First the calls:

```js
log('\n\nTEST FOUR - Promise.allSettled (one bad)');
test = [
	makePromise('alpha', 3),
	makePromise('failwhale', 1, true),
	makePromise('charly', 3)
];

results = await Promise.allSettled(test);	
log('Results from test with Promise.allSettled');
log(JSON.stringify(results,null,'\t'));
```

And then the result:

```json
[
	{
		"status": "fulfilled",
		"value": "Resolve from alpha"
	},
	{
		"status": "rejected",
		"reason": "Fail from failwhale"
	},
	{
		"status": "fulfilled",
		"value": "Resolve from charly"
	}
]
```

You can see the failure in the second result. Woot. I think this is my favorite so far. Going on...

## Promise.any

The [`any`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any) method works like so:

Given an array of Promises, resolve when any of the Promises resolves, or reject if all of them fail.

This one's kind of interesting. It's basically the "try really hard for something to work" collection method. Here's a first example:

```js
log('\n\nTEST FIVE - Promise.any(all good)');
test = [
	makePromise('alpha', 3),
	makePromise('bob', 1),
	makePromise('charly', 3)
];

results = await Promise.any(test);	
log('Results from test with Promise.any');
log(results);
```

In this one, `bob` is the winner:

```
TEST FIVE - Promise.any(all good)
Good result for bob
Results from test with Promise.any
Resolve from bob
Good result for alpha
Good result for charly
```

Next, here's one with an error. It's the quickest, but `any` keeps trying:

```js
log('\n\nTEST SIX - Promise.any(one bad)');
test = [
	makePromise('alpha', 3),
	makePromise('bad bob', 1, true),
	makePromise('charly', 3)
];

results = await Promise.any(test);	
log('Results from test with Promise.any');
log(results);
```

And the output:

```
TEST SIX - Promise.any(one bad)
Bad result for bad bob
Good result for alpha
Results from test with Promise.any
Resolve from alpha
Good result for charly
```

Finally, here's one where they all fail.

```js
log('\n\nTEST SEVEN - Promise.any(all bad)');
test = [
	makePromise('alpha', 3, true),
	makePromise('bad bob', 1, true),
	makePromise('charly', 3, true)
];

try {
	let results = await Promise.any(test);
	log(results);
} catch(e) {
	log(`Expected failure in test: ${e}`);
	log(e.errors);
}
```

Notice I log `e.errors` - this is an additional value thrown by the method that contains an array of all the messages from the failed promises. (It's an [AggregateError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError)). 

Here's the output:

```
TEST SEVEN - Promise.any(all bad)
Bad result for bad bob
Bad result for alpha
Bad result for charly
Expected failure in test: AggregateError: All promises were rejected
Fail from alpha,Fail from bad bob,Fail from charly
```

## Promise.race

For the final method I'll cover, [`race`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race) has this behavior:

Given an array of promises, resolve or reject with whatever happens first.

Here are a few examples. First, all good:

```js
log('\n\nTEST RAY EIGHT - Promise.race(all good)');
test = [
	makePromise('alpha', 3),
	makePromise('bob', 1),
	makePromise('charly', 3)
];
results = await Promise.race(test);	
log('Results from test with Promise.race');
log(results);
```

And the output:

```
TEST RAY EIGHT - Promise.race(all good)
Good result for bob
Results from test with Promise.race
Resolve from bob
Good result for alpha
Good result for charly
```

And here's one with a 'bad' winner:

```js
log('\n\nTEST NINE - Promise.race(bad guy wins)');
test = [
	makePromise('alpha', 3),
	makePromise('worst bob', 1, true),
	makePromise('charly', 3)
];
try {
	let results = await Promise.race(test);
} catch(e) {
	log(`Expected failure in test: ${e}`);
}
```

And its results:

```
TEST NINE - Promise.race(bad guy wins)
Bad result for worst bob
Expected failure in test: Fail from worst bob
Good result for alpha
Good result for charly
```

Pretty simple to understand I think. The MDN docs have a [great example](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race#using_promise.race_to_implement_request_timeout) of how to use `Promise.race` to add timeouts to network calls. 

## Demo

You can see all of the above yourself at the following CodePen, but you may want to open it up in a new tab.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="bGZmRXB" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em; margin-bottom:15px">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/bGZmRXB">
  Promise Collection Stuff</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>
