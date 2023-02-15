---
title: Raymond Camden
layout: main
---

<h2>Home Page</h2>

{% assign posts = collections.posts | reverse %}

{% for post in posts limit:10 %}

	<p>
	<a href="{{ post.url }}">{{ post.data.title }}</a><br/>
	</p>
	{% excerpt post %}

{% endfor %}
