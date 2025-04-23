---
layout: post
title: "Adding CORS to Your BoxLang APIs"
date: "2025-04-23T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_door.jpg
permalink: /2025/04/23/adding-cors-to-your-boxlang-apis
description: Why and How to add CORS to BoxLang APIs
---

CORS, or [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), has been the bane of my existence at times. Don't get me wrong, I get the idea behind it. I get why it's necessary. That being said, I tend to forget about it until I write some client-side JavaScript code that gets hit by it. With that in mind, I thought I'd quickly demonstrate how to build CORS-enabled APIs with [BoxLang](https://boxlang.io). It's *incredibly* simple, which is good, but you'll want to keep it in mind when building out your own APIs.

## What and Why?

I'm not going to repeat the full description of [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) available from MDN, but it basically boils down to a security feature in browsers. When executing code on your domain that makes an HTTP request (either via the ancient `XmlHttpRequest` or the new host `fetch`), the browser will look for specific headers on the other domain that basically boil down to, "Are you cool with me accessing your stuff?" This 'question' is done via a 'preflight' network request that checks for specific headers. If those headers do not exist, or exist and do not specifically say the remote host (where your code is) can access the resource, your network request will be blocked. 

As a creator of an API, if you want people to use it in their client-side JavaScript (and note, this is *only* an issue in the browser, nowhere else), you are required to add the additional headers to your response. 

## APIs in BoxLang

Creating APIs in BoxLang is pretty trivial, and follows the model that ColdFusion has used as well. Any particular BoxLang template can output JSON, or XML, or heck, plain text, and be addressable and usable via remote consumers. But typically you will instead use a [BoxLang class](https://boxlang.ortusbooks.com/boxlang-language/classes) instead. 

Any BoxLang class under web root will automatically expose any method marked as remote. So for example:

```js
class {
	
	remote array function getCats() {
		return [
			{ "name":"Luna", "age": 12 },
			{ "name":"Elise", "age": 14 },
			{ "name":"Grace", "age": 13 },
			{ "name":"Pig", "age": 9 },
			{ "name":"Zelda", "age": 2 },
			{ "name":"Wednesday", "age": 1 },
		]
	}

}
```

By having `remote` in the function declaration, this method can be invoked by using it's path under web root and using `method=getCats` in the URL to specify the function. So if this were saved as `/api.bx`, you could use:

```
https://yourdomain.com/api.bx?method=getCats
```

The result is automatically converted to JSON, but you can tweak that if you want to output other formats. You can have as many methods as you want, and can chain some to others, for example:

```js
class {
	
	remote array function getCats() {
		return [
			{ "name":"Luna", "age": 12 },
			{ "name":"Elise", "age": 14 },
			{ "name":"Grace", "age": 13 },
			{ "name":"Pig", "age": 9 },
			{ "name":"Zelda", "age": 2 },
			{ "name":"Wednesday", "age": 1 },
		]
	}

	remote array function searchCats(required string name) {
		return getCats().filter(c => c.name == name);
	}

}
```

In this case, I've added a second method, `searchCats`, which will return a filtered list of cats. And yes, I 100% could have used one method that had an optional search filter. Honestly, the API you build is up to you and whatever makes sense for your needs. 

It just so happens I released a BoxLang Quick Tip video on this subject, check it out below:

{% liteyoutube "J0nQOIN6_hk" %}

## Supporting CORS

So given that it's easy to build an API with BoxLang, let's demonstrate CORS being an issue, and then correcting it. I built a simple BoxLang web app and created `api.bx`:

```js
class {

	// Won't work off site
	remote array function getCats() {
		return [
			{ "name":"Luna", "age": 12 },
			{ "name":"Elise", "age": 14 },
			{ "name":"Grace", "age": 13 },
			{ "name":"Pig", "age": 9 },
			{ "name":"Zelda", "age": 2 },
			{ "name":"Wednesday", "age": 1 },
		]
	}

}
```

I ran this via `boxlang-miniserver` and confirmed it was accessible. In another folder I created a simple HTML page:

```html
<html>
<head>
<title>Consumer Demo</title>
</head>

<body>
	<h2>Cats</h2>
	<div id="result"></div>

<script>
document.addEventListener('DOMContentLoaded', init, false);

async function init() {
	let $result = document.querySelector('#result');

	let catRequest = await fetch('http://localhost:8080/api.bx?method=getCats');
	let cats = await catRequest.json();
	console.log(cats);

	let html = '<ul>';
	for(let cat of cats) {
		html += `
		<li>${cat.name} is ${cat.age} years old</li>
		`;
	}

	$result.innerHTML = html + '</ul>';
}
</script>
</body>
</html>
```

Basically, hit the API on the 'remote' server and render out the results. I fired up a second local web server for this, and immediately get an error in the console:

```
Access to fetch at 'http://localhost:9000/api.bx?method=getCats' 
from origin 'http://127.0.0.1:42419' has been blocked by CORS 
policy: No 'Access-Control-Allow-Origin' header is present on 
the requested resource. If an opaque response serves your needs, 
set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
```

Doh! But expected. So let's fix it. How? With one line of code:

```js
remote array function getCats2() {
	bx:header name="Access-Control-Allow-Origin" value="*";
	return [
		{ "name":"Luna", "age": 12 },
		{ "name":"Elise", "age": 14 },
		{ "name":"Grace", "age": 13 },
		{ "name":"Pig", "age": 9 },
		{ "name":"Zelda", "age": 2 },
		{ "name":"Wednesday", "age": 1 },
	]
}
```

Notice I used `getCats2` as my source (which I'll share in a minute) has both the 'before' and 'after'. Anyway, using this new method fixes everything. 

<p>
<img src="https://static.raymondcamden.com/images/2025/04/cors1.jpg" alt="Screenshot of the rendered list of cats." class="imgborder imgcenter" loading="lazy">
</p>

Now, to be clear, the `Access-Control-Allow-Origin` header there is basically saying, "Anyone from anywhere can use me as you will", and you do **not** need to be that permissive. For details on how to be more specific, again I'd suggest the MDN [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) docs as your reference. 

If you want, you can check out the source code for both the API and consumer here: <https://github.com/ortus-boxlang/bx-demos/tree/master/webapps/corsdemo> Let me know if you've got any questions below. 