---
layout: post
title: "A Quick First Look at Amazon Bedrock (with Node.js)"
date: "2024-04-04T18:00:00"
categories: ["development"]
tags: ["generative ai","aws","javascript"]
banner_image: /images/banners/cats_bedrock.jpg
permalink: /2024/04/04/a-quick-first-look-at-amazon-bedrock-with-nodejs
description: A look at Amazon Bedrock, Amazon's generative AI service.
---

My regular readers (hello, yall rock!) know I've been playing with [generative AI](https://www.raymondcamden.com/tags/generative+ai) the past few months. I'm still a bit skeptical about the amount of hype involved around the space, but I'm slowly getting more excited as I see some of the interesting possibilities available with these tools. Most of my recent exploration has been on the [Google Gemini](https://deepmind.google/technologies/gemini/#introduction) side, but after hearing my buddy Todd Sharp talk about [Amazon Bedrock](https://aws.amazon.com/bedrock/) on his stream yesterday, I figured it was time to check it out. (FYI, you should absolutely check out his weekly Twitch show on the [AWS Twitch](https://twitch.tv/aws) channel called "Streaming on Streaming" - Wednesdays at 3PM CST.) 

## Getting Started

So obviously, you want to begin on the [marketing page](https://aws.amazon.com/bedrock/) and get a high-level overview. Just now, I tried out the web-based free demo [here](https://aistylist.awsplayer.com/) and it is *incredibly* well done, appropriate for both technical and non-technical audiences, and heck, if you've never seen anything in regards to how Generative AI works, it's a very well done introduction that highlights the **practical** use cases. 

<p>
<img src="https://static.raymondcamden.com/images/2024/04/aws1.jpg" alt="Screenshot from AI Styling demo" class="imgborder imgcenter" loading="lazy">
</p>

The marketing page has a nice clear "Get started" button as well that leads you into the [AWS console](https://console.aws.amazon.com/bedrock/), so I'd probably recommend having AWS credentials already. 

Once in the dashboard, you'll see this prompt, and it's important:

<p>
<img src="https://static.raymondcamden.com/images/2024/04/aws2.jpg" alt="Select model prompt" class="imgborder imgcenter" loading="lazy">
</p>

One of the first things that was different for me with Bedrock is that it offers a lot of models, not just ones Amazon has created, but you have to request access to actually use them. Don't let that scare you - at least for the Amazon models you can get access immediately, but you do have to request it. Here's a screenshot from the Model access dashboard where you can see I've enabled two Titan Text models:

<p>
<img src="https://static.raymondcamden.com/images/2024/04/aws3.jpg" alt="Long list of models" class="imgborder imgcenter" loading="lazy">
</p>

Some models require you to describe your intended use. For example, the models under the Anthropic branch. Here's what that prompt looks like:

<p>
<img src="https://static.raymondcamden.com/images/2024/04/aws4.jpg" alt="Requesting access to Claude" class="imgborder imgcenter" loading="lazy">
</p>

I actually did this and answered honestly - ie I just want access for blogging/video creation purposes, not production use. I did this yesterday afternoon and haven't heard back yet. You'll notice there's no indication of that in the model list above which is a bit weird, but I'm just going to assume I'm in a queue someplace. (And to be honest, I'm going to judge Amazon a bit here on how they respond. I do feel that 'exploration' is a 100% valid use case!)

Anyway, I'd probably recommend starting with the Titan models, that's what I did.

Before I jump into the code, I'll point out that there is a set of playgrounds available for testing in your web browser,I picked the first playground for Chat, hit Select model, and in the popup, it correctly identified I had Titan access:

<p>
<img src="https://static.raymondcamden.com/images/2024/04/aws5.jpg" alt="Selecting Titan" class="imgborder imgcenter" loading="lazy">
</p>

Which is cool - I could then start chatting with it. The playground also comes with examples as well. My only real complaint is that I wish it had a code export like Google's AI Studio. What Google gives you isn't complete, but it's a shell that you can quickly modify. Speaking of code...

## Lets Code!

So when it comes to code, there's a lot you can find in the [User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/index.html) and [API Reference](https://docs.aws.amazon.com/bedrock/latest/APIReference/welcome.html). My issue with the user guide was that it was Python only, and while I *love* Python, I had it in my head that I wanted to start off with Node. 

I've used the [AWS SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) a few times recently, and while I sometimes struggle to find what I need, when it works, it works well. 

As a reminder, you can, and should, only install what you need in the SDK. For me, that was `@aws-sdk/client-bedrock` and `@aws-sdk/client-bedrock-runtime`. The first one you may not need as it's there to support working with models. I only needed it to build a script to list available models. I've got that code in my repo (which I'll share in a bit) but I don't see myself using it in the future. Instead, the latter one is how you make actual calls against the models and is probably all you need. 

After installing the SDK (well, part of the SDK), you import what you need. One of the things I found last year when I shared some code on working with S3 (("Quick example using AWS Node.js SDK V3 for Signed URLs")[https://www.raymondcamden.com/2023/06/09/quick-example-using-aws-nodejs-sdk-v3-for-signed-urls]) was that the SDK has imports related to the 'commands' you do with the service. So imagine a database, if you knew you were *only* doing read operations, you would import a command specific to that and not the others. That approach is a bit different from most SDKs I think, but not a big deal once you understand that. 

I began my script like so:

```js
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({region:'us-east-1', 
	credentials:{
		secretAccessKey:process.env.SECRET_ACCESS_KEY,
		accessKeyId:process.env.ACCESS_KEY_ID
	}
});
```

I've imported the main Bedrock runtime and the code that will let me invoke commands on the model. 

As a reminder, you'll see sample code like this:

```js
const client = new BedrockRuntimeClient({region:'us-east-1'});
```

That's because the AWS SDK can support cached credentials in your user profile. That's handy, but I don't like that for my samples as I don't want to assume they're there. 

Now let's look at the code that calls the model:

```js
const prompt = `
Define, in terms a young child would understand, what the meaning of life is. You should answer by using a short story as an example.
`;

const input = {
	modelId:"amazon.titan-text-lite-v1",
	contentType:"application/json",
	accept:"application/json",
	body: JSON.stringify({
		inputText:prompt,
		textGenerationConfig: {
			maxTokenCount: 512
		}
	})
};

const command = new InvokeModelCommand(input);
const resp = await client.send(command);
```

I begin with a hard-coded prompt. The shape of `input` is important because while the first three parameters seem consistent, the `body` depends on the model. I found this by looking in the [Titan portion](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-titan-text.html) of the user guide. If you compare this to the [Claude](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-text-completion.html) models, you can see it's different. 

I think this is all *expected*, but just something to keep in mind. I do find it silly that I have to specify `contentType` and `accept`. If I were hitting the REST API directly, that would absolutely make sense. But the point of a SDK is to remove needing to worry about that. I'm not quite sure why it wouldn't just set those automatically?

Running just this, what do you get?

```
{
  '$metadata': {
    httpStatusCode: 200,
    requestId: '824c9250-089a-4e27-9f6f-c883471142ce',
    extendedRequestId: undefined,
    cfId: undefined,
    attempts: 1,
    totalRetryDelay: 0
  },
  contentType: 'application/json',
  body: Uint8ArrayBlobAdapter(425) [Uint8Array] [
    123,  34, 105, 110, 112, 117, 116,  84, 101, 120, 116,  84,
    111, 107, 101, 110,  67, 111, 117, 110, 116,  34,  58,  51,
     50,  44,  34, 114, 101, 115, 117, 108, 116, 115,  34,  58,
     91, 123,  34, 116, 111, 107, 101, 110,  67, 111, 117, 110,
    116,  34,  58,  55,  51,  44,  34, 111, 117, 116, 112, 117,
    116,  84, 101, 120, 116,  34,  58,  34,  76, 105, 102, 101,
     32, 105, 115,  32, 108, 105, 107, 101,  32,  97,  32, 103,
     97, 109, 101,  32, 111, 102,  32,  67,  97, 110, 100, 121,
     32,  67, 114, 117,
    ... 325 more items
  ]
}
```

So here's another oddity with the SDK. It doesn't automatically parse the response. That's also a bit weird to me. After mentioning this to Todd, he suggested it may be that because some responses are binary in nature (they have an image generation model), but I'll say again, isn't the point of the SDK to handle some of these things for you?

Ok, enough complaining, as it takes one more line of code to get the result:

```js
const decodedResponseBody = JSON.parse(new TextDecoder().decode(resp.body));
```

And the real response is:

```json
{
  "inputTextTokenCount": 32,
  "results": [
    {
      "tokenCount": 73,
      "outputText": "Life is like a game of Candy Crush. You never know what challenges or surprises are coming next, but you have to keep playing to see what happens. Sometimes you win, and sometimes you lose, but it's all part of the fun. And no matter what, you should always try to be kind to others and treat them how you want to be treated.",
      "completionReason": "FINISH"
    }
  ]
}
```

Got to say, I'm more than a little surprised by the "Candy Crush" example, but that's fine. I definitely like the response including token count for both input and output.

If you want try this yourself, I do have this code (and a sample that gets the models) here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/bedrock>

Now that I've got the basics done, my next task is to build something "real" with this. If you have suggestions, leave me a comment below and I'll consider it for my next post!
