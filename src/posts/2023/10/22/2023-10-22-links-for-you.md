---
layout: post
title: "Links For You"
date: "2023-10-22T18:00:00"
categories: ["misc"]
tags: ["links4you"]
banner_image: /images/banners/links.jpg
permalink: /2023/10/22/links-for-you
description: Happy links make you happy!
---

Hello friends and welcome to another post of links I hope you find interesting. In a few days, I'll be heading out to [API World](https://apiworld.co/) for my last trip of the year and my last in-person event. (I'll be giving the same talk for API World again later this month in their virtual event.) I just got back from [All Things Open](https://2023.allthingsopen.org/) which was an *incredible* conference that I'm happy I was able to participate in, and I'd absolutely recommend it for next year. Let's get to the links!

## ScraperAPI

The first thing I want to share is a cool service called [ScraperAPI](https://www.scraperapi.com/). As you can guess, it's a web scraping API that goes through the trouble of obfuscating your request to prevent sites from blocking your calls. I'm of two minds when it comes to services like this. I can get why people may want to block code from reading the HTML on their site, but at the same time, if you put something on a public web address, you have to expect people to want to, you know, actually *read* the content, automated or not. Obviously, you should automate web scraping with care, but I think it's a fair and completely reasonable thing to do.

ScraperAPI has an *incredibly* simple API with the basic version being as easy as this:

```
https://api.scraperapi.com/?api_key=APIKEY&url=http://httpbin.org/ip
```

Now by itself, this is pretty handy. As I said, they handle masking the fact that it's a bot automatically. They also make it easy to change the country your request appears to be from as well as pretending to be a mobile device. You can see a lot more on their page about [customizing requests](https://docs.scraperapi.com/v/nodejs/making-requests/customizing-requests). 

What I thought was really cool though was their endpoints for [structured data collection](https://docs.scraperapi.com/v/nodejs/making-requests/structured-data-collection-method), basically special wrappers for Amazon products, Amazon search, and Google search.

So for example, this endpoint (with a real key), will search the American Amazon store for Star Wars:

```
https://api.scraperapi.com/structured/amazon/search?api_key=KEY&query=Star+Wars&country=amazon.com
```

The result is a JSON array of products with pagination support. As an example, here are two results:

```json
 {
    "type": "search_product",
    "position": 1,
    "asin": "B000N0YN4Q",
    "name": "STAR WARS Lightsaber Forge Inquisitor Masterworks Set Double-Bladed Electronic Lightsaber, Customizable Roleplay Toy for Kids Ages 4 and Up (F3807)",
    "image": "https://m.media-amazon.com/images/I/61YMlpJPe1L.jpg",
    "has_prime": true,
    "is_best_seller": false,
    "is_amazon_choice": false,
    "is_limited_deal": false,
    "stars": 4.5,
    "total_reviews": 240,
    "url": "https://www.amazon.com/STAR-WARS-Double-Bladed-Customizable-F3807/dp/B000N0YN4Q/ref=sr_1_1?keywords=Star+Wars&qid=1697984220&sr=8-1",
    "availability_quantity": null,
    "spec": {},
    "price_string": "$20.69",
    "price_symbol": "$",
    "price": 20.69,
    "original_price": {
        "price_string": "$66.99",
        "price_symbol": "$",
        "price": 66.99
    }
},
{
    "type": "search_product",
    "position": 2,
    "asin": "B00VF06OBS",
    "name": "Star Wars: A New Hope",
    "image": "https://m.media-amazon.com/images/I/91MMkv35K5L.jpg",
    "has_prime": false,
    "is_best_seller": false,
    "is_amazon_choice": false,
    "is_limited_deal": false,
    "stars": 4.7,
    "total_reviews": 11255,
    "url": "https://www.amazon.com/Star-Wars-Hope-Mark-Hamill/dp/B00VF06OBS/ref=sr_1_2?keywords=Star+Wars&qid=1697984220&sr=8-2",
    "availability_quantity": null,
    "spec": {},
    "price_string": "$3.79",
    "price_symbol": "$",
    "price": 3.79
},
```

All in all, a pretty impressive little service. You can check their [pricing information](https://www.scraperapi.com/pricing/) on what it costs, and they *do* have a decent free tier. If you like what you see and want to sign up, please use this URL: <https://www.scraperapi.com/?via=raymond49> I get a small commission on each sign up which will let me go buy those Star Wars items the API returned. ;)

## Bullet Chatting

A few weeks ago I was chatting with my buddy [Todd Sharp](https://recursive.codes/) when he introduced me to something I had never heard of before, Danmaku, or "bullet curtain" subtitling. This is a form of subtitles popular in Japan and China where messages are displayed in an animated way, appearing briefly before disappearing. I *believe* the norm for this is that the comments 'fly in' and out of the screen. Yeah, I know that sounds kind of vague. I tried to find a good example of this but struggled. Here's one that is nice and short though:

<iframe width="560" height="315" src="https://www.youtube.com/embed/vhko_K9ehbc?si=fiTUGKeUsr--IOs0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="display: block; margin: auto;margin-bottom:10px"></iframe>

Honestly, I think this would drive me crazy, but I'm old. Anyway, the point of all of this is that this particular style of chat is popular enough that the W3C has actually created a proposed spec for it: [Bullet Chatting Proposal](https://w3c.github.io/danmaku/) Within that spec you can look at use cases as well as a proposed API. 

## Stunning Well Done Visualization for a Technical Post

I'm intentionally not starting off this section with the *nature* of the blog post because I absolutely, positively, want you to visit this page, no matter what your current knowledge of the topic is. That's because this post by [Josh Comeau](https://www.joshwcomeau.com/) is an *incredibly* well-done post: [Understanding the JavaScript Modulo Operator](https://www.joshwcomeau.com/javascript/modulo-operator/). I honestly almost didn't click on this when it came across me as I already knew what the modulo operator did, but then I realized it probably wouldn't hurt to check it out. I'm so happy I did. Josh's visualizations of the concepts in this post as some of the best that I've ever seen. Normally when I'm demonstrating something I'll just embed a CodePen, but Josh actually built embedded testing tools with simple illustrations and elegantly done animations. Seriously, I don't care how well you know the topic, check out the post and see for yourself. 
