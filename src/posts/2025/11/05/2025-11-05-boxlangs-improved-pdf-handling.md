---
layout: post
title: "BoxLang's Improved PDF Handling"
date: "2025-11-05T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/pdf_storm.jpg
permalink: /2025/11/05/boxlangs-improved-pdf-handling
description: A look at improved PDF generation with BoxLang 
---

I've blogged about PDF support in BoxLang previously, including a [quick introduction](https://www.raymondcamden.com/2025/03/18/boxlang-quick-tips-pdf-generation) and a more robust [demo](https://www.raymondcamden.com/2025/04/24/creating-a-pdf-book-from-markdown-with-boxlang) later. Basically, the free [PDF module](https://boxlang.ortusbooks.com/boxlang-framework/modularity/pdf) provides excellent PDF creation capabilities out of the box. But what about PDF manipulation?

My last two jobs involved PDF APIs, and while my next one most certainly does **not** (thank god), it's still a feature near and dear to my heart. The [BoxLang](https://boxlang.io) folks have made a shockingly huge amount of updates over the past few months, more than I've had a chance to keep up with, but one in particular caught my eye and I thought I'd call it out - the new [PDF+](https://boxlang.ortusbooks.com/boxlang-framework/boxlang-plus/modules/bx-plus-pdf#pdf-component) module.

BoxLang's commercial modules are part of the [BoxLang+](https://boxlang.ortusbooks.com/boxlang-framework/boxlang-plus) plan. It's still open source, but includes additional features, support, and a set of [premium modules](https://boxlang.ortusbooks.com/boxlang-framework/boxlang-plus/modules). To be clear, everything done in these premium modules could be done by any BoxLang developer if you want, but obviously having a supported, tested, and already *existing* solution is compelling. The [PDF+](https://boxlang.ortusbooks.com/boxlang-framework/boxlang-plus/modules/bx-plus-pdf) module is a great example of this as it gives you both manipulation features but also form handling. Let me show you a simple example of this in action.

## Getting Started

Getting this version of the module is slightly different from the 'free' tier. Instead of:

```
install-bx-module bx-pdf
```

You would do:

```
install-bx-module bx-plus,bx-pdf
```

That's it. There's additional work done once you have your license (see the [Plus Core](https://boxlang.ortusbooks.com/boxlang-framework/boxlang-plus/modules/bx-plus) docs) but you can trial the functionality at this point.

## PDF Manipulation

As I mentioned, the premium version of the module provides both manipulation and form capabilities, but let's focus on manipulation. These features include:

* Adding attachments
* Adding a header of footer
* Adding and removing a watermark
* Deleting pages
* Exporting and importing form data
* Extracting text and images
* Getting information about the document
* Merging PDFs
* Modifying PDF protection
* Creating PDF thumbnails

This is a great set of features, and the only one I really think is missing is a `split` type feature. 

Primarily you will use the `bx:pdf` component. In tag-land, here's a simple merge example from the docs:

```html
<bx:pdf action="merge"
        destination="/combined/merged-document.pdf"
        overwrite="true">

    <bx:pdfparam source="/docs/doc1.pdf" />
    <bx:pdfparam source="/docs/doc2.pdf" />
    <bx:pdfparam source="/docs/doc3.pdf" />

</bx:pdf>
```

Ok, how about a *real* example?

## PDF Workflow

I built a simple workflow process that:

* Scans a directory of PDFs
* For each one, it creates a new version that's 4 pages, at most, long. 
* Saves to a "samples" directory
* Uses the thumbnail action to get a thumbnail of page one
* Uses BoxLang's Image module to then resize it down to a smaller size.

All in all, the idea is to create a set of PDF samples that could be used on a web site. (Although PDFs smaller than 5 pages will be saved as is.) The thumbnails could be used when listing them out. 

Here's the entire script:

```js
source = "./source_pdfs";
dest = expandPath("./samples");

pdfs = directoryList(path="./source_pdfs", filter="*.pdf");

pdfs.each(p => {
    if(!fileExists(dest & "/" & getFileFromPath(p))) {
        println("Need to process #p#");
        bx:pdf action="getinfo" source="#p#" name="info";
        // if > 5, kill the rest
        if(info.TotalPages > 5) {  
            bx:pdf action="deletepages" source="#p#" pages="5-#info.TotalPages#" destination="#dest#/#getFileFromPath(p)#" overwrite=true;
        } else {
            copyFile(p, dest & "/" & getFileFromPath(p));
        }
        // make the thumb
        bx:pdf action="thumbnail" pages="1" source="#p#" overwrite=true directory=expandPath("./samples_thumbs");

        myThumbPath = expandPath("./samples_thumbs") & "/" & replace(getFileFromPath(p), ".pdf", "_page_1.jpg");
        img = imageRead(myThumbPath);
        // FYI, two reported bugs here. height should be optional, and path 
        img.scaleToFit(250, 250);
        img.write(myThumbPath);
    }

}, true);
```

So from the top, I first set up a few variables I'll be using, namely the source and destinations. 

Next, I loop over them - and make note of `true` at the end - that makes this process multi-threaded. 

For each PDF, I first figure out how big it is using `getinfo`, then delete everything from page 5 and on using `deletepages`, saving the result in a new folder.

Next, I use the `thumbnail` action. This will save the image with a filename that includes `_page_X.jpg` as the filename, where `X` represents the page being generated. I'm only generating one, so I can look for that, read it in and scale it down. 

And that's it! The end result gives me a set of PDF samples and thumbs.

If you want to see the results, and the sample code, you can grab it here: <https://github.com/ortus-boxlang/bx-demos/tree/master/misc/pdfplus>