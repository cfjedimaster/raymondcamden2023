---
layout: post
title: "Parsing Uploaded Resumes into Form Fields with Google Gemini"
date: "2025-03-04T18:00:00"
categories: ["development"]
tags: ["generative ai", "javascript"]
banner_image: /images/banners/cat_resume.jpg
permalink: /2025/03/04/parsing-uploaded-resumes-into-form-fields-with-google-gemini
description: Parsing a resume into data to be applied to a form.
---

As I've recently become somewhat familiar with job application sites (*sigh*, thanks Adobe), I've noticed an interesting feature some sites use. After selecting your resume to upload, they will parse the resume and either offer to, or automatically, fill in some of the form fields of the application for you. I thought it would be interesting to try this myself making use of Google's [Gemini APIs](https://ai.google.dev/gemini-api/docs). Here's what I discovered.

## The Test Script

As always, I began with a script that would take a hard-coded resume and attempt to parse it. For the most part, this is basic "upload a file and ask the AI to talk about", but in my case, I wanted a very particular set of data back, specifically a JSON object that would attempt to match the following:

* The first and last name from the resume.
* The email address, phone number, and website from the resume.
* Their location, but nothing fancy like city and state, just 'location'.
* The 'introduction' to the resume, or top level paragraph.
* A list of skills
* And finally, a list of previous jobs including the company name, time worked, and a string encompassing a description and list of responsibilities

Google Gemini supports JSON schemas to let you precisely document how you want your resume. In my previous experiments, I've used the 'formal' JSON Schema support via the Node SDK, but for Python, their [docs](https://ai.google.dev/gemini-api/docs/structured-output?lang=python#supply-schema-in-config) made use of `pydantic` and classes, and while I've never used this feature of Python before, it wasn't difficult at all. Here's what I came up with to encompass what I wanted parsed out of the resume:

```python
class WorkExperience(BaseModel):
	company: str
	jobTitle: str
	timeWorked: str 
	description_and_responsibilities: str 

class ResumeInfo(BaseModel):
	firstName: str
	lastName: str
	location: str
	emailAddress: str 
	website: str 
	telephoneNumber: str 
	introduction: str 
	experience: list[WorkExperience] 
	skills: list[str]
```

I liked being able to use JSON Schema in previous demos, but this is *way* easier to read in my opinion and I think I'll use it whenever I'm doing anything like this in Python. Given that schema, here's how I use it with a basic file upload and prompt:

```python
sample_doc = client.files.upload(file='./Raymond Camden.pdf')

prompt = "Parse this resume to find relevant information about the candidate."

response = client.models.generate_content(
	model='gemini-2.0-flash', 
	contents = [prompt, sample_doc],
	config = {
		'response_mime_type': 'application/json', 
		'response_schema': ResumeInfo
	}
)
```

Running this on my [resume](/resume) I get:

