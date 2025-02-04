---
layout: post
title: "Automating Image Improvement with Cloudinary"
date: "2025-02-04T18:00:00"
categories: ["development"]
tags: ["python", "cloudinary"]
banner_image: /images/banners/cat_photo_lab.jpg
permalink: /2025/02/04/automating-image-improvement-with-cloudinary
description: Using Pipedream and Cloudinary to automate image processing.
---

Earlier this year, no, wait, last year (time is kinda crazy), I wrote up the process of automating background removal using Adobe's Firefly Services. This [post](https://www.raymondcamden.com/2024/08/08/automating-background-removal-with-firefly-services) described a [Pipedream](https://pipedream.com) workflow that monitored a Dropbox folder and...

* On a new file detected, generated a readable link
* Passed it the Lightroom API to improve it
* Downloaded it to another Dropbox folder

Today, I'm going to look at a similar workflow using [Cloudinary](https://cloudinary.com). Unfortunately, Adobe's Firefly Services still have no kind of free trial so it's difficult for developers to test it out. Everything I'm showing today however can be done with a [free Cloudinary account](https://cloudinary.com/users/register_free) (and Pipedream as well). Let's take a look at what I built. 

## Step One - The Trigger

The workflow begins with a Dropbox trigger, one of the many built into Pipedream. The trigger, "New File from Dropbox", lets you specify a folder which I set to `/ImproveImageProcess`. I set recursive to true as I'm really wanting to work in the `input` folder, and you can only specify a top level folder in the trigger. Finally, I set `Include Link` to true so I could work with the new file. 

## Step Two - Check the Path

As mentioned above, the Dropbox trigger can only watch a top level folder. Therefore, I need to ensure my code only runs when it's found a file in input, or conversely, don't run if in the output folder. Here's the Python I used:

```python
def handler(pd: "pipedream"):

  if "/output" in pd.steps["trigger"]["event"]["path_lower"]:
    pd.flow.exit("Not doing output processing")
```

Note the string passed to `exit`, this lets me look at the execution history in Pipedream and see why the flow ended early.

## Step Three - Upload to Cloudinary

The next step is a built in one for Pipedream that uploads content to a connected Cloudinary account. I literally had to specify the file path or URL, and for this, I used the data from the trigger, namely: `{% raw %}{{steps.trigger.event.link}}{% endraw %}`. If you remember, I told the Dropbox trigger to include a link to the file, and that's where this value comes from.

## Step Four - Transform the Image

The next step, surprise surprise, is also a built in Pipedream action, the image transformation. This requires an input named the public ID which just references the previous step: `{% raw %}{{steps.upload_media_asset.$return_value.public_id}}{% endraw %}`.

The next part is a bit more complex. I need to specify the options to pass to Cloudinary, which means checking the [docs](https://cloudinary.com/documentation/image_transformations) and determining the key/value pairs to use. For me, it came down to two:

* `effect: improve` - this is the general "make it better" enhancement I discussed in my [earlier blog post](https://www.raymondcamden.com/2025/01/27/testing-cloudinary-image-enhancements)
* `width: 650` - this resizes the image to fit within 650 pixels. 

Here's a screenshot of how this looks within Pipedream:

<p>
<img src="https://static.raymondcamden.com/images/2025/02/cloud1.jpg" alt="Configured Cloudinary step " class="imgborder imgcenter" loading="lazy">
</p>

## Step Five - Get and Download the URL

The result of the previous step is an HTML string that looks like this:

```html
<img src='https://res.cloudinary.com/raymondcamden/image/upload/e_improve,w_650/vcavwxws8kgtkxesbxpf?_a=BAMCkGcc0' width='650'/>
```

Now, this is a something the Pipedream step does that could be better (and I need to file a bug report). The Cloudinary SDK when creating transformations can either return the HTML to render the result, *or* just the URL. I think in this case the step should be returning just the URL, but, we can use a bit of Python to get it, and download it locally.

```python
import re 
import requests 

def handler(pd: "pipedream"):
  pattern = r"https://res.cloudinary.com/raymondcamden/image/upload/e_improve,w_650/[^']+"
  match = re.search(pattern, pd.steps["image_transformation"]["$return_value"])
  url = match[0]

  r = requests.get(url)
 
  open(f'/tmp/{pd.steps["trigger"]["event"]["name"]}', 'wb').write(r.content)
```

I'm not 100% happy with that regular expression as it's tied to the transformations and a bit brittle, but I can live with it for now. 

## Step Six - Upload to Dropbox

The final step simply takes the local file and uploads it to Dropbox, again using a built in Pipedream provided action. The path points to our output, `/ImproveImageProcess/output`, the filename comes from the triggering event, `{% raw %}{{steps.trigger.event.name}}{% endraw %}`, and the file path points to what we used above: `{% raw %}/tmp/{{steps.trigger.event.name}}{% endraw %}`. The last setting was to use `overwrite` for Mode, but you may not want to overwrite result images. 

When I tested, I once again used my Moon picture. You can see the input here:

<p>
<img src="https://static.raymondcamden.com/images/2025/02/cloud2.jpg" alt="Screenshot from Dropbox folder showing original moon picture." class="imgborder imgcenter" loading="lazy">
</p>

And here's the resulting image, improved, and smaller in size (both dimensions and filesize):

<p>
<img src="https://static.raymondcamden.com/images/2025/02/cloud3.jpg" alt="Screenshot from Dropbox folder showing improved moon picture." class="imgborder imgcenter" loading="lazy">
</p>

And that's it! You can find the complete Pipedream workflow here: <https://github.com/cfjedimaster/General-Pipedream-Stuff/tree/production/remove-backgrounds-at-scale-cloudinary-p_ljCJZoG> What impresses me the most is, of my six steps in the workflow, a grand total of two involved actual code. 