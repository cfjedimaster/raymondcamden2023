---
layout: post
title: "ColdFusion's CFOAUTH Tag"
date: "2024-05-10T18:00:00"
categories: ["coldfusion"]
tags: []
banner_image: /images/banners/cat_login.jpg
permalink: /2024/05/10/coldfusions-cfoauth-tag
description: A look at the CFOAUTH Tag
---

This will be my third [ColdFusion](https://www.raymondcamden.com/categories/coldfusion) post in the past year. I'm not saying I'm going to continue the trend, but as I find interesting use cases, I'm going to share. Today, that involves the [`<cfoauth>`](https://cfdocs.org/cfoauth) tag that I recently had a chance to play with. 

About two weeks ago, an old client of mine reached out asking for help adding an OAuth flow to their CF app. I've covered CF and OAuth in a few posts from ten-plus years ago ([part one, covering Facebook](https://www.raymondcamden.com/2013/04/01/ColdFusion-and-OAuth-Part-1-Facebook/), [part two, covering LinkedIn](https://www.raymondcamden.com/2013/04/03/ColdFusion-and-OAuth-Part-2-Facebook), and [part three, covering Google](https://www.raymondcamden.com/2013/04/17/ColdFusion-and-OAuth-Part-3-Google)). 

That code demonstrated the basics of using OAuth, which entailed:

* Creating your application on the platform you'll be authenticating again, which gives you credentials.
* Generating a link in your CF app that will take the user to the authentication endpoint.
* When redirected back to the app with a code, using the code to get an access token.

Now, that flow hasn't changed, and I could have simply copied over the existing code that would still work fine, but I decided I'd take a quick look at the `<cfoauth>` tag to see if it would help. 

While the [docs](https://cfdocs.org/cfoauth) are clear about the syntax, it doesn't really explain how it works practically. The most important aspect is that the tag handles the redirect flow for you automatically. What that means is - on a page with `<cfoauth>`, the user is automatically redirected. This is important to know as you'll want to use the tag on a page with no UI, one that is loaded when a user wants to login. The tag will also handle responding to the *return* from the auth provider by automatically getting the access token (on a good result of course).

In a simple CF app, you could use this like so. First, a basic `Application.cfc`:

```js
component {
	this.name = "cfoauthdemo";
	this.sessionManagement = true;

	public function onRequestStart(page) {
		if(structKeyExists(url, "refresh")) {
			applicationStop();
			structClear(session);
			cflocation(url="/index.cfm",addToken=false);
		}
	}

	public function onApplicationStart() {
		application.googleAuth = {
			clientId="client id from google",
			clientSecret="client secret from google"
		}

		return true;
	}

}
```

All I've done here is define my Google credentials in the application scope and enabled session management. Now, on an `index.cfm` page, I can do this:

```html
<h2>cfoauth Demo</h2>

<cfif not structKeyExists(session, "auth")>
	<p>
	<a href="login.cfm">Login with Google</a>
	</p>
<cfelse>
	<cfoutput>
	<img src="#session.auth.other.picture#">
	<p>
	You are #session.auth.name#
	</p>
	</cfoutput>
</cfif>
```

Basically, if not authenticated with Google, link to the page that will handle it, otherwise, print out basic information from the user profile.

Here's `login.cfm`:

```html
<cfoauth type="google" 
    clientId="#application.googleAuth.clientId#" 
    secretkey="#application.googleAuth.clientSecret#" 
	result="result" 
    scope="https://www.googleapis.com/auth/calendar"
    >

<cfif structKeyExists(variables, "result")>
	<cfset session.auth = result>
	<cflocation url="/index.cfm" addtoken="false">
</cfif>
```

I've provided a type, my credentials, and told the tag how to store the result. I've also requested an additional scope for Google Calendar data.

So to be clear - when the user enters this page, the tag is going to generate the URL at Google to handle auth, **and automatically redirect**. That's the important bit and what I found lacking in the docs. 

When, and if, the user logs in, they are automatically redirected back to this URL, and the `result` variable will be populated. Here's an example of that result. I didn't bother obscuring the access token as it's expired:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/cf2.jpg" alt="Resulty from cfoauth" class="imgborder imgcenter" loading="lazy">
</p>

And here's the result back on index.cfm:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/cf3.jpg" alt="Result showing my name, pic" class="imgborder imgcenter" loading="lazy">
</p>

With that access token, you can now make ad hoc queries against what you have access to, and as we asked for calendar access in the scope, we can fetch it. So for example (and I wouldn't include a UDF on the page like this, but it works for a simple sample):

```html
<cfscript>
	function getEvents(accesstoken, data=[], page="") {

		var theUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
		if(arguments.page != "") {
			theUrl &= "&pageToken=#page#";
		}
		cfhttp(url="#theUrl#") {
			cfhttpparam(type="header", name="Authorization", value="OAuth #arguments.accesstoken#");
		}

		var result = deserializeJSON(cfhttp.fileContent).items;
		return result;
	}
</cfscript>

<h3>Events</h3>
<cfset events = getEvents(session.auth.access_token)>
```

Simple, and useful... but...

## Handling Expiration

Access tokens returned from an OAuth provider have an expiration, and here we see the first problem. If you look at the `cfdump` of the result above, you'll note I got the access_token, but the `expires_in` value which I *know* (well, 99% know) is returned by Google is not in this result set for some odd reason.

Next, it's possible to ask Google (and I assume other providers) to return an additional `refresh_token`. That token can be used to refresh an access token when it expires. 

In my research, I found that if you added `access_type=offline&prompt=consent` to the URL when authenticating, you should get the values returned. The `<cfoauth>` supports this via the `urlparams` attribute, so I tried this:

```html
<cfoauth type="google" 
    clientId="#application.googleAuth.clientId#" 
    secretkey="#application.googleAuth.clientSecret#" 
	result="result" 
    scope="https://www.googleapis.com/auth/calendar"
	urlparams="access_type=offline&prompt=consent"
>
```

Easy, right? And while it changed the 'auth' flow (ie, Google noticed the change in the request), when I back to the result variable, the `refresh_token` wasn't there. If I had to guess, I'd say the tag is looking for a set of named variables and ignoring the rest of the result, which doesn't make sense to me. 

Unfortunately, I'd say this one flaw makes the tag unusable *unless* you want to force users to log in every 60 minutes (the value Google uses for its tokens). To be fair, that's probably not too big of a hurdle as folks probably won't be sticking around that long, but it's something you would need to ensure you properly handle. 

I filed a bug report for this behavior issue here: <https://tracker.adobe.com/#/view/CF-4221899>


