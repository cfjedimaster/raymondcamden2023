---
layout: post
title: "Parsing CSV in BoxLang - Maven Style"
date: "2025-07-02T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/csv.jpg
permalink: /2025/07/02/parsing-csv-in-boxlang-maven-style
description: How to parse CSV in BoxLang, using a Java library loaded via Maven.
---

I recently did some CSV parsing in ColdFusion while working on my [ColdFusion 2025 Hackathon submission](https://www.raymondcamden.com/2025/06/13/my-coldfusion-2025-hackathon-submission-quicktracker), and while I didn't win, I really enjoyed the little utility I built. That tool made use of CSV parsing support in Adobe ColdFusion and I thought I'd take a look at what I'd need to use to support that in [BoxLang](https://boxlang.io). This led me to look for a Java tool and gave me a chance to try something new in BoxLang, Maven support.

BoxLang runs on the JVM, but doesn't really require you to know any Java. Which is good. I've been "casually" familiar with Java since it came out, but have never done any real work in it nor really spent any time learning the language. I know enough to know there's a huge amount of open source projects out there and for nearly all of them, you can grab a jar (think of this like a packaged zip), drop it in your server, and go to town. I [blogged](https://www.raymondcamden.com/2025/02/26/using-java-libraries-in-boxlang) about this back in February, but once you've gotten a jar, it can be as easy as this:

```js
rss = createObject("java", 
	"com.apptasticsoftware.rssreader.RssReader", 
	"rssreader.jar");
```

That works just fine, but BoxLang also supports [Maven](https://central.sonatype.com/) integration as well. Again, this is something I've been casually familiar with. In ways, it's a bit like Node's `package.json` support where you can define a dependency, run a command, and it will install a package along with any required dependencies of the package you want. In the Maven world, this is done via XML...  

<p>
<img src="https://static.raymondcamden.com/images/2025/07/eww.gif" alt="" class="imgborder imgcenter" loading="lazy">
</p>

Which I can get over. It's what's used in Java-world and if I'm going to play in Java-world, I got to get over it. 

BoxLang's [Maven support](https://boxlang.ortusbooks.com/getting-started/configuration/maven-integration) has really good documentation. If you've never even heard the word before, the docs walk you through installation and usage, and have a lot of great examples. While BoxLang runs on the JVM, folks can't expect to find every bit of Java documentation there as that would be a) distracting and b) repetitive of existing docs out there. However - I'm really grateful that the BoxLang team made an exception here and included documentation for working with Maven right within the docs. 

Ok, given all that, when I searched for CSV support in Java, I came across [opencsv](https://opencsv.sourceforge.net/index.html), and while digging around in the docs, found that I needed to add this to my BoxLang `pom.xml` file:

```html
<dependency>
    <groupId>com.opencsv</groupId>
    <artifactId>opencsv</artifactId>
    <version>5.11.2</version>
</dependency>
```

For me, that file was here: `~/.boxlang/pom.xml`. After pasting that in, I then ran `mvn install`, and it proceeded to grab the library and everything it needed. As I'm not running a server, just testing via the CLI, that was literally it. I got to testing.

First, I added a short CSV file:

```
"name","age"
"ray",52
"scott",90
"todd",45
```

And then using the opencsv docs, created a quick sample:

```js
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderHeaderAware;
import com.opencsv.exceptions.CsvException;
import java.io.FileReader;
import java.io.IOException;
import java.util.List;

path = "test.csv";
reader = new CSVReader(new FileReader(path));
allData = reader.readAll();

for(i=1;i<=allData.len();i++) {
	println("name=#allData[i][1]# age=#allData[i][2]#");
}
```

Those imports came right from the opencsv docs, trust me I didn't come up with them on my own. The `readAll` method returns an array of arrays where I can access each column by the inner array index. Here's the output:

```js
name=name age=age
name=ray age=52
name=scott age=90
name=todd age=45
```

Notice it included the header, which makes sense of course, and a simple solution would be to just skip row 1, but instead I did the unthinkable and continued to look at the docs. Turns out the library has a `CSVReaderHeaderAware` method that not only will ignore the header in it's results, but use the header to create an array of objects instead of an array of arrays. Well, if you do a bit of work. Here's a 8 line UDF wrapper:

```js
function readCSV(path) {
	reader = new CSVReaderHeaderAware(new FileReader(path));
	result = [];
	while(row = reader.readMap()) {
		result.append(row);
	}
	return result;
}
```

Running `allData = readCSV('test.csv')` now returns:

```js
[{name=ray, age=52}, {name=scott, age=90}, {name=todd, age=45}]
```

As an FYI, BoxLang 1.3.0 added a 'pretty' argument to `jsonSerialize`, if I use:

```js
println(jsonSerialize(data=allData, pretty=true));
```

I get:

```
[ {
  "name" : "ray",
  "age" : "52"
}, {
  "name" : "scott",
  "age" : "90"
}, {
  "name" : "todd",
  "age" : "45"
} ]
```

Easy-peasy! I've got a real world use case for this (more than just supporting my bug tracker hackathon application) that I'll share in my next post.

Photo by <a href="https://unsplash.com/@kommumikation?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Mika Baumeister</a> on <a href="https://unsplash.com/photos/white-printing-paper-with-numbers-Wpnoqo2plFA?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      