---
layout: post
title: "An Image Dialog Web Component"
date: "2023-12-13T18:00:00"
categories: ["javascript"]
tags: ["web components"]
banner_image: /images/banners/cat_painting.jpg
permalink: /2023/12/13/an-image-dialog-web-component
description: A simple web component that enhances a linked image to use a dialog.
---

A lot of the talk (well, on Mastodon at least) lately concerning web components has been on "HTML Web Components". The idea is that web components can progressively enhance "regular" HTML in the DOM instead of completely blowing it away with the Shadow DOM. (You can find a deeper discussion of this in Jim Nielsen's [blog post](https://blog.jim-nielsen.com/2023/html-web-components/).) This is something that's been on my mind for a while now as well and I've kept my eyes open for opportunities to build web components that enhance, not replace, content. With that in mind, I built a really simple component that does something fun.

We've all seen sites that use JavaScript to provide a thumbnail and detail view of images. So for example, you may have a set of thumbnails and when one image is picked, a larger image is loaded on top of the visible page as a modal view. Sometimes the background is dimmed and blurred a bit. 

The web platform actually has a (new-ish) tag for this, [dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog), and I looked at how I could build a web component that would make use of this.

I began with simple HTML - a small image wrapped in an anchor tag linking to the full image:

```html
<a href="https://static.raymondcamden.com/images/banners/cat_tree.jpg">
	<img src="https://res.cloudinary.com/raymondcamden/image/fetch/c_fit,w_250/https://static.raymondcamden.com/images/banners/cat_tree.jpg">
</a>
```

Right away, if nothing else I build works, if JavaScript is disabled or something else goes wrong, then the user can still see both the thumbnail and full image. It just plain works. 

Next, I wrapped it in a web component:

```html
<dialog-image>
<a href="https://static.raymondcamden.com/images/banners/cat_tree.jpg">
	<img src="https://res.cloudinary.com/raymondcamden/image/fetch/c_fit,w_250/https://static.raymondcamden.com/images/banners/cat_tree.jpg">
</a>
</dialog-image>
```

The nice thing about the web platform is that even without writing JavaScript, this doesn't break anything. It's just an unrecognized HTML tag and browsers can handle it. Now let's look at the code to make this actually do something:

```js
class DialogImage extends HTMLElement {
	constructor() {
		super();
	}
	
	connectedCallback() {
		// Get my image, should be one only.
		let img = this.querySelector('img');

		if(!img) {
			console.warn('dialog-image: No image found. Exiting.');
			return;
		}

		let parent = img.parentNode;
		if(parent.nodeName !== 'A') {
			console.warn('dialog-image: Image not wrapped in link. Exiting.');
			return;			
		}

		let fullImageLink = parent.href;
		
		let dialog = document.createElement('dialog');
		
		dialog.innerHTML = `
  <form method="dialog">
		<p>
		<img src="${fullImageLink}">
		</p>
		<p style="text-align:center">
    <button type="submit">Close</button>
		</p>
  </form>
		`;
		parent.parentNode.insertBefore(dialog, parent.nextSibling);

		img.addEventListener('click', e => {
			e.preventDefault();
			dialog.showModal();
		});
		
	}

}

if(!customElements.get('dialog-image')) customElements.define('dialog-image', DialogImage);
```

I begin by looking for the image inside my part of the DOM. My requirement is one image wrapped in an anchor, so after getting the image, I ensure the parent node is an anchor as well. 

Next, I create a `dialog` tag and set its HTML. The HTML uses the HREF value from the anchor for the image and uses a button to allow for closing the dialog. Note the use of `<form method="dialog">` as that will capture the button click and close out the dialog. Unlike "usual" modals like this, clicking elsewhere in the DOM does *not* dismiss it, but the ESC key will work. 

This line, `parent.parentNode.insertBefore(dialog, parent.nextSibling);`, may look a bit weird. I want to add the dialog outside of the anchor tag (which is `parent`), but immediately after, so this little 'DOM dance' accomplishes that.

The last step is to add a click handler to the image that opens the modal. You can test, and fork, the demo below. 

<p class="codepen" data-height="800" data-theme-id="dark" data-default-tab="result" data-slug-hash="KKJYjLv" data-editable="true" data-user="cfjedimaster" style="height: 800px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/KKJYjLv">
  PE Table for Sorting (2)</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

One note - I added a bit of CSS to make the dialog stand out a bit, and in my CodePen, just styled `dialog`:

```css
dialog::backdrop {
  background: #fff5;
  backdrop-filter: blur(4px);
}
```

Part of me thinks my web component should always use a particular class on the `dialog` it adds such that it doesn't conflict with other dialogs on the page. In that case, you would do something like this:

```css
dialog.mywebcomponent::backdrop {
  background: #fff5;
  backdrop-filter: blur(4px);
}
```

Comments, as always, are welcome. :) 