---
layout: post
title: "Using BoxLang's Cache Services"
date: "2025-06-11T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_mirrors.jpg
permalink: /2025/06/11/using-boxlangs-cache-services
description: A look at BoxLang's incredibly complex and powerful caching service.
---

Recently I've been looking at BoxLang's [Caching](https://boxlang.ortusbooks.com/boxlang-framework/caching) service, mostly because the docs were updated which made it easier to dig into it. ;) My usual expectation for a caching service is typically a key/value system with APIs to get and set and hopefully a simple way to handle expiration. So for example, I can idealy store a cache value *and* an expiration values at the same time, and if I fetch it later and it's expired, I get a nice null value back. As I said, that's the 'baseline' for what I expect, so I was kind of blown away, and a bit overwhelmed honestly, with what you can do on the [BoxLang](https://boxlang.io) platform. At a high level, here's some of the details:

Out of the box (heh, get it, 'box', 'BoxLang', I'm hilarious), you get the ability to get a default cache. But on top of that, you can create your own cache and specify things like eviction policy and default expirations. As an example, if you need a very short lived cached, you can specify that and store values there knowing you'll get that behavior. 

You also get the ability to introspect all those caches at the system level. You can get them all, poke inside, and so forth. Caches also have built in stats so you can do your own reporting, monitoring, and so forth. 

Caches support a filtering system which provides an API to work with keys based on string patterns. So for example, imagine you are caching results for names, and use a key following this pattern:

* cachedname.ray
* cachedname.scott
* cachedname.todd
* cachedname.brian

You can create a filer based on `cachedname.*`, and then do operations on matching keys based on that filter. Obviously that requires you to *follow* a pattern, but if you do, the support makes it easy. 

Also, since BoxLang gives you 'interceptor' access to low level events, you can listen in to and react to any cache type event. 

Finally, one thing that may trip you up a bit is that the caching functions make use of [Attempts](https://boxlang.ortusbooks.com/boxlang-language/syntax/attempts), a flavor of Java's Optional support. I'll be honest, Attempts feel a bit awkward to me and I struggle with it a bit, but I'm reminded of JavaScript's Promise feature which was near incomprehensible to me at first. It just took time. 

Definitely dig into the [Caching docs](https://boxlang.ortusbooks.com/boxlang-framework/caching) for a look at everything possible, but how about some code? These code examples will make use default BoxLang cache, but take a look at the [provider list](https://boxlang.ortusbooks.com/boxlang-framework/caching#providers) for examples of other flavors. 

## Simple Caching

Let's start with a simple example. First, get the default cache:

```js
myCache = cache();
```

This returns an instance of a cache provider object. You can check the [reference](https://boxlang.ortusbooks.com/boxlang-framework/caching/custom-cache-providers#icacheprovider) for the full spec but it includes methods for getting and setting values, clearing, getting keys, and so forth.

Now let's set a value:

```js
myCache.set('lastUsed', now());
```

And then immediately get it:

```js
cached = myCache.get('lastUsed');
println(cached);
```

The result is *not* what you expect. Instead of the date time instance, you get an Attempt object. If you print it, you will see it, but it's really an object, not a simple value:

```js
Attempt[{ts '2025-06-11 16:42:05'}]
```

This is where the Attempt logic comes in, and as I said, it's not something I'm 100% comfortable with yet, but you can use a method to get the value like so:

```js
cached.ifPresent(c => println('Cached value: #c#'));
```

You can simplify this quite a bit by using the `getOrSet` method which, as you can imagine, will get a cached value or set it. 

```js
lastUsed2 = myCache.getOrSet('lastUsed2', () => return now());
println('lastUsed2 cache value is #c#')
```

How about another example? You can use `orElse` on an Attempt to return a value if the attemps value is null:

```js
lastUsed3 = myCache.get('lastUsed3').orElse(now());
println('lastUsed3 is #lastUsed3#');
```

This is probably obvious, but this is different from the `getOrSet` option as this won't set a value in the cache. If you never cache `lastUsed3`, this code will always return `now()`. 

So yeah - you've got multiple options here. You can test this out yourself below.

<iframe
        allow="fullscreen" 
        width="600"
        height="400" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJx1j08LgjAYh%2B%2F7FC942IRQcLfEIKRzQXToOOZbCXPKNvvz7ZuKmoGngXv8Pc%2BqTy7kAyED2Z0sTAmphm%2BRRceoEtZdLBZ0A7p%2BsbADerTw%2F4zkfUHOSFTeTgYtasckZDtoTKmd0ozmw8JTqBa3EMiA9sNxDHtduwcawLeoGoWEjLPJ0nc0519p4vtY2DkMutboKXZSzjt92%2BCG0kIw3fiKvuGKDsRfxwjxtWdzGka1OSiLbNXNFz7ufekX%2BnN8Yg%3D%3D">
    </iframe>

## Caching with Expirations

Setting expirations can be done at the same time you set a value. For example:

```js
lastTime = myCache.getOrSet("lastTime", () => return now(), 5);
```

This will cache the value for 5 seconds. To see this in action, consider the following:

```js
myCache = cache();

lastTime = myCache.getOrSet("lastTime", () => return now(),5);

myCache.get("lastTime").ifPresent(thisTime => {
	printLn(thisTime);
});

sleep(7 * 1000);

// returns the key, but it won't exist if fetched
writeDump(myCache.getKeys());

test = myCache.get("lastTime").ifPresent(x => {
	println('yes it is present, #x#');
});
```

I set a cached value to `lastTime` and set it to live for 5 seconds. I then grab the value immediately. (Technically I already had it in `lastTime`, but I wanted to show a followup fetch of the value.

I then sleep for 7 seconds.

After I wake up, I grab all the keys, and as the comment says, I will see my value as it hasn't been reaped yet, but if I get it, the result will be null. If you run the sample below, the second print will not be shown. (Be sure to switch to the Buffer tab which shows the output). 


{% callout %}
A quick note - as of June 11th, there is a bug when getting an expired value *before* reaping. The bug being it still returns. This is corrected in the snapshot build of BoxLang and will be in the next main release, at which point the embed below should automatically show the correct behaviour. Also, try.boxlang.io will persist the cache longer than a typical CLI call would, so I added `clearAll` for demo purposes.
{% endcallout %}

<iframe
        allow="fullscreen" 
        width="100%"
        height="600" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJx1j8FKxEAQRM%2FmK4rdQ3ok7MaDeJBdEL0pKOgPxNhxByezYbpDEsR%2Fd4a4Eg%2BehqmurnrdTrdVfWDsUKeXzHXWztKmdlyFG%2BeS5irRF9sm32n8zvoYnllpdRquCpDBbo%2FA2gcPfxzIFJdxPVssLfxmY5unwMJeSQ9W5oY9PrOzLlivD%2F5XjiFfKUgcc0dXOMdFWZZJ2W5%2F%2BgQaD%2FngqcBrr7CK4ehzBY9W4rdBwxoZ3rIhWOW7vu1ogXXPk5BJgcrR%2FufOf5DHJavzlE8sqdYKutlSYD2u85n9G%2FgudNY%3D">
    </iframe>

## A "Practical" Example

Ok, the 'practical' nature of this is certainly in the eye of the beholder, but what about a simple example? Imagine an API built to return a forecast from a third party API provider:

```js
class {

	remote struct function getForecast() {

		bx:http url="https://api.open-meteo.com/v1/forecast?latitude=30.216&longitude=-98.555&current=temperature_2m,wind_speed_10m" result="result";

		return jsonDeserialize( result.fileContent );

	}

}
```

Simple enough, right? Now let's add basic caching:

```js
class {

	variables.CACHE_TIME = 30 * 60; // 30 minutes

	remote struct function getForecast() {

		myCache = cache();

		result = myCache.getOrSet("forecast", () => {
			println('getting weather from API');

			bx:http url="https://api.open-meteo.com/v1/forecast?latitude=30.216&longitude=-98.555&current=temperature_2m,wind_speed_10m" result="result";

			return jsonDeserialize( result.fileContent );
		}, variables.CACHE_TIME);

		return result;

	}

}
```

All I did was grab the default cache and use `getOrSet` to handle the logic of getting the value from the cache or fetching it from the API. In this particular case, there isn't a huge time savings - the API I'm using is fairly fast. But consider a case where I'm *paying* for API usage - the cache could literally save me money.

Now, this partiular API isn't using any arguments so it's easier to cache, but you ccould use a dynamic cache key based on arguments. I'd be careful with locations as you wouldn't want a geolocation cache that contains thousands of "slightly off" locations. As always, think before you blindly cache! 

## An "Impactical" Example

Ok, this isn't impractical per se, but consider the typical Fibonacci sequence. Generating a result for that is easy enough:

```js
function fibonacci(k) {
	if(k < 2) return k;
	return fibonacci(k-1) + fibonacci(k-2);
}

```

But it takes progressively more and more time the larger the input. I'm not sure if it's exponential, but it grows pretty dang fast. We can do basic time checking like so:

```js
COUNT = 28;

function fibonacci(k) {
	if(k < 2) return k;
	return fibonacci(k-1) + fibonacci(k-2);
}

now = getTickCount();
res = fibonacci(COUNT);
dur = getTickCount() - now;
println('Total time: #dur#ms');
```

This takes roughly 5.6 seconds to process. Now let's add some caching:

```js
myCache = cache();

function fibonacci2(k) {
	cached = myCache.get(k);
	if(cached.isPresent()) {
		return cached.get();
	}

	if(k < 2) {
		result = 1;
	} else {
		result = fibonacci2(k-1) + fibonacci2(k-2);
	}
	//println('caching #k#');
	myCache.set(k, result);
	return result;
}

now = getTickCount();
res = fibonacci2(COUNT);
dur = getTickCount() - now;
println('Total time for Cached version: #dur#ms');
```

This version takes 26ms. I'm no Phd in Computer Science, but 0.026s < 5.6. I'm pretty sure anyway. You can test this yourself below. (Note that I'm using `clearAll` again for try.boxlang.io to handle multiple runs in that envrionment.)

<iframe
        allow="fullscreen" 
        width="100%"
        height="600" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJydUctOwzAQPMdfsVIOTQRN1JwQgQPKjQNwKB%2BQOptgxbWR7QBVxb%2BzzoMmlAPilGh2Z3Y8Uzw%2BP2zhFrKrnLG6U9wJraAWO61KzkXUxnBkgaijFm4gi8Gg64yCNmfB%2BDvbXW9iuFgAWZyzT8aUfqcbDbqt4G2hO%2BUiGhi0hJ7WC%2B%2BF8KozZ9uwBhLJ2asRykkVrbbalRKc2OM1hMQI93ZFXLY%2FFCV%2FQRLg%2FuvvpCncd9aBQqywglobcOaQ7PSHLFWTCD2REi6xNHdSetYvaWRjHL1yRScmHnmlUd4HNQwTYZ%2Fofei995wgTb%2B9D8kJ1QweK288mPIc%2BV7Sw5TeLP5jv2c76ej6xo8BpcUlPvf7o5Js7IRk54b8TW8nbMPey%2FQu6991CYNyfOp8AP5ebfbfbvuyiiHuNzSW6ljWzdgXUFncGg%3D%3D">
    </iframe>

That's it for now. I've just started to dig into this service, so be sure to check the [docs](https://boxlang.ortusbooks.com/boxlang-framework/caching) for a full coverage of all aspects of it, and let me know if you have any questions. (Leave a comment, or join us on [Slack](https://boxteam.ortussolutions.com/) to ask.)