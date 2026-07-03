---
layout: post
title: "Building Custom Form Selection Boxes - Working on Accessibility"
date: "2026-07-03T18:00:00"
categories: ["development"]
tags: ["css"]
banner_image: /images/banners/cat_form.jpg
permalink: /2026/07/03/building-custom-form-selection-boxes-working-on-accessibility
description: An update related to my last post, working on accessibility concerns.
---

Whenever I find myself needing to update a previous blog post, I either correct it inline and add a small note on top, for small tweaks, or write a whole new piece for larger changes. My [last blog post](https://www.raymondcamden.com/2026/07/01/building-custom-form-selection-blocks-no-js-all-css) talked about how to use CSS to style a "block" such that it acted like a form radio button. When I worked on that demo, I was a bit worried about accessibility. I did one quick check with an online tool, and thought I was ok. I was not.

When I shared my post on LinkedIn, [Kevin Bonett](https://www.linkedin.com/in/kevbonett/) shared this feedback with me:

<blockquote>
<p>
I would argue that, despite using correct semantic HTML, the "custom" radio buttons are inaccessible.
</p>
<p>
If you're a sighted keyboard user, how will you know how to interact with the radios, because they look nothing like traditional controls?
</p>
<p>
Radio selection is usually made with ARROW keys. There's nothing to visually suggest this.
</p>
<p>
Users may become frustrated because they're trying to use TAB key instead to access the 2nd radio.
</p>
</blockquote>

This all made sense to me, so I turned to [Cursor](https://cursor.com) for help. The first thing I did was download the CodePen assets locally. I knew my agent in Cursor could work with the remote URL, but as far as I know, could not edit my CodePen for me, and I wanted to give the agent the ability to edit locally so I could test and confirm. 

With the files in place locally, I started with this prompt:

```
I built this demo to showcase how to have a 'custom' block of HTML that
could be selected and used in a form. I did an online check for
accessibility and while it reported a few issues, none seemed to
imply to the form concept that I was testing, the customized 
radio blocks. I blogged about this demo here. https://www.raymondcamden.com/2026/07/01/building-custom-form-selection-blocks-no-js-all-css. 

When I shared this online, a user sent this feedback:

"I would argue that, despite using correct semantic HTML,
the "custom" radio buttons are inaccessible.

If you're a sighted keyboard user, how will you know 
how to interact with the radios, because they look
nothing like traditional controls?

Radio selection is usually made with ARROW keys. There's
nothing to visually suggest this.

Users may become frustrated because they're trying to use
TAB key instead to access the 2nd radio."

Given this feedback, what do you think, and what can we do to 
improve the demo?
```

The response from this was pretty stellar, and I think a lot better than if I had simply said "work on accessibility". By bringing in Kevin's details, I think it really helped focus the agent's work when looking at my code. 

Here's the response, and it's pretty extensive, you would be fine scrolling down to the Summary:

<iframe 
  srcdoc="<html><head><style>body{margin:0;}</style></head><body><script src='https://gist.github.com/cfjedimaster/e984c09a79ca4825d4376a51e3373a67.js'></script></body></html>"
  width="100%" 
  frameborder="0" 
  scrolling="no"
  onload="this.style.height=this.contentWindow.document.body.scrollHeight+'px';">
</iframe>

I went ahead and gave Cursor permission to edit and update my files, and while I'm keeping the original CodePen as is, I pushed up the new files to Netlify: <https://formselectionblock.netlify.app/>

The keyboard navigation is improved and the text helps too. I passed this by Kevin; he agreed with the updates, so going forward when I use this UX on my sites, I'll work with this version. Let me know what you think!