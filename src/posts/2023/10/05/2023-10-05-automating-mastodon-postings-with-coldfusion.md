---
layout: post
title: "Automating Mastodon Postings with ColdFusion"
date: "2023-10-05T18:00:00"
categories: ["coldfusion"]
tags: ["mastodon"]
banner_image: /images/banners/elephants.jpg
permalink: /2023/10/05/automating-mastodon-postings-with-coldfusion
description: Using the Mastodon API with ColdFusion
---

I've had a lot of fun building Mastodon bots (see my [list](/bots) of super-important business critical bots as an example), typically using the [Pipedream](https://pipedream.com) platform, and more recently, [Cloudflare Workers](https://developers.cloudflare.com/workers/). The Mastodon API is kinda stupid easy and with "The Other Network" going to hell in a handbasket, I don't see myself building bots anywhere else. Just yesterday I came home from the [Adobe ColdFusion Summit](https://cfsummit.adobeevents.com/) and I thought it would be fun to see how easy it would be to build a Mastodon bot in ColdFusion. Here's what I was able to do in roughly ten minutes.

First, don't forget that to add automation to a Mastodon account, you need to go into your preferences, select the "Development" section, and create a new application. You can give very precise permissions for your automation, but I typically just take the defaults. When you're done creating it, you're given your credentials:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/cfm1.jpg" alt="Credentials from the Mastodon application" class="imgborder imgcenter" loading="lazy">
</p>

The only bit you need from this is the access token. 

## Toot, toot, toot

To post your first toot (Mastodon's name for Tweets), you can send your text to the `/api/v1/statuses` endpoint of your server. If you haven't used Mastodon yet, one of the biggest differences between that and Twitter is the federated nature of the service. Each user (and bot) has their own server and each server has their own API endpoint. I've got a bot up on the `botsin.space` server so to create a toot, it's as easy as:

```javascript
toot = 'Hello World from CFML, #now()#';
token = 'my token brings all the boys to the yard';


cfhttp(url='https://botsin.space/api/v1/statuses', method='post', result='result') {
    cfhttpparam(type='header', name='Authorization', value='Bearer #token#');
    cfhttpparam(type='formfield', name='status', value=toot);
}

writeDump(deserializeJSON(result.fileContent));
```

The result is a large struct of info about the toot:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/cfm2.jpg" alt="Data returned after posting a new Toot" class="imgborder imgcenter" loading="lazy">
</p>

Here's an example toot:

<iframe src="https://botsin.space/@cfmlbot/111183663194853769/embed" class="mastodon-embed" style="max-width: 100%; border: 0" width="400" allowfullscreen="allowfullscreen"></iframe><script src="https://botsin.space/embed.js" async="async"></script>

## Pretty Toots

A toot can have media attached to it, more than one actually, but I think *typically* most folks will want to have an image attached to a toot. To do this, you first upload the media. When you do, you're given a result object that includes an ID value. Then when you toot, you can add the ID to the data. Here's an example of that:

```javascript
toot = 'Hello World from CFML, #now()#';
token = 'damn right its better than yours';


cfhttp(url='https://botsin.space/api/v2/media', method='post', result='result') {
    cfhttpparam(type='header', name='Authorization', value='Bearer #token#');
    cfhttpparam(type='file', name='file', file=expandPath('./kitten.jpg'));
}
mediaOb = deserializeJSON(result.filecontent);


cfhttp(url='https://botsin.space/api/v1/statuses', method='post', result='result') {
    cfhttpparam(type='header', name='Authorization', value='Bearer #token#');
    cfhttpparam(type='formfield', name='status', value=toot);
    cfhttpparam(type='formfield', name='media_ids[]', value=mediaOb.id);
}
```

If you're curious, here's the result:

<iframe src="https://botsin.space/@cfmlbot/111183688005293306/embed" class="mastodon-embed" style="max-width: 100%; border: 0" width="400" allowfullscreen="allowfullscreen"></iframe><script src="https://botsin.space/embed.js" async="async"></script>

(Note - if you see some broken images, at least for me I've noticed a bit of slowdown on the `botsin.space` server today. It's run by an individual on his own time so it's going to be perfect, just FYI.) 

## Wrap It In a Pretty Package

I took all of the above and wrapped it in a simple ColdFusion component. To be clear, the Mastodon API is quite intensive. I'm literally just wrapping the tiny bit I've needed to build my simple bots. If folks think this is useful and want to build upon it, let me know and I'll make an actual GitHub repo out of it. For now, here it is:

```js
component {

    property name="server" type="string";
    property name="token" type="string";

    function init(server, token) {
        variables.server = arguments.server;
        variables.token = arguments.token;
    }

    function uploadMedia(path) {

        cfhttp(url='https://#variables.server#/api/v2/media', method='post', result='local.result') {
            cfhttpparam(type='header', name='Authorization', value='Bearer #token#');
            cfhttpparam(type='file', name='file', file=path);
        }
        return deserializeJSON(result.filecontent);
    }

    function postToot(required toot, imagepath) {

        if(arguments.keyExists('imagepath')) {
            local.mediaOb = uploadMedia(imagepath);
        }

        cfhttp(url='https://#variables.server#/api/v1/statuses', method='post', result='local.result') {
            cfhttpparam(type='header', name='Authorization', value='Bearer #variables.token#');
            cfhttpparam(type='formfield', name='status', value=arguments.toot);
            if(arguments.keyExists('imagepath')) {
                cfhttpparam(type='formfield', name='media_ids[]', value=local.mediaOb.id);
            }
        }

        return deserializeJSON(local.result.filecontent);
    }
}
```

And here's sample usage:

```js
token = 'so secret it burns';

mastodon = new mastodon(server='botsin.space', token=token);

result = mastodon.postToot('Hello World from a CFC...');
writedump(result);

result = mastodon.postToot('Hello World from a CFC - with Image', expandPath('./kitten.jpg'));
writedump(result);
```

That's it, enjoy!

Photo by <a href="https://unsplash.com/@ollila?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Mylon Ollila</a> on <a href="https://unsplash.com/photos/j4ocWYAP_cs?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>