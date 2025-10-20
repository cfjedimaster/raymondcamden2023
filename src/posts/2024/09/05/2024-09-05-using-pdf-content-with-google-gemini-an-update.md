---
layout: post
title: "Using PDF Content with Google Gemini - An Update"
date: "2024-09-05T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/pdf_storm.jpg
permalink: /2024/09/05/using-pdf-content-with-google-gemini-an-update
description: A look at improved PDF support in Google Gemini
---

Way back in March of this year, I took a look at using Google's Gemini APIs to analyze PDF documents (<a href="https://www.raymondcamden.com/2024/03/22/using-pdf-content-with-google-gemini">"Using PDF Content with Google Gemini"</a>). At the time, the Gemini API didn't support PDF documents, so I made use of our (Adobe) [PDF Extract](https://developer.adobe.com/document-services/apis/pdf-extract/) service to get the text content out from the document. This "worked" but was possibly less than ideal as my "glom all the text together" approach didn't really represent the PDF well. The PDF Extract API returns information about text context (like if it is a header for example), but my method ignored that. I'm happy to share that Gemini now supports PDF files natively. Let's take a look at how this works.

## Uploading PDFs

To begin, you need to provide your PDF to Gemini. This is done via the Files API. I [blogged](https://www.raymondcamden.com/2024/05/21/using-the-gemini-file-api-for-prompts-with-media) about this a few months ago and it's a rather simple process. You can upload files up to 2 gigs with a limit of 20 per project. These files are stored temporarily, but last for 48 hours so you can absolutely upload, do some "stuff", and then either delete them via an API call or let them expire naturally. 

<p>
<img src="https://static.raymondcamden.com/images/2024/09/yourfile.jpg" alt="A tombstone with the words, Your File" class="imgcenter" loading="lazy">
</p>

That aspect of the code hasn't changed, but I'll share the general function here. 

```js
import { GoogleAIFileManager } from "@google/generative-ai/server";


const fileManager = new GoogleAIFileManager(API_KEY);

const uploadResponse = await fileManager.uploadFile("adobe_security_properly_ocr.pdf", {
  mimeType: "application/pdf",
  displayName: "Adobe Security PDF",
});
```

## Summarizing the File

Once the file is uploaded, you then just include the reference in your prompt. Again, this is no different than what I showed in that [earlier post](https://www.raymondcamden.com/2024/05/21/using-the-gemini-file-api-for-prompts-with-media), but here it is in action:

```js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  // Choose a Gemini model.
  model: "gemini-1.5-flash",
});

// Generate content using text and the URI reference for the uploaded file.
let result = await model.generateContent([
    {
      fileData: {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri
      }
    },
    { text: "Can you summarize this document as a bulleted list?" },
  ]);
```

And that's literally it. For an incredibly exciting document relating to Adobe's security policies, I get:

<div style="background-color: #111111; padding: 25px">
The document "Adobe Vendor Security Review Program White Paper" outlines the process and requirements for vendors that handle Adobe data. Here is a summary:

* **Adobe Vendor Security Review (VSR) Program:**  A program managed by Adobe Information Security that evaluates third-party vendors' compliance with the Adobe Vendor Information Security Standard. 
* **VSR Process:** 
    *  Adobe business owners initiate the VSR process by submitting a request with information about the vendor and the data being handled.
    * Adobe sends a questionnaire to the vendor, covering security controls.
    * Adobe Information Security analysts review the questionnaire, perform a gap assessment, and assign a risk level.
    * A risk analyst discusses any gaps with the business owner and provides remediation suggestions.
* **Data Classification:**
    * Adobe uses a four-tier data classification system to define the sensitivity of data and establish handling requirements:
        * **Adobe Restricted:** The most sensitive data, requiring limited access and strict controls. Examples: cardholder data, social security numbers, bank account numbers, passport information. 
        * **Adobe Confidential:** Data that would cause significant harm if disclosed. Examples: salary information, product roadmaps, financial data.
        * **Adobe Internal:** Data that is sensitive within Adobe, but not as critical as Confidential or Restricted. Examples: operational planning documents, internal communications.
        * **Public data:** Information that is openly available. 
* **Vendor Engagement:**
    * Vendors must undergo VSRs annually or biannually, depending on the data classification they handle. 
    * Vendors must comply with the most restrictive classification if data falls under multiple classifications. 
    * Vendors must handle all data according to the Data Classification and Handling Standard.
    * Adobe may take disciplinary action if data is handled incorrectly. 

The VSR program is a critical component of Adobe's information security strategy, ensuring that third-party vendors comply with Adobe's security standards and protect sensitive data. 
</div>

Summarizing is just one thing you can do of course, I also tried a prompt for categorization:

```
Return a list of categories that define the content of this document. 
Return your result as a comma-delimited list.
```

Using the same upload reference, I got this:

<div style="background-color: #111111; padding: 25px">
Information Security, Data Classification, Vendor Security, Security Review Process, Vendor Information Security Standard,  Vendor Risk Assessment, Policy, Security Management, Data Handling, Legal Obligations, Privacy Assessment, Data Retention, Due Diligence, Auditing, Compliance
</div>

This seemed to work well, but I'd be curious to know if you could restrict the returned categories to a certain set. I haven't tested that yet, and of course, you could keep a 'sanitized' list in code and only use results that match. 

Here's the entire script for this demo (and I'll link to the repo at the end):

```js
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

let API_KEY = process.env.GOOGLE_AI_KEY;

// Initialize GoogleAIFileManager with your API_KEY.
const fileManager = new GoogleAIFileManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  // Choose a Gemini model.
  model: "gemini-1.5-flash",
});

// Upload the file and specify a display name.
const uploadResponse = await fileManager.uploadFile("adobe_security_properly_ocr.pdf", {
  mimeType: "application/pdf",
  displayName: "Adobe Security PDF",
});

// Generate content using text and the URI reference for the uploaded file.
let result = await model.generateContent([
    {
      fileData: {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri
      }
    },
    { text: "Can you summarize this document as a bulleted list?" },
  ]);

// Output the generated text to the console
console.log(result.response.text())

console.log('-'.repeat(80));

result = await model.generateContent([
    {
      fileData: {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri
      }
    },
    { text: "Return a list of categories that define the content of this document. Return your result as a comma-delimited list." },
  ]);

// Output the generated text to the console
console.log(result.response.text())
```

## Working with Multiple Documents

Of course, the benefits can get even better if you want to work with multiple documents at once. In order for that to work, you just upload more items, and refer to them in your prompt. For example:

```js
// Upload the file and specify a display name.
const uploadResponse = await fileManager.uploadFile("hamlet.pdf", {
  mimeType: "application/pdf",
  displayName: "Hamlet",
});

const uploadResponse2 = await fileManager.uploadFile("romeo-and-juliet.pdf", {
  mimeType: "application/pdf",
  displayName: "Romeo and Juliet",
});
```

That's the uploads, and here they are in use in a prompt:

```js
let result = await model.generateContent([
    {
      fileData: {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri
      }
    },
    {
      fileData: {
        mimeType: uploadResponse2.file.mimeType,
        fileUri: uploadResponse2.file.uri
      }
    },

    { text: "Compare these two plays and discuss similar themes as well as major differences." },
  ]);
```

This is what I got comparing Hamlet and Romeo and Juliet:

<div style="background-color: #111111; padding: 25px">
Both *Hamlet* and *Romeo and Juliet* are tragedies written by William Shakespeare. They both share common themes but also exhibit significant differences.

**Similarities:**

* **Love and Death:** Both plays explore the themes of love and death, with romantic love leading to tragic consequences. In *Hamlet*, Hamlet's love for Ophelia and his own sense of loss and grief contribute to his downfall. In *Romeo and Juliet*, the young lovers' passionate love leads to their tragic demise. 
* **Fate and Destiny:**  A sense of fate and destiny pervades both plays. Hamlet struggles to understand his role in a world seemingly ruled by fate, while Romeo and Juliet are victims of a long-standing feud and seemingly unavoidable circumstances. 
* **Family and Loyalty:** Family loyalty and conflict play crucial roles. Hamlet's relationship with his mother and uncle drives his actions, while the feud between the Montagues and Capulets shapes the destiny of Romeo and Juliet. 
* **Revenge:**  The desire for revenge motivates characters in both plays. Hamlet seeks to avenge his father's murder, while Romeo seeks to avenge Mercutio's death. 
* **Corruption and Decay:** Both plays feature a sense of corruption and decay in society and within individuals. Hamlet finds himself in a corrupt court, and his own sanity deteriorates, while *Romeo and Juliet* depicts a world plagued by violence and hatred.

**Differences:**

* **Internal vs. External Conflict:** Hamlet is driven primarily by internal conflict. He struggles with grief, madness, and the weight of his own thoughts and actions. Romeo and Juliet, on the other hand, are caught in a larger external conflict: the feud between their families. 
* **Revenge:** Hamlet's revenge is more complex and internalized, driven by a deep sense of justice and morality. Romeo's revenge is more immediate and driven by passion.
* **Focus on Individual vs. Society:** Hamlet is a more introspective play that delves into the mind of one individual. Romeo and Juliet, on the other hand, focuses more on the destructive power of social forces and the impact of a feud on society. 
* **Language:** *Hamlet* is characterized by its complex and philosophical language, often featuring soliloquies and deep musings. *Romeo and Juliet*, while also beautiful, uses more lyrical and romantic language, focusing on passionate expressions of love and longing.

In conclusion, both *Hamlet* and *Romeo and Juliet* are powerful and enduring tragedies that explore universal themes of love, death, fate, and the human condition. While they share similarities in themes, their focus on conflict and their approach to characters and language create distinct dramatic experiences. *Hamlet* delves into the complexities of individual psychology and morality, while *Romeo and Juliet* explores the destructive power of external forces and societal conflict.
</div>

It's been a while since I've read these plays, but it feels like a pretty good comparison. Here's that script:

```js
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

let API_KEY = process.env.GOOGLE_AI_KEY;

// Initialize GoogleAIFileManager with your API_KEY.
const fileManager = new GoogleAIFileManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  // Choose a Gemini model.
  model: "gemini-1.5-flash",
});

// Upload the file and specify a display name.
const uploadResponse = await fileManager.uploadFile("hamlet.pdf", {
  mimeType: "application/pdf",
  displayName: "Hamlet",
});

const uploadResponse2 = await fileManager.uploadFile("romeo-and-juliet.pdf", {
  mimeType: "application/pdf",
  displayName: "Romeo and Juliet",
});

console.log('Uploaded both files.');

// Generate content using text and the URI reference for the uploaded file.
let result = await model.generateContent([
    {
      fileData: {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri
      }
    },
    {
      fileData: {
        mimeType: uploadResponse2.file.mimeType,
        fileUri: uploadResponse2.file.uri
      }
    },

    { text: "Compare these two plays and discuss similar themes as well as major differences." },
  ]);

// Output the generated text to the console
console.log(result.response.text())

console.log('-'.repeat(80));
```

## Making it Generic

The power in this comes from automation of course. You could imagine a process that responds to new PDFs being added to a directory, uses Gemini for a summary, and stores that result in a database for use later. And it's also totally fair to expect that the summary will be off, incomplete, and so forth, and therefore any tool should make it easy for an administrator to tweak. 

As a super simple example, here's a script that will summarize at the command line:

```js
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

let API_KEY = process.env.GOOGLE_AI_KEY;

// Initialize GoogleAIFileManager with your API_KEY.
const fileManager = new GoogleAIFileManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  // Choose a Gemini model.
  model: "gemini-1.5-flash",
});

async function uploadFile(path) {
  // assumes /, kinda bad
  let name = path.split('/').pop();

  // Upload the file and specify a display name.
  return await fileManager.uploadFile(path, {
    mimeType: "application/pdf",
    displayName: name,
  });

};

async function summarize(upload) {

  return (await model.generateContent([
      {
        fileData: {
          mimeType: upload.file.mimeType,
          fileUri: upload.file.uri
        }
    },
    { text: "Can you summarize this document?" },
    ])).response.text();

}

if(process.argv.length < 3) {
  console.log('Pass a path to a PDF file to use this tool.');
  process.exit();
}

let path = process.argv[2];

console.log(`Upload ${path}`);
let upload = await uploadFile(path);
console.log('Asking for a summary...');
let summary = await summarize(upload);
console.log('-'.repeat(80));
console.log(summary);
```

You can find these scripts, and my source PDFs, as well as a few other tests, up in my repo here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/pdf_test> Let me know what you think!
