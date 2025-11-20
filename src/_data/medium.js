import Parser from 'rss-parser';
let parser = new Parser();

export default async function() {
	let feed;
	// short circuit at home to make it quicker...
	if(process.env.ELEVENTY_ROOT.includes('/home/ray')) return [];
	try {
		feed = await parser.parseURL('https://medium.com/feed/@cfjedimaster');
	} catch(e) {
		console.log('medium error');
		return [];
	}
	return feed.items;
	
};
