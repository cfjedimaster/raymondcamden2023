---
layout: post
title: "Parsing Markdown in BoxLang - Take 2"
date: "2025-04-21T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_director.jpg
permalink: /2025/04/21/parsing-markdown-in-boxlang-take-2
description: A follow up on Java interop in BoxLang
---

A long, long time ago, ok, it was last Thursday, I [posted](https://www.raymondcamden.com/2025/04/18/parsing-markdown-in-boxlang) about adding Markdown processing to BoxLang via the [Flexmark](https://github.com/vsch/flexmark-java) Java library. After posting it, a few folks were curious why I didn't use the native `import` process instead of `createObject('java', '...')` and the answer was simple - I just didn't think about it! To give you an idea of the difference, let's first consider the initial version:

```js
function markdownToHTML(str) {

	// .init() is important!
	ds = createObject("java", "com.vladsch.flexmark.util.data.MutableDataSet","flexmark-all-0.64.8-lib.jar").init();
	ps = createObject("java", "com.vladsch.flexmark.parser.Parser","flexmark-all-0.64.8-lib.jar").builder(ds).build();
	hm = createObject("java", "com.vladsch.flexmark.html.HtmlRenderer","flexmark-all-0.64.8-lib.jar").builder(ds).build();
	
	doc = ps.parse(str);
	return hm.render(doc);
}
```

In this version, I use `createObject` for my three Java objects to get to the final result I need, an `HtmlRenderer` object I can pass a parsed string to. Now consider this version:

```js
import com.vladsch.flexmark.util.data.MutableDataSet;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.html.HtmlRenderer;

function markdownToHTML(str) {

	ds = new MutableDataSet();
	ps = Parser.builder(ds).build();
	hm = HtmlRenderer.builder(ds).build();	

	doc = ps.parse(str);
	return hm.render(doc);
}
```

This version is a heck of a lot simpler in terms of what's being done. Technically the imports there break encapsulation from the simple UDF I had written, but I would have used a class in a real application anyway. 

There is one small issue with this version and that's finding the Jar. If you remember, with `createObject` I can point to the jar, so what do I do here? 

If I'm running this in a web application, I'd just use `javaSettings` to specify it there. Outside of that, for right now there isn't a simple one liner BIF (built-in function) with similar functionality, but we can hack it up like so:

```js
import com.vladsch.flexmark.util.data.MutableDataSet;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.html.HtmlRenderer;

bx:application name="myJavaApp" javaSettings={
  loadPaths = [ expandPath( 'flexmark-all-0.64.8-lib.jar' ) ]
};

function markdownToHTML(str) {

	ds = new MutableDataSet();
	ps = Parser.builder(ds).build();
	hm = HtmlRenderer.builder(ds).build();	

	doc = ps.parse(str);
	return hm.render(doc);

}
```

The `bx:application` component essentially turns my script into a web application (for the execution of the template) and can therefore make use of `javaSettings`. As I said, a bit of a hack, but honestly, for CLI scripts I'm fine with that, *and*, there's an open issue in the BoxLang Jira to add a proper BIF for this. 

You can find this version in our `bx-demos` repo here: <https://github.com/ortus-boxlang/bx-demos/blob/master/java-interop/flexmark2.bxs>

Obviously, both versions work, and it comes down to which style you prefer in your code base, but it's a good example of the flexibility in [BoxLang](https://boxlang.io)!