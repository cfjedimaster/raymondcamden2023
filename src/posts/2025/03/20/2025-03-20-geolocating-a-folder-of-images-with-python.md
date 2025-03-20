---
layout: post
title: "Geolocating a Folder of Images with Python"
date: "2025-03-20T18:00:00"
categories: ["development"]
tags: ["python"]
banner_image: /images/banners/cat_camera_castles.jpg
permalink: /2025/03/20/geolocating-a-folder-of-images-with-python
description: How to get geographical information on images with Python
---

I'm not sure how useful this will be, but as I recently built it in [another language](https://boxlang.io) (I plan on blogging that soon as well), I thought I'd take a stab at building it in Python. Given a folder of images, can I use Python to grab the Exif information and then using that, figure out where the photos were taken using a reverse geocoding service? Here's what I built.

# First - Get the Images

Ok, the first step is simple, just get a list of images from a directory:

```python
INPUT = "./sources"

files = os.listdir(INPUT)

for file in files:
	print(file)
```

Woot! I'm a Python Master!

## Get the Exif info

For the next step, I knew I needed to get the Exif info. For that I used the [Pillow](https://pypi.org/project/pillow/) library, which has a handy `getexif()` method:

```python
img = PIL.Image.open(os.path.join(INPUT, file))

img_exif = img.getexif()
```

However, this doesn't return what I expected:

```js
{296: 2, 282: 72.0, 256: 4000, 257: 3000, 34853: 754, 34665: 248, 271: 'samsung', 272: 'Galaxy S24 Ultra', 305: 'S928U1UES4AXKF', 274: 1, 306: '2025:01:06 07:35:55', 531: 1, 283: 72.0}
```

From what I can tell, the [`getexif` method](https://pillow.readthedocs.io/en/stable/reference/Image.html#PIL.Image.Exif) returns only a subset of exif information, not *all* the possible tags that may exist. That makes some sense as different hardware/services may write ad hoc exif data. 

I did some Googling and this [StackOverflow answer](https://stackoverflow.com/a/73745613/52160) provided an interesting hack. This code will search for the `GPSInfo` tag and return the numeric value:

```python
GPSINFO_TAG = next(
	tag for tag, name in PIL.ExifTags.TAGS.items() if name == "GPSInfo"
)  # should be 34853
```

You can then combine this to get the right value:

```python
gpsinfo = img_exif.get_ifd(GPSINFO_TAG)
```

Whew. This returns a dictionary that looks like so:

```js
{1: 'N', 2: (47.0, 30.0, 2.952359), 3: 'E', 4: (19.0, 2.0, 42.89964), 5: 0, 6: 143.0}
```

This is the direction and GPS info in degrees and minutes returned in a Python dictionary. To convert the values, I did this:

```python
if len(gpsinfo):
	latitude = f"{gpsinfo[2][0]}°{gpsinfo[2][1]}'{gpsinfo[2][2]}\" {gpsinfo[1]}"        
	longitude = f"{gpsinfo[4][0]}°{gpsinfo[4][1]}'{gpsinfo[4][2]}\" {gpsinfo[3]}"
```

I then needed to convert the longitude and latitude to decimal. For that... I turned to AI. Yep, I cheated. But guess what, it worked? Gemini spit out this function:

```python
def dms_to_dd(dms_str):
	"""Converts a DMS string to decimal degrees.

	Args:
		dms_str: A string representing the angle in DMS format 
				 (e.g., "36°57'9" N", "110°4'21" W").

	Returns:
		The angle in decimal degrees.
	"""

	parts = re.split(r'[^\d\w\.]+', dms_str.strip())
	degrees = float(parts[0])
	minutes = float(parts[1]) if len(parts) > 1 else 0
	seconds = float(parts[2]) if len(parts) > 2 else 0
	direction = parts[3].upper() if len(parts) > 3 else 'E'  # Default to East

	dd = degrees + minutes / 60 + seconds / 3600
	if direction in ('S', 'W'):
		dd *= -1
	return dd
```

As I had recently did something just like this, I was able to eyeball it and confirm it made sense. I will say the comment is slightly off as the input isn't the *full* address, but only one portion. 

## Reverse Geocoding

Now that I had a location, I needed to reverse geocode, which is basically, "Given a location, what the heck is there?" Mapbox has an excellent [free API](https://docs.mapbox.com/api/search/geocoding/) for this, so I built a quick wrapper:

```python
def reverseGeoCode(lon, lat):
	res = requests.get(f"https://api.mapbox.com/search/geocode/v6/reverse?longitude={lon}&latitude={lat}&access_token={MAPBOX_KEY}")
	return res.json()
```

And called it like so:

```python
loc = reverseGeoCode(dms_to_dd(longitude), dms_to_dd(latitude))
```

This returns a *great* deal of information in [GeoJSON](https://geojson.org/) format which I'm familiar with because of my time at [HERE](https://here.com). In my mind, I was imagining printing results for public consumption, so while a heck of a lot of data was returned, I simply wanted a formatted address:

```python
print(loc["features"][1]["properties"]["place_formatted"])
```

You can check the [Mapbox docs](https://docs.mapbox.com/api/search/geocoding/) if you want to see more of the results, but that worked just fine for me. 

## The Results

When I ran it, I got exactly what I expected:

```
20250108_101553.jpg
Bratislava, Bratislava, Slovakia
--------------------------------------------------------------------------------
laf.jpg
Lafayette, Louisiana, United States
--------------------------------------------------------------------------------
20250107_160104.jpg
Győr, Győr-Moson-Sopron, Hungary
--------------------------------------------------------------------------------
20250111_170109.jpg
Grein, Upper Austria, Austria
--------------------------------------------------------------------------------
20250112_154722.jpg
Salzburg, Salzburg, Austria
--------------------------------------------------------------------------------
20250106_073555.jpg
Budapest, Hungary
--------------------------------------------------------------------------------
```

And if you're curious, here is each of those images, in the same order as above. (I edited the `laf.jpg` one to not have my precise address. Sorry. ;) The complete source code for this script will be at the end. 

<p>
<img src="https://static.raymondcamden.com/images/2025/03/20250108_101553.jpg" alt="Bratislava, Bratislava, Slovakia" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/03/laf.png" alt="Lafayette, Louisiana, United States" class="imgborder imgcenter" loading="lazy">
</p>


<p>
<img src="https://static.raymondcamden.com/images/2025/03/20250107_160104.jpg" alt="Győr, Győr-Moson-Sopron, Hungary" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/03/20250111_170109.jpg" alt="Grein, Upper Austria, Austria" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/03/20250112_154722.jpg" alt="Salzburg, Salzburg, Austria" class="imgborder imgcenter" loading="lazy">
</p>

<p>
<img src="https://static.raymondcamden.com/images/2025/03/20250106_073555.jpg" alt="Budapest, Hungary" class="imgborder imgcenter" loading="lazy">
</p>

## The Script

```python
import os 
import PIL.Image 
import PIL.ExifTags
import re 
import requests

MAPBOX_KEY = os.environ.get('MAPBOX_KEY')

def reverseGeoCode(lon, lat):
	res = requests.get(f"https://api.mapbox.com/search/geocode/v6/reverse?longitude={lon}&latitude={lat}&access_token={MAPBOX_KEY}")
	return res.json()

def dms_to_dd(dms_str):
	"""Converts a DMS string to decimal degrees.

	Args:
		dms_str: A string representing the angle in DMS format 
				 (e.g., "36°57'9" N", "110°4'21" W").

	Returns:
		The angle in decimal degrees.
	"""

	parts = re.split(r'[^\d\w\.]+', dms_str.strip())
	degrees = float(parts[0])
	minutes = float(parts[1]) if len(parts) > 1 else 0
	seconds = float(parts[2]) if len(parts) > 2 else 0
	direction = parts[3].upper() if len(parts) > 3 else 'E'  # Default to East

	dd = degrees + minutes / 60 + seconds / 3600
	if direction in ('S', 'W'):
		dd *= -1
	return dd

# Credit: https://stackoverflow.com/a/73745613/52160
GPSINFO_TAG = next(
	tag for tag, name in PIL.ExifTags.TAGS.items() if name == "GPSInfo"
)  # should be 34853

INPUT = "./sources"

files = os.listdir(INPUT)

for file in files:
	print(file)
	img = PIL.Image.open(os.path.join(INPUT, file))

	img_exif = img.getexif()
	
	gpsinfo = img_exif.get_ifd(GPSINFO_TAG)

	if len(gpsinfo):
		latitude = f"{gpsinfo[2][0]}°{gpsinfo[2][1]}'{gpsinfo[2][2]}\" {gpsinfo[1]}"        
		longitude = f"{gpsinfo[4][0]}°{gpsinfo[4][1]}'{gpsinfo[4][2]}\" {gpsinfo[3]}"

		loc = reverseGeoCode(dms_to_dd(longitude), dms_to_dd(latitude))
		print(loc["features"][1]["properties"]["place_formatted"])

	print('-' * 80)
```