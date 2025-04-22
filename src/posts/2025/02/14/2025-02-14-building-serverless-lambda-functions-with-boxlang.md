---
layout: post
title: "Building Serverless Lambda Functions with BoxLang"
date: "2025-02-14T18:00:00"
categories: ["development", "serverless"]
tags: ["boxlang"]
banner_image: /images/banners/cat_robe.jpg
permalink: /2025/02/14/building-serverless-lambda-functions-with-boxlang
description: Building serverless function swith BoxLang
---

** Edit on April 22, 2025: Thanks to Adam E. for pointing out I had the wrong secret name below. It is fixed now. **

I've been a fan of serverless for quite some time. My introduction to it was OpenWhisk, way back in [2016](https://www.raymondcamden.com/2016/12/23/going-serverless-with-openwhisk). It's been appealing to me for a long time as an easy way to deploy lightweight services quickly. As much as I've been a fan of the technology, I've yet to really embrace Amazon's Lambda product. I've played with it a bit off and on in the past, but it always felt *incredibly* overwhelming. [Netlify Functions](https://www.netlify.com/platform/core/functions/), [Pipedream](https://pipedream.com), and [Cloudflare Workers](https://workers.cloudflare.com/) have been my main tools for serverless just because of how simple they are. That being said, the last few days I've been playing with [BoxLang](https://boxlang.io/) on AWS and thought I'd share my experience. 

## The Basics

So let's start off with the basics. I'm not going to repeat what's in the docs, you should 100% read the [AWS Lambda](https://boxlang.ortusbooks.com/getting-started/running-boxlang/aws-lambda) documentation for BoxLang. I'll focus on the 'gotchas' as my experience was that you need to be a bit careful in what you do in order for all the parts to work well together. Obviously for this you're also going to need an AWS account as well. As much as I can encourage you to [read the docs](https://boxlang.ortusbooks.com/getting-started/running-boxlang/aws-lambda), I know how devs are (*grin*), so I'll still cover an overview here. I plan on recording a video version of this next week as well so if you prefer learning visually, I'll have that for you soon. 

There's two main ways you can use BoxLang's Lambda support. You can create a build locally, which creates a zip and upload it manually to AWS or you can use GitHub Actions to automate the process. This is where some of the trickiness comes in but honestly, it's a *much* better developer experience so I recommend that approach, and it's the one I've taken. 

Given that, I'd start by making a new GitHub repository and use the BoxLang template, https://github.com/ortus-boxlang/bx-aws-lambda-template. As soon as you do this, the GitHub action for the repo is going to fire off and fail, but you can ignore that. 

In your GitHub project settings, you need to create three secrets:

* AWS_REGION - the region where the lambda will be deployed. I don't spend a lot of time in the AWS console so as a reminder, you can find your current region in the upper right hand corner, and if you click it, you can see the ... I don't know, code name I suppose, for the region. For me, I'm using Oregon which is `us-west-2`.

<p>
<img src="https://static.raymondcamden.com/images/2025/02/lam1.jpg" alt="List of AWS regions" class="imgborder imgcenter" loading="lazy">
</p>

* AWS_PUBLISHER_KEY_ID - your credentials.
* AWS_SECRET_PUBLISHER_KEY - again, your credentials.

After you've specified that, I'd then create your Lambda function on AWS. <strong>This is a very important step.</strong> When the GitHub Actions from the template deploy, they are going to use one of two names depending on the branch. If you are using `development`, it will be: `{projectName}-staging`. If you are using the `main` branch, it will be `{projectName}-production`. What's `projectName`? Give me a sec and I'll get to it.

As documented, you will create the Lambda with the Java runtime and then edit the runtime settings to specify this handler: `ortus.boxlang.runtime.aws.LambdaRunner::handleRequest`

Don't screw any of this up. I discovered that AWS blocks both renaming of Lambda's as well as changing the runtime. I'm sure there's good reason for that but as I messed up both at least once, it was a painful lesson. ;) 

Ok, so just to recap - in GitHub you cloned the template and set up 3 environment variables. On the Lambda side, you made your function, picked Java, and updated the handler. There's one final step.

In your local copy of the repository, find `settings.gradle`, and modify the root project name. Here's mine:

```
rootProject.name='bx-lambda2'
```

That name isn't very descriptive, but it works. On the AWS side, my function is `bx-lambda2-staging`. If you commit this change, this will kick off a new GitHub Action process and in theory, it will work fine. At this point, you can start iterating on your code. In my testing, commits took roughly a minute and a half to deploy to Lambda. You can keep the workflows window open to monitor the progress.

