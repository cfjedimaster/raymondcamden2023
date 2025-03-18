---
layout: post
title: "BoxLang Quick Tips - Database Access"
date: "2025-03-11T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/blqt_db.jpg
permalink: /2025/03/11/boxlang-quick-tips-database-access
description: A new series of quick tips for BoxLang developers.
---

Today I'm kicking off a new blog/video series of quick tips for people interested in [BoxLang](https://boxlang.io). These 'quick tips' are just that, a look at how BoxLang can simplify working with the JVM and building CLI scripts, web apps, and serverless applications. Each of these posts will include a video along with sample code and help highlight some of the ways BoxLang can be powerful in just a few lines of code. 

For my first quick tip, let's talk database access, which by the way was one of the reasons I got into ColdFusion nearly thirty years ago (I didn't want to figure out how to do it in Perl!). Working with databases in BoxLang can be done in a few steps.

## Step One - The Driver

To work with a database, you need a driver, and that can be done via BoxLang modules, which are easily installed at the command line. There's a lot of [modules](https://boxlang.ortusbooks.com/getting-started/installation/modules#jdbc-modules), but for MySQL, you can simply do:

```bash
install-bx-module bx-mysql
```

This is a one time operation and takes a few seconds.

## Step Two - Define Your Connection

In order to work with a database, your code needs to know how to connect to a database. That includes things like a server URL, username, and password, and sometimes additional configuration information. Depending on what your doing with BoxLang, you've got a few options on how to do that. For web apps, you can define 'datasources' at the application level so all your scripts and services can execute queries. For a command line script, or a quick ad hoc connection, you can also define the connection inline. Let's consider that. First, I'll define my connection:

```js
dsn = {
	driver:"mysql",
	host:"192.168.68.50",
	port:3306,
	database:"blog", 
	username:server.system.environment.MYSQL_USERNAME,
	password:server.system.environment.MYSQL_PWORD
};
```

This should all be self-explanatory, but I'll note I'm grabbing my credentials from the environment. 

Next, I'll do a simple query and pass this along inline. Again, in a web app, this could be done at a higher level and not needed again.

```js
posts = queryExecute("select title, posted from posts limit 10", { }, { datasource:dsn });
```

In the code above, `queryExecute` runs SQL and uses the datasource information for it's connection. The second empty argument there is used for bound params which are simple SQL doesn't need.

## Step Three - Outputting the Data

The last step is how to output the information, and obviously that depends on your particular needs, but in the theme of keeping it simple, you can treat the result as an iterable and simply loop over it:

```js
for(post in posts) {
	println('#post.title# written on #post.posted#');
}
```

There are multiple other ways to output the data as well, for example, as JSON when called as an API. 

That's it! Database access and output in your code in *minutes*. Enjoy the video version below:

{% liteyoutube "8N0VHRYmhms" %}