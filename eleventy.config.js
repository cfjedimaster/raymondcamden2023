const { getPosts } = require('./config/collections/index.js');
const { extractExcerpt } = require('./config/shortcodes/index.js');
const { ageInDays, catTagList, myEscape } = require('./config/filters/index.js');

const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const eleventySass = require('eleventy-sass');

module.exports = function(eleventyConfig) {

	eleventyConfig.addPassthroughCopy("src/assets/css/*.css");
	eleventyConfig.addPassthroughCopy("src/assets/js");
	eleventyConfig.addPassthroughCopy("src/assets/img");

	eleventyConfig.addCollection('posts', getPosts);

	eleventyConfig.addShortcode('excerpt', post => extractExcerpt(post));

	eleventyConfig.addFilter('ageInDays', ageInDays);
	eleventyConfig.addFilter('catTagList', catTagList);
	eleventyConfig.addFilter('myEscape', myEscape);

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

	eleventyConfig.addPlugin(eleventySass);
	
	return {
		dir: {
			input:'src',
			layouts:'_layouts',
		}
	};

};