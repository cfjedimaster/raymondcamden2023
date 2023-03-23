const { getPosts } = require('./config/collections/index.js');
const { extractExcerpt, hasAnyComments, commentInclude } = require('./config/shortcodes/index.js');
const { ageInDays, catTagList, myEscape, my_xml_escape, titlecase, toTitle, postCategories, postTags } = require('./config/filters/index.js');

const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const eleventySass = require('eleventy-sass');

module.exports = function(eleventyConfig) {

	eleventyConfig.addPassthroughCopy({'src/assets/css/*.css':'css'});
	eleventyConfig.addPassthroughCopy({'src/assets/js':'js'});
	eleventyConfig.addPassthroughCopy({'src/assets/images':'images'});
	eleventyConfig.addPassthroughCopy('src/manifest.json');
	eleventyConfig.addPassthroughCopy('src/_redirects');

	eleventyConfig.addCollection('posts', getPosts);

	eleventyConfig.addShortcode('excerpt', post => extractExcerpt(post));
	eleventyConfig.addShortcode('hasAnyComments', hasAnyComments);
	eleventyConfig.addShortcode('commentInclude', commentInclude);

	eleventyConfig.addFilter('ageInDays', ageInDays);
	eleventyConfig.addFilter('catTagList', catTagList);
	eleventyConfig.addFilter('myEscape', myEscape);
	eleventyConfig.addFilter('my_xml_escape', my_xml_escape);
	eleventyConfig.addFilter('titlecase', titlecase);
	eleventyConfig.addFilter('toTitle', toTitle);
	eleventyConfig.addFilter('postCategories', postCategories);
	eleventyConfig.addFilter('postTags', postTags);

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