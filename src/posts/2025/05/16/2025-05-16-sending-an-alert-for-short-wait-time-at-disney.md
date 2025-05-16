---
layout: post
title: "Sending an Alert for Short Wait Time at Disney"
date: "2025-05-16T18:00:00"
categories: ["development"]
tags: ["python"]
banner_image: /images/banners/cat_disney.jpg
permalink: /2025/05/16/sending-an-alert-for-short-wait-time-at-disney
description: Sending a notification when rides have short wait times.
---

Yesterday I had some fun with a [web app](https://www.raymondcamden.com/2025/05/15/finding-your-next-amusement-park-ride-with-apis) that made use of APIs to report on rides with the shortest wait times at amusement parks. This was done via the excellent, and free, [Queue Times](https://queue-times.com/en-US) service. The application I built let you select a park, and then rides were displayed sorted by the shortest wait time. While working with the API, I also had another idea for a useful service - notifications for short wait times.

Imagine you're at Disney, or any amusement park, and while you're there, you would like to be notified when rides have a short wait time. How could you automate this? For now, let's skip the 'hard part' of imagining the service that would let you sign up for that. You would need a web site, authentication, and so forth. I'd imagine the site would let me select a park and a date range where I'd be visiting. Lastly, I'd also need some kind of threshold for when to be alerted. Maybe the park is so busy, a wait time of 90 minutes or less is ok. Maybe it's ten hundred degrees in Florida and you just want to know about much shorter wait times. 

For my hypothetical service, I'll assume Disney's Hollywood Studios because that's where Star Wars Land lives (sorry, "Galaxy's Edge", I just think "Star Wars Land" sounds more fun.) From the Queue Times API, this is park ID 7. 

For my threshold I'm going to use 20 minutes. 

So given the above, I need a service that gets the rides for Hollywood Studios and filters to rides that are both open and have a wait time of less than or equal to 20 minutes. Let's code!

## The Workflow

Once again, I turned to [Pipedream](https://pipedream.com), and started off with a time based trigger. I went with once every 30 minutes, but honestly, I'd probably go with something closer to 10. Again, this is all part of a hypothetical service I don't have any plans on building. ;)

Next, we need to get rides that match our filters, and for this, I'll use a bit of Python:

```python
import requests 

# This is Disneyland, Holywood Studios
PARK_ID = 7

# This is the wait threshold in minutes
WAIT_THRESHOLD = 20

def handler(pd: "pipedream"):
  ridesReady = []
  res = requests.get(f"https://queue-times.com/parks/{PARK_ID}/queue_times.json")
  data = res.json()
  for land in data["lands"]:
    for ride in land["rides"]:
      if ride["is_open"] is True and ride["wait_time"] <= WAIT_THRESHOLD:
        ridesReady.append({"name":ride["name"], "waitTime":ride["wait_time"]})

  if len(ridesReady) == 0:
    return pd.flow.exit("No available rides.")

  return ridesReady
```

My code gets just the name and the wait time for the ride, but I could have included 'land' as well as that may impact your decision. If you are in Galaxy's Edge and a ride is available outside that land, you may defer to something else with a longer wait time just to save you from walking. 

Next, I need to turn that result into a nice string for the notification. Once again, I used a bit of Python:

```python
def handler(pd: "pipedream"):
  text = "Ride Alert! These rides all have a short wait time:\n\n"
  for ride in pd.steps["getWaitTimes"]["$return_value"]:
    text += f"{ride['name']} ({ride['waitTime']} minutes)\n"

  return text
```

As a reminder, the API returns 'attractions', not rides, but I'm ok with just calling them rides. 

Now for the last bit - the notification. This can really be anything you want, and heck, you could even support multiple types of notifications. My initial idea was to make use of Twilio and send a SMS, but due to recent changes on their platform, you can't do this in trial mode anymore. I considered email, which would be simple with Pipedream. In the end, I decided to use [Pushbullet](https://www.pushbullet.com/), which amongst other features lets you use an API to send a notification to your mobile phone... if the device has the Pushbullet app. In the "real world" that wouldn't be something you would ask random users to do, but for my own personal testing, it was fine. And - Pipedream literally had this done already as an action I could add. I added to my workflow, authenticated with Pushbullet, and then just selected my registered devide. I then specified 'note' as the push type, gave it a title, and used the result of the previous instruction. 

<p>
<img src="https://static.raymondcamden.com/images/2025/05/alert1.jpg" alt="Pipedream configuration for push" class="imgborder imgcenter" loading="lazy">
</p>

Here's the entire workflow in context:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/alert2.jpg" alt="Pipedream workflow" class="imgborder imgcenter" loading="lazy">
</p>

If that seems pretty simple, it's because it is. I've been saying for years that Pipedream is aweesome for stuff like this.

For my first test, I got this notification in the app:

<p>
<img src="https://static.raymondcamden.com/images/2025/05/alert3.jpg" alt="Pushbutton alert" class="imgborder imgcenter" loading="lazy">
</p>

It isn't terribly obvious, but if you click, it expands in the app for the complete list of rides, which was rather long when I tested earlier this morning. No big surprise there, as the day goes on the wait times will get longer and longer. 

If you want, you can see the complete workflow in my [GitHub repo](https://github.com/cfjedimaster/General-Pipedream-Stuff/tree/production/disney-alert-p_G6CJGV6), and obviously, this workflow could be done in other systems as well. Let me know what you think!
