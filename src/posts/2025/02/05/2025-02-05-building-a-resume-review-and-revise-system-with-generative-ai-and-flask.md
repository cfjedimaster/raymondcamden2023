---
layout: post
title: "Building a Resume Review and Revise System with Generative AI and Flask"
date: "2025-02-05T18:00:00"
categories: ["development"]
tags: ["generative ai", "python"]
banner_image: /images/banners/cat_resume.jpg
permalink: /2025/02/05/building-a-resume-review-and-revise-system-with-generative-ai-and-flask
description: An overview of the Flask web app I built to demonstrate generative AI features.
---

The last two sessions of my live stream, [Code Break](https://cfe.dev/talkshow/code-break/), have been really interesting, at least to me anyway. I've been discussing generative AI with Google [Gemini](https://ai.google.dev/) and building a relatively simple example while doing so - a resume review and revisement system. This started off pretty simply with a Python script and then iterated into a proper [Flask](https://flask.palletsprojects.com/en/stable/) app. I thought it would be fun to document the code here a bit and share it with those who couldn't make the streams. If you would rather just watch the recordings, I've got them embedded at the bottom. Feel free to skip to that.

## Step One - The Script

For my first iteration, I built a simple Python script that:

* Uploaded the PDF to Gemini's file storage
* Asked for a review
* Dumped it to the console

This was done to demonstrate multimodal prompts via Gemini initially, but ended up being the idea for the web app I built in the stream. The amount of code needed to demonstrate this is rather silly, as in silly short:

```python
import os 
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

model = genai.GenerativeModel("gemini-1.5-flash")

sample_doc = genai.upload_file(path='./Raymond Camden.pdf', mime_type='application/pdf')

prompt = "This is a resume. Provide feedback on the resume including suggestions for improvement."

response = model.generate_content([sample_doc, prompt])
print(response.text)
```

For my input, I'm using a copy of my [resume](/resume.html). The output is pretty intensive and spot on. (I've actually got a revised resume coming soon. A former coworker of mine provided some great feedback and I need to integrate that soon!)

<div style="background-color:#c0c0c0; height: 500px;overflow:scroll;padding:10px">
This resume is quite good, showcasing a strong career progression and impressive accomplishments. However, there are a few areas for improvement to make it even more impactful:

**Strengths:**

* **Quantifiable Achievements:** The resume effectively uses numbers to demonstrate the impact of the candidate's work (e.g., 33% increase in developer sign-ups, 60+ blog posts). This is excellent and should be maintained.
* **Clear Structure:** The resume is well-organized and easy to read, with clear section headings and bullet points.
* **Strong Keywords:**  The skills section and the descriptions throughout the resume incorporate relevant keywords for applicant tracking systems (ATS) and recruiters.
* **Comprehensive Experience:** The resume details a significant amount of experience and accomplishments across various roles.

**Areas for Improvement:**

* **Resume Summary/Objective:** The resume lacks a compelling summary or objective statement at the top.  Add a brief paragraph (3-4 sentences) highlighting the candidate's key skills and career goals.  For example:  "Highly accomplished and results-oriented Developer Evangelist with over [Number] years of experience building thriving developer communities and driving significant growth in API adoption. Proven ability to create engaging content, deliver impactful presentations, and foster strong relationships with developers. Seeking a challenging role where I can leverage my expertise to further enhance developer experiences and drive business success."
* **Action Verbs:** While many action verbs are used, consider strengthening them further. Replace weaker verbs like "Created" with more dynamic ones such as "Developed," "Architected," "Spearheaded," "Implemented," "Launched," "Revolutionized," etc., depending on the context.
* **Results-Oriented Language:** While numbers are used, further emphasize the *impact* of the accomplishments.  Instead of just stating what was done, focus on the business results achieved.  For example, instead of "Created new documentation," try "Developed comprehensive documentation resulting in a 15% reduction in developer support tickets."
* **Conciseness:** Some bullet points are a bit lengthy.  Break them down into shorter, more impactful points.
* **Skills Section:** The skills section is good, but could be enhanced by categorizing the skills (e.g., Programming Languages, Tools, Soft Skills). Consider adding more specific skills relevant to each role. For example, if a role involved specific API platforms, list those.
* **Visual Appeal:**  While the content is strong, consider using a more modern and visually appealing resume template.  A clean, professional design can make a big difference.  This doesn't need to be overly flashy, but a slight upgrade in formatting would be beneficial.
* **Tailoring:** This resume is fairly generic.  Before submitting it, tailor it to each specific job application.  Highlight the skills and experiences most relevant to the specific job description.

