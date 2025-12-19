---
layout: post
title: "Testing the Web Share API"
date: "2023-04-20T18:00:00"
categories: ["javascript"]
tags: ["javascript"]
banner_image: /images/banners/sharing.jpg
permalink: /2023/04/20/testing-the-web-share-api
description: A look at the Web Share API
---

A week or so ago I discovered the [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) list on MDN. It's basically an index listing of the various web APIs documented on the site. While I knew most of them, more than a few were either unclear to me or entirely unknown. This is what inspired my [post](https://www.raymondcamden.com/2023/04/12/using-the-cookie-store-api) on the Cookie Store API. For today, I want to share what I found about an API I was aware of, but had not yet had a chance to play with - the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API). While generally well supported, my testing with it left me feeling like it's not quite ready yet for usage. Here's what I found.

## Where is it supported?

The [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API#browser_compatibility) chart for Web Share is pretty green, which is good, with the main exception being Firefox. According to MDN, it can only be enabled by changing a user preference, which means no one but devs will ever use it on that browser. There's a [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1635700) on bugzilla created three years ago with an update 8 months ago but I can't really tell what's going on there. 

## How does it work?

As an API, it's actually really simple. You have two methods, `share` and `canShare`. The purpose of `canShare` is to basically act as a validation for something you would pass to `share`, but in my testing, it returned `true` every time I found a way to make `share` fail, so I'm not sure it's actually useful now. (I'll show some examples later.)

As for `share`, it works by letting you pass an object of four optional properties, with at least one needing to be sent. These properties include:

* url
* text
* title 
* files

