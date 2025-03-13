---
layout: post
title: "Building a Jira Search Tool in BoxLang"
date: "2025-03-13T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_flyswat.jpg
permalink: /2025/03/13/building-a-jira-search-tool-in-boxlang
description: Using the Jira API with BoxLang for quick searching.
---

Developers seem to have a love/hate (or perhaps hate/despise) relationship with Jira. I've never minded it, but the biggest issue for me is that if I haven't used it in a while, it can be overwhelming. Yesterday I was thinking about this and wondering if perhaps I could build my own tooling to interact with Jira via an API, if it even had one. Turns out, of course they have an [API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/#version) and it's not terribly difficult to use. With that in mind, I whipped up a quick tool to search Jira via the command line with [BoxLang](https://boxlang.io).

## Jira API Basics

The [docs](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/#version) for Jira's API are pretty good and cover the *huge* set of operations you can perform with it.

Your root API url will be based on your Jira installation. I wanted to search against the BoxLang Jira instance so that was `https://ortussolutions.atlassian.net/`. After this you append `rest/api/VERSION/OPERATION` where `VERSION` can be set to a specific version or just `latest`. 

There's a few ways to do authentication, including oAuth, but basic username/password validation works as well. 

## The Search API

For my little script, I wanted a quick way to see open or being worked on issues that matched a term. For this I used JQL, which is the Jira Query Language, along with a bunch of Googling to figure out the right syntax. Given a search term of, let's say `cats`, a JQL statement may look like this:

```
project=BL and status in ("In Progress", "Open", "To do") and summary ~ "cat"
```

The status set of values there was something I found online and could possibly be improved, but it seemed to work well in my testing. Also, I suppose I could search against the body of the issue as well, but I thought a summary match (which is the title kinda) made the most sense.

Given this JQL, you could do a quick call like so:

```js

jql = 'project=BL and status in ("In Progress", "Open", "To do") and summary ~ "cat"';

jiraURL = '#variables.rootUrl#rest/api/latest/search/jql?jql=#urlEncodedFormat(jql)#&fields=summary,status&maxResults=1000';

bx:http url=jiraURL result="result" username=variables.username password=variables.password {
	bx:httpparam type="header" name="Accept" value="application/json";
}
```

This is making use of the ["Search for issues using JQL enhanced search (GET)"](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-get) endpoint. Previously I had used [this one](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-get) and I realized today it was deprecated. The API takes a variety of arguments, but the only real important one here is `fields`. By default the search will only return IDs, so if you want more, you have to ask for it. In my case, I figure the summary and status were enough. 

Here's a sample result set:

```
{
  issues : [
      {
      expand : "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",
      id : "138098",
      self : "https://ortussolutions.atlassian.net/rest/api/latest/issue/138098",
      key : "BL-1197",
      fields : {
        summary : "Threading Improvements: isThreadAlive(), isThreadInterrupted(), threadInterrupt() bifs",
        status : {
          self : "https://ortussolutions.atlassian.net/rest/api/2/status/1",
          description : "The issue is open and ready for the assignee to start work on it.",
          iconUrl : "https://ortussolutions.atlassian.net/images/icons/statuses/open.png",
          name : "Open",
          id : "1",
          statusCategory : {
            self : "https://ortussolutions.atlassian.net/rest/api/2/statuscategory/2",
            id : 2,
            key : "new",
            colorName : "blue-gray",
            name : "To Do"
          }
        }
      }
    },
    {
      expand : "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",
      id : "138097",
      self : "https://ortussolutions.atlassian.net/rest/api/latest/issue/138097",
      key : "BL-1196",
      fields : {
        summary : "Added isVirtual, isDaemon, threadGroup, id to the thread metadata",
        status : {
          self : "https://ortussolutions.atlassian.net/rest/api/2/status/1",
          description : "The issue is open and ready for the assignee to start work on it.",
          iconUrl : "https://ortussolutions.atlassian.net/images/icons/statuses/open.png",
          name : "Open",
          id : "1",
          statusCategory : {
            self : "https://ortussolutions.atlassian.net/rest/api/2/statuscategory/2",
            id : 2,
            key : "new",
            colorName : "blue-gray",
            name : "To Do"
          }
        }
      }
    },
    {
      expand : "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",
      id : "132011",
      self : "https://ortussolutions.atlassian.net/rest/api/latest/issue/132011",
      key : "BL-267",
      fields : {
        summary : "New VirtualThread component as a subclass of Thread in BoxLang",
        status : {
          self : "https://ortussolutions.atlassian.net/rest/api/2/status/1",
          description : "The issue is open and ready for the assignee to start work on it.",
          iconUrl : "https://ortussolutions.atlassian.net/images/icons/statuses/open.png",
          name : "Open",
          id : "1",
          statusCategory : {
            self : "https://ortussolutions.atlassian.net/rest/api/2/statuscategory/2",
            id : 2,
            key : "new",
            colorName : "blue-gray",
            name : "To Do"
          }
        }
      }
    }
  ]
}
```

## The Tool

Ok, so let's put this together. I created a BoxLang class to wrap up the logic above:

```js

class {

	variables.rootUrl = 'https://ortussolutions.atlassian.net/';
	variables.username = 'my email';
	variables.password = 'do you think I hard coded this? i sure as heck did';

	function main(args = []) {

		if(args.len() < 1) {
			println('Pass a search term for the open issues you want to find.');
			abort;
		}

		term = args[1];

		jql = 'project=BL and status in ("In Progress", "Open", "To do") and summary ~ "#term#"';

		jiraURL = '#variables.rootUrl#rest/api/latest/search/jql?jql=#urlEncodedFormat(jql)#&fields=summary,status&maxResults=1000';

		bx:http url=jiraURL result="result" username=variables.username password=variables.password {
			bx:httpparam type="header" name="Accept" value="application/json";
		}

		issueResult = jsonDeserialize(result.filecontent);

		println('#issueResult.issues.len()# open issue(s) found.#char(10)#');

		for(issue in issueResult.issues) {
			println('Summary: ' & issue.fields.summary);
			println('Status: ' & issue.fields.status.name);
			println('Link: ' & variables.rootUrl & 'browse/' & issue.key);
			println('');
		}

	}
}
```

On top I've got a few variable declarations. As the code slyly suggests, I absolutely hard coded my credentials as this was a tool just for me, but I could have just as easily used environment variables as well. 

The main function handles doing basic CLI checking which for my tool was just requiring an argument for the search term.

If it's passed, I hit the API, parse the result, and render it. The only possibly weird aspect is that to create a link, I have to create a URL based on the root domain for the Jira instance and the `key` value of the result. 

Here's an example of this working. Running `boxlang jira.bx threading` at the command line gives me:

```
3 open issue(s) found.

Summary: Threading Improvements: isThreadAlive(), isThreadInterrupted(), threadInterrupt() bifs
Status: Open
Link: https://ortussolutions.atlassian.net/browse/BL-1197

Summary: Added isVirtual, isDaemon, threadGroup, id to the thread metadata
Status: Open
Link: https://ortussolutions.atlassian.net/browse/BL-1196

Summary: New VirtualThread component as a subclass of Thread in BoxLang
Status: Open
Link: https://ortussolutions.atlassian.net/browse/BL-267
```

Now I can check the BoxLang issues right from the command line and - usually - much quicker than me going to our Jira instance and trying to craft a search. I could see using this in other ways as well. You could put up a Lambda running BoxLang that provides a way to embed open issues in the docs for example. (And I believe I just figured out my next blog post!)

