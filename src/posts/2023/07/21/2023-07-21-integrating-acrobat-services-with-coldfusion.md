---
layout: post
title: "Integrating Acrobat Services with ColdFusion"
date: "2023-07-21T18:00:00"
categories: ["coldfusion"]
tags: ["adobe"]
banner_image: /images/banners/sdk.jpg
permalink: /2023/07/21/integrating-acrobat-services-with-coldfusion
description: A look at integrating Adobe's Acrobat Services with ColdFusion
---

Last week I shared a look at how to integrate the [Adobe Photoshop API with ColdFusion](https://www.raymondcamden.com/2023/07/14/using-the-adobe-photoshop-api-with-coldfusion), and that got me itching to see how difficult it would be to do the same with our [Acrobat Services](https://developer.adobe.com/document-services/homepage). While ColdFusion has native PDF features built-in, I think there are aspects of the platform that may be of use to CF developers. 

## The Acrobat Services Platform 

Let's start by briefly describing what Acrobat Services are. At a high level, they're all about document management via APIs. Broadly the services are categorized like so:

* [PDF Services](https://developer.adobe.com/document-services/apis/pdf-services/) - this is the "catch-all" bucket of services that do simple things like converting to and from PDFs, splitting, merging, and so forth. This group is probably the *least* useful to Adobe ColdFusion developers as the native capabilities are pretty similar. 
* [PDF Accessibility Auto-Tag API](https://developer.adobe.com/document-services/apis/pdf-accessibility-auto-tag/) - this service helps make PDFs more accessible by finding content to tag. It identifies reading order, tags tables, text, lists and so forth, and even gives you a report when done. This is *not* meant to be a "one-stop" accessibility solution, but rather help do a large percentage of the grunt work for you. 
* [PDF Extract](https://developer.adobe.com/document-services/apis/pdf-extract/) - this uses Adobe Sensei AI to analyze and extract a PDF. It intelligently handles complex document structures and can also return tabular data in CSV or Excel formats. It even extracts images. 
* [Sign API](https://developer.adobe.com/document-services/apis/sign-api/) - for document signing and tracking purposes. This is *really* powerful but I've not dug terribly deep into it.
* [PDF Embed API](https://developer.adobe.com/document-services/apis/pdf-embed/) - a handy JavaScript library for rendering PDFs on your web page. You have much more control over the flow and integration versus "built-in" PDF viewers in browsers.
* [Document Generation API](https://developer.adobe.com/document-services/apis/doc-generation/) - probably my favorite feature, and what I'm using today in my demo, so let me go into detail below.

Note that all of these services are available now **for free** with 500 document transactions per month. SDKs are available for Java, .NET, Node, and Python. There's also a powerful REST API I'll be making use of in my demo. In the past, I've recommended the *excellent* [Java SDK wrapper](https://github.com/tonyjunkes/pdfservices-java-sdk-cfml-samples) built by Tony Junkes. It handled some conflicts between our Java SDK and ColdFusion. Now however I'd recommend just hitting up the [REST API](https://developer.adobe.com/document-services/docs/apis/). 

## Document Generation

Put simply, [Document Generation](https://developer.adobe.com/document-services/apis/doc-generation/) let's you create a template in Microsoft Word. You then send that template to our API along with your data, and you get a custom PDF (or Word doc) out of it. Here's an incredibly simple example. Imagine this Word doc:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/acf1.jpg" alt="Word template sample" class="imgborder imgcenter" loading="lazy">
</p>

See the various code-like-looking things in there? Each of these will be parsed by the API when you send your data. You can do simple variable replacements, conditional logic, and even looping. In the example above it's just a list, but you can create dynamic tables. Dynamic images are supported as well. 

We've got an [online playground](https://acrobatservices.adobe.com/dc-docgen-playground/index.html) where you can test it out, and even a Word Add-In to make it easier for non-developers to test.

Given the Word template above, imagine this data:

```js
{
"name":"Raymond", 
"state":"Louisiana",
"skills": [
	{
		"name": "cats"
	},
	{
		"name": "star wars"
	}
]
}
```

You get this output (and I'm using PDF Embed here as an example):

<div id="adobe-dc-view" style="height: 600px; width: 100%"></div>
<script src="https://acrobatservices.adobe.com/view-sdk/viewer.js"></script>
<script type="text/javascript">
let localhost = '9861538238544ff39d37c6841344b78d';
let prod = '33f07f2305444579a56b088b8ac1929e';
let key = document.location.host.indexOf('raymondcamden.com')>0?prod:localhost;
document.addEventListener("adobe_dc_view_sdk.ready", function(){
var adobeDCView = new AdobeDC.View({clientId: key, divId: "adobe-dc-view"});
adobeDCView.previewFile({
content:{ location:
{ url: "https://static.raymondcamden.com/images/2023/07/document.pdf"}},
metaData:{fileName: "document.pdf"}
},
{
embedMode: "FULL_WINDOW"
});
});
</script>

As I said, this is rather simple and you can absolutely build more complex templates, but it gives you an idea. 

## Using the REST API

In order for us to use this in ColdFusion and make use of the [REST API](https://developer.adobe.com/document-services/docs/apis/), all of the services follow the same basic pattern:

* Use your credentials (in my case, the newer OAuth credentials) and ask for an access token. This is the *exact* same code I used in my [last post](https://www.raymondcamden.com/2023/07/14/using-the-adobe-photoshop-api-with-coldfusion)
* Ask the API to make an asset. This requires you to tell it the type of the file.
* Upload the asset. In our case, the Word doc.
* Create a job. Each API has different inputs and requirements.
* Check the job to see if it's done.
* When done, save the file.

Document Generation is a *bit* different in that it recently added additional support for SharePoint and S3. Soon all the services will support this. For now, though I'm going to use a local file for my testing.

## Our Demo

For this demo, I'm going to automate the process of creating offer letters for prospective job candidates. The data will be stored in a simple MySQL table. Here's my Word template:

<p>
<img src="https://static.raymondcamden.com/images/2023/07/acf2.jpg" alt="Offer letter template" class="imgborder imgcenter" loading="lazy">
</p>

I've got tokens for first and last names, salary, and a conditional piece of logic based on where they live. Also, note the use of `$formatNumber`. The template language used in Document Generation is [JSONata](https://jsonata.org/) and while not everything is supported, you can use many of the formatting functions. 

Now let's consider the code. As a reminder, my CFML is quite rusty, so probably don't consider this 'best practice' ColdFusion. 

First, I grab the data:

```html
<cfquery name="prospectives" datasource="demo">
select id, firstName, lastName, position, salary, state from prospectives
</cfquery>
```

The rest of the code is in a CFSCRIPT block I won't type in here. Let's create a variable pointing to the Word doc:

```js
docpath = expandPath('./offer.docx');
```

Next I'll make an instance of my CFC:

```js
asService = new acrobatservices(clientId=application.CLIENT_ID, clientSecret=application.CLIENT_SECRET);
```

Note I'm passing in my OAuth credentials here. 

For Acrobat Services, the files you upload are stored for 24 hours. These are secured and even we don't have access to them. You can delete them as well if you want. For our case though we can use this to upload the Word document and use it for our data.

```js
asset = asService.createAsset(docpath);
writeoutput('<p>Uploaded asset id is #asset#</p>');
```

Next, I loop over my query:

```js
for(person in prospectives) {

// stuff here...
}
```

Inside the loop, I first do a bit of data manipulation. The case of my JSON data has to match the case in the Word document. So I handle that here:

```js
/*
Case matters for Document Generation, so let's 'reshape' person
*/
personOb = {
	"firstName": person.firstName, 
	"lastName": person.lastName, 
	"position": person.position,
	"salary": person.salary, 
	"state": person.state
}
```

I then create the job:

```js
pollLocation = asService.createDocGenJob(asset, personOb);
writeoutput('<p>Location to poll is #pollLocation#</p>');
```

And then poll in a delayed loop. Note the utter lack of error handling here. I'm a 10X developer.

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

When done, I then save the PDF:

```js
// assume good
pdfpath = expandPath('./result#person.id#.pdf');
asService.downloadAsset(job.asset, pdfpath);
```

Notice that I'm using the primary key from the database to create unique filenames. I could also email this to the prospective as well. 

Here's an example result:

<div id="adobe-dc-view-2" style="height: 600px; width: 100%"></div>
<script type="text/javascript">
document.addEventListener("adobe_dc_view_sdk.ready", function(){
var adobeDCView2 = new AdobeDC.View({clientId: key, divId: "adobe-dc-view-2"});
adobeDCView2.previewFile({
content:{ location:
{ url: "https://static.raymondcamden.com/images/2023/07/result2.pdf"}},
metaData:{fileName: "result2.pdf"}
},
{
embedMode: "FULL_WINDOW"
});
});
</script>

Cool, now let's look at the CFC. The beginning is very similar to the Photoshop one I shared last week:


```js
component accessors="true" {

	property name="clientId" type="string";
	property name="clientSecret" type="string";

	variables.REST_API = "https://pdf-services.adobe.io/";

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
```

As mentioned above, the process of uploading an asset is two steps. Create the asset record, which will give you an ID and URL, and then upload it. We can make that easier, right? So here's one method for it:


```js
/*
I wrap the logic of creating and uploading an asset path
*/
public function createAsset(path) {
	var result = '';
	var token = getAccessToken();
	var mimeType = fileGetMimeType(arguments.path);

	var body = {
		"mediaType": mimeType
	};
	body = serializeJSON(body);

	cfhttp(url=REST_API & '/assets', method='post', result='result') {
		cfhttpparam(type='header', name='Authorization', value='Bearer #token#'); 
		cfhttpparam(type='header', name='x-api-key', value=variables.clientId); 
		cfhttpparam(type='header', name='Content-Type', value='application/json'); 
		cfhttpparam(type='body', value=body);
	}
	var assetInfo = deserializeJSON(result.fileContent);

	cfhttp(url=assetInfo.uploadUri, method='put', result='result') {
		cfhttpparam(type='body', value=fileReadBinary(arguments.path));
		cfhttpparam(type='header', name='Content-Type', value=mimeType); 
	}

	if(result.responseheader.status_code == 200) return assetInfo.assetID;
	else throw('Unknown error');
}
```

Creating the Document Generation job is just a matter of passing in the data and crafting the API response. My method supports a `fragments` argument I didn't go into, but you can consider it like a 'snippets' list of token shortcuts for more advanced usage.

```js
public function createDocGenJob(assetID, data, fragments={}, outputformat="pdf") {
	var token = getAccessToken();
	var result = '';

	var body = {
		"assetID":arguments.assetID,
		"outputFormat":arguments.outputformat, 
		"jsonDataForMerge":arguments.data,
		"fragments":arguments.fragments
	};

	cfhttp(url=REST_API & '/operation/documentgeneration', method='post', result='result') {
		cfhttpparam(type='header', name='Authorization', value='Bearer #token#'); 
		cfhttpparam(type='header', name='x-api-key', value=variables.clientId); 
		cfhttpparam(type='header', name='Content-Type', value='application/json'); 
		cfhttpparam(type='body', value=serializeJSON(body));
	};

	if(result.responseheader.status_code == 201) return result.responseheader.location;
	else throw('Unknown error');

}
```

Checking the job is the same code as before, but note the 'shape' of the job result isn't the same.

```js
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
```

And then finally, the download method:

```js
public function downloadAsset(assetOb, path) {
	var result = "";
	var dir = getDirectoryFromPath(arguments.path);
	var filename = getFileFromPath(arguments.path);
	cfhttp(method="get", url=arguments.assetOb.downloadUri, getasbinary=true, result="result", path=dir, file=filename);
}
```

And that's it! If you've got any questions about this, reach out, and here's the complete CFC you can copy and paste.

```js
component accessors="true" {

	property name="clientId" type="string";
	property name="clientSecret" type="string";

	variables.REST_API = "https://pdf-services.adobe.io/";

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

	/*
	I wrap the logic of creating and uploading an asset path
	*/
	public function createAsset(path) {
		var result = '';
		var token = getAccessToken();
		var mimeType = fileGetMimeType(arguments.path);

		var body = {
			"mediaType": mimeType
		};
		body = serializeJSON(body);

		cfhttp(url=REST_API & '/assets', method='post', result='result') {
			cfhttpparam(type='header', name='Authorization', value='Bearer #token#'); 
			cfhttpparam(type='header', name='x-api-key', value=variables.clientId); 
			cfhttpparam(type='header', name='Content-Type', value='application/json'); 
			cfhttpparam(type='body', value=body);
		}
		var assetInfo = deserializeJSON(result.fileContent);

		cfhttp(url=assetInfo.uploadUri, method='put', result='result') {
			cfhttpparam(type='body', value=fileReadBinary(arguments.path));
			cfhttpparam(type='header', name='Content-Type', value=mimeType); 
		}

		if(result.responseheader.status_code == 200) return assetInfo.assetID;
		else throw('Unknown error');
	}

	public function downloadAsset(assetOb, path) {
		var result = "";
		var dir = getDirectoryFromPath(arguments.path);
		var filename = getFileFromPath(arguments.path);
		cfhttp(method="get", url=arguments.assetOb.downloadUri, getasbinary=true, result="result", path=dir, file=filename);
	}

	public function createDocGenJob(assetID, data, fragments={}, outputformat="pdf") {
		var token = getAccessToken();
		var result = '';

		var body = {
			"assetID":arguments.assetID,
			"outputFormat":arguments.outputformat, 
			"jsonDataForMerge":arguments.data,
			"fragments":arguments.fragments
		};

		cfhttp(url=REST_API & '/operation/documentgeneration', method='post', result='result') {
			cfhttpparam(type='header', name='Authorization', value='Bearer #token#'); 
			cfhttpparam(type='header', name='x-api-key', value=variables.clientId); 
			cfhttpparam(type='header', name='Content-Type', value='application/json'); 
			cfhttpparam(type='body', value=serializeJSON(body));
		};

		if(result.responseheader.status_code == 201) return result.responseheader.location;
		else throw('Unknown error');

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