<p>
<img src="https://static.raymondcamden.com/images/2025/02/lam2.jpg" alt="Screenshot from workflows UI on GitHub" class="imgborder imgcenter" loading="lazy">
</p>

## The Function 

So all of the above felt like a lot to me, but honestly, it was mostly me just not being familiar with AWS. Also, I've never written any GitHub actions myself so that was new for me as well. I now turned my attention to the code. Here's the default Lambda you get from the template:

```js
/**
 * My BoxLang Lambda
 *
 * - The <code>run()</code> function is by convention the entry point of the Lambda
 * - You can create other functions and use the `x-bx-function` header to call them
 *
 * <h2>Arguments</h2>
 * - event: The event struct/map that triggered the Lambda
 * - context: The AWS Lambda context object that adheres to the <code>com.amazonaws.services.lambda.runtime.Context</code>
 * - response: The response object that will be returned to the caller which always has a standard structure:
 *  - statusCode: The HTTP status code, 200 default
 *  - headers: The HTTP headers map/struct
 *  - body: The response body, or empty. This is for you to add your response data as you see fit.
 *  - cookies: An array of incoming cookies (if any)
 *  - Any other property you add will be returned as well
 */
class{

	function run( event, context, response ){
		response.body = {
			"error": false,
			"messages": [],
			"data": "====> Incoming event " & event.toString()
		}
		response.statusCode = 200
	}

	function anotherLambda( event, context, response ){
		return "Hola!!"
	}
}
```

