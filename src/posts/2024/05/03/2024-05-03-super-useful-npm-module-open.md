---
layout: post
title: "Super Useful NPM Module - Open"
date: "2024-05-03T18:00:00"
categories: ["javascript"]
tags: ["nodejs"]
banner_image: /images/banners/open-sign.jpg
permalink: /2024/05/03/super-useful-npm-module-open
description: A quick look at a useful NPM module.
---

Forgive the samewhat lame title, and this will be a quick little post, but I've recently been using such an incredibly helpful npm module I wanted to share it with others. [`open`](https://www.npmjs.com/package/open) by [Sindre Sorhus](https://github.com/sindresorhus) (you **must** click that link and look at their incredible GitHub profile) is a simple, but powerful utility that... opens things. 

Ok, that sounds rather obvious, but what it means in practice is that your Node code can open a resource on your computer with the associated app. (It can also open up an app by itself if you want.) I can't tell you how many scripts I've written that generate file-based results, or URL-hosted results, that I then double-click to open. This one little utility handling that for me has been *incredibly* useful lately. 

How about a quick example? Imagine this script was doing a lot more, for example, using [Acrobat Services](https://developer.adobe.com/document-services/homepage) to create a PDF that's stored when done. Here's how you would automatically open it:

```js
import open from 'open';

// imagine we did stuff to generate this
let source = './example.pdf';

open(source);
```

As an aside, this works perfectly well on my Windows machine, running Node via WSL. It opened up Acrobat with the result just fine. And as one more aside, the Acrobat Services REST APIs generate a download URL when done, and in theory, I could skip downloading the PDF if I just wanted to *look* at a result and didn't need to keep it.

Speaking of URLs, when passed to `open`, not only will it respect your default browser, but even the most recent window. I've been doing a *lot* of work lately with [Firefly Services](https://developer.adobe.com/firefly-services/docs/guides/), and I've used `open` to simplify my looking at the results. 

Here's a complete script showing Firefly's test to image API and sending the results directly to my browser:

```js
import open from 'open';

let CLIENT_ID = process.env.CLIENT_ID;
let CLIENT_SECRET = process.env.CLIENT_SECRET;

async function getAccessToken(id, secret) {

	let params = new URLSearchParams();

	params.append('grant_type', 'client_credentials');
	params.append('client_id', id);
	params.append('client_secret', secret);
	params.append('scope', 'openid,AdobeID,firefly_enterprise,firefly_api,ff_apis');
	
	let resp = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', 
		{ 
			method: 'POST', 
			body: params
		}
	);

	let data = await resp.json();
	return data.access_token;
}

async function textToImage(prompt, id, token, size="1024x1024", n=1, contentClass) {

	let [ width, height ] = size.split('x');
	let body = {
		size: { width, height }, 
		n,
		prompt
	}

	if(contentClass) body.contentClass = contentClass;

	let req = await fetch('https://firefly-api.adobe.io/v2/images/generate', {
		method:'POST',
		headers: {
			'X-Api-Key':id, 
			'Authorization':`Bearer ${token}`,
			'Content-Type':'application/json'
		}, 
		body: JSON.stringify(body)
	});

	let resp = await req.json();
	return resp;
}

let prompt = 'a humanized unicorn wearing a leather jacket and looking tough';

console.log('Getting access token...');
let token = await getAccessToken(CLIENT_ID, CLIENT_SECRET);

console.log('Now generating my images...');
let result = await textToImage(prompt, CLIENT_ID, token, '2304x1792', 3, 'photo') ;
if(!result.outputs) {
	console.log(JSON.stringify(result,null,'\t'));
	process.exit(1);
}

for(let output of result.outputs) {
	open(output.image.presignedUrl);
}

console.log('Done');
```

In this case, as I had 3 results, I get three tabs opened in the browser. That's *perfect*. But if I wanted to compare and contrast them, I could get a bit fancier. I covered this technique back in May when I [blogged about generating headers](https://www.raymondcamden.com/2024/03/27/automating-blog-post-headers-with-firefly-services), but the idea is - generate a temporary HTML file, save it, `open` it, and then delete it. Here's a modification of the previous script where I do that. (To keep the listing shorter, I just shared the portion after my functions and setup.)

```js
let prompt = 'a humanized unicorn wearing a leather jacket and looking tough';

console.log('Getting access token...');
let token = await getAccessToken(CLIENT_ID, CLIENT_SECRET);


console.log('Now generating my images...');
let result = await textToImage(prompt, CLIENT_ID, token, '2304x1792', 4, 'photo') ;
if(!result.outputs) {
	console.log(JSON.stringify(result,null,'\t'));
	process.exit(1);
}

let html = `
<style>
img {
	max-width: 650px;
}

.results {
	display: grid;
	grid-template-columns: repeat(2, 50%);
}
</style>
<h2>Results for Prompt: ${prompt}</h2>
<div class="results">
`;

result.outputs.forEach(i => {
	html += `<p><img src="${i.image.presignedUrl}"></p>`;
});

html += '</div>';

let filename = `${uuid4()}.html`;
fs.writeFileSync(filename, html, 'utf8');
await open(filename, {
	wait: true
});
fs.unlinkSync(filename);

console.log('Done');
```

The `uuid4()` function there comes from another useful npm library, [`uuid`](https://www.npmjs.com/package/uuid), and helps me generate a unique filename. 

In this case, my output looks like this in my browser:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/unicorn1.jpg" alt="Four unicorn images" class="imgborder imgcenter" loading="lazy">
</p>


I'm not sure I've blogged a "love letter" to an NPM package before, but this one really felt like it deserved it. Check the [docs](https://www.npmjs.com/package/open) for more information, as I only used the simplest options. 

Photo by <a href="https://unsplash.com/@sonance?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Viktor Forgacs™️</a> on <a href="https://unsplash.com/photos/red-and-white-open-neon-signage-LNwIJHUtED4?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
  