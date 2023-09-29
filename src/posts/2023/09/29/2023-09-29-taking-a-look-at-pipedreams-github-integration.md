---
layout: post
title: "Taking a Look at Pipedream's GitHub Integration"
date: "2023-09-29T18:00:00"
categories: ["serverless"]
tags: ["javascript","pipedream"]
banner_image: /images/banners/playing_horns.jpg
permalink: /2023/09/29/taking-a-look-at-pipedreams-github-integration
description: A look at how Pipedream added GitHub support for Workflows
---

It's been a little while since I've blogged about [Pipedream](https://pipedream.com). I'm still a *very* happy user of the service, I just hadn't had anything to write about recently. That changed earlier this month when they [announced](https://pipedream.com/blog/github-sync/) GitHub support on thier blog. I decided to test it out and here's what I found. I also recorded a video of it in action so feel free to skip my prose and just skip to the embed at the bottom.

## What is it, and what it is not...

First and foremost, the important thing to know is that this feature will sync a copy of your workflow to GitHub. That's probably obvious. I'll show you what that looks like in a moment, but it means you can all the benefits of GitHub (branches, history, etc) and apply it to your workflow.

However - while you can obviously clone your repo locally to get the files, you can't yet *run* the workflow locally. Now, I know that's been a request for a *very* long time and my guess (just my guess) is that this support is part of that process and in the future, we'll have that ability as well.

Also note that this feature is for people on the paid tier. Personally, that feels fair to me givin what Pipedream gives out on their free tier. I kinda figure if you're at the level of _needing_ this then you are most likely at the level to be _paying_ for it. 

## GitHub Support is Project Based

Being that I've been "away" a bit from Pipedream, another feature I hadn't worked with was [Projects](https://pipedream.com/docs/projects/). Projects serve as a way to group workflows together, and it's something else the service has needed so I'm really happy to see it. You can even include folders within a project for further organization. Pipedream also supports [Workspaces](https://pipedream.com/docs/workspaces/)which groups Projects underneath them. 

I'm going to <strike>steal</strike>borrow this graphic from their docs which shows this in action:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/pd1.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

All of the above is just to point out that the GitHub feature is *project* based. 

## An Example

To demonstrate this (and remember, I'll have a video at the bottom showing the same), let's start off on the Projects screen:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/pd2.png" alt="Projects list" class="imgborder imgcenter" loading="lazy">
</p>

Clicking on "New project" lets you create, you guessed it, a new project, but also allows you to enable GitHub Sync. 

<p>
<img src="https://static.raymondcamden.com/images/2023/09/pd3.png" alt="New project dialog with multiple GH settings that can be tweaked" class="imgborder imgcenter" loading="lazy">
</p>

I had already connected Pipedream to GitHub so I was able to quickly select my account. Note two things in particular here. The repository name will default to the project name, but you're allowed to tweak that. Next, by default the repo will be private, but I've unchecked it above. (I'm going to delete the repo after I publish this post as I've already got a completed repo to share.)

Once the project is made, you're dropped into the Project UI:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/pd4.png" alt="Project display" class="imgborder imgcenter" loading="lazy">
</p>

One thing to note is that you can't start creating workflows. I was a bit confused by that but eventually figured out I needed to click the nice obvious blue "Edit" button on the right. Doing so prompts you to create a branch. All development on your workflows will be done via branches.

Now - let me pause here. I'll be honest and say that while I use GitHub every day, like, every single day, I keep things pretty simple in my repos. I do *not* make use of branches. Yes, I know that's wrong. That being said, I was a bit worried about all this and the cool thing is that Pipedream's UI makes the *entire* process braindead simple, even for me.

Anyway, you can take their default branch new, or do as I did, rename it:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/pd5.png" alt="New brnach" class="imgborder imgcenter" loading="lazy">
</p>

At this point you get a "New" button in the project UI for creating stuff:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/pd6.png" alt="New dialog" class="imgborder imgcenter" loading="lazy">
</p>

Ok, so if you make a new workflow here, that process pretty much remains the same. You add steps, you test, etc. The biggest difference is that you get this in the navigation:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/pd7.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Clicking that will give you an *awesome* list of changes (which for my test with one part to a workflow is pretty small) and one button to do the merge. 

<p>
<img src="https://static.raymondcamden.com/images/2023/09/pd8.png" alt="" class="imgborder imgcenter" loading="lazy">
</p>

## The Bits

Ok, so for my *real* test, I built a workflow with 4 steps:

* An HTTP trigger
* Use Spotify's API to get the top tracks from Depeche Mode
* Manipulate the results to return a smaller set of information for each track
* And finally, return the result in JSON.

If you want, you can hit this workflow here: <https://eowg7ft5xg257tw.m.pipedream.net>

This workflow is available on GitHub here: <https://github.com/cfjedimaster/GHIntegrationTest2>

If you visit that repo, you'll see it has a readme and one folder for my one workflow. Going into it shows the contents:

<p>
<img src="https://static.raymondcamden.com/images/2023/09/pd9.png" alt="GitHub list of resources for the workflow" class="imgborder imgcenter" loading="lazy">
</p>

The Yaml file describes my workflow at a high level. In it you can see the steps and metadata:

```
schema: workflow/2022.04
name: GetDepecheModeTracks
settings:
  error_notification: true
triggers:
- id: hi_ZbHvJ98
steps:
- namespace: get_artist_top_tracks
  runtime: nodejs18.x
  uses: spotify-get-artist-top-tracks@0.1.1
  props:
    spotify:
      authProvisionId: apn_3JhQwL
    artistId: 762310PdDnwsDxAQxzQkfX
    market: US
- namespace: filterResults
  runtime: nodejs18.x
  uses: "./filterResults/entry.js"
- namespace: returnJSON
  runtime: nodejs18.x
  uses: "./returnJSON/entry.js"
```

For my two code steps, they both have their own folders with one file, `entry.js`, which just contains my custom code. Here's `filterResults/entry.js`:

```js
export default defineComponent({
  async run({ steps, $ }) {
    return steps.get_artist_top_tracks.$return_value.map(r => {
      return {
        name: r.name,
        duration:r.duration_ms,
        album:r.album, 
        preview:r.preview_url, 
        external_url:r.external_urls.spotify
      }

    });
  },
})
```

And that's pretty much it! 

## The "I want to hear Ray's Smooth Silky Voice" version

As I said above, I recorded a video showing this in action, and you can check it out below. Enjoy!

<iframe width="560" height="315" src="https://www.youtube.com/embed/boZ-t9MI454?si=e2Po2okX3U8CkRux" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="display:block;margin:auto;margin-bottom:10px"></iframe>

Photo by <a href="https://unsplash.com/@xavier_von_erlach?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Xavier von Erlach</a> on <a href="https://unsplash.com/photos/KjyuH25GS48?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  