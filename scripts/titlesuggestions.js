#!/usr/bin/env node

/*
Given an input MD file, grab the title, and ask Google's AI APIs to offer suggestions. 
*/

const fs = require('fs');
const fm = require('front-matter');
require('dotenv').config({path:__dirname + '/.env'});

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GOOGLE_AI_KEY;

async function runGenerate(title) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
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
    {text: `Given the following title for a blog post, share three suggestions that may improve the title and drive traffic to the post:  \"${title}\". 
    Present your answer in JSON form. The top level key of the JSON result should be "suggestions" and each suggestion should use the key "title" for the suggested title and "reasoning" for the reasoning.
    
    The returned JSON should look like the following sample:

    [
      { 
        title: "First suggested title", 
        reasoning: "This is the reason for the suggestion."
      }
    ]
   
    `},
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  // remove backticks and parse. I'm seeing ```json sometimes too
  //console.log('DEBUG', response.text());
  return JSON.parse(response.text().replace(/```/mg, '').replace(/```json/mg,''));
}

(async () => {
  if(process.argv.length === 2) {
    console.log('Usage: titlesuggestions.js <<path to md>>');
    process.exit(1);
  } 

  const mdPath = process.argv[2];
  if(!fs.existsSync(mdPath)) {
    console.log(`Unable to find ${mdPath}.`);
    process.exit(1);
  }

  const contents = fs.readFileSync(mdPath,'utf-8');
  let title  = fm(contents).attributes.title;
  console.log(`\nGenerating suggestions for: ${title}`);
  console.log('------------------------------------------------------------------------');

  let suggestions = (await runGenerate(title)).suggestions;
  //console.log(suggestions);
  suggestions.forEach(s => {
    console.log(`Suggested Title: ${s['title']}\n\nReasoning: ${s['reasoning']}\n`);
    console.log('------------------------------------------------------------------------');
  });
})();