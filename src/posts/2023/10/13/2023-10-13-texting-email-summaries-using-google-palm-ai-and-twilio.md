---
layout: post
title: "Texting Email Summaries using Google PaLM AI and Twilio"
date: "2023-10-13T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/catai2.jpg
permalink: /2023/10/13/texting-email-summaries-using-google-palm-ai-and-twilio
description: Using Google's PaLM AI API and Twilio to text summaries of email.
---

Yesterday I [shared](https://www.raymondcamden.com/2023/10/12/a-look-at-googles-palm-api) my initial impressions of working with Google's [PaLM 2](https://ai.google/discover/palm2/) AI API. If you didn't read that article, the tldr is that it's incredibly easy to work with and I was able to get some Node.js code running in minutes. Exactly the kind of experience you want new developers to have with your product. Based on how easy it was to do that, I thought about building a real prototype of how the service could be used. 

## What It Does

My simple prototype is based on the idea of handling an influx of emails. Imagine a support address or other important email address used for a company. If there is a lot of email coming in, or if the emails that do come in are critically important, it could be useful to let certain people know as soon as possible. In that notification, it would be even more helpful if a summary of the email was included. This is where generative AI can help.

## The Workflow

For my workflow, I decided to use [Pipedream](https://pipedream.com). One of the triggers it has is email based so I went with that. This gives a unique email address that will kick off a process whenever a new email is received. Now, for my demo, that was fine, but I'd imagine in a "real world" scenario, you would use a real email account and Pipedream has triggers for that. Here's that step:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/pd1.png" alt="Email trigger" class="imgborder imgcenter" loading="lazy">
</p>

Next, I needed to write code that would hit Google's PaLM API. As I shared [yesterday](https://www.raymondcamden.com/2023/10/12/a-look-at-googles-palm-api), their API is fairly simple. But I didn't even have to do that as Pipedream already supports actions to work with their API. I literally just configured my access (which is just an API key) and then created my trigger. Remember that the workflow is fired off by getting a new email, so my prompt asks PaLM to summarize it:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/pd2.png" alt="Calling the PaLM API by asking it to summarize the email" class="imgborder imgcenter" loading="lazy">
</p>

Note that my prompt is a combination of static text and content from the trigger: 

```
{% raw %}Summarize the following email in two to three sentences: {{steps.trigger.event.body.text}}{% endraw %}
```

Next, I added a Node.js code step whose purpose is to take the result of the PaLM API call and craft a message that will be texted. For this, I include the email subject, the sender, and the result of the API called:

```js
export default defineComponent({
  async run({ steps, $ }) {
    return `Summary of email "${steps.trigger.event.headers.subject}" from ${steps.trigger.event.headers.from.text}:

${steps.generate_text.$return_value[0].candidates[0].output}    
`
  },
})
```

Finally, I added a Twilio step. I hadn't used my Twilio account in a while so I needed to log back in and update my password and such, but since Pipedream had a step for that, all I needed to do was tell the number Twilio gave me as a sender and then include my phone number. The final bit was the message body which used the result from the previous step. 

<p>
<img src="https://static.raymondcamden.com/images/2023/10/pd3.png" alt="Configured Twilio step" class="imgborder imgcenter" loading="lazy">
</p>

## The Results

I tested it with an email I got from Disney recently. Here's the complete text:

```
We wanted to let you know that the price of your subscription will change to 
$139.99 per year on November 12, 2023. Your payment method on file will be 
charged unless you cancel before then. You'll continue to enjoy 12 months 
for the price of 10.*

Explore plan options to find the one that best fits your needs. For more 
information on managing your subscription, including how to update your 
payment or change your plan, go to Account Settings or visit this FAQ for
instructions on how to cancel your subscription.

Thank you for being a loyal fan and continuing to be the best part of 
our story. We're working hard to elevate your streaming experience, and
are excited to continue bringing you the movies, series, and exclusive 
Originals you love.

We're always here to help. For any questions visit our Help Center.

The Disney+ Team
```

I forwarded this to the email address Pipedream assigned to my workflow and pretty quickly I got a response:

```
Sent from your Twilio trial account - Summary of email "Price Increase" 
from Raymond Camden <raymondcamden@gmail.com>:

The price of your subscription will increase to $139.99 per year on November
12, 2023. You can cancel your subscription before then or update your plan.
```

Notice that the 'from' in this case is me as I forwarded it, but in a real use of this workflow, it would be the original sender. I don't know about you, but that seems like a *great* summary. 

As another test, I forwarded the 'robo' mail American Airlines sent me last week when it got scared of a little cloud and wanted to cancel my flights. Here's the original text:

```
Severe weather, which may impact the Dallas-Fort Worth (DFW) area, could 
affect your upcoming travel with American Airlines. At this time, there 
is no change in your flight plans. However, to better accommodate 
customers, American is offering additional flexibility that may allow 
you to adjust your travel plans without a fee.


Visit aa.com/travelalerts for details. You can change your flights on 
aa.com by retrieving your reservation. If you booked your flight through
a travel agency or website other than aa.com, a representative from 
that company will be able to assist you with changes.
```

And here's the texted summary:

```
Sent from your Twilio trial account - Summary of email "Fwd: 
Severe weather conditions may affect your upcoming travel plans" 
from Raymond Camden <raymondcamden@gmail.com>:

American Airlines sent an email to inform me that there is severe 
weather in Dallas-Fort Worth area, which may affect my upcoming 
flight. They are offering additional flexibility to adjust my 
travel plans without a fee.
```

All in all, this took me maybe thirty minutes to build, most of which was going through the steps to 'resurrect' my Twilio account and finding good test emails. You can find the source for the Pipedream workflow here: <https://github.com/cfjedimaster/General-Pipedream-AI-Stuff/tree/production/test1-p_BjCl83z> Let me know what you think!