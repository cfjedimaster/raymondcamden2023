import Parser from 'rss-parser';
let parser = new Parser();

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
