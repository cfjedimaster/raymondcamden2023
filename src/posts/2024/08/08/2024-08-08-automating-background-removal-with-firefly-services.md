---
layout: post
title: "Automating Background Removal with Firefly Services"
date: "2024-08-08T18:00:00"
categories: ["development"]
tags: ["generative ai","adobe"]
banner_image: /images/banners/cat_green_screen.jpg
permalink: /2024/08/08/automating-background-removal-with-firefly-services
description: A look at how to automate Firefly Services APIs for background removal.
---

As a quick FYI, if you would rather skip reading my text and jump to a video, I've got one at the end of this post. Be my guest to scroll down and watch that instead. One of the most interesting aspects of [Adobe Firefly Services](https://developer.adobe.com/firefly-services/) is what it enables in the automation space. I think it's fair to say that these automations will still be followed up by a human checking, tweaking, and adjusting results, but if the APIs can save a significant amount of time, that's got to be a great benefit. Let me demonstrate one simple example of this - removing background images at scale.

## The Remove Background API

The [Remove Background API](https://developer.adobe.com/firefly-services/docs/photoshop/api/photoshop_removeBackground/) is part of the Photoshop API family and handles the job of figuring out the main subject of a picture and removing the background around it. 

This API, like the others in the Photoshop set of operations, requires cloud storage. For my testing, I'm using Dropbox, but you could use AWS S3 or Azure as well. Note that if you aren't using cloud storage for your assets, this does mean you will need to, at least temporarily. So for example, you could copy a file to a specific folder in your cloud storage, do the processing, and then download (and probably delete) the output.

Here's a sample body showing the minimum amount of values:

```json
{
  "input": {
    "href": "A signed URL",
    "storage": "dropbox"
  },
  "output": {
    "href": "Another signed URL",
    "storage": "dropbox",
    "overwrite": true
  }
}
```

Photoshop APIs also return a `Job` when you begin the process. This `Job` is a URL you can check for the latest status of the operation. Here's an example:

```json
{
  "_links": {
    "self": {
      "href": "https://image.adobe.io/sensei/status/<:jobId>"
    }
  }
}
```

## Version One - Node.js

For the first version, I'm going to demonstrate a script that uses a specific input and output. I'm using Node.js, but obviously, any language that could make an HTTP request would be fine. (Hey, someone write a Perl script, please?)

I'm going to start off with the main part of the program, and then flesh out the functions these lines are calling:

```js
let inputURL = await getSignedDownloadUrl('/RemoveBGProcess/input/raymond-camden-high.jpg');
console.log('Got signed URL to read our input image.');

let outputURL = await getSignedUploadUrl('/RemoveBGProcess/output/raymond-camden-high.jpg');
console.log('Got signed URL for our output.');

let token = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
console.log('Got token for Firefly Services');

let bgJob = await removeBG(inputURL, outputURL, CLIENT_ID, token);
console.log('Created Remove BG Job, will now start checking status...')

let result = await pollJob(bgJob['_links'].self.href, CLIENT_ID, token);
console.log('Done and assuming success', result);
```

From the top, I begin by getting a readable link to my input on Dropbox and then a writeable link to the output location.

After that, I exchange my Firefly credentials for an access token, create the "remove background job", and then poll the job.

Process-wise, that's the entire thing. Some error handling would surely be nice, but who has time for that these days?

Ok, let's hop back up to the top:

```js
import { Dropbox } from 'dropbox';

// Credentials for Firefly Services
let CLIENT_ID = process.env.CLIENT_ID;
let CLIENT_SECRET = process.env.CLIENT_SECRET;

// Credentials for Dropbox
let DB_APP_KEY = process.env.DROPBOX_APP_KEY;
let DB_APP_SECRET = process.env.DROPBOX_APP_SECRET;
let DB_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;

// Initialize Dropbox access
let dbx = new Dropbox({
	clientId:DB_APP_KEY,
	clientSecret:DB_APP_SECRET,
	refreshToken:DB_REFRESH_TOKEN
});
```

First thing I do is read in my credentials and initialize the Dropbox Node SDK. Speaking of Dropbox, the next two functions are how I generate the URLs:

```js
async function getSignedDownloadUrl(path) {
	return (await dbx.filesGetTemporaryLink({path})).result.link;
}

async function getSignedUploadUrl(path) {
	return (await dbx.filesGetTemporaryUploadLink({commit_info: {path}})).result.link;
}
```

Next up is the Firefly authentication routine - all Firefly services, whether GenAI related, Photoshop, or Lightroom, use the same auth:

```js
async function getAccessToken(id, secret) {

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

Next up is the API call to generate the job. Outside of authentication, this only cares about the input and output:

```js
async function removeBG(input, output, id, token) {

	let data = {
		"input": {
			"href": input,
			"storage": "dropbox"
  		},
		"output": {
		    "href": output,
		    "storage": "dropbox",
    		"overwrite": true
		}
	};

	let resp = await fetch('https://image.adobe.io/sensei/cutout', {
		method: 'POST', 
		headers: {
			'Authorization':`Bearer ${token}`,
			'x-api-key': id
		}, 
		body: JSON.stringify(data)
	});

	return await resp.json();

}
```

Finally, here's the code that handles polling the job URL:

```js
async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, x);
	});
}

