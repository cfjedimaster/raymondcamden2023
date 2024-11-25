---
layout: post
title: "Using Your Favicon for Monitoring Long Processes"
date: "2024-11-25T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_icons.jpg
permalink: /2024/11/25/using-your-favicon-for-monitoring-long-processes
description: Updating the favicon as a way of letting a user know when a long running process is done.
---

A week or so ago, I was doing some tests on [Google Colab](https://colab.research.google.com/) and noticed something interesting. The notebook I was using was one that took one to two minutes to process. Before I'd start the process, the favicon looked like so:

<p>
<img src="https://static.raymondcamden.com/images/2024/11/fi1.jpg" alt="Favicon of an infinity symbol, bright orange color" class="imgborder imgcenter" loading="lazy">
</p>

After kicking off the workflow, the favicon changed like so:

<p>
<img src="https://static.raymondcamden.com/images/2024/11/fi2.jpg" alt="Favicon of an infinity symbol, dull gray color" class="imgborder imgcenter" loading="lazy">
</p>

To be honest, I had not noticed it earlier, but I only fairly recently started using a somewhat 'slow' notebook so it's possible I just didn't *need* it before. Realizing how it's being used now, I thought it was an excellent user experience feature and looked into how to use it in my own applications.

## Changing the Favicon

Ok, so this part is stupid easy. Assuming you've got a favicon specified:

```html
<link rel="icon" href="/favicon.ico" />
```

Then you can use simple DOM manipulation:

```js
document.querySelector('link[rel="icon"]').href = 'some new url';
```

This is obvious, I guess? But I tend to only think about DOM manipulation for things that are *inside* my BODY tags. I've done stuff outside of there before, for example, dynamically adding a `<script>` tag, and heck, I did a post on a similar topic back in 2010 (forgive the poor formatting, [Using JavaScript to update the browser window title when the user is away](https://www.raymondcamden.com/2010/10/19/Using-JavaScript-to-update-the-browser-window-title-when-the-user-is-away)), but I honestly didn't think it would be *this* easy.

## The Demo!

I hopped on [Glitch](https://glitch.me) to build a quick demo. First, I added a button to a page, and then used a bit of JavaScript such that clicking the button would kick off a five second delayed process:

```js
document.addEventListener('DOMContentLoaded', init, false);

let $button;

async function init() {
  $button = document.querySelector('button');
  $button.addEventListener('click', doSlow, false);
}

async function doSlow() {
  console.log('Started slow');
  $button.setAttribute('disabled','disabled');
    
  await delay(5);

  console.log('Finished slow')
  $button.removeAttribute('disabled','disabled');
  
}

async function delay(x) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, x*1000);
  });
}
```

Notice I disabled the button while the process (a `setTimeout`) is working. That's just plain good UX. To modify it to add the favicon change, I first added two lines to point to my 'working' favicon and the current one:

```js
const working_icon = 'https://cdn.glitch.global/62fb94fd-9b8f-48e0-b37c-99a051fc9fd0/favicon_working.ico?v=1732549929944';
const idle_icon = document.querySelector('link[rel="icon"]').href;
```

And then literally added two more lines to `doSlow`:

```js
async function doSlow() {
  console.log('Started slow');
  $button.setAttribute('disabled','disabled');
  
  document.querySelector('link[rel="icon"]').href = working_icon;
  
  await delay(5);

  console.log('Finished slow')
  $button.removeAttribute('disabled','disabled');
  document.querySelector('link[rel="icon"]').href = idle_icon;
  
}
```

You can test this yourself here: <https://gamy-lying-stork.glitch.me/>. For my demo, the 'regular' favicon is blue, and the 'working' one is red. 

I've got it embedded below, but you'll want to view it in your own window to see the changes:

<div class="glitch-embed-wrap" style="height: 420px; width: 100%;">
  <iframe
    src="https://glitch.com/embed/#!/embed/gamy-lying-stork?path=script.js&previewSize=0"
    title="gamy-lying-stork on Glitch"
    allow="geolocation; microphone; camera; midi; encrypted-media; xr-spatial-tracking; fullscreen"
    allowFullScreen
    style="height: 100%; width: 100%; border: 0;">
  </iframe>
</div>

Let me know what you think!