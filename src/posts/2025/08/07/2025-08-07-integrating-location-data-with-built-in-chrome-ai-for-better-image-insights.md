---
layout: post
title: "Integrating Location Data with Built-in Chrome AI for Better Image Insights"
date: "2025-08-07T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_table.jpg
permalink: /2025/08/07/integrating-location-data-with-built-in-chrome-ai-for-better-image-insights
description: An update to my Chrome AI post integrating location data with AI insights
---

A few weeks ago, I shared an interesting demo that [integration location and AI analysis](https://www.raymondcamden.com/2025/07/25/getting-image-insights-with-built-in-chrome-ai-and-exif-data) of images using [Chrome's Built-in AI](https://developer.chrome.com/docs/ai/built-in) support and [Mapbox's Revervse Geocoding API](https://docs.mapbox.com/api/search/geocoding/#reverse-geocoding). The idea was rather simple - let the user select an image and then:

* Run one API call to Mapbox to get the location, if possible, via EXIF information.
* Ask Chrome to analyze the image for items with in it, returned as a list of tags.

You can see the full code plus more explanation on that [previous post](https://www.raymondcamden.com/2025/07/25/getting-image-insights-with-built-in-chrome-ai-and-exif-data), but today I want to share a very cool follow-up suggested by [Thomas Steiner](https://blog.tomayac.com/) on the Chrome team. 

His suggestion was to see if using the location information could improve the prompt. So to be clear, instead of simply reporting the location and a list of tags, use the location itself in the prompt. 

Here's my updated demo that does just that. Now, for this demo, I wanted specifically to see the *improvement*, if any, so I actually run a first pass with Chrome's AI and a second pass if location information was found. Usually I'd just report the best set of tags possible, but for this I'll show both. 

Again, I imagine most of my readers won't be able to run these demos, so here's a few examples of how well this works (spoiler, pretty dang well):

<p>
<img src="https://static.raymondcamden.com/images/2025/08/imgl.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/08/imgl2.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

These first two represent shots I took in Europe, and the location-based prompt was able to tell me the name of the buildings, which is pretty cool. 

<p>
<img src="https://static.raymondcamden.com/images/2025/08/imgl3.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

This last test was pretty interesting. It didn't really get the 'name' per se, "superdome" is returned in both cases but not "Superdome" which feels like it would be more right, but notice how it recognized it as a sports event which is spot on. 

Ok, so the code, and again, in a real application I'd not bother showing both outputs, just the best. I'll share just the JavaScript as the HTML/CSS is pretty minimal:

```js

let $imgFile, $imgPreview, $result;
let session;

async function canDoIt() {
	if(!window.LanguageModel) return false;
	return (await LanguageModel.availability({expectedInputs:[{type:'image'}]})) === 'available';
}

document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	$result = document.querySelector('#result');

	let canWe = await canDoIt();
	if(!canWe) {
		$result.innerHTML = "Sorry, you can't run this demo.";
		return;
	}

	session = await LanguageModel.create({
	  expectedInputs:[{type: 'image'}]
	});

	$imgFile = document.querySelector('#imgFile');
	$imgPreview = document.querySelector('#imgPreview');
	$imgFile.addEventListener('change', doPreview, false);

	document.querySelector('#analyze').addEventListener('click', analyze, false);
}

async function doPreview() {
	$result.innerHTML = '';
	$imgPreview.src = null;
	if(!$imgFile.files[0]) return;
	let file = $imgFile.files[0];
	
	$imgPreview.src = null;
	let reader = new FileReader();
	reader.onload = e => $imgPreview.src = e.target.result;
	reader.readAsDataURL(file);

}

const schema = {
	type:"object", 	
	required: ["tags"],
	additionalProperties: false, 
	properties: {
		tags: {
			description:"Items found in the image",
			type:"array",
			items: {
				type:"string"
			}
		}
	}
};

async function analyze() {
	$result.innerHTML = '';
	if(!$imgFile.value) return;
	$result.innerHTML = '<i>Working...</i>';
	console.log(`Going to analyze ${$imgFile.value}`);
	let file = $imgFile.files[0];

	let prompt = 'Identify objects found in the image and return an array of tags.';
	
	/*
	First, we get the tags w/o location info, so we can compare.
	*/
	let result = await session.prompt([
		{
			role:"user",
			content: [
				{ type: "text", value:prompt },
				{ type:"image", value: file }
			]
		}], { responseConstraint: schema });

	result = JSON.parse(result);
	let tagStr = result.tags.join(', ');
	
	$result.innerHTML = `
	<h2>Image Analysis</h2>
	<p>
	Tags without location: ${tagStr}<br/>`;
	
	let location = await getLatLng($imgPreview);
	let locationStr = 'Unable to get location.';
	if(location.longitude) {
		locationStr = await reverseGeoCode(location.longitude, location.latitude);
		prompt += ` Use this photos location to help determine what is in the photo: ${locationStr}`;

		result = await session.prompt([
		{
			role:"user",
			content: [
				{ type: "text", value:prompt },
				{ type:"image", value: file }
			]
		}], { responseConstraint: schema });

		result = JSON.parse(result);
		tagStr = result.tags.join(', ');
		$result.innerHTML += `
		Found location: ${locationStr}<br>
		Tags with location: ${tagStr}`;
	}

}

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

async function reverseGeoCode(lon,lat) {
	let req = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lon}&latitude=${lat}&access_token=pk.eyJ1IjoicmF5bW9uZGNhbWRlbiIsImEiOiJjazNveHcxdnQwM2p0M2JwbnRoNDEwZmNqIn0.hXmayLfRFwaitzK7OCke_A`);
	let result = await req.json();
	// filter to what we need
	return result.features[1].properties.place_formatted;
}
```

The important bit is where we modify the prompt if a location was found. The original prompt is:

"Identify objects found in the image and return an array of tags."

The "improved" prompt is:

"Identify objects found in the image and return an array of tags. Use this photos location to help determine what is in the photo: ${locationStr}"

I'm seeing now I forgot the apostrophe, but thankfully AI is forgiving. You can see the complete demo below, but be sure to test with Chrome and the proper flags and such enabled:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="QwjKjVg" data-pen-title="MM + AI (Tags + Location Info + Use it in prompt)" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/QwjKjVg">
  MM + AI (Tags + Location Info + Use it in prompt)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

I'm 100% going to keep iterating on this and if you've got any suggestions, leave me a comment below!

Photo by <a href="https://unsplash.com/@memoriasdajana?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Janayara Machado</a> on <a href="https://unsplash.com/photos/siamese-cat-peeping-near-edge-of-table-4VOJPlcMPX4?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      