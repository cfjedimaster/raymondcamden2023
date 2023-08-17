---
layout: post
title: "ColdFusion Component for Adobe Acrobat Services"
date: "2023-08-17T18:00:00"
categories: ["coldfusion"]
tags: ["adobe"]
banner_image: /images/banners/sdk.jpg
permalink: /2023/08/17/coldfusion-component-for-adobe-acrobat-services
description: A ColdFusion Component for Acrobat Services is now available on GitHub.
---

Last month, I wrote up a [post](https://www.raymondcamden.com/2023/07/21/integrating-acrobat-services-with-coldfusion) demonstrating how to use [Adobe Acrobat Services](https://developer.adobe.com/document-services/homepage) with ColdFusion. This week I took some of the code I had written for that post and turned it into a proper GitHub project. You can find the latest code here: <https://github.com/cfjedimaster/coldfusion-cfc-acrobat-services>

To use this, you'll need [credentials](https://acrobatservices.adobe.com/dc-integration-creation-app-cdn/main.html), which you can get and use for free for up to 500 transactions. (The [docs](https://developer.adobe.com/document-services/docs/overview/) go into detail about how that works.) 

Currently I only have a subset of our APIs supported, but I plan to hit most of the rest in the next day or so. To give you an example of how it works, here's a sample that uses our [Extract API](https://developer.adobe.com/document-services/apis/pdf-extract/).

First, you instantiate the component with your credentials. You would probably do this in your `Application.cfc` file instead of in one particular file.

```js
asService = new acrobatservices(clientId=application.CLIENT_ID, clientSecret=application.CLIENT_SECRET);
```

Next, you can upload the PDF:

```js
docpath = expandPath('../sourcefiles/adobe_security_thing.pdf');


asset = asService.createAsset(docpath);
```

And then you simply kick off the Extract job:

```js
pollLocation = asService.createExtractJob(asset);
```

This returns a 'job' object that contains a URL you can check for status. I used a simple `while` loop for that:

```js
done = false;
while(!done) {
	job = asService.getJob(pollLocation);
	writedump(var=job, label="Latest job status");

	if(job.status == 'in progress') {
		sleep(2 * 1000);
	} else done = true;

}
```

In the end, the `job` variable will contain two things - a link to the JSON output and a link to a zip file that contains any extract tables, images, and the JSON as well. Downloading the JSON is as simple as:

```js
jsonpath = expandPath('../output/extract.json');
asService.downloadAsset(job.content, jsonpath);
```

Or, if you don't need to keep it (which, I would, because why process it more than once, but you do you), you can HTTP the JSON and work with it. Here's an example of that:

```js
cfhttp(url=job.content.downloadUri, result="jsonRequest");
jsonResult = deserializeJSON(jsonRequest.filecontent);

// lets demo showing the headers
headers = jsonResult.elements.reduce((value, element) => {
	if(element.Path.find('H1')) value.append(element.Text);
	return value;
}, []);
```

This returns an array of headers that would be a useful summary for a PDF. 

Anyway, I hope this is helpful to folks. I will remind everyone that my ColdFusion skills are perhaps a bit rusty so PRs are *absolutely* welcome at <https://github.com/cfjedimaster/coldfusion-cfc-acrobat-services>.
