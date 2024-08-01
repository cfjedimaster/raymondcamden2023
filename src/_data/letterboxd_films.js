import Parser from 'rss-parser';
let parser = new Parser();

export default async function() {

	// short circuit at home to make it quicker...
	if(process.env.ELEVENTY_ROOT.includes('/home/ray')) return [];

	// letterboxd was down 3/28/2024, so for now, try/catch, later: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race#using_promise.race_to_implement_request_timeout
	let feed = [];
	try {
		feed = await parser.parseURL('https://letterboxd.com/raymondcamden/rss/');
	} catch(e) {
		console.log('letterboxd error');
		return [];
	}
	
	return feed.items.map(f => {
		let name = f.title.split(' - ')[0];
		let image = f.content.replace(/.*<img src="(.*?)"\/>.*/,'$1');
		return {
			name,
			link:f.link,
			image
		}
	});
	
};
