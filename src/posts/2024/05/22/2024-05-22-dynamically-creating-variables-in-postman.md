---
layout: post
title: "Dynamically Creating Variables in Postman"
date: "2024-05-22T18:00:00"
categories: ["development"]
tags: ["postman"]
banner_image: /images/banners/cat_mailman.jpg
permalink: /2024/05/22/dynamically-creating-variables-in-postman
description: A quick tip for working with variables in Postman
---

This may come as a shock to you, but sometimes, I don't read the documentation for the tools I use. Sometimes, I don't even *look* at all the various menu items and UI stuff for the tools I use. I know I'm probably the only one who does that and I apologize for letting down my faithful readers. 

<p>
<img src="https://static.raymondcamden.com/images/2024/05/shockcat.jpg" alt="Shocked cat" class="imgborder imgcenter" loading="lazy">
</p>

I've used [Postman](https://www.postman.com/) for probably over ten years now. I don't use it terribly often as I can normally whip up a quick API demo in Node in minutes, but I'll use Postman from time to time. As you can probably guess by how I started this post, my use of Postman was very rudimentary. Heck, I've only recently realized the benefit of organizing requests via various collections and using different environments for variables. 

Recently, I was introduced to a very cool, and very *simple* feature that is incredibly useful. My thanks go to my coworker [Ben Vanderberg](https://www.benvanderberg.com/) for showing me this tip (and the follow-up coming tomorrow). 

Many APIs require two calls in order to work properly. The first call takes a set of credentials, usually an ID value and a secret, and exchanges them for an access token. Then in the next call the token, and sometimes the ID value again, are passed to authenticate the operation. 

So for example, here's a Postman request to authenticate and get a token for [Firefly Services](https://developer.adobe.com/firefly-services/docs/guides/):

<p>
<img src="https://static.raymondcamden.com/images/2024/05/pm1a.jpg" alt="Postman request" class="imgborder imgcenter" loading="lazy">
</p>

In the request above (and I apologize if that's too small to read, let me know), the `client_id` and `client_secret` values are both pointing to variables defined in my environment. 

Now, in the next request, I need to pass the `client_id` and the token from the previous call. 

<p>
<img src="https://static.raymondcamden.com/images/2024/05/pm2.jpg" alt="Postman request headers" class="imgborder imgcenter" loading="lazy">
</p>

You'll notice that the variable, `accessToken`, has a reddish color, which is Postman telling me it isn't defined.

This is where I'd usually run that first request, copy the value, come into this request, paste, and run. That felt kinda lame, and bugged me (although apparently not enough to bother reading the docs, shame again on me), but as the access token would last a while, I'd do my testing and just be done with it.

This is where Ben's tip really came in to help me. Every request in Postman has a "Scripts" tab and allows you to write code for both before and after the request. Postman has a [JavaScript API](https://learning.postman.com/docs/tests-and-scripts/write-scripts/postman-sandbox-api-reference) that lets you work with the request and actually update the application itself. That API even lets you... define variables. All in like two lines of code:

```js
var jsonData = pm.response.json();
pm.environment.set("accessToken", jsonData.access_token);
```

This basically says - parse the response from the call as JSON and create an environment variable named `accessToken`. And literally, that's it. Now when you run the first call, the post-request script will automatically create that variable for you and the second request will be able to use it. 

That is so dang useful I've actually found myself using Postman a lot more, and tied together with the tip I'm going to share tomorrow, I'm definitely turning into more of a Postman user. 

Now, one quick note. Currently, the JavaScript SDK does not support a way to create *secret* variables, which means if you open the environment it will be in plain text. There is a [two-year-old bug](https://github.com/postmanlabs/postman-app-support/issues/10580) report on this so most likely it isn't being changed soon. In my experience, I saw that if I set the new variable to secret, the next time my authentication request ran, it did *not* toggle it back to being exposed, so you can manually change it one time if you want.

If this was news to you, let me know in a comment below, and enjoy the video version of this post!

<iframe width="560" height="315" src="https://www.youtube.com/embed/B6OSj4JjgL0?si=CUVdFGYc6UfxGODq" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>
