---
layout: post
title: "My First (and Last) Spotify Web App - Music Snob"
date: "2025-04-11T18:00:00"
categories: ["development"]
tags: ["javascript","alpinejs"]
banner_image: /images/banners/cat_records.jpg
permalink: /2025/04/11/my-first-and-last-spotify-web-app-music-snob
description: My experience building a simple web app with Spotify
---

I've been a happy Spotify user for a few years now (I transitioned from Amazon Music after they cut features and generally ticked me off) and as I listen to music *a lot*, I've built a few integrations with their APIs over the years. Those integrations were simple tools that hit my own personal data and were just for fun, but I thought I'd take a crack at building a simple app with their [Web API](https://developer.spotify.com/documentation/web-api) which would allow Spotify users to authenticate and see their own data. I built the app. But I 100% would not recommend working with the Spotify APIs going further. I'll explain everything that went wrong, why I recommend this and so forth, but if you just want to see the app, scroll down to the very bottom for the link.

## It's not the API...

So why the dramatic and dire statements above? It isn't the code. Their REST APIs work perfectly well and are (well, were) full featured. That isn't the issue. The problem is when you want to move your web app into production. This involves, obviously, a check on the Spotify side, to ensure your app meets certain requirements and such. That's totally reasonable. 

I thought... surely this will be a simple process. 

I began with my initial request on April 30, 2024. This is basically a form asking what you're doing, what scopes you are using and why, and including screenshots. I got rejected 3 months later. Not 3 days. Not 3 weeks. 3 *months*. I corrected my issue and resubmitted where I discovered that "resubmitting" means literally putting every single thing back into the form, including screenshots. And then I waited again.

