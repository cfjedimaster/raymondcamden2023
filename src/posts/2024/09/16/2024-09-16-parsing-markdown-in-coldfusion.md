---
layout: post
title: "Parsing Markdown in ColdFusion"
date: "2024-09-16T18:00:00"
categories: ["coldfusion"]
tags: []
banner_image: /images/banners/cat_two_papers.jpg
permalink: /2024/09/16/parsing-markdown-in-coldfusion
description: A quick example of parsing Markdown in ColdFusion.
---

Welcome to my third, yes, third, [ColdFusion](https://www.raymondcamden.com/categories/coldfusion) post in 2024. Is it a trend? Who knows. That being said, I'm doing some prep work to update my presentation on Google [Gemini](https://gemini.google.com) in preparation for my talk at Adobe's [ColdFusion Summit](https://cfsummit.adobeevents.com/) later this month, I'm updating my Node.js demos to ColdFusion and ran into an interesting issue - converting Markdown responses from Gemini to HTML. 

My first quick Google searches didn't really mesh well with what I expected, so I asked on the CFML Slack and [James Moberg](https://github.com/JamoCA) pointed out a few options, but suggested I focus on Flexmark (which was backed up by another person on the Slack). 

I was directed to a blog post by, of course, Ben Nadel: ["Using Flexmark 0.32.24 To Parse Markdown Content Into HTML Output In ColdFusion"](https://www.bennadel.com/blog/3452-using-flexmark-0-32-24-to-parse-markdown-content-into-html-output-in-coldfusion.htm). It was a bit out of date but was enough to get me going. Here's how I built my, admittedly quick and dirty, solution. 

## Step One - Get the Jar

The [Flexmark](https://github.com/vsch/flexmark-java) library is a Java package that looks to be incredibly customizable and conplex. The install instructions expect you to use Maven or another Java tool, but I figured I just needed to get the right jar. This took me a minute to figure out. I ended up Maven at the [latest release](https://mvnrepository.com/artifact/com.vladsch.flexmark/flexmark-all/0.64.8) for the "all" package, which led to the file listing here: <https://repo1.maven.org/maven2/com/vladsch/flexmark/flexmark-all/0.64.8/> 

On this page, I downloaded `flexmark-all-0.64.8.lib.jar`. 

## Step Two - Load the Jar

Next, I added it in my `Application.cfc` like so:

```js
this.javaSettings = {
	loadPaths = ["./flexmark-all-0.64.8-lib.jar"]
};
```

I'd probably not put the jar in the root of my demo, but this isn't for production or anything. 

## Step Three - Use the Code

So for actually using it, I didn't follow Ben's code, but rather the [simple Java code](https://github.com/vsch/flexmark-java/blob/master/flexmark-java-samples/src/com/vladsch/flexmark/java/samples/BasicSample.java) referenced in the GitHub repo. This is what they had:

```js
package com.vladsch.flexmark.java.samples;

import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.ast.Node;
import com.vladsch.flexmark.util.data.MutableDataSet;

public class BasicSample {
    public static void main(String[] args) {
        MutableDataSet options = new MutableDataSet();

        // uncomment to set optional extensions
        //options.set(Parser.EXTENSIONS, Arrays.asList(TablesExtension.create(), StrikethroughExtension.create()));

        // uncomment to convert soft-breaks to hard breaks
        //options.set(HtmlRenderer.SOFT_BREAK, "<br />\n");

        Parser parser = Parser.builder(options).build();
        HtmlRenderer renderer = HtmlRenderer.builder(options).build();

        // You can re-use parser and renderer instances
        Node document = parser.parse("This is *Sparta*");
        String html = renderer.render(document);  // "<p>This is <em>Sparta</em></p>\n"
        System.out.println(html);
    }
}
```

And from this, I wrote up a quick demo:

```js
ds = createObject("java", "com.vladsch.flexmark.util.data.MutableDataSet");
ps = createObject("java", "com.vladsch.flexmark.parser.Parser").builder(ds).build();
hm = createObject("java", "com.vladsch.flexmark.html.HtmlRenderer").builder(ds).build();

doc = ps.parse("This is *sparta*");

result = hm.render(doc);
writeoutput(result);
```

Yeah, not the best variable names, but, it worked perfectly well. I took this scratch code and built a simple UDF:

```js
function toMarkdown(str) {

	var ds = createObject("java", "com.vladsch.flexmark.util.data.MutableDataSet");
	var ps = createObject("java", "com.vladsch.flexmark.parser.Parser").builder(ds).build();
	var hm = createObject("java", "com.vladsch.flexmark.html.HtmlRenderer").builder(ds).build();
	var doc = ps.parse(str);
	return hm.render(doc);

}
```

I feel like this would be better as a CFC cached in the App scope so I'm not re-creating the Java objects on every call, but I'll leave that for others to do. :) 

I tested it like so, and it worked perfectly well:

```html
<cfsavecontent variable="test">
# Hello World

Tell me why you love my [blog](https://www.raymondcamden.com).

This is another paragraph. 

## Stuff I like:

* Books
* Video Games
* Music 
* Beer 
</cfsavecontent>

<cfoutput>#toMarkdown(test)#</cfoutput>
```

I hope this helps! It will be in my repo for the presentation once I check it in, but let me know if you have any questions. 