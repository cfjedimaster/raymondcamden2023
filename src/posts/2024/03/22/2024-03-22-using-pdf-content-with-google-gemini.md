---
layout: post
title: "Using PDF Content with Google Gemini"
date: "2024-03-22T18:00:00"
categories: ["javascript"]
tags: ["generative ai","pdf services"]
banner_image: /images/banners/cat-scroll.jpg
permalink: /2024/03/22/using-pdf-content-with-google-gemini
description: Integrating PDF content into generative AI queries with Google Gemini
---

Back in February Google announced [Gemini 1.5](https://www.raymondcamden.com/2024/02/15/google-gemini-15-announced-but-not-yet-released), their latest, most powerful language model, and while access has been open via [AI Studio](https://aistudio.google.com/), API access has only been available in the past few days. I thought I'd try out the new model and specifically make use of the larger context window to do prompts on PDF documents. I discussed something similar earlier this year (<a href="https://www.raymondcamden.com/2024/01/08/using-ai-and-pdf-services-to-automate-document-summaries">"Using AI and PDF Services to Automate Document Summaries"</a>) which made use of [Diffbot](https://www.diffbot.com/), so I thought it would be interesting to build a similar experience with the Gemini API. At a high level, it's not too difficult:

* Begin by getting the contents of the PDF
* Make a call to Gemini with the contents and a prompt that asks about it

I think the part I was most concerned about was how to combine the PDF contents and prompt in a way that would make sense over the API. I've got a working demo I can share and as always, comments are welcome. Let me know what I could do better. 

Alright, let's take a look.

## Getting PDF Contents

The first part is rather easy, but mostly because I've got a powerful API I can use, Adobe's [PDF Extract](https://developer.adobe.com/document-services/apis/pdf-extract/) service. (Reminder and disclaimer - I work for Adobe.) Given a PDF, I can pass it to the API and get structured JSON back that details every aspect of the document. I've talked about the API many times here before, so I think for this post I'm going to summarize the code instead of showing every line (the full code will be at the end), but the general process is:

* Authenticate
* Upload the PDF
* Tell the service to extract info
* Save the JSON

As I said, I want to save on space, so I'll show the code *calling* these steps:

```js
const EXTRACTED_PDF = './extract.json';

// STEP ONE
// Do we need to run code to extract our contents? Check first.
let extractedData = '';

if(!fs.existsSync(EXTRACTED_PDF)) {
  console.log('Need to extract the PDF.');

  let accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
  console.log('Got our access token.');

  let uploadedAsset = await getUploadData('application/pdf', accessToken, CLIENT_ID);

  await uploadFile(uploadedAsset.uploadUri, SOURCE_PDF, 'application/pdf');
  console.log('Source PDF Uploaded.');

  let job = await extractJob(uploadedAsset, accessToken, CLIENT_ID);
  console.log('Job created. Now to poll it.');

  let result = await pollJob(job, accessToken, CLIENT_ID);
  console.log('Job is done.'); 

  await downloadFile(result.content.downloadUri, 'extract.json');
  console.log('All done.');

  extractedData = JSON.parse(fs.readFileSync(EXTRACTED_PDF,'utf8'));

} else {
  console.log('Using previously generated extracted PDF data.');
  extractedData = JSON.parse(fs.readFileSync(EXTRACTED_PDF,'utf8'));
}
```

Since it doesn't make sense to extract the PDF more than once, I check for an existing export before calling the APIs. It's not a lengthy process, but it is complex and takes 4-5 seconds, and there's no real point in running it more than once.

While the JSON can be pretty large, it's main component is an array of `elements`. Here is one example of that:

```json
{
	"Bounds": [
		45.1199951171875,
		756.9259948730469,
		245.03466796875,
		766.3184967041016
	],
	"Font": {
		"alt_family_name": "* Arial",
		"embedded": true,
		"encoding": "Identity-H",
		"family_name": "* Arial",
		"font_type": "CIDFontType0",
		"italic": false,
		"monospaced": false,
		"name": "*Arial-6565",
		"subset": false,
		"weight": 400
	},
	"HasClip": false,
	"Lang": "en",
	"ObjectID": 440,
	"Page": 0,
	"Path": "//Document/Sect/P",
	"Text": "Adobe Vendor Security Review Program White Paper ",
	"TextSize": 8.5,
	"attributes": {
		"SpaceAfter": 18
	}
},
```

Specifically, this element represents text on the screen, and is going to be important for our next step. 

## Gather Text

From the PDF contents extracted via the API, we can take the JSON and collect all the Text values from elements:

```js
let text = extractedData.elements.reduce((text, el) => {
	if(el.Text) text += el.Text + '\n';
	return text;
},'');
```

Do note that I check to see if the `.Text` element exists before grabbing it. **This approach is not the best.** Specifically, I'm adding a line break after every bit of a text, and it's possible to have elements, like from a table, that should be in one line that will end up in multiple lines instead. There's actually much more 'process' that can be done to make the output from Extract better prepared for generative AI applications. 

## Calling Gemini 1.5

I've shared multiple examples of using Gemini from Node already and for the most part, 1.5 "just works" if you specify the right model, but there's one small issue currently. Previously, I've begun with code like so:

```js
const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GOOGLE_AI_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });
```

With the new 1.5 model, you need to pass an optional argument to specify the API version:

```js
const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_AI_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME }, { apiVersion:'v1beta'});
```

If you are reading this in the future, first note that I've always been Pro Robot Overlord and I'm a faithful meatbag servant, secondly, and most importantly, you can probably leave off that second argument.

Alright, so with that out of the way, and knowing the code to use the SDK is pretty simple, let's instead focus on the prompt. I built a method that takes two arguments - the text of the PDF and the question about that text:

```js
async function runPrompt(text, question) {
```

Given these two values, how do I craft the prompt? This is what I came up with, and it seems to work:

```js
Given this document (delimited by dashes):

${text}
-------------------------------------------

${question}
```

As I said, this seems to work, but I'm not convinced it couldn't be done better. For completeness sake, here's the entire method. Outside of how I craft the prompt, and the model, this is pretty much the same code I've shown before, which again drives home how important the prompt is in cases like this, and less so the code.

```js
async function runPrompt(text, question) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME }, { apiVersion:'v1beta'});

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const parts = [
    {text: `
Given this document (delimited by dashes):

${text}
-------------------------------------------

${question}`},
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  return response.text();
}
```

The last part of my code simply calls this:

```js
console.log('Passing text and prompt to Gemini....');
let result = await runPrompt(text, 'What is the summary? Also, what are the three key takeaways?');
console.log(`Result:\n\n${result}`);
```

## Results

I did my testing with a rather boring Adobe security whitepaper. If you're having trouble sleeping, you can read it below.

<div id="pdf" style="width:100%; height: 500px"></div>

<script src="https://acrobatservices.adobe.com/view-sdk/viewer.js"></script>
<script>
let ADOBE_KEY = '33f07f2305444579a56b088b8ac1929e';
if(window.location.host.indexOf('localhost') >= 0) ADOBE_KEY = ' 9861538238544ff39d37c6841344b78d';

function displayPDF() {
var adobeDCView = new AdobeDC.View({clientId: ADOBE_KEY, divId: "pdf"});
adobeDCView.previewFile({
content:{location: {url: "https://static.raymondcamden.com/images/2024/03/adobe_security_properly_ocr.pdf"}},
metaData:{fileName: "adobe_security_properly_ocr.pdf"}
}, {embedMode: "FULL_WINDOW"});
}

if(window.AdobeDC) displayPDF();
else {
document.addEventListener("adobe_dc_view_sdk.ready", () => displayPDF());
}
</script>

And while it was in the code above, the question is: "What is the summary? Also, what are the three key takeaways?". Here's the result:

<div style="background-color: #c0c0c0;padding: 5px;">

### Summary:

This document details Adobe's Vendor Security Review (VSR) program, which assesses the security practices of third-party vendors who handle Adobe data. The program aims to ensure that these vendors meet Adobe's security standards and protect the confidentiality, integrity, and availability of Adobe data. 

The VSR process involves:

* Business owners requesting a review for vendors handling Adobe data off-site.
* Vendors completing a questionnaire about their security practices.
* Adobe analysts reviewing the questionnaire and conducting a gap assessment.
* Assigning a risk level to the vendor based on the assessment.
* Addressing any identified gaps through remediation actions.

The program also outlines Adobe's data classification system, which categorizes data based on its sensitivity and dictates the level of protection required. 

### Key Takeaways:

1. **Third-party vendors handling Adobe data are subject to security reviews.** This ensures that vendors meet Adobe's security standards and protects sensitive data.
2. **The VSR process is risk-based.** Vendors are assigned a risk level based on their security practices, and remediation actions are taken to address any identified gaps.
3. **Adobe classifies data based on its sensitivity.** Different data classifications require different levels of protection, ensuring appropriate security measures are implemented for all types of data.

</div>

This is rather well done and honestly, more interesting reading than the actual PDF itself. You can browse the entire demo in my repo here, <https://github.com/cfjedimaster/ai-testingzone/tree/main/pdf_test>. The actual script is in the very precisely named `test.js` file. As always, let me know what you think!