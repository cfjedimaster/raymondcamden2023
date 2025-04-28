---
layout: post
title: "BoxLang Quick Tips - Working with Zip Files"
date: "2025-04-28T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/blqt_zip.jpg
permalink: /2025/04/28/boxlang-quick-tips-working-with-zip-files
description: Compressing, extracting, and reading zip files.
---

Time for another [BoxLang](https://boxlang.io) Quick Tip! This time I'll be demonstrating how to work with zip files and as always, you can find a video version at the bottom of the post. There's one small issue with the video I'll address at the end, but outside of that, you can read, watch, or both! Ok, let's dig in.

Before we begin, note that BoxLang supports both zip and gzip files. My demo code works with zip files only, but you can easily perform the same actions with gzip as well. 

## Creating Zip Files

To create zip files, you make use of the [`compress`](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/zip/compress) built in function. It has arguments for format (either zip or gzip), the source path, and the destination path. It also lets you tweak other settings. For example, when zipping a folder, you can tell it to *not* include the base folder it the created zip. You can also perform a filter (either by matching a file name or using a function) on what gets included. 

Here's an example showing how easy it is:

```js

directory = expandPath('./sourceForZip');
compress(format='zip', source=directory, destination='./myzip.zip', overwrite=true, includeBaseFolder=false);
println('I made a zip!');
```

Basically, zip up the folder, store it as `myzip.zip`, overwrite if it exists, and don't include the base folder. I feel like that aspect may be a bit confusing so let me show you an example. 

If I do not specify that value, or set it to `true`, when I open up the zipped file I'll see `sourceForZip` at the root, and if I go into that folder, I'll see my files. 

<p>
<img src="https://static.raymondcamden.com/images/2025/04/zip1.jpg" alt="Windows explorer view of the zip with an arrow pointing to the folder." class="imgborder imgcenter" loading="lazy">
</p>

If I set the value to `false`, I instead just get the files:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/zip2.jpg" alt="Windows explorer view of the zip with files at root" class="imgborder imgcenter" loading="lazy">
</p>

Personally, I much prefer this style of a zip versus a zip of a folder, but you've got both options. 

## Extracting Zip Files

To extract, you'll use... wait for it... the [`extract`](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/zip/extract) function. Like `compress`, it has options for the type of zip, where to extract, filtering, and more. Here's an example:

```js
directory = expandPath('./destinationForZip');
directoryCreate(path=directory, ignoreExists=true);

zipFile = expandPath('./myzip.zip');

if(!fileExists(zipFile) || !isZipFile(zipFile)) {
	println("#zipFile# doesn't exist or is not a zip.");
	abort;
}

extract(format='zip', source=zipFile, destination=directory, overwrite=true);
println('I extracted a zip!');
```

Notice I also demonstrated [`isZipFile`](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/zip/iszipfile), another built in function that can be used to verify the type of file before working with it. While I'm at it, also note `ignoreExists` as an option to `directoryCreate` - I 💖 that. 

I mentioned that both `compress` and `extract` support filtering, either via a file glob or callback function. Here's an example of a glob:

```js
extract(format='zip', source=zipFile, destination=directory, overwrite=true, 
	filter="*.pdf");
```

This will only extract files that end with `.pdf` in their name. 

## Reading Zip Files

While `compress` and `extract` are focused on creating/expanding zip files, the [`zip`](https://boxlang.ortusbooks.com/boxlang-language/reference/components/zip/zip) component comes with pretty much every feature baked in. The component can do everything the two built in functions can as well as list contents of a zip. Here's an example:

```js
inputZip = './myzip.zip';

bx:zip action="list" file=inputZip result="zipFiles";

writeDump(zipFiles);
```

Which returns an array of elements for each item in the zip. Here's a snapshot of that:

```js
[{
  type : "file",
  directory : "cat.png",
  crc : 901797777,
  fullpath : "cat.png",
  compressedSize : 1689432,
  lastModifiedTime : "2025-04-28T18:43:38Z",
  lastAccessTime : "",
  isDirectory : false,
  size : 1688917,
  dateLastModified : {ts '2025-04-28 13:43:38'},
  name : "",
  comment : [null],
  creationTime : ""
}, {
  type : "file",
  directory : "d1.png",
  crc : 3121387242,
  fullpath : "d1.png",
  compressedSize : 13391436,
  lastModifiedTime : "2025-04-28T18:43:38Z",
  lastAccessTime : "",
  isDirectory : false,
  size : 13394810,
  dateLastModified : {ts '2025-04-28 13:43:38'},
  name : "",
  comment : [null],
  creationTime : ""
}, {
  type : "file",
  directory : "pw.png",
  crc : 944932595,
  fullpath : "pw.png",
  compressedSize : 7287202,
  lastModifiedTime : "2025-04-28T18:43:38Z",
  lastAccessTime : "",
  isDirectory : false,
  size : 7285668,
  dateLastModified : {ts '2025-04-28 13:43:38'},
  name : "",
  comment : [null],
  creationTime : ""
}]
```

Note how you get details including how much the item was compressed. As I said, the component is pretty powerful, so check the [docs](https://boxlang.ortusbooks.com/boxlang-language/reference/components/zip/zip) for the full syntax.

You can find all the demo files for this post here: <https://github.com/ortus-boxlang/bx-demos/tree/master/boxlang_quick_tips/zip>

## A Quick Note

While working on the video for this post, the BoxTeam and I discovered a small inconsistency with the zip functions versus `directoryList`. The `directoryList` function used file globs while `compress` and `extract` used a regex. It was decided to switch the functions to use globs which is what you see above. You will *not* see that in my video as the change was made right after, and, the change is not in the release version yet, but will be available in 1.0 which is out in a few days. The docs will be updated to reflect this change as well. (That's on me to fix, so, Ray, don't forget.) Anyway, with that out of the way, enjoy the silky smooth sound of my voice!

{% liteyoutube "6rGMDicSF6U" %}

