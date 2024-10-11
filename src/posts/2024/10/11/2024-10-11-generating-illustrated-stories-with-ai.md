---
layout: post
title: "Generating Illustrated Stories with AI"
date: "2024-10-11T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript","adobe"]
banner_image: /images/banners/cat_storytime.jpg
permalink: /2024/10/11/generating-illustrated-stories-with-ai
description: How I built an AI story creator with Gemini, Firefly, and Acrobat Services
---

A few months ago, I built a little demo that I simply forgot to actually talk about here. A coworker was building something similar and it reminded me to take a look at the code, update it, and actually share it. This is a pretty cool example of integrating multiple different APIs to create a final product, in this case, a short story with pictures. Here's an example:

<iframe loading="lazy" src="pdf.html" style="width:100%;height:720px"></iframe>

How was this built? At a high level:

* Google's [Gemini AI](https://ai.google.dev/) is used to generate a short story.
* Adobe's [Firefly Services](https://developer.adobe.com/firefly-services) is used to generate the images.
* Adobe's [Acrobat Services](https://developer.adobe.com/document-services/) is used to turn the text into a PDF.

That's the high level, now let's get into the nitty-gritty.

## Generating a Story

To create a story, I used a simple prompt at first, "Write a four-paragraph story about a magical cat, appropriate for a young reader." And that works, but needs a bit of work though. In order to generate images in the next section, I was worried a paragraph of text would be a bit too big for a prompt. So I actually ask Gemini to create a summary for each paragraph.

In order to get *just* the right shape for my content, I use JSON schema:

```js
const schema = `
{
 "description":"A short story with summaries.",
 "type":"array",
 "items": {
 "type":"object",
 "properties": {
 "text": {
 "type":"string",
 "description":"A paragraph of text for the story."
 },
 "summary": {
 "type":"string",
 "description":"A one-sentence summary of the story."
 }
 },
 "required":["text","summary"]
 },
 "minItems":4,
 "maxItems":4
}
`;
```

Note I specify exactly 4 paragraphs for the story as well the keys to use for the text versus the summary. My script takes the story idea from the command line:

```js
if(process.argv.length < 3) {
    console.log('Pass your story idea at the prompt: node process.js "Write a four paragraph story about a magical cat, appropriate for a young reader."');
    process.exit(1);
} 

let storyPrompt = process.argv[2];

let story = JSON.parse(await generateStory(storyPrompt));
console.log('Text and summaries of story generated.');
```

And then passes it to my function calling Gemini:

```js
async function generateStory(story) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
    responseMimeType:'application/json',
    responseSchema:JSON.parse(schema)
 };

  const safetySettings = [
 {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
 },
 {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
 },
 {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
 },
 {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
 },
 ];

  const parts = [
 {text: story},
 ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
 });

  return result.response.text();
}
```

So given this:

```
node --env-file=.env process.js "Write a story about cats that play music."
```

I get:

```js
[
 {
    summary: 'A band of alley cats overcome stage fright and prejudice to win a city-wide music competition with their unique blend of jazz and purring.',
    text: "Whiskers twitched nervously as the Alley Cats took the stage.  This wasn't their usual spot on top of Grimaldi's Pizzeria, serenading late-night diners with improvisational meows and bin-lid drum solos.  This was the Battle of the Bands, and the competition was fierce, filled with pedigreed poodles playing polished pop and haughty Persians strumming classical concertos.  The crowd, a sea of skeptical faces, didn't expect much from a ragtag bunch of alley cats.  But when Duke, the sleek Siamese, launched into a soulful saxophone solo, purring a bluesy melody that echoed through the park, the audience was mesmerized.  Luna, the fluffy Persian with a voice like velvet, took over, her song a mix of jazzy riffs and heartfelt meows about love, loss, and midnight adventures.  By the time the final cymbal crash faded away - courtesy of  a rusty paint can expertly wielded by Patches, the tabby - the crowd erupted.  The Alley Cats had won, proving that music, like love and tuna, transcended all boundaries."
 },
 {
    summary: 'A group of cats form a band, but their dreams of musical stardom are threatened by their arch-nemeses, the dog next door.',
    text: "The air in the alley thrummed with the sound of feline funk.  This was it, the night the Catnip Crew would finally take their act beyond the bins and fire escapes and into the limelight of the city park's open mic night.  Felix, the ginger maestro of the meow, adjusted his tiny top hat and tapped his paw on the makeshift stage.  Beside him, Mittens, the tabby queen of the bass guitar (a skillfully strung sardine tin), tuned her instrument with a flick of her tail.  But as the first chord rang out, a shadow fell over the makeshift stage.  Barker, the gruff bulldog from next door, and his gang of canine cronies had arrived, their expressions a mix of amusement and disdain.  Barker, a firm believer that music was for the birds, not cats (or dogs, for that matter), had made it his personal mission to silence the Catnip Crew. What followed was a comical showdown of musical sabotage - barking interrupting solos, a strategically chewed guitar string, and a near miss with a well-aimed tennis ball.  But the Catnip Crew, fueled by passion and a shared love of tuna snacks, played on, their music eventually drowning out Barker's attempts at disruption.  The crowd, initially amused by the canine chaos, found themselves tapping their feet to the catchy tunes.  By the end of the night, it wasn't just the alley that echoed with their music, but the entire neighborhood."
 },
 {
    summary: 'A shy cat named Cleo finds her voice and her confidence by joining a band of musical felines.',
    text: "Cleo, a petite calico with emerald eyes, preferred the quiet comfort of her yarn basket to the chaos of the outside world.  The mere thought of social interaction sent her scurrying under the sofa.  But everything changed on the day she stumbled upon a group of cats jamming in the park.  Their music, a vibrant mix of purrs and piano chords, drew her in, filling her with a longing she couldn't explain.  Gathering her courage, Cleo crept closer, her heart pounding like a drum solo. The band, a motley crew called the Stray Chords, welcomed her with open paws.  To Cleo's surprise, they saw potential in her timid meows and encouraged her to join in. At first, her voice was but a whisper, lost in the tapestry of sound.  But with each rehearsal, Cleo's confidence grew.  She discovered the joy of expressing herself through music, her shyness replaced by a newfound swagger.  She learned to belt out bluesy ballads with the confidence of a seasoned diva, her voice soaring above the strumming banjos and the rhythmic thump of the cardboard box drum.  No longer the shy wallflower, Cleo had found her stage, her voice, and her place in the spotlight, proving that even the quietest meow can hold the power to move the world."
 },
 {
    summary: 'Cats form a band and learn the true meaning of teamwork and friendship.',
    text: "Four felines, each a virtuoso in their own right, clashed like cymbals in a hurricane.  Their names were familiar throughout the city's hidden nooks and crannies - Figaro, the sleek Russian Blue with a voice smoother than silk, Esmeralda, the Siamese songstress with a meow that could shatter glass, Bartholomew, the ginger tabby whose paws danced across the keyboard like a summer breeze, and lastly, Pepper, the streetwise tuxedo cat whose drumming on upturned buckets was the stuff of legend.  Each harbored dreams of musical stardom, but their egos outshone their talent.  Then came the day a renowned talent scout announced a city-wide music competition.  It was their chance, their one shot at fame and fortune.  The problem?  They were still four separate acts, each refusing to yield the spotlight.  Rehearsals were a cacophony of frustrated hisses and unsynchronized melodies.  However, as the competition drew closer, a reluctant respect began to bloom among them.  They discovered the magic of blending their unique sounds, of weaving their individual melodies into a tapestry richer than any one of them could create alone.  Figaro's silky vocals soared over Esmeralda's powerhouse riffs, while Bartholomew's playful melodies found grounding in Pepper's driving drumbeats.  They learned the true meaning of teamwork, of setting aside their egos to achieve something extraordinary together.  When they finally took the stage, they were no longer four solo acts vying for attention but a unified force of musical synergy, the embodiment of feline grace and raw talent."
 }
]
```

