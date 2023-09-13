---
layout: post
title: "Building a QR Coder Web Component"
date: "2023-09-13T18:00:00"
categories: ["javascript"]
tags: ["web components"]
banner_image: /images/banners/catqr.jpg
permalink: /2023/09/13/building-a-qr-coder-web-component
description: 
---

It's been a hot minute or so since I played with [web components](https://www.raymondcamden.com/tags/web+components), mainly because I've been re-evaluating when I think it best makes sense to use them. One idea I've been chewing over lately is that progressive enhancement could really be the sweet spot for components, something I really got into earlier this year when I shared a [sortable table component](https://www.raymondcamden.com/2023/03/14/progressively-enhancing-a-table-with-a-web-component) that, if it failed to load, wouldn't break anything. 

A few days ago, my buddy [Scott](https://scottstroz.com/) shared an interesting tip for Chrome/Edge users, specifically that you could right-click on a web page and generate a QR code for the URL:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/qr1.jpg" alt="A screenshot from Edge showing the right-click menu with the option to generate a QR code." class="imgborder imgcenter" loading="lazy">
</p>

After selecting this, the code is shown on top of the browser along with the URL:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/qr2.jpg" alt="Generated QR code" class="imgborder imgcenter" loading="lazy">
</p>

One nice thing is that the URL there is editable, which means you can remove all the social tracking crap that you get when you follow links from Facebook, etc. Also, you can just type for fun in there and watch the QR code change. Go ahead and do that, I did. 

I thought it might be a nice idea to build this into a web component. The idea is, that you drop the component on a page and it automates the process of creating a QR code for the current URL. While a bit rough, here's what I came up with.

## Choosing the Library

I knew I wasn't going to generate the QR code myself, so I googled around a bit to find a decent JavaScript library for working with QR codes. Many of the results I found were a bit old. Technically there's nothing wrong with that. I've seen the same for RSS parsing. The spec hasn't changed much so sometimes there's no need to do updates. That being said, I settled on [QR Code JS](https://github.com/danielgjackson/qrcodejs) by Daniel Jackson. I liked how simple the interface looked and it seemed to have some recent activity on the repo. 

As an example of the API, here's a complete demo from their read.me:

```html
<img>
<script type="module">
    import QrCode from 'https://danielgjackson.github.io/qrcodejs/qrcode.mjs';

    const data = 'Hello, World!';
    const matrix = QrCode.generate(data);
    const uri = QrCode.render('svg-uri', matrix);
    document.querySelector('img').src = uri;
</script>
```

Nice and simple. The library supports quite a few options, but I liked how simple that looked. 

## The Web Component

Okay, now for the fun part, the component. In my mind, the ideal use would be to place the component in your HTML, roughly where you would like to offer the option to users. While not the best, in this example, I've just put it at the bottom of a page.

```html
<h2>Regular Web Page</h2>

<p>
    This is a regular web page. It is so awesome, I bet you want to share
    it with all your friends. To make that easier, you can generate a QR
    code by clicking the button below.
</p>

<qr-component width="200" height="200">Get QRCode</qr-component>
```

I decided my component would have 3 arguments. Height and width, both optional with defaults, and the third "argument" is the text between the tags. As my output is going to be a button, the text here would be used for the button.

<p>
<img src="https://static.raymondcamden.com/images/2023/09/qr3.jpg" alt="Sample HTML page with the button being displayed at the bottom." class="imgborder imgcenter" loading="lazy">
</p>

Now let's take a look through the JavaScript. I begin by importing the library:

```js
import QrCode from 'https://danielgjackson.github.io/qrcodejs/qrcode.mjs';
```

Next, I define the component itself, starting with the class and constructor:

```js
class QrComponent extends HTMLElement {

    constructor() {
        super();
        this.width = 250; 
        this.height = 250;
        this.text = 'Generate QR Code for this URL.';
    }
```

There are my defaults for height and width, and `text` will be used if you don't pass anything to the tag. You'll see how that works in a moment.

The real work begins in `connectedCallback`:

```js
    connectedCallback() {
        if(this.getAttribute('width')) this.width = this.getAttribute('width');
        if(this.getAttribute('height')) this.height = this.getAttribute('height');
        
        this.attachShadow({ mode: 'open' })
      .innerHTML =  `
            <button><slot>${this.text}</slot></button>
        `;
```

I begin by updating height and width if passed in. The component itself is only one button, and note the use of the `slot` tag. This will use the default text defined above, *unless* you put something in the middle. One minor bit of warning there - if you do something like this:

```html
<qr-component width="200" height="200">
</qr-component>
```

The line break is considered input and will be used. 

Next, we need to do the interactivity. My idea was, on clicking the button, to generate the QR code and render it. I *really* struggled with where to put it. I initially considered centering it over the button (you'll see a bit of commented-out code related to that), but I ended up just centering it on screen.

```js
this.shadowRoot.querySelector('button').addEventListener('click', e => {
    /*
    let myloc = e.currentTarget.getBoundingClientRect();
    console.log(myloc);
    */
    let data = document.location.href;
    let matrix = QrCode.generate(data);
    let uri = QrCode.render('bmp-uri', matrix);
    let img = document.createElement('img');
    img.setAttribute('width', this.width);
    img.setAttribute('height', this.height);
    img.setAttribute('title', 'Click to dismiss.');
    img.style.position = 'fixed';
    img.style.top = '50%';
    img.style.left = '50%';
    img.style.transform = 'translate(-50%, -50%)';
    
    img.src = uri;
    img.addEventListener('click', e => {
        e.currentTarget.remove();
    });
    this.shadowRoot.append(img);

});
```

I also use a `click` event on the image so it can be dismissed. You can play with this yourself in the CodePen below:

<p class="codepen" data-height="400" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="eYbWqEB" data-editable="true" data-user="cfjedimaster" style="height: 400px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/eYbWqEB">
  Untitled</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

It's a bit overwhelming in the small iframe above, but, it's just a demo so I'm happy enough with it.

As luck would have it, about three hours ago, I got the [latest issue](https://frontendfoc.us/issues/609) of Frontend Focus, and one of the linked articles was for a QR code web component: [qr-code](https://github.com/bitjson/qr-code). This project is *really* cool and even supports animations. As I built mine just for practice with web components, I'd definitely take a look at this project for "real" usage. 