The method must be invoked via what MDN calls [transient activation](https://developer.mozilla.org/en-US/docs/Glossary/Transient_activation), which in simpler terms just means user interaction, like a button click. 

Let's look at a sample of this. I've got a button. Nothing special, just a button:

```html
<button id="shareBtn">Share This!</button>
```

And then a bit of JavaScript:

```js
document.querySelector('#shareBtn').addEventListener('click', async () => {
	if(!navigator.share) return;
	let data = {
		text:"I like cats"
	};
	try {
		let result = await navigator.share(data);	
		console.log(result);
	} catch(e) {
		console.error(e);
	}
});
```

The result of `share` is a promise hence the use of `async/await` in there. This promise either returns `undefined` or an exception. In theory, you could put something after the `await` to let the user know they shared, but, on Windows, the promise returns *immediately*, not after a successful share, and I honestly don't see the point. The user just literally did the share, which is an interactive experience, so they know already. 

You'll also notice I'm just sharing text. That seems a bit unhelpful, but I try to start my experiments as simply as possible. So what happens when you click? I began my testing with Microsoft Edge, on desktop. After clicking, I get this UI in the top, center of my viewport:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share1.jpg" alt="UI of the Share dialog" class="lazyload imgborder imgcenter">
</p>

So... this is a bit weird. That first option is a person I worked with at IBM *years* ago. I'm fine not blurring the email as she isn't even there anymore as far as I know. I have *zero* idea why this person's email would be the first one suggested. Even odder, sometimes that person's email would be the *second* option. Clicking either of my names opened up an Outlook UI that was actually rather well incorporated with the browser... except nothing was there:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share2.jpg" alt="Email option" class="lazyload imgborder imgcenter">
</p>

I'll add that there is no way to figure out exactly what email address that is. I tried hovering and waiting, right clicking, but no go. I mean I know it's me, but I've got a couple of different email addresses. The email did show up, but without the text I had set to share so it was pointless. 

I then tried Twitter and Mastodon. Clicking Twitter opened up my desktop Twitter app... with nothing in the text field. Mastodon worked perfectly, although it opened a second window just for composing:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share3.jpg" alt="Mastodon window with the share text prepopulated." class="lazyload imgborder imgcenter">
</p>

So hey, how about the Mac? Get ready.

I began with Microsoft Edge on my Mac. Note that the options are a lot smaller, but I don't use my Mac a lot so I've got the bare minimum installed there. I *do* have Mastodon installed but it's not an option. On the flip side, I really like how it's presented. Unfortunately, there's a pretty gnarly bug here. If you dismiss the share for any reason, which is very easy to do, like switching to another app after you click and before you share, then sharing is broken. Forever. 

You get this lovely error:

```
DOMException: Failed to execute 'share' on 'Navigator': An earlier share has not yet completed.
```

Ok, not forever, but until the page is reloaded. There is a [reported Chromium bug](https://bugs.chromium.org/p/chromium/issues/detail?id=1377823) on the issue. Safari does *not* have this issue. The UI looks pretty similar with the only difference being that Safari showed the UI near the button versus Edge having it more centered. 

On mobile, I tested Edge on my Android phone. The options here made a lot more sense:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share5.jpg" alt="Sharing on Edge/Mobile" class="lazyload imgborder imgcenter">
</p>

The two people I blurred at the end were the last two people I texted. The two Slack groups were my most recent channels. I tested Facebook Messenger, chose my wife, and it sent the text to her exactly as if I had typed it. (I warned her first.)

## Adding More Options

What happens if we add more options? I added a second button to my web page with a new ID, and then this JavaScript:

```js
document.querySelector('#shareBtn2').addEventListener('click', async () => {
	if(!navigator.share) return;
	let data = {
		text:"I like cats", 
		title:"This is the title",
		url:"https://www.raymondcamden.com/2023/04/14/need-help-with-coldfusion"
	};

	try {
		let result = await navigator.share(data);	
		console.log(result);
	} catch(e) {
		console.error(e);
	}
});
```

Now I'm specifying text, title, and URL. Normally I assume you would want to use the title of the web page, but I wanted to be really clear as to what values provided what output. Right away, I noticed something cool. The share options changed when I had more to share. Here is desktop Edge again.

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share6.jpg" alt="Desktop share showing more options" class="lazyload imgborder imgcenter">
</p>

Oddly though, it seemed like text and title are now ignored. So for example, clicking Twitter opened up Twitter in a new tab (even though I have the app), and prepopulated the text with the URL, not the text:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share7.jpg" alt="Twitter sharing the URL" class="lazyload imgborder imgcenter">
</p>

Facebook had the same result. GMail was... a bit odd:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share8.jpg" alt="" class="lazyload imgborder imgcenter">
</p>

So it has all the right values, but in what seems to be random order. Well, title does make sense on top, but I'm not sure why text would come after url. Also, notice it adds "Check this out". Why? Who knows. If I select Outlook, I get something similar, but again the values are in random order:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share9.jpg" alt="Share to Outlook" class="lazyload imgborder imgcenter">
</p>

And what about "Windows share options"? That opens *another* menu. Here's the first shot:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share10.jpg" alt="" class="lazyload imgborder imgcenter">
</p>

And when I scrolled, I saw this:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share11.jpg" alt="" class="lazyload imgborder imgcenter">
</p>

Notice Mastodon is back. Clicking that gives me:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share12.jpg" alt="Mastodon sharing" class="lazyload imgborder imgcenter">
</p>

Which is better I guess? On Mac, just showing Safari, it looks like so:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share13.jpg" alt="Safari Share" class="lazyload imgborder imgcenter">
</p>

Note it picked up the title of the URL and the favicon. If I select Notes, it disregards the title and text.

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share14.jpg" alt="" class="lazyload imgborder imgcenter">
</p>

On mobile, again, Android Edge, the Share UI looked the same, mostly. First, notice the preview on top is a bit more filled out:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share15.jpg" alt="" class="lazyload imgborder imgcenter">
</p>

When I shared it with my wife on Facebook Messenger, she got the text value and the URL, which auto-grabbed the social image properly:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share16.jpg" alt="" class="lazyload imgborder imgcenter">
</p>

Sharing to Mastodon was the same. It got the text value and the URL. Sharing to Facebook *only* got the URL and used the wrong image:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share17.jpg" alt="" class="lazyload imgborder imgcenter">
</p>

Sharing on LinkedIn *did* include the text value. 


## Working with Files

If you remember earlier I said that `files` was also a valid option. For that, I added two new fields to my HTML:

```html
<input type="file" id="myFiles" multiple> 
<button id="shareBtn3">Share This!</button>
```

And then grabbed them in my JavaScript. This is mostly copied from the MDN sample:

```js
document.querySelector('#shareBtn3').addEventListener('click', async () => {
	let files = document.querySelector('#myFiles').files;
	if(files.length === 0) {
		alert('For this test, select some files.');
		return;
	}

	if(!navigator.share) return;
	let data = {
		files,
		text:"I like cats", 
		title:"This is the title",
		url:"https://www.raymondcamden.com/2023/04/14/need-help-with-coldfusion"
	};

	let canI = await navigator.canShare(data);
	console.log('Can I share?', canI);
	try {
		let result = await navigator.share(data);	
		console.log('result',result);
	} catch(e) {
		console.error('error from share',e);
	}
});
```

Notice I'm using `canShare`, as recommended by the docs. And here's where things got interesting. By accident, I selected a slightly large file. But `canShare` was fine with it. When `share` ran though, I got two things in my console:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share18.jpg" alt="" class="lazyload imgborder imgcenter">
</p>

Notice how I got a good message as a warning, that's clear, but the actual *error* was permission denied. In theory, I could test this to see what size is too big, and in theory, you can check for that before sharing, but it feels really flakey. 

To make it fun, there are also rules on what types of files can be shared. MDN [documents](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share#shareable_file_types) this, but if I test, `canShare` still returns true and I get an error in the console, except this time I don't get a warning with a nicer explanation. And I literally just noticed, this error is slightly different:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share19.jpg" alt="" class="lazyload imgborder imgcenter">
</p>

If I stop trying to be sneaky and pick a simple image, it didn't work terribly well. For Mastodon, it did what it did last time, used the URL and text, but not the image. Twitter did nothing. For shits and giggles, OneNote *correctly* got the image, and the title, but not the text:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share20.jpg" alt="Sharing to OneNote" class="lazyload imgborder imgcenter">
</p>

On the Mac, where again my options seem limited, it worked kinda. So for example, here's sharing to Mail from Safari:

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share21.jpg" alt="Sharing an image on Mac/Safari" class="lazyload imgborder imgcenter">
</p>

When I tested with Edge on Mac, it *never* worked, even with a small image. (While still happily returning true to `canShare`.)

On mobile, it was better, but still inconsistent. For Facebook, it could share the image, not the text. For Messenger, the same. For Mastodon, it shared the text, URL, and selected image. For LinkedIn, just the selected image. For Evernote, it got the image and the title, but not the text. 

<p>
<img src="https://static.raymondcamden.com/images/2023/04/share22.jpg" alt="Sharing to Evernote" class="lazyload imgborder imgcenter">
</p>

I grabbed my iPad, which I had not used in a while, and tested there as well. Sharing to Twitter there worked near perfectly. It got the text and selected image. Sharing it to LinkedIn got the URL only though. Sharing to Mail worked as it did on the Mac laptop. Sharing to Facebook also only got the URL. 

## Thoughts?

So, one of the main benefits of progressive enhancement is providing additional capabilities where supported and failing gracefully. This *seems* like an API perfect for that. If the browser supports it, add a button, add the event listener, and you're good to go. For cases where a URL, or file, is not being shared, it does *not* seem to work well. For cases where you share a URL, it seems you can't ever count on the text or title to be available consistently. And sharing a file seems problematic. Honestly, I'm not sure I'd use this. When I started thinking about this API my plan was to actually use it here to enhance the sharing options you see at the bottom of the post. For now, I've changed my mind about that. 

If you want to test how I did, you can find my Glitch project here: <https://glitch.com/edit/#!/standing-frosted-shame?path=script.js%3A54%3A0>. Note that sharing will *not* work in the preview window. Instead, view the "live" version: <https://standing-frosted-shame.glitch.me/>

Photo by <a href="https://unsplash.com/@ecasap?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Elaine Casap</a> on <a href="https://unsplash.com/s/photos/sharing?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  