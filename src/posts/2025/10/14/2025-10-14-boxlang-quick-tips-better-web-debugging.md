---
layout: post
title: "BoxLang Quick Tips - Better Web Debugging"
date: "2025-10-14T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/bqtms.jpg
permalink: /2025/10/14/boxlang-quick-tips-better-web-debugging
description: A simple flag for BoxLang MiniServer that is incredibly helpful
---

Today's [BoxLang](https://boxlang.io) Quick Tip is incredibly quick, but also, really darn useful and something I had wished I knew earlier. The BoxLang [MiniServer](https://boxlang.ortusbooks.com/getting-started/running-boxlang/miniserver) is a lightweight web server that you can use to test your web applications. I say lightweight but it's gotten some really good improvements over the past few months, including [flexible URL rewriting](https://www.raymondcamden.com/2025/08/11/url-rewriting-with-boxlang-miniserver). Today I'm going to talk about something that's going to be really useful to those of you who, like me, make mistakes from time to time. As with most of my BoxLang Quick Tips, you can skip to the video version at the bottom of the post.

Let's consider a BoxLang web application that consists of a grand total of one file:

```html
<bx:script>
function helloWorld(string name="nameless") {
	return "Hello, #arguments.name#";
}
</bx:script>

<bx:output>
<p>
Let's test our function: #helloWorlde("Ray")#
</p>
</bx:output>
```

I've got a function definition on top, then some HTML that calls it and prints out the result. As you can see though, I screwed up the function name there so an error is going to be thrown. If I fire up BoxLang's MiniServer and run the file, I get:

<p>
<img src="https://static.raymondcamden.com/images/2025/10/debug1.jpg" alt="Error report from BoxLang" class="imgborder imgcenter" loading="lazy">
</p>

Ok, that's fairly clear, and given that our entire application is about ten lines of code, not difficult to correct. But in a real-world application with many files and much more going on, it could be a bit more difficult to track down. The error message is pretty short and doesn't give us much to go on. In production, this is actually safer, as revealing too much information could give attackers information they need to attempt a hack on your application, but locally, it sure would be nice to have more information, right?

Turns out, there's an incredibly easy way to do this. The BoxLang MiniServer takes [multiple different arguments](https://boxlang.ortusbooks.com/getting-started/running-boxlang/miniserver#web-server-args-13) at the command line, one of which, `--debug`, will turn on detailed error information. The docs on this weren't quite clear on that previously, but when I discovered this, I added that information to the reference to make it clear. Here's what happens when you run the same file with that flag enabled:

<p>
<img src="https://static.raymondcamden.com/images/2025/10/debug2.jpg" alt="Detailed Error report from BoxLang" class="imgborder imgcenter" loading="lazy">
</p>

That is *incredibly* more useful, right? To be honest, I can't see ever *not* using that flag when running MiniServer locally, so make it part of your default workflow.

As an aside, of course BoxLang has proper error handling semantics with `try/catch` and more, and in particular, for web applications, you have multiple [error handling](https://boxlang.ortusbooks.com/boxlang-framework/applicationbx#error-handling) routines you can add to your application to have 100% control over what happens when an error is thrown. 

Or do like me - and just write perfect code. (Ahem.)

Anyway, I hope this is useful, and you can check out the video version below:

{% liteyoutube "rsykAFMELoM" %}