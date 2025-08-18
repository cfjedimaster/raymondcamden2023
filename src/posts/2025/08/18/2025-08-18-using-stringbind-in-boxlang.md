---
layout: post
title: "Using StringBind in BoxLang"
date: "2025-08-18T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/piano_strings.jpg
permalink: /2025/08/18/using-stringbind-in-boxlang
description: An example of the StringBind function.
---

Ok, to be honest, this is going to be a pretty lightweight post as it's about a simple little string function in [BoxLang](https://boxlang.io), but as I discovered it rather recently and was intrigued by what it did. 

So first off - how did I find this? In the BoxLang docs, there's a whole section on built-in functions and a subcategory just for [string](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/string). I was looking it over and realized there were quite a few that I had not known existed. There are some interesting ones in there like [pascalCase](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/string/pascalcase) and [snakeCase](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/string/snakecase). I was pretty sure I knew exactly how these worked, but I went ahead and built a quick demo that demonstrates both:

<iframe
        allow="fullscreen" 
        width="100%"
        height="600" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJx9jLEKwjAQQPd8xZEMbUH8AamLCg7BgggO4nC0FxqMSUliHcR%2FN7ZQQcTh4N7x7mnb3WKAEk4MgLdkjIO786bhs%2Fdhu5GyOlZ7uR5ZaR8i7PBKI0tMaCdU2DuvI4FyruHszJge%2BnPCus2HHcolPJLbeW2jsTk%2FtAQdhhrNCgNBTz5oZ8EpEMODAB1AfIwxUwheLL4zweKF%2FlUm4XckyxI%2B07wAp7hXAw%3D%3D">
    </iframe>

Ok, that works well enough, but let's talk [StringBind](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/string/stringbind). StringBind lets you create a string that acts as a template, letting you pass data and re-evaluate the result every time. 

Now, on one hand, you may be wondering why that's necessary, as BoxLang already has a template language support baked in. As a trivial example:

```js
name = "Raymond";
age = 52;

println("My name is #name# and I am #age# years old.");
```

This works, but is also a one time operation. What I mean is, as soon as you use that string (in my case I printed it, but I could have saved it as well), you can't re-evaluate it. Now typically that also isn't necessary an issue, as you can simply keep creating new versions in a loop or some such:

```js
people = [{name:"Raymond", age:52}, {name:"Lindy", age: 45}];

people.each(p => println("My name is #p.name# and I am #p.age# years old."));
```

But what `StringBind` gives us is a more abstract way to create a template and re-use it. It begins with a different definition of variable tokens. Instead of pound signs, you wrap tokens with `${name}` where the item inside represents a token named `name`. You can also define tokens with default values, `${name:Nameless}`. The name of your token doesn't necessarily need to a valid variable name, so for example, this is allowed as well: `${full name}`, which could perhaps be more readable than `fullName`. 

Using this feature requires you to define the template, duh, and than call it with `stringBind` where you'll pass the template and data:

```js
str  = """
This is a big string with ${name} and ${age}. My favorite food is ${food:sushi}.
"""

s = stringBind(str, {
  "name":"Ray",
  "age":52
})
```

The template is passed first, the structure of data second. Note that I didn't pass `food` so it should default. The result is as you expect: `This is a big string with Ray and 52. My favorite food is sushi.`. Obviously passing `food` will change the result:

```js
s = stringBind(str, {
  "name":"Ray",
  "age":52,
  "food":"nature valley bars"
})

println(s);
```

This gives: `This is a big string with Ray and 52. My favorite food is nature valley bars.`

You can try this yourself below:

<iframe
        allow="fullscreen" 
        width="100%"
        height="600" 
        src="https://try.boxlang.io/editor/index.bxm?ro=false&code=eJyVjjEKwzAMRXef4iMyJBAyFLqkdOnepfQCCnESQ%2BoUy0kxwXev3W7dChqe%2BNKTxDvgDCJS98kIUjE6M0K8M3bEy%2FgJxW75oSPY9ol51LHBNWDgbXHGawzL0ufNYs%2FUyiqTiY3KUiXJ%2FnVdjO3LhDV2BVBWUks3DlTnPmmpPR5UrJR6pnk%2F21Kq0%2F%2BGD%2BdHUmbZr05j43nWAR07od8Db2W%2FTjQ%3D">
    </iframe>

Ok, so fair enough to say, this is one of those functions I don't see using day to day, but I thought it was a pretty cool idea and something I want to keep in my (BoxLang-ified) tool belt for use later. What do people think? I'd love to hear some ideas of how this could be useful, so leave me a comment below!

Photo by <a href="https://unsplash.com/@stevenvanelk?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Steven Van Elk</a> on <a href="https://unsplash.com/photos/a-close-up-view-of-a-piano-strings-UYQcJG1TbiA?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      