---
layout: post
title: "ColdFusion (2025)'s CFOAUTH Tag"
date: "2025-09-30T18:00:00"
categories: ["coldfusion"]
tags: []
banner_image: /images/banners/doorlock.jpg
permalink: /2025/09/30/coldfusion-2025s-cfoauth-tag
description: An update to ColdFusion's cfoauth support.
---

Back in May of last year, I wrote up a [blog post on ColdFusion's oauth tag](https://www.raymondcamden.com/2024/05/10/coldfusions-cfoauth-tag). This was based on a feature from way back in ColdFusion 11 that I thought I'd take a look at to see if it was useful. I'm not going to repeat the entire previous blog post, but in general... it was *almost* something I'd recommend.

The tag did a good job of handling creating the right oauth link for you. So you could (after setting stuff up with your provider of course) drop the tag on a page, and when the user hit it, they would be prompted to login with the third party provider. When returned, the tag would handle getting the access token and such and giving you a nice little structure of data for you to use. 

I generally dislike my server-side code from doing *anything* on the client-side, but this felt like a good compromise in regards to what it was doing. That being said, I ultimately could not recommend using the tag as it failed at two crucial aspects:

* It did not return the `expires_in` value so you knew how long your access token was valid.
* It did not return a refresh token, even if you used the right parameters to get that.

I filed a [bug report](https://tracker.adobe.com/#/view/CF-4221899) for this and moved on. Now it's over a year later, ColdFusion 2025 was released in the meantime, and it looks like everything was fixed... despite my original bug report not being updated.

From the [release notes](https://helpx.adobe.com/coldfusion/using/whats-new.html):

<blockquote>
cfoauth changes: The cfoauth tag has been updated to updated to support enhanced workflows and configurations. This release also introduces Microsoft as a new auth type along with Google and Facebook. View the cfoauth tag doc for more information.
</blockquote>

Cool! So... does it work better? Absolutely. As I said, I'm not going to repeat everything from the previous post, but this code now works as expected in terms of getting a refresh token and having the expiration value:

```html
<cfoauth type="google" 
    clientId="#application.googleAuth.clientId#" 
    secretkey="#application.googleAuth.clientSecret#" 
	result="result" 
    scope="https://www.googleapis.com/auth/calendar"
    urlparams="access_type=offline&prompt=consent"
    >

<cfif structKeyExists(variables, "result")>
	<cfset session.auth = result>
	<cflocation url="index.cfm" addtoken="false">
</cfif>
```

That `auth` struct now contains what I said above, `expires_in` and `refresh_token`:

<p>
<img src="https://static.raymondcamden.com/images/2025/09/cfo1.jpg" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Cool! Even more interesting, according to the [reference doc](https://helpx.adobe.com/coldfusion/cfml-reference/coldfusion-tags/tags-m-o/cfoauth.html) for changes to this tag in CF2025, you can also refresh your access token using the refresh token via the tag, saving you a bit more work. 

I hereby now approve usage of this tag. (Allow me to pretend that I somehow dictate how folks use ColdFusion. ;) 

Photo by <a href="https://unsplash.com/@kaffeebart?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Kaffeebart</a> on <a href="https://unsplash.com/photos/a-close-up-of-a-padlock-on-a-door-KrPulSdUetk?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      