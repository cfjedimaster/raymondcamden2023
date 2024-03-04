---
layout: post
title: "Converting a Vue 2 App to Alpine.js"
date: "2024-03-04T18:00:00"
categories: ["javascript"]
tags: []
banner_image: /images/banners/cat_ships2.jpg
permalink: /2024/03/04/converting-a-vue-2-app-to-alpinejs
description: A look at a conversion from Vue 2 to Alpine.js
---

A little over two years ago I published an ["idle clicker game"](https://www.raymondcamden.com/2022/01/13/building-my-first-idle-clicker-game-in-vuejs) built in Vue.js. I called it "IdleFleet" and was heavily inspired by games like [A Dark Room](https://adarkroom.doublespeakgames.com/), where I relied on simple text graphics and game mechanics that would change as you played. In my last [`<Code><Br>`](https://www.youtube.com/watch?v=15SgRdJPdoE) session, I walked through the process of building a simple text game and brought up IdleFleet as an example. While playing the game to refresh my memory about what I actually built... I discovered I actually really liked it. I decided it would be good to give it some attention with new features and other updates, but before I could do that, I knew I needed to switch from Vue to [Alpine.js](https://alpinejs.dev).

## Why Vue to Alpine?

So, this is mostly my opinion, and feel free to skip to the next section, but as much as I respect Vue, I don't find it as appropriate these days for simpler web pages and non-"apps". I put "apps" in quotes because that means something different to different people. In general, when what you are building involves multiple different 'views' (a screen for X, a screen for Y), I generally consider that an app. A page with JavaScript for interactivity is simpler and Vue feels like overkill there. Alpine *really* fits the spot for these needs and that's part of the reason I've been so enamored of it the last year or so. 

Also, and this is *really* now just an opinion, I kind of feel like Vue has lost some of its approachability it had in the older days. It's absolutely powerful, performant, and so forth, but I'm just finding myself a lot more comfortable with Alpine.

Ok, enough opinions, let's get into the process.

## The Previous Code

Before I get started, you can browse the Vue version of the repository here: <https://github.com/cfjedimaster/IdleFleet/tree/820f1bea20a33b6f9248ebdc687f9ce7c93235bf>. My changes primarily revolve around two files: `index.html` and `app.js` (although I made a small change in `app.css` as well). 

## Library Change

The first change was the easiest, and resulted in hundreds of awesome console errors - swapping out the Vue CDN (`<script src="https://unpkg.com/vue@2.6.14/dist/vue.js"></script>`) for Alpine (`<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>`). 

## Cloak Change

Both Vue and Alpine support the idea of a 'cloak' that will hide all the content of your application until the application is loaded. In Vue, you add `v-cloak` to your top-level container for your application and then add CSS to hide it. In Alpine, you just change this to `x-cloak` and rename the directive in CSS:

```css
[x-cloak] {display: none}
```

## Noting the App Container

Speaking of the app container, in a simple Vue app you could mark the 'area' where it would work with an ID and specify it in your Vue code with `el:"name of area"`, so for example, this in HTML:

```html
<div id="app" v-cloak">
```

And this in the JavaScript:

```js
const app = new Vue({
  el:'#app',
```

In Alpine, you specify it in your HTML:

```html
<div x-data="app" x-cloak>
```

And this is then referenced in JavaScript:

```js
Alpine.data('app', () => ({
```

## Filter Removal

Filters were removed in Vue 3, so I removed it and some config stuff as well:

```js
Vue.filter('number', s =>  {
  return numberFormat(s);
});

Vue.config.productionTip = false;
Vue.config.devtools = false;
```

The filter just called a function (`numberFormat`) defined later in the code. If your are curious, that function simply makes use of the awesome `Intl` API:

```js
function numberFormat(s) {
  if(!window.Intl) return s;
  return new Intl.NumberFormat().format(s);
}
```

## Main Application Updating

In the previous version, the `Vue` app defined variables in a `data key`, had a list of functions in `methods`, and computed values in, well, `computed`. Basically the `new Vue...` part wrapped an object where data, methods, and computed functions were defined in separate blocks, also the `init` function. 

When you define an Alpine application, you also define a top-level object, but there's no separation, you just provide a list of key/value pairs where each value can be simple reactive data or a function. You can mix this up as much as you want. 

That being said, I try to organize my Alpine applications by putting data on top, and then methods. I don't usually worry about splitting up computed methods versus regular methods, but due to the size of this application, I did. 

So I start off with variables:

```js
 Alpine.data('app', () => ({
    ships:[],
    credits: constants.INITIAL_CREDITS,
    log:[],
    autoShip:false,
    autoShipFlipped:false,
    mercantileSkill: 1,
    mercantileFlipped: false,
    nextShipReturnTime:null,
    shipSpeed: 1, 
    shipSpeedFlipped: false,
    messages:null,
    ceps:null, 
    cepsFlipped:false,
    lastCEPS: constants.INITIAL_CREDITS,
```

Then have my `init`:

```js
async init() {
	this.addShip();
	setInterval(() => { this.heartBeat() }, 1000);
	setInterval(() => { this.randomMsg() }, constants.RANDOM_MSG_INTERVAL * 1000);
	setInterval(() => { this.doAutoShip() }, constants.AUTO_SHIP_DURATION * 1000);
	//random events are not on intervals, but kick off first one 5ish minutes
	setTimeout(() => { this.randomEvent() }, (5000 * 60) + (getRandomInt(0,3000)*60));
	// even though we dont show CEPS immediately, track immediately
	setInterval(() => { this.generateCEPS() }, constants.CEPS_DURATION * 1000);
	this.messages = await (await fetch('./messages.json')).json();
},
```

Then a set of methods, where I generally tried to use alphabetical sorting, with the exception of `heartBeat` as it's a pretty core method to the game.

Computed methods in Alpine are written as getters, but you don't have to specify the `get` keyword. I like doing so though as it makes it more obvious. Here's an example of two of them:

```js
// getter section
get availableShips() {
	return this.ships.filter(s => s.available);
},

get autoShipAllowed() {
	// only flip once
	if(this.credits > constants.ALLOW_AUTOSHIP) {
	this.autoShipFlipped = true;
	}
	return this.autoShipFlipped;
},
```

Just like Vue, Alpine will notice when data referenced in these methods are updated and rerun their logic for display. 

## This Scope binding

One issue I ran into that I've seen before in Alpine, was ensuring my `this` scope was properly referenced. So for example, in Vue, I had this in my start-up code:

```js
setInterval(this.doAutoShip, AUTO_SHIP_DURATION * 1000);
```

In Alpine, when `doAutoShip` ran it lost access to the `this` scope variables. I tweaked them all like so:

```js
setInterval(() => { this.doAutoShip() }, constants.AUTO_SHIP_DURATION * 1000);
```

## HTML Updates - Variables

In Vue, you can add references to variables with brackets, so for example:

```html
{% raw %}Total Fleet Size: {{ fleetSize }}<br/>{% endraw %}
```

Alpine requires you to use `x-text` or `x-html`, so I switched these to:

```html
Total Fleet Size: <span x-text="fleetSize"></span><br/>
```

It's a bit more verbose and bugs me a tiny bit, but I got over it.

## HTML Updates - Conditions

Vue supports `v-if` and `v-show` and in Alpine this, yep, `x-if` and `x-show`. I switched my `v-if` statements to `x-show`. Another issue is that Alpine doesn't support `x-else`. In the one case where I needed it, I just used a condition with a negative (`!`) in front of it. 

```html
<button @click="enableAutoShip" x-show="autoShipAllowed" title="If enabled, this will periodically send out available ships."><span x-show="autoShip">Auto Ship Enabled</span><span x-show="!autoShip">Auto Ship Disabled</span></button>
```

## HTML Updates - Refs

Both Vue and Alpine support the ability to specify a 'ref' value in HTML that can then be referenced in code later. It gives you a pointer to the DOM. In Vue, this was done with `ref`, but in Alpine it's `x-ref`. Easy enough, right?

## HTML Updates - numberFormat

Previous, I used my number format in HTML like so:

```html
{% raw %}Credits: {{ credits | number }}{% endraw %}
```

For Alpine, I moved `numberFormat` into the Alpine application itself, and just called it like so:

```html
Credits: <span x-text="numberFormat(credits)"></span><br/>
```

## Wrap Up

All in all, it took me maybe an hour to make the change, so it wasn't too bad, and speaks to how easy it would be for a Vue developer to pick up and learn Alpine if they wanted, or needed to. Feel free to check out the current code here, <https://github.com/cfjedimaster/IdleFleet>, and if you want to waste, I mean enjoy, a few hours, check out the game here: <https://idlefleet.netlify.app/>. I've got more updates coming this week!
