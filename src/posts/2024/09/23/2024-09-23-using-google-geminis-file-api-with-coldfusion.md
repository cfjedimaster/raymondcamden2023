---
layout: post
title: "Using Google Gemini's File API with ColdFusion"
date: "2024-09-23T18:00:00"
categories: ["coldfusion"]
tags: ["generative ai"]
banner_image: /images/banners/cat_on_papers.jpg
permalink: /2024/09/23/using-google-geminis-file-api-with-coldfusion
description: How to use the Gemini File API via ColdFusion
---

I promise, I'm not turning this back into a ColdFusion blog, but as I prepare my presentation next week at [Summit](https://cfsummit.adobeevents.com/) and update my Google Gemini code for some ColdFusion demos, I ran into a particularly gnarly bit that I wanted to share in a post. For the most part, I've had no issues using Gemini's [REST APIs](https://ai.google.dev/api?lang=node) in ColdFusion, but the [File API](https://ai.google.dev/api/files) ended up being more difficult.

If you go the [documentation](https://ai.google.dev/api/files#method:-media.upload) for uploading, and use the 'Shell' language tab, you can see an example like so:

```bash
MIME_TYPE=$(file -b --mime-type "${IMG_PATH_2}")
NUM_BYTES=$(wc -c < "${IMG_PATH_2}")
DISPLAY_NAME=TEXT

tmp_header_file=upload-header.tmp

# Initial resumable request defining metadata.
# The upload url is in the response headers dump them to a file.
curl "${BASE_URL}/upload/v1beta/files?key=${GOOGLE_API_KEY}" \
  -D upload-header.tmp \
  -H "X-Goog-Upload-Protocol: resumable" \
  -H "X-Goog-Upload-Command: start" \
  -H "X-Goog-Upload-Header-Content-Length: ${NUM_BYTES}" \
  -H "X-Goog-Upload-Header-Content-Type: ${MIME_TYPE}" \
  -H "Content-Type: application/json" \
  -d "{'file': {'display_name': '${DISPLAY_NAME}'}}" 2> /dev/null

upload_url=$(grep -i "x-goog-upload-url: " "${tmp_header_file}" | cut -d" " -f2 | tr -d "\r")
rm "${tmp_header_file}"

# Upload the actual bytes.
curl "${upload_url}" \
  -H "Content-Length: ${NUM_BYTES}" \
  -H "X-Goog-Upload-Offset: 0" \
  -H "X-Goog-Upload-Command: upload, finalize" \
  --data-binary "@${IMG_PATH_2}" 2> /dev/null > file_info.json

file_uri=$(jq ".file.uri" file_info.json)
echo file_uri=$file_uri

# Now generate content using that file
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GOOGLE_API_KEY" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[
          {"text": "Can you tell me about the instruments in this photo?"},
          {"file_data":
            {"mime_type": "image/jpeg", 
            "file_uri": '$file_uri'}
        }]
        }]
       }' 2> /dev/null > response.json

cat response.json
echo

jq ".candidates[].content.parts[].text" response.json
```

That's... a lot. :) I don't really do bash scripting at all, but I was able to guess as to a lot of what was being done here. It's a two step process - first create the file object which in turn returns a URL you can use for uploading the actual bits. 

When I began replicating all of this in ColdFusion, I started off as simple as possible, and didn't think the headers shown where that important. I was wrong - they were critical. I eventually got things working and turned it into a nice little UDF:

```js
function uploadFile(path) {
	var mimeType = fileGetMimeType(path);
	var fileSize = getFileInfo(path).size;
	var result = "";
	var body  = {
		"file": {
			"display_name":getFileFromPath(path),
			"mimeType":mimeType
		}
	};

	cfhttp(url="https://generativelanguage.googleapis.com/upload/v1beta/files?key=#application.GEMINI_API_KEY#", method="post", result="result") {
		cfhttpparam(type="header", name="Content-Type", value="application/json");
		cfhttpparam(type="header", name="X-Goog-Upload-Protocol", value="resumable");
		cfhttpparam(type="header", name="X-Goog-Upload-Command", value="start");
		cfhttpparam(type="header", name="X-Goog-Upload-Header-Content-Length", value=fileSize);
		cfhttpparam(type="header", name="X-Goog-Upload-Header-Content-Type", value=mimeType);
		cfhttpparam(type="body", value="#serializeJSON(body)#");
	}

	cfhttp(url=result.responseheader['X-Goog-Upload-URL'], method="put", result="result") {
		cfhttpparam(type="header", name="Content-Length", value=fileSize);
		cfhttpparam(type="header", name="X-Goog-Upload-Offset", value="0");
		cfhttpparam(type="header", name="X-Goog-Upload-Command", value="upload, finalize");
		cfhttpparam(type="file", name="file", file=path);
	}

	return deserializeJSON(result.fileContent).file;

}
```

All you need to use this is a path to a file and the function will handle the rest. (Oh, and an API key of course. The UDF reaches out to the Application scope for it which is bad, so feel free to modify the code make that an argument.) I'll note that the Files API also allows for giving a display name to a file. For my code, I just used the filename, but you could make that an optional argument to allow for nicer, friendlier names if that makes sense. 

In case you're wondering *why* this is necessary, and for folks who are planning on attending my session next week I ask that you stop reading now so you won't be spoiled (grin), this is how you can handle basic multimodal prompts with Gemini. For example, I can upload an image and then run prompts against it. Here's a script that does just that - scan a directory and ask Gemini to describe each image:

```js
<cfinclude template="utils.cfm">

<cfscript>
/*
I figured this out looking at the Shell tab here, https://ai.google.dev/api/files#File
*/
function uploadFile(path) {
	var mimeType = fileGetMimeType(path);
	var fileSize = getFileInfo(path).size;
	var result = "";
	var body  = {
		"file": {
			"display_name":getFileFromPath(path),
			"mimeType":mimeType
		}
	};

	cfhttp(url="https://generativelanguage.googleapis.com/upload/v1beta/files?key=#application.GEMINI_API_KEY#", method="post", result="result") {
		cfhttpparam(type="header", name="Content-Type", value="application/json");
		cfhttpparam(type="header", name="X-Goog-Upload-Protocol", value="resumable");
		cfhttpparam(type="header", name="X-Goog-Upload-Command", value="start");
		cfhttpparam(type="header", name="X-Goog-Upload-Header-Content-Length", value=fileSize);
		cfhttpparam(type="header", name="X-Goog-Upload-Header-Content-Type", value=mimeType);
		cfhttpparam(type="body", value="#serializeJSON(body)#");
	}

	cfhttp(url=result.responseheader['X-Goog-Upload-URL'], method="put", result="result") {
		cfhttpparam(type="header", name="Content-Length", value=fileSize);
		cfhttpparam(type="header", name="X-Goog-Upload-Offset", value="0");
		cfhttpparam(type="header", name="X-Goog-Upload-Command", value="upload, finalize");
		cfhttpparam(type="file", name="file", file=path);
	}

	return deserializeJSON(result.fileContent).file;

}

function promptWithFile(prompt, file) {
	var result = "";

	var body = {
		"contents": [
			{
			"role": "user",
			"parts": [
				{
				"text": prompt
				},
				{
				"file_data": { "file_uri":file.uri }
				}
			]
			}
		],
		"generationConfig": {
			"temperature": 1,
			"topK": 64,
			"topP": 0.95,
			"maxOutputTokens": 8192,
			"responseMimeType": "text/plain"
		}
	};

	cfhttp(url="https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=#application.GEMINI_API_KEY#", method="post", result="result") {
		cfhttpparam(type="header", name="Content-Type", value="application/json");
		cfhttpparam(type="body", value="#serializeJSON(body)#");
	}

	return deserializeJSON(result.fileContent);
}

sourceImages = directoryList(expandPath('../images'));

for(i=1;i<=sourceImages.len();i++) {
	fileOb = uploadFile(sourceImages[i]);
	writedump(fileOb);

	result = promptWithFile("what is this a picture of?", fileOb);
	writeDump(var=result,expand=false);

	imageBits = fileReadBinary(sourceImages[i]);
	image64 = toBase64(imageBits);
	writeoutput("<img src='data:image/jpeg;base64, #image64#'>");

	try {
		writeOutput(md2HTML(result.candidates[1].content.parts[1].text));
	} catch(any e) {
		/* The day I built this, Gemini was having "issues" - aren't we all? */
	}
}

</cfscript>
```

The function, `promptForFile`, shows how you can append the file as part of the prompt. Gemini can handle multiple files in one prompt as well, but for this demo I'm just showing how well Gemini can identify what's in a picture. 

That's all for now. I'm thinking *after* this conference, I may try to wrap up my code in a simple component for folks to use. As always, you tell me if that would be useful for you!