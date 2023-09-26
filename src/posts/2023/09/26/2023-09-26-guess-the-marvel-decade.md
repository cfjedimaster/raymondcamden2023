---
layout: post
title: "Guess the (Marvel) Decade"
date: "2023-09-26T18:00:00"
categories: ["javascript"]
tags: ["alpinejs","cloudflare"]
banner_image: /images/banners/comicbooks2018.jpg
permalink: /2023/09/26/guess-the-marvel-decade
description: How I built a game using the Marvel API, Cloudflare, and Alpine.js.
---

Many years ago, I first wrote up [my experience](https://www.raymondcamden.com/2014/02/02/Examples-of-the-Marvel-API/) working with the [Marvel API](http://developer.marvel.com/). I find myself returning to it again and again, and this weekend I built a fun little game I think you may enjoy. It's called "Guess the Decade". 

Marvel's art style has changed *drastically* over its long history. Back in 2018, I shared a [demo](https://www.raymondcamden.com/2018/11/04/using-azure-functions-and-the-marvel-api-to-visualize-character-history) that demonstrates just how much variety you can get just by looking at covers. So for example, Spider-Man in 1962:

<p>
<img src="https://static.raymondcamden.com/images/2018/11/mv1.jpg" class="imgcenter imgborder" alt="Spider-Man comic cover from 1962">
</p>

Versus 1988:

<p>
<img src="https://static.raymondcamden.com/images/2018/11/mv2.jpg" class="imgcenter imgborder" alt="Spier-Man comic cover from 1988">
</p>

And then 2018:

<p>
<img src="https://static.raymondcamden.com/images/2018/11/mv3.jpg" class="imgcenter imgborder" alt="Spider-Man comic cover from 2018">
</p>

Given that there's such a variety of styles, I thought it would be fun to build a demo. If you want, you can just right to the [game](https://codepen.io/cfjedimaster/full/ZEVrMoj), but here's how I built it.

## The Backend

For the backend, I built a serverless function with [Cloudflare Workers](https://developers.cloudflare.com/workers/). I've really been enjoying playing with them lately (see my [earlier posts](https://www.raymondcamden.com/tags/cloudflare)) and I figured this would be the quickest way to get the API running. 

Let me share the code and then I'll explain it.

```js
const IMAGE_NOT_AVAIL = "http://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available";

const getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getCover(pubKey,priKey) {

    //first select a random year
    let year = getRandomInt(1950, new Date().getFullYear()-1);
    //then a month
    let month = getRandomInt(1,12);

    let monthStr = month<10?"0"+month:month;
    //lame logic for end of month
    let eom = month==2?28:30;
    let beginDateStr = year + "-" + monthStr + "-01";
    let endDateStr = year + "-" + monthStr + "-" + eom;
    let url = "http://gateway.marvel.com/v1/public/comics?limit=100&format=comic&formatType=comic&dateRange="+beginDateStr+"%2C"+endDateStr+"&apikey="+pubKey;

    // add hash
    let ts = new Date().getTime();
    let myText = new TextEncoder().encode(ts + priKey + pubKey);

    let hash = await crypto.subtle.digest({
        name:'MD5'
    }, myText);

    const hexString = [...new Uint8Array(hash)]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    url += '&hash='+encodeURIComponent(hexString)+'&ts='+ts;

    let result = await fetch(url);
    let data = (await result.json()).data;

    if(!data.results) {
        throw('No results available.');
    }

    let resultData = data.results;

    console.log('initial set',resultData.length);
    // if(comic.thumbnail && comic.thumbnail.path != IMAGE_NOT_AVAIL) {
    let comics = resultData.filter(c => {
      return c.thumbnail && c.thumbnail.path !== IMAGE_NOT_AVAIL;
    });
    console.log('now we have ',comics.length);
    let selectedComic = comics[getRandomInt(0, comics.length-1)];
    //console.log(JSON.stringify(selectedComic,null,'\t'));
    //rewrite simpler
    let image = {};
    image.title = selectedComic.title;
    for(let x=0; x<selectedComic.dates.length;x++) {
      if(selectedComic.dates[x].type === 'onsaleDate') {
        image.date = new Date(selectedComic.dates[x].date);
        //rewrite nicer
        image.date = `${image.date.getMonth()+1}/${image.date.getFullYear()}`;
      }
    }

    image.url = selectedComic.thumbnail.path + "." + selectedComic.thumbnail.extension;
    if(selectedComic.urls.length) {
      for(let x=0; x<selectedComic.urls.length; x++) {
        if(selectedComic.urls[x].type === "detail") {
          image.link = selectedComic.urls[x].url;
        }
      }
    }

    return image;
}

export default {
    async fetch(request, env, ctx) {
        const PRIVATE_KEY = env.MARVEL_PRIVATE_KEY;
        const PUBLIC_KEY = env.MARVEL_PUBLIC_KEY;
        let cover = await getCover(PUBLIC_KEY, PRIVATE_KEY);

        return new Response(JSON.stringify(cover), {
            headers: {
                'Content-Type':'application/json;charset=UTF-8',
                'Access-Control-Allow-Origin':'*',
                'Access-Control-Allow-Methods':'GET'
            }
        });

    },
};
```

Starting at the bottom, the `fetch` method there will be fired when a request comes in for the function. It uses two credentials I've set up as secrets in Cloudflare, and then calls the main `getCover` function. In the response, I return the result and use CORS headers as my demo lives on another domain, at CodePen.

`getCover` is code I've shown before, it's what drives my [randomcomicbook](https://botsin.space/@randomcomicbook) Mastodon bot, but the idea is to basically select a random year, random month, and then ask for 100 comics from that period. I filter out for comics that don't have a cover, and then return a random selection. I do a bit of manipulation on the result to return a very small part of the comic. 

You can see this endpoint yourself here: <https://randomcover.raymondcamden.workers.dev>

I want to note two things. In my testing, I'm seeing the function run real slow sometimes. I'm certain that's not Cloudflare, but the Marvel API. I need to confirm this with some testing though. And in maybe one out of like twenty or so calls, I'm getting an error with the results, which is also something I'd blame the Marvel API for, but I don't handle it well in my code. All in all, I'll just say - expect imperfection.

And speaking of that, here's an example result from the call above:

```json
{
    "title": "Conan the Barbarian (1970) #54",
    "date": "9/1975",
    "url": "http://i.annihil.us/u/prod/marvel/i/mg/9/70/646cc9d27a80a.jpg",
    "link": "http://marvel.com/comics/issue/72071/conan_the_barbarian_1970_54?utm_campaign=apiRef&utm_source=fe877c0bf61f995fc8540d9eac4704f1"
}
```

Notice how the title includes a date that doesn't match the date the Marvel API returned? In this case, it's the same decade, but in many examples, it will be the next one. I'll talk about how I handle that in a bit. Here's an example of that issue:

```json
{
    "title": "Doctor Strange (1974) #66",
    "date": "8/1984",
    "url": "http://i.annihil.us/u/prod/marvel/i/mg/3/d0/621679f213e8d.jpg",
    "link": "http://marvel.com/comics/issue/20149/doctor_strange_1974_66?utm_campaign=apiRef&utm_source=fe877c0bf61f995fc8540d9eac4704f1"
}
```

Now let's turn our attention to the front end.

## The Web Game

For the front end, I made use of my favorite framework, [Alpine.js](https://alpinejs.dev/). My game has three states. The initial state simply tells the player what's going on. 

<p>
<img src="https://static.raymondcamden.com/images/2023/09/m2.jpg" alt="Introductory text and button to start the game" class="imgborder imgcenter" loading="lazy">
</p>

After you click the button, I get an image and render out buttons for guessing. I also show your current stats.

<p>
<img src="https://static.raymondcamden.com/images/2023/09/m3.jpg" alt="Random comic cover, buttons for decades, and your current game stats" class="imgborder imgcenter" loading="lazy">
</p>

When you click, I let you know how you did:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/m4.jpg" alt="Result, in this case, I got it right, and updated stats" class="imgborder imgcenter" loading="lazy">
</p>

Let's start with the HTML first:

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<div x-data="app" x-cloak>
    <div x-show="intro">
        <p>
            Welcome to the Marvel Guess the Decade game. In this game, I'll show you a random comic cover selected anywhere from 1950 to the 2020s. You need to guess the decade the comic was released. 
        </p>
        <button @click="start">Get Started</button>
    </div>
    <div x-show="!intro">
        
        <img x-show="imageSrc" :src="imageSrc" class="cover">
        <div x-show="!imageSrc">
            <p><i>Loading cover...</i></p>
        </div>

        <div x-show="guessReady" class="buttonRow">
            <!-- hard coded for 1950 to 2020. todo: come back in 7 years -->
            <template x-for="i in 8">
                <button @click="guess(1950+((i-1)*10))"><span x-text="1950+((i-1)*10)"></span>s</button>
            </template>
        </div>
        
        <div x-show="resultReady">
            <p>
            <strong x-text="msg"></strong> This cover is from <span x-text="cover.title"></span> in <span x-text="cover.year"></span>.
            </p>
            <p>
                <button @click="getImage">Guess Again</button>
            </p>
        </div>
        <p>
            You have currently gotten <span x-text="right"></span> correct and <span x-text="wrong"></span> wrong.
        </p>
    </div>
</div>
```

For the most part, this is pretty simple. I think the only 'fun' part is how I handle decades. I simply loop eight times from 1950. Obviously, I could make this work for any date in the future, but I was being a bit lazy. Now let's turn to the JavaScript, this time, I'll break it down a bit. First, I specify my variables with default states:

```js
intro:true,
right: 0,
wrong: 0,
imageSrc:null,
guessReady: false,
resultReady: false,
cover: { title:null, year:null },
msg:'',
```

I'm not a fan of how I defined `cover`, but I got warnings in Alpine when it parsed the HTML. Now, I knew it wasn't a "real" issue because that HTML wouldn't be displayed till I had a cover, but I wanted the warning to go away. Next time, I'll use two variables, like `coverTitle` and `coverYear`. 

The `start` method referred to from the button in the initial state just switches us to the main state and gets the first image.

```js
start() {
    this.intro = !this.intro;
    this.getImage();
},
```

Now let's look at `getImage`, as there's an interesting bit in here:

```js
async getImage() {
    this.imageSrc = null;
    this.guessReady = false;
    this.resultReady = false;
    let coverReq = await fetch('https://randomcover.raymondcamden.workers.dev');
    this.cover = await coverReq.json();
    // add .year based on date
    this.cover.year = this.cover.date.split('/').pop();
    /*
    So, I kept seeing comics with WILDLY different years and figured out we could use regex.
    I'm keeping the code above, just in case, but this code here should help.
    */
    let found = this.cover.title.match(/\(([1-2][0-9]{3})\) #/);
    if(found) {
        console.log(`changing year to ${found[1]}`);
        this.cover.year = found[1];
    }
    this.imageSrc = this.cover.url;
    this.guessReady = true;
    console.log(this.cover);
},
```

So as I mentioned earlier, the Marvel API will sometimes return a comic and say it's from 1989, let's say, but with a 'date' field of 1991. Initially, I just assumed I'd have to live with it, but I then recognized that the comic titles all followed a pattern:

```
Uncanny Inhumans (2015) #8
Journey Into Mystery (1952) #31
Strange Tales (1951) #110
Thor (1966) #430
```

Given that, I figured I could write a regex to get the year, and amazingly, I got it right on the first try!

The final bit is the actual "guess" logic:

```js
guess(decade) {
    // so decade will come in as a base 4d year, like 2000, 
    // my year from the API is m/yyyy. so we can easily get y, 
    // and then simply check the first 3 digits
    console.log('guessing',decade);
    console.log('right is', this.cover.year);
    if(decade.toString().substring(0,3) === this.cover.year.substring(0,3)) {
        this.msg = 'You got it right!';
        this.right++;
    } else {
        this.msg = 'Sorry, you were wrong!';
        this.wrong++;
    }
    this.guessReady = false;
    this.resultReady = true;
                
}
```

This basically comes down to checking the first three digits of your guess and the comic's year. I suppose you can say I've got an issue in the year 10000, and you're welcome to come find me then.

The last bit I want to share is some CSS. You'll notice that cover images I shared on top all have a red banner at the bottom that has the date on it. If that showed up in the game, it wouldn't be much of a game. I use CSS to crop it:

```css
img.cover {
    width: 415px;
    height: 615px;
    object-fit: cover;
    object-position: top;
    display: block;
    margin: auto;
}
```

This does *not* work properly all the time, but works well enough *most* of the time. Enjoy! (Note, you could run it in the CodePen below, but it's going to be pretty small. Either hide the source or click "Edit on CodePen" to see it bigger.)

<p class="codepen" data-height="600" data-theme-id="dark" data-default-tab="js,result" data-slug-hash="ZEVrMoj" data-editable="true" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/ZEVrMoj">
  Guess the Decade!</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>