---
layout: post
title: "Using the Adobe Photoshop API with ColdFusion"
date: "2023-07-14T18:00:00"
categories: ["coldfusion"]
tags: ["photoshop"]
banner_image: /images/banners/sdk.jpg
permalink: /2023/07/14/using-the-adobe-photoshop-api-with-coldfusion
description: A look at working with the Photoshop API via ColdFusion
---

So yeah, I used to blog quite a bit on ColdFusion (if you want, you can peruse the three thousand posts [here](https://www.raymondcamden.com/categories/coldfusion)), but it's been a while since I've really written any CFML. That being said, I've been working with Adobe's [Photoshop API](https://developer.adobe.com/photoshop/photoshop-api-docs/) recently at work and I thought it would be fun to build a quick ColdFusion wrapper for it. To be fair, I did the bare minimum, but one of my favorite things to do with ColdFusion was build service wrappers and I forgot how much fun that was. Keep in mind, I'm *way* rusty when it comes to CFML so this is probably not "Best Practice", but feel free to take the code and run with it.

Alright, so let's start off by quickly explaining what the [Adobe Photoshop API](https://developer.adobe.com/photoshop/photoshop-api-docs/) is. The API wraps several features of Photoshop (and Lightroom) and lets you build automations around them. So for example, you may want to remove the background of images added to an Azure blob storage and save the results. You may want to take a PSD and generate JPG renditions and modify the text for localized audiences. There are quite a few [features](https://developer.adobe.com/photoshop/photoshop-api-docs/features/) you can use, and even better, it supports working with Photoshop Actions (and JSON actions) for *really* complex workflows. I'll be giving a [free online presentation](https://cfe.dev/events/automating-images-with-photoshop-apis/) early next month if you want a full introduction to it, and if you want, you can read a Node-based introduction blog post I wrote here: [Automating Image Workflows with the Photoshop API](https://medium.com/adobetech/automating-image-workflows-with-the-photoshop-api-f87a3d12e04). There is a free trial that you can [sign up](https://developer.adobe.com/photoshop/api/signup/?ref=signup) for today.

The Photoshop API does not work with local files, only cloud-based storage. This means your assets must be in:

* S3
* Azure
* Dropbox

Technically, *any* public URL for reading is fine. And technically, for output, you can provide any URL, but the API is going to send its bits to it and you would need *something* there to accept the result and store it. In general, most folks will just make use of the options above. 

I use S3 quite a bit, and I also knew ColdFusion has recently improved its cloud service support so I figured it was a good chance to try it out. I was *really* surprised actually. So given that I've got my S3 credentials already, I set this up in my `Application.cfc`:

```javascript
application.awsCred = {
	vendorName:'AWS',
	region:'us-east-1',
	secretAccessKey:system.getProperty('SECRET_ACCESS_KEY'),
	accessKeyId:system.getProperty('ACCESS_KEY_ID')
}

application.s3Conf = {
	serviceName:'S3'
}
```

By the way, I'm using the excellent CommandBox [dotenv](https://www.forgebox.io/view/commandbox-dotenv) package to store my secrets in a `.env` file. That's my usual process in Node and I was happy to see how easy it was with ColdBox. 

Alright, so given this, to generate a read URL for an item in my bucket the code looked like so:

```js
s3Service = getCloudService(application.awsCred, application.s3Conf);

bucket = s3Service.bucket("psapitestrkc");

readUrl = bucket.generateGetPresignedUrl({
	key:'input/cayenne.jpg',
	duration:'1h'
}).url;
```

In this case, I'm getting `cayenne.jpg` under an `input` folder and specifying a one-hour duration. By the way, the ColdFusion docs all say durations are in days, but that's not the case, you can specify durations in different units as I've shown here. 

To test that it worked I did this:

```html
<cfoutput><img src="#readUrl#"></cfoutput>
```

And it worked just fine. (Once I used the right region. Sigh.) 

For my output URL, I just switched to the `PUT` method, again, I'm *really* happy with CF's support for this:

```js
writeUrl = bucket.generatePutPresignedUrl({
	key:'output/cf_cayenne.jpg',
	duration:'1h'
}).url;
```

Alright, so to work with the Photoshop API, it takes a few steps:

* Take my credentials and ask for an access token.
* Generate a job pertaining to a particular feature. Every part of the service will have different inputs and outputs depending on what you are doing, but the process is the same - generate your arguments, and kick off the job on the Adobe side. The result of this is a unique "job url".
* Check the job url for status.

That last part can be a bit tricky. It takes a few seconds for the API to complete its work, and generally, I'd do a "while" loop with a slight delay. Ie, keep checking the job to look for success and failure. I know ColdFusion got improved [async support](https://helpx.adobe.com/coldfusion/using/asynchronous-programming.html) but for today I kept it simple and just checked my job once. 

For my component, I kept it to a grand total of 3 methods:

* Get access token
* Do a [Lightroom AutoTone](https://developer.adobe.com/photoshop/photoshop-api-docs/features/#tag/Lightroom/operation/acrstatus) call
* Get the job status

Let me share the entire CFC and then I'll break it down:

```js
component accessors="true" {

	property name="clientId" type="string";
	property name="clientSecret" type="string";


	function init(clientId, clientSecret) {
		variables.clientId = arguments.clientId;
		variables.clientSecret = arguments.clientSecret;
		return this;
	}

	public function getAccessToken() {
		if(structKeyExists(variables, 'accessToken')) return variables.accessToken;
		var imsUrl = 'https://ims-na1.adobelogin.com/ims/token/v2?client_id=#variables.clientId#&client_secret=#variables.clientSecret#&grant_type=client_credentials&scope=openid,AdobeID,read_organizations';
		var result = '';
		
		cfhttp(url=imsUrl, method='post', result='result') {
			cfhttpparam(type='body', value='');
		};

		result = deserializeJSON(result.fileContent);
		variables.accessToken = result.access_token;
		return variables.accessToken;

	}

	public function createAutoToneJob(input, output, storageType='external', imageType='image/jpeg') {
		var token = getAccessToken();
		var result = '';

		var body = {
			"inputs": {
				"storage":arguments.storageType,
				"href":input
			}, 
			"outputs":[{
				"storage":arguments.storageType, 
				"href":output,
				"type":arguments.imageType
			}]
		};

		cfhttp(url='https://image.adobe.io/lrService/autoTone', method='post', result='result') {
			cfhttpparam(type='header', name='Authorization', value='Bearer #token#'); 
			cfhttpparam(type='header', name='x-api-key', value=variables.clientId); 
			cfhttpparam(type='header', name='Content-Type', value='application/json'); 
			cfhttpparam(type='body', value=serializeJSON(body));
		};

		result = deserializeJSON(result.fileContent);
		// assume it worked! bad idea ;)
		if(structKeyExists(result,'_links')) return result._links.self.href;
		else throw(result);

	}
	
	public function getJob(jobUrl) {
		var token = getAccessToken();
		var result = '';

		cfhttp(url=jobUrl, method='get', result='result') {
			cfhttpparam(type='header', name='Authorization', value='Bearer #token#'); 
			cfhttpparam(type='header', name='x-api-key', value=variables.clientId); 
		};

		result = deserializeJSON(result.fileContent);
		return result;

	}	

}
```

So first off, I built a simple caching system for `getAccessToken` such that it only needs to run once. In cases where you're doing multiple calls, this will speed things up. 

The `createAutoToneJob` method is based on the [API reference](https://developer.adobe.com/photoshop/photoshop-api-docs/api/#tag/Lightroom/operation/autoTone) for the service. I didn't support every part of the API, specifically leaving out `overwrite` and `quality`, but you can see where you pass in the input and output URLs, and that gets passed to the service.

Finally, `getJob` does just that - check the current status of the job. Here's an example of what you get while it's still doing stuff:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/cf1.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

That text may be a bit hard to read, but basically, there is a status key reporting 'pending'. 

So as I said, the 'best' way to use this would be to poll, check for success or error, wait, and poll again. I went a bit lazy and just used CF's `sleep()` method to wait:

```js
psapi = new photoshop(clientId=application.CLIENT_ID, clientSecret=application.CLIENT_SECRET);

joburl = psapi.createAutoToneJob(readUrl, writeUrl);

sleep(3 * 1000);
result = psapi.getJob(joburl);
writedump(result);
```

And that's it! Here's the entirety of my test CFM. The only real change here is that I asked for a 'GET' url for the output as well so I could render it:

```js
<cfscript>
s3Service = getCloudService(application.awsCred, application.s3Conf);

bucket = s3Service.bucket("psapitestrkc");

readUrl = bucket.generateGetPresignedUrl({
	key:'input/cayenne.jpg',
	duration:'1h'
}).url;

writeUrl = bucket.generatePutPresignedUrl({
	key:'output/cf_cayenne.jpg',
	duration:'1h'
}).url;

readResultUrl = bucket.generateGetPresignedUrl({
	key:'output/cf_cayenne.jpg',
	duration:'1h'
}).url;

psapi = new photoshop(clientId=application.CLIENT_ID, clientSecret=application.CLIENT_SECRET);

joburl = psapi.createAutoToneJob(readUrl, writeUrl);

sleep(3 * 1000);
result = psapi.getJob(joburl);
writedump(result);
</cfscript>

<cfoutput>
<h2>Input</h2>
<img src="#readUrl#">

<h2>Output</h2>
<img src="#readResultUrl#">
</cfoutput>
```

Here's the input picture:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/cayenne.jpg" alt="Cayenne, pre-optimization" class="imgborder imgcenter" loading="lazy">
</p>

And here's the result:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/cf_cayenne.jpg" alt="Cayenne, post-optimization" class="imgborder imgcenter" loading="lazy">
</p>

That's it. Remember you can [sign up](https://developer.adobe.com/photoshop/api/signup/?ref=signup) for free and check the [docs](https://developer.adobe.com/photoshop/photoshop-api-docs/) for a lot more information.