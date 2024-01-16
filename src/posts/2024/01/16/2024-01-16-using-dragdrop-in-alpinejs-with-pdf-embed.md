---
layout: post
title: "Using Drag/Drop in Alpine.js with PDF Embed"
date: "2024-01-16T18:00:00"
categories: ["javascript"]
tags: ["alpinejs","adobe","pdf services"]
banner_image: /images/banners/cat_papers.jpg
permalink: /2024/01/16/using-dragdrop-in-alpinejs-with-pdf-embed
description: 
---

Drag and drop support in JavaScript is probably two to three hundred years old now (plus or minus a few years), but I use it rarely enough such that when I need it, I run over to [MDN's article](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) on it as a quick refresher. I thought it might be fun to combine the web's drag and drop support with Adobe's [PDF Embed](https://developer.adobe.com/document-services/apis/pdf-embed/) library. Here's what I built.

## Support Drag and Drop

Let's begin by *just* handling drag and drop, not worrying yet about PDF rendering. I began by adding two events to my core Alpine.js div:

```html
<div x-data="app" @drop.prevent="handleDrop" @dragover.prevent>


</div>
```

You'll notice both a `drop` event and `dragover`. Why both? From MDN: 

<blockquote>
By default, the browser prevents anything from happening when dropping something onto most HTML elements. To change that behavior so that an element becomes a drop zone or is droppable, the element must have both ondragover and ondrop event handler attributes.
</blockquote>

We only care about the `drop`, so `dragover` just does nothing in this case. Also, note both use `.prevent` to prevent the default handling of those events by the browser.

In JavaScript, the `drop` event will have access to the file that was dropped, and with this, we can check for a PDF:

```js
handleDrop(e) {
	let droppedFiles = e.dataTransfer.files;
	if(!droppedFiles) return;
	//only work with file 1
	this.pdfFile = droppedFiles[0];
	if(this.pdfFile.type !== 'application/pdf') return;
	console.log('we got a pdf', this.pdfFile.name);
	// more to come...
```

Essentially - look for a file (a user could drag and drop multiple) and check the `type` property to ensure it's a PDF. 

And that's it. So how do we get the PDF rendered?

## Adding PDF Embed

I've talked about PDF Embed *many* times here, but if you've never seen it before, you can take a quick look at the [Getting Started guide](https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/gettingstarted/) for a review. Basically, include a JavaScript library, figure out what div element will hold the PDF, and then use a few lines of JavaScript to initialize, point to the PDF, and render. Here's a sample of how this would look:

```js
document.addEventListener("adobe_dc_view_sdk.ready", function() {
	var adobeDCView = new AdobeDC.View({clientId: "<YOUR_CLIENT_ID>", divId: "adobe-dc-view"});
    adobeDCView.previewFile(
	{
		content:   {location: {url: "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf"}},
		metaData: {fileName: "Bodea Brochure.pdf"}
	});
});
```

That's vanilla JavaScript, but how do we use this in Alpine?

First off, notice how the default code listens for an event, `adobe_dc_view_sdk.ready`. This event is fired when the library is loaded and ready to go. However, you can *also* check for `window.AdobeDC` as well. The *best* solution is to use both - listen for the event and check the window variable.

In Alpine, I used a variable, `pdfAPIReady`, set to false, and in my `init`, checked for the window variable:

```js
init() {
	if(window.AdobeDC) this.pdfAPIReady = true;
},
```

That handles the case of, "The Embed library was ready before Alpine even got started". To handle it *not* being ready, we can tell Alpine to listen for the `adobe_dc_view_sdk.ready` event. This brings up two issues:

* It's a `document` event
* It's an event with a dot in the name

Luckily, Alpine supports that with two directives: `.dot.document`. Here's how it looks:

```html
<div x-data="app" @drop.prevent="handleDrop" @dragover.prevent @adobe_dc_view_sdk-ready.dot.document="setReady">
```

Notice I changed the dot in the event to a dash. When Alpine sees the `.dot` directive, it understands what I really want to listen for. It's absolutely a bit 'wordy', but it works.

Cool. So next I added some UI. This UI will only show up when I'm ready to render events so it makes use of `x-show`:

```html
<div id="dropBox" x-show="pdfAPIReady">
   <p>
   Please drop your PDF file here...
   </p>
</div>
```

Now I can return back to my JavaScript code that handles the drop:

```js
handleDrop(e) {
	let droppedFiles = e.dataTransfer.files;
	if(!droppedFiles) return;
	//only work with file 1
	this.pdfFile = droppedFiles[0];
	if(this.pdfFile.type !== 'application/pdf') return;
	console.log('we got a pdf', this.pdfFile.name);

	let reader = new FileReader();
	let name = this.pdfFile.name;

	reader.onloadend = (e) => {
		let filePromise = Promise.resolve(e.target.result);
		this.renderPDF('pdfPreview', filePromise, name);      
	};
	reader.readAsArrayBuffer(this.pdfFile);		
},
```

After I've checked to ensure I've got a PDF, I use a `FileReader` object to read the data of the dropped file. This is async and the `onloadend` handler can then take the final result and pass it to the next function:

```js
renderPDF(div, promise, name) {
	let dcView = new AdobeDC.View({
		clientId: ADOBE_KEY, 
		divId: div
	});

	dcView.previewFile({
		content: { promise: promise }, 
		metaData: { fileName: name }
	});
},
```

This is a small modification of the default code from the docs, with the big change being using a promise instead of a URL for the source. And that's really all there is. 

You can find the complete code below, but you may want to open it up on CodePen to get a bit more 'space' to actually see a PDF.

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="result" data-slug-hash="GRerVBz" data-editable="true" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/GRerVBz">
  Drag drop to PDF View</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>