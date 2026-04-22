import { categories, getPosts } from './config/collections/index.js';
import { extractExcerpt, hasAnyComments, commentInclude, lastToot, liteYouTube, darkGist, callout } from './config/shortcodes/index.js';
import { ageInDays, algExcerpt, catTagList, cssmin, fixcattag, getByCategory, myEscape, my_xml_escape, titlecase, toTitle } from './config/filters/index.js';

import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';

import xmlFiltersPlugin from 'eleventy-xml-plugin';
import htmlmin from 'html-minifier';
import postGraph from '@rknightuk/eleventy-plugin-post-graph';
import stoot from './config/shortcodes/stoot.js';

import ejsPlugin from "@11ty/eleventy-plugin-ejs";

import glob from 'glob';
import path from 'path';
import fs from 'fs';


export default function(eleventyConfig) {
	
	// locally, it is blank, in prod, its development (https://docs.netlify.com/configure-builds/manage-dependencies/#node-js-environment)
	eleventyConfig.addGlobalData('isProd', process.env.NODE_ENV === 'production');
	eleventyConfig.addPassthroughCopy({'src/assets/css/*.css':'css'});
	eleventyConfig.addPassthroughCopy({'src/assets/js':'js'});
	eleventyConfig.addPassthroughCopy({'src/assets/images':'images'});
	eleventyConfig.addPassthroughCopy({'src/assets/*.ttf':'fonts'});

	// These assets need to go to root
	eleventyConfig.addPassthroughCopy({'src/assets/manifest.json':'manifest.json'});
	eleventyConfig.addPassthroughCopy({'src/misc/rss.xsl':'rss.xsl'});
	eleventyConfig.addPassthroughCopy({'src/assets/service-worker.js':'service-worker.js'});
	eleventyConfig.addPassthroughCopy({'src/assets/favicon.png':'favicon.png'});
	eleventyConfig.addPassthroughCopy({'src/assets/favicon_large.png':'favicon_large.png'});
	eleventyConfig.addPassthroughCopy({'src/assets/favicon.ico':'favicon.ico'});
	eleventyConfig.addPassthroughCopy({'src/assets/apple-touch-icon.png':'apple-touch-icon.png'});

	eleventyConfig.addPassthroughCopy('src/_redirects');
	eleventyConfig.addPassthroughCopy('src/ads.txt');
	eleventyConfig.addPassthroughCopy({'src/misc/robots.txt':'robots.txt'});

	eleventyConfig.addCollection('categories', categories);
	eleventyConfig.addCollection('posts', getPosts);

	eleventyConfig.addShortcode('excerpt', post => extractExcerpt(post));
	eleventyConfig.addShortcode('hasAnyComments', hasAnyComments);
	eleventyConfig.addShortcode('commentInclude', commentInclude);
	eleventyConfig.addPairedShortcode('callout', callout);
	eleventyConfig.addAsyncShortcode('stoot',stoot);

	eleventyConfig.addAsyncShortcode('lasttoot', lastToot);
	eleventyConfig.addAsyncShortcode('liteyoutube', liteYouTube);
	eleventyConfig.addAsyncShortcode('darkgist', darkGist);

	eleventyConfig.addFilter('ageInDays', ageInDays);
	eleventyConfig.addFilter('algExcerpt', algExcerpt);
	eleventyConfig.addFilter('catTagList', catTagList);
	eleventyConfig.addFilter('cssmin', cssmin);
	eleventyConfig.addFilter('fixcattag', fixcattag);
	eleventyConfig.addFilter('getByCategory', getByCategory);
	eleventyConfig.addFilter('myEscape', myEscape);
	eleventyConfig.addFilter('my_xml_escape', my_xml_escape);
	eleventyConfig.addFilter('titlecase', titlecase);
	eleventyConfig.addFilter('toTitle', toTitle);

	// Plugins:
	eleventyConfig.addPlugin(xmlFiltersPlugin);

	/*
	Specifically for auto link headers.
	https://rhianvanesch.com/posts/2021/02/09/adding-heading-anchor-links-to-an-eleventy-site/
	*/
	const markdownItOptions = {
		html: true,
	}

	const markdownLib = markdownIt(markdownItOptions).use(
		markdownItAnchor, {
			permalink:markdownItAnchor.permalink.headerLink()
		}
	);

	eleventyConfig.addPlugin(postGraph, { sort: 'desc' });

	eleventyConfig.setLibrary('md', markdownLib);

	eleventyConfig.addTransform('htmlmin', function(content, outputPath) {
		if(process.env.CI && outputPath.endsWith('.html')) {
			/*
			Encountered an issue with eleventy-plugin-post-graph
			*/
			try {
				let minified = htmlmin.minify(content, {
					useShortDoctype: true,
					removeComments: true,
					collapseWhitespace: true
				});
				return minified;
			} catch(e) {
				return content;
			}
		}

		return content;
	});

	eleventyConfig.addPlugin(ejsPlugin);

	// Support a markdown version of my site as well
	eleventyConfig.on("eleventy.after", async ({ dir }) => {
		const inputDir = dir.input;   
		const outputDir = dir.output; 

		// blog posts only
		const mdFiles = glob.sync("posts/**/*.md", {
			cwd: inputDir,
			ignore: ["node_modules/**"],
		});

		for (const file of mdFiles) {
			const srcPath = path.join(inputDir, file);
			/*
			My input file looks like so:
			src/posts/2026/03/04/2026-03-04-dyanimically-adjusting-image-text-for-contrast.md
			I need to save to

			outputdir/2026/03/04/dynamically etc
			*/
			let newFile = file.replace('posts', '');
			newFile = newFile.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}-/,'');
			newFile = newFile.replace('.md','/index.md');

			const destPath = path.join(outputDir, newFile);

			//console.log(`!!Copying ${srcPath} to ${destPath}`);

			// Ensure destination directory exists
			// this should not be needed, although it errors in dev due to .eleventyignore
			// so... i'll allow it i guess?

			/*
			Before we copy, let's also strip front matter, but grab the title and
			add it as a # TITLE to the bit
			no - may revisit that decision though
			*/
			fs.mkdirSync(path.dirname(destPath), { recursive: true });
			fs.copyFileSync(srcPath, destPath);
		}
	});
	

	return {
		dir: {
			input:'src',
			layouts:'_layouts',
		}
	};

};