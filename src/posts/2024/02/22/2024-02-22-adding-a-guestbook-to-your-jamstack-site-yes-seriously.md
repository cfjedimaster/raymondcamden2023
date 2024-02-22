---
layout: post
title: "Adding a Guestbook to Your Jamstack Site (Yes, Seriously)"
date: "2024-02-22T18:00:00"
categories: ["jamstack"]
tags: ["eleventy","pipedream"]
banner_image: /images/banners/cat_guestbook.jpg
permalink: /2024/02/22/adding-a-guestbook-to-your-jamstack-site-yes-seriously
description: A look at how you can (but don't) add a guestbook to your website. 
---

Don't do this. I'm serious. Or do it, I certainly don't listen to reason when it comes to building demos. I've been in web development for a very, *very* long time, and I've seen many trends come and go. Guestbooks were a way for folks to leave a comment on your site as a whole. I haven't seen one in ages, but some still linger. In fact, Ana Rodrigues has an absolutely [lovely guestbook](https://ohhelloana.blog/guestbook/) driven by [Webmentions](https://indieweb.org/Webmention). And if you *really* want to, you can still download a Perl CGI [guestbook](https://www.scriptarchive.com/guestbook.html) over at Matt's Script Archive. I haven't written Perl in decades, but I absolutely loved it back in the 90s. That being said, I had a free hour yesterday, was bored, and decided, why not do something fun? The result - my new [guestbook](/guestbook) that you can visit today. Here's how you too can (but don't) add a guestbook to your Jamstack site. (My example is in Eleventy, but uses nothing specific to Eleventy.)

## The Database

For my data, I decided to store information in a Google Sheet. That's a pretty lame database, but it worked easily enough. I set up a Google Sheet with four columns: Name, Comment, Date, and Approved. Name and Comment should be self-evident, but Date is a 'time since epoch' numerical value and Approved is `TRUE` or `FALSE`.

## Getting Guestbook Entries

To retrieve guestbook entries, I built a [Pipedream](https://pipedream.com) workflow with the following steps:

* The trigger is an HTTP trigger so I can call it via JavaScript. I'll be showing that later.
* The next step is a built-in Google Sheet action to read data where I specified my spreadsheet, the sheet name, and a range. In my code, `A2:D10000`. If my guestbook gets over 10k entries, it's time to move to a real database.
* Next, I wrote a code function to do two things - filter out unapproved entries and map the result to a more readable format. By default, the result of getting my data in the previous step is a 2D array. Mapping the result makes it easier to use:

```js
export default defineComponent({
  async run({ steps, $ }) {
    return steps.get_values_in_range.$return_value.filter(a => a[3] === 'TRUE').map(a => {
      return {
        name: a[0], 
        comment: a[1],
        date: a[2]
      }
    });
  },
})
```

* The final step just returns the data:

```js
export default defineComponent({
  async run({ steps, $ }) {

    await $.respond({
      status: 200,
      headers: { "Content-Type":"application/json"},
      body: JSON.stringify(steps.filter_and_map.$return_value),
    })
  },
})
```

You can see the result of this yourself here: <https://eoxzk4xd3lr6trv.m.pipedream.net/>.

## Adding Guestbook Entries

To add a guestbook entry, I created another Pipedream workflow. It's also HTTP triggered of course, and does the following:

* **Edited at 1:47PM** I just added a new step to validate that the name and comment field was sent. Duh, I should have done that initially. If they are not passed, the workflow ends. 

* First, it uses another built-in Pipedream action that adds rows to Google Sheets. I look for the name and comment value in the body of the HTTP trigger, set Date automatically, and Approved to false. For the most part, this just worked, but check out what I do with Name and Comment:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gb1.jpg" alt="Settings for Pipedream action" class="imgborder imgcenter" loading="lazy">
</p>

For both of the user-submitted content, I strip out any and all HTML. This is a safety measure to ensure nothing naughty gets in. I've already set it up such that it's set to not being approved by default, but this extra step ensures I don't have to manually clean input. 

* Next for the fun part. I need to know when someone adds an entry, so to do that, I'm going to send me email. The email will include the name and comment, and a method to approve the entry. I'll share the code then explain more:

```js
export default defineComponent({
  async run({ steps, $ }) {
    let html = `
<h2>Guestbook Entry Submission</h2>

<p>
The following information was submitted:
</p>
<p>
Name: <b>${steps.trigger.event.body.name.replace(/<.*?>/g,'')}</b>
</p>
<p>
Comments:<br/>
<b>${steps.trigger.event.body.comment.replace(/<.*?>/g,'')}</b>
</p>

<p>
<a href="${process.env.APPROVE_GB}/?range=${encodeURIComponent(steps.add_single_row.$return_value.updatedRange)}">Click to Approve</a>
</p>

    `;
    return html;
  },
})
```

The beginning just outputs the simple values. For approval, I'm referencing the third and final workflow I'll show next. I used an environment variable for that because I want to keep the URL secret, and my Pipedream workflow is tied to a public GitHub repository so I can share stuff. Obviously, that was my choice and I could have used a private repo. To handle knowing *what* to approve, I used the result of the previous step that added the data. The `updatedRange` value looks like so: `Sheet1!A9:D9`.

* The final step just uses the built-in Pipedream step to email me. Here's an example:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gb2.jpg" alt="Sample email sent to allow Guestbook entry approval" class="imgborder imgcenter" loading="lazy">
</p>

## Approving Guestbook Entries

The third and final Pipedream workflow is another HTTP-driven workflow with just two steps (ignoring the trigger):

* The first step uses another built-in Pipedream action to update Google Sheets data. For the Cell, I specify this: `{% raw %}{{steps.trigger.event.query.range.split(':').pop()}}{% endraw %}`. If you remember, I passed the updated cell range via query string in the email, so if I split on the colon, I get the final cell (the Approved column) and can then set it to true. 

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gb3.jpg" alt="Screenshot of PD action" class="imgborder imgcenter" loading="lazy">
</p>

* The final step simply redirects me (as I'll be the one clicking) to the guestbook:

```js
export default defineComponent({
  async run({ steps, $ }) {
    await $.respond({
      status: 302,
      headers: {
        'Location':'https://www.raymondcamden.com/guestbook'
      },
    })
  },
})
```

## The Guestbook

Ok, so far I've shown the serverless functions built on Pipedream to support the workflow. Now let's look at how it's rendered. You can visit the [guestbook](/guestbook) now, but if you'd rather not open a tab, here it is in all its glory:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gb4.jpg" alt="Screenshot of the guestbook." class="imgborder imgcenter" loading="lazy">
</p>

Given that we're building on the Jamstack, we've got multiple different ways to build this.

1. One would be entirely static. In Eleventy, I could use a `data` file to fetch the entries and just render them at build time. As I'm the one who approves entries, I could manually kick off a build when I do, or even update my Pipedream workflow to call Netlify and request a build. For adding entries, I'd either use JavaScript, or a serverless function on Netlify.
1. I could also just use JavaScript to fetch entries and handle the form submission.
1. I could also get fancy and use a combination. At build, fetch all entries, and note the timestamp of the last one. I could then update my "Get Guestbook Entries" workflow to allow for an optional timestamp such that my code could fetch entries created after build time.

I went with option two for simplicity's sake. Here's the HTML I used:

```html
<div id="entries">
	<i>Loading guestbook entries, please stand by. It will be worth the wait, honest.</i>
</div>

<h3>Add Your Entry</h3>

<form id="addEntry">
<p>
<label for="name">Your Name:</label> <input id="name">
</p>
<p>
<textarea id="comment" placeholder="Your comment"></textarea>
</p>
<p>
<input type="submit" value="Save Entry" id="submitButton">
</p>
</form>
```

Fairly simple as the real work is done in JavaScript. Here's the entirety of that:

```js
const GB_URL = 'https://eoxzk4xd3lr6trv.m.pipedream.net';
const ADD_GB = 'https://eo8ymuvqefph1ce.m.pipedream.net';

const formatter = new Intl.DateTimeFormat('en-us', {
	dateStyle:'full', 
	timeStyle:'short'
});

let $name, $comment, $button, origTextButtonText;

document.addEventListener('DOMContentLoaded', init, false);
async function init() {
	console.log('fetching gb entries');

	let entryReq = await fetch(GB_URL);
	let entries = await entryReq.json();

	let s = '';
	entries.forEach(e => {

		s += `
<div class="entry">
<b>${e.name}</b> said on ${formatter.format(e.date)}:<br/>
<i>${e.comment}</i>
</div>
		`;
	});

	document.querySelector('#entries').innerHTML = s;

	console.log(entries);

	$name = document.querySelector('#name');
	$comment = document.querySelector('#comment');
	$button = document.querySelector('#submitButton');
	origTextButtonText = $button.value;

	document.querySelector('form#addEntry').addEventListener('submit', addEntry, false);
}

async function addEntry(e) {
	e.preventDefault();

	let name = $name.value.trim();
	let comment = $comment.value.trim();
	if(name === '' || comment === '') return;
	console.log(name, comment);

	$button.setAttribute('disabled', 'disabled');
	$button.value = 'Submitting...';
	let resp = await fetch(ADD_GB, {
		method: 'POST', 
		body: JSON.stringify({
			name, 
			comment
		})
	});
	// currently we assume 204 and don't handle errors, maybe later...

	$name.value = '';
	$comment.value = '';
	$button.removeAttribute('disabled');
	$button.value = origTextButtonText;
	alert('Your guestbook entry is submitted for approval. Thank you!');
}
```

From the top, I initialize a few variables, and on document load, hit my endpoint to get entries. I render them and use the browser's `Intl` API to nicely render the dates and times. The form submission is also pretty vanilla - basically, just ensure the name and comment aren't blank, I don't even tell the user if they made a mistake. 

If you want to do this yourself, you can find the code here:

* [Get Entries Workflow](https://github.com/cfjedimaster/General-Pipedream-Stuff/tree/production/get-guestbook-entries-p_D1Cza5O)
* [Add Guestbook Entry](https://github.com/cfjedimaster/General-Pipedream-Stuff/tree/production/add-guestbook-entry-p_yKCwGWl)
* [Approve Guestbook Entry](https://github.com/cfjedimaster/General-Pipedream-Stuff/tree/production/approve-guestbook-entry-p_MOCayaq)
* [Guestbook HTML/JS](https://github.com/cfjedimaster/raymondcamden2023/blob/main/src/misc/guestbook.liquid)

Come back next week when I'll show you how to add a page counter to your site!
