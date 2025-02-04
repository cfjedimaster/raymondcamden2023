---
layout: post
title: "Testing Cloudinary Image Enhancements"
date: "2025-01-27T18:00:00"
categories: ["development"]
tags: ["cloudinary"]
banner_image: /images/banners/cat_csi.jpg
permalink: /2025/01/27/testing-cloudinary-image-enhancements
description: A quick look at two Cloudinary techniques for improving images
---

Last week I took a look at [Cloudinary GenAI transformations](https://www.raymondcamden.com/2025/01/24/automating-media-asset-creation-with-cloudinarys-genai-transformations) to demonstrate quickly creating different versions of media, including multiple sizes and text copy. While taking a look at other parts of the Cloudinary docs I discovered that they had not one, but *four* different ways to enhance images. These include:

* Generative restore
* Upscaling (reminds me of CSI)
* Enhance
* Improve

Looking at this list, it may be difficult to differentiate one from the other, luckily they provide a [nice tabular list](https://cloudinary.com/documentation/effects_and_artistic_enhancements#image_enhancement_options) with specifics and use cases. Today I want to shine a light on two of them - enhance and improve.

From the docs, enhance is described as: "Enhances the overall appeal of images without altering content using AI."

Improve is described as: "Automatically improves images by adjusting colors, contrast, and lighting."

Both of these feel very similar to the work I've done in the past with the Lightroom API (more on that at the end) where you can provide an image, and just ask the API to "make it better".  

It just so turns out I've got quite a few 'not so hot' photos which means I've got some great things to test against. And even better, I can test all of this without writing any code. Let's take a look.

## Improve

I began with the [improve](https://cloudinary.com/documentation/transformation_reference#e_improve) enhancement first. This enhancement comes with two different options:

* mode - which is either outdoor or indoor. Specifying this lets help the API tailor it's work. This defaults to outdoor.
* blend - tells the API how much of the original versus the improved image to return. This defaults to 100. 

If we were writing code, the Python code is pretty simple:

```python
CloudinaryImage("horses.jpg").image(effect="improve:50")
```

But it's even easier to just quickly modify the URL. 

So, consider this first image:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/totone/img2.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

The URL for this is: <https://static.raymondcamden.com/images/2025/01/totone/img2.jpg>. I'm going to load this via Cloudinary using the `fetch` command:

<https://res.cloudinary.com/raymondcamden/image/fetch/https://static.raymondcamden.com/images/2025/01/totone/img2.jpg>

And then add the `e_improve` transformation:

<https://res.cloudinary.com/raymondcamden/image/fetch/e_improve/https://static.raymondcamden.com/images/2025/01/totone/img2.jpg>

<p>
<img src="https://res.cloudinary.com/raymondcamden/image/fetch/e_improve/https://static.raymondcamden.com/images/2025/01/totone/img2.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

That definitely looks better. Here's another before and after - and again, ignoring the `fetch` aspect, the only change is literally `e_enhance`:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/totone/img3.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

And after...

<p>
<img src="https://res.cloudinary.com/raymondcamden/image/fetch/e_improve/https://static.raymondcamden.com/images/2025/01/totone/img3.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

And finally, an indoor picture of one of my cats:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/totone/img4.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

First, here's the transformation without specifying a mode:

<p>
<img src="https://res.cloudinary.com/raymondcamden/image/fetch/e_improve/https://static.raymondcamden.com/images/2025/01/totone/img4.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

To specify the mode, I switch from `e_improve` to `e_improve:indoor`:

<p>
<img src="https://res.cloudinary.com/raymondcamden/image/fetch/e_improve:indoor/https://static.raymondcamden.com/images/2025/01/totone/img4.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Honestly I can't tell a difference, but both are better than the earlier image with more detail being visible in the cat's face.

## Enhance

To test [enhance](https://cloudinary.com/documentation/transformation_reference#e_enhance), I had to upload my images to Cloudinary first, as fetched images aren't allowed with the feature. This transformation doesn't take any arguments so you simply add `e_enhance` to the URL and that's it. I'll do before and after shots again so it's easier to compare.

Original:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/totone/img2.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Enhanced: 

<p>
<img src="https://res.cloudinary.com/raymondcamden/image/upload/e_enhance/v1738005283/img2_hm13aa.jpg" class="imgborder imgcenter" loading="lazy">
</p>

The effect is somewhat different than before. Now for the next two. 


Original:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/totone/img3.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Enhanced: 

<p>
<img src="https://res.cloudinary.com/raymondcamden/image/upload/e_enhance/v1738005284/img3_fausta.jpg" class="imgborder imgcenter" loading="lazy">
</p>

And the final set:

Original:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/totone/img4.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Enhanced: 

<p>
<img src="https://res.cloudinary.com/raymondcamden/image/upload/e_enhance/v1738005284/img4_qlfn8y.jpg" class="imgborder imgcenter" loading="lazy">
</p>

I think I prefer how improve works over enhance, but I could see either being an option. Where would I use this in a real world application? I think this could be real useful in cases where user's upload images to a web page/app. You could offer to save the 'enhanced/improved' version of their image as part of the process. 

## One More Quick Thing...

Before I leave, how about a kick butt web component for image comparisons? This [Image Compare](https://image-compare-component.netlify.app/) web component is as simple as:

```html
<image-compare label-text="Screen Reader Label Text">
  <img slot="image-1" alt="Alt Text" src="path/to/image.jpg"/>
  <img slot="image-2" alt="Alt text" src="path/to/image.jpg"/>
</image-compare>
```

Here's an example of this in action
<script src="https://unpkg.com/@cloudfour/image-compare/dist/index.min.js"></script>

<image-compare label-text="Screen Reader Label Text">
  <img slot="image-1" alt="Original moon picture" src="https://static.raymondcamden.com/images/2025/01/totone/img2.jpg"/>
  <img slot="image-2" alt="Improved moon picture" src="https://res.cloudinary.com/raymondcamden/image/fetch/e_improve/https://static.raymondcamden.com/images/2025/01/totone/img2.jpg"/>
</image-compare>

<p>
