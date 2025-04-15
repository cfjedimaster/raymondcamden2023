---
layout: post
title: "BoxLang Quick Tips - Working with JSON"
date: "2025-04-15T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/blqt_json.jpg
permalink: /2025/04/15/boxlang-quick-tips-working-with-json
description: Working with JSON features in BoxLang
---

Welcome to another [BoxLang](https://boxlang.io.) quick tip - today I'm going to focus on working with JSON in BoxLang. Now, as you can probably guess, JSON is natively supported and supports what you would expect, going to and from JSON, but there's some particularities of the support that may interest you, so I've dug into it. As with my other quick tips, you can skip to the video version at the bottom if you prefer. 

## The Basics

Converting data to JSON can be done two ways, either via the built in function (BIF) `jsonSerialize` or the member function `toJSON`. There's no difference here, just use what makes sense for you:

```js
name = "Raymond";
age = 52;
hobbies = ["beer","books","movies","video games","cats"]

// going TO json...
println("Testing serialization of variables:");
println(jsonSerialize(variables));
println('-'.repeat(80));
println(variables.toJSON());
```

As a reminder, `variables` is a [scope](https://boxlang.ortusbooks.com/getting-started/overview/syntax-style-guide#scopes) in BoxLang. 

Going *from* JSON can also be done two ways, either via `jsonDeserialize` or `fromJSON`:

```js
println("Testing deserialization of JSON:");
// coming FROM json...
json = variables.toJSON();
newData = jsonDeserialize(json);
println(newData);
println('-'.repeat(80));
newData = json.fromJSON();
println(newData);
```

This is all pretty simple and straightforward, but you can test it yourself below:

<iframe
        allow="fullscreen" 
        width="100%"
        height="800" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJx9UMFKAzEQvecrQi7dgqYiCOLSW%2FEg6ELbm3iYdKdr2k2mJGFFv95MqWFl0dNk5r158148OJRLqdbw6ci3qhbQ8eDuthbvZIzFmLtXZRCDulKG6BhzdTRkJD8G2yLJLqtwt4MU1ZsQi4XsyPpObht5iOS11uIUrE%2B9r9QWY2IsYrDQ2y9IlrykvRwgD0yP8UHN68Ln%2Fc2FilXhzEeU2fVMBzwhpOr%2BZgwUtk70tGleKgbF33tTky1ObLLQ2WFOuSPHrMd181yCcs1%2FNr1dC48fK0iQUSatijaeU46MX4j%2FZfytpfeB3M%2BZqco3V6GfaA%3D%3D">
    </iframe>

## Queries are Different...

So far so good. Queries in BoxLang serialize a bit differently than you may expect. This is based on past behavior in ColdFusion and represent the 'special' nature of queries as a proper data type in the language. Let's look at an example. First, here's our query:

```js
people = queryNew("name,age,rank", "varchar,integer,varchar", [
	{"name":"Raymond Camden", "age": 52, "rank":"nerd"},
	{"name":"Jacob Camden", "age": 25, "rank":"uber nerd"},
	{"name":"Susie Smith", "age": 46, "rank":"jedi"},
	{"name":"Carol Green", "age": 63, "rank":"samarai"},

]);
```

When you convert this to JSON, you can pass an argument to define how it's serialized. There's two values, `row` and `column`, with `row` being the default. Here's how the JSON looks when using `row`:

```js
{
	"columns": [
		"name",
		"age",
		"rank"
	],
	"data": [
		[
			"Raymond Camden",
			52,
			"nerd"
		],
		[
			"Jacob Camden",
			25,
			"uber nerd"
		],
		[
			"Susie Smith",
			46,
			"jedi"
		],
		[
			"Carol Green",
			63,
			"samarai"
		]
	]
}
```

As you can see, you get a value representing the columns of the query and then a `data` array where each element itself is an array of values that match the same order of columns.

To use the `column` format, you would pass it like so:

```js
people.toJSON("column");
```

Which returns the information like so:

```js
{
	"rowCount": 4,
	"columns": [
		"name",
		"age",
		"rank"
	],
	"data": {
		"name": [
			"Raymond Camden",
			"Jacob Camden",
			"Susie Smith",
			"Carol Green"
		],
		"age": [
			52,
			25,
			46,
			63
		],
		"rank": [
			"nerd",
			"uber nerd",
			"jedi",
			"samarai"
		]
	}
}
```

As you can see, each element in `data` now maps to a column with the value being an array of items for each row. You can see it for yourself below:

<iframe
        allow="fullscreen" 
        width="100%"
        height="800" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJyN0MFOg0AQBuCzPMVkLkCytqbaxtB46sGkhxrlaDxMYaQo7OKwSBrju7ugLZh68Lab%2Fb%2F5s1OxqQqGG3hrWPYbbgPUVLKijJWQfkUF%2BE6S7EhUri1nLOrn7p4evbOPPo8RPtC%2BNDqFFZUp6865GRjBfOaO%2FagINUuKn2qk1pSY7YmZzQfTbFngFMZNnTPEZW53g7taDO6F0%2Fw3WZGYAm6Fx1WLy4HUVJJQr7yncOl5lbg%2FFzrA%2B247YA2s47sNtK4UUn6mprBQs7W5ziJ04JCv%2Bq1OrOniAYppMQyXMJ0e1DHpn%2FsT4YrJBtcX4WjEX5V%2BYoqm1P5%2FOr%2BjXa33BUhel3M%3D">
    </iframe>

I'm not a fan of this output, but as I said, it matches how ColdFusion serialized queries so I get it. Luckily, it's also really trivial to use another format. Query objects have a member function, `toArrayOfStructs`, that converts the query object to, wait for it... an array of structs. I *much* prefer this 'shape' and even if I'm not using JSON will add this to my code getting database information. I could use this with the `people` query like so:

```js
people.toArrayOfStructs().toJSON()
```

You can try this below:

<iframe
        allow="fullscreen" 
        width="100%"
        height="800" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJxl0M9LwzAUB%2FCz%2FSvCuyyFbMh0QyoeZAdhhw0snsTDW%2FvsMpsfvqZKEf93s6K0c7ck3%2Ff5hsST8zWJO%2FHeEncb%2BpRg0ZDCihSjfQMl4AO52CMrbQNVxOp3H6Pn5OKrn4cMHrEzzpZihaYke3SxAzKxmMdlX5WBJS7hW43UGgu3OzPzxWDaHbE4h3nbaBK50WE%2FuOvl4A5U6lOyQna1eGAaX7W8GkiDBhl7lbykt0niOb65tnIyncyYPGGQN5dpTP4CeGq0rURw98zYbV%2FzwG0RmgxGM77%2F4tn%2FGZnGo3W%2B3chj4Q8UHXmR">
    </iframe>

## Validating JSON

You can also check if a string is valid JSON first with `isJSON`:

```js
x = ["foo","moo","goo"];

println("is x itself json? #isJson(x)#");

j = x.toJSON();
println("is j json? #isJson(j)#");
```

This works as expected - with the first check returning false and the second true:

<iframe
        allow="fullscreen" 
        width="100%"
        height="800" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJyrULBViFZKy89X0lHKBZPpQDLWmouroCgzryQnT0Mps1ihQiGzpDg1J00hqzg%2Fz15BObPYC8jQqNBUVtIEKs0CGlKhV5LvFezvpwEUQNaahaYnC6IHAJatI%2FA%3D">
    </iframe>

## Put Some Lipstick On It!

Finally, you can 'pretty' up your JSON printing with... `jsonPrettify`:

```js
name = "Raymond";
age = 52;
hobbies = ["beer","books","movies","video games","cats"]

j = jsonSerialize(variables);
println(jsonPrettify(j));
```

Given the data above, you get this in your output:

```js
{
  "hobbies" : [ "beer", "books", "movies", "video games", "cats" ],
  "name" : "Raymond",
  "age" : 52
}
```

Try it yourself below:

<iframe
        allow="fullscreen" 
        width="100%"
        height="800" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJwVTDsOAiEQ7TkFmYpNrEysiHcwWhqLwR3XQWAMEJL19A7V%2B7%2BCmezZwhX3LGUFb3CbxunozVtCYGqq7hCIKhwgiHyaYpahiZLBK4nd9GWqJ%2FYGD2OibmKTcqPKmPhHbqCykKgt3nwrl56Km41Lpd75tbu4aPIHelEuQA%3D%3D">
    </iframe>

That's it. Let me know if you've got any questions, and enjoy the video version below:

{% liteyoutube "Ar_fh9tYRl4" %}