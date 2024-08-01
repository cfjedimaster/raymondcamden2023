import Parser from 'rss-parser';
let parser = new Parser();

export default async function() {

	// short circuit at home to make it quicker...
	if(process.env.ELEVENTY_ROOT.includes('/home/ray')) return [];
	let feed = await parser.parseURL('https://medium.com/feed/@cfjedimaster');
	return feed.items;
	
};
