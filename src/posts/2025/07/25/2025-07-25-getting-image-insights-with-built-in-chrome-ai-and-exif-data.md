---
layout: post
title: "Getting Image Insights with Built-in Chrome AI and EXIF Data"
date: "2025-07-25T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_sleeping_map.jpg
permalink: /2025/07/25/getting-image-insights-with-built-in-chrome-ai-and-exif-data
description: A mashup of AI and API techniques to get information about an image.
---

It's been a busy few weeks for Chrome's [Built-in AI](https://developer.chrome.com/docs/ai/built-in) support. Since the last time I blogged about it, four features have gone GA (which still means they are Chrome only but not behind a flag anymore):

* Translator
* Summarizer
* Language Detector
* Prompt API (for extensions only)

And while announced back at the end of May, [Gemma 3n](https://developers.googleblog.com/en/introducing-gemma-3n/) as a model is available in Canary, Dev, and Beta Chrome builds. 

To be clear, the percentage of folks who can use these new features is still *really* low, but all of these features also work really well in progressive enhancement, and can be backed up by server calls to an API if need be. I continue to be really excited about the possibilities these APIs unlock, and thought I'd share a new demo I built. 

Back towards the end of May, I [blogged](https://www.raymondcamden.com/2025/05/22/multimodal-support-in-chromes-built-in-ai) about new multi-modal support in Chrome's Built-in AI. My demo promptly stopped working at some point and I corrected that. You can see this in action in the CodePen below, but keep in mind it still requires flags enabled and such. As always, join the [EPP](https://developer.chrome.com/docs/ai/join-epp?hl=en) for more information. 

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="myePPjN" data-pen-title="MM + AI (Tags) (v2)" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/myePPjN">
  MM + AI (Tags) (v2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

So, that's the updated version of my previous blog post. I know most of you won't be able to run it, but it basically lets you select an image and hit analyze. It uses Chrome's built-in support to figure out what's in the image and return a list of tags. Here's an example:

<p>
<img src="https://static.raymondcamden.com/images/2025/07/mm1.jpg" alt="Demo output showing a beer bottle and the tool reporting on what it found" class="imgborder imgcenter" loading="lazy">
</p>

Cool, so what's the *new* demo I want to share? It occurred to me that these APIs do not need to work in isolation and could be mashed up with others to provide even more value. With this in mind I built a new demo that does the following:

* Get the EXIF data from the image
* Look for longitude and latitude values
* If they exist, pass them to Mapbox's [Reverse Geocoding API](https://docs.mapbox.com/api/search/geocoding/#reverse-geocoding) to get the location
* Join this with what Chrome gets back as well

To do this, I first searched for an EXIF library and found [exif-js](https://github.com/exif-js/exif-js). I found the docs to be a bit lacking, and it doesn't support Promises, but I was able to get around that by wrapping the logic in my own Promise. 

The EXIF information, if it exists, will be in four tags:

* GPSLongitude
* GPSLongitudeRef
* GPSLatitude
* GPSLatitudeRef

The values are in degrees and such, so math has to be done to translate it to decimal values. I also discovered that the library caches EXIF results in the DOM which means manually deleting it if you are using the same image DOM element as my tool uses. Here's my function:

```js
async function getLatLng(img) {
	return new Promise((resolve, reject) => {

		let latitude = '';
		let longitude = '';
		
		delete img.exifdata;
		
		// credit: https://github.com/exif-js/exif-js/issues/49#issuecomment-354615495
		EXIF.getData(img, function() {
			let exifLong = EXIF.getTag(this,"GPSLongitude");
			let exifLongRef = EXIF.getTag(this,"GPSLongitudeRef");
			let exifLat = EXIF.getTag(this,"GPSLatitude"); 
			let exifLatRef = EXIF.getTag(this,"GPSLatitudeRef"); 
			// look for missing data. could reject... but its not really an error
			if(!exifLong || !exifLongRef || !exifLat || !exifLatRef) resolve({});
			if (exifLatRef == "S") {
				latitude = (exifLat[0]*-1) + (( (exifLat[1]*-60) + (exifLat[2]*-1) ) / 3600);						
			} else {
				latitude = exifLat[0] + (( (exifLat[1]*60) + exifLat[2] ) / 3600);
			}

			if (exifLongRef == "W") {
				longitude = (exifLong[0]*-1) + (( (exifLong[1]*-60) + (exifLong[2]*-1) ) / 3600);						
			} else {
				 longitude = exifLong[0] + (( (exifLong[1]*60) + exifLong[2] ) / 3600);
			}
			console.log(new Date(), longitude, latitude);
			resolve({ longitude, latitude });
		});
	});
}
```

If the values exist, I can then pass them to Mapbox's API:

```js
async function reverseGeoCode(lon,lat) {
	let req = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lon}&latitude=${lat}&access_token=pk.eyJ1IjoicmF5bW9uZGNhbWRlbiIsImEiOiJjazNveHcxdnQwM2p0M2JwbnRoNDEwZmNqIn0.hXmayLfRFwaitzK7OCke_A`);
	let result = await req.json();
	// filter to what we need
	return result.features[1].properties.place_formatted;
}
```

Notice that I'm only working with one small part of their API result to keep things simple. 

Alright, so all of the above is now part of my image analyzation routine. This is mostly what the previous blog past had, updated for the most recent updates, and now including my EXIF/ReverseGeoCode call:

```js
async function analyze() {
	$result.innerHTML = '';
	if(!$imgFile.value) return;
	$result.innerHTML = '<i>Working...</i>';
	console.log(`Going to analyze ${$imgFile.value}`);
	let file = $imgFile.files[0];
	
	let location = await getLatLng($imgPreview);
	let locationStr = 'Unable to get location.';
	if(location.longitude) locationStr = await reverseGeoCode(location.longitude, location.latitude);

	let result = await session.prompt([
		{
			role:"user",
			content: [
				{ type: "text", value:"Identify objects found in the image and return an array of tags." },
				{ type:"image", value: file }
			]
		}], { responseConstraint: schema });

	result = JSON.parse(result);
	let tagStr = result.tags.join(', ');
	$result.innerHTML = `
<h2>Image Analysis</h2>
<p>
Location: ${locationStr}<br/>
AI Detected Tags: ${tagStr}
</p>
`;
}
```

There's two things I want to call out here. First, I'm doing my EXIF/Geocode call in a blocking manner, and then the AI call. It would be better if the location stuff and AI stuff both fired and then I used Promise.all to get the results when done. However, in my testing, the EXIF/ReverseGeoCode was done in a split second, incredibly fast, so I figured I wouldn't bother.

Finally, and I've mentioned this before, but Chrome's Built-In AI stuff can be unsupported in the browser, supported and ready to go, or supported but needing to wait for the model to download the first time. My code rarely bothers with the last option and it should in a "real" app. I keep telling myself I'll include that in demos, but honestly, I think I'll wait to worry about that till this is GA. 

So, how does it work? Again, I assume most of you can't run this yet, so here are a few examples:

<p>
<img src="https://static.raymondcamden.com/images/2025/07/mm2.jpg" alt="Sample output" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/07/mm3.jpg" alt="Sample output" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/07/mm4.jpg" alt="Sample output" class="imgborder imgcenter" loading="lazy">
</p>

Here's the complete demo:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="NPGrQaM" data-pen-title="MM + AI (Tags) (v2)" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/NPGrQaM">
  MM + AI (Tags) (v2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

If you've played with these APIs, I'd love to know - leave me a comment below!