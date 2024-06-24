---
layout: post
title: "Creating a Content Assistant with Gemini and GenAI"
date: "2024-06-24T18:00:00"
categories: ["development"]
tags: ["generative ai"]
banner_image: /images/banners/cat_writing_paper.jpg
permalink: /2024/06/24/creating-a-content-assistant-with-gemini-and-genai
description: Building a general purpose tool for helping writers.
---

One of the use cases for generative AI that I've discussed before is the idea of using the tool to aid in the writing process. I'm not talking about creating content so much as creating suggestions and providing feedback about the content you yourself have created. This past weekend I worked on a "general purpose" tool with this in mind and thought I'd share it to get your feedback. ("You" being the smart readers of this blog who keep me honest when I show something stupid. ;)

## The Application

The application itself is rather straightforward. It asks two questions - first, what are you trying to accomplish with your writing and what are the desired results? The idea is that you (most likely) have some sort of plan for the content. If it's developer documentation, this could simply be "To educate a developer audience about how our tool X lets you do Y." For a school setting, it may be the exact assignment from the teacher.

The second question is simply a place to dump your content.

Here's the UI, built nicely with [Shoelace](https://shoelace.style/), my new favorite web component-based UI library:

<p>
<img src="https://static.raymondcamden.com/images/2024/06/ca1.jpg" alt="Screenshot of the tool showing two form fields for putting in the requested information." class="imgborder imgcenter" loading="lazy">
</p>

Entering your data and hitting the submit button fires off the call to the server and returns the analysis. I used this as a test for requirements:

"I want to write a paper that changes the hearts and minds of my readers so that they are more open to adopting cats, and making cats as part of their lives. It should be both emotional and practical."

