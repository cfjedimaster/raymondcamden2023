---
layout: post
title: "Quick Example using Azure's Node.js SDK for Signed URLs"
date: "2024-08-28T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/azure_cat.jpg
permalink: /2024/08/28/quick-example-using-azures-nodejs-sdk-for-signed-urls
description: Some sample code for generating signed URLs for Azure Blob Storage
---

Way back in June (wait, that's only two months ago?) I wrote up a blog post showing how to use the AWS SDK for Signed URLs: ["Quick example using AWS Node.js SDK V3 for Signed URLs"](https://www.raymondcamden.com/2023/06/09/quick-example-using-aws-nodejs-sdk-v3-for-signed-urls). The idea for this was to cover a very specific set of functionality I needed to use along with Adobe's [Firefly Services](https://developer.adobe.com/firefly-services/docs/guides/). Specifically my needs are:

* Create a readable URL for a cloud storage asset
* Create a writable URL for a cloud storage asset
  
And on top of that - also I needed to upload directly to cloud storage. I worked with [Azure Storage Blob SDK](https://www.npmjs.com/package/@azure/storage-blob) and came up with the following functions. Honestly, use this with a grain of salt as it "worked for me", but I can't make any promises about how reliable/safe/etc this code is. That being said, I'd love any comments or suggestions.

## Imports and Connecting

Once I installed the SDK, I began by importing what I needed:

```js
import { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from "@azure/storage-blob";
```

Next, I loaded in my credentials as well as an account and container name. So to be clear, for credentials it's an Azure key that I got from my portal and a connections string. The account name was also from the portal, and finally the container name is the 'bucket' where I'm working. I feel like the connection string could be constructed dynamically, but I hard coded it. All of these values are in my environment:

```js
// Credentials for Azure
const AZURE_ACCOUNTNAME = process.env.AZURE_ACCOUNTNAME;
const AZURE_KEY = process.env.AZURE_KEY;
const AZURE_CONTAINERNAME = process.env.AZURE_CONTAINERNAME;
const AZURE_CONNECTIONSTRING = process.env.AZURE_CONNECTIONSTRING;
```

And finally, I created my client objects:

```js
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTIONSTRING);
const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINERNAME);
```

## Creating Read URLs

To create readable URLs, I used two functions.

```js
function createSASReadString(key, accountName, containerName, duration=5) {
	
	let permissions = new BlobSASPermissions();
	permissions.read = true;

	let currentDateTime = new Date();
	let expiryDateTime = new Date(currentDateTime.setMinutes(currentDateTime.getMinutes()+duration));
	let blobSasModel = {
		containerName,
		permissions,
		expiresOn: expiryDateTime
	};

	let credential = new StorageSharedKeyCredential(accountName,key);
	return generateBlobSASQueryParameters(blobSasModel,credential);

}

function getSignedDownloadUrl(name, key, accountName, containerName) {
	let b = containerClient.getBlockBlobClient(name);
	return b.url + '?' + createSASReadString(key, accountName, containerName);
}
```

Note that `getSignedDownloadUrl` chains to `createSASReadString` and doesn't modify the `duration`, I could update that. And honestly, looking at this now, I think it should be one function. When I was building this, I thought I'd be reusing `createSASReadString` a few times but I don't think I did. You could easily wrap those two together and I may do so in the future.

Using it then is as simple as:

```js
let inputURL = await getSignedDownloadUrl(fileName, AZURE_KEY, AZURE_ACCOUNTNAME, AZURE_CONTAINERNAME);
```

Note that I'm passing in my auth stuff. In that [previous blog post](https://www.raymondcamden.com/2023/06/09/quick-example-using-aws-nodejs-sdk-v3-for-signed-urls) the methods I wrote used the global s3 objects which is "bad", but is simpler as well. I thought the approach above was a bit more generic and pure. 

I don't want to get that caught up in it though - feel free to modify what I build. ;)

## Creating Write URLs

On the flip side, here's the method to create writable URLs. This can be handed off, for example to the Photoshop APIs, and used for outputs.

```js
async function getSignedUploadUrl(name, client, containerName, duration=5) {
	let permissions = new BlobSASPermissions();
	permissions.write = true;

	let currentDateTime = new Date();
	let expiryDateTime = new Date(currentDateTime.setMinutes(currentDateTime.getMinutes()+duration));
	let blobSasModel = {
		containerName,
		permissions,
		expiresOn: expiryDateTime
	};

	let tempBlockBlobClient = client.getBlockBlobClient(name);
	return await tempBlockBlobClient.generateSasUrl(blobSasModel);
}
```

Using it looks like so:

```js
let outputInvertedURL = await getSignedUploadUrl(fileName, containerClient, AZURE_CONTAINERNAME);
```

### Uploading to Azure

Normally I didn't have to worry about uploading to Azure. If I made an upload URL and the API used it, then I didn't need to worry about it. But I was curious how it would work. My 'usual' upload code failed because Azure requires a special header. Here's the function:

```js
async function uploadFile(url, filePath) {
	let size = fs.statSync(filePath).size;

	await fetch(url, {
		method:'PUT', 
		headers: {
			'Content-Type':'image/*',
			'Content-Length':size,
			'x-ms-blob-type':'BlockBlob'
		},
		body: fs.readFileSync(filePath)
	});

}
```

That `x-ms-blob-type` is the special header you need. Also note I've hard coded an image content-type. You could make that an argument or get the value dynamically.

Using it just requires the URL, which you get from the previous method, and a file path:

```js
// sourceInput is something like ./cats_rules.jpg'
let fileName = sourceInput.split('/').pop();
let uploadURL = await getSignedUploadUrl(fileName, containerClient, AZURE_CONTAINERNAME);
await uploadFile(uploadURL, sourceInput);
```

That's it. I hope this helps because this post is the post I wish I had found when I started. ;)

