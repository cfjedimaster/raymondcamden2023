---
layout: post
title: "Using Parallel Requests to Improve Web Performance"
date: "2024-10-25T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/chalk_lines.jpg
permalink: /2024/10/25/using-parallel-requests-to-improve-web-performance
description: A look at how parallel executions could (maybe?) improve performance.
---

Yesterday I [blogged](https://www.raymondcamden.com/2024/10/23/getting-and-displaying-a-mastodon-post-in-client-side-javascript) about a change I made to my [bots](/bots) page and in it, I mentioned how the performance wasn't necessarily as good as it could be. I had made the decision to go from server-side and build-time for the page to a purely client-side solution. At the end of the post, I asked folks to let me know if anyone would like to have me work on that performance issue, and, honestly, it kept popping up in my head so I figured I should tackle it. Before I begin talking about what I changed, let me review what I had done, and what the issues are.

## The Current Solution

You can go to the [bots](/bots) page yourself, but in general, this is the process:

* Given a list of bots...
* For each one, get the RSS feed for the bot (a network request)
* Parse the XML into a result and return it
* Render the result

The net result is that as you view the page, you see nothing at first (minus the layout and initial paragraph of course), and as each one is processed, it's appended to the DOM one at a time. 

If we assume roughly 5-10 seconds for each, and I've got 8 bots, that can take up to 80 seconds to complete, a veritable lifetime in web terms. It also means the user sees nothing for up to 10 seconds. If we assume the user spends 5 or so seconds looking at the result, they are waiting a bit for each one as it comes in. 

I wanted to create a 'clean room' type environment for this post so I created a CodePen. 


<p class="codepen" data-height="500" data-default-tab="result" data-slug-hash="KKOqodJ" data-pen-title="toot test" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/KKOqodJ">
 toot test</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
 on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

You can't see it in the embed, but if you click the link and view it on CodePen itself, you can open the console and see I've added timing information. In my last test, I saw a total of nearly 60 seconds. 

## First Attempt

The most obvious solution to this - I assumed - was to simply run all the requests in parallel. Given that `BOTS` is my array, I did this:

```js
let results = [];
for(let bot of BOTS) {
    results.push(getLastToot(bot));
}
```

That fires off a request for each bot one right after the other without waiting. I can then wait for them all to finish and render the results all at once:

```js
Promise.allSettled(results).then(r => {
    for(let result of r) {
        let lastToot = result.value;
        let clone = template.content.cloneNode(true);
        clone.querySelector('.toot-author-name').innerText = lastToot.name;
        clone.querySelector('.toot-author-name').href = lastToot.bot;
        clone.querySelector('.toot-author-handle').innerText = lastToot.handle;

        clone.querySelector('.toot-body').innerHTML = lastToot.description;
        clone.querySelector('.toot-profile').href = lastToot.bot;
        clone.querySelector('img.avatar').src = lastToot.avatar;
        clone.querySelector('img.avatar').alt = `Mastodon author for ${lastToot.name}`;
        clone.querySelector('img.avatar').title = `Mastodon author for ${lastToot.name}`;

        if(lastToot.image) {
            clone.querySelector('img.toot-media-img').src=lastToot.image;
 }
        clone.querySelector('.toot-footer a').innerHTML = lastToot.date;
        clone.querySelector('.toot-footer a').href = lastToot.link;
        $bots.append(clone);

 }
    
    $status.innerHTML = '';
    let diff = new Date() - ts;
    console.log(`Total time: ${diff/1000} seconds`);
    
});
```

You can take a look at it in action below:

<p class="codepen" data-height="500" data-default-tab="result" data-slug-hash="KKOyemg" data-pen-title="toot test 2" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/KKOyemg">
 toot test 2</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
 on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

So this is better, right?

Well...

I'm actually not 100% sure. If we assume 5-10 seconds per request, with `Promise.allSettled`, I have to wait until the longest one is complete before I render something. It's possible that this solution won't show content for a longer time than the first solution. In theory, the time to first content being rendered is the same, but of course, you get it all though so you can more quickly scan the results.

So... yes, this is better, but something occurred to me. 

## Second Attempt

The issue I had with the previous version is that if one request goes bad, the entire result is held up. What if instead, we render results as soon as they come, still firing them off in parallel? The order of my results does not matter, so here's an even nicer solution:

```js
let actions = [];
for(let bot of BOTS) {
    actions.push(displayLastToot(bot, template, $bots));
}
```

I've rewritten my logic to do everything (fetch and display) in a new function:

```js
async function displayLastToot(bot, template, div) {
    let lastToot = await getLastToot(bot);
    let clone = template.content.cloneNode(true);
    clone.querySelector('.toot-author-name').innerText = lastToot.name;
    clone.querySelector('.toot-author-name').href = lastToot.bot;
    clone.querySelector('.toot-author-handle').innerText = lastToot.handle;

    clone.querySelector('.toot-body').innerHTML = lastToot.description;
    clone.querySelector('.toot-profile').href = lastToot.bot;
    clone.querySelector('img.avatar').src = lastToot.avatar;
    clone.querySelector('img.avatar').alt = `Mastodon author for ${lastToot.name}`;
    clone.querySelector('img.avatar').title = `Mastodon author for ${lastToot.name}`;

    if(lastToot.image) {
        clone.querySelector('img.toot-media-img').src=lastToot.image;
 }
    clone.querySelector('.toot-footer a').innerHTML = lastToot.date;
    clone.querySelector('.toot-footer a').href = lastToot.link;
    div.append(clone);
}
```

I'm still using an array of promises so I can 'clean up' when done, specifically the 'loading' message (and my debug timing code):

```js
Promise.allSettled(actions).then(() => {
    $status.innerHTML = '';
    let diff = new Date() - ts;
    console.log(`Total time: ${diff/1000} seconds`);
});
```

You can see this solution here:

<p class="codepen" data-height="500" data-default-tab="result" data-slug-hash="mdNqKBY" data-pen-title="toot test 3" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/mdNqKBY">
 toot test 3</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
 on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

As I said, order doesn't matter so this works just fine, but I could shift things around a bit if necesssary. Ie, tell bot X it has to be in position X on the page, but as that's not necessary I didn't bother. 

Anyway, this was fun. As I said, it was interesting realizing that doing the requests in parallel wasn't necessarily better at first. I'd love to know what folks think, so feel free to let me know what you would do. (Oh, and don't forget you can easily fork CodePens!)