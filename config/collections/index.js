const categories = collection => {

	let cats = new Set();
	let posts = collection.getFilteredByGlob("./src/posts/**/*.md");

	for(let i=0;i<posts.length;i++) {
		for(let x=0;x<posts[i].data.categories.length;x++) {
			cats.add(posts[i].data.categories[x].toLowerCase());
		}
	}

		return Array.from(cats).sort();
};

const getPosts = collection => {
	let posts = collection.getFilteredByGlob("./src/posts/**/*.md");

	for(let i=0;i<posts.length;i++) {
		posts[i].data.permalink += '.html';
    	posts[i].outputPath += '/index.html';
      	// fix cats here
      	posts[i].data.categories = posts[i].data.categories.map(c => c.toLowerCase())
	}

	return posts;

};


export {
	categories, getPosts
};