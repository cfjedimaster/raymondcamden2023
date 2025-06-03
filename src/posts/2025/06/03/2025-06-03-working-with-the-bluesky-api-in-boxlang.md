---
layout: post
title: "Working with the Bluesky API in BoxLang"
date: "2025-06-03T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/bluesky.jpg
permalink: /2025/06/03/working-with-the-bluesky-api-in-boxlang
description: Using the Bluesky API with BoxLang
---

I've built multiple integrations with the [Bluesky API](https://docs.bsky.app/), all making use of either the Node or Python SDK, but I thought I'd take a quick look at what it would take to build a [BoxLang](https://boxlang.io) integration using the REST API. Turns out it's pretty easy (with some caveats I'll explain at the end) - here's what I built.

## Authentication

To authenticate, you'll need your username and password for your account. I'm picking this up via environment variables and doing a bit of validations:

```js
BS_HANDLE = server.system.environment?.BLUESKY_HANDLE ?: '';
BS_PASSWORD = server.system.environment?.BLUESKY_PASSWORD ?: '';

if(BS_HANDLE == "" || BS_PASSWORD == "") {
	println('Ensure both Bluesky env vars are set: BLUESKY_HANDLE and BLUESKY_PASSWORD');
	abort;
}
```

To authenticate, I pass this value to the `com.atproto.server.createSession` endpoint on Bluesky:

```js
body = {
	identifier: BS_HANDLE,
	password: BS_PASSWORD
};

bx:http url="https://bsky.social/xrpc/com.atproto.server.createSession" method="post" result="result" {
	bx:httpparam type="header" name="Content-Type" value="application/json";
	bx:httpparam type="body" value="#body.toJSON()#";
}
```

If the status code result from this is 200, you get an object containing information about the user, but more importantly, a `accessJwt` and `refreshJwt` value for later use. Here's an example result with anything possibly confidential removed:

```js
{
  did : "did:plc:removed",
  didDoc : {
    @context : [
        https://www.w3.org/ns/did/v1,
      https://w3id.org/security/multikey/v1,
      https://w3id.org/security/suites/secp256k1-2019/v1
    ],
    id : "did:plc:4tan3ugu55i2u3hmtblu7wf5",
    alsoKnownAs : [
        at://raymondcamden.com
    ],
    verificationMethod : [
        {
        id : "did:plc:removed",
        type : "Multikey",
        controller : "did:plc:removed",
        publicKeyMultibase : "removed"
      }
    ],
    service : [
        {
        id : "#atproto_pds",
        type : "AtprotoPersonalDataServer",
        serviceEndpoint : "https://morel.us-east.host.bsky.network"
      }
    ]
  },
  handle : "raymondcamden.com",
  email : "raymondcamden@gmail.com",
  emailConfirmed : true,
  emailAuthFactor : false,
  accessJwt : "my tokens bring the boys to the yard",
  refreshJwt : "damn right its better than yours",
  active : true
}
```

Here's how I handle the result:

```js
if(result.statusCode != 200) {
	println("Invalid login, here is what was returned:");
	writeDump(result.content);
	abort;
}

auth = result.fileContent.fromJSON();
// Auth contains info about the user, but we care about auth.accessJwt
```

## Making a Post

Now that you have an access token, making a post is relatively simple:

```js
body = {
	repo:"raymondcamden.com", 
	collection:"app.bsky.feed.post", 
	record: {
		text:"Test via API - sorry for the noise!",
		createdAt: dateTimeFormat(now(), "iso")

	}
};

bx:http url="https://bsky.social/xrpc/com.atproto.repo.createRecord" method="post" result="result" {
	bx:httpparam type="header" name="Authorization" value="Bearer #auth.accessJwt#";
	bx:httpparam type="header" name="Content-Type" value="application/json";
	bx:httpparam type="body" value="#body.toJSON()#";
}

writeDump(result);
```

Basically I've got a `body` object that describes what's being added (a post) and includes the text and date created. That's literally it. The result is a record object and, obviously, a post on Bluesky itself.

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:4tan3ugu55i2u3hmtblu7wf5/app.bsky.feed.post/3lqnamndvy42h" data-bluesky-cid="bafyreidbbi4i5umy4eze6erz4kowtzoamx723r25crqeerub7yensmsngu" data-bluesky-embed-color-mode="system"><p lang="">Test via API - sorry for the noise!</p>&mdash; Raymond Camden (<a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5?ref_src=embed">@raymondcamden.com</a>) <a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5/post/3lqnamndvy42h?ref_src=embed">June 2, 2025 at 11:56 AM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

## Using Images

To add an image to your post requires uploading it first. Here's an example using that endpoint and an image in the local file system:

```js
imgTest = expandPath("./cat1.jpg");
bx:http url="https://bsky.social/xrpc/com.atproto.repo.uploadBlob" method="post" result="result" {
	bx:httpparam type="header" name="Authorization" value="Bearer #auth.accessJwt#";
	bx:httpparam type="header" name="Content-Type" value="image/jpeg";
	bx:httpparam type="body" value="#fileReadBinary(imgTest)#";
}

fileResult = result.fileContent.fromJSON();
```

This returns a file object that can be referenced in a new post - although now the post object gets a bit more complex:

```js
body = {
	repo:"raymondcamden.com", 
	collection:"app.bsky.feed.post", 
	record: {
		text:"Test via API - now with an image (for real).",
		embed: {
			"$type": "app.bsky.embed.images",
			images: [
			{
				alt:'',
				image: fileResult.blob
			}
			],
		},
		createdAt: dateTimeFormat(now(), "iso")
	}
};

bx:http url="https://bsky.social/xrpc/com.atproto.repo.createRecord" method="post" result="result" {
	bx:httpparam type="header" name="Authorization" value="Bearer #auth.accessJwt#";
	bx:httpparam type="header" name="Content-Type" value="application/json";
	bx:httpparam type="body" value="#body.toJSON()#";
}
```