Checking the [developer forums](https://community.spotify.com/t5/Spotify-for-Developers/bd-p/Spotify_Developer) was a mistake as I discovered I was far from being the only one having to deal with this. Apparently six plus months of waiting is the norm. 

After waiting nearly two months again, I was approved. And then... I discovered that some grant I had used had changed - or perhaps worked one in localhost and another live. Honestly I don't remember the exact details, but I had to request a scope and wait... again. 

The final approval was November 26, 2024. That's just... incredible. And apparently the next day, changes to the Web API were [posted on the forums](https://community.spotify.com/t5/Spotify-for-Developers/Changes-to-Web-API/td-p/6540414) and the top comment is from a person who had spent months on a project to be it completely destroyed by the changes. You can read more about those changes [here](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api), and luckily it didn't impact my app, but... yeah. 

None of this impacts *non*-web app type uses, but honestly, my confidence in Spotify's support for developers is an infinite curve approaching zero. I would avoid it unless things change.

So, with that out of the way... what did I actually build?

## The Music Snob App

I like to think I've got eclectic taste in music. While I've got genres I definitely spend a lot of time on (new wave, trance, goth), I enjoy pretty much any style of music, outside of country and heck, even there I can find some tracks I enjoy. I thought to myself - I wonder if something in my data would tell me exactly how much of an eclectic listener I am, or more simply, am I snob? (To be fair, I will rock, and dance, the hell out to some Britney Spears so I can't be too much of a snob.) 

Turns out, there is an API that returns a user's top media. The [Get User's Top Items](https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks) endpoint will return either your top artists or tracks. 

Here's an example showing top artists:

```js
{
  "href": "https://api.spotify.com/v1/me/shows?offset=0&limit=20",
  "limit": 20,
  "next": "https://api.spotify.com/v1/me/shows?offset=1&limit=1",
  "offset": 0,
  "previous": "https://api.spotify.com/v1/me/shows?offset=1&limit=1",
  "total": 4,
  "items": [
    {
      "external_urls": {
        "spotify": "string"
      },
      "followers": {
        "href": "string",
        "total": 0
      },
      "genres": ["Prog rock", "Grunge"],
      "href": "string",
      "id": "string",
      "images": [
        {
          "url": "https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228",
          "height": 300,
          "width": 300
        }
      ],
      "name": "string",
      "popularity": 0,
      "type": "artist",
      "uri": "string"
    }
  ]
}
```

Of note is the `popularity` field, which according to the docs is:

```
The popularity of the artist. The value will be between 0 and 100, with 
100 being the most popular. The artist's popularity is calculated from 
the popularity of all the artist's tracks.
```

It's similar for tracks as well. So given that I can could get a current user's top values for both artists and tracks, in theory, we could average their popularity, and the lower the value, the more obscure/eclectic your tastes are. 

Here's a screenshot from what I built:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/spotify1.jpg" alt="Screenshot of app running" class="imgborder imgcenter" loading="lazy">
</p>

And in case the text is too hard to read, the report said:

```
For your top musical artists, they had an average popularity score of 21.04. 
For your top tracks, they had an average popularity score of 18.34. Spotify 
ranks popularity from 0 to 100 with 100 being the most popular.

Taken together, you ARE a music snob! Congrats!
```

See! I told you I was cool!

The application itself is a rather simple [Alpine.js](https://alpinejs.dev/) application using [Shoelace](https://shoelace.style/) for UI. I'll link to the entire code base in a sec, but on the front end I basically have two states - the you need to auth with Spotify state and the "getting and reporting" state. I don't think the HTML is that interesting, but I'll share a bit. 

The entire "are you a snob or not" comes down to one check that looks at the average of your two average 'scores' for popularity in tracks and artists:

```html
<h3>Snobbery Level</h3>
<p>
For your top musical artists, they had an average popularity score of <strong><span x-text="avgArtistPop"></span></strong>. 
For your top tracks, they had an average popularity score of <strong><span x-text="avgTrackPop"></span></strong>. 
Spotify ranks popularity from 0 to 100 with 100 being the most popular.
</p>
<p>
<strong>
	<span x-show="avgAverage < 40">
	Taken together, you ARE a music snob! Congrats!
	</span><span x-show="avgAverage >= 40">
	Taken together, you ARE NOT a music snob. Maybe it's time to broaden your horizons?
	</span>
</strong>
</p>
```

The value of '40' is used as the cutoff and that was somewhat arbitrary. When looping over tracks and artists, I made use of the Shoelace `card` component:

```html
<h3>Top Artists</h3>
	<template x-for="artist in topArtists">
		<sl-card class="card-overview itemCard">
			<img :src="artist.images[1].url" slot="image">
			<strong><a :href="artist.external_urls.spotify" target="_new"><span x-text="artist.name"></span></a></strong>
		</sl-card>
	</template>
</div>
```

Which renders nicely I think:

<p>
<img src="https://static.raymondcamden.com/images/2025/04/spotify2.jpg" alt="Examples of Shoelace cards" class="imgborder imgcenter" loading="lazy">
</p>

Let's switch to the more fun stuff, the JavaScript. I began by using most of the code from Spotify's [How To](https://developer.spotify.com/documentation/web-api/howtos/web-app-profile) which demonstrates how to start the oAuth process with the direct and how to handle getting the result when returned from the login flow and get an access token. 

As an example, the logic click event goes to:

```js
login() {
	this.redirectToAuthCodeFlow(clientId);
},
```

which just goes to:

```js
async redirectToAuthCodeFlow(clientId) {
	const verifier = this.generateCodeVerifier(128);
	const challenge = await this.generateCodeChallenge(verifier);

	sessionStorage.setItem("verifier", verifier);

	const params = new URLSearchParams();
	params.append("client_id", clientId);
	params.append("response_type", "code");
	params.append("redirect_uri", redirectUri);
	//params.append("scope", "user-read-private user-read-email user-top-read");
	params.append("scope", "user-top-read");
	params.append("code_challenge_method", "S256");
	params.append("code_challenge", challenge);

	document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;

}
```

The two utility functions (`generateCodeVerifier` and `generateCodeChallenge`) came right from the Spotify How To. Oh, and login just calling another function, looking at it now it seems silly, but I'm not motivated to tweak it. 

My Alpine `init` code looks for a resulting code in the URL:

```js
const params = new URLSearchParams(window.location.search);
this.code = params.get("code");
if(this.code) {
	this.loggedIn = true;
	this.accessToken = await this.getAccessToken(clientId, this.code);
	//remove code from the url
	window.history.replaceState(null,'', '/');
	this.getData();
}
```

I'll note (and again, you can see this in the full source code) that I implemented some simple client-side caching with LocalStorage. If you reload the page within one hour, you won't need to login, and even if you do need to, the subsequent logins should be quicker. 

The fun part comes in `getData`, so lets dig into that:

```js
async getData() {

	this.status = 'Loading your profile...';
	this.profile = await this.getProfile(this.accessToken);
	console.log(this.profile);
	this.status = 'Loading your music listening data...';

	let [ artists, tracks ] = await Promise.all([this.getTopItems('artists', this.accessToken), this.getTopItems('tracks', this.accessToken)]);
	this.topArtists = artists.items;
	this.topTracks = tracks.items;

	// rethink - this won't show up for more than a second
	this.status = 'Calculating your snobbery level...';

	this.avgArtistPop = (this.topArtists.reduce((pop,a) => {
		return pop + a.popularity;
	},0)) / 50;
	console.log('avgArtistPop', this.avgArtistPop);

	this.avgTrackPop = (this.topTracks.reduce((pop,a) => {
		return pop + a.popularity;
	},0)) / 50;
	console.log('avgTrackPop', this.avgTrackPop);

	this.avgAverage = (this.avgArtistPop + this.avgTrackPop) / 2;
	
	this.status = '';

},	
async getTopItems(type,token) {
	console.log('fetching top', type);
	const result = await fetch(`https://api.spotify.com/v1/me/top/${type}?limit=20`, {
		method: "GET", headers: { Authorization: `Bearer ${token}` }
	});

	return await result.json();

},
```

I start off by making two calls to `getTopItems`, one for artists and one for tracks, and run them in parallel to get the result back quicker. Once I get the data, it's a quick matter of generating an average (with my vibe coding unicorn level dev use of `reduce`) and then creating an average of the two averages.

And that's it! You can see the complete source here, <https://github.com/cfjedimaster/musicsnob>, and play with the demo (as long as you have a Spotify account of course) here: <https://musicsnob.netlify.app/>
