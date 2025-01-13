---
layout: post
title: "Simple Blog Example in Flask"
date: "2025-01-13T18:00:00"
categories: ["development"]
tags: ["python","flask"]
banner_image: /images/banners/cat_flask1.jpg
permalink: /2025/01/13/simple-blog-example-in-flask
description: A quick look at building an incredibly simple blog with Flask
---

As part of my efforts to improve my Python knowledge, I've been looking at the [Flask](https://flask.palletsprojects.com/en/stable/) framework for a way to build Python-backed web apps. I've only been looking at it for a short time, but I'm *really* impressed with how simple it is. In some ways, it reminds me a lot of when I first saw [Express](https://expressjs.com/). Before that, I wasn't sure I was going to like Node.js as it felt like a lot of work to build a simple app, but Express handled a lot of the boring parts. The same applies to Flask. To get an idea of how easy it is, here's the basic "hello world" from the [quickstart](https://flask.palletsprojects.com/en/stable/quickstart/):

```python
from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"
```

Once you've imported Flask and defined an app, you can then begin adding routes using decorators (the `@app.route` portion above) with the logic defined beneath it. In the example above, a simple HTML string is returned, but to use templates, you just switch to:

```python
@app.route("/")
def homepage():
	return render_template('index.html')
```

In this case, Flask with look in a `templates` folder for the file you specify, and make use of the [Jinja](https://jinja.palletsprojects.com/en/stable/) template language. Having never seen Jinja before this week, I had no trouble picking it up. All these various template languages have their own particular syntax and quirks and as far as I can tell, Jinja supports everything you could possibly need so it won't be a problem. 

So as I said, I'm real excited about Flask, and I thought I'd do what I usually do when learning a server-side framework, build a super simple "blog viewer" app. I'm saying "blog viewer" versus "blog" as I don't want to bother with a proper admin and CRUD editor for data, just something that:

* Renders the last X blog posts, ordered newest first
* Renders one blog post based on a URL parameter

Given this simple set of requirements, here's how I built it. 

## The Flask Application 

First, my application with a grand total of two routes defined:

```python
from flask import Flask
from flask import render_template

from blog import Blog 

app = Flask(__name__)
blog = Blog()

@app.route("/")
def homepage():
	posts = blog.getPosts()
	return render_template('index.html', posts=posts)

@app.route("/post/<string:slug>")
def post(slug):
	print(f"get post by slug, {slug}")
	post = blog.getPost(slug)
	return render_template('post.html', post=post)
```

The first route is the home page, and I used a simple `Blog` Python class to handle fetching my posts. (I'll show that at the end.) Note how `render_template` lets you pass arbitrary data to the template. You'll see that in use in a moment. 

For the second route, note the use of a variable portion. This is how Flask handles matching dynamic URL paths. You can validate in a few ways or keep it free form. In my case, I just wanted to match as a string to everything after the `/post/` portion. This portion, called a slug, is passed to my Blog class to fetch one particular post that then gets passed to the template. 

## The Home Page

Let's look at the first template, `index.html`:

```html
{% raw %}{% extends "layout.html" %}

{% block title %}My Blog{% endblock %}

{% block content %}
<h1>Latest Blog Posts</h1>

{% for post in posts[:10] | sort(attribute="datepublished", reverse=True) %}
	<p>
		<a href="{{ url_for('post', slug=post.slug) }}">{{ post.title }}</a> ({{ post.published }})<br/>
		{{ post.body | truncate(50) }}
	</p>
{% endfor %}
{% endblock %}{% endraw %}
```

The first line demonstrates layouts in Jinja. By extending my layout, I can define blocks, or variable content, that will get 'stuffed' into the template. In this case, my template supports a title and content. I used Jinja's looping construct to both filter to ten posts, sort by date, and reverse. As I type this, I literally realized a mistake - can you see it?

I'm *first* filtering by the first ten items in the array and then sorting, which means I will possibly get the wrong set of posts. I just changed it to apply the numerical filtering at the end and it worked!

```html
{% raw %}{% for post in (posts | sort(attribute="datepublished", reverse=True))[:2] %}{% endraw %}
```

That's a tad bit messy, but works. I only used 2 for a second and switched to 10 in the code I'll share in the repository.

Next, turn your attention to the links. Flask extends Jinja to add a `url_for` function (also available in your app code too of course) which abstracts away URL creation. This is useful in case you ever change your URLs in the future and don't want to update your HTML everywhere. You can read more about this in the [URL Building](https://flask.palletsprojects.com/en/stable/quickstart/#url-building) part of the Flask docs. Basically this code will look at my app code, find the `post` route, and figure out the URL to spit out. 

My layout uses a bit of Bootstrap, which honestly I've not used in a while and it's overkill here, but you can see how the blocks defined above are inlined in:

```html
{% raw %}<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
 	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
    <title>{% block title %}{% endblock %}</title>
 	{% block head %}
    {% endblock %}
  </head>
  <body>
    <main>{% block content %}{% endblock %}</main>
	<footer>
	<a href="/">Home Page</a>
	</footer>

	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js" integrity="sha384-0pUGZvbkm6XF6gxjEnlmuGrJXVbNuzT9qBBavbLwCsOGabYfZo0T0to5eqruptLy" crossorigin="anonymous"></script>
  </body>
</html>{% endraw %}
```

As an aside, it's possible to include default text in a block and a template can either add to, or replace, that default text. 

## Posts

For the second view, I just render a basic blog post like so:

```html
{% raw %}{% extends "layout.html" %}

{% block title %}{{ post.title }}{% endblock %}

{% block content %}
<h1>{{ post.title }}</h1>
<p>
Posted: {{ post.published }}
</p>

{{ post.body }}

{% endblock %}{% endraw %}
```

That's it. You could imagine a lot more here of course, comments, categories and tags and such, but this works for now.

## Blog Data

This isn't related to Flask itself, but for my blogs, I went with a simple class that read in a JSON file of data. I do a bit of manipulation including creating a slug for URLs and a proper date value for sorting.

```python
import json 
from slugify import slugify
from datetime import datetime 

class Blog:
	
	def __init__(self):
		with open("posts.json") as f:
			self.posts = json.load(f)

		for post in self.posts:
			post["slug"] = slugify(post["title"])
			post["datepublished"] = datetime.strptime(post["published"], '%m/%d/%Y')

	def getPosts(self):
		return self.posts

	def getPost(self, slug):
		for post in self.posts:
			if post["slug"] == slug:
				return post
```

I had considering firing up a quick database but this was a heck of a lot faster.

## Does it Work?

Of course it does! ;) Here's a quick view of my lovely UI:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/flask1.jpg" loading="lazy" alt="Image of blog home screen, list of posts" class="imgborder imgcenter">
</p>

And one more showing a post:

<p>
<img src="https://static.raymondcamden.com/images/2025/01/flask2.jpg" loading="lazy" alt="Image of blog, showing one blog post" class="imgborder imgcenter">
</p>

If you would like to see the complete source code, you can see it here: <https://github.com/cfjedimaster/pythondemos/tree/main/flask/flaskblog> 

One big question I have now is - how easy would it be to get this published? I asked about this on LinkedIn and got some suggestions, but I haven't yet had a chance to really investigate that yet. I'd love to hear your suggestions below, so leave me a comment!