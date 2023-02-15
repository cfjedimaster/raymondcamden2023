const { getPosts } = require('./config/collections/index.js');
const { extractExcerpt } = require('./config/shortcodes/index.js');


module.exports = function(eleventyConfig) {

	eleventyConfig.addPassthroughCopy("src/assets/css");
	eleventyConfig.addPassthroughCopy("src/assets/js");

	eleventyConfig.addCollection('posts', getPosts);

	eleventyConfig.addShortcode('excerpt', post => extractExcerpt(post));

	return {
		dir: {
			input:'src',
			layouts:'_layouts',
		}
	};

};