async function pollJob(jobUrl, id, token) {
	let status = '';

	while(status !== 'succeeded' && status !== 'failed') {

		let resp = await fetch(jobUrl, {
			headers: {
				'Authorization':`Bearer ${token}`,
				'x-api-key': id
			}
		});

		let data = await resp.json();
		if(data.status) status = data.status;
		if(status !== 'succeeded' && status !== 'failed') await delay(1000);
	}

	return status;

}
```

And that's it. Given this input:

<p>
<img src="https://static.raymondcamden.com/images/2024/08/ps1.jpg" alt="Photo of the author, close up on face, back when he was skinny and not so dumpling shaped" class="imgborder imgcenter" loading="lazy">
</p>

The output is this:

<p>
<img src="https://static.raymondcamden.com/images/2024/08/ps1.jpg" alt="Photo of the author with the background removed. Still way skinnier than he is now." class="imgborder imgcenter" loading="lazy">
</p>

If you want the entire script, you can find it here: <https://github.com/cfjedimaster/fireflyapi/blob/main/demos/remove_bg_scale/demo.mjs>

## Version Two - Automation via Pipedream

For the automated version, I'll be using [Pipedream](https://pipedream.com) once again. My automation is a grand total of six steps. 

<p>
<img src="https://static.raymondcamden.com/images/2024/08/ps4.jpg" alt="Screenshot of workflow showing each individual step" class="imgborder imgcenter" loading="lazy">
</p>

I begin with a trigger that fires when Dropbox gets a new file. This is built-in to Pipedream so literally all I had to do was select the folder.

<p>
<img src="https://static.raymondcamden.com/images/2024/08/ps3.jpg" alt="Dropbox trigger noting when a file is added to /RemoveBGProcess, recursive setting set to true, include link set to true" class="imgborder imgcenter" loading="lazy">
</p>

There are three important bits above:

* Notice that the folder is `/RemoveBGProcess`. Unfortunately, I could not select the exact folder I wanted, `/RemoveBGProcess/input`. I don't know if that's an issue in the Pipedream trigger or the Dropbox API. But I handle that next so it isn't a big deal.
* Because I couldn't specify the exact folder, I set `Recursive` to true so it would pick up files added to `input`.
* Because I'm going to need to read the files, I set `Include Link` to true. 

The next step of my process is a code step that handles the issue I noted above:

```js
export default defineComponent({
  async run({ steps, $ }) {
    if(steps.trigger.event.path_lower.includes('/output')) {
      $.flow.exit('Not doing output processing.');
    }
    return;
  },
})
```

Now I need to generate the path for my output. Luckily, this is just replacing `input` with `output`:

```js
export default defineComponent({
  async run({ steps, $ }) {
    // Reference previous step data using the steps object and return data to use it in future steps
    return steps.trigger.event.path_lower.replace('/input','/output');
  },
})
```

Now that I know the path for my output, I need to generate a writable link to it. Pipedream doesn't have a built-in action for it, but it does have a "Run any Dropbox API" step. This handles authentication for me and lets me just write code against their REST API:

```js
import { axios } from "@pipedream/platform"
export default defineComponent({
  props: {
    dropbox: {
      type: "app",
      app: "dropbox",
    }
  },
  async run({steps, $}) {
    
    const data = {
      "commit_info":{
        "path": steps.generate_output_path.$return_value
      }
    };
    
    return await axios($, {
      method: "post",
      url: `https://api.dropboxapi.com/2/files/get_temporary_upload_link`,
      headers: {
        Authorization: `Bearer ${this.dropbox.$auth.oauth_access_token}`,
        "Content-Type": `application/json`,
      },
      data,
    })
  },
})
```

That covers the Dropbox aspects and next, I switch to Firefly and the Photoshop API. First is a step to get my access token:

```js
export default defineComponent({
  async run({ steps, $ }) {

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.FFS_CLIENT_ID);
    params.append('client_secret', process.env.FFS_CLIENT_SECRET);
    params.append('scope', 'openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis');
    
    let resp = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', 
      { 
        method: 'POST', 
        body: params
      }
    );
    
    let data = await resp.json();
    return data.access_token; 
  
  },
})
```

Finally, I kick off the job:

```js
export default defineComponent({
  async run({ steps, $ }) {

  	let data = {
  		"input": {
  			"href": steps.trigger.event.link,
  			"storage": "dropbox"
    		},
  		"output": {
  		    "href": steps.get_dropbox_upload_url.$return_value.link,
  		    "storage": "dropbox",
      		"overwrite": true
  		}
  	};

  	let resp = await fetch('https://image.adobe.io/sensei/cutout', {
  		method: 'POST', 
  		headers: {
  			'Authorization':`Bearer ${steps.get_access_token.$return_value}`,
  			'x-api-key': process.env.FFS_CLIENT_ID
  		}, 
  		body: JSON.stringify(data)
  	});
  
  	return await resp.json();  
  
  },
})
```

Now, my automation ends here and you could rightly say I should have code to handle checking the results. I could add one more code step with my 'poll' and 'delay' methods. For now, I'm keeping it nice and simple.

This workflow can be found here: <https://github.com/cfjedimaster/General-Pipedream-Stuff/tree/production/remove-backgrounds-at-scale-p_gYC1GJp>

## The Made for TV Version

If you want to see the above workflow in action along with the Node script as well, enjoy this yummy video below:

{% liteyoutube "dCDZula-6hg" %}
