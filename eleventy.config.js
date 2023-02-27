const { getPosts } = require('./config/collections/index.js');
const { extractExcerpt } = require('./config/shortcodes/index.js');
const { ageInDays } = require('./config/filters/index.js');


module.exports = function(eleventyConfig) {

	eleventyConfig.addPassthroughCopy("src/assets/css");
	eleventyConfig.addPassthroughCopy("src/assets/js");

	eleventyConfig.addCollection('posts', getPosts);

	eleventyConfig.addShortcode('excerpt', post => extractExcerpt(post));

	eleventyConfig.addFilter('ageInDays', ageInDays);

	return {
		dir: {
			input:'src',
			layouts:'_layouts',
		}
	};

};