And then pasted in some content I got from [Gemini](https://gemini.google.com) (yes, I used GenAI to generate content I asked GenAI to evaluate) and got this in response:

<div style="background-color: #c0c0c0; padding: 5px">
This is a good start to your draft, and it already shows your passion for cats! You've included both emotional and practical elements, which was one of your goals. Here's a breakdown of what's working well and areas for improvement:

<p>

### Strengths:

* Passionate Tone: Your love for cats is evident throughout the piece, which is crucial for connecting with readers emotionally.
* Strong Opening: You immediately grab the reader's attention with a compelling statement about the special nature of cats.
* Good Balance: You strike a decent balance between emotional appeals (unconditional love, special bond) and practical advantages (independent nature, low maintenance).

### Areas for Improvement:

* Specificity: While you mention "playful antics" and "unwavering loyalty," try to provide more specific examples or anecdotes. These will make your arguments more relatable and impactful.
* Address Concerns: Consider acknowledging and gently refuting common concerns people might have about adopting cats (e.g., allergies, scratching furniture). This shows you understand both sides.
* Call to Action: While you encourage adoption, make your call to action stronger. Tell readers how to take the next step (visit a shelter, research online).
* Varied Sentence Structure: Some sentences have a similar structure. Try adding variety for a more engaging read.

### Suggestions for Improvement:

* Anecdote: Consider opening with a heartwarming anecdote about a cat you've known or a touching adoption story.
* Specificity: Instead of just "gentle purrs," describe the feeling of a cat purring on your lap. Instead of "low maintenance," mention that cats groom themselves.
* Address Concerns: You could write, "While some worry about allergies, many hypoallergenic breeds exist, and shelters can help you find the perfect match."
* Call to Action: Conclude with something like, "Visit your local shelter today and meet your new best friend. You won't regret opening your heart and home to the love of a cat."

### Revised Snippet Example (with suggestions incorporated):

"Imagine the soft rumble of a purr vibrating in your lap as a sleek, furry head butts gently against your hand, seeking affection. This is the magic of a cat's companionship, a feeling that transcends words and melts away stress. While some worry about allergies, many hypoallergenic breeds exist, and shelters can help you find the perfect match. Don't let these concerns prevent you from experiencing the joy of a feline friend."

Remember, writing is a process! Keep working on it, and you'll have a persuasive and heartfelt essay encouraging cat adoption.
</div>

That's pretty detailed. Now let's look at the code.

## The Server

I'm going to skip the frontend code as it's literally, "take the form values and throw em at the API", so instead we'll focus on the server, and even there, let's just demonstrate the Gemini calls. I wrote a function that takes in the two values entered by the user and then wraps it in a prompt. I also used system instructions (in the too-short named `si` variable below) to guide the responses.

```js
const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.GOOGLE_API_KEY;

const si = `
You are an editor who will evaluate a rough draft based on how well it addresses specific criteria. You will provide feedback and suggestions for improvement.
`;

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: MODEL_NAME, 
	systemInstruction: {
		parts: [{ text:si }],
		role:"model"
	} 
});


async function callGemini(description, content) {

	const generationConfig = {
		temperature: 0.9,
		topK: 1,
		topP: 1,
		maxOutputTokens: 2048,
	};

	
	const safetySettings = [
		{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,	threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
		{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
	];
	

	let text = `
Here was the criteria for the content, including requirements and desired outcomes:

${description}

Here is the first draft of the content:

${content}
	`;

	const parts = [
    	{text},
  	];

	const result = await model.generateContent({
		contents: [{ role: "user", parts }],
		generationConfig,
		safetySettings
	});

	//console.log(JSON.stringify(result,null,'\t'));

	try {

		if(result.response.promptFeedback && result.response.promptFeedback.blockReason) {

			return { error: `Blocked for ${result.response.promptFeedback.blockReason}` };
		}
		const response = result.response.candidates[0].content.parts[0].text;
		return { response };
	} catch(e) {
		// better handling
		return {
			error:e.message
		}
	}
	
}
```

The net result is a block of text that is passed to the front end. Since it typically includes Markdown, I used a Markdown processor to display it nicely. Code-wise, this is nothing more than "take the input and feed it to Gemini", so technically it's not difficult at all, but it seems to work well. Let's consider two examples.

## Example One - A Blog Post

I began by using this post, [Scraping Recipes Using Node.js, Pipedream, and JSON-LD](https://www.raymondcamden.com/2024/06/12/scraping-recipes-using-nodejs-pipedream-and-json-ld) and this set of instructions:

"I want to write a blog post targeting developers that demonstrates how to use Node.js to parse recipes from a web page. "

I then passed in my Markdown, minus frontmatter. Here's the result:

<div style="background-color: #c0c0c0; padding: 5px">
Overall, this is a good start to a blog post about using Node.js to parse recipes from a web page! You do a good job of explaining the problem and your approach to solving it, and your code is well-written and easy to follow. However, there are a couple of things you can improve.

### Here are some suggestions for improvement:

* Target Audience and Tone: While the technical content is good, the introductory section feels a bit informal for a blog post aimed at developers. Phrases like "90% crap" and "go to town" might be too colloquial. Consider a slightly more professional tone, focusing on the technical challenges and solutions.

* Clearer Focus on JSON-LD: While you eventually get there, the introduction spends a lot of time discussing irrelevant details about recipe websites and Saffron. Jump into the core topic of JSON-LD and its benefits for recipe parsing more quickly.

* Code Structure and Explanation:

	* The findLDJSON function's logic for handling both array and @graph structures could be made more robust and efficient. Consider consolidating the logic and explaining the reasoning behind your approach more clearly.
	* Provide more context and explanation around the findRecipe function. Explain why you're renaming keys and the reasoning behind your choices.
	* The code comments are generally helpful, but some are excessively long and could be incorporated into the surrounding prose for better flow.

* More Engaging Conclusion:

	* The "Results" section feels a bit repetitive. Instead of displaying multiple full results, consider summarizing your findings, highlighting any interesting patterns or variations you encountered.
	* Discuss potential improvements or next steps for the project. For example, you could mention handling "additional time" as you noted or exploring ways to handle recipes that don’t use JSON-LD.
	* Encourage reader interaction by asking questions or suggesting challenges related to recipe parsing.

### Example Edits:

* Original: "It's pretty well known now that most, if not all, recipes on the internet..."

* Revised: "Many online recipes are structured in a way that makes it difficult to extract just the essential information..."

* Original: "I'd normally explain the workflow, but it's just an HTTP workflow..."

* Revised: "To streamline the process, I've created a Pipedream workflow... (link to GitHub). While the workflow itself is straightforward, the core logic lies within the Node.js code, which..."

By implementing these suggestions, you can improve the clarity, focus, and engagement of your blog post, making it more informative and valuable for your target audience of developers.
</div>

As the writer, the first bullet point is accurate, but doesn't represent the fact that I'm writing for a personal blog. However, I could have also *said* that in my first portion. For example, I could have mentioned it was for a personal, not a company blog post. To the second point... eh... maybe. ;) I do tend to ramble at times. I feel like this is a valid point that I'd *consider*, but would be 50/50 on rather or not I'd actually do the edit.

Now, the next part, Code Structure and Explanation, is pretty badass. I wasn't even expecting it to talk about my code samples, and actually, they feel spot on. In fact, the first item is something I noted myself.

Finally, yeah, I suck at conclusions, always have. :>

## Example Two - Historical Essay

For my next demo, I reached out to the son of one of my best friends, Tyler Stroz. He had a thirty-four page Word document entitled, "The Plan Behind The Curtain: Operation Fortitude—The Allied Deception Strategy That Was Overshadowed By The Normandy Invasion". I took that Word document, exported to text (knowing it would be an imperfect translation), and used these admittedly vague instructions: "Write a paper discussing any aspect of D-Day.  Your paper should include references to source materials."

Here were the results:

<div style="background-color: #c0c0c0; padding: 5px">
Essay Evaluation: Operation Fortitude

### Strengths:

* Solid Topic Choice: Focusing on Operation Fortitude is an excellent choice, as it's often overshadowed by the Normandy invasion itself.
* Good Research: The essay utilizes a variety of sources, including primary and secondary material, demonstrating a strong research effort.
* Clear Structure: The essay follows a logical structure, moving from a literature review to specific details about the operation and its impact.

### Areas for Improvement:

* Thesis Statement: The essay lacks a clear, concise thesis statement in the introduction. Right now, the closest thing to a thesis statement is: "While the Normandy Invasion was a resounding success, it would have been incapable of achieving its objectives without the extensive planning, the plethora of resources, and the precise implementation of Operation Fortitude and its conjoined deception strategies." This is a good start, but it could be more focused and argumentative.
* Argumentation: While the essay presents a lot of information about Operation Fortitude, it sometimes reads more like a summary than an argument. The essay would be stronger if it more clearly and consistently argued how and why Operation Fortitude was crucial to the success of D-Day. For instance, directly connect specific Axis troop movements to Allied deception.
* Engagement with Sources: While the essay cites many sources, it sometimes summarizes them without fully engaging with their arguments or putting them in conversation with each other. Consider the following:
* Direct Quotation: Use direct quotations more often to bring in the voices of historians and primary sources.
* Analysis: Analyze the sources' arguments and perspectives. Do historians disagree about the importance of certain aspects of Operation Fortitude?
* Synthesis: Connect different sources to build a more nuanced and complex understanding of the operation.
* Concision and Clarity: The essay could be more concise and to-the-point.
* Sentence Structure: Vary sentence structure and length to improve readability.
* Word Choice: Use more precise and active verbs. For example, instead of "The Allies understood," consider "Allied strategists recognized."
* Paragraph Length: Break up lengthy paragraphs for better flow.

### Specific Suggestions:

* Rework the Introduction: Start with a hook to grab the reader's attention. Then, clearly state your argument about Operation Fortitude's importance in a strong thesis statement.
* Develop Body Paragraphs: Each body paragraph should focus on a specific aspect of your argument. Make sure to use evidence from your sources to support your claims and analyze how those sources contribute to the overall understanding of Operation Fortitude's success.
* Provide Specific Examples: When discussing the impact of Operation Fortitude, provide specific examples of how it influenced Axis decisions and troop movements. Use maps, dates, and numbers to make your points more concrete.
* Refine the Conclusion: Summarize your main points and restate your argument in a clear and compelling way. Offer some concluding thoughts about the significance of Operation Fortitude in the broader context of World War II.

Overall: This is a good start to your essay! By incorporating the suggested improvements, you can create a more focused, analytical, and engaging piece of writing that effectively highlights the often-overlooked but crucial role of Operation Fortitude in the success of D-Day.
</div>

I asked Ty what he thought (love ya kid, but I'm not reading a 34 page essay on WW2 ;), and he said that the suggestions were detailed and very specific. 

## The Code (and some notes...)

If you want to see more of the code, or run it yourself, you can find the repo here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/content_assistant>. Note you will need a Google [Gemini](https://aistudio.google.com) key in order to call the APIs, but you can get that for free, so there's no reason not too, right?

As a final quick aside, a few months ago I started using code from [Todd Sharp](https://recursive.codes/) for my Gemini demos to handle creating a super simple web server. I knew my Gemini tests would need a serverside solution, and while that's easy with Netlify or Pipedream, I really wanted something even simpler. Hence the code you'll see in `server.js`. I made a change in this iteration where it now more easily handles multiple static files and I'll probably use this version going forward, but as a reminder, this would *normally* be done in either something like Express, or hosted up on Netlify. Anyway, enjoy.