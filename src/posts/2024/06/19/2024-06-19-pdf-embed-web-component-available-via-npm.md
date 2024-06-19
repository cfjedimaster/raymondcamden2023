---
layout: post
title: "PDF Embed Web Component Available Via NPM"
date: "2024-06-19T18:00:00"
categories: ["javascript"]
tags: ["web components"]
banner_image: /images/banners/cat-sleeping-desk.jpg
permalink: /2024/06/19/pdf-embed-web-component-available-via-npm
description: A quick note of the public release of my PDF Embed component.
---

Earlier this month, after being motivated by [Thomas Steiner](https://blog.tomayac.com/), I went through the not-really-a-hassle process of publishing `<table-sort`> to NPM. ([Table-Sorter Available Via NPM
](https://www.raymondcamden.com/2024/06/10/table-sorter-available-via-npm)) Today I've done the same for another web component, `<pdf-embed>`. 

This component wraps Adobe's [PDF Embed API](https://developer.adobe.com/document-services/apis/pdf-embed/), which, honestly, isn't an API, but a JavaScript library to embed PDFs inline with the rest of your document. 

Given this HTML:

```html
<pdf-embed url="https://documentservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf" 
		   width="100%" height="500px"
		   key="33f07f2305444579a56b088b8ac1929e">

<p>
Read our cool PDF <a href="https://documentservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf">here</a>.
</p>

</pdf-embed>

<script src="/js/pdf-embed.js" type="module"></script>
```

You get:

<pdf-embed url="https://documentservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf" width="100%" height="500px"
		   key="33f07f2305444579a56b088b8ac1929e">

<p>
Read our cool PDF <a href="https://documentservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf">here</a>.
</p>

</pdf-embed>

<script src="/js/pdf-embed.js" type="module"></script>

PDF Embed itself has many different customizations, not all of which are available via the web component, but the best part is that this can be used in a progressively enhanced manner. As you can see in the example above, if the library doesn't load, you still have a way to direct users to your PDF. 

You can find it on NPM here: <https://www.npmjs.com/package/@raymondcamden/pdf-embed>

The repo is here: <https://github.com/cfjedimaster/pdf-embed>
