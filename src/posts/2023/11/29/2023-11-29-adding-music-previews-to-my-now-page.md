---
layout: post
title: "Adding Music Previews to My Now Page"
date: "2023-11-29T18:00:00"
categories: ["javascript"]
tags: ["eleventy"]
banner_image: /images/banners/cat_music.jpg
permalink: /2023/11/29/adding-music-previews-to-my-now-page
description: How I added a simple audio preview to my recent Spotify tracks.
---

About two months or so ago I added a [Now](/now) page to my site. It shows my current reading list, my last watched movies, my [Untappd](https://untappd.com) beer check-ins, and my most recent Spotify tracks. You can see that part here:

<p>
<img src="https://static.raymondcamden.com/images/2023/11/m1.jpg" alt="List of recent tracks" class="imgborder imgcenter" loading="lazy">
</p>

When I built it, I used a [Pipedream](https://pipedream.com) workflow to wrap calls to [Spotify's API](https://developer.spotify.com/). My Pipedream workflow gets my most recent tracks, slims down the data quite a bit, and returns just what I need. I use some client-side code to hit that endpoint and then render it out on the Now page. (I also use a bit of caching with LocalStorage such that the endpoint is only hit every ten minutes.) 

Currently, when rendering each track, I link to its URL and Spotify users can listen to the track completely. I thought it would be cool to let people preview the tracks right from the web page. Here's how I did that. 

## Updating the "Back End"

In my case, my back end is just the Pipedream workflow. As I mentioned, it hits the Spotify API and then transforms the data into something smaller before returning it. All I had to do was update that one step:

```js
export default defineComponent({
  async run({ steps, $ }) {
    return steps.get_recent_tracks.$return_value.items.map(r => {
      return {
          artists: r.track.artists,
          name: r.track.name,
          href: r.track.external_urls.spotify,
          preview_url: r.track.preview_url,
          album: r.track.album.name, 
          album_release_date: r.track.album.release_date, 
          images: r.track.album.images, 
          played_at:r.played_at
      }
    })
  },
})
```

To be clear, this isn't strictly necessary, I could simply return everything Spotify sends, but as it is sending a *lot* I don't need, this small step really improves the performance of my API. As an example, here's one result from Spotify (this is in an array of results):

```json
{
	"track": {
		"album": {
			"album_type": "album",
			"artists": [
				{
					"external_urls": {
						"spotify": "https://open.spotify.com/artist/5HYNPEO2NNBONQkp3Mvwvc"
					},
					"href": "https://api.spotify.com/v1/artists/5HYNPEO2NNBONQkp3Mvwvc",
					"id": "5HYNPEO2NNBONQkp3Mvwvc",
					"name": "Scott Bradlee's Postmodern Jukebox",
					"type": "artist",
					"uri": "spotify:artist:5HYNPEO2NNBONQkp3Mvwvc"
				}
			],
			"available_markets": [
				"AR",
				"AU",
				"AT",
				"BE",
				"BO",
				"BR",
				"BG",
				"CA",
				"CL",
				"CO",
				"CR",
				"CY",
				"CZ",
				"DK",
				"DO",
				"DE",
				"EC",
				"EE",
				"SV",
				"FI",
				"FR",
				"GR",
				"GT",
				"HN",
				"HK",
				"HU",
				"IS",
				"IE",
				"IT",
				"LV",
				"LT",
				"LU",
				"MY",
				"MT",
				"MX",
				"NL",
				"NZ",
				"NI",
				"NO",
				"PA",
				"PY",
				"PE",
				"PH",
				"PL",
				"PT",
				"SG",
				"SK",
				"ES",
				"SE",
				"CH",
				"TW",
				"TR",
				"UY",
				"US",
				"GB",
				"AD",
				"LI",
				"MC",
				"ID",
				"JP",
				"TH",
				"VN",
				"RO",
				"IL",
				"ZA",
				"SA",
				"AE",
				"BH",
				"QA",
				"OM",
				"KW",
				"EG",
				"MA",
				"DZ",
				"TN",
				"LB",
				"JO",
				"PS",
				"IN",
				"BY",
				"KZ",
				"MD",
				"UA",
				"AL",
				"BA",
				"HR",
				"ME",
				"MK",
				"RS",
				"SI",
				"KR",
				"BD",
				"PK",
				"LK",
				"GH",
				"KE",
				"NG",
				"TZ",
				"UG",
				"AG",
				"AM",
				"BS",
				"BB",
				"BZ",
				"BT",
				"BW",
				"BF",
				"CV",
				"CW",
				"DM",
				"FJ",
				"GM",
				"GE",
				"GD",
				"GW",
				"GY",
				"HT",
				"JM",
				"KI",
				"LS",
				"LR",
				"MW",
				"MV",
				"ML",
				"MH",
				"FM",
				"NA",
				"NR",
				"NE",
				"PW",
				"PG",
				"WS",
				"SM",
				"ST",
				"SN",
				"SC",
				"SL",
				"SB",
				"KN",
				"LC",
				"VC",
				"SR",
				"TL",
				"TO",
				"TT",
				"TV",
				"VU",
				"AZ",
				"BN",
				"BI",
				"KH",
				"CM",
				"TD",
				"KM",
				"GQ",
				"SZ",
				"GA",
				"GN",
				"KG",
				"LA",
				"MO",
				"MR",
				"MN",
				"NP",
				"RW",
				"TG",
				"UZ",
				"ZW",
				"BJ",
				"MG",
				"MU",
				"MZ",
				"AO",
				"CI",
				"DJ",
				"ZM",
				"CD",
				"CG",
				"IQ",
				"LY",
				"TJ",
				"VE",
				"ET",
				"XK"
			],
			"external_urls": {
				"spotify": "https://open.spotify.com/album/5CUFurrJe05hnz189d5mDK"
			},
			"href": "https://api.spotify.com/v1/albums/5CUFurrJe05hnz189d5mDK",
			"id": "5CUFurrJe05hnz189d5mDK",
			"images": [
				{
					"height": 640,
					"url": "https://i.scdn.co/image/ab67616d0000b2735cb23d27338f4f3d848120ca",
					"width": 640
				},
				{
					"height": 300,
					"url": "https://i.scdn.co/image/ab67616d00001e025cb23d27338f4f3d848120ca",
					"width": 300
				},
				{
					"height": 64,
					"url": "https://i.scdn.co/image/ab67616d000048515cb23d27338f4f3d848120ca",
					"width": 64
				}
			],
			"name": "33 Resolutions Per Minute",
			"release_date": "2017-01-05",
			"release_date_precision": "day",
			"total_tracks": 18,
			"type": "album",
			"uri": "spotify:album:5CUFurrJe05hnz189d5mDK"
		},
		"artists": [
			{
				"external_urls": {
					"spotify": "https://open.spotify.com/artist/5HYNPEO2NNBONQkp3Mvwvc"
				},
				"href": "https://api.spotify.com/v1/artists/5HYNPEO2NNBONQkp3Mvwvc",
				"id": "5HYNPEO2NNBONQkp3Mvwvc",
				"name": "Scott Bradlee's Postmodern Jukebox",
				"type": "artist",
				"uri": "spotify:artist:5HYNPEO2NNBONQkp3Mvwvc"
			},
			{
				"external_urls": {
					"spotify": "https://open.spotify.com/artist/5tUXE5XK6VpNJj4LtxeI7W"
				},
				"href": "https://api.spotify.com/v1/artists/5tUXE5XK6VpNJj4LtxeI7W",
				"id": "5tUXE5XK6VpNJj4LtxeI7W",
				"name": "Kenton Chen",
				"type": "artist",
				"uri": "spotify:artist:5tUXE5XK6VpNJj4LtxeI7W"
			}
		],
		"available_markets": [
			"AR",
			"AU",
			"AT",
			"BE",
			"BO",
			"BR",
			"BG",
			"CA",
			"CL",
			"CO",
			"CR",
			"CY",
			"CZ",
			"DK",
			"DO",
			"DE",
			"EC",
			"EE",
			"SV",
			"FI",
			"FR",
			"GR",
			"GT",
			"HN",
			"HK",
			"HU",
			"IS",
			"IE",
			"IT",
			"LV",
			"LT",
			"LU",
			"MY",
			"MT",
			"MX",
			"NL",
			"NZ",
			"NI",
			"NO",
			"PA",
			"PY",
			"PE",
			"PH",
			"PL",
			"PT",
			"SG",
			"SK",
			"ES",
			"SE",
			"CH",
			"TW",
			"TR",
			"UY",
			"US",
			"GB",
			"AD",
			"LI",
			"MC",
			"ID",
			"JP",
			"TH",
			"VN",
			"RO",
			"IL",
			"ZA",
			"SA",
			"AE",
			"BH",
			"QA",
			"OM",
			"KW",
			"EG",
			"MA",
			"DZ",
			"TN",
			"LB",
			"JO",
			"PS",
			"IN",
			"BY",
			"KZ",
			"MD",
			"UA",
			"AL",
			"BA",
			"HR",
			"ME",
			"MK",
			"RS",
			"SI",
			"KR",
			"BD",
			"PK",
			"LK",
			"GH",
			"KE",
			"NG",
			"TZ",
			"UG",
			"AG",
			"AM",
			"BS",
			"BB",
			"BZ",
			"BT",
			"BW",
			"BF",
			"CV",
			"CW",
			"DM",
			"FJ",
			"GM",
			"GE",
			"GD",
			"GW",
			"GY",
			"HT",
			"JM",
			"KI",
			"LS",
			"LR",
			"MW",
			"MV",
			"ML",
			"MH",
			"FM",
			"NA",
			"NR",
			"NE",
			"PW",
			"PG",
			"WS",
			"SM",
			"ST",
			"SN",
			"SC",
			"SL",
			"SB",
			"KN",
			"LC",
			"VC",
			"SR",
			"TL",
			"TO",
			"TT",
			"TV",
			"VU",
			"AZ",
			"BN",
			"BI",
			"KH",
			"CM",
			"TD",
			"KM",
			"GQ",
			"SZ",
			"GA",
			"GN",
			"KG",
			"LA",
			"MO",
			"MR",
			"MN",
			"NP",
			"RW",
			"TG",
			"UZ",
			"ZW",
			"BJ",
			"MG",
			"MU",
			"MZ",
			"AO",
			"CI",
			"DJ",
			"ZM",
			"CD",
			"CG",
			"IQ",
			"LY",
			"TJ",
			"VE",
			"ET",
			"XK"
		],
		"disc_number": 1,
		"duration_ms": 255000,
		"explicit": false,
		"external_ids": {
			"isrc": "GBDMT1600258"
		},
		"external_urls": {
			"spotify": "https://open.spotify.com/track/0E32W7S52AaR4ht7i7DwDq"
		},
		"href": "https://api.spotify.com/v1/tracks/0E32W7S52AaR4ht7i7DwDq",
		"id": "0E32W7S52AaR4ht7i7DwDq",
		"is_local": false,
		"name": "Closer",
		"popularity": 48,
		"preview_url": "https://p.scdn.co/mp3-preview/62d19079487d6859ec9c587b8e87754424cabeca?cid=2feb4729ba5145d7a7fd92f2af83cf0d",
		"track_number": 1,
		"type": "track",
		"uri": "spotify:track:0E32W7S52AaR4ht7i7DwDq"
	},
	"played_at": "2023-11-29T14:25:31.873Z",
	"context": {
		"type": "playlist",
		"href": "https://api.spotify.com/v1/playlists/37i9dQZF1DZ06evO3mw43S",
		"external_urls": {
			"spotify": "https://open.spotify.com/playlist/37i9dQZF1DZ06evO3mw43S"
		},
		"uri": "spotify:playlist:37i9dQZF1DZ06evO3mw43S"
	}
}
```

Still here? Good. That's huge, right? Here's the transformed value:

```json
{
	"artists": [
		{
			"external_urls": {
				"spotify": "https://open.spotify.com/artist/5HYNPEO2NNBONQkp3Mvwvc"
			},
			"href": "https://api.spotify.com/v1/artists/5HYNPEO2NNBONQkp3Mvwvc",
			"id": "5HYNPEO2NNBONQkp3Mvwvc",
			"name": "Scott Bradlee's Postmodern Jukebox",
			"type": "artist",
			"uri": "spotify:artist:5HYNPEO2NNBONQkp3Mvwvc"
		},
		{
			"external_urls": {
				"spotify": "https://open.spotify.com/artist/5tUXE5XK6VpNJj4LtxeI7W"
			},
			"href": "https://api.spotify.com/v1/artists/5tUXE5XK6VpNJj4LtxeI7W",
			"id": "5tUXE5XK6VpNJj4LtxeI7W",
			"name": "Kenton Chen",
			"type": "artist",
			"uri": "spotify:artist:5tUXE5XK6VpNJj4LtxeI7W"
		}
	],
	"name": "Closer",
	"href": "https://open.spotify.com/track/0E32W7S52AaR4ht7i7DwDq",
	"preview_url": "https://p.scdn.co/mp3-preview/62d19079487d6859ec9c587b8e87754424cabeca?cid=2feb4729ba5145d7a7fd92f2af83cf0d",
	"album": "33 Resolutions Per Minute",
	"album_release_date": "2017-01-05",
	"images": [
		{
			"height": 640,
			"url": "https://i.scdn.co/image/ab67616d0000b2735cb23d27338f4f3d848120ca",
			"width": 640
		},
		{
			"height": 300,
			"url": "https://i.scdn.co/image/ab67616d00001e025cb23d27338f4f3d848120ca",
			"width": 300
		},
		{
			"height": 64,
			"url": "https://i.scdn.co/image/ab67616d000048515cb23d27338f4f3d848120ca",
			"width": 64
		}
	],
	"played_at": "2023-11-29T14:25:31.873Z"
}
```

Much slimmer. I could strip even more as I immediately see things I'm not using, but it's good enough for now. 

## Coding the Preview

My initial code simply took the result of the API and rendered out the individual track items. Here's one example:

<p>
<img src="https://static.raymondcamden.com/images/2023/11/m.jpg" alt="A track element showing Hell to the Liars by London Grammar." class="imgborder imgcenter" loading="lazy">
</p>

Initially, that code looked like so:

```js
let tracks = await getTracks();
// while we get 20, limit to 18 as we're doing rows of 3
tracks = tracks.slice(0, 18);

let s = '';
tracks.forEach(t => {

	let artists = t.artists.map(a => a.name).join(', ');

	let html = `
<div class="track">
<a href="${t.href}" target="_new"><img src="${t.images[1].url}"></a>
<a href="${t.href}" target="_new">"${t.name}"</a> by ${artists}
</div>
	`;
	s += html;

});

document.querySelector('.tracks').innerHTML = s;
```

I began by removing the link around the image and by adding in the preview URL. I used a data attribute for that:

```js
<img src="${t.images[1].url}" data-preview="${t.preview_url}">
```

Next, I needed to add event handlers to each track:

```js
let music = document.querySelectorAll('div.track img');

music.forEach(m => {
	m.addEventListener('click', e => {
		// stuff
	});
});
```

So far so good. Now for the tricky part. Playing music in JavaScript is incredibly simple. Given a URL that leads to supported audio, you can do:

```js
let music = new Audio(theURL);
music.play();
```

My first implementation simply grabbed the URL: 

```js
let preview = e.currentTarget.dataset.preview;
```

and did that - which led to me being able to click every rendered track and hear all the music playing at once in a god-awful mashup of epic proportions. To correct this, I had to get a bit fancy:

* If a person has clicked on track A, then track B, I should stop playing A
* If a person has clicked on track A, and then A again, they probably want to stop it.

Here's how I did it:

```js
// add event listener for music preview
let music = document.querySelectorAll('div.track img');
let audio = new Audio();
music.forEach(m => {
	m.addEventListener('click', e => {
		let preview = e.currentTarget.dataset.preview;
		if(audio.src) { 
			audio.pause(); 
			audio.currentTime = 0; 
			if(audio.src === preview) {
				audio.src = '';
				return;
			}
		}
		audio.src = preview;
		audio.play();
	});
});
```

I basically just check the current `src`. If it matches, I stop (this is done with `pause` and setting the `currentTime`). If the "new" URL is the same as the last one, then I just leave. Otherwise, I load up the new song.

This worked perfectly until I realized an issue. If you click to preview track A, let it play and it finishes, if you click the *same* track, it wouldn't start up. So I then added one more line of code:

```js
audio.addEventListener('ended', e => { audio.src = '' });
```

This now lets me listen to the same preview again and again... if I want to. If you want to see the complete code, just view source over on [Now](/now) or see the repo version here: <https://github.com/cfjedimaster/raymondcamden2023/blob/main/src/now.liquid>.