```json
{
  "firstName": "Raymond",
  "lastName": "Camden",
  "location": "Lafayette, Louisiana",
  "emailAddress": "raymondcamden@gmail.com",
  "website": "www.raymondcamden.com",
  "telephoneNumber": "(337) 412-8987",
  "introduction": "Experienced developer evangelist with a proven track record of building relationships with developers and helping them succeed. I'm a trusted voice in technical communities with a history of delivering engaging presentations and creating easy to understand blog posts and documentation. I've published multiple books, written over six thousand blog posts, and have spoken to audiences around the globe.",
  "experience": [
    {
      "company": "Adobe",
      "jobTitle": "Principal Developer Evangelist",
      "timeWorked": "2021-2024",
      "description_and_responsibilities": "Developer Evangelism: Increased developer signups by 33% through new documentation and revamped resources to help our developers onboard to our APIs and services. Launched an Office Hours program for Acrobat Services APIs to connect developers with evangelists. Thought Leadership: Introduced over 100,000 developers to our APIs via blog posts (60+), presentations and workshops (30+). Created demo content to inspire and educate developers on the capabilities of our offerings. Developer Advocacy: Over the course of creating a completely revamped API framework and the addition of over 10 new API features, worked with engineering to provide feedback from our developers and help guide new releases to be more successful and developer-friendly. Helped create new processes for the publication of new releases and updates. Team Collaboration: Mentored fellow evangelists and helped my team deliver projects that directly helped both our developers and sales teams better demonstrate our APIs."
    },
    {
      "company": "HERE Technologies",
      "jobTitle": "Lead Developer Evangelist",
      "timeWorked": "2019-2021",
      "description_and_responsibilities": "Developer Evangelism: Created multiple blog posts (30+), presentations (20+), and demonstrations for the HERE Platform. Developer Advocacy: Engaged with our developer community and gathered critical feedback which was used to evolve our offerings. Competitive Analysis: Conducted research into competitors' products and services to identify gaps in our offering and opportunities for growth. Created documentation for our developers to more easily migrate to HERE. Team Collaboration: Helped mentor new developer evangelists on the team. Provided suggestions, feedback, and advice to help them be more successful."
    },
    {
      "company": "American Express",
      "jobTitle": "Senior Engineer, Developer Experience",
      "timeWorked": "2018-2019",
      "description_and_responsibilities": "Developer Evangelism: Worked with engineering and product management to define onboarding and user-education processes for new APIs and offerings. Developer Advocacy: Reviewed existing offerings and worked on documentation improvements to help new developers. Engineering: Worked on both code and documentation (in both Java and Node.js) for existing APIs to make them easier to use."
    },
    {
      "company": "Auth0",
      "jobTitle": "Senior Developer Advocate",
      "timeWorked": "2018-2018",
      "description_and_responsibilities": "Developer Evangelism: Hires as the first evangelist to promote a new offering, Auth0 Extend, a new SaaS offering, by creating documentation, demos, and blog posts, introducing the offering to existing and new Auth0 developers. Team Collaboration: As a team member working on a new product, I helped with product direction and development. This included testing additions and providing feedback in terms of use of use as well as inclusivity."
    },
    {
      "company": "IBM",
      "jobTitle": "Developer Advocate",
      "timeWorked": "2015-2018",
      "description_and_responsibilities": "Developer Evangelism: Helped evangelize both IBM products and open source offerings, including LoopBack, Node.js, and the serverless platform, OpenWhisk. Wrote the book on OpenWhisk and helped developers use serverless technologies. Thought Leadership: Presented at conferences around the world, both on our offerings as well as open source solutions. Team Leadership: Helped expand our team with interviewing and mentoring new hires."
    },
    {
      "company": "Adobe",
      "jobTitle": "Senior Developer Evangelist, Developer",
      "timeWorked": "2011-2015",
      "description_and_responsibilities": "Developer Evangelism: Helped promote new offerings to the web platform, including HTML5 tools as well as mobile development technologies. Thought Leadership: Helped introduce developers to new capabilities of the web platform and embrace standards-based mobile development with the open source Apache Cordova project. Team Collaboration: Helped with Creative Cloud Learn team with documentation and back-end development. Community Engagement: Helped build and manage the tool used by hundreds of Adobe User Groups world-wide."
    }
  ],
  "skills": [
    "Developer evangelism",
    "advocacy",
    "technical writing",
    "editing",
    "API development",
    "usage",
    "generative Al",
    "JavaScript",
    "Web Platform",
    "Node.js",
    "Python",
    "public speaking"
  ]
}
```

For the most part, that's near perfect. The `skills` area has a few misfires... I mean, I guess 'editing' is a skill, I know I value my editors, and I probably called it out so I guess that's not a misfire, but `usage` certainly isn't valid. Also, 'generative Al' should be 'generative AI', but again, in the context of prefilling a form for you, there wouldn't be much at all to correct manually.  

You can find the complete script here: <https://github.com/cfjedimaster/ai-testingzone/blob/main/resume_to_data/test1.py>

## The Web App

