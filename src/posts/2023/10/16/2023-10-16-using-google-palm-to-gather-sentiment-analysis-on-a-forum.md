---
layout: post
title: "Using Google PaLM to Gather Sentiment Analysis on a Forum"
date: "2023-10-16T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/catai3.jpg
permalink: /2023/10/16/using-google-palm-to-gather-sentiment-analysis-on-a-forum
description: Using Generative AI to check the 'health' of a forum.
---

I've really been enjoying working with Google's [PaLM 2](https://ai.google/discover/palm2/) AI API and this week I used it to build a pretty interesting demo I think. What if we could use the generative AI features of PaLM to determine the 'sentiment' or general health of a forum? I was able to do so and I think the results are pretty interesting. I'll remind my readers I'm still fairly new to this, so please reach out if you've got suggestions on how to do this better, or found any big mistakes in my implementation. Ok, let's get started!

## Sentiment Analysis

In my [first post](https://www.raymondcamden.com/2023/10/12/a-look-at-googles-palm-api) on Google's PaLM API, I talked about how their "MakerSuite" was a really cool web-based UI to test out and play with the APIs. One of the things I found this week was their [prompt gallery](https://developers.generativeai.google/prompt-gallery) which gathers many different types of examples. In that list of samples, I found [sentiment analysis](https://developers.generativeai.google/prompts/sentiment-analysis):

<p>
<img src="https://static.raymondcamden.com/images/2023/10/s1.png" alt="Sentiment analysis prompt" class="imgborder imgcenter" loading="lazy">
</p>

If you open this sample in MakerSuite, you see that they are using tabular data as a prompt:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/s2.png" alt="Sample prompt at the bottom of MakerSuite" class="imgborder imgcenter" loading="lazy">
</p>

As you can see at the bottom there, they simply include a sentence with a blank field for the response. If you click Run, you can see how it parses the sample:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/s3.png" alt="It returns 'in between'" class="imgborder imgcenter" loading="lazy">
</p>

Let's look at the code for this prompt:

```js

const { TextServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");

const MODEL_NAME = "models/text-bison-001";
const API_KEY = "YOUR API KEY";

const client = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(API_KEY),
});

const Sentence = 'I really don't know how to feel about Pokemon';
const promptString = `Tell me whether the following sentence's sentiment is positive or negative or something in between.
Sentence I would love to walk along the beach.
Sentiment Somewhat positive
Sentence I love my new record player
Sentiment Positive
Sentence I really hate it when my brother steals my things
Sentiment Negative
Sentence ${Sentence}
Sentiment`;
const stopSequences = [];

client.generateText({
  // required, which model to use to generate the result
  model: MODEL_NAME,
  // optional, 0.0 always uses the highest-probability result
  temperature: 0.5,
  // optional, how many candidate results to generate
  candidateCount: 1,
  // optional, number of most probable tokens to consider for generation
  top_k: 40,
  // optional, for nucleus sampling decoding strategy
  top_p: 0.95,
  // optional, maximum number of output tokens to generate
  max_output_tokens: 1024,
  // optional, sequences at which to stop model generation
  stop_sequences: stopSequences,
  // optional, safety settings
  safety_settings: [{"category":"HARM_CATEGORY_DEROGATORY","threshold":1},{"category":"HARM_CATEGORY_TOXICITY","threshold":1},{"category":"HARM_CATEGORY_VIOLENCE","threshold":2},{"category":"HARM_CATEGORY_SEXUAL","threshold":2},{"category":"HARM_CATEGORY_MEDICAL","threshold":2},{"category":"HARM_CATEGORY_DANGEROUS","threshold":2}],
  prompt: {
    text: promptString,
  },
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
});
```

It's pretty similar to what I've shown in the previous blog posts, but note that the 'table' is just a simple text formatting system - two lines, each prefixed with Sentence and Sentiment. The final part just leaves the value for Sentiment out so PaLM can 'answer' it. Simple enough, so let's see how to build our workflow.

## The Workflow

Once again, I'm using [Pipedream](https://pipedream.com) for my workflow. In my imagined scenario, I want to check the sentiment of my forum once a day, so I used the scheduled trigger with the right value for that timing.

<p>
<img src="https://static.raymondcamden.com/images/2023/10/s4.png" alt="Cron schedule trigger" class="imgborder imgcenter" loading="lazy">
</p>

For my next step, I need to get the data from my forum. For my test, I'm using the RSS feed from [Acrobat Services API forum](https://community.adobe.com/t5/document-services-apis/bd-p/Document-Cloud-SDK). Now, right away, you should see a potential problem. Technical support forums, by their very nature, will typically lean towards the negative. No one's coming to a support forum to sing the praises of your product, but rather, they are typically asking for help. I expected the results of my tests on this forum to lean negative and I was right, but I still think it's a useful metric, especially if things start to get *really* negative. Obviously, another type of forum may have completely different results. 

Pipedream has an RSS parser action, actually one that works with multiple feeds, so I added that and specified the RSS URL for my forum:

<p>
<img src="https://static.raymondcamden.com/images/2023/10/s5.png" alt="Cron schedule trigger" class="imgborder imgcenter" loading="lazy">
</p>

Next, I need to take the result of the RSS parse and turn it into strings I can use with PaLM. The RSS step returns an array of RSS items each containing various properties, like the title and date of the item from the feed. The `description` field contains what we want, but is a bit messy. Here's an example:

```html
<P>Hi,</P><P>I've used pdf-embed-api for the purpose of viewing pdf documents on a web-based application.<BR />I would like to know if it is limited to a certain number of pages as it is having difficulties for documents with more than 400 pages(15mb).<BR /><BR />Thanks to provide accurate limitations of the api for viewing purposes.</P><P>&nbsp;</P><P>Snippet:</P><DIV><DIV><SPAN>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; adobeDCView.previewFile({</SPAN></DIV><DIV><SPAN>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; content:{location: {url: '</SPAN><SPAN>${</SPAN><SPAN>pdfUrl</SPAN><SPAN>}</SPAN><SPAN>'}},</SPAN></DIV><DIV><SPAN>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; metaData: { fileName: "</SPAN><SPAN>${</SPAN><SPAN>filename</SPAN><SPAN>}</SPAN><SPAN>" }</SPAN></DIV><DIV><SPAN>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; }, { embedMode: "IN_LINE", showDownloadPDF: false, showPrintPDF: false });</SPAN></DIV><DIV><SPAN>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; });</SPAN></DIV></DIV>
```

I added a new step and used this code to translate the above into simpler strings:

```js
export default defineComponent({
  async run({ steps, $ }) {
    return steps.merge_rss_feeds.$return_value.map(r => {
      return r.description.replace(/<.*?>/g, '').replaceAll('&nbsp;',' ').split('. ').slice(0,5).join('. ').trim();
    }).slice(0,10);
  },
})
```

Basically:

* Remove all HTML
* Replace non-breaking spaces with spaces.
* Split into sentences, but assuming a period.
* Get the first five sentences.
* Join them into one string and trim.
* Finally, I filter out the list of RSS items to the first ten.

I'm not sure about the decision on 5 sentences. PaLM seemed to be ok parsing it as input, but as I said, I'm unsure that it's actually valid. 

Okay, now for the big step - making my sentiment calls. In my [last post](https://www.raymondcamden.com/2023/10/13/texting-email-summaries-using-google-palm-ai-and-twilio), when I hit Google's service I was able to use a built-in Pipedream step to do it. I was almost disappointed by this - it was too easy.

This time, however, I need to make 10 calls and Pipedream doesn't support looping like that. So I switched to code:

```js
import { TextServiceClient } from '@google-ai/generativelanguage';
import { GoogleAuth } from 'google-auth-library';

async function getSentiment(s, key) {
  const MODEL_NAME = "models/text-bison-001";
  const client = new TextServiceClient({
    authClient: new GoogleAuth().fromAPIKey(key),
  });

  const promptString = `Tell me whether the following sentence's sentiment is positive or negative or something in between.
  Sentence I would love to walk along the beach.
  Sentiment Somewhat positive
  Sentence I love my new record player
  Sentiment Positive
  Sentence I really hate it when my brother steals my things
  Sentiment Negative
  Sentence ${s}
  Sentiment
  `;
  const stopSequences = [];

  let result = await client.generateText({
    // required, which model to use to generate the result
    model: MODEL_NAME,
    // optional, 0.0 always uses the highest-probability result
    temperature: 0.5,
    // optional, how many candidate results to generate
    candidateCount: 1,
    // optional, number of most probable tokens to consider for generation
    top_k: 40,
    // optional, for nucleus sampling decoding strategy
    top_p: 0.95,
    // optional, maximum number of output tokens to generate
    max_output_tokens: 1024,
    // optional, sequences at which to stop model generation
    stop_sequences: stopSequences,
    // optional, safety settings
    safety_settings: [{"category":"HARM_CATEGORY_DEROGATORY","threshold":1},{"category":"HARM_CATEGORY_TOXICITY","threshold":1},{"category":"HARM_CATEGORY_VIOLENCE","threshold":2},{"category":"HARM_CATEGORY_SEXUAL","threshold":2},{"category":"HARM_CATEGORY_MEDICAL","threshold":2},{"category":"HARM_CATEGORY_DANGEROUS","threshold":2}],
    prompt: {
      text: promptString,
    },
  });

  //To do, check for len of candidates and if zero, return ''
  if(result[0].candidates.length === 0) return ''; 
  return result[0].candidates[0].output;
}

export default defineComponent({


  async run({ steps, $ }) {
    let promises = [];
    steps.makeArrayOfInputs.$return_value.forEach(p => {
      promises.push(getSentiment(p, process.env.PALM_KEY))
    });

    let initialResults = await Promise.allSettled(promises);
    let results = [];
    initialResults.forEach(r => {
      if(r.status === 'fulfilled') {
          if(r.value === '') r.value = 'Neutral';
          results.push(r.value);
      } else {
        results.push('Error');
      }
    });

    return results;
  },
})
```

This is one of the more complex Pipedream steps I've written. The main part of the step (the `run` function), takes the array from the previous code and for each, fires off a call to a function I wrote to wrap calls to PaLM (`getSentiment`). I fire these all at once and make use of `Promise.allSettled` to wait for them to finish. Then, I loop over the results and create a new array. 

I did consider changing this part of the prompt: `Tell me whether the following sentence's` As I think I said earlier, I was a bit concerned about how PaLM would handle a few sentences versus one. I did once try something like so: `Tell me where the following few sentences` and it didn't seem to hurt or help, so I just kept the prompt as is. I *definitely* think I could be wrong here.

With my results in hand, my next step was to craft an email. I decided to generate an 'average' for the results and create a table of individual posts with links and sentiment. Here's how that looks:

```js
export default defineComponent({
  async run({ steps, $ }) {

    let ratings = ["Negative","Somewhat negative","Neutral","Somewhat positive","Positive"];
    let totalScore = steps.makeSentimentCalls.$return_value.reduce((prev,v) => {
      return prev + ratings.indexOf(v);
    },0);
    let avg = totalScore / steps.makeSentimentCalls.$return_value.length;

    /*
    Not happy with this range... but will leave it for now
    */
    let generalSentiment = '';
    if(avg < 0.6) generalSentiment = 'Negative';
    else if(avg < 1.6) generalSentiment = 'Somewhat negative';
    else if(avg < 2.6) generalSentiment = 'Neutral';
    else if(avg < 3.6) generalSentiment = 'Somewhat Positive';
    else generalSentiment = 'Positive';

    let date = new Intl.DateTimeFormat('en-US').format(new Date());
    let email = `
<h2>Forum Sentiment Analysis</h2>
<p>
Report generated on ${date}. Analyzing ${steps.makeSentimentCalls.$return_value.length} recent posts.
</p>

<p>
The general sentiment of the forum is <strong>${generalSentiment}</strong>.
</p>

<table>
<thead>
<tr>
<th>Post</th><th>Sentiment</th>
</tr>
</thead>
<tbody>
    `;

    steps.makeSentimentCalls.$return_value.forEach((s,i) => {
      // Removed as I set '' to Neutral, kept this here as a reminder
      //if(s === '') s = 'No sentiment detected';
      let row = `
<tr>
  <td><a href="${steps.merge_rss_feeds.$return_value[i].link}">${steps.merge_rss_feeds.$return_value[i].title}</a></td><td>${s}</td>
</tr>`;
      email += row;
    });

    email += '</tbody></table>';

    return email;
  },
})
```

I assign a numerical value to the results based on their order, with lower sentiment values having lower values. One issue here is that I'm not 100% sure I've covered all the possible responses from PaLM. In the earlier screenshot, you saw an 'in between' response which I never got. I did get empty responses which I considered 'Neutral'. But again, this is something I may need to address. 

After generating the first part of the text for my email, I then loop over the results and combine that with the earlier RSS information (`title` and `link`) to make my table.

Finally, I used the built-in Pipedream step to email the results to myself. In a "real" workflow, I'd use something like Sendgrid to email the person who needs to get this, but for my testing having the email sent to me was easiest. 

And the result?

<p>
<img src="https://static.raymondcamden.com/images/2023/10/s6.png" alt="Email report" class="imgborder imgcenter" loading="lazy">
</p>

The repo for this workflow may be found here: <https://github.com/cfjedimaster/General-Pipedream-AI-Stuff/tree/production/forum-sentiment-p_xMC7AQ1>