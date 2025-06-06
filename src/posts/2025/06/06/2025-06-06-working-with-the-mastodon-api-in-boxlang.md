---
layout: post
title: "Working with the Mastodon API in BoxLang"
date: "2025-06-06T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/elephants.jpg
permalink: /2025/06/06/working-with-the-mastodon-api-in-boxlang
description: Using Mastodon API's in BoxLang
---

So remember a long time ago (Tuesday), when I blogged about using the [Bluesky API with BoxLang](https://www.raymondcamden.com/2025/06/03/working-with-the-bluesky-api-in-boxlang)? As expected, I'm following that up today with a look at using the [Mastodon APIs](https://docs.joinmastodon.org/api/). Personally, I'm down to just two social networks, Bluesky and Mastodon. Originally I was using Mastodon a lot more, but I've been vibing with Bluesky more lately so I tend to check it more often. That being said, whenever I release a new blog post, I've got an automated process to post to both, so I thought I should cover both for [BoxLang](https://boxlang.io) as well.

Even better... I already did this in ColdFusion! Way back in October 2023, I [blogged](https://www.raymondcamden.com/2023/10/05/automating-mastodon-postings-with-coldfusion) about the topic and even shared a simple ColdFusion component for it. That made 'translating' to BoxLang even easier. 

## Auth

As a refresher, authentication with Mastodon is simpler. In your profile, you go into your developer settings and create a token. That's it. All you need along with that is the server your account runs on. So I specified too environment variables for this, MASTO_TOKEN and MASTO_SERVER. I verified it like so:

```js
MASTO_TOKEN = server.system.environment?.MASTO_TOKEN ?: '';
MASTO_SERVER = server.system.environment?.MASTO_SERVER ?: '';

if(MASTO_TOKEN == "" || MASTO_SERVER == "") {
	println('Ensure the Mastodon token env vars are set: MASTO_TOKEN and MASTO_SERVER');
	abort;
}
```

## Posting Messages 

As I said, you don't need anything more than that token, so posting a toot (message) is as simple as:

```js
toot = 'Hello World from BoxLang, #now()#';

bx:http url='https://#MASTO_SERVER#/api/v1/statuses' method='post' result='result' {
    bx:httpparam type='header' name='Authorization' value='Bearer #MASTO_TOKEN#';
    bx:httpparam type='formfield' name='status' value=toot;
}
```

Literally, that's it. You get a large post object back you can inspect if need be. 

## Using Images 

How about images? Like Bluesky, they've got a different endpoint for that. Here's an example sending up a cat picture.

```js
bx:http url='https://#MASTO_SERVER#/api/v2/media' method='post' result='result' {
    bx:httpparam type='header' name='Authorization' value='Bearer #MASTO_TOKEN#';
    bx:httpparam type='file' name='file' file=expandPath('./cat1.jpg');
}

mediaOb = result.filecontent.fromJSON();
```

This returns a media object where all you need is the id, and to add it to your post, it's one line of code:

```js
toot = 'Hello World from BoxLang, #now()#, with an image.';

bx:http url='https://#MASTO_SERVER#/api/v1/statuses' method='post' result='result' {
    bx:httpparam type='header' name='Authorization' value='Bearer #MASTO_TOKEN#';
    bx:httpparam type='formfield' name='status' value=toot;
	bx:httpparam type='formfield' name='media_ids[]' value=mediaOb.id;
}
```

Here's a complete script showing this in action:

```js
MASTO_TOKEN = server.system.environment?.MASTO_TOKEN ?: '';
MASTO_SERVER = server.system.environment?.MASTO_SERVER ?: '';

if(MASTO_TOKEN == "" || MASTO_SERVER == "") {
	println('Ensure the Mastodon token env vars are set: MASTO_TOKEN and MASTO_SERVER');
	abort;
}


toot = 'Hello World from BoxLang, #now()#';

bx:http url='https://#MASTO_SERVER#/api/v1/statuses' method='post' result='result' {
    bx:httpparam type='header' name='Authorization' value='Bearer #MASTO_TOKEN#';
    bx:httpparam type='formfield' name='status' value=toot;
}

dump(result.fileContent);

// test with media

bx:http url='https://#MASTO_SERVER#/api/v2/media' method='post' result='result' {
    bx:httpparam type='header' name='Authorization' value='Bearer #MASTO_TOKEN#';
    bx:httpparam type='file' name='file' file=expandPath('./cat1.jpg');
}

mediaOb = result.filecontent.fromJSON();
toot = 'Hello World from BoxLang, #now()#, with an image.';

bx:http url='https://#MASTO_SERVER#/api/v1/statuses' method='post' result='result' {
    bx:httpparam type='header' name='Authorization' value='Bearer #MASTO_TOKEN#';
    bx:httpparam type='formfield' name='status' value=toot;
	bx:httpparam type='formfield' name='media_ids[]' value=mediaOb.id;
}

dump(result.fileContent.fromJSON());
```

I turned this into a BoxLang class. It's a bit different from the Bluesky one in terms of API shape and I may address that at some point, but for now, here's that class:

```js
class {

	property name="token" type="string";
	property name="server" type="string";

	public function uploadMedia(required string path) {
		checkAuth();

		bx:http url='https://#variables.server#/api/v2/media' method='post' result='result' {
			bx:httpparam type='header' name='Authorization' value='Bearer #variables.token#';
			bx:httpparam type='file' name='file' file=path;
		}

		return result.fileContent.fromJSON();

	}

	public function post(required string toot, image="") {
		checkAuth();

		bx:http url='https://#variables.server#/api/v1/statuses' method='post' result='result' {			
			bx:httpparam type='header' name='Authorization' value='Bearer #variables.token#';
			bx:httpparam type='formfield' name='status' value=toot;
			if(image !== '') {
				imageOb = uploadMedia(image);
				bx:httpparam type='formfield' name='media_ids[]' value=imageOb.id;
			}
		}

		return result.fileContent.fromJSON();

	}

	/*
	* Utility function to ensure auth is set. 
	*/
	private function checkAuth() {
		if(variables.token == "" || variables.server == "") {
			throw("Component initialized with blank, or missing, handle and password values.");
		}
	}
}
```

And an example using it:

```js
masto = new mastodon(token=MASTO_TOKEN, server=MASTO_SERVER);

post = masto.post("Hello from the API, promise this is the last(ish) test.");
dump(post);

// now with an image test
post = masto.post("Honest, this should be the last test. Really.",expandPath('./cat1.jpg'));
dump(post);

println('done');
```

Here's my most recent test on one of my cooler bot accounts:

<blockquote class="mastodon-embed" data-embed-url="https://mastodon.social/@dragonhoards/114638610368343397/embed" style="background: #FCF8FF; border-radius: 8px; border: 1px solid #C9C4DA; margin: 0; max-width: 540px; min-width: 270px; overflow: hidden; padding: 0;"> <a href="https://mastodon.social/@dragonhoards/114638610368343397" target="_blank" style="align-items: center; color: #1C1A25; display: flex; flex-direction: column; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Roboto, sans-serif; font-size: 14px; justify-content: center; letter-spacing: 0.25px; line-height: 20px; padding: 24px; text-decoration: none;"> <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32" viewBox="0 0 79 75"><path d="M63 45.3v-20c0-4.1-1-7.3-3.2-9.7-2.1-2.4-5-3.7-8.5-3.7-4.1 0-7.2 1.6-9.3 4.7l-2 3.3-2-3.3c-2-3.1-5.1-4.7-9.2-4.7-3.5 0-6.4 1.3-8.6 3.7-2.1 2.4-3.1 5.6-3.1 9.7v20h8V25.9c0-4.1 1.7-6.2 5.2-6.2 3.8 0 5.8 2.5 5.8 7.4V37.7H44V27.1c0-4.9 1.9-7.4 5.8-7.4 3.5 0 5.2 2.1 5.2 6.2V45.3h8ZM74.7 16.6c.6 6 .1 15.7.1 17.3 0 .5-.1 4.8-.1 5.3-.7 11.5-8 16-15.6 17.5-.1 0-.2 0-.3 0-4.9 1-10 1.2-14.9 1.4-1.2 0-2.4 0-3.6 0-4.8 0-9.7-.6-14.4-1.7-.1 0-.1 0-.1 0s-.1 0-.1 0 0 .1 0 .1 0 0 0 0c.1 1.6.4 3.1 1 4.5.6 1.7 2.9 5.7 11.4 5.7 5 0 9.9-.6 14.8-1.7 0 0 0 0 0 0 .1 0 .1 0 .1 0 0 .1 0 .1 0 .1.1 0 .1 0 .1.1v5.6s0 .1-.1.1c0 0 0 0 0 .1-1.6 1.1-3.7 1.7-5.6 2.3-.8.3-1.6.5-2.4.7-7.5 1.7-15.4 1.3-22.7-1.2-6.8-2.4-13.8-8.2-15.5-15.2-.9-3.8-1.6-7.6-1.9-11.5-.6-5.8-.6-11.7-.8-17.5C3.9 24.5 4 20 4.9 16 6.7 7.9 14.1 2.2 22.3 1c1.4-.2 4.1-1 16.5-1h.1C51.4 0 56.7.8 58.1 1c8.4 1.2 15.5 7.5 16.6 15.6Z" fill="currentColor"/></svg> <div style="color: #787588; margin-top: 16px;">Post by @dragonhoards@mastodon.social</div> <div style="font-weight: 500;">View on Mastodon</div> </a> </blockquote> <script data-allowed-prefixes="https://mastodon.social/" async src="https://mastodon.social/embed.js"></script>

Fairly simple, right? If you take this along with the code from the [previous post](https://www.raymondcamden.com/2025/06/03/working-with-the-bluesky-api-in-boxlang), you could easily automate posting to both in a few lines of code. 

As before, you can find these samples in the BoxLang demos repo here: <https://github.com/ortus-boxlang/bx-demos/tree/master/scripting> Look for `test_mastodon.bxs`, `test_mastodon2.bxs`, and `mastodon.bx`. Enjoy!