Note that the endpoint is the same, it's just the body changing. Also note in the example above, I did not include an alt tag. Don't do that. Use an alt tag. Always. 

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:4tan3ugu55i2u3hmtblu7wf5/app.bsky.feed.post/3lqncrxlqi42g" data-bluesky-cid="bafyreieogvvjw6nmavwvup5kvwhkxs4xrfszgkvgyr4vmb77vfjdxwwb4i" data-bluesky-embed-color-mode="system"><p lang="">Test via API - now with an image (for real).<br><br><a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5/post/3lqncrxlqi42g?ref_src=embed">[image or embed]</a></p>&mdash; Raymond Camden (<a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5?ref_src=embed">@raymondcamden.com</a>) <a href="https://bsky.app/profile/did:plc:4tan3ugu55i2u3hmtblu7wf5/post/3lqncrxlqi42g?ref_src=embed">June 2, 2025 at 12:35 PM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

## Wrapping it Up

So, given that sample code, I decided to build a simple class wrapper for it. This class handles authentication and has methods for login and posting, with optional images. I made the image support require alt text to ensure folks at least think about it before posting images to the API. (Technically you can still pass an empty string.) Here's that class as it stands now:

```js
class {

	property name="handle" type="string";
	property name="password" type="string";
	property name="token" type="string";

	public function login() {

		checkAuth();

		body = {
			identifier: variables.handle,
			password: variables.password
		};

		bx:http url="https://bsky.social/xrpc/com.atproto.server.createSession" method="post" result="result" {
			bx:httpparam type="header" name="Content-Type" value="application/json";
			bx:httpparam type="body" value="#body.toJSON()#";
		}

		if(result.statusCode != 200) {
			throw("Authentication credentials were not valid.");
		}

		auth = result.fileContent.fromJSON();

		variables.token = auth.accessJwt;
		return true;

	}

	/*
	To use an image (soon to be an array), you must pass a structure that contains:
	.src=binary data of the image
	.alt=alt text. Technically alt text isn't required by the API, but you *should* use it
	*/
	public function post(required string msg, struct image) {
		checkAuth();

		body = {
			repo:"raymondcamden.com", 
			collection:"app.bsky.feed.post", 
			record: {
				text:msg,
				createdAt: now().format("iso")
			}
		};

		if(arguments.keyExists("image")) {
			if(!arguments.image.keyExists("src") || !arguments.image.keyExists("alt")) {
				throw("When passing an image to post, you must include src and alt values.");
			}

			bx:http url="https://bsky.social/xrpc/com.atproto.repo.uploadBlob" method="post" result="result" {
				bx:httpparam type="header" name="Authorization" value="Bearer #variables.token#";
				bx:httpparam type="header" name="Content-Type" value="image/jpeg";
				bx:httpparam type="body" value="#image.src#";
			}

			fileResult = result.fileContent.fromJSON();

			body.record.embed = {
				"$type": "app.bsky.embed.images",
				images: [
					{
						alt:image.alt,
						image: fileResult.blob
					}
				]
			}
		}

		bx:http url="https://bsky.social/xrpc/com.atproto.repo.createRecord" method="post" result="result" {
			bx:httpparam type="header" name="Authorization" value="Bearer #variables.token#";
			bx:httpparam type="header" name="Content-Type" value="application/json";
			bx:httpparam type="body" value="#body.toJSON()#";
		}

		return result.fileContent;
	}

	/*
	* Utility function to ensure auth is set. In the future, I'm going to allow this to refresh tokens.
	*/
	private function checkAuth() {
		if(variables.handle == "" || variables.password == "") {
			throw("Component initialized with blank, or missing, handle and password values.");
		}
	}
}
```

Using it requires you to instantiate it with your creds, login, and then make some posts:

```js
BS_HANDLE = server.system.environment?.BLUESKY_HANDLE ?: '';
BS_PASSWORD = server.system.environment?.BLUESKY_PASSWORD ?: '';

bs = new bluesky(handle=BS_HANDLE, password=BS_PASSWORD);
bs.login();

post = bs.post("Hello from the API, promise this is the last(ish) test.");
dump(post);

// now with an image test

post = bs.post("Honest, this should be the last test. Really.", { src:fileReadBinary(expandPath("./cat1.jpg")), alt:"Photo of a kitten" });

dump(post);
```

Much simpler, right? You can find the source and sample files here: <https://github.com/ortus-boxlang/bx-demos/tree/master/scripting> (There's more files in this folder, but look for `bluesky.bx`, `test_bluesky.bxs` and `test_bluesky2.bxs`. 

Now, there's still a bit missing from this. First off, to have links in your text automatically become 'real' links, you need to use the API's "Facet" endpoint. I'm going to add support for that so it happens automatically. 

Next, you can post up to 4 images per post, so I'm going to rewrite image support to allow you to pass a structure for one image, or an array of images instead. 

Finally, I'm considering changing how authentication works. In theory, it should just handle it for you and cache the jwt. That would remove the `bs.login()` requirement above. I can also make use of the refresh token to automatically update the token for you. 

All of this will be considered once I turn this into a proper BoxLang module available on Forgebox. And finally finally (for real this time), you could convert this to ColdFusion pretty quickly. 

Photo by <a href="https://unsplash.com/@joshua_hoehne?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Joshua Hoehne</a> on <a href="https://unsplash.com/photos/landscape-photography-of-green-grass-field-cmJt_Wdj-8E?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      