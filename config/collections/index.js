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


module.exports = {
	getPosts
};