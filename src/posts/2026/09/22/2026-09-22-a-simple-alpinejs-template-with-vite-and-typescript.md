---
layout: post
title: "A Simple Alpine.js Template with Vite and TypeScript"
date: "2026-09-22T18:00:00"
categories: ["development"]
tags: ["javascript","typescript","alpinejs"]
banner_image: /images/banners/typebars.jpg
permalink: /2026/09/22/a-simple-alpinejs-template-with-vite-and-typescript
description: A simple example of using Alpine and TypeScript with Vite.
---

This will be a quick one - but as I think more about TypeScript and how I'd like to learn (and play, and build silly demos), I naturally thought it may make sense to look at how I'd use [Alpine.js](https://alpinejs.dev/) with that stack. Alpine's been my go to library for web apps that reach the level of complexity where I'd like some help with DOM manipulation and such. I don't *always* use it, because (imho) the default stack should be as vanilla as possible (obviously I'm going a bit off ranch with these explorations into TypeScript and Vite) but Alpine is lightweight and simple and just a great little library in general. What follows isn't necessarily a "template" as it's got a bit of template code with it, but I thought it would be helpful to share. As always, let me know what you think!

## Step One - the Scaffold

In my [first post](https://www.raymondcamden.com/2026/09/18/its-only-a-decade-late-ill-learn-typescript) a few days ago, I mentioned that the Vite scaffold support lets you create a vanilla application with TypeScript. I used that for my code and removed as much of the demo code as I could. I do wish Vite's template was a bit more minimal. 

## Step Two - Adding Alpine

Usually I make use of the Alpine CDN in my demos, for this one, I instead installed it as a dependency. I also installed the Alpine types dependency. Here's my package.json:

```json
{
  "name": "alpine-test-1",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@types/alpinejs": "^3.13.11",
    "typescript": "~6.0.2",
    "vite": "^8.3.0"
  },
  "dependencies": {
    "alpinejs": "^3.17.4"
  }
}
```

## Step Three - the HTML

Ok, so this part is really simple. Alpine "ties" to your DOM usually via an `x-data` attribute. That means this is the bare minimum:

```html
<div x-data="app">
</div>
```

But of course you'll have more Alpine directives and more HTML. Also, "app" is not required, but is the name I pretty much use all the time. For my template/demo, I output a couple of variables and included a few click directives just to test stuff out. Oh, I also added [Simple.css](https://simplecss.org/) to just to make it look prettier. That's absolutely not necessary. The Vite demo actually imports CSS in their main TypeScript file (you can see that on Stackblitz [here](https://stackblitz.com/edit/vitejs-vite-hpgbiipd?file=src%2Fmain.ts&terminal=dev)) and I'm not sure how I feel about that. I know it minimizes the code, but it feels really weird to me. Anyway, here's my HTML:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css">
    <title>alpine-test-1</title>
  </head>
  <body>
    <div x-data="app">
      <p>
      <span x-text="message"></span>
      </p>
      <p>
      <button @click="meow()">Meow (default)</button>
      <button @click="meow('Purr...')">Meow (custom)</button>
      </p>
      <ul>
        <template x-for="(cat, index) in cats" :key="index">
          <li x-text="cat.name"></li>
        </template>
      </ul>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

## Step Four - Enter the TypeScript

Ok, for the final bit - my TypeScript code:

```js
import Alpine from 'alpinejs';

type Cat = {
  name: string;
  breed: string;
  gender: 'male' | 'female';
};

Alpine.data('app', () => ({
  message:'Hello from Alpine!',
  cats: [] as Cat[],
  init() {
    this.cats.push({ name: 'Whiskers', breed: 'Siamese', gender: 'male' });
    this.cats.push({ name: 'Fluffy', breed: 'Persian', gender: 'female' });
  },
  meow(message:string = 'Meow!') {
    alert(message);
  }
}));

Alpine.start();
```

Let me point out the important bits. Unlike my usual Alpine demos, I import Alpine here from the local install. I also need to fire `Alpine.start()` manually. But outside of that, it's pretty vanilla Alpine - define the app and include relevant variables and methods, which in this case is pretty small. 

Now obviously I'm trying to learn TypeScript as well, but I kept it pretty short here. I've defined a type for `Cat` and when I worked with the data, my editor (Visual Studio Code) provided support as I'd expect - it knew the right parts of a cat and correctly flagged an error if I tried to include something that wasn't defined in the type. 

As a reminder, this is all done in the editor - it wouldn't be a "real" error in production - but the idea here - and the benefit of TypeScript - is that I'd (hopefully!) catch it much earlier. 

Outside of that, you can also see where I define `cats` as an array of `Cat` and specify that the `message` argument to `meow` is string.

Again - this is pretty minimal TypeScript usage, but I dig it, and I can really see how in some of my larger Alpine demos in the past, the additional safety/checking/etc would have been real helpful I think.

## There Is No Step Five

If you want the code to try it yourself, you can copy it from here: <https://github.com/cfjedimaster/typescript-stuff/tree/main/alpine-test-1>. I know this was pretty short, but I'd still love any feedback or advice, so hit up the comments below!