---
layout: post
title: "<file-preview> - A simple web component for file previews"
date: "2026-08-11T18:00:00"
categories: ["development"]
tags: ["web components","javascript"]
banner_image: /images/banners/files.jpg
permalink: /2026/08/11/file-preview-a-simple-web-component-for-file-previews
description: A simple web component for file previews. 
---

This was a "I can't fall asleep and my mind is wondering" type of idea and honestly, I'm surprised at how good it came out. For a while now I've shared demos where a user picks an image and ... something. It doesn't matter. But I typically add a preview of the image when it's selected. This works because once the user selects a file on their local system, JavaScript can then access the bits of that file, making it trivial then to render it. The idea I had, late at night, was simple - what if this could be a web component and expanded to cover different file types?

In my imagination, it would look something like this in code:

```html
<form>
    <!-- various other form things -->
    <label for="upload">Select a file: </label>
    <input type="file" id="upload" name="upload">
    <file-preview file-id="upload"></file-preview>
</form>
```

The component takes one attribute, `file-id`, which points to the ID value of the field to monitor. As for preview support, I figured I could cover these:

* Images (of course)
* HTML, .txt
* Markdown (after converting to HTML)
* Office docs (Using the excellent [officeParser](https://officeparser.harshankur.com/) library)
* PDF (ditto)
* Audio and Video (using the browser's built-in support)

And more. I decided to let Cursor take a swing at this, so I started with this prompt:

```
I want to create a web component that does the following:

It's tied to a input[type=file] control. When the user selects a file, it attempts to preview it. 

It looks like so: <file-preview file-id="id of file field"></file-preview>

The user would position/size it with CSS as they see fit. The component would support previews for:

* Office docs and PDFs via https://officeparser.harshankur.com/. This will be lazy loaded when a matching file type is selected. It will render the HTML version
* HTML docs - as is.
* Markdown - parse to HTML via the `marked` library and render the HTML
* Images - render as usual
* Video and Audio - create a new instance of <video> or <audio> so the user could click play to preview

Anything else I'm missing?
```

Cursor came back with a bunch of suggestions, including supporting text type documents (JSON, txt, etc) and said it should handle noting when the associated file field was reset. 

And that was pretty much it. In the first iteration there was a bug with the iframe it used to render a PDF. This was due to the iframe's [sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox) value and easily corrected. 

Cursor's agent also built a good demo (<https://cfjedimaster.github.io/file-preview/index.html>) but it was focused on the component, and not a "real" form. 

I returned to Cursor with this prompt:

```
the demo you built in index.html is ok, but the idea here was to 
include the web component in a form. make a new file, demo.html, 
and have a few form fields in it, one of which is the file 
preview. just have it post to nothing that's fine
```

And that created a better demo (imo!):

<iframe src="https://cfjedimaster.github.io/file-preview/demo.html" style="width:100%; height: 600px"></iframe>

You can see the full code at the repo here: <https://github.com/cfjedimaster/file-preview>. If enough people ask (ok, let's say 2), I'll put this up on NPM for easier installation. 