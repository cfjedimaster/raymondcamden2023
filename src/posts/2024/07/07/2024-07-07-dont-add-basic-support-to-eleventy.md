---
layout: post
title: "(Don't) Add BASIC Support to Eleventy"
date: "2024-07-07T18:00:00"
categories: ["javascript","jamstack"]
tags: ["eleventy"]
banner_image: /images/banners/cat_punchcards.jpg
permalink: /2024/07/07/dont-add-basic-support-to-eleventy
description: A bad idea. A very, very bad idea.
---

So yesterday I [wrote](https://www.raymondcamden.com/2024/07/06/add-squirrelly-support-to-eleventy) up the process of adding the [Squirrelly](https://squirrelly.js.org/) template language to [Eleventy](https:/11ty.dev). It was, essentially, five minutes of work due to how well Eleventy supports adding custom languages. After writing it up, publishing it, and running some errands, a really bad and silly idea came to me... what if I added BASIC support to Eleventy?

Way back in the Stone Age, my first computer language was Applesoft BASIC on an Apple 2e (or +, not sure). Just look at this rad machine and imagine it paired with a monochrome green monitor:

<p>
<img src="https://static.raymondcamden.com/images/2024/07/basic1.jpg" alt="Apple 2e" class="imgborder imgcenter" loading="lazy">
<figcaption>By Bilby - Own work, CC BY 3.0, https://commons.wikimedia.org/w/index.php?curid=11119727</figcaption>
</p>

I wrote a *lot* of programs on that machine, most typed by hand from the pages of various programming magazines like "Family Computing". BASIC wasn't a very powerful language and I didn't even have a proper editor, but it's where I got my love of programming and therefore it absolutely occupies a warm place of my heart. 

Because of this, I've played around with some modern implementations of it, including [jqbasic](https://github.com/inexorabletash/jsbasic/), a JavaScript interpreter. With that, I built things like a [`<applesoft-basic>`](https://www.raymondcamden.com/2022/10/04/web-component-experiment-manipulating-inner-text) web component and even a [severless API](https://www.raymondcamden.com/2017/08/01/serverless-basic). I wouldn't recommend actually using either of those projects nor would I recommend implementing what I'm about to show - BASIC support in Eleventy.

As I described in [yesterday's post](https://www.raymondcamden.com/2024/07/06/add-squirrelly-support-to-eleventy), you need two functions within your Eleventy configuration file. One to make Eleventy recognize and process the file extension:

```js
eleventyConfig.addTemplateFormats('bas');
```

And then the call to implement the actual logic:

```js
let basic = require('./applesoftbasic.js').basic;

eleventyConfig.addExtension('bas', {

    compile: async (inputContent) => {

        return async (data) => {

            let result = '';
            let program = basic.compile(inputContent);
    
            program.init({
                tty: {
                    getCursorPosition: function() { return { x: 0, y: 0 }; },
                    setCursorPosition: function() { },
                    getScreenSize: function() { return { width: 80, height: 24 }; },
                    writeChar: function(ch) { 
                        result += ch;
                    },
                    writeString: function(string) { 
                        result += string+'\n';
                    },
                    readChar: function(callback) {
                        callback('');
                    },
                    readLine: function(callback, prompt) {
                        callback('');
                    }
                }
            });
    
            let driver = function() {
                var state;
                do {
                    try {
                        state = program.step(driver);
                    } catch(e) {
                        console.log('ERROR!',e);
                        return {
                            error:e
                        }
                    }
                    // may throw basic.RuntimeError
                } while (state === basic.STATE_RUNNING);
            }
            driver(); // step until done or blocked
    
            return result;

        };
    },
});
```

Most of the code there is the configuration to the JavaScript library to help it work in "headless" mode. Ie, just process the code, don't wait for input, and return the output. And surprise surprise, it works:

```
10 print "<h1>Hello"
20 print " Word</h1>"
30 goto 100
40 print "never gonna show up"
100 print "<hr>"
110 print "<p>BASIC to HTML</p>"
120 x$ = "moo"
130 print x$
```

When Eleventy runs, this outputs:

```html
<h1>Hello

 Word</h1>

<hr>

<p>BASIC to HTML</p>

moo
```

You can even include frontmatter as Eleventy will parse it first:

```
---
layout: main
---

10 print "<h1>Hello"
20 print " Word</h1>"
30 goto 100
40 print "never gonna show up"
100 print "<hr>"
110 print "<p>BASIC to HTML</p>"
120 x$ = "moo"
130 print x$
```

What doesn't work is passing data to the BASIC template. You've got two main ways of using data in BASIC programs. Either define it using lines of code or use READ/DATA. The former would only work if I required developers to start at, say, line 100, and then I'd copy all the data to lines of code starting at line 1 and then incrementing. BASIC supports numbers, strings and arrays, but not, as far as I know, an object of key-value pairs. So stuff like `site.name` wouldn't work. Again, as far as I know. READ/DATA would require having an ordered set of data that you knew of ahead of time and would just end up being a mess.

I'm sure it's possible, but, I decided I was being silly enough so I stopped where I was. 

The code you absolutely positively do not want to use may be found here: <https://github.com/cfjedimaster/eleventy-demos/tree/master/basic>

