---
layout: post
title: "Parsing Arbitrary Dates in Strings with Chrono and a Web Component"
date: "2026-06-24T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat_calendar2a.jpg
permalink: /2026/06/24/parsing-arbitrary-dates-in-strings-with-chrono-and-a-web-component
description: Using the Chrono library to find date references and then update them using a web component.
---

Yesterday I had an idea for a possible experiment using Chrome's built-in AI support - looking for "date" references in strings. So for example: "I will have my new job in 12 days". Could the AI model recognize "12 days" as a date and determine what the actual date is, assuming a reference date of now? I was about to start working on a simple POC when I thought... wait... is there already a JavaScript library for this?

Of course there is.

The aptly named [Chrono](https://github.com/wanasit/chrono) library does just that. It can parse a string with one assumed date and return the date, so for example:

```js
import * as chrono from 'chrono-node';

chrono.parseDate('An appointment on Sep 12-13'); 
```

This returns: `Sat Sep 12 2026 12:00:00 GMT-0500 (Central Daylight Time)`. It can also take a string and give you a parsed set of results, so for example:

```js
chrono.parse('An appointment on Sep 12-13');
/* [{ 
    index: 18,
    text: 'Sep 12-13',
    start: ...
}] */
```

The `parse` method will return one result per matched item, with the result including the original string, lots of info on how it parsed it, and the ability to get the proper date object from it. It can also handle durations and a reference date too, so if your input was, "I will eat sushi tomorrow" and the reference was January 2nd, 2026, it would recognize that tomorrow is January 3rd, 2026. 

So, how about a demo? I created a quick CodePen that has a textarea for arbitrary input. You can type anything, and when it finds stuff, it dumps it out below and then follows up that dump with parsed dates. I'll skip over the HTML (you can see it in the embedded CodePen), but here's the JavaScript:

```js
import * as chrono from 'chrono-node';

const $input = document.querySelector('#input');
const $output = document.querySelector('#output');

$input.addEventListener('input', () => {
	const input = $input.value.trim();
	$output.innerText = '';
	if(input === '') return;
	/*
	temp test to set a reference:
	let yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	let parsed = chrono.parse(input, yesterday);
	*/
	let parsed = chrono.parse(input);

	if(parsed.length) {
		$output.innerText = JSON.stringify(parsed, null, '\t') + '\n';
	
		for(const p of parsed) {
			console.log(p.start.date());
			$output.innerText += `Parsed date: ${p.start.date()} `;
			if(p.end) $output.innerText += ` - ${p.end.date()}`;
			$output.innerText += '\n';
		}
	}
});
```

Basically import the library, note changes in the textarea, and parse. If results are found I do the simple dump as I mentioned. One small oddity with the library is that the initial result does *not* actually include the date. You have to run `.date()` on the `start` and (optional) `end` values to get that. Hence that for loop. You can also see, commented out, how easy it is to use a reference date. 

Go ahead and test it below.

I will say I found the 'duration' support didn't work terribly well. By that I mean it would find the date reference, but not always the 'end'. The sample input, "I have an appointment tomorrow from 10 to 11 AM", worked fine, but in my tests it was hit or miss. Again though, it got the start every time so that's something.

<p class="codepen" data-theme-id="-2" data-height="500" data-pen-title="chrono test" data-preview="true" data-version="2" data-default-tab="result" data-slug-hash="WbROxQm" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/editor/cfjedimaster/pen/019ef9de-fbbf-778f-9e68-7a9a0d44ecc6">
  chrono test</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## Turning it into a Web Component

At this point, I thought it might be cool to build a web component that would:

* Use Chrono to find the date strings
* Wrap each matched item with a `<time>` element, setting `datetime` and `title` to the parsed date
* Use a bit of CSS to highlight the text
* Allow for an attribute that lets you specify the date. In my mind, the main use for this is UGC (user generated content), things like comments for example. Comments are made at a point in time which means it should be easy to pass that to the component.

I named my component `time-parse` because I'm incredibly creative. Here's an example of it in play, both with and without a reference date:

```html
<div>
    <time-parse>
    I'll be eating tomorrow. Or maybe in 3 hours? I'm not sure.
    </time-parse>
</div>

<div>
    <time-parse date="2026-06-04">
        This is an example in the past. I set the date to June 4th. 
    I'll be eating tomorrow. Or maybe in 3 hours? I'm not sure.
    </time-parse>
</div>
```

Here's the code I used. I'll talk a bit about my design decisions after:

```js
import * as chrono from 'chrono-node';

class TimeParseComponent extends HTMLElement {

	constructor() {
		super();
	}
	
	connectedCallback() {

		// doing an inline style so i dont have to worry about specifying it just for the WC. This feels wrong a bit...
		const STYLE = 'text-decoration: underline;text-decoration-color: #ccc;';

		let dateRef = null;
		
		// look for date attribute
		if(this.hasAttribute("date")) {
			console.log('Date found, using as ref');
			dateRef = this.#parseLocalDate(this.getAttribute("date"));
			console.log('dateRef is ', dateRef);
		}
		
		let input = this.innerHTML;
		const parsed = chrono.parse(input, dateRef);
		if(!parsed || !parsed.length) return;
		console.log(`Found ${parsed.length} items to update`);
		/*
		For each, find the initial string, and wrap it with:
		<time datetime=PARSEDTIME title=PARSEDTIME>orig</time>

		Go backwards as we are changing the string
		*/
		for(let x=parsed.length-1; x >= 0; x--) {
			console.log(parsed[x]);
			// first get the date, currently not supporting end
			let date = this.#formatDateTime(parsed[x].start.date());
			let orig = input.substring(parsed[x].index, parsed[x].index + parsed[x].text.length);
			// now make the new string
			let newStr = `
<time datetime="${date}" title="${date}" style="${STYLE}">${orig}</time>
			`.trim();
			//console.log(newStr);

			input = input.slice(0, parsed[x].index) + newStr + input.slice(parsed[x].index + parsed[x].text.length);
		}

		// All done - 
		console.log('Final Result', input);
		this.innerHTML = input;
	}

	#formatDateTime(x) {
	  const pad = (n) => String(n).padStart(2, '0');
	
	  return [
	    x.getFullYear(),
	    pad(x.getMonth() + 1),
	    pad(x.getDate()),
	  ].join('-') + ' ' + [
	    pad(x.getHours()),
	    pad(x.getMinutes()),
	    pad(x.getSeconds()),
	  ].join(':');
	}

	#parseLocalDate(isoDate) {
	  const [y, m, d] = isoDate.split('-').map(Number);
	  return new Date(y, m - 1, d); // local midnight on that date
	}
}

if(!customElements.get('time-parse')) customElements.define('time-parse', TimeParseComponent);
```

Alright, so ignoring the basic web component setup, you can see the basic flow is:

* Look to see if a `date` attribute was used, if so, that's our reference date.
* Get the text inside the component and parse it.
* For each found result, looping backwards, replace the match with new HTML that uses the `time` tag.
* Finally, update the inner HTML inside the component.

Up top you'll notice a `STYLE` variable. I went with an inline style for... I don't know. I just didn't want to think about the shadow DOM and so forth. I figure with something so small it's ok. Feel free to fork the pen. ;) 

You can try it out below. Also, once again, I love web components.

<p class="codepen" data-theme-id="-2" data-height="600" data-pen-title="time-parse demo" data-preview="true" data-version="2" data-default-tab="result" data-slug-hash="pvRwbwv" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/editor/cfjedimaster/pen/019ef9fa-d6e2-7d49-a140-43a457c7d347">
  time-parse demo</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>