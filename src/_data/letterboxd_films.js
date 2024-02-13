const Parser = require('rss-parser');
let parser = new Parser();

module.exports = async function() {

	// short circuit at home to make it quicker...
	if(process.env.ELEVENTY_ROOT.includes('/home/ray')) return [];
	let feed = await parser.parseURL('https://letterboxd.com/raymondcamden/rss/');

	//console.log(feed.items[0]);
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
