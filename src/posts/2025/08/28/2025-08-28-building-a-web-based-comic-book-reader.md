---
layout: post
title: "Building a Web Based Comic Book Reader"
date: "2025-08-28T18:00:00"
categories: ["development"]
tags: ["javascript","generative ai"]
banner_image: /images/banners/comic_sw.jpg
permalink: /2025/08/28/building-a-web-based-comic-book-reader
description: Reading Electronic Comic Books via the Web
---

Ok, so I know I've been spending way too much time lately talking about comic books, but I've been reading them for roughly 80% of my life now so they're just a natural part of my life. Now, my best friend [Todd Sharp](https://recursive.codes/) told me this crazy lie that he's never read a comic book before, but surely that's a lie. Surely. 

Earlier this week, I took a look at [parsing electronic comic books and sending them to GenAI](https://www.raymondcamden.com/2025/08/26/connecting-comic-books-to-generative-ai) as a way to get summaries of stories. That was a fun experiment and it actually worked quite well. I thought I'd take a stab at trying a similar approach with Chrome's [Built-in AI](https://developer.chrome.com/docs/ai/built-in) support as well when I discovered that... wait... I don't actually have a way to view comics on the web. Or so I thought. 

Way, *way*, back in 2012 I wrote a post on that very topic: ["Building an HTML5 Comic Book Reader"](https://www.raymondcamden.com/2012/05/29/Building-an-HTML5-Comic-Book-Reader). This was back when you would still describe 'modern' web apps as HTML5 apps. Now that looks dated as hell. The code in this post is absolutely outdated now. It made use of the FileSystem API for extraction versus just doing everything in memory. It also only used CBZ files as I wasn't able to find a RAR library for JavaScript back then. I decided to take a stab at updating it to a more modern version and here's what I came up with.

## The Stack

For the updated demo, I made use of the following libraries:

* [Shoelace](https://shoelace.style/) - I love Shoelace's look and web component API, but I have to be honest, I barely used it in my demo and it's probably over kill for what I built. But I like it - so I'm keeping it. 
* [zip.js](https://gildas-lormeau.github.io/zip.js/) - for supporting CBZ files.
* [Unarchiver.js](https://xenova.github.io/unarchiver.js/) - for RAR support. Technically this library supports zip files (and more) too, but I came to this after I had zip working well and ... I didn't want to poke the bear. If I were to be shipping this as a 'real' project, I'd probably remove zip.js and just use this library.

And that's it. The application is entirely client-side code. Oh, and no React. Is that allowed?

## Drag/Drop Comics

Alright, let's get into the code proper. I began by simply adding a div to the page where you could drop your file. To be honest, I could have supported it on the document as a whole, but I liked the idea of a nice little box. 

Here's the HTML I used:

```html
<div id="dropZone">
Drop .CBR/.CBZ here.
</div>
```

And here's the JavaScript that's going to handle it. To keep things a bit simpler, I'm going to ignore some of the DOM setup code and such. I'll be linking to everything below.

```js
document.addEventListener('DOMContentLoaded', init, false);

async function init() {

	$dropZone = document.querySelector('div#dropZone');
	$dropZone.addEventListener('dragover', e => e.preventDefault());
	$dropZone.addEventListener('drop', handleDrop);

}
```

The function to handle file drops is below:

```js
function handleDrop(e) {
	e.preventDefault();

	let droppedFiles = e.dataTransfer.files;
	if(!droppedFiles) return;
	let myFile = droppedFiles[0];
	let ext = myFile.name.split('.').pop().toLowerCase();

	if(ext !== 'cbr' && ext !== 'cbz') {
		$filetypeAlert.toast();
		return;
	} 

	$filetypeAlert.hide();
	$dropZone.style.display = 'none';

	// note, for rar, go right to handler 
	if(ext == 'cbr') {
		handleRar(myFile);
		return;
	}

	let reader = new FileReader();
	reader.onload = e => {
		if(ext === 'cbz') handleZip(e.target.result);
	};
	reader.readAsArrayBuffer(myFile);
}
```

I've got a few things going on. First, I look for the file data associated with the dropped file and check the extension. If it doesn't match what I'm looking for, I show an error toast (provided by Shoelace). 

For my RAR files, I can pass the file object directly to a function to work with it. I don't believe zip.js supports this so for that case, I'm reading in the bits and then passing it off to the function to handle it. (This is probably another clue I should have just used Unarchiver.js.)

## Parsing the Archives

This is the cool part I think. I wrote two functions, one to handle RARs, and one to handle Zips. My thinking is that these functions would hand off the results, a set of images, to a display function, but I also knew both libraries had a wrapped interface to working with archive entries. So I thought - what if these functions also created a function that literally says, "Given you want page X, here's a function to return that image data." 

Here's both those functions, and make note of the inner functions. This is that special handler for images.

```js
async function handleRar(d) {
	const getData = async p => {
		let data = await p.read();
		return URL.createObjectURL(data);
	}

	let archive = await Unarchiver.open(d);

	// todo - remove Thumbs.db if possible
	let entries = archive.entries.filter(e => e.is_file);

	displayComic(entries, getData);
}

async function handleZip(d) {

	const getB64 = async p => {
		let dw = new zip.Data64URIWriter();
		return await p.getData(dw);
	}

	const blob = new Blob([d], { type: 'application/octet-stream' });
	const reader = new zip.ZipReader(new zip.BlobReader(blob));

	const entries = (await reader.getEntries()).filter(e => !e.directory && !e.filename.endsWith('Thumbs.db'));

	displayComic(entries, getB64);
}
```

Note that I've got code in to filter directories. Many comic book archives begin with a folder of images rather than simply storing the images as is. I also look out for `Thumbs.db`, at least in my CBZ files. 

## Rendering the Comic Pages

Next up - actually rendering the pages. I've got a bit of basic HTML for this that will handle rendering a page count, buttons, and the image:

```html
<div id="comicDisplay">
  <div id="comicNav">
    <div id="pageNumbers"></div>
    <div id="pageNavigation">
      <sl-button-group label="Navigation">
        <sl-button id="prevButton">Previous</sl-button>
        <sl-button id="nextButton">Next</sl-button>
      </sl-button-group>
    </div>
  </div>
  <p>
  <img id="currentPage">
  </p>
</div>
```

And here's the JavaScript:

```js
async function displayComic(pages, reader) {

	const doPrevPage = async () => {
		if(currentPage == 0) return;
		currentPage--;

		$pageNumbers.innerHTML = `Page ${currentPage+1} of ${pages.length}`;
		$currentPage.src = await reader(pages[currentPage]);
	};

	const doNextPage = async () => {
		if(currentPage+1 === pages.length) return;
		currentPage++;
		$pageNumbers.innerHTML = `Page ${currentPage+1} of ${pages.length}`;
		$currentPage.src = await reader(pages[currentPage]);
	};

	let currentPage = 0;
	$comicDisplay.style.display = 'block';
	$pageNumbers.innerHTML = `Page 1 of ${pages.length}`;
	$currentPage.src = await reader(pages[0]);
	$prevButton.addEventListener('click', doPrevPage);
	$nextButton.addEventListener('click', doNextPage);
}
```

Again, I'm pretty proud of this. I love that the logic for getting the actual bits is passed in by the corresponding zip/rar handlers and this can be done more generic. 

## The App

I assume most folks won't have electronic comic books handy unless you're a big nerd like me. If you want, head over to [ComicBook+](https://comicbookplus.com/) and grab a few. Here's the app before you upload:

<p>
<img src="https://static.raymondcamden.com/images/2025/08/cw1.jpg" alt="App waiting for you to drop the mic..." class="imgborder imgcenter" loading="lazy">
</p>

And here's a sample comic. Note that I could probably render the image a bit better here.

<p>
<img src="https://static.raymondcamden.com/images/2025/08/cw2.jpg" alt="Example rendering a Batman comic" class="imgborder imgcenter" loading="lazy">
</p>

Want to try it yourself? You can play with it here: <https://cfjedimaster.github.io/ai-testingzone/comic_web/index.html>

And the full code may be found here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/comic_web>

The next step will be to add AI integration!

Image by <a href="https://pixabay.com/users/kidsnewshu-5999490/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=5345814">kidsnews.hu</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=5345814">Pixabay</a>