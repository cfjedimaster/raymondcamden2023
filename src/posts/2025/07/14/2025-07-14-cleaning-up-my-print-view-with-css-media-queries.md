---
layout: post
title: "Cleaning Up My Print View with CSS Media Queries"
date: "2025-07-14T18:00:00"
categories: ["development"]
tags: ["css"]
banner_image: /images/banners/cat_on_papers2.jpg
permalink: /2025/07/14/cleaning-up-my-print-view-with-css-media-queries
description: Using CSS media queries to clean up my PDF and print versions 
---

I don't know why this popped into my head today, but I was thinking about the print version of this page, and others, and what steps could be done to improve the result. Specifically, I was thinking a lot about what should be *hidden* from the print version as it has no real meaning on paper, or in PDF. With that in mind, I did a quick test - just how well do my pages print now? You can see the result below:

<iframe src="https://static.raymondcamden.com/images/2025/07/sample.pdf#view=FitH" width="100%" height="500" loading="lazy"></iframe>

Honestly, I think that's just fine! And I give a lot of credit for that to the blog design I paid for and implemented years ago. That being said, note that on page 6, the real content ends and the entire rest of the page, and all of page 7, isn't really important. These items include:

* The "Support this Content" block, which is pretty important to me, but not necessary in a PDF version.
* Related content - sure the links will work in a PDF (not paper obviously), but given that the user printed *this* particular post, this extraneous content isn't really useful.
* The comments - I love it when folks comment, but again, in a PDF version this isn't necessarily important. Now, it's possible there's great feedback in the contents you want to preserve, but I'm going to go with the idea that you want to focus on the core article itself.
* The share menu - again, useless for print.
* The final site footer which includes my name and other stuff. That's important for the site, not for a PDF/printed version, especially since the URL is already included in the output.
* While not present in the PDF, the ad is still present.
* On, and the black header on top isn't really needed either.

That's quite a bit we can get rid of - how should we do it? The first thing I did was search of course, and the AI answer from Google was pretty spot on, and matched what I had expected, a simple CSS media query:

```css
@media print {

  elementToHide {
    display:none;
  }
  
}
```

That was easy, but before I began testing, I then Google for something else. My plan was to edit the CSS in my editor, go to the browser and hit CTRL+P and see the results. Turns out you don't need to, at least on Chromium browsers (I'm using Edge right now). Go into your DevTools, ensure the `Rendering` tab is available (it wasn't for me, so hit the `+` sign to add it), and scroll down to `Emulate CSS media type`. Once you've found it, select `print`:

<p>
<img src="https://static.raymondcamden.com/images/2025/07/css1.jpg" alt="Screenshot from DevTools console showing print emulation" class="imgborder imgcenter" loading="lazy">
</p>

As soon as you do this, you'll see the print version of your site, although keep in mind it isn't the *exact* same as the PDF output, namely you don't see the header and footer that are placed there in the PDF. 

Once I had that, it was simply a matter and using DevTools to identify elements I wanted to nuke and add them one by one. Here's the full list I used for my site:

```css
@media print {

  div.ea-placement, div.author-box, footer, header.site-header, div.giscus {
    display:none;
  }
  
}
```

After adding this change, here's the new PDF version:

<iframe src="https://static.raymondcamden.com/images/2025/07/sample2.pdf#view=FitH" width="100%" height="500" loading="lazy"></iframe>

The file size is also a bit smaller too which is nice. Unfortunately there's a grand total of one line on page 6, but I don't think there's anything you can do about that. Although it wouldn't surprise me if CSS somehow supports a fix for this.

And... I'm glad I googled before I published, because *of course* CSS can that, via the `orphans` and `widows` properties. It took me a bit to get the values just right, but from what I can see, this adjusts the line spacing a bit to not leave a page so empty. I used this CSS:

```css
@media print {

  div.ea-placement, div.author-box, footer, header.site-header, div.giscus {
    display:none;
  }

  p,div {
    widows: 4;
    orphans: 4;
  }

}
```

And this was the result:

<iframe src="https://static.raymondcamden.com/images/2025/07/sample3.pdf#view=FitH" width="100%" height="500" loading="lazy"></iframe>

As you can see, page 6 is a bit less empty now. 

Finally, and I struggled with this, I added `div.post-thumbnail` to my list of things to exclude. I love my cute pictures on top... but that's all they are - a cute picture. This final version of the printed PDF is now down to 5 pages.

<iframe src="https://static.raymondcamden.com/images/2025/07/sample4.pdf#view=FitH" width="100%" height="500" loading="lazy"></iframe>

## But wait - there's more...

For my particular test, I inline all my CSS and minify it in my build process, so it's just included in a big clump of data. I could have also used a completely different file, loaded via `link` with the `media` attribute:

```html
<link href="/path/to/print.css" media="print" rel="stylesheet" />
```

And of course, you can find out more at MDN: [Printing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing). While there, make note of `break-inside`, which can help you avoid having tables and images over page breaks. 

That's it for my changes here. I think more could be done, but I'm pretty happy with the updates. 

Photo by <a href="https://unsplash.com/@ningdamao?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">宁 宁</a> on <a href="https://unsplash.com/photos/a-cat-peacefully-sits-on-a-stack-of-papers-xDDkC_odjbU?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>