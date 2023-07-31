---
layout: post
title: "Update for My Subscribers"
date: "2023-07-31T18:00:00"
categories: ["misc"]
tags: ["misc"]
banner_image: /images/banners/mail.jpg
permalink: /2023/07/31/update-for-my-subscribers
description: Just a quick note for folks who've subscribed to my newsletter.
---

Hey folks, forgive the quick note. Today I migrated my newsletter from Mailchimp to [Buttondown](https://buttondown.email/refer/raymond). As I mentioned here before, I had hit the free tier limit on Mailchimp and while I truly liked their service, this site doesn't really bring in any money so I wanted a cheaper solution. Buttondown looked good and affordable, and even better, it had a heck of a lot of support for migrating from Mailchimp. I took the plunge today and did the migration. That involved:

* Exporting the list from Mailchimp (and turning off the RSS campaign)
* Importing into Buttondown
* Pointing Buttondown at my RSS (more on that in a sec)
* Updating my Netlify serverless function to hit Buttondown's API for subscriptions

And that's basically it. In theory - everyone subscribed should get a notification about this post. In theory. The email will look a bit different and I'll probably tweak it over time. The biggest change is that I've moved from sending the *entire* blog post in an email to just the excerpt. Normally if I were you, I'd look at that as a slimy way to get page views. But I've noticed, and I've had people reach out, that my posts don't necessarily render well in email, so I figure this is a good change. 

To be clear, this site still points to a "full" RSS feed here, <https://www.raymondcamden.com/feed.xml>, so folks using feed readers still get everything. This new feed is *just* for the subscription service and if you're curious, you can see it here: <https://www.raymondcamden.com/feed_slim.xml>

If you've never subscribed, you can do so [here](/subscribe/) and you'll get one email per new post. I *may* start doing more emails now that I've got a bit more bandwidth. I'll also use this opportunity to say I'd love to get a sponsor for this site. [Buttondown](https://buttondown.email/refer/raymond) is cheap (and I get a bonus if you signup via that link) but I'd still appreciate the support!

p.s. As a final request, if you *do* get the email, could you send me a quick note just so I know yall got it? Please and thank you! 