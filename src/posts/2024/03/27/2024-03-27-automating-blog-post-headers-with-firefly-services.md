---
layout: post
title: "Automating Blog Post Headers with Firefly Services"
date: "2024-03-27T18:00:00"
categories: ["development"]
tags: ["generative ai","adobe"]
banner_image: /images/banners/cat_painting2.jpg
permalink: /2024/03/27/automating-blog-post-headers-with-firefly-services
description: 
---

Yesterday I [introduced](https://www.raymondcamden.com/2024/03/26/automate-generative-image-apis-with-firefly-services) you to Adobe's new offering, [Firefly Services](https://www.adobe.com/creativecloud/business/enterprise/firefly.html), and demonstrated a simple example of how to generate images from prompt using the REST APIs. Today I thought I'd share one of the little demos I've made with the API, and one specifically built to help out with my blog - generating headers.

My usual process for headers is to go to the [Firefly](https://firefly.adobe.com) website, enter a prompt, let it load, and then promptly change it to landscape and re-generate my prompt again. I always feel bad that the initial, square, images are essentially trashed. It occurred to me I could build a Node.js utility to generate the images at the exact right size and even quickly display them. Here's how I did it.

First, I designed the CLI so I can simply pass in a prompt. Here's how I handled that:

```js
if(process.argv.length < 3) {
	console.log(styleText('red', 'Usage: makeheader.js <<prompt>>'));
	process.exit(1);
} 

const prompt = process.argv[2];

console.log(styleText('green', `Generating headers for: ${prompt}`));
```

Next, I authenticate, and create my images:

```js
let token = await getFFAccessToken(FF_CLIENT_ID, FF_CLIENT_SECRET);
let result = await textToImage(prompt, FF_CLIENT_ID, token);
```

I showed both of these methods yesterday, but my parameters for the Firefly API to generate images are slightly tweaked though. First, the authentication method again:

```js
async function getFFAccessToken(id, secret) {

	const params = new URLSearchParams();

	params.append('grant_type', 'client_credentials');
	params.append('client_id', id);
	params.append('client_secret', secret);
	params.append('scope', 'openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis');
	
	let resp = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', 
		{ 
			method: 'POST', 
			body: params
		}
	);

	let data = await resp.json();
	return data.access_token;
}
```

And here's the call to the [text to image API](https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/image_generation/):

```js
async function textToImage(text, id, token) {

	let body = {
		"n":4,
		"prompt":text,
		"size":{
			"width":"2304",
			"height":"1792"
		}
	}

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
```

Note two things here:

* First, I set `n` to 4 so I get 4 results, not the default of 1.
* My size is hard coded to the landscape size. 

Ok, so that's the easy bit honestly. But I wanted to do something cool with the results. There is a really useful npm package called [`open`](https://www.npmjs.com/package/open) that will open URLs and files. The result of the Firefly API call above will include 4 URLs and I could have simply opened all four of them in individual browser tabs, but I wanted one page where I could see them all, much like the Firefly website. While not directly supported by `open` yet, I got around it by generating a temporary HTML file locally:

```js
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
```

So now what happens is, I run my prompt, and when it's done, I get an HTML page. Here's the result of using:

```bash
node makeheader "a somber, moody picture of a cat in painters clothes, standing before an easel, thinking about what to pain
t next"
```

<p>
<img src="https://static.raymondcamden.com/images/2024/03/ff1.jpg" alt="Sample output." class="imgborder imgcenter" loading="lazy">
</p>

And yes, I used the fourth image for this post. Here's the complete script, but you can also find it in my Firefly API repo: <https://github.com/cfjedimaster/fireflyapi/tree/main/demos/makeheader>

```js
// Requires Node 21.7.0
process.loadEnvFile();
import { styleText } from 'node:util';
import { v4 as uuid4 } from 'uuid';
import open from 'open';
import fs from 'fs';

const FF_CLIENT_ID = process.env.FF_CLIENT_ID;
const FF_CLIENT_SECRET = process.env.FF_CLIENT_SECRET;

async function getFFAccessToken(id, secret) {

	const params = new URLSearchParams();

	params.append('grant_type', 'client_credentials');
	params.append('client_id', id);
	params.append('client_secret', secret);
	params.append('scope', 'openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis');
	
	let resp = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', 
		{ 
			method: 'POST', 
			body: params
		}
	);

	let data = await resp.json();
	return data.access_token;
}

async function textToImage(text, id, token) {

	let body = {
		"n":4,
		"prompt":text,
		"size":{
			"width":"2304",
			"height":"1792"
		}
	}

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


if(process.argv.length < 3) {
	console.log(styleText('red', 'Usage: makeheader.js <<prompt>>'));
	process.exit(1);
} 

const prompt = process.argv[2];

console.log(styleText('green', `Generating headers for: ${prompt}`));

let token = await getFFAccessToken(FF_CLIENT_ID, FF_CLIENT_SECRET);
let result = await textToImage(prompt, FF_CLIENT_ID, token);

console.log(styleText('green', 'Results generated - creating preview...'));

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
```