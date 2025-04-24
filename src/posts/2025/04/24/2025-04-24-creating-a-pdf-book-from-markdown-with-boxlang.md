---
layout: post
title: "Creating a PDF Book from Markdown with BoxLang"
date: "2025-04-24T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_bookshelf.jpg
permalink: /2025/04/24/creating-a-pdf-book-from-markdown-with-boxlang
description: Using BoxLang to turn Markdown source into PDF.
---

Recently I've done some blog posts on [BoxLang](https://boxlang.io) involving Markdown and PDFs, and I was curious if I could put together something that really demonstrated a complete tool of some sort. With that in mind, I built a "book" system where you can author pages in Markdown and use a BoxLang CLI script to generate a resulting PDF. It's more a POC than a real app, but it was pretty fun to build. Here's what I did.

## Functionality 

At a high level, the book is created from a source of Markdown files. Each Markdown file can use front matter (data on top) to define variables that are evaluated at the time the book is created. You can also use a "global" data file to define variables any Markdown file can use, with data defined in the Markdown file itself taking priority. 

Here's an example showing the output from my demo:

<iframe src="https://static.raymondcamden.com/images/2025/04/book.pdf#view=FitH" width="100%" height="500"></iframe>

## Specifics 

The CLI script begins by reading a directory of Markdown files. They all are stored in a subdirectory away from the CLI itself. There's no inherit order to the files so my system requires you to sort them by number in the filename. So for my example, I used these files:

* 01_toc.md
* 02_chapter1.md
* 03_chapter2.md

```js
sourceDir = './mdsource';
mdSource = directoryList(path=sourceDir,filter='*.md');
```

Next, I read in my 'global' data file. As I explained above, this lets you create variables any Markdown file can use. It will also be used for the book title:

```js
globalData = jsonDeserialize(fileRead('./data.json'));
```

Now comes the fun part. For each Markdown file, I need to pass it to a function that will look for front matter, parse it, apply data dynamically, and return the result. 

First, the loop:

```js
println('Our source directory, #sourceDir#, has #mdSource.len()# md files.');

htmlParts = [];

mdSource.each(m => {
	contents = fileRead(m);
	// split out front matter as meta data and get contents
	data = fmParse(contents, globalData);
	htmlParts.append(data);
});
```

Now the function itself:

```js
function fmParse(s, global) {
	fm = s.reFind('---(.*?)---(.*)', 1, true);
	/*
	I'm a bit rusty on reFind, but fm.match will be an array where [2] is the str I want.
	I'm not 100% confident of this
	*/
	//writedump(fm);
	if(fm.match.len() != 3) {
		return { data:global, contents:markdown(s) };
	}
	
	data = global.copy();
	data.append(yamlDeserialize(fm.match[2]));

	content = fm.match[3];
	// do simple X/Y replacement of tokens in content
	for(key in data) {
		content = content.rereplace('{% raw %}{{\s*#key#\s*}}{% endraw %}', data[key], 'all');
	}

	return { data:data, contents:markdown(content) }
}
```

For my "parser", I look for front matter as defined by three dashes, YAML data, and then three more dashes. I use the BoxLang [Yaml](https://boxlang.ortusbooks.com/boxlang-framework/modularity/yaml) module to handle parsing the Yaml, and the new [Markdown module](https://boxlang.ortusbooks.com/boxlang-framework/modularity/markdown) to convert the Markdown to HTML. (I'm going to have a video and blog post on that this week.) 

The data that's applied is done by copying over the 'global' data first, and then the Yaml, which lets data at the Markdown level take priority. Then I simply look for tokens defined by brackets, ie: `{% raw %}{{ name }}{% endraw %}`. This is fairly simple and only handles simple values, but it works. 

Here's an example Markdown source:

```
---
title: The Dog
---

<a name="chapter2"></a>
## 2 - {{title}}

This is chapter one. Hello world. Lorem ipsum dolor sit amet, 
consectetur adipiscing elit. Fusce vitae lorem at dolor 
commodo convallis ut ut erat. Cras quis fringilla augue. 
Sed vulputate nunc ac porttitor volutpat. Duis varius mauris 
erat, vel commodo tortor semper a. Donec arcu turpis, tempor 
sit amet neque ac, luctus interdum sem. Nulla euismod at eros
id pellentesque. Etiam tortor enim, bibendum vitae tellus ac, 
lacinia faucibus felis. Nulla at tempus lectus. Nulla facilisi.
```

Curious about the named anchor? When generating a PDF from HTML, you can create links to content inside the PDF itself using either anchor names, as I've done above, or HTML ID attributes. Using the name here makes it easier to create a TOC which I did as my first Markdown file:

```
---
title: Table of Contents
---

# Table of Contents

<ul>
<li><a href="#chapter1">Chapter One - The Cat</a></li>
<li><a href="#chapter2">Chapter Two - The Dog</a></li>
</ul>

{% raw %}This is version {{version}} of the book. {% endraw %}
```

By the way, you'll notice I've got hard coded titles there and dynamic ones in the pages and that obviously would get a bit messy if you edit stuff. I'm not looking to build a full "static book generator" project here. At least not today. ;) 

The final result of this is an array, `htmlParts`, of the data used for the template and the HTML content generated from the Markdown. Now it's time to generate the book using [PDF BoxLang module](https://boxlang.ortusbooks.com/boxlang-framework/modularity/pdf):

```js
bx:document format="pdf" filename="book.pdf" overwrite=true bookmarks=true {

	bx:documentitem type="header"  {
		bookTitle = globalData?.title ?: '';
		writeoutput('<p style="text-align:right;font-size:10px">#bookTitle#</p>')
	}

	htmlParts.each(part => {

		title = part.data?.title ?: 'No Title';
		bx:documentsection name=title  {
			writeoutput(part.contents);
		}
	});

	bx:documentitem type="footer"  {
		writeoutput('<p style="text-align:right;font-size:10px">Page #bxdocument.currentpagenumber# of 
#bxdocument.totalpages#</p>')
	}

}
```

I begin by adding the book title as a header to every page. Then I loop over each `htmlPart` element and just output the content. I use `documentsection` so I can create bookmarks for them. Finally, I add a page count. That's basically it. You can find the complete demo here: <https://github.com/ortus-boxlang/bx-demos/tree/master/misc/md_to_pdf>

To run this, you'll want to install the three required modules (BoxLang will soon support a way to make this easier), and then just `boxlang createBook.bxs`. Let me know what you think!