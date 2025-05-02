---
layout: post
title: "Pixel Art via Vibe Coding"
date: "2025-05-02T18:00:00"
categories: ["development"]
tags: ["generative ai","javascript"]
banner_image: /images/banners/cat_pixel.jpg
permalink: /2025/05/02/pixel-art-via-vibe-coding
description: Using Claude to generate JavaScript code to create pixel art.
---

I am 100% against the term "vibe coding". To be clear, my issue is with the name, it just strikes me as, well, horrible. That being said, I've been using gen AI to generate code samples over the past few months and it's been incredibly interesting at times. It absolutely requires technical skill to evaluate the results and to help guide the AI when mistakes happen, but it's been fun to give this a few tries recently.

This morning I gave Claude's [desktop app](https://claude.ai/download) a try and gave it what I thought was a non-trivial prompt:

```
can you generate JavaScript code that will look at an image 
in the DOM and convert it to simplified pixel art?
```

I then submitted the prompt and stood by while it worked. I didn't time it, but it seems like it took perhaps two to three minutes or so. It generated the code in the right hand panel of the desktop app and then explained, in great detail, what it did and why. 

It's result consisted of a core function that would take an image in the DOM and create the pixelized version. This function took arguments for the DOM element to use as well as the pixel size and number of colors. It also created a second function to add a UI that could be used to make it more dynamic. 

So given something like:

```html
<img src="something" id="my-image">
```

You could then use this:

```js
convertToPixelArt('#my-image', 8, 16);
```

I took the code, copied to CodePen and... it didn't work. I did some quick debugging and couldn't find an obvious error. It correctly read the image, made a new one, and added it to the DOM, but the resulting image was blank. Given that, I prompted it to correct the issue:

```
This doesn't properly update the original image when used. I can 
see the code running but when it adds the result back to the dom, 
it is a blank image
```

Here comes the cool part. Before I sent this prompt, I had noticed that the code failed with an image loaded on another domain. The error in question is one I've seen before, is CORS related, and is easy to fix with a line of JavaScript. I had added that to my copy but didn't mention it above. Yet somehow, when Claude was fixing the issue I had mentioned, it *also* found this issue. 

There was a lot of output from Claude about this new version, but here's the key takeaways it reported:

<div style="background-color: #c0c0c0; padding: 5px">
<strong>Better Image Handling:</strong>

<ul>
<li>Creates a new Image object to ensure proper loading
<li>Handles cross-origin issues with the crossOrigin attribute
<li>Properly waits for the image to load before processing
</ul>

<strong>Improved Color Reduction:</strong>

* Uses the median cut algorithm for better color quantization
* Weighted RGB distance calculation to account for human perception


**Enhanced UI:**

* Status messages to show processing state
* Better styling and layout
* Error handling to show issues to the user


**Performance Considerations:**

* Uses willReadFrequently: true with canvas contexts for better performance
* Uses setTimeout to prevent UI freezing during processing
</div>

This worked well, but, the function it created just automatically plopped the result into the DOM. I wanted more control. So I followed up with:

```
Modify convertToPixelArt to let me pass a second argument that is 
the DOM element to render the result to. If not passed, it acts 
as it does now, creating a new DOM element.
```

Interestingly, it disobeyed me a bit, and added it as a fourth argument. And... I'm ok with. Here's the new method signature:

```js
convertToPixelArt('#my-image', 8, 16, document.getElementById('output-container'));
```

My only complaint is that I prefer `document.querySelector` but I can use that when calling. I then did one final request:

```
Remove the support to create a UI. I just need the core support 
for working with a DOM element
```

And it correctly removed it. Here's the demo below. If you click to open up the source you can tweak the image URL.

<p class="codepen" data-height="600" data-theme-id="dark" data-default-tab="result" data-slug-hash="OPPQedp" data-pen-title="Claude to Pixel Art V2" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/OPPQedp">
  Claude to Pixel Art V2</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## A Step Too Far

While sharing this with my buddy, he mentioned trying a demo using a C64 style (and his demo is incredible, going to share that at the end). That spurred me to consider an Atari 2600 version, you know, this bad boy here:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/atari.jpg" alt="Atari 2600" class="imgborder imgcenter" loading="lazy">
</p>

I still have mine along with a collection of cartridges. Yeah, I'm old. So, in Claude, I tried this:

```
build a new verion of convertToPixelArt that recreates 
the look and feel of Atari 2600 games
```

What I got... shocked me again. My thinking here was just a color palette/size that recreated the Atari's resolution, but what I got was a lot more. It added a function that:

* Matched the resolution and color palette of the Atari 2600 (cool, I wanted that)
* Recognized that the Atari had a scanline restriction that limited how many different colors could appear on one line. It added this enforcement.
* Added the effect of a CRT screen, including screen curvature and bleeding
* Some Atari games would use 'mirroring' where a screen was mirrored for performance reasons

That is *way* beyond what I was thinking of and actually really appreciated. Even better, it made these effects optional. Here's the sample code Claude created to demonstrate:

```js
// Basic usage
convertToAtari2600('#my-image')
  .then(atariImage => console.log('Conversion complete!'))
  .catch(error => console.error('Error:', error));

// With custom target element
convertToAtari2600('#my-image', document.getElementById('output-container'))
  .then(atariImage => console.log('Atari conversion complete!'))
  .catch(error => console.error('Error:', error));

// With custom options
convertToAtari2600('#my-image', document.getElementById('output'), {
  horizontalResolution: 120,    // Lower resolution for even more "chunky" pixels
  scanlineEffect: true,         // Add dark scanlines
  crtEffect: true,              // Add CRT screen effect (vignette, curvature, etc.)
  spriteLimitations: true,      // Enforce authentic color limitations per scanline
  background: '#000000'         // Background color (black is typical for Atari)
})
```

You can see this in action here - and honestly - it's a bit *too* low rez, but I think a better source image would work better. Perhaps something already a bit simpler. But - I still think it's cool as heck:

<p class="codepen" data-height="600" data-default-tab="result" data-slug-hash="yyyvmKr" data-pen-title="Claude to Pixel Art V2" data-user="cfjedimaster" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/yyyvmKr">
  Claude to Pixel Art V2</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## Want to See Something Cooler?

So I mentioned my buddy Todd was thinking about the C64. Well, he did it, also with "vibe coding" (although via [Amazon Q Developer](https://aws.amazon.com/q/developer)) and took it a step further - connecting a web cam. 

It is way, *way*, freaking cool. Read his blog post to see how and play with his live demo: [What Would a Live Stream Look Like on a Commodore 64?](https://dev.to/aws/what-would-a-live-stream-look-like-on-a-commodore-64-42p4)