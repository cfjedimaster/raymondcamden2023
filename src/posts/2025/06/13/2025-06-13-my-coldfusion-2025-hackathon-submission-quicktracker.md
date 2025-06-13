---
layout: post
title: "My ColdFusion 2025 Hackathon Submission - QuickTracker"
date: "2025-06-13T18:00:00"
categories: ["coldfusion"]
tags: []
banner_image: /images/banners/bugs.jpg
permalink: /2025/06/13/my-coldfusion-2025-hackathon-submission-quicktracker
description: My CF Hackathon submission - a quick and dirty bug tracker
---

Earlier this month, the ColdFusion team [announced](https://adobe-cold-fusion-hackathon.meetus.adobeevents.com/registration/form) a hackathon that started today, and ends Monday night. Full disclosure, when I saw the announcement, I thought that the date range is when things had to be turned in. I spent a few hours on what I'm going to share below, but when I found out that the intent was to *start* today, I wrapped up and stopped. My submission only took a few hours, and outside of a quick readme update today, I feel fine with my submission. And heck, it was fun to build, so I don't really care if I win (ok, that's a bit of a lie). With that out of the way, let me share what I created, [QuickTracker.cfm](https://github.com/cfjedimaster/quicktrackercfm). 

QuickTracker.cfm is based on a tool first built by a buddy, and previous boss of mine, [Nathan Dintenfass](http://nathan.dintenfass.com/), near twenty years ago. The tool was a quick and dirty bug tracker that could literally be copied and pasted into a directory and put to work. No database, no authentication, just a quick way to record issues. I took that initial script and iterated on it quite a bit, and eventually turned it into a "real" tracker I called [Lighthouse Pro](https://github.com/cfjedimaster/LighthousePro). (Apparently I last touched that 11 years ago.) 

I'm not sure why this popped in my mind, but when I was thinking about submitting to the hackathon, I headed over to the ["what's new in ColdFusion 2025"](https://helpx.adobe.com/coldfusion/using/whats-new.html) page and saw a callout on updated spreadsheet and CSV functions. I thought why not resurrect the idea and tie the storage to a CSV file. 

The idea would be the same - copy a file into a folder and start reporting bugs - but with the "database" being a CSV file, it would be portable. You could email it, print it, or heck maybe even copy and paste the information into Jira at a later time. 

To get started, you can grab [quickstart.cfm](https://github.com/cfjedimaster/quicktrackercfm/blob/main/quicktracker.cfm) from the repository, and then drop it into a ColdFusion web directory of some sort. As long as it's running ACF 2025, that's all that should matter. Open it up and you'll see the default UI:

<p>
<img src="https://static.raymondcamden.com/images/2025/06/qt1.jpg" alt="Default look" class="imgborder imgcenter" loading="lazy">
</p>

I made use of the *excellent* [Shoelace](https://shoelace.style/) web component library for the design here. Click New Issue, and you can start reporting:

<p>
<img src="https://static.raymondcamden.com/images/2025/06/qt2.jpg" alt="Issue form" class="imgborder imgcenter" loading="lazy">
</p>

Keep adding issues and you'll see them in a nice table format:

<p>
<img src="https://static.raymondcamden.com/images/2025/06/qt3.jpg" alt="Issues" class="imgborder imgcenter" loading="lazy">
</p>

I didn't add sorting or filtering, but may consider that post hackathon. Again, this is **not** meant to be a "real" tracker, just a quick tool. 

Behind the scenes, this all records to a CSV file, `bugs.csv`, that could be opened in Excel:

<p>
<img src="https://static.raymondcamden.com/images/2025/06/qt4.jpg" alt="Excel view" class="imgborder imgcenter" loading="lazy">
</p>

I included basic reporting, making use of some newer ACF 2025 changes:

<p>
<img src="https://static.raymondcamden.com/images/2025/06/qt5.jpg" alt="Charts view" class="imgborder imgcenter" loading="lazy">
</p>

Finally, I added PDF export for an issue:

<p>
<img src="https://static.raymondcamden.com/images/2025/06/qt6.jpg" alt="PDF view" class="imgborder imgcenter" loading="lazy">
</p>

Behind the pretty UI, the entire thing is one file. Obviously that's not best practices, but again, my intent was for you to paste this into a folder and go. The basic 'skeleton' of the code is:

* Wrap the layout in a variable that includes a header, footer, and body area. This is also where I load in Shoelace
* Set up some UDFs on top that get commonly used
* Make use of a large `cfswitch` statement to handle "routes", which define the various views of the application - issue listings, issue editing, and reports. 

The code can be customized a bit. For example - priority, status, and resolution are all arrays:

```js
resolutionArr = ["FIXED", "WONTFIX"];
statusArr = ["OPEN", "CLOSED"];
priorityArr = ["LOW", "MEDIUM", "HIGH"];
```

The template, as well, could be modified. As I said above, it's a large string that uses 2 UDFs to get the top and bottom portions like so:

```js
function header() {
	return template.listToArray('<!--CONTENT-->',true,true)[1];
}

function footer() {
	return template.listToArray('<!--CONTENT-->',true,true)[2];
}
```

Getting the issues, or an issue, all involve CSV parsing. I don't store anything in RAM and instead always load from the file. The thinking here was to remove any dependencies, even an application cache.

```js
function getIssue(required numeric id) {
	local.data = csvRead(filePath=csvPath,outputFormat="arrayOfStruct", csvFormatConfiguration={skipHeaderRecord:true, header:headers, ignoreHeaderCase:false});
	return local.data[local.data.find(i => i.ID == id)];
}

function getIssues() {
	return csvRead(filePath=csvPath,outputFormat="arrayOfStruct", csvFormatConfiguration={skipHeaderRecord:true, header:headers, ignoreHeaderCase:false});
}
```

Saving an issue is only slightly complex as I have to handle new versus old:

```js
function saveIssue(i) {
	local.data = getIssues();
	if(i.ID == "") {
		i.Created = dateTimeFormat(now());
		i.Updated = i.Created;
		i.ID = int(local.data.reduce((curr, i) => {
			if(i.ID > curr) return i.ID;
			return curr;
		},0) + 1);
		local.data.append(i);
	} else {
		oldIssue = local.data.find(issue => issue.ID == i.ID);
		i.Created = local.data[oldIssue].Created;
		i.Updated = dateTimeFormat(now());
		local.data[oldIssue] = i;
	}
	csvWrite(data, "arrayofStruct", csvPath, { header: headers });
}
```

Reporting makes use of the new `cfchartset` feature in CF2025, letting you group charts together and set some chart settings at once versus per chart. I think I could have done better here, but it worked well enough:

```html
<cfchartset format="html" layout="2x2" height="1000" width="1000" theme="vernal_dark">

	<cfchart type="ring">
		<cfchartseries seriesLabel="Issues By Status" >
			<cfloop item="s" collection="#statusValues#">
				<cfchartdata item="#s#" value="#statusValues[s]#">
			</cfloop>
		</cfchartseries>
	</cfchart>

	<cfchart type="ring">
		<cfchartseries seriesLabel="Issues By Priority">
			<cfloop item="p" collection="#priorityValues#">
				<cfchartdata item="#p#" value="#priorityValues[p]#">
			</cfloop>
		</cfchartseries>
	</cfchart>

	<cfchart type="ring">
		<cfchartseries seriesLabel="Issues By Resolution">
			<cfloop item="r" collection="#resolutionValues#">
				<cfchartdata item="#r#" value="#resolutionValues[r]#">
			</cfloop>
		</cfchartseries>
	</cfchart>

</cfchartset>
```

All in all, I'm kinda proud of this little "toy", and hopefully it doesn't come in dead last in the Hackathon! You can check out the repository here: <https://github.com/cfjedimaster/quicktrackercfm>. One note, if you do have suggestions, please remember the idea is to keep this as simple as possible, and also, I'd rather not accept any PRs until the contest is officially over. Enjoy my first new ColdFusion repo in... quite some time. :)

Photo by <a href="https://unsplash.com/@brianwangenheim?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Brian Wangenheim</a> on <a href="https://unsplash.com/photos/black-and-yellow-bee-on-white-paper-BCjnZSORTI0?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      