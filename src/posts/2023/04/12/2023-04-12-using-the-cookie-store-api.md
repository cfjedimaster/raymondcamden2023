---
layout: post
title: "Using the Cookie Store API"
date: "2023-04-12T18:00:00"
categories: ["javascript"]
tags: ["javascript"]
banner_image: /images/banners/cookies.jpg
permalink: /2023/04/12/using-the-cookie-store-api
description: A look at the Cookie Store API
---

Today while browsing a list of [web APIs](https://developer.mozilla.org/en-US/docs/Web/API) over at MDN, I ran across one that surprised me - the [Cookie Store API](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API). This is clearly marked as experimental (currently only supported in Chrome/Edge) but looks to be fascinating. Cookies are the oldest (as far as I know) way for web applications to store data on the client. They're also typically the least recommended way of doing so, for many, many reasons. However, sometimes you need to work with cookies, and this looks like a *really* nice new way of dealing with them. Here's a quick look.

## The Old Way

For the past few hundred years or so, working with cookies in the browser involved string parsing. There really wasn't even an "API". You would read `document.cookie`, which returned a delimited string of cookie values:

```
'_ga=GA1.1.277504870.1615419234; ezux_ifep_238929=true; ezouspvh=1900; __qca=I0-1813545485-1623786777967; ezouspva=0; ezouspvv=0; ezux_et_238929=10099; ezux_tos_238929=5877205; _ALGOLIA=anonymous-c45533a4-0752-4b4d-90cb-b641b642cf4f; _ga_T5V3C8M5RY=GS1.1.1669062149.711.1.1669064843.0.0.0; hitCounter=0'
```

To get a particular cookie, you would parse by semicolon and then split it into name-value pairs. However, cookies can have more than just a name and value. For example, most cookies have an expiration date. But this is not readable by JavaScript. 

Even odder, while the *value* of `document.cookie` is a list of all cookies, you can use:

```js
document.cookie = 'name=val';
```

To write one cookie, leaving the others alone. When writing cookies, you can set additional values, like expiration, by using semicolons. Here is an example from [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie):

```js
document.cookie =
      "doSomethingOnlyOnce=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=None; Secure";
```

Because of how wonky this is, there are libraries out there to simplify it. MDN used to have a nice little library for it but unfortunately, it seems to have been removed from their site. Thankfully there are probably ten billion or so other JavaScript libraries/utilities/simple functions out there that you could use instead. Or...

## The Shiny New Way

So as I mentioned at the start, it looks like we have (or will have, hopefully), a new modern API for working with cookies. The [Cookie Store API](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API) provides an asynchronous API to read, write, and delete cookies. It also lets you listen for changes to cookies as well. As mentioned above, currently this is only [compatible](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API#browser_compatibility) with Chrome and Edge (well Opera and Samsung Internet as well). No idea if Safari will add this and your guess is as good as mine. 

To check for support, you can look for the `cookieStorage` object:

```js
if(!("cookieStore" in window)) {
	console.log('Not supported');
	return;
}
```

Once you've confirmed you can use it, here are some quick examples of the methods.

## Getting a Cookie

To get a cookie, you use `get`. Fancy, right? It does support optionally checking for a URL scope, typically used on larger sites to restrict a cookie to be available on only a portion of it. Here's the simplest example:

```js
let hitCounter = await cookieStore.get('hitCounter');
```

As mentioned before, the API is asynchronous so you can either `await` it, or use `then`. I prefer `await`. 

If the cookie doesn't exist, you'll get a `null` response, otherwise an object like so:

```js
{
    "domain": null,
    "expires": null,
    "name": "hitCounter",
    "path": "/",
    "sameSite": "strict",
    "secure": true,
    "value": "7"
}
```

Notice that the value is a string. You will need to parse it in your code if you wish to treat it as a number.

## Setting a Cookie

As you can imagine, setting a cookie is also pretty easy. If you want to set a cookie and a value, you just do:

```js
cookieStore.set('hitCounter', 9);
```

This will also be asynchronous so either `await` or be sure to use `then`. Note that even though I pass a number, it will become a string when stored. If you want to set options, you use the form:

```js
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

cookieStore.set({
	name:'hitCounter',
	value:9, 
	expires:tomorrow
});
```

In this example, I simply specified a 24-hour expiration date as an option, but there are other options as well (check the `set` [docs](https://developer.mozilla.org/en-US/docs/Web/API/CookieStore/set) for a list). 

## Deleting a Cookie

Again, another simple API, but remember it's async:

```js
cookieStore.delete('nameOfCookie');
```

There's also an option like `get` where you can pass an object containing additional options. A good example here would be `path`, and again, think of the large website needing to ensure a cookie named `foo` in a path doesn't interfere with one in another path.

## Cookie Monster (AKA, all the cookies)

The final method I'll show is the `getAll` method which returns an array of cookies. Running `cookieStore.getAll().then(console.log)` on my blog returns:

<p>
<img data-src="https://static.raymondcamden.com/images/2023/04/cookies1.jpg" alt="Console dump of cookies" class="lazyload imgborder imgcenter">
</p>

## Listening for Cookie Events

One cool aspect of the API is the ability to fire off code when cookies change. So for example:

```js
cookieStore.onchange = (event) => {
	console.log('cookie change event', event);
};
```

This fires a [CookieChangeEvent](https://developer.mozilla.org/en-US/docs/Web/API/CookieChangeEvent). This event contains a few interesting properties:

* `type` will tell you the type of change, being either `deleted` or `changed`. 
* `changed` is an array of cookies that have been changed. 
* `deleted` is an array of cookies that have been deleted.

The docs for the event don't specify why `changed` and `deleted` are an array, but if I had to guess, due to the async nature of the API it's possible to change/delete N cookies before the event can fire in response, hence needing the results in an array. 

## An Example

While - in general - I would not recommend using cookies for *new* projects, I did whip an incredibly simple demo that keeps track of the number of times you've visited a site. It does this using a `hitCounter` cookie. First, the HTML:

```html
<h2>Cookie Store Demo 1</h2>

<p>
	You have been to this page <span id="hitCount"></span> time(s).
</p>
```

And then the JavaScript:

```js
document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	if(!("cookieStore" in window)) {
		console.log('Not supported');
		return;
	}

	cookieStore.onchange = (event) => {
		console.log('cookie change event', event);
	};

	let hitCounter = await cookieStore.get('hitCounter');

	if(!hitCounter) {
		hitCounter = { value: 0 }
	}

	hitCounter.value = parseInt(hitCounter.value,10)+1;

	try {
		await cookieStore.set('hitCounter', hitCounter.value);

		/*
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		cookieStore.set({
		name:'hitCounter',
		value:hitCounter.value, 
		expires:tomorrow
		});
		*/
	} catch(e) {
		console.error(e);
	}

	document.querySelector('#hitCount').innerText = hitCounter.value;

}
```

Basically, read the cookie, and if it's null, default to 0. Then add one to it, *after* parsing it to an integer, and store the value. In theory, I don't have to `await`, I could just fire and forget and immediately update the DOM, but you get the idea. I also kept a '24 hour only version' there in the comments just for reference. You can test this demo here: <https://respected-periwinkle-warlock.glitch.me> and view the code here: <https://glitch.com/edit/#!/respected-periwinkle-warlock>.  

Before moving on, a quick note about the `try/catch`. The browser may block writes to cookies and if so, you will get an error:

```
Error: An unknown error occurred while writing the cookie.
```

If you care about this in your application, you will want to pay attention to the error. 

Photo by <a href="https://unsplash.com/@americanheritagechocolate?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">American Heritage Chocolate</a> on <a href="https://unsplash.com/photos/DoK5qEy2L60?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  