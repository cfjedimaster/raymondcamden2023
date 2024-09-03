---
layout: post
title: "Working with the Storage API"
date: "2023-08-25T18:00:00"
categories: ["javascript"]
tags: ["javascript"]
banner_image: /images/banners/storage_ij.jpg
permalink: /2023/08/25/working-with-the-storage-api
description: A look at the Storage API
---

Earlier this year at WWDC, Apple [announced](https://webkit.org/blog/14205/news-from-wwdc23-webkit-features-in-safari-17-beta/) a whole set of new features coming to Safari in version 17. While that is not out yet, it's still a pretty large set of updates. I've not been shy about my view that Safari has been holding the web back for a while, but I'm happy for any improvements that show up. While looking at the *long* list of updates, I saw [Storage](https://webkit.org/blog/14205/news-from-wwdc23-webkit-features-in-safari-17-beta/#javascript-and-web-api) mentioned:

<div class="smallerQuote">
<p>
WebKit has made some big updates to the storage quota policy. Previously, an origin had a starting storage limit of 1 GB. When exceeding the limit, the subsequent storage operation would fail in Home Screen web apps, or the user would see a prompt asking to increase the quota for the origin in Safari. Starting in macOS Sonoma, iOS 17 and iPadOS 17, the quota is calculated based on total disk space without the user's input. The origin generally gets a much higher limit, and the user isn't prompted in Safari. To get the estimated value of the current origin quota and usage, you can use the newly supported `navigator.storage.estimate()` method.
</p>

<p>
As each origin gets a higher storage limit by default, WebKit will evict data by origin when the total usage of all origins is bigger than a certain value, the "overall quota", calculated based on total disk space. An origin is exempt from eviction when its storage mode is persistent. To check the storage mode of your origin, you can use navigator.storage.persisted(); to request the mode be changed to persistent, you can use navigator.storage.persist(). Critical bug fixes have been made to ensure the storage mode value is remembered across sessions, and eviction will count on it. <strong>The Storage API is now fully supported.</strong>
</p>
</div>

Emphasis mine. I've written quite a bit about storage and browsers, but the [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API) itself is one I haven't played with. Here's what I've found.

## What does it do?

The Storage API breaks down to a few core methods:

* Check for the *type* of persistence: One thing that is possibly a bit confusing is how the browser handles "persistent" data. If you're like me, you hear persistent and assume it means, well, persistent. That's not quite right. A browser will persist data but also evict it if storage begins to get limited. Think of it like a casual relationship. The data can stick around, but there are no guarantees if things get sticky.

* Ask to be persisted: Again, this could be confusing, but this is really the ability to ask for "more* persistent persistent data. This means that the browser won't willy nilly delete the data, but rather ask the user if they're cool giving the website more storage. Asking to be persisted is basically asking your girl/boyfriend to get married. 

* Ask for an estimate: This lets you check how much data has been stored along with a breakdown showing how it's broken down by type, for example, Service Worker based cache versus IndexedDB. 

* Last but not least, get the file system: This gives a hook to the ["origin private file system"](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) which lets you read and write files and directories in a directory sandboxed for the website. 

For today, I'm going to focus on the first three items.

## How is my data persisted?

To see if data is persisted (and again, we mean *really* persisted past an eviction due to low storage), we can use `navigator.storage.persisted`. This returns a Promise that resolves to yes or no. So for example:

```js
let persisted = await navigator.storage.persisted();
console.log(`Storage ${persisted?'is':'is not'} persisted.`);
```

The default should be false, which makes sense I think if we try to be as 'nice' as possible to the user's disk drive. 

## How do I request the REALLY persistent goodness?

To ask for the really persistent version of persistence (not confusing at all), you can use `navigator.storage.persist`. Here's an example:

```js
async function reqPersistence() {
	let persisted = await navigator.storage.persist();
	if(persisted) {
		console.log('Storage will now persist (more).');
	} else {
		console.log('Permission for greater persistence was not granted.');	
	}
}
```

In this case, the true/false result refers to how the permission was handled. Now, here comes something interesting. I tested on a localhost server, and CodePen, in both Chrome and Edge. In both cases, when the request was fired, it was immediately granted and I wasn't asked. I tried in Firefox, and got a prompt:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/store1.jpg" alt="Screenshot from Firefox prompt" class="imgborder imgcenter" loading="lazy">
</p>

It's entirely possible I granted storage on Chrome/Edge in the past. I tested in console on other websites and every attempt I ran always returned `Permission for greater persistence was not granted.`, even if I added the call as an event handler based on user input. As a last-ditch effort, I rolled out a Glitch project: <https://lacy-awesome-park.glitch.me/> 

On this site, Firefox worked perfectly, I was given a prompt. In both Edge and Chrome, I was immediately told no without a user prompt. 

On a whim I quickly Googled and found [this gem](https://groups.google.com/a/chromium.org/g/chromium-discuss/c/AWMgYFD_gJs?pli=1) from 2017:

"Persistent storage does not prompt the user in Chrome. Instead, the browser uses latent metrics (is the page bookmarked, or does it have notifications permission granted for instance) to determine if the user is using the site sufficiently to allow storage to be persistent."

And then found this [article](https://web.dev/persistent-storage/):

"Chrome, and most other Chromium-based browsers automatically handle the permission request, and do not show any prompts to the user. Instead, if a site is considered important, the persistent storage permission is automatically granted, otherwise it is silently denied."

So... ok. Considering that the *really* persistent version is not necessarily required, this isn't a deal breaker, and at least your code *knows* now what's going on. 

Again, remember that the browser is still going to persist your data, it will just clean it up if low on disk space and the data hasn't been used recently. 

## Just how much am I using?

The final thing I'll look at is `navigator.storage.estimate`. This returns a Promise that includes:

* `quota`: A "conservative estimate" (in bytes) of the storage allowed for this web site.
* `usage`: Actual usage (in bytes)
* `usageDetails`: A breakdown of how much is stored where, this is *not* supported in Safari. According to [MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate), it looks like it won't be since `estimate` itself is marked as coming in 17. If this were too, I'd expect the same.

Here's an example of using, with some code copied from MDN:

```js
async function checkEstimate() {
	let estimate = await navigator.storage.estimate();
	console.log(estimate);
	
	// Math help from https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
	let percentage = (
    (estimate.usage / estimate.quota) *
    100
  ).toFixed(2) + '%';
	
	let total = (estimate.quota / 1024 / 1024).toFixed(2) + 'MB';
	let used = (estimate.usage / 1024 / 1024).toFixed(2) + 'MB';
	
	console.log(`This site is using ${used} (${percentage}) of ${total}.`);
}
```

To test, I wrote some code to "stuff" LocalStorage and IndexedDB. I used the [Dexie](https://dexie.org/) library to simplify that. Here's my (admittedly) lame function:

```js
async function stuffStorage() {

    $result.innerHTML = 'Fixing to write some stuff to storage.';
    let bigstr = '123456789'.repeat(99);
    for(let i=0;i<999;i++) {
        window.localStorage.setItem(String(Date.now()), bigstr);
    }

    let db = new Dexie('stuff_dexie');
    db.version(1).stores({stuff:'++id'})
    for(let i=0;i<999;i++) {
        await db.stuff.put({thing:'thing'.repeat(99), more:'another thing'.repeat(99)});
    }


    $result.innerHTML = 'Done writing stuff to storage.';

}
```

I have this up and running on Glitch. Check it out here (<https://lacy-awesome-park.glitch.me/>), and try running the 'stuff' button a few times. For me, after a few clicks, I was able to get it to about 2%:

<p>
<img src="https://static.raymondcamden.com/images/2023/08/store2.jpg" alt="Example usage output" class="imgborder imgcenter" loading="lazy">
</p>

One thing I noted was that there is no information was reported on LocalStorage, just IDB:

```json
{
    "indexedDB": 2225384
}
```

## TLDR

It's important to remember that there are two types of persistence in browsers. One can be blown away due to space or lack of usage, which to me isn't a bad thing, just something to keep in mind. Use the browser's caching for improved performance. Not only can you check what kind your data is using, but you can also ask for more persistent storage. Finally, you can do a check on how much is being used and what's left. All in all, great tools!