**Example of Improved Bullet Point:**

Instead of:  "Developer Evangelism: Created new documentation and revamped existing resources to help our developers onboard to our APIs and services, directly leading to a 33% increase in developer sign ups."

Try:  "Spearheaded the development of comprehensive new API documentation and revamped existing resources, resulting in a 33% surge in developer sign-ups and a 10% reduction in onboarding time."  (The 10% is hypothetical, you'd need to quantify that improvement based on actual data).


By incorporating these suggestions, the resume will be even stronger and more likely to impress potential employers. Remember to always proofread carefully before submitting.
</div>

## Step Two - Flask App

With that script done, I started work on the Flask app. While I encourage you to check out the [Flask quickstart](https://flask.palletsprojects.com/en/stable/quickstart/), you can also look at my blog post from last month, ["Simple Blog Example in Flask"](https://www.raymondcamden.com/2025/01/13/simple-blog-example-in-flask). The basic idea is - you create a main application file that defines routes and logic, and then add your templates and static assets. It's really well done and lightweight and honestly just makes me love Python even more. 

Here's my *entire* Flask app:

```python
from flask import Flask
from flask import render_template, request 
from gemini import Gemini 

app = Flask(__name__)

gemini = Gemini()

@app.route("/")
def hello_world():
	return render_template('index.html')

@app.post("/review")
def handleReview():
	f = request.files['file']
	f.save('./pdfs/input.pdf')
	result = gemini.review('./pdfs/input.pdf')
	return result
```

Basically two routes. The first simply loads up my front end while the second is meant to wait for the user to submit their resume. Even if you've never used Flask before, you can probably see a big issue in `handleReview`, namely that I'm saving a file upload to a hard coded value. There's multiple ways I could handle that better. I could use a UUID for the name so it's dynamic. I could even bypass the filesystem and pass the bits directly to my Gemini code. Also, I never delete the file either. So yes, not ideal, but for the stream, it was quick and dirty.

The `Gemini` class referenced above was simply a class wrapper to the script I made earlier. 

```python
import os 
import google.generativeai as genai

class Gemini:
	
	def __init__(self):
		genai.configure(api_key=os.environ["GEMINI_API_KEY"])
		self.model = genai.GenerativeModel("gemini-1.5-flash")

	def review(self, path):
		sample_doc = genai.upload_file(path=path, mime_type='application/pdf')
		prompt = "This is a resume. Provide feedback on the resume including suggestions for improvement."

		response = model.generate_content([sample_doc, prompt])
		return response.text
```

## Step Three - The Front End 

On the front end, I've got HTML first:

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title></title>
</head>
<body>

<h1>Resume Reviewer</h1>

<p>
<label for="file">Select your resume: </label>
<input type="file" id="file" name="file" accept=".pdf"/>
</p>

<button id="submit">Review</button>

<div id="results"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/15.0.6/marked.min.js"></script>
{% raw %}<script src="{{ url_for('static', filename='app.js') }}"></script>{% endraw %}
</body>
</html>
```

The HTML is just a file input field, a button, and a div for results. I'm using the Marked library here as the result from Gemini will be Markdown and this will let me render it nicely. 

Now for the JavaScript:

```js
document.addEventListener('DOMContentLoaded', init, false);

let $fileInput, $reviewButton, $results;

async function init() {

	$fileInput = document.querySelector('#file');
	$reviewButton = document.querySelector('#submit');
	$results = document.querySelector('#results');

	$reviewButton.addEventListener('click', handleReview, false);
}

async function handleReview(e) {
	e.preventDefault();

	if($fileInput.files.length === 0) return;
	$reviewButton.disabled = true;
	let file = $fileInput.files[0];
	// Create a form body object to post the file
	let formData = new FormData();
	formData.append('file', file);

	let resp = await fetch('/review', { 
		method: 'POST', 
		body: formData 
	});
	let json = await resp.json();
	let result = marked.parse(json.review);
	$results.innerHTML = result;
	$reviewButton.disabled = false;

}
```

This is all fairly typical DOM stuff - notice a click on the button, see if the user picked a file, and if so, post it back to Flask as an attached file. I take the result, parse the Markdown and render it. 

At this point, the application worked well. It's not terribly pretty, but it works:

<p>
<img src="https://static.raymondcamden.com/images/2025/02/resume1.jpg" alt="Sample output from the application, a review of my resume" class="imgborder imgcenter" loading="lazy">
</p>

## Step Four - More Cowbell

At this point in the stream, I had about twenty or so minutes left and wasn't exactly sure what to do next. This is where my buddy Brian Rinaldi came up with a stellar idea. 

<p>
<img src="https://static.raymondcamden.com/images/2025/02/cowbell.jpg" alt="Walken from the classic SNL skit involving cowbell" class="imgborder imgcenter" loading="lazy">
</p>

He asked - what if the generative AI system could actually create the new resume for me? That sounded like a great idea so I decided to take a stab at it.

First, I created a new version of my simple script:

```python
import os 
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

model = genai.GenerativeModel("gemini-1.5-flash")

sample_doc = genai.upload_file(path='./Raymond Camden.pdf', mime_type='application/pdf')

prompt = "This is a resume. Provide feedback on the resume including suggestions for improvement. After the suggestions, add a dashed line and then provide a text version of the resume with improvements applied."

response = model.generate_content([sample_doc, prompt])
print(response.text)
```

The only change here is the prompt where I tell Gemini to add a dashed line and then include the new resume. Why the dashed line? Just so I could visually see where the review switched over to the revised document. 

I ran this quickly and it worked well. So the next step was to integrate it into the application. However, I didn't want to rely on a "dashed line" to parse the results. Gemini supports [structured output](https://ai.google.dev/gemini-api/docs/structured-output?lang=python) in a variety of ways, the easiest being JSON Schema, where you tell the AI, "this is how I want things returned, precisely in this structure". 

In order to make this easier, I went to [AI Studio](https://aistudio.google.com/), enabled "Structured output" in my prompt, and used their visual editor:

<p>
<img src="https://static.raymondcamden.com/images/2025/02/resume2.jpg" alt="Visual schema editor in AI Studio" class="imgborder imgcenter" loading="lazy">
</p>

I used the 'Get Code' button which gave me updated Python code to use the typing. Here's the new version of the `Gemini` class:

```python
import os 
import google.generativeai as genai
from google.ai.generativelanguage_v1beta.types import content

class Gemini:
	
	def __init__(self):
		genai.configure(api_key=os.environ["GEMINI_API_KEY"])

		generation_config = {
		"temperature": 1,
		"top_p": 0.95,
		"top_k": 40,
		"max_output_tokens": 8192,
		"response_schema": content.Schema(
			type = content.Type.OBJECT,
			enum = [],
			required = ["review", "revisedResume"],
			properties = {
			"review": content.Schema(
				type = content.Type.STRING,
			),
			"revisedResume": content.Schema(
				type = content.Type.STRING,
			),
			},
		),
		"response_mime_type": "application/json",
		}

		self.model = genai.GenerativeModel(model_name="gemini-1.5-flash", generation_config=generation_config)

	def review(self, path):
		sample_doc = genai.upload_file(path=path, mime_type='application/pdf')
		prompt = "This is a resume. Provide feedback on the resume including suggestions for improvement. After the suggestions, add a dashed line and then provide a text version of the resume with improvements applied."

		response = self.model.generate_content([sample_doc, prompt])
		return response.text
```

As you can see, I'm asking for `review` and `revisedResume` in my results. 

I plugged this in, and then made a small change to my JavaScript. Here's the relevant bits:

```js
let resp = await fetch('/review', { 
	method: 'POST', 
	body: formData 
});

let json = await resp.json();
let html = `
<h2>Review</h2>
${marked.parse(json.review)}
<h2>Revised Resume</h2>
${marked.parse(json.revisedResume)}
`;
$results.innerHTML = html;
```

Basically I just add some H2 headers around each part, parse each one, and dump the whole thing in the DOM. Here's a screen shot of that portion of the result in the web app. Do note that while Gemini revised the resume, it left comments/instructions in there that I'd need to actually address, so I can't just copy and paste per se. In theory, I could revise the prompt to try to avoid that, but I was happy stopping here.

<p>
<img src="https://static.raymondcamden.com/images/2025/02/resume3.jpg" alt="Revised resume" class="imgborder imgcenter" loading="lazy">
</p>

## Code, Videos, and More

All in all, I was pretty impressed with how well this all worked, and code wise, it's a pretty tiny application. You can see everything here: <https://github.com/cfjedimaster/codebr/tree/main/genai1>

If you want to watch the videos, you can find them below:

{% liteyoutube "lbMYi59xPjA" %}
<p>
{% liteyoutube "FNusd5ZbPBE" %}

As always, let me know what you think and leave me a comment below.