/*
As the name of the file says, I'm run to completely rebuild my Algolia index. To be fair, I don't delete, 
but I'll use the "all" index to suck down ALL my content. 
*/

/*
My code for successful deploys now consists of two main actions. Send me a nicer email and update my Algolia index.
*/
require('dotenv').config();
const algCredentials = { appId: process.env.ALG_APP_ID, apiKey: process.env.ALG_API_KEY, indexName: 'raymondcamden' };

const fetch = require('node-fetch');

const algoliaSearch = require('algoliasearch');
const algolia = algoliaSearch(algCredentials.appId, algCredentials.apiKey);
const index = algolia.initIndex(algCredentials.indexName);


(async () => {

	// first, get my index
	let dataResp = await fetch('https://www.raymondcamden.com/algolia.json');

	let data = await dataResp.json();

	console.log('Successfully got the data, size of articles and most recent: '+data.length, data[0].title);


	let requests = [];

	for(let i=0;i<data.length;i++) {
		/*
		define an objectID for Algolia
		*/
		let d = data[i];
		d.objectID = d.url;
		requests.push({
		'action':'updateObject',
		'body':d
		});
	};
	console.log('Batch data object created to add to Algolia index');

	try {
		let batchResult = await index.batch(requests);
		console.log('batchResult', batchResult);
	} catch(e) {
		console.log('An error was thrown', e);
	}

})();