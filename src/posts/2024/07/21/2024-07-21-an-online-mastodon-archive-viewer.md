---
layout: post
title: "An Online Mastodon Archive Viewer"
date: "2024-07-21T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_rain.jpg
permalink: /2024/07/21/an-online-mastodon-archive-viewer
description: An online viewer of your Mastodon archived data
---

Here's a quick write-up of something I actually built a week or so ago... and forgot to share on the blog. Instead, I shared a way to [integrate your Mastodon with Eleventy](https://www.raymondcamden.com/2024/07/04/building-a-web-version-of-your-mastodon-archive-with-eleventy). In that post, I mentioned how the account [Fedi.Tips](https://social.growyourown.services/@FediTips) was looking for ways to let people view their archived Mastodon data. I followed their [guide](https://fedi.tips/how-to-download-your-mastodon-post-archive/) on getting my export and started work on a simple viewer. 

If you don't care about the "how", and have your archive ready, just head on over to <https://tootviewer.netlify.app> and upload your zip.

## The Archive

When you get your Mastodon archive, it will be a zip file containing the following:

* actor.json: A file related to the user, yourself probably.
* avatar.jpg: You're current profile picture.
* bookmarks.json: A list of your bookmarks. (I don't use this feature myself.)
* header.jpg: The header image in your profile.
* likes.json: A list of your liked toots.
* media_attachments: All media you have attached to posts. There is a file subdirectory and then subdirectories numerically named with further subdirectories *many* levels deep with the actual data.
* outbox.json: Finally, a JSON file of your toots.

<p>
<img src="https://static.raymondcamden.com/images/2024/07/toot1.jpg" alt="Screenshot of archive unzipped" class="imgborder imgcenter" loading="lazy">
</p>

I decided to focus mainly on actor.json and outbox.json, figuring toots would be the most critical thing folks would want to examine. 

## The App

At a high level, the application consists of:

* [Alpine.js](https://alpinejs.dev/) to help with the architecture.
* [Shoelace](https://shoelace.style/) for visual components
* [JSZip](https://stuk.github.io/jszip/) for JavaScript parsing of the zip file. Honestly, I didn't *need* this, I could have asked users to unzip first, but I wanted it to be as easy as possible. 

I'm not going to over every line of code (I'll share a link to the repo at the end), but here are some interesting bits.

## Ingesting the Data

There re two ways to select your archive, either via a simple `input[type=file]` or drag and drop. I covered how to do this in-depth here: ["Using Drag/Drop in Alpine.js with PDF Embed"](https://www.raymondcamden.com/2024/01/16/using-dragdrop-in-alpinejs-with-pdf-embed)

Once you have a handle to the file, I then begin the process of parsing the zip in a function named `loadZip`. I begin with a bit of validation:

```js
this.status = 'Checking zip file.';
let zip = new JSZip();
let zipContents = await zip.loadAsync(file);

let names = Object.keys(zipContents.files);
if(!this.validateArchive(names)) {
	this.status = 'This does not appear to be a valid Mastodon archive.';
	return;
} 
```

The `validateArchive` function does simple sanity checking on the entries of the zip:

```js
validateArchive(names) {
	/*
	our 'rules' for valid archive are:
	must have outbox.json and actor.json
	this could be improved 
	*/
	return names.includes('outbox.json') && names.includes('actor.json');
}
```

Going back to `loadZip`, I can then read my two files (again, I'm only concerned with toots and your profile):

```js
// read in actor and outbox for processing
this.actorData = JSON.parse((await zipContents.files['actor.json'].async('text')));	

this.messageData = JSON.parse((await zipContents.files['outbox.json'].async('text'))).orderedItems.filter(m => m.type === 'Create');
```

Notice that I do a filter on your toots to focus on items related to writing toots. The data also seemed to include things like announcements of accounts I followed and such, so this filter removed any noise. 

Finally, I store all of this in localStorage. This made testing a heck of a lot easier as I could reload and skip uploading the zip, but if I do decide to work with media, I'll need to switch to IndexedDB instead. 

## The UI

The UI is still very much a work in progress, but I focused on showing your profile first:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/toot2.jpg" alt="Screenshot of profile" class="imgborder imgcenter" loading="lazy">
</p>

You'll notice I did *not* render your avatar and header. I absolutely could have, and heck, may add that in a few minutes as I literally just thought of a nice way of doing that and storing it in local storage. 

Beneath the profile view is the most important bit, your toots:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/toot3.jpg" alt="Toot view" class="imgborder imgcenter" loading="lazy">
</p>

You'll notice on top there is a quick filter and pagination. I've got nearly two thousand toots so pagination was required and the search lets me find anything by keyword. As I mentioned, I'm not handling media yet so you won't see attached pictures in the view here, but each individual toot is linked to the original for quick view in the native Mastodon view.

## The Code, and What's Next

If you've got ideas or suggestions, please head over to the repo (<https://github.com/cfjedimaster/tootviewer>) and let me know. I'm open to any PRs as well. As I said above, I think I'll quickly add your profile pics to the UI, but outside of that, I think the main thing I want to tackle is supporting media in the toot display and perhaps a general media browser. (You may remember posting a particular picture but have forgotten what you typed *about* the picture.) I hope this helps folks out!
