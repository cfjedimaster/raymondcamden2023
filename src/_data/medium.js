import Parser from 'rss-parser';
import https from 'https';

let parser = new Parser({
  requestOptions: {
    timeout: 5000,
    agent: new https.Agent({ keepAlive: false }),
  },
});

export default async function() {
	let feed;
	if(process.env.SKIP_REMOTE_DATA) return [];
	try {
		feed = await parser.parseURL('https://medium.com/feed/@cfjedimaster');
	} catch(e) {
		console.log('medium error');
		return [];
	}
	return feed.items;
	
};
