/*
let Parser = require('rss-parser');
let parser = new Parser();

const fs = require('fs');
*/

import Parser from 'rss-parser';
let parser = new Parser();

import fs from 'fs';

const excerptMinimumLength = 140;
const excerptSeparator = '<!--more-->';

/**
 * Extracts the excerpt from a document.
 *
 * @param {*} doc A real big object full of all sorts of information about a document.
 * @returns {String} the excerpt.
 */
const extractExcerpt = function(doc) {
  if (!doc.hasOwnProperty('templateContent')) {
    console.warn('Failed to extract excerpt: Document has no property `templateContent`.');
    return;
  }

  const content = doc.templateContent;
  if (content.includes(excerptSeparator)) {
    return content.substring(0, content.indexOf(excerptSeparator)).trim();
  }
  else if (content.length <= excerptMinimumLength) {
    return content.trim();
  }

  const excerptEnd = findExcerptEnd(content);
  /*
  Modified 11/4/2021 to remove <p></p> as it conflicts with CSS used to display ...
  */
  return content.substring(0, excerptEnd).trim().replace('<p>', '').replace('</p>','');
}

/**
 * Finds the end position of the excerpt of a given piece of content.
 * This should only be used when there is no excerpt marker in the content (e.g. no `<!--more-->`).
 *
 * @param {String} content The full text of a piece of content (e.g. a blog post)
 * @param {Number?} skipLength Amount of characters to skip before starting to look for a `</p>`
 * tag. This is used when calling this method recursively.
 * @returns {Number} the end position of the excerpt
 */
const findExcerptEnd = function(content, skipLength = 0) {
  if (content === '') {
    return 0;
  }

  const paragraphEnd = content.indexOf('</p>', skipLength) + 4;

  if (paragraphEnd < excerptMinimumLength) {
    return paragraphEnd + findExcerptEnd(content.substring(paragraphEnd), paragraphEnd);
  }

  return paragraphEnd;
}

/*
I support hasAnyComments and commentInclude. I take the logic of trying to load
old comment html. I return either the html or a blank string
*/
function getCommentText(path, old) {
    path = './_includes/comments'+path+'.inc';
    let oldpath = '';
    if(old) oldpath = './_includes/comments' + old.replace('http://www.raymondcamden.com','') + '.inc';
    if(fs.existsSync(path)) {
      return fs.readFileSync(path,'utf-8');
    } else if(old && fs.existsSync(oldpath)) {
      return fs.readFileSync(oldpath,'utf-8');
    } else {
      return '';
    }
}

const hasAnyComments = (e, old) => {
    return getCommentText(e,old) !== '';
}

const commentInclude = (e, old) => {
    return getCommentText(e,old);
}

const lastToot = async (instance, user) => {
	let rssFeedURL = `https://${instance}/users/${user}.rss`;
  try {
    let feed = await parser.parseURL(rssFeedURL);
    return feed.items[0].guid.split('/').pop();
  } catch {
    return '';
  }
}

const liteYouTube = id => {
  return `
<lite-youtube videoid="${id}" style="background-image: url('https://i.ytimg.com/vi/${id}/hqdefault.jpg');">
  <a href="https://youtube.com/watch?v=${id}" class="lty-playbtn" title="Play Video">
    <span class="lyt-visually-hidden">Play Video</span>
  </a>
</lite-youtube>

<script defer src="https://cdnjs.cloudflare.com/ajax/libs/lite-youtube-embed/0.3.2/lite-yt-embed.js"></script>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/lite-youtube-embed/0.3.2/lite-yt-embed.css" integrity="sha512-utq8YFW0J2abvPCECXM0zfICnIVpbEpW4lI5gl01cdJu+Ct3W6GQMszVITXMtBLJunnaTp6bbzk5pheKX2XuXQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />

<p>
  `;
};

export {
	extractExcerpt, hasAnyComments, commentInclude, lastToot, liteYouTube
};

