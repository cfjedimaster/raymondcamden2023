---
layout: post
title: "Three Cool (to me) Node.js Features"
date: "2024-03-20T18:00:00"
categories: ["javascript"]
tags: ["nodejs"]
banner_image: /images/banners/cool-cat.jpg
permalink: /2024/03/20/three-cool-to-me-nodejs-features
description: A look at three cool Node.js features.
---

I've been using Node.js on the regular now for probably over a decade, but one thing I've never done well is keep up to date with its features and new additions. In general, my brain just thinks "use javascript" and that's all. The last time I really cared about what precisely was supported was when I was using `fetch` in client-side JavaScript and it wasn't supported natively in Node. Luckily I could just use `node-fetch` and be done with it. 

That being said, I recognize I've not done a great job of keeping track of updates to Node itself so I try to notice it when folks mention it. Over the past week or so I've encountered not one, not two, but three *really* cool things and I figured I'd share them with yall. If you want to skip reading and watch a video, I've got you covered:

<iframe width="560" height="315" src="https://www.youtube.com/embed/rqQOWcsamqI?si=oxrhM_BjEod236g5" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="display:block; margin:auto; margin-bottom:15px"></iframe>

## Watch and Reload on Change

The first feature I want to share isn't necessarily new, it's been around since the fall of 2022, but as it's still marked 'experimental' you may have missed it. For years I made use of a tool, [nodemon](https://www.npmjs.com/package/nodemon), that would run your Node.js code and on detecting a change in the filesystem, would automatically restart your code. I stopped using it as much when I moved away from using Express. Most of my Node.js code now are simple scripts - run them and check the output. Node now has this built-in via a simple command-line flag: `--watch`. So for example:

```bash
node --watch watch1.js
```

Here's the contents of `watch1.js`:

```js
console.log('Watch me!', new Date());
```

Running this you get the following:

<p>
<img src="https://static.raymondcamden.com/images/2024/03/node1.jpg" alt="Terminal output from watching a node script" class="imgborder imgcenter" loading="lazy">
</p>

In the screenshot above you can see both the experimental warning and the blue line at the end saying it has completed running the script. If I modify the script, I get this:

<p>
<img src="https://static.raymondcamden.com/images/2024/03/node2.jpg" alt="Script reran." class="imgborder imgcenter" loading="lazy">
</p>

Two things to note here - it cleared the entire terminal, which is useful, and gave useful messages about restarting and finishing. If my script took time to run, having that first message about restarting would be really useful.

What makes me most happy about this is that I can use this for scripts, not just servers. I'm sure `nodemon` did that too, but I just didn't use it that way. So much of my workflow is - code, run, note the error and curse, edit, save, run - and this will help!

You can also watch *other* files as well. Imagine this script:

```js
import fs from 'fs';

let text = fs.readFileSync('./notes.txt', 'utf8');

console.log(`Contents of file:\n${text}`);
```

With the `--watch-path` argument, I can note changes to the file. Here's an example:

```bash
node --watch-path notes.txt --watch watch2.js
```

Now if I edit either my JavaScript *or* the source file, it will automatically reload. Heck, you can even just watch the txt file if you want:

```bash
node --watch-path notes.txt watch2.js
```

Multiple `--watch-path` statements can be used and you can specify a directory as well.

## Loading Environment Variables

Nearly every project I work on has some kind of API key involved, and for that, I create a `.env` file and install [dotenv](https://www.npmjs.com/package/dotenv). `dotenv` will read in the `.env` file and set key-value pairs to environment values. Turns out I may never use it again. 

Node 20.6.0 (September 2023) added support for the `-env-file` flag. So given this `.env` file:

```
MILKSHAKE=brings all the boys to the yard
```

And this one-line Node program:

```js
console.log(process.env.MILKSHAKE);
```

I can use the following command:

```bash
node --env-file .env env1.js
```

To be clear, the idea is that you use the `.env` file locally, but in production rely on "proper" environment variables. You never check in your `.env` files to source control. 

So while that was added about half a year ago, more recently, Node v21.7.0 (released March 6), also added this:

```js
process.loadEnvFile();
```

Which does the exact same thing. You can pass a path to it, but by default it loads `.env`. So my previous one line program becomes:

```js
process.loadEnvFile();

console.log(process.env.MILKSHAKE);
```

I love it. Now, I'm kinda torn as to what I'll use by default. I kinda like *not* having to add any code to my program to load `.env`, but I also worry I'll forget the command-line flag. The last couple of scripts I wrote have used `process`.loadEnvFile()`, but I'm thinking I may switch to the CLI flag instead. I don't know - I'll figure it out. Eventually.

## Colorful Output

Continuing the trend of "I used to add an open source project for this", Node 21.7.0 also added support for coloring console output. The new [styleText](https://nodejs.org/api/util.html#utilstyletextformat-text) method from `node:util` lets you pass colors and styling. So for example:

```js
import { styleText } from 'node:util';

console.log(styleText('red', 'Danger, Danger,  Will Robinson!'));
console.log(styleText('yellow', 'Nine Princes of Amber'));
console.log(styleText('green', 'All systems are nomimal.'));
```

Will return:

<p>
<img src="https://static.raymondcamden.com/images/2024/03/node3.jpg" alt="Three lines output, one red, yellow, and green" class="imgborder imgcenter" loading="lazy">
</p>


You can also use colors in the background, and 'bright' variants:

```js
console.log(styleText('bgRed', 'Error, error Will Robinson!'));
console.log(styleText('redBright', 'Error, error Will Robinson!'));
```

I'm going to switch to my Visual Studio Code terminal for this example as something in my terminal isn't showing "bright" - well, bright. I blame the terminal, not Node.

<p>
<img src="https://static.raymondcamden.com/images/2024/03/node4.jpg" alt="More color examples" class="imgborder imgcenter" loading="lazy">
</p>

I kept the first three lines in the screenshot above and hopefully, you can see that the red is, indeed, a bit brighter? Bolder? I don't know. It looks different in Visual Studio Code like I said, not so much in Windows Terminal. 

You can employ multiple effects by wrapping the function:

```js
console.log(styleText('bold', styleText('red','Error, error Will Robinson!')));
```

<p>
<img src="https://static.raymondcamden.com/images/2024/03/node5.jpg" alt="Even more color samples" class="imgborder imgcenter" loading="lazy">
</p>

Again, it may not come out terribly well on the blog here, but in my terminal, I can see a difference between the three reds. 

If you aren't ready to upgrade to this version of Node, the excellent [chalk](https://www.npmjs.com/package/chalk) package is what I used for this before. 

## But wait, there's more...

Obviously, I'm probably missing out on even more Node features, so let me know in a comment below what you've recently discovered that's been useful for you!
