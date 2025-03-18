---
layout: post
title: "BoxLang Quick Tips - PDF Generation"
date: "2025-03-18T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/blqt_pdf.jpg
permalink: /2025/03/18/boxlang-quick-tips-pdf-generation
description: How to easily generate PDFs with BoxLang.
---

Today's [BoxLang](https://boxlang.io) quick tip is one near and dear to my heart, generating PDFs. Creating dynamic, expressive PDFs is fairly easy. Let me show you how. As before, I've got a video version as well so you would rather watch that, just skip to the end. 

## Step One - The Module

By default, BoxLang doesn't ship with PDF capabilities built-in, you need to add it via the [PDF Module](https://boxlang.ortusbooks.com/boxlang-framework/modularity/pdf). This can be done quickly via the CLI:

```
install-bx-module bx-pdf
```

Installing the module adds three new tags to your BoxLang runtime:

* bx:document - This is the core tag for PDF generation. Everything inside it will either be content or directives (see the items below) to control what's produced.
* bx:documentitem - This is used to specify page breaks or header and footer content.
* bx:documetnsection - This lets you create logical sections to a larger PDF document, allowing for section specific page numbers, headers and footers, and so forth.

Check the [docs](https://boxlang.ortusbooks.com/boxlang-framework/modularity/pdf) for full syntax information.

## Step Two - Make a PDF

How about the simplest demo possible?

```html
<bx:document filename="test1.pdf" overwrite=true>

	<h2>Hello World</h2>
	
	<p>
	This will be a PDF. Enjoy!
	</p>

</bx:document>
```

In this example, the template will use the content within, static HTML, and save it to `test1.pdf`. Note the use of `overwrite=true`. Without it, you would get an error if you run the code again. You can actually skip saving the data to the filesystem and instead store the binary data by using the `variable` attribute instead. 

And the result:

<iframe src="https://static.raymondcamden.com/images/2025/03/test1a.pdf#navpanes=0" width="100%" height="400"></iframe>

We can make it a bit more interesting by adding some media. Consider this:

```html
<bx:document filename="test2.pdf" overwrite=true localUrl=true>

	<h2>Hello World</h2>
	
	<p>
	This will be a PDF. Enjoy!
	</p>

	<p>
	<img src="./cat.jpg">
	</p>

	<p>
	Photo by <a href="https://unsplash.com/@dariasha911?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Daria Shatova</a> on <a href="https://unsplash.com/photos/white-and-brown-cat-lying-on-brown-wooden-floor-46TvM-BVrRI?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
    </p>

</bx:document>
```

Note that I'm using a local image, `cat.jpg`, and in order for the BoxLang PDF tool to find it, I added `localUrl` to the tag. This generates pretty much what you would expect - a PDF with a cat picture. (Which improves every PDF I've found.)

<iframe src="https://static.raymondcamden.com/images/2025/03/test2.pdf#navpanes=0" width="100%" height="600"></iframe>

Ok, so far, these have been static, simple PDFs. How about a more complex example? Consider this script:

```html
<bx:script>
seed = [
	{name:'Raymond Camden', title:'Jedi Evangelist', salary: 300000, location:'Lafayette, Louisiana'},
	{name:'Todd Sharp', title:'Ninja Advocate', salary: 425000, location:'Atlanta, Georgia' },
	{name:'Scott Stroz', title:'Giant Evangelist', salary: 400000, location:'West By-God Virginia' },
	{name:'Brian Rinaldi', title:'Uberino Advocate', salary: 350000, location:'Seattle, Washington' },
];
</bx:script>

<bx:loop array="#seed#" item="person">
<bx:document filename="#slugify(person.name)#.pdf" overwrite=true localUrl=true>
	<bx:output>
	<h2>Employment Offer</h2>

	<p>
	Hello #person.name#,
	</p>

	<p>
	We are pleased to offer you a job as #person.title# at the salary of #currencyFormat(person.salary)#.
	</p>

	<p>
	You will work out of our #person.location# office.
	</p>

	<bx:documentitem type="pagebreak">

	<p>
	Boring legal stuff here no one will read.
	</p>

	<bx:documentitem type="footer">
	Generated at #dateformat(now(),"short")#.
	</bx:documentitem>
	</bx:output>
</bx:document>

</bx:loop>

Done generating PDFs.
```

I begin with a bit of data, hard-coded, but obviously could have come from a database or API call. It's got an array of people including names, titles, salaries, and locations. For each of the people, I want to create a unique, dynamic PDF. To do so, I use the built-in [slugify](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/string/slugify) function on the name. 

Inside the PDF, you can see the use of pound-wrapped variables for my dynamic content. I then use `documentitem` to create a page break for the second bit of content, legal information no one will read.

Finally, I use `documentitem` again to create a dynamic timestamp value in the footer. And here's one of the results:

<iframe src="https://static.raymondcamden.com/images/2025/03/raymond-camden.pdf#navpanes=0" width="100%" height="600"></iframe>

You can find these demos, and the PDF results, in the BoxLang demos repo here: <https://github.com/ortus-boxlang/bx-demos/tree/master/boxlang_quick_tips/pdf>

Enjoy the video version below:


{% liteyoutube "zF5uwOgek7E" %}