## Generating the Images

The next part is rather easy. Given that I have a short summary for each paragraph, I can loop over the paragraphs and ask for an image from Adobe Firefly:

```js
for(let p of story) {
    console.log(`Generating a picture from ${p.summary}`);
    let result = await textToImage(p.summary, FF_CLIENT_ID, ff_token);
    let imgResult = result.outputs[0];

    p.image = `<img src="${imgResult.image.url}">`

    await delay(5 * 1000);
}
```

Here's the `textToImage` function which makes use of the [image generation](https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/image_generation/V3/) Firefly API, specifically the latest v3 model. 

```js
async function textToImage(text, id, token) {

	let body = {
        "numVariations":1,
        "prompt":text,
        "contentClass":"art",
        "size":{
            "width":"1024",
            "height":"1024"
 }
 }

    let req = await fetch('https://firefly-api.adobe.io/v3/images/generate', {
        method:'POST',
        headers: {
            'X-Api-Key':id, 
            'Authorization':`Bearer ${token}`,
            'Content-Type':'application/json'
 }, 
        body: JSON.stringify(body)
 });

    let resp = await req.json();
    return resp;
}
```

Normally when you use Firefly, you take the results and save them, but we can use the shortlived URLs for our next step.

## Stitching it Together with Document Generation

Now for the final part. I've got my text. I've got URLs for my images. To create the final document, I'll use the [Adobe Document Generation API](https://developer.adobe.com/document-services/apis/doc-generation/) to create a PDF. This API lets you use Microsoft Word as a template, pass in data, and generate a PDF. In this case, our Word template is super simple:

<p>
<img src="https://static.raymondcamden.com/images/2024/10/story1.jpg" alt="Screenshot from Word" class="imgborder imgcenter" loading="lazy">
</p>

In this template, the tags say to loop over each paragraph and output the text and image URL. I could absolutely do more here. I could make the Word template prettier for example. But it absolutely gets the job done.

I won't share the code here in the post (although I link to everything at the end), but in general, Acrobat Services REST APIs are incredibly simple. In this case I:

* Got my access token with my credentials
* Uploaded the Word template
* Called the API and referenced the template while also passing my data
* Polled to see when the creation job was done
* Downloaded the result

I [blogged](https://medium.com/adobetech/announcing-the-new-adobe-document-services-rest-apis-8d85951176cf) about the Acrobat Services REST APIs when they were first released in 2022, so you can check that link for more information. 

## More Thoughts

You can see the complete code base here, <https://github.com/cfjedimaster/fireflyapi/tree/main/demos/story>, but note you'll need various credentials in order to get it to work.

This is - obviously - not perfect. Probably the biggest issue is that any 'character' created by Firefly in one image may not look the same in a followup image. Being able to carry over a result like that isn't yet supported by the API. You can use object composition, but that implies the existence of existing media, which we don't have in this case. Another possible option would be using the "style reference" feature of Firefly, which lets you upload a source image to use as a style guide. In theory, my code could use the first image as a style reference for the following three images. I may give that a shot next week. 

And as always, I'd love to hear your opinions as well, so leave me a comment below with your thoughts, suggestions, and so forth. 
