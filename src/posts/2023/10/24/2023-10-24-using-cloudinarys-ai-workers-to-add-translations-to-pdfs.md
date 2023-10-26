---
layout: post
title: "Using Cloudflare's AI Workers to Add Translations to PDFs"
date: "2023-10-24T18:00:00"
categories: ["javascript"]
tags: ["cloudflare","serverless","pdf services","adobe","generative ai"]
banner_image: /images/banners/catai4.jpg
permalink: /2023/10/24/using-cloudflare-ai-workers-to-add-translations-to-pdfs
description: Using Cloudflare's new AI-powered Workers to add translation to a PDF in your browser.
---

Late last month, Cloudflare [announced](https://blog.cloudflare.com/workers-ai/) new AI features in their (already quite stellar) 
[Workers](https://workers.cloudflare.com/) platform. I've been a big fan of their serverless feature (see my [earlier posts](https://www.raymondcamden.com/tags/cloudflare)) so I was quite excited to give this a try myself. Before I begin, I'll repeat what the Cloudflare folks said in their announcement: "Usage is not currently recommended for production apps". So with that in mind, remember that what I'm sharing today may change in the future. 

## The Demo

Before I get into the code, let me share what I've built. Now, at the time I wrote this, Cloudflare's AI stuff was still in beta and there is *no* cost yet for using the features. This is, obviously, going to change. Their [announcement blog](https://blog.cloudflare.com/workers-ai/) does share proposed pricing for the feature, but again, I'd expect this to change. Because of all of this, I will *not* be sharing a live demo and I'll be removing my code from production. If anyone from Cloudflare is reading this and wants to ensure I'll be safe, hit me up. But in the meantime, I'll share some screenshots here, and you will have access to all of my code if you want to make use of it. 

For my demo, I decided to add translation to the [Adobe PDF Embed API](https://developer.adobe.com/document-services/apis/pdf-embed/). For folks who don't know, this is a *free* client-side PDF viewer you can embed on any web page. It gives you much greater control over the PDF viewing experience as well as giving you hooks into various events. In my demo's case, I can hook into the "selection" event so I know when a reader has selected text.

My demo will do this: Present a PDF to the user, and let them know they can select text to have it automatically translated to French. French was a (mostly) arbitrary choice, I could have used a dropdown of options, sniffed the user's language, and so forth, but I wanted to keep it mostly simple. 

<p>
<img src="https://static.raymondcamden.com/images/2023/10/pdf1.png" alt="Screenshot from demo showing a PDF on the left, text on the right telling the user to select text." class="imgborder imgcenter" loading="lazy">
</p>

When you select text, I grab it, pass it to the Cloudflare Worker, and return the result.

<p>
<img src="https://static.raymondcamden.com/images/2023/10/pdf2.png" alt="Updated screenshot showing an arrow to selected text on the left, with a translation on the right" class="imgborder imgcenter" loading="lazy">
</p>

In case it's a bit too hard to read in the screenshot, I selected "It is never too early or too late to start planning your legacy." The AI service translated it to "Il n’est jamais trop tôt ou trop tard pour commencer à planifier votre héritage." My high school/college French is a bit rusty, but I asked a native speaker coworker and they said it was pretty well done. 

Now let's check out the code.

## The Front-End

So honestly, the front-end isn't the interesting part, but I figured I'd show that first to get it out of the way. For readers who haven't seen the Adobe PDF Viewer tool, you basically:

* Identify a div in your document to host the PDF
* Add a script tag pointing to our library
* Add some code that mostly just specifies the div, PDF to load, and any customization options.

Here's the JavaScript code:

```js
const ADOBE_KEY = 'b9151e8d6a0b4d798e0f8d7950efea91';
const resultDiv = document.querySelector('#result');

async function displayPDF() {
    let adobeDCView = new AdobeDC.View({clientId: ADOBE_KEY, divId: "pdfBox"});
    let pdfPromise = adobeDCView.previewFile({
        content:{location: {url: "https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea%20Brochure.pdf"}},
        metaData:{fileName: "Bodea Brochure.pdf"}
    }, {embedMode: "SIZED_CONTAINER"}); 

    let viewer = await pdfPromise;
    let apis = await viewer.getAPIs();
        
    const eventOptions = {
        listenOn: [ AdobeDC.View.Enum.FilePreviewEvents.PREVIEW_SELECTION_END ],
        enableFilePreviewEvents: true
    }

    adobeDCView.registerCallback(
        AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
        async function(event) {
            console.log('selection event');
            let selection = await apis.getSelectedContent();
            console.log(selection);
            if(selection.type === "text" && selection.data.length) translate(selection.data);
        }, eventOptions
    );

}
```

The first ten or so lines are the same code you get from our docs. Things only get interesting when I add my hooks in. You can see in the `registerCallback` section I'm listening for a "PREVIEW_SELECTION_END" event. On that, I get the actual selected content, ensure it's not empty, and then call my translation function. Let's look at that:

```js
async function translate(s) {
    resultDiv.innerHTML = '<i>Working on translation...</i>';
    const res = await fetch(`https://translate.raymondcamden.workers.dev/?text=${encodeURIComponent(s)}`);
    let result = await res.json();
    resultDiv.innerHTML = `<strong>Translated Text:</strong><br/>${result.translated_text}`;
}
```

This boils down to simply calling my Cloudflare backend with the text and displaying the result. You're welcome to try hitting that URL, it won't work when I publish this post. 

## The Back-End

Alright, here's where things get pretty freaking cool, and by cool I mean, well incredibly simple. If you took the time to read their [introductory blog post](https://blog.cloudflare.com/workers-ai/), you can see it's rather easy. You add one binding to your `wrangler.toml` file, and then you can access the service in code. Here's the *entire* function for my translation service:

```js
import { Ai } from '@cloudflare/ai';

export default {
    async fetch(request, env) {
        const ai = new Ai(env.AI);

        const { searchParams } = new URL(request.url);
        let text = searchParams.get('text');

        const input = { text, source_lang:'en', target_lang: 'fr' };

        const response = await ai.run('@cf/meta/m2m100-1.2b', input);

        return new Response(JSON.stringify(response), {
            headers: {
                'Content-Type':'application/json;charset=UTF-8',
                'Access-Control-Allow-Origin':'*'
            }
        });

    },
};
```

By my count, that's roughly 20 lines of code, and basically - get the input, call the service, return the data. I'm missing error-checking here, but in terms of simplicity, *dang* that makes me happy! 

This is just my first demo with their new offerings, but considering how happy I've been with Cloudflare already, I'm stoked that this is being offered now, even in beta form.

If you want to check out the code, you can find the front-end here, <https://codepen.io/cfjedimaster/pen/WNpbJbX>. Remember that it <strong>will not work</strong> as I'm disabling the serverless function.

The back-end code may be found here: <https://github.com/cfjedimaster/cloudflareworkers-demos/tree/main/translate>

Let me know what you think!