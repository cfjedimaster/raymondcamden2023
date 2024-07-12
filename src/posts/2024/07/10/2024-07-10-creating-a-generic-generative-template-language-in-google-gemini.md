---
layout: post
title: "Creating a Generic Generative Template Language in Google Gemini"
date: "2024-07-10T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_paper_magic.jpg
permalink: /2024/07/10/creating-a-generic-generative-template-language-in-google-gemini
description: Using generative AI to replace tokens in strings.
---

I've been a fan of 'random text' for some time. "Random text" is a bit vague, but to me the idea of using code to generate random stories, or even snippets, is fascinating. Back in April, I [blogged](https://www.raymondcamden.com/2024/04/02/all-your-dragons-are-belong-to-us) about how I created short dragon-based stories. It took a generic string:

<blockquote>
A #adjective# dragon lives #place#. She #verb# her hoard, which consists of a #number# of #thing#, #number# of #thing#, and #number# of #thing#. She feels #feeling#.
</blockquote>

And created a story by replacing the pound-wrapped tokens with real words. I used a couple of different tools to build this, but the core one was a cool little Node library named [random-word-slugs](https://www.npmjs.com/package/random-word-slugs). It's a powerful random word library that can get pretty specific in terms of focusing on a particular type of word. For example, here's the code I use to generate an adjective for the dragon focused on three aspects - color, appearance, and personality:

```js
const getDragonType = function() {
  const options = {
    format:'lower',
    partsOfSpeech: ['adjective'],
    categories: {
      adjective: ['color','appearance','personality']
    }
  }
  
  return randomWordSlugs.generateSlug(1, options);
}
```

I was curious if I could take this approach and build it with generative AI. Here's what I found.

## Version One

For my first version, I opened up [Google AI Studio](https://aistudio.google.com), started a new prompt, and used these system instructions:

<blockquote>
{% raw %}You are a text parser. Given a prompt with variables wrapped in {{ and }}, you will replace that with a value based on the contents of the text inside the brackets. So for example, {{noun}}, means to replace it with a random noun, and {{animal}}, means to replace it with a random animal.{% endraw %}
</blockquote>

With this in place, I then did a test:

<blockquote>
{% raw %}This is a story about a {{noun}}. It was colored {{color}} and liked to eat {{food}}. On the weekend, it liked to do {{activity}}.{% endraw %}
</blockquote>

Which gave me:

<blockquote>
This is a story about a tree. It was colored blue and liked to eat pizza. On the weekend, it liked to do skydiving. 
</blockquote>

Not bad. Then I decided to push it a bit:

<blockquote>
{% raw %}I like to eat {{food}}. But sometimes when I eat it, I feel {{sad feeling}}. My favorite holiday is {{holiday}}. My favorite song is {{song}}.{% endraw %}
</blockquote>

I was curious how well it would handle `sad feeling` and `holiday`. I got this:

<blockquote>
I like to eat ice cream. But sometimes when I eat it, I feel guilty. My favorite holiday is Christmas. My favorite song is Bohemian Rhapsody. 
</blockquote>

This was kind of shocking how close it was to my own personal answers. ;) I changed `sad feeling` to `happy feeling` and got this:

<blockquote>
I like to eat pizza. But sometimes when I eat it, I feel happy. My favorite holiday is Thanksgiving. My favorite song is Imagine. 
</blockquote>

Finally, I decided to *really* push it:

<blockquote>
{% raw %}I like to eat {{food}}. But sometimes when I eat it, I feel {{weird feeling}}. My favorite holiday is {{holiday}}. My favorite song is {{song by The Cure}}.{% endraw %}
</blockquote>

It had no problem with specific song token:

<blockquote>
I like to eat sushi. But sometimes when I eat it, I feel disoriented. My favorite holiday is Halloween. My favorite song is Friday I'm In Love by The Cure. 
</blockquote>

Pretty impressive. But then I decided to push more...

## Version Two

In the past, I worked with a library that could generate a random word and then remember it for reuse later. [Tracery](https://github.com/galaxykate/tracery?tab=readme-ov-file) had a feature where it could select a random word, but then remember the chosen word for use again later. I decided to see if I could get that working with Gemini. I updated the system instructions like so:

<blockquote>
{% raw %}You are a text parser. Given a prompt with variables wrapped in {{ and }}, you will replace that with a value based on the contents of the text inside the brackets. So for example, {{noun}}, means to replace it with a random noun, and {{animal}}, means to replace it with a random animal. You also support storing and remembering values. If the string inside the brackets contains a colon, the value after the colon is the name of a variable. So for example, {{noun:itemX}} means to select a random noun and insert it into the result, but also store the value in a variable named itemX. If I use {{itemX}} again, you will use the previous value.{% endraw %}
</blockquote>

And again, it worked really dang well. I started with:

<blockquote>
{% raw %}My first name is {{first name:identity}}. Say hi to me, my name is {{identity}}.{% endraw %}
</blockquote>

And got:

<blockquote>
My first name is Sarah. Say hi to me, my name is Sarah. 
</blockquote>

I then tried:

<blockquote>
{% raw %}My first name is {{first name:fname}}. My last name is {{last name:lname}}. I write my formally as {{lname}}, {{fname}}. My favorite color is {{color}}.{% endraw %}
</blockquote>

I tried this twice and got:

<blockquote>
My first name is David. My last name is Smith. I write my formally as Smith, David. My favorite color is blue. 

My first name is Emily. My last name is Jones. I write my formally as Jones, Emily. My favorite color is green. 
</blockquote>

As a last test, I tried the Dragon example above, replacing pounds with double brackets, and it did an admiral job:

<blockquote>
A fiery dragon lives in a cave beneath a mountain. She guards her hoard, which consists of a thousand of gold coins, five hundred of precious gems, and a hundred of magic artifacts. She feels content. 
</blockquote>

I see two issues here. One, I should remove `of`. Second, I'd be willing to bet the `place` token will consistently be things relevant to dragons. I did a few more tests and it definitely seemed that way:

<blockquote>
A sleepy dragon lives in a cozy cave. She snuggles her hoard, which consists of a thousand feather pillows, five hundred soft blankets, and a hundred stuffed toys. She feels comfortable.
</blockquote>

So on a whim, I tried changing {% raw %}`{{place}}` to `{{any place, not just one a dragon would like}}`{% endraw %}. And wow, I got some impressive results. Here's one:

<blockquote>
A sparkly dragon lives in a crowded library. She organizes her hoard, which consists of a thousand books about dragons, five hundred maps of forgotten kingdoms, and a hundred ancient scrolls. She feels knowledgeable.
</blockquote>

What impresses me is that the items seem to make sense for the place. I guess that's expected, but I wouldn't have been able to do that with the Node library I used. 

## Can You Use This?

Normally when I blog about Gemini and GenAI stuff, I have a code demo to go along with what I demonstrate in the website, but honestly, I don't think it would add much. I have to say, barring issues with the price of the API call, I think I would *absolutely* use a solution like this if I needed to generate a random string according to a template. I suppose it makes sense, this **is** generative AI after all, but I didn't expect it to work so well. Let me know what you think.