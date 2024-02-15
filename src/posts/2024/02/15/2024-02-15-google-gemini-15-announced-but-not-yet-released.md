---
layout: post
title: "Google Gemini 1.5 Announced (and more new features)"
date: "2024-02-15T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/cat_pretzels.jpg
permalink: /2024/02/15/google-gemini-15-announced-but-not-yet-released
description: A look at new Gemini updates coming soon.
---

In general I don't tend to blog about stuff that isn't quite out yet, but as I've got early access (and permission to share), and as it's pretty darn cool, I thought I'd share. Plus, some of the new stuff is available to everyone, so you can try it out as well! Today, Google introduced its newest language model, Gemini 1.5. You can, and probably should, read the marketing/nicely polished intro by Google [here](https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/), but I thought I'd share some highlights and examples here. I've had access to this for a grand total of four hours so please consider this my first initial impressions. As the title says, this is not yet released, but you can [sign up](https://aistudio.google.com/app/waitlist/97445851) for the waitlist now. Also, right now this is AI Studio only and not available via API. 

While the [introductory post](https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/) covers everything that was added, there are a few changes I'd like to specifically call out.

# File handling, and Video Support

Probably the biggest change is the ability to handle files and folders. Video support is *only* available in the new model so it's not publicly available yet, but files and folders can be used by anyone now. This is available within Studio right at the top:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gem1.jpg" alt="New options to upload videos, files, and folders." class="imgborder imgcenter" loading="lazy">
</p>

Note that files and videos can *not* be drag/dropped into the interface and you have to use those buttons on top. But once you do, you can then start writing prompts. I dropped a PDF copy of Hamlet and asked for a summarization as well as the themes:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gem2.jpg" alt="Prompt: Summarize the major plot points of this PDF and describe the theme." class="imgborder imgcenter" loading="lazy">
</p>

I haven't read Hamlet since college but honestly, I liked what it output. By the way, the output was in Markdown and I've copied it as is here so the markup came from them. Oh, um, spoiler warning for a four-hundred-year-old play.

<div style="background-color: #c0c0c0; padding: 10px">

## Major Plot Points of Hamlet:

**Act 1:**
* The ghost of Hamlet's father appears, revealing he was murdered by Claudius, Hamlet's uncle.
* Hamlet vows revenge but begins to feign madness to investigate the truth.
* Polonius believes Hamlet's madness stems from unrequited love for Ophelia.

**Act 2:**
* Hamlet tests Claudius's guilt by staging a play mirroring the murder. Claudius reacts suspiciously.
* Hamlet confronts his mother about her hasty marriage to Claudius.
* Polonius spies on Hamlet and is accidentally killed.

**Act 3:**
* Claudius, fearing for his life, sends Hamlet to England with Rosencrantz and Guildenstern, secretly plotting his death.
* Ophelia, driven mad by grief, drowns.
* Hamlet learns of Claudius's plot and returns to Denmark.

**Act 4:**
* Laertes, Ophelia's brother, seeks revenge for his father and sister's deaths.
* Claudius manipulates Laertes into a duel with Hamlet, planning to kill Hamlet with a poisoned sword and drink.

**Act 5:**
* During the duel, Gertrude drinks the poisoned wine meant for Hamlet and dies.
* Laertes and Hamlet are both fatally wounded by the poisoned sword.
* Hamlet kills Claudius before dying.
* Fortinbras, Prince of Norway, arrives and takes the throne of Denmark.

## Themes:

* **Revenge:** The central theme, driving the plot and exploring its complexities and consequences.
* **Justice:** The play questions how to achieve justice for wrongful acts and the morality of revenge.
* **Mortality:** Characters grapple with death, grief, and the afterlife.
* **Madness:** Hamlet's feigned and Ophelia's genuine madness raise questions about sanity and reality.
* **Betrayal:** The play explores various forms of betrayal, including familial, political, and personal.
* **Power:** The corrupting influence of power and its impact on relationships and morality.
* **Appearance vs. Reality:** Characters engage in deception and manipulation, blurring the lines between truth and illusion.
* **Family:** The play examines complex family dynamics and the destructive effects of betrayal and revenge within families.

</div>

