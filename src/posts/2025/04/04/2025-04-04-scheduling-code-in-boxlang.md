---
layout: post
title: "Scheduling Code in BoxLang"
date: "2025-04-04T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/busycat.jpg
permalink: /2025/04/04/scheduling-code-in-boxlang
description: New scheduling support in BoxLang
---

While I was busy getting utterly overwhelmed by deep AI talks at [Arc of AI](https://www.arcofai.com/) this week, [BoxLang](https://boxlang.io) released it's [third release candidate](https://boxlang.ortusbooks.com/readme/release-history/1.0.0-rc.3), and while there's multiple goodies in there, the schedular is the one that interests me the most. Currently the only docs are in the [release notes](https://boxlang.ortusbooks.com/readme/release-history/1.0.0-rc.3#schedulers), but there's enough information there to get started. Here's a quick look at what's been added.

First off - just in case it isn't obvious, the idea here is to write code that can execute by itself on some predefined schedule. There's multiple different use cases for this - performing backups, refreshing data from an API, logging stats and so forth. In BoxLang, scheduled tasks can be defined in CLI scripts, for web applications, and at the server level itself. Where you do this depends on whatever you have in mind. 

Code wise, you load a BoxLang class that can define one or more tasks, each with it's own name, schedule, and code. This class can also define multiple different lifecycle events giving you the ability to run things before task execution, after it, and more. Let's look at a small example. 

```js
class {

	property name="scheduler";

	function configure(){
		// Setup Scheduler Properties
		scheduler.setSchedulerName( "My-Scheduler" )
		scheduler.setTimezone( "UTC" )

		// Define a task
		scheduler.task( "My test Task" )
			.call( () -> {
				println( "The cat saws meow: #now()#" );
			} )
			.every( 5, "second" );
	}

}
```

This minimal example has one method, `configure`, which sets properties (name and time zone) and defines one task. The single arrow call there (`->`) defines a lambda function, but closures can be used as well. The task simply prints out a message and finally a schedule of every five seconds is used. 

From the command line, this can be run with the `boxlang` CLI:

```bash
boxlang schedule simpletask.bx
```

And will output to the terminal every five seconds:

```bash
The cat saws meow: {ts '2025-04-04 08:48:42'}
The cat saws meow: {ts '2025-04-04 08:48:47'}
The cat saws meow: {ts '2025-04-04 08:48:52'}
The cat saws meow: {ts '2025-04-04 08:48:57'}
The cat saws meow: {ts '2025-04-04 08:49:03'}
The cat saws meow: {ts '2025-04-04 08:49:08'}
```

Killing the script (CTRL+C) kills the scheduled task, so don't forget you can run it as a background task, for example, using the & operator in Unix type shells:

```bash
boxlang schedule simpletask.bx &
```

Personally I'd just open a new tab in my terminal so I don't have to look up the process later to kill it. 

That's the basic idea, but you can do a lot more, including:

* Define a startup and shutdown hook for the scheduler.
* Define an error handler for tasks.
* Define a success handler for tasks.
* Define a before and after hook for a task.

I'm going to steal from the example Luis shared with me that shows a "complete" scheduled task class using every possible method:

```js
class {

	// Properties
	property name="scheduler";
	property name="runtime";
	property name="logger";
	property name="asyncService";
	property name="cacheService";
	property name="interceptorService";

	/**
	 * The configure method is called by the BoxLang runtime
	 * to allow the scheduler to configure itself.
	 *
	 * This is where you define your tasks and setup global configuration.
	 */
	function configure(){
		// Setup Scheduler Properties
		scheduler.setSchedulerName( "My-Scheduler" )
		scheduler.setTimezone( "UTC" )

		// Define a lambda task
		scheduler.task( "My test Task" )
			.call( () -> {
				println( "I am a lambda task: #now()#" );
			} )
			.every( 10, "second" );
	}

	/**
	 * --------------------------------------------------------------------------
	 * Life - Cycle Callbacks
	 * --------------------------------------------------------------------------
	 */

	/**
	 * Called after the scheduler has registered all schedules
	 */
	void function onStartup(){
		println( "I have started! " & scheduler.getSchedulerName() );
	}

	/**
	 * Called before the scheduler is going to be shutdown
	 */
	void function onShutdown(){
		println( "I have shutdown! " & scheduler.getSchedulerName() );
	}

	/**
	 * Called whenever ANY task fails
	 *
	 * @task      The task that got executed
	 * @exception The exception object
	 */
	function onAnyTaskError( task, exception ){
		println( "Any task [#task.getName()#]  blew up " & exception.getMessage() );
	}

	/**
	 * Called whenever ANY task succeeds
	 *
	 * @task   The task that got executed
	 * @result The result (if any) that the task produced as an Optional
	 */
	function onAnyTaskSuccess( task, result ){
		println( "on any task success [#task.getName()#]"  );
		println( "results for task are: " & result.orElse( "No result" ) );
	}

	/**
	 * Called before ANY task runs
	 *
	 * @task The task about to be executed
	 */
	function beforeAnyTask( task ){
		println( "before any task [#task.getName()#]"  );
	}

	/**
	 * Called after ANY task runs
	 *
	 * @task   The task that got executed
	 * @result The result (if any) that the task produced as an Optional
	 */
	function afterAnyTask( task, result ){
		println( "after any task completed [#task.getName()#]"  );
		println( "results for task are: " & result.orElse( "No result" ) );
	}

}
```

Alright, so how about a slightly realistic example? As most of my readers know, I can't get enough of weather APIs. I built a simple wrapper about the [Pirate Weather API](https://pirateweather.net/en/latest/) that would give me a nice weather report in my terminal. Here's that code:

```js
class {

	property name="scheduler";

	function configure(){
		scheduler.setSchedulerName( "My-Scheduler" )
		scheduler.setTimezone( "UTC" )

		scheduler.task( "Weather Task" )
			.call( () => {
				weather = getWeather(server.system.environment.PIRATE_KEY, 30.216667, -92.033333);
				report = "
Current Conditions:	#weather.currently.summary#
Current Temperature:	#int(weather.currently.temperature)#F
Todays Low/High: 	#int(weather.daily.data[1].temperatureLow)#F / #int(weather.daily.data[1].temperatureHigh)#F
				";
				println(report);
			} )
			.every( 1, "hour" );
	}

	/**
	 * Called whenever ANY task fails
	 *
	 * @task      The task that got executed
	 * @exception The exception object
	 */
	function onAnyTaskError( task, exception ){
		println( "Task [#task.getName()#]  blew up: " & exception.getMessage() );
	}

	struct function getWeather(key,lat,long) {
		apiURL = "https://api.pirateweather.net/forecast/#arguments.key#/#arguments.lat#,#arguments.long#";
		bx:http url=apiURL result="result";
		return jsonDeserialize(result.filecontent);
	}
}
```

All this does is configure a task that wraps a call to `getWeather` (which itself wraps a call to the Pirate Weather API) and displays the current conditions and temps to my terminal. I set it to run once an hour as I figured that would be sensible for weather information. If the layout of the text above looks a bit weird, that's simply what worked for me in my terminal with spacing. As an example:

```bash
- Starting scheduler from file: [weathertask.bx]
√ Scheduler registered successfully
Press Ctrl+C to stop the scheduler and exit.
=========================================

Current Conditions:     Breezy and Partly Cloudy
Current Temperature:    78F
Todays Low/High:        76F / 84F
```

You can find the source for this demo here: <https://github.com/ortus-boxlang/bx-demos/blob/master/scripting/weathertask.bx>

So as I mentioned above, you can use these scheduled tasks at the command line, but also within a web application as well. In fact, I've had a small BoxLang app I've been waiting to share as it needed this feature. I'll share that sometime next week. But the syntax there would be this in your `Application.bx` file:

```js
class {

    this.schedulers = [ "path.to.Scheduler" ]

}
```

Also, there's multiple [new functions](https://boxlang.ortusbooks.com/readme/release-history/1.0.0-rc.3#scheduler-bifs) that allow for programmatic access and manipulation of tasks. Check the docs I just linked to for more information. 