For my web application, I borrowed heavily on the [resume review app](https://www.raymondcamden.com/2025/02/05/building-a-resume-review-and-revise-system-with-generative-ai-and-flask) I built early in February. For review, this was a Python Flask web app that let you upload a resume. It then called a server-side Python script to ask Gemini for a review and returned a new version of the resume. 

For this application, I had a simple web page prompting for the resume (as a PDF), and an empty form beneath it waiting to be filled:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/resume1.jpg" alt="Screenshot from application" class="imgborder imgcenter" loading="lazy">
</p>

I'll link to the entire code base as the end, but basically, the application takes the PDF you select and does a POST with the data to the server side code. For example, in Flask, here's how I define that route:

```python
@app.post("/parse")
def handleReview():
	f = request.files['file']
	f.save('./pdfs/input.pdf')
	result = gemini.parse('./pdfs/input.pdf')
	return result
```

Note that like my last demo, this uses a static filename for the upload when it should either pass the binary data directly to my class, or use a UUID provided name instead, and of course, clean up the file when done. 

The real work is done in a Gemini class I built that basically takes my test script and, well, turns it into a re-usable class:

```python
from google import genai
from pydantic import BaseModel
import os 

class WorkExperience(BaseModel):
	company: str
	jobTitle: str
	timeWorked: str 
	description_and_responsibilities: str 

class ResumeInfo(BaseModel):
	firstName: str
	lastName: str
	location: str
	emailAddress: str 
	website: str 
	telephoneNumber: str 
	introduction: str 
	experience: list[WorkExperience] 
	skills: list[str]

class Gemini:
	
	def __init__(self):
		self.client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

	def parse(self, path):
		sample_doc = self.client.files.upload(file=path)
		prompt = "This is a resume. Provide feedback on the resume including suggestions for improvement. After the suggestions, add a dashed line and then provide a text version of the resume with improvements applied."

		prompt = "Parse this resume to find relevant information about the candidate."

		response = self.client.models.generate_content(
			model='gemini-2.0-flash', 
			contents = [prompt, sample_doc],
			config = {
				'response_mime_type': 'application/json', 
				'response_schema': ResumeInfo
			}
		)

		return response.text
```

I love how simple that is, but of course, I skimped on error checking (no error checking still counts as skimping) which helped keep down the lines of code. 

On the front end, my code basically sends the PDF, takes the response, and fills out the form with a bit of manipulation on the more complex fields. Here's the relevant part of that code:

```js
async function handleReview(e) {
	e.preventDefault();

	if($fileInput.files.length === 0) return;
	$parseButton.disabled = true;

	let file = $fileInput.files[0];
	// Create a form body object to post the file
	let formData = new FormData();
	formData.append('file', file);

	let resp = await fetch('/parse', { 
		method: 'POST', 
		body: formData 
	});
	let json = await resp.json();

	// Being a bit lazy here and not making objects for each form field
	document.querySelector('#firstName').value = json.firstName;
	document.querySelector('#lastName').value = json.lastName;
	document.querySelector('#location').value = json.location;
	document.querySelector('#emailAddress').value = json.emailAddress;
	document.querySelector('#website').value = json.website;
	document.querySelector('#telephoneNumber').value = json.telephoneNumber;
	document.querySelector('#introduction').value = json.introduction;
	document.querySelector('#skills').value = json.skills.join(', ');

	document.querySelector('#workHistory').value = json.experience.reduce((s, j) => {
		return s + `Company: ${j.company}
Title: ${j.jobTitle}
Duration: ${j.timeWorked}

${j.description_and_responsibilities}

		`
	},'');

	$parseButton.disabled = false;

}
```

And here's how it looked using my resume:


<p>
<img src="https://static.raymondcamden.com/images/2025/03/resume2.jpg" alt="Screenshot from application showing form fields filled in by my resume" class="imgborder imgcenter" loading="lazy">
</p>

I then tried a resume from [Scott McAllister](https://stmcallister.github.io/) which parsed as such:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/resume3.jpg" alt="Screenshot from application showing form fields filled in by another resume" class="imgborder imgcenter" loading="lazy">
</p>

You can find the complete source for this demo here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/resume_to_data>

All in all, I'm pretty impressed by the results. I've got an idea for a good followup I'll hopefully get to this week. 