Last week I had [blogged](http://localhost:8888/2024/02/02/using-generative-ai-as-your-content-assistant/) about using GenAI as your content assistant. With that in mind, I tried uploading a Markdown file right from my blog ([this post](https://www.raymondcamden.com/2024/02/14/testing-temperature-settings-with-generative-ai)) and asked for a summary. Here's a screenshot, just so you can see how files are rendered - note that the token cost of the file is included:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gem3.jpg" alt="Markdown test" class="imgborder imgcenter" loading="lazy">
</p>

And here's the summary:

<div style="background-color: #c0c0c0; padding: 10px">
This article explores the concept of "temperature" in generative AI and demonstrates its impact on the variety and creativity of generated text. 

The author:

1. **Explains the concept of temperature:** Higher temperature values lead to more varied and unexpected responses, while lower values result in more predictable and consistent outputs.
2. **Creates a temperature testing tool:** This tool allows users to input a prompt and generate multiple responses at different temperature settings, providing a visual representation of how temperature affects the output.
3. **Shares the results of the tool:** By comparing the generated stories at different temperatures, the author showcases how higher temperatures lead to more creative and diverse narratives, while lower temperatures produce more focused and conventional stories.

Overall, the article provides a practical and insightful exploration of temperature settings in generative AI, helping readers understand how to adjust this parameter to achieve their desired level of creativity and variety in generated text. 
</div>

I dig it, and not because it seemed to praise me (ok, maybe that's part of it). 

Video testing is pretty darn cool, but I did run into some issues with it in my testing. One test that worked well was taking my raw video from [this YouTube video](https://www.youtube.com/watch?v=Cn8KLogbrCY), uploading, and asking for a summary:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gem4.jpg" alt="Video test" class="imgborder imgcenter" loading="lazy">
</p>

The result felt pretty spot on:

"This video is about Google's new large language model, PaLM 2. PaLM 2 is a more advanced version of PaLM, and it excels at advanced reasoning tasks, including code and math. It is also better at understanding the human language, which requires understanding ambiguous and figurative meaning of words, rather than the literal meaning. PaLM 2 was pre-trained on a large quantity of webpage, source code and other datasets. This means that it excels at popular programming languages like Python and JavaScript, but is also capable of generating specialized code in languages like Prolog, Fortran, and Verilog. Combining this with its language capabilities can help teams collaborate across languages."

I then tried with [this video](https://www.youtube.com/watch?v=Byz1mX-UEvM) which details how to use the Photoshop API with Python. Here's what Gemini 1.5 said:

"This video shows how to use the Adobe Photoshop API to remove the background from an image. The video starts by showing the Adobe Photoshop API documentation, which explains how to use the API to perform various tasks, including removing the background from an image. The video then shows how to create a Python script that uses the API to remove the background from an image. The script first generates an access token, then creates a remove background job, and finally polls the job until it is complete. The video ends by showing the image with the background removed."

This is... right but wrong. I mean, it *does* show the remove background part of the Photoshop API. That's absolutely right. But it doesn't bring up Python till the third sentence, which feels like it missed the *point* of the video. 

I'm *cautiously* optimistic that this could be pretty powerful when tweaked a bit further. As I mentioned in my [earlier post](https://www.raymondcamden.com/2024/02/02/using-generative-ai-as-your-content-assistant/), I really don't like writing summaries for my content, so I could imagine automating it via an (eventual) API access to this feature. It would be even better if Gemini could somehow 'tap' into an unlisted YouTube video so I didn't have to upload it first. 

# Super-sized Token support

One more big advantage of Gemini 1.5, and this will be important for handling those video files, or large sets of folders, is a *much* bigger amount of tokens. How big? Gemini 1.0 had a limit of 32,000 tokens. Gemini 1.5 gives you access to 1,000,000. Surely that's meme-worthy, right?

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gem5.jpg" alt="One Million Tokens" class="imgborder imgcenter" loading="lazy">
</p>

AI Studio does a great job reporting this as well. Here's the token count from a video test:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gem6.jpg" alt="103,736 out of 1,048,576 tokens" class="imgborder imgcenter" loading="lazy">
</p>

This is also reported in any file preview which gives you a way to determine how much the file impacts the total cost (which would include your text prompt as well):

<p>
<img src="https://static.raymondcamden.com/images/2024/02/gem7.jpg" alt="Token count on the embedded PDF." class="imgborder imgcenter" loading="lazy">
</p>

## More to Come

As I said, I just started playing with the file and video support, but I like what I see so far. Once I get API access to try this I'll definitely share what that's like as well. Let me know what you think!
