#!/usr/bin/env node

/*
Given an input MD file, grab the text, scrub code, and ask for a summary.
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

async function runGenerate(text) {
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
    {text: `Given the following blog post, write a one sentence summary to use as the description:\n${text}
    `},
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.candidates[0].content.parts[0].text;
  
}

/*
I'm responsible for 'cleaning' up the text before sending to Google. For now, I'll just remove code blocks,
but in the future I may remove images too. Also remove double blank lines. Oh, also remove FM.
*/
function cleanup(str) {
	str = str.replace(/```(.*?)```/sg, '');
	str = str.replace(/---(.*?)---/sg, '');
	str = str.replace(/\n{3,}/g, '\n');
	return str.trim();
}

(async () => {
	if(process.argv.length === 2) {
		console.log('Usage: summarysuggestions.j <<path to md>>');
		process.exit(1);
	} 

	const mdPath = process.argv[2];
	if(!fs.existsSync(mdPath)) {
		console.log(`Unable to find ${mdPath}.`);
		process.exit(1);
	}

	let contents = fs.readFileSync(mdPath,'utf-8');
	let title  = fm(contents).attributes.title;

	// Make it nicer!
	contents = cleanup(contents);

	console.log(`\nGenerating summary suggestion for: ${title}`);
	console.log('------------------------------------------------------------------------');

  	let suggestion = (await runGenerate(title));
  	console.log(suggestion);
})();