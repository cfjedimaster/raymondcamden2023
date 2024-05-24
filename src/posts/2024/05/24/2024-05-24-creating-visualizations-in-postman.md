---
layout: post
title: "Creating Visualizations in Postman"
date: "2024-05-24T18:00:00"
categories: ["development"]
tags: ["postman"]
banner_image: /images/banners/cat_laptop2.jpg
permalink: /2024/05/24/creating-visualizations-in-postman
description: Another look at a cool Postman feature, visualizations.
---

Earlier this week, I [blogged](https://www.raymondcamden.com/2024/05/22/dynamically-creating-variables-in-postman) about a cool [Postman](https://www.postman.com/) feature where you could use scripting to take the result of one API call and use it as a variable that is then used by a *second* call. For APIs that first require you to exchange credentials for an access token, this is a super useful way to make that process easier. Today I'm following up on that with another useful application of scripting - visualizations. Once again, I've got my coworker [Ben](https://www.benvanderberg.com/) to thank for showing me this. Let me show you an example.

When working with [Firefly Services](https://developer.adobe.com/firefly-services/docs/guides/) and the text to image API, you get a nice JSON response back containing information about the results as well as links to your images. Here's an example where I used the prompt, "Cats writing enterprise software demos.":

```json
{
    "version": "2.10.3",
    "size": {
        "width": 2048,
        "height": 2048
    },
    "predictedPhotoSettings": {
        "aperture": 6.3,
        "shutterSpeed": 0.0005,
        "fieldOfView": 50
    },
    "outputs": [
        {
            "seed": 1336901054,
            "image": {
                "id": "6f8c3bdd-0fdd-4818-91e5-aee0a9d86ef3",
                "presignedUrl": "https://pre-signed-firefly-prod.s3.amazonaws.com/images/6f8c3bdd-0fdd-4818-91e5-aee0a9d86ef3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIARDA3TX66CSNORXF4%2F20240524%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20240524T152441Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=90557979a1bbcadf338bd80ca884ffb1d39e633f702b861668725ceb2af435c4"
            }
        },
        {
            "seed": 1576319647,
            "image": {
                "id": "9a337feb-dc83-4cb4-8e61-dbd4a3f52911",
                "presignedUrl": "https://pre-signed-firefly-prod.s3.amazonaws.com/images/9a337feb-dc83-4cb4-8e61-dbd4a3f52911?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIARDA3TX66CSNORXF4%2F20240524%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20240524T152441Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=a53ddae53b4815f015275f893211fd562b78bbc09663d4bfbdf32e29a2bec007"
            }
        }
    ]
}
```

In Postman, I can ctrl click (or CMD click on Mac) to open those results in my browser. Easy peasy. However, Postman supports a "Visualize" tab where you can craft your own visualizations of the data. Here's an example of a script that does that:

```js
const template = `
{% raw %}{{#each response.outputs}}
<p>
<h3>Result {{seed}}</h3>
<img src="{{image.presignedUrl}}" style="max-width:500px;max-height:500px">
</p>
{{/each}}
{% endraw %}`;

pm.visualizer.set(template, { response: pm.response.json() });
```

I've got a string on top for layout, and in case you don't recognize it, that's [Handlebars](https://handlebarsjs.com/), an HTML templating language that Postman supports. I simply pass the template and my JSON response and... that's it. I get this nice output:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/pm3.jpg" alt="Sample result" class="imgborder imgcenter" loading="lazy">
</p>

Both images are there, but the second one is beneath the fold in the app. You'll notice I'm using a bit of CSS to shrink the images, and obviously if I wanted to, I could have made them smaller. I could have laid them out left to right instead of vertically. I just whipped up something quick and simple. But the nice thing is, I can see the results without having to leave Postman.

Also, make note of this:

<p>
<img src="https://static.raymondcamden.com/images/2024/05/pm4.jpg" alt="Sample result with red arrow pointing to refresh" class="imgborder imgcenter" loading="lazy">
</p>

That little icon there lets you reload the visualization, which means you can make changes to your script and template and test without making another API call. 

While this is a great way to render out results from an API that generates images, there are other good uses for the feature as well. The [Pirate Weather API](https://pirateweather.net/en/latest/) is a great free weather API. This call, `https://api.pirateweather.net/forecast/{{pirateweather}}/30.216,-92.033?exclude=minutely,hourly,currently`, returns a weather forecast for my area. (The `{% raw %}{{pirateweather}}{% endraw %}` part is replaced with my API key in Postman.) 

The API returns a *ton* of data, even with me specifically excluding parts. Here's the result for that call:

```json
{
    "latitude": 30.216,
    "longitude": -92.033,
    "timezone": "America/Chicago",
    "offset": -5.0,
    "elevation": 46,
    "daily": {
        "summary": "Partly Cloudy",
        "icon": "partly-cloudy-day",
        "data": [
            {
                "time": 1716526800,
                "icon": "clear-day",
                "summary": "Clear",
                "sunriseTime": 1716548976,
                "sunsetTime": 1716598848,
                "moonPhase": 0.53,
                "precipIntensity": 0.0,
                "precipIntensityMax": 0.0,
                "precipIntensityMaxTime": 1716548400,
                "precipProbability": 0.0,
                "precipAccumulation": 0.0,
                "precipType": "none",
                "temperatureHigh": 89.11,
                "temperatureHighTime": 1716580800,
                "temperatureLow": 77.63,
                "temperatureLowTime": 1716616800,
                "apparentTemperatureHigh": 99.12,
                "apparentTemperatureHighTime": 1716577200,
                "apparentTemperatureLow": 77.41,
                "apparentTemperatureLowTime": 1716544800,
                "dewPoint": 75.43,
                "humidity": 0.81,
                "pressure": 1009.05,
                "windSpeed": 8.97,
                "windGust": 18.09,
                "windGustTime": 1716577200,
                "windBearing": 179.17,
                "cloudCover": 0.34,
                "uvIndex": 8.65,
                "uvIndexTime": 1716577200,
                "visibility": 9.35,
                "temperatureMin": 76.96,
                "temperatureMinTime": 1716548400,
                "temperatureMax": 89.11,
                "temperatureMaxTime": 1716580800,
                "apparentTemperatureMin": 76.96,
                "apparentTemperatureMinTime": 1716548400,
                "apparentTemperatureMax": 99.12,
                "apparentTemperatureMaxTime": 1716577200
            },
            {
                "time": 1716613200,
                "icon": "partly-cloudy-day",
                "summary": "Partly Cloudy",
                "sunriseTime": 1716635352,
                "sunsetTime": 1716685284,
                "moonPhase": 0.57,
                "precipIntensity": 0.0,
                "precipIntensityMax": 0.0,
                "precipIntensityMaxTime": 1716613200,
                "precipProbability": 0.0,
                "precipAccumulation": 0.0,
                "precipType": "none",
                "temperatureHigh": 90.23,
                "temperatureHighTime": 1716667200,
                "temperatureLow": 75.15,
                "temperatureLowTime": 1716714000,
                "apparentTemperatureHigh": 100.69,
                "apparentTemperatureHighTime": 1716663600,
                "apparentTemperatureLow": 77.29,
                "apparentTemperatureLowTime": 1716634800,
                "dewPoint": 75.36,
                "humidity": 0.8,
                "pressure": 1009.95,
                "windSpeed": 7.44,
                "windGust": 15.32,
                "windGustTime": 1716670800,
                "windBearing": 178.7,
                "cloudCover": 0.42,
                "uvIndex": 8.67,
                "uvIndexTime": 1716663600,
                "visibility": 9.02,
                "temperatureMin": 77.29,
                "temperatureMinTime": 1716634800,
                "temperatureMax": 90.23,
                "temperatureMaxTime": 1716667200,
                "apparentTemperatureMin": 77.29,
                "apparentTemperatureMinTime": 1716634800,
                "apparentTemperatureMax": 100.69,
                "apparentTemperatureMaxTime": 1716663600
            },
            {
                "time": 1716699600,
                "icon": "partly-cloudy-day",
                "summary": "Partly Cloudy",
                "sunriseTime": 1716721730,
                "sunsetTime": 1716771719,
                "moonPhase": 0.6,
                "precipIntensity": 0.0,
                "precipIntensityMax": 0.0,
                "precipIntensityMaxTime": 1716728400,
                "precipProbability": 0.0,
                "precipAccumulation": 0.0,
                "precipType": "none",
                "temperatureHigh": 88.85,
                "temperatureHighTime": 1716753600,
                "temperatureLow": 79.28,
                "temperatureLowTime": 1716793200,
                "apparentTemperatureHigh": 98.69,
                "apparentTemperatureHighTime": 1716750000,
                "apparentTemperatureLow": 74.33,
                "apparentTemperatureLowTime": 1716717600,
                "dewPoint": 74.87,
                "humidity": 0.81,
                "pressure": 1009.44,
                "windSpeed": 11.02,
                "windGust": 21.01,
                "windGustTime": 1716750000,
                "windBearing": 176.12,
                "cloudCover": 0.39,
                "uvIndex": 8.66,
                "uvIndexTime": 1716750000,
                "visibility": 8.14,
                "temperatureMin": 75.15,
                "temperatureMinTime": 1716714000,
                "temperatureMax": 88.85,
                "temperatureMaxTime": 1716753600,
                "apparentTemperatureMin": 75.15,
                "apparentTemperatureMinTime": 1716714000,
                "apparentTemperatureMax": 98.69,
                "apparentTemperatureMaxTime": 1716750000
            },
            {
                "time": 1716786000,
                "icon": "partly-cloudy-day",
                "summary": "Partly Cloudy",
                "sunriseTime": 1716808109,
                "sunsetTime": 1716858153,
                "moonPhase": 0.63,
                "precipIntensity": 0.0,
                "precipIntensityMax": 0.0,
                "precipIntensityMaxTime": 1716786000,
                "precipProbability": 0.14,
                "precipAccumulation": 0.0,
                "precipType": "rain",
                "temperatureHigh": 90.81,
                "temperatureHighTime": 1716840000,
                "temperatureLow": 75.56,
                "temperatureLowTime": 1716883200,
                "apparentTemperatureHigh": 103.13,
                "apparentTemperatureHighTime": 1716836400,
                "apparentTemperatureLow": 73.34,
                "apparentTemperatureLowTime": 1716800400,
                "dewPoint": 75.65,
                "humidity": 0.79,
                "pressure": 1010.34,
                "windSpeed": 6.62,
                "windGust": 13.67,
                "windGustTime": 1716786000,
                "windBearing": 188.04,
                "cloudCover": 0.42,
                "uvIndex": 8.67,
                "uvIndexTime": 1716836400,
                "visibility": 9.9,
                "temperatureMin": 78.95,
                "temperatureMinTime": 1716868800,
                "temperatureMax": 90.81,
                "temperatureMaxTime": 1716840000,
                "apparentTemperatureMin": 78.95,
                "apparentTemperatureMinTime": 1716868800,
                "apparentTemperatureMax": 103.13,
                "apparentTemperatureMaxTime": 1716836400
            },
            {
                "time": 1716872400,
                "icon": "partly-cloudy-day",
                "summary": "Partly Cloudy",
                "sunriseTime": 1716894490,
                "sunsetTime": 1716944587,
                "moonPhase": 0.67,
                "precipIntensity": 0.0,
                "precipIntensityMax": 0.0,
                "precipIntensityMaxTime": 1716872400,
                "precipProbability": 0.22,
                "precipAccumulation": 0.0,
                "precipType": "rain",
                "temperatureHigh": 90.44,
                "temperatureHighTime": 1716922800,
                "temperatureLow": 70.85,
                "temperatureLowTime": 1716973200,
                "apparentTemperatureHigh": 100.62,
                "apparentTemperatureHighTime": 1716922800,
                "apparentTemperatureLow": 74.34,
                "apparentTemperatureLowTime": 1716894000,
                "dewPoint": 73.67,
                "humidity": 0.76,
                "pressure": 1013.47,
                "windSpeed": 3.86,
                "windGust": 9.38,
                "windGustTime": 1716922800,
                "windBearing": 115.8,
                "cloudCover": 0.39,
                "uvIndex": 8.59,
                "uvIndexTime": 1716922800,
                "visibility": 10.0,
                "temperatureMin": 75.56,
                "temperatureMinTime": 1716883200,
                "temperatureMax": 90.44,
                "temperatureMaxTime": 1716922800,
                "apparentTemperatureMin": 75.56,
                "apparentTemperatureMinTime": 1716883200,
                "apparentTemperatureMax": 100.62,
                "apparentTemperatureMaxTime": 1716922800
            },
            {
                "time": 1716958800,
                "icon": "partly-cloudy-day",
                "summary": "Partly Cloudy",
                "sunriseTime": 1716980872,
                "sunsetTime": 1717031021,
                "moonPhase": 0.7,
                "precipIntensity": 0.0157,
                "precipIntensityMax": 0.0708,
                "precipIntensityMaxTime": 1716958800,
                "precipProbability": 0.19,
                "precipAccumulation": 0.3758,
                "precipType": "rain",
                "temperatureHigh": 88.64,
                "temperatureHighTime": 1717012800,
                "temperatureLow": 71.5,
                "temperatureLowTime": 1717063200,
                "apparentTemperatureHigh": 93.01,
                "apparentTemperatureHighTime": 1717009200,
                "apparentTemperatureLow": 73.94,
                "apparentTemperatureLowTime": 1716969600,
                "dewPoint": 70.68,
                "humidity": 0.76,
                "pressure": 1015.88,
                "windSpeed": 4.51,
                "windGust": 10.26,
                "windGustTime": 1717009200,
                "windBearing": 104.64,
                "cloudCover": 0.39,
                "uvIndex": 7.05,
                "uvIndexTime": 1717005600,
                "visibility": 8.67,
                "temperatureMin": 70.85,
                "temperatureMinTime": 1716973200,
                "temperatureMax": 88.64,
                "temperatureMaxTime": 1717012800,
                "apparentTemperatureMin": 70.85,
                "apparentTemperatureMinTime": 1716973200,
                "apparentTemperatureMax": 93.01,
                "apparentTemperatureMaxTime": 1717009200
            },
            {
                "time": 1717045200,
                "icon": "partly-cloudy-day",
                "summary": "Partly Cloudy",
                "sunriseTime": 1717067256,
                "sunsetTime": 1717117454,
                "moonPhase": 0.74,
                "precipIntensity": 0.0,
                "precipIntensityMax": 0.0,
                "precipIntensityMaxTime": 1717066800,
                "precipProbability": 0.13,
                "precipAccumulation": 0.0,
                "precipType": "rain",
                "temperatureHigh": 87.11,
                "temperatureHighTime": 1717099200,
                "temperatureLow": 71.89,
                "temperatureLowTime": 1717146000,
                "apparentTemperatureHigh": 90.42,
                "apparentTemperatureHighTime": 1717099200,
                "apparentTemperatureLow": 70.55,
                "apparentTemperatureLowTime": 1717066800,
                "dewPoint": 68.55,
                "humidity": 0.73,
                "pressure": 1015.01,
                "windSpeed": 4.72,
                "windGust": 10.78,
                "windGustTime": 1717099200,
                "windBearing": 113.73,
                "cloudCover": 0.4,
                "uvIndex": 5.79,
                "uvIndexTime": 1717092000,
                "visibility": 8.45,
                "temperatureMin": 70.83,
                "temperatureMinTime": 1717066800,
                "temperatureMax": 87.11,
                "temperatureMaxTime": 1717099200,
                "apparentTemperatureMin": 70.83,
                "apparentTemperatureMinTime": 1717066800,
                "apparentTemperatureMax": 90.42,
                "apparentTemperatureMaxTime": 1717099200
            },
            {
                "time": 1717131600,
                "icon": "clear-day",
                "summary": "Clear",
                "sunriseTime": 1717153641,
                "sunsetTime": 1717203886,
                "moonPhase": 0.78,
                "precipIntensity": 0.0,
                "precipIntensityMax": 0.0,
                "precipIntensityMaxTime": 1717131600,
                "precipProbability": 0.11,
                "precipAccumulation": 0.0,
                "precipType": "rain",
                "temperatureHigh": 87.71,
                "temperatureHighTime": 1717185600,
                "temperatureLow": 75.94,
                "temperatureLowTime": 1717218000,
                "apparentTemperatureHigh": 91.18,
                "apparentTemperatureHighTime": 1717185600,
                "apparentTemperatureLow": 68.93,
                "apparentTemperatureLowTime": 1717149600,
                "dewPoint": 68.45,
                "humidity": 0.7,
                "pressure": 1014.01,
                "windSpeed": 5.6,
                "windGust": 12.33,
                "windGustTime": 1717196400,
                "windBearing": 128.78,
                "cloudCover": 0.25,
                "uvIndex": 7.18,
                "uvIndexTime": 1717189200,
                "visibility": 10.0,
                "temperatureMin": 71.89,
                "temperatureMinTime": 1717146000,
                "temperatureMax": 87.71,
                "temperatureMaxTime": 1717185600,
                "apparentTemperatureMin": 71.89,
                "apparentTemperatureMinTime": 1717146000,
                "apparentTemperatureMax": 91.18,
                "apparentTemperatureMaxTime": 1717185600
            }
        ]
    },
    "alerts": [],
    "flags": {
        "sources": [
            "ETOPO1",
            "gfs",
            "gefs",
            "hrrrsubh",
            "hrrr_0-18",
            "nbm",
            "nbm_fire",
            "hrrr_18-48"
        ],
        "sourceTimes": {
            "hrrr_subh": "2024-05-24 13Z",
            "hrrr_0-18": "2024-05-24 13Z",
            "nbm": "2024-05-24 13Z",
            "nbm_fire": "2024-05-24 06Z",
            "hrrr_18-48": "2024-05-24 12Z",
            "gfs": "2024-05-24 06Z",
            "gefs": "2024-05-24 06Z"
        },
        "nearest-station": 0,
        "units": "us",
        "version": "V2.0.8"
    }
}
````

Still here? Thank you. Given all that data, you may want to summarize it a bit. Here's a script I wrote to do that:

```js
const template = `
{% raw %}{{#each days}}
<p>
Date: {{ date }}<br>
Weather: {{ summary }}<br>
High: {{ temperatureHigh }}F<br>
Low: {{ temperatureLow}}F
</p>
{{/each}}{% endraw %}
`;

function toDate(s) {
    return new Date(s * 1000);
}

let result = pm.response.json();
for(let d of result.daily.data) {
    d.date = toDate(d.time);
}
pm.visualizer.set(template, { days: result.daily.data });
```

I take all that data and create a smaller summary showing the date, weather, and high and low temps. This renders out nicely like so:

```
Date: 2024-05-24T05:00:00.000Z
Weather: Clear
High: 89.11F
Low: 77.63F

Date: 2024-05-25T05:00:00.000Z
Weather: Partly Cloudy
High: 90.23F
Low: 75.15F

Date: 2024-05-26T05:00:00.000Z
Weather: Partly Cloudy
High: 88.85F
Low: 79.28F

Date: 2024-05-27T05:00:00.000Z
Weather: Partly Cloudy
High: 90.81F
Low: 75.56F

Date: 2024-05-28T05:00:00.000Z
Weather: Partly Cloudy
High: 90.44F
Low: 70.85F

Date: 2024-05-29T05:00:00.000Z
Weather: Partly Cloudy
High: 88.64F
Low: 71.5F

Date: 2024-05-30T05:00:00.000Z
Weather: Partly Cloudy
High: 87.11F
Low: 71.89F

Date: 2024-05-31T05:00:00.000Z
Weather: Clear
High: 87.71F
Low: 75.94F
```

I think this feature would both be useful for showing other folks a high-level view of API results and heck, even just useful for yourself if you need to focus on a small portion of the data.

As cool as this is, I do want to share a warning. While I was building these examples, I made mistakes. That's natural. But I noticed sometimes Postman responded *very* badly to them, to the point where I had to close it and re-open it. I've got no idea *why*, I wasn't doing things like creating infinite loops, but for some reason, it would just stop responding well and only a restart of the app would help. I *also* noticed it sometimes "lost" edits my code. When I saw Postman start acting up, I'd copy the code over to Notepad, restart, and paste it back in. I'm sure it was my fault but... keep it in mind. 

As before, I've got a video version of this as well. Enjoy!

<iframe width="560" height="315" src="https://www.youtube.com/embed/RKlAV309F5Q?si=D0Ik01buFJ3tE1jV" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;margin:auto;margin-bottom:15px"></iframe>
