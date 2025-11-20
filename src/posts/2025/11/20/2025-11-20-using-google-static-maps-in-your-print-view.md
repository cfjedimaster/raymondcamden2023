---
layout: post
title: "Using Google Static Maps in Your Print View"
date: "2025-11-20T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/printedmap.jpg
permalink: /2025/11/20/using-google-static-maps-in-your-print-view
description: 
---

This is just a quick thought experiment really. Yesterday I was working on a demo that made use of Google's [Static Map API](https://developers.google.com/maps/documentation/maps-static/overview). I've blogged about this API for probably over a decade now and I rarely see people use it, but it's a lightweight, image only "API" for when you need simple map images without interactivity. Honestly, I see a lot of sites using the full JavaScript maps library when a simpler image would be fine. It's also an excellent way to use maps in presentations or emails as well. It occurred to me that the static map image could be a great way use of print media queries in CSS and I thought I'd build a quick demo to show this.

Media queries and print support has been around for years, but I didn't play with it myself till earlier this year when I [blogged](https://www.raymondcamden.com/2025/07/14/cleaning-up-my-print-view-with-css-media-queries) about cleaning up my print view for this site. (Although I probably need to revisit that as I've changed my design since then.)

I was curious to see if a print media query could be used to "swap out" a JavaScript map for a static one. I began with an incredibly simple map demo:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Print Map Test</title>
</head>
<body>
    
    <h2>Map Demo</h2> 

    <div id="map" style="height: 500px; width: 500px;"></div>
    
<script async
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyC3hC35ehz1oAfUll7q7qzUlPa27Gz5g5g&loading=async&callback=initMap">
</script>
<script>
let map;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 30.216667, lng: -92.033333 },
    zoom: 8,
    });
}
</script>
</body>
</html>
```

This is about as simple as you can get. If you're incredibly bored and want to see this running, you can do so here: <https://cfjedimaster.github.io/webdemos/printmap/index.html>

Ok, so how well does this print? I did a quick ctrl+p, saved the PDF, and this is what I got:

<iframe src="https://static.raymondcamden.com/images/2025/11/maptest.pdf#toolbar=0" width="100%" height="600px"></iframe>

It's actually really, really good. My only complaint is the zoom icon in the upper right corner. Also, the "Report a map error" won't actually be a link. 

So that works, but can we make it better? I began by adding in a static version of my map. (Note that the static map API does support markers and quite a few parameters, so you can do a lot more than what I'm showing here.)

```html
<img class="printedMap" src="https://maps.googleapis.com/maps/api/staticmap?key=AIzaSyC3hC35ehz1oAfUll7q7qzUlPa27Gz5g5g&size=500x500&center=30.216667,-92.033333&zoom=8" alt="Static Map">
```

Note I added a class to it. I then used this CSS:

```css
.printedMap {
    display: none;
}

@media print {

    #map { display: none; }
    .printedMap {
        display: block;
    }
}
```

Basically, hide the static map normally, and when printing, hide the map div that includes the JavaScript map and show the static version. And here's the result:

<iframe src="https://static.raymondcamden.com/images/2025/11/maptest2.pdf#toolbar=0" width="100%" height="600px"></iframe>

Slightly better! ;) Worth the effort? Probably. I will note that this does add additional load to the page as the static image is loaded but hidden. You *can* check for a matched media query in JavaScript using [matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia), so in theory, you could delay adding the image to the DOM that way, but that feels a bit overkill. 

You can hit this version [here](https://cfjedimaster.github.io/webdemos/printmap/index2.html) if you want to see, and the source for both may be found here: <https://github.com/cfjedimaster/webdemos/tree/master/printmap>

Photo by <a href="https://unsplash.com/@matijn_p?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Matijn Palings</a> on <a href="https://unsplash.com/photos/green-and-white-book-page-fNe0qWL_kZ0?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      