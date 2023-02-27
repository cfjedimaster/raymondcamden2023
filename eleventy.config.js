const { getPosts } = require('./config/collections/index.js');
const { extractExcerpt } = require('./config/shortcodes/index.js');
const { ageInDays } = require('./config/filters/index.js');

const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');

module.exports = function(eleventyConfig) {

	eleventyConfig.addPassthroughCopy("src/assets/css");
	eleventyConfig.addPassthroughCopy("src/assets/js");

	eleventyConfig.addCollection('posts', getPosts);

	eleventyConfig.addShortcode('excerpt', post => extractExcerpt(post));

	eleventyConfig.addFilter('ageInDays', ageInDays);

	/*
	Specifically for auto link headers.
	https://rhianvanesch.com/posts/2021/02/09/adding-heading-anchor-links-to-an-eleventy-site/
	*/
	const markdownItOptions = {
		html: true,
	}

	// Options for the `markdown-it-anchor` library
	const markdownItAnchorOptions = {
		permalink: true, 
		permalinkSymbol: '#'
	}

	const markdownLib = markdownIt(markdownItOptions).use(
		markdownItAnchor,
		markdownItAnchorOptions
	);

	eleventyConfig.setLibrary("md", markdownLib);

	return {
		dir: {
			input:'src',
			layouts:'_layouts',
		}
	};

};