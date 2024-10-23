---
layout: post
title: "Getting and Displaying a Mastodon Post in Client-Side JavaScript"
date: "2024-10-23T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_robots.jpg
permalink: /2024/10/23/getting-and-displaying-a-mastodon-post-in-client-side-javascript
description: Using client-side JavaScript to get the latest post from a Mastodon account.
---

I've got a few pages here that are primarily built for my own use. One of them, my [bots](/bots) page, is a list of all the <s>dumb</s>super useful bots I've built for Mastodon (and Bluesky). The idea on this page is to show the latest post from each bot. The bots page makes use of two different shortcodes written in Liquid to do this.

The first uses the RSS feed of the bot to get their last toot ID:

```js
const lastToot = async (instance, user) => {
	let rssFeedURL = `https://${instance}/users/${user}.rss`;
  try {
    let feed = await parser.parseURL(rssFeedURL);
    return feed.items[0].guid.split('/').pop();
  } catch(e) {
    console.log(`getting last toot for ${user} returned an error`);
    return '';
  }
}
```

To render this post, I then use code from [Bryce Wray](https://www.brycewray.com/) that fetches the data for the post and renders it out nicely. I won't share the entire code block, but you can peruse it in my repo here, <https://github.com/cfjedimaster/raymondcamden2023/blob/main/config/shortcodes/stoot.js>. 

This is done like so:

{% raw %}{% capture "lasttoot_nps" %}<br>
{% lasttoot "botsin.space", "npsbot" %}<br>
{% endcapture %}<br>
{% stoot "botsin.space", lasttoot_nps %}
{% endraw %}

Basically, run the shortcode that outputs an ID, and then pass it to the renderer. 

You can see this in action below, which will be my latest post on Mastodon and rendered at build time.

{% capture "lasttoot_ray" %}
{% lasttoot "mastodon.social", "raymondcamden" %}
{% endcapture %}
{% stoot "mastodon.social", lasttoot_ray %}

So... this worked but proved to be a bit problematic locally. It ended up adding quite a bit of time for my local build due to constantly fetching multiple RSS feeds and then post data items. My "solution" locally was to just ignore that file in my `.eleventyignore` file. Problem solved, right? But lately, I saw a few other issues with it in production. 

With that in mind - I thought - why not use a client-side solution? The biggest issue would be getting the RSS feed. Usually, almost always, RSS feeds don't have the proper CORS setting to let client-side JavaScript do this, but on a whim, I did a quick test with one of the bots and... it worked! I quickly then checked the Mastodon API for getting details of a post, and it worked as well. 

Ok, so I massively updated my bots page to no longer use short codes and do everything on the client. First, I just listed them out:

```js
let BOTS = [
	'https://botsin.space/@npsbot',
	'https://botsin.space/@randomalbumcover',
	'https://botsin.space/@randomcomicbook',
	'https://botsin.space/@superjoycat',
	'https://botsin.space/@rulesofacquisition',
	'https://botsin.space/@tbshoroscope',
	'https://botsin.space/@thisdayinhistory',
	'https://botsin.space/@myrandomsuperhero',
];
```

That's a lot of bots. I've got a problem. 

For each bot, I first get their last toot:

```js
for(let bot of BOTS) {
	let lastToot = await getLastToot(bot);
```

The code for `getLastToot` does XML processing, which isn't as bad as I remember in JavaScript:

```js
async function getLastToot(bot) {
	console.log(`about to fetch ${bot}`);
	let rssFeedUrl = bot.replace(/@([a-z])/i, 'users/$1') + '.rss';
	let feedReq = await fetch(rssFeedUrl);
	let feedXml = await feedReq.text();
	let parser = new DOMParser();
	let doc = parser.parseFromString(feedXml, "application/xml");

	let latestItem = doc.querySelector('item');
	let toot = {};
	toot.name = doc.querySelector('title').innerHTML;
	toot.avatar = doc.querySelector('image url').innerHTML;
	toot.date = formatter.format(new Date(latestItem.querySelector('pubDate').innerHTML));
	toot.link = latestItem.querySelector('link').innerHTML;
	toot.description = unescape(latestItem.querySelector('description').innerHTML);

	// you cant query select on x:y, this works though
	let media = latestItem.querySelector('[medium="image"]');
	if(media) {
		let img = media.getAttribute('url');
		toot.image = img;
	}

	// I bet I could do this in one line - don't care though
	let handleBits = bot.replace('https://','').split('/');
	toot.handle = `${handleBits[1]}@${handleBits[0]}`;
	console.log('toot', toot);

	return toot;
}
```

I convert the bot's main URL to the RSS url, fetch it, and then grab the important bits, which includes part of their profile (title, avatar, etc), and the most recent item. 

Now, I made some concessions here on how much to fetch, specifically I don't care about polls, but do care about images, since nearly every bot I have is an image poster. 

In the end, the code returns a simple JavaScript object. Here's one example:

```js
{
    "name": "NPS Bot",
    "avatar": "https://files.botsin.space/accounts/avatars/110/452/760/777/920/401/original/593d75044e0c292d.png",
    "date": "October 23, 2024 at 8:40:50 AM",
    "link": "https://botsin.space/@npsbot/113357019606657698",
    "description": "<p>Picture from North Country National Scenic Trail. More information at <a href=\"https://www.nps.gov/noco/index.htm\" target=\"_blank\" rel=\"nofollow noopener noreferrer\" translate=\"no\"><span class=\"invisible\">https://www.</span><span class=\"\">nps.gov/noco/index.htm</span><span class=\"invisible\"></span></a></p>",
    "image": "https://files.botsin.space/media_attachments/files/113/357/019/551/545/235/original/039173b528e3b217.jpg",
    "handle": "@npsbot@botsin.space"
}
```

I want to call out one specific part of the code here:

```js
toot.description = unescape(latestItem.querySelector('description').innerHTML);
```

For one of my bots, I was getting escaped HTML, and as I wanted to turn that into 'real' HTML, I needed a way of doing that. Initially I used a simple `replaceAll` on a few entities. I asked on Mastodon, and got some good answers, but this one from [Lukas Stührk](https://mastodon.social/@ls@discuss.systems) worked well:

{% stoot "mastodon.social", "113329305145113113" %}

This ended up being implemented like so:

```js
function unescape(s) {
	let d = document.createElement('div');
	d.innerHTML = s;
	return d.textContent;
}
```

The last part entailed displaying the toot. For that, I took part of Bryce's code, simplified it, and used a combination of an HTML template and JavaScript. Here's the template:

```html
<template id="tootDisplay">
	<blockquote class="toot-blockquote">
		<div class="toot-header">
			<a class="toot-profile" rel="noopener" target="_blank">
				<img class="avatar" src="" loading="lazy">
			</a>
			<div class="toot-author">
				<a class="toot-author-name" rel="noopener" target="_blank"></a>
				<a class="toot-author-handle" rel="noopener" target="_blank"></a>
			</div>
		</div>
		<p class="toot-body"></p>

		<p>
		<img class="toot-media-img" src="" loading="lazy">
		</p>

		<div class="toot-footer">
			<a id="link" target="_blank" class="toot-date" rel="noopener"></a>
		</div>

	</blockquote>
</template>
```

And the JavaScript:

```js
// earlier in my code:
let $bots = document.querySelector('#bots');

// this is in the loop over BOTS
let clone = template.content.cloneNode(true);
clone.querySelector('.toot-author-name').innerText = lastToot.name;
clone.querySelector('.toot-author-name').href = bot;
clone.querySelector('.toot-author-handle').innerText = lastToot.handle;

clone.querySelector('.toot-body').innerHTML = lastToot.description;
clone.querySelector('.toot-profile').href = bot;
clone.querySelector('img.avatar').src = lastToot.avatar;
clone.querySelector('img.avatar').alt = `Mastodon author for ${lastToot.name}`;
clone.querySelector('img.avatar').title = `Mastodon author for ${lastToot.name}`;

if(lastToot.image) {
	clone.querySelector('img.toot-media-img').src=lastToot.image;
}
clone.querySelector('.toot-footer a').innerHTML = lastToot.date;
clone.querySelector('.toot-footer a').href = lastToot.link;
$bots.append(clone);
```

And outside of a few other miscellaneous things, that's it. You can see the complete code if you just head over to the [bots](/bots) page and view source. I'll say it still takes a while to render, and in theory, I could multithread the code to get the most recent post and details and in theory, it would finish a lot quicker, but as this is - again - mostly just for me, I'll probably keep it simple. (Or, if one person leaves a comment like, "hey Ray, I'd like to see that change", then I'll probably do it). 

As always, if this code *is* useful to you, let me know please!

p.s. Ok, everything that follows is *not* related to the technical aspect of the post at all, and is 100% personal opinion. If you are only here for the code, no problem and I completely understand if you stop reading! That being said, I'm not a bot myself and I've absolutely got personal feelings and I'm going to share them here. I've been a Twitter user for a very long time. Since Musk took over, I've been less and less happy with the environment there. I've really curtailed my posts there the last few months, with an exception recently when I was desperate to find some help with a random Cloudflare issue. While I'm not at the point of deactivating my account, and I understand some folks have no choice in the matter, that place is dead to me. I'll probably check in every few months so my account is killed, but for now, that cesspool is one I'd rather avoid. Obviously, I'm active on Mastodon, but I've also been enjoying Bluesky as well, so feel free to follow me there if you want: <https://bsky.app/profile/raymondcamden.com>