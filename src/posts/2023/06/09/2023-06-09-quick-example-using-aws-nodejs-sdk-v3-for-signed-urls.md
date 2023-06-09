---
layout: post
title: "Quick example using AWS Node.js SDK V3 for Signed URLs"
date: "2023-06-09T18:00:00"
categories: ["javascript"]
tags: ["aws"]
banner_image: /images/banners/signing.jpg
permalink: /2023/06/09/quick-example-using-aws-nodejs-sdk-v3-for-signed-urls
description: How to generate presigned URLs for AWS and V3 of the SDK 
---

This probably falls into the "it was easy for everyone else in the world but me" bucket, but I really struggled to find good search results for this and figured I'd better write it down so when I google for it again in a few months, I'll find my own blog. Specifically - today I was trying to use the AWS Node.js SDK to generate signed URLs. One to create read-only access to a bucket item and another to allow uploading. 

Everything I'm sharing is covered in the [docs](https://docs.aws.amazon.com/sdk-for-javascript/index.html), but I struggled to find the relevant parts. 

So first off, V3 of the SDK is modularized, so instead of installing a giant SDK, you get just what you need. A lot of the demos show S3 so that's handy. You can install it like so:

```bash
npm i @aws-sdk/client-s3
```

However, the bits that work with signing URLs are _another_ package:

```bash
npm i @aws-sdk/s3-request-presigner
```

This part above is what took me the most time to figure out. Ok, now for your imports. You'll need a generic one for S3 and another for the signing bits:

```js
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
```

The S3 client uses a set of functions related to operations and you need to import each one you'll require. As I said, my needs were "Public Read" and "Upload", which corresponded to:

```js
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
```

Ok, I configured my `S3Client` with my region like so:

```js
const s3Client = new S3Client({ region: 'us-east-1' });
```

And as all my work was in one bucket, I went ahead and hard-coded it like so:

```js
const bucket = 'psapitestrkc';
```

You'll notice I'm not passing any credential information. The SDK can pick up from either a configuration file in your user profile, or environment variables. I'm using `dotenv`, so I set them in `.env`:

```
AWS_ACCESS_KEY_ID=visit_my_amazon_wishlist_or_else
AWS_SECRET_ACCESS_KEY=my_key_is_so_secret_becky
```

Ok, so *all* of the above was about an hour for me. I honestly blame myself, not the AWS docs. The last part was my utility functions:

```js
async function getSignedDownloadUrl(path) {
	let command = new GetObjectCommand({ Bucket: bucket, Key:path });
	return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

async function getSignedUploadUrl(path) {
	let command = new PutObjectCommand({ Bucket: bucket, Key:path });
	return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

I've hard-coded my expiration there, but you could make that dynamic. Once everything up it's trivial as heck, it just took me a while to get here. Here is an example of how I used it in my script:

```js
let inputURL = await getSignedDownloadUrl('input/cats.jpg');
let uploadURL = await getSignedUploadUrl('output/cats_nobg.jpg');
```

This was built for another demo, but I've ripped out that bits and you can see the complete, if useless code below (as it doesn't actually do anything with the URLs):

```js
import 'dotenv/config';

import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ region: 'us-east-1' });
const bucket = 'psapitestrkc';

async function getSignedDownloadUrl(path) {
	let command = new GetObjectCommand({ Bucket: bucket, Key:path });
	return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

async function getSignedUploadUrl(path) {
	let command = new PutObjectCommand({ Bucket: bucket, Key:path });
	return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

(async () => {



	let inputURL = await getSignedDownloadUrl('input/cats.jpg');
	let uploadURL = await getSignedUploadUrl('output/cats_nobg.jpg');

	// This is where I did stuff. Awesome stuff. Honest.

})();
```

Photo by <a href="https://unsplash.com/@dkfra19?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Dimitri Karastelev</a> on <a href="https://unsplash.com/photos/ZH4FUYiaczY?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  