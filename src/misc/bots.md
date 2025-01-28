---
layout: page
title: My Bots
description: My various Mastodon bots
body_class: page-template
permalink: /bots/index.html
---

<p>
I've been enjoying building bots for Mastodon (via <a href="https://pipedream.com?via=raymond">Pipedream</a>) and therefore 
I built this page to help me actually remember what I've built. For each of the bots you'll see their 
most recent toot at the time I built the site. Just click on the username to follow or see more.
</p>

<p>
I've got a few bots on Bluesky, right now just <a href="https://bsky.app/profile/randomcomicbook.bsky.social">Random Comic Book</a> and <a href="https://bsky.app/profile/dragonhoards.bsky.social">Dragon Hoards</a>, but may add more later.
</p>

<div id="status"></div>

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

<div id="bots">
</div>

<script>
let BOTS = [
	'https://mastodon.social/@dragonhoards',
	'https://mastodon.social/@npsbot',
	'https://mastodon.social/@randomalbumcover',
	'https://mastodon.social/@randomcomicbook',
	'https://mastodon.social/@superjoycat',
	'https://mastodon.social/@rulesofacquisition',
	'https://mastodon.social/@tbshoroscope',
	'https://mastodon.social/@thisdayinhistory',
	'https://mastodon.social/@myrandomsuperhero',
];

let formatter = new Intl.DateTimeFormat('en-US', {
  dateStyle:'long',
  timeStyle:'medium'
});


document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	
	let template = document.querySelector('#tootDisplay');
	let $bots = document.querySelector('#bots');
	let $status = document.querySelector('#status');

	$status.innerHTML = '<p><i>Loading bots...</i></p>';
	
	for(let bot of BOTS) {
		let lastToot = await getLastToot(bot);
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
	}

	$status.innerHTML = '';

}

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

function unescape(s) {
	let d = document.createElement('div');
	d.innerHTML = s;
	return d.textContent;
}
</script>