This is fairly simple, the only odd thing to me, kinda, was the second function. As the comment says, this is a way for one Lambda to have multiple functions. All you need to do is pass a header (more on the whole URL thing in a moment) and `run` will be bypassed for another function. Also note the simpler return in `anotherLambda`. The [docs](https://boxlang.ortusbooks.com/getting-started/running-boxlang/aws-lambda#response) discuss this but you are allowed to return a complex structure with a status code and such, or just plain data and BoxLang will take care of it for you. That's really convenient! 

For my test, I decided to write a simple wrapper for the [Pirate Weather](https://pirateweather.net/en/latest/) API. One of my first uses of serverless was to build simple API wrappers that both hid my API key from frontend code and 'shaped' the response to better match what I needed. So for example, an API may return a huge amount of data but you only need a subset. 

I started off using [Try BoxLang](https://try.boxlang.io/) as a quick way to prototype my function, and then moved my code into the Lambda:

```js
/**
 * My BoxLang Lambda
 *
 * - The <code>run()</code> function is by convention the entry point of the Lambda
 * - You can create other functions and use the `x-bx-function` header to call them
 *
 * <h2>Arguments</h2>
 * - event: The event struct/map that triggered the Lambda
 * - context: The AWS Lambda context object that adheres to the <code>com.amazonaws.services.lambda.runtime.Context</code>
 * - response: The response object that will be returned to the caller which always has a standard structure:
 *  - statusCode: The HTTP status code, 200 default
 *  - headers: The HTTP headers map/struct
 *  - body: The response body, or empty. This is for you to add your response data as you see fit.
 *  - cookies: An array of incoming cookies (if any)
 *  - Any other property you add will be returned as well
 */
class{

	struct function getWeather(key,lat,long) {

		local.apiURL = "https://api.pirateweather.net/forecast/#arguments.key#/#arguments.lat#,#arguments.long#";
		bx:http url=local.apiURL result="local.result";
		return jsonDeserialize(local.result.filecontent);
	}

	function run( event, context, response ){

		local.pirateKey = server.system.environment?.PIRATE_KEY;


		if(!event.keyExists('latitude') || !event.keyExists('longitude')) {

			response.body = {
				"error": true, 
				"messages": [ "latitude and longitude must be passed, you passed #event.toString()#" ],
				"data": "Error"
			}

			response.statusCode = 500;

		} else {

			local.report = getWeather(pirateKey, event.latitude, event.longitude);

			response.body = {
				"error": false,
				"messages": [],
				"data": report
			}
			response.statusCode = 200
		}
	}

}
```

I've got a utility function, `getWeather`, that does the real work, hitting the API with a key and location information. My `run` function picks up the key from an environment variable set on the AWS side and then checks the event body for required attributes. 

It was at this point I broke the build, by that I mean the GitHub action failed. And it failed for a completely obvious reason. In the GitHub template there is a unit test and it's part of the build process. You can find it in `src/test/java/com/myproject/LambdaRunnerTest.java`. I don't *really* know Java, but it was simple enough to see the test logic:

```js
public void testValidLambda() throws IOException {
	// Set a valid path
	Path			validPath	= Path.of( "src", "main", "bx", "Lambda.bx" );
	LambdaRunner	runner		= new LambdaRunner( validPath, true );
	// Create a AWS Lambda Context
	Context			context		= new TestContext();
	var				event		= new HashMap<String, Object>();
	// Add some mock data to the event
	event.put( "name", "Ortus Solutions" );
	event.put( "when", Instant.now().toString() );

	// EXECUTE THE LAMBDA
	var		results	= runner.handleRequest( event, context );
	IStruct	body	= ( IStruct ) results.get( "BODY" );

	assertThat( results ).isNotNull();
	assertThat( results.get( "STATUSCODE" ) ).isEqualTo( 200 );
	assertThat(
		body.getAsString( Key.of( "data" ) )
	)
		.contains( "Ortus Solutions" );
}
```

Note how it creates an event body and passes it. It checks the result to ensure it was returned because the original code did that in the response. When I started writing "real" code, obviously the test no longer worked.

It was at this point I stopped and made a proper unit test.

<p>
<img src="https://static.raymondcamden.com/images/2025/02/lam3.jpg" alt="Cat laughing" class="imgborder imgcenter" loading="lazy">
</p>

Ok, no, I didn't, I just commented it out. But as I said, even seeing this code for the first time, it clicked how I could quickly build in real tests. Also, the template gives you a command line way to confirm it passes (`gradlew test`), so I commented it what I needed, ran the test locally to confirm it passed, and committed again. 

Now, speaking of testing, I did follow the [testing advice](https://boxlang.ortusbooks.com/getting-started/running-boxlang/aws-lambda#testing-in-aws) in the BoxLang docs that demonstrated testing in the AWS console. That's fairly simple - you can make a data call right from the console which is cool. Here's an example of how that looks:

<p>
<img src="https://static.raymondcamden.com/images/2025/02/lam4.jpg" alt="Testing a Lambda in AWS" class="imgborder imgcenter" loading="lazy">
</p>

I figure this is pretty familiar to those of you already using Lambda, but being new to me, I really appreciated how well it worked. You can create multiple different events to test different kinds of results, errors, and so forth. 

I confirmed this worked and I got a forecast back. Woot!

## The API 

So the last thing I needed to do was add a function URL. That's a few clicks and no big deal, and my assumption was that I just needed to copy the URL into Postman and make my call and it would work. Except... that didn't happen. Again, this was totally obvious but surprised me. When you do a HTTP POST to your Lambda, your data isn't in the "root" of event, but a JSON string in `event.body`. Again, I think that's kinda obvious, but it threw me a bit. I did a quick refactor of my code:

```js
class{

	struct function getWeather(key,lat,long) {

		local.apiURL = "https://api.pirateweather.net/forecast/#arguments.key#/#arguments.lat#,#arguments.long#";
		bx:http url=local.apiURL result="local.result";
		return jsonDeserialize(local.result.filecontent);
	}

	function run( event, context, response ){

		local.pirateKey = server.system.environment?.PIRATE_KEY;

		local.body = jsonDeserialize(event.body);

		if(!body.keyExists('latitude') || !body.keyExists('longitude')) {

			response.body = {
				"error": true, 
				"messages": [ "latitude and longitude must be passed, you passed #event.toString()#" ],
				"data": "Error"
			}

			response.statusCode = 500;

		} else {

			local.report = getWeather(pirateKey, body.latitude, body.longitude);

			response.body = {
				"error": false,
				"messages": [],
				"data": report
			}
			response.statusCode = 200
		}
	}

}
```

This is virtually the same outside of me checking for my data in `event.body`. In theory, I could write my code to support both I suppose, but that felt like overkill. I returned to Postman and my call worked just fine:

<p>
<img src="https://static.raymondcamden.com/images/2025/02/lam5.jpg" alt="Postman screenshot" class="imgborder imgcenter" loading="lazy">
</p>

By the way, if you want to try to copy that URL, go ahead, I'll keep it up and running for a while. 

So... as I said, this is a bit more complex than what I'm used to with, let's say Pipedream, but that's just my inexperience with AWS, and honestly, it feels like I picked up on things quickly enough. I will be following up this post with a video next week, but let me know what you think. 

p.s. The folks behind BoxLang, Ortus, are running a conference, [Into the Box](https://www.intothebox.org/) in May in DC. There will be a session just for BoxLang: [Getting Started with BoxLang!](https://www.intothebox.org/into-the-box/sessions/getting-started-with-boxlang). I've been to, and spoken at, some of their conferences in the past and they're really well done. 