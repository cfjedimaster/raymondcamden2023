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
    path = './src/_includes/comments'+path+'.inc';
    let oldpath = '';
    if(old) oldpath = './src/_includes/comments' + old.replace('http://www.raymondcamden.com','') + '.inc';
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
  } catch(e) {
    console.log(`getting last toot for ${user} returned an error`);
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

const darkGist = u => {
  return `
<!-- credit for darkmode gist https://gist.github.com/adimancv/eb2f4b46d3c95e6b8fe4dd52375236b2 -->
<style>
.gist{font-size: 18px}.gist-meta, .gist-file, .octotree_toggle, ul.comparison-list > li.title,button.button, a.button, span.button, button.minibutton, a.minibutton,span.minibutton, .clone-url-button > .clone-url-link{background: linear-gradient(#202020, #181818) !important;border-color: #383838 !important;border-radius: 0 0 3px 3px !important;text-shadow: none !important;color: #b5b5b5 !important}.markdown-format pre, .markdown-body pre, .markdown-format .highlight pre,.markdown-body .highlight pre, body.blog pre, #facebox pre, .blob-expanded,.terminal, .copyable-terminal, #notebook .input_area, .blob-code-context,.markdown-format code, body.blog pre > code, .api pre, .api code,.CodeMirror,.highlight{background-color: #1D1F21!important;color: #C5C8C6!important}.gist .blob-code{padding: 1px 10px !important;text-align: left;background: #000;border: 0}::selection{background: #24890d;color: #fff;text-shadow: none}::-moz-selection{background: #24890d;color: #fff;text-shadow: none}.blob-num{padding: 10px 8px 9px;text-align: right;color: #6B6B6B!important;border: 0}.blob-code,.blob-code-inner{color: #C5C8C6!important}.pl-c,.pl-c span{color: #969896!important;font-style: italic!important}.pl-c1{color: #DE935F!important}.pl-cce{color: #DE935F!important}.pl-cn{color: #DE935F!important}.pl-coc{color: #DE935F!important}.pl-cos{color: #B5BD68!important}.pl-e{color: #F0C674!important}.pl-ef{color: #F0C674!important}.pl-en{color: #F0C674!important}.pl-enc{color: #DE935F!important}.pl-enf{color: #F0C674!important}.pl-enm{color: #F0C674!important}.pl-ens{color: #DE935F!important}.pl-ent{color: #B294BB!important}.pl-entc{color: #F0C674!important}.pl-enti{color: #F0C674!important;font-weight: 700!important}.pl-entm{color: #C66!important}.pl-eoa{color: #B294BB!important}.pl-eoac{color: #C66!important}.pl-eoac .pl-pde{color: #C66!important}.pl-eoai{color: #B294BB!important}.pl-eoai .pl-pde{color: #B294BB!important}.pl-eoi{color: #F0C674!important}.pl-k{color: #B294BB!important}.pl-ko{color: #B294BB!important}.pl-kolp{color: #B294BB!important}.pl-kos{color: #DE935F!important}.pl-kou{color: #DE935F!important}.pl-mai .pl-sf{color: #C66!important}.pl-mb{color: #B5BD68!important;font-weight: 700!important}.pl-mc{color: #B294BB!important}.pl-mh .pl-pdh{color: #DE935F!important}.pl-mi{color: #B294BB!important;font-style: italic!important}.pl-ml{color: #B5BD68!important}.pl-mm{color: #C66!important}.pl-mp{color: #81A2BE!important}.pl-mp1 .pl-sf{color: #81A2BE!important}.pl-mq{color: #DE935F!important}.pl-mr{color: #B294BB!important}.pl-ms{color: #B294BB!important}.pl-pdb{color: #B5BD68!important;font-weight: 700!important}.pl-pdc{color: #969896!important;font-style: italic!important}.pl-pdc1{color: #DE935F!important}.pl-pde{color: #DE935F!important}.pl-pdi{color: #B294BB!important;font-style: italic!important}.pl-pds{color: #B5BD68!important}.pl-pdv{color: #C66!important}.pl-pse{color: #DE935F!important}.pl-pse .pl-s2{color: #DE935F!important}.pl-s{color: #B294BB!important}.pl-s1{color: #B5BD68!important}.pl-s2{color: #c5c8c6!important}.pl-mp .pl-s3{color: #B294BB!important}.pl-s3{color: #81a2be!important}.pl-sc{color: #c5c8c6!important}.pl-scp{color: #DE935F!important}.pl-sf{color: #DAD085!important}.pl-smc{color: #F0C674!important}.pl-smi{color: #c5c8c6!important}.pl-smp{color: #c5c8c6!important}.pl-sok{color: #B294BB!important}.pl-sol{color: #B5BD68!important}.pl-som{color: #C66!important}.pl-sr{color: #C66!important}.pl-sra{color: #B294BB!important}.pl-src{color: #B294BB!important}.pl-sre{color: #B294BB!important}.pl-st{color: #B294BB!important}.pl-stj{color: #c5c8c6!important}.pl-stp{color: #DE935F!important}.pl-sv{color: #DE935F!important}.pl-v{color: #DE935F!important}.pl-vi{color: #DE935F!important}.pl-vo{color: #C66!important}.pl-vpf{color: #DE935F!important}.pl-mi1{color: #8F9D6A!important;background: rgba(0,64,0,.5)!important}.pl-mdht{color: #8F9D6A!important;background: rgba(0,64,0,.5)!important}.pl-md{color: #C66!important;background: rgba(64,0,0,.5)!important}.pl-mdhf{color: #C66!important;background: rgba(64,0,0,.5)!important}.pl-mdr{color: #DE935F!important;font-weight: 400!important}.pl-mdh{color: #C66!important;font-weight: 400!important}.pl-mdi{color: #C66!important;font-weight: 400!important}.pl-ib{background-color: #C66!important}.pl-id{background-color: #C66!important;color: #fff!important}.pl-ii{background-color: #C66!important;color: #fff!important}.pl-iu{background-color: #C66!important}.pl-mo{color: #c5c8c6!important}.pl-mri{color: #DE935F!important}.pl-ms1{background-color: #c5c8c6!important}.pl-va{color: #DE935F!important}.pl-vpu{color: #DE935F!important}.pl-entl{color: #c5c8c6!important}.CodeMirror-gutters{background: #222!important;border-right: 1px solid #484848!important}.CodeMirror-guttermarker{color: #fff!important}.CodeMirror-guttermarker-subtle{color: #aaa!important}.CodeMirror-linenumber{color: #aaa!important}.CodeMirror-cursor{border-left: 1px solid #fff!important}.CodeMirror-activeline-background{background: #27282E!important}.CodeMirror-matchingbracket{outline: 1px solid grey!important;color: #fff!important}.cm-keyword{color: #f9ee98!important}.cm-atom{color: #FC0!important}.cm-number{color: #ca7841!important}.cm-def{color: #8DA6CE!important}.cm-variable-2,span.cm-tag{color: #607392!important}.cm-variable-3,span.cm-def{color: #607392!important}.cm-operator{color: #cda869!important}.cm-comment{color: #777!important;font-style: italic!important;font-weight: 400!important}.cm-string{color: #8f9d6a!important}.cm-string-2{color: #bd6b18!important}.cm-meta{background-color: #141414!important;color: #f7f7f7!important}.cm-builtin{color: #cda869!important}.cm-tag{color: #997643!important}.cm-attribute{color: #d6bb6d!important}.cm-header{color: #FF6400!important}.cm-hr{color: #AEAEAE!important}.cm-link{color: #ad9361!important;font-style: italic!important;text-decoration: none!important}.cm-error{border-bottom: 1px solid red!important}#notebook .highlight table{background: #1d1f21!important;color: #c5c8c6!important}.highlight .hll{background-color: #373b41!important}.highlight .c{color: #969896!important}.highlight .err{color: #c66!important}.highlight .k{color: #b294bb!important}.highlight .l{color: #de935f!important}.highlight .h,.highlight .n{color: #c5c8c6!important}.highlight .o{color: #8abeb7!important}.highlight .p{color: #c5c8c6!important}.highlight .cm{color: #969896!important}.highlight .cp{color: #969896!important}.highlight .c1{color: #969896!important}.highlight .cs{color: #969896!important}.highlight .gd{color: #c66!important}.highlight .ge{font-style: italic!important}.highlight .gh{color: #c5c8c6!important;font-weight: 700!important}.highlight .gi{color: #b5bd68!important}.highlight .gp{color: #969896!important;font-weight: 700!important}.highlight .gs{font-weight: 700!important}.highlight .gu{color: #8abeb7!important;font-weight: 700!important}.highlight .kc{color: #b294bb!important}.highlight .kd{color: #b294bb!important}.highlight .kn{color: #8abeb7!important}.highlight .kp{color: #b294bb!important}.highlight .kr{color: #b294bb!important}.highlight .kt{color: #f0c674!important}.highlight .ld{color: #b5bd68!important}.highlight .m{color: #de935f!important}.highlight .s{color: #b5bd68!important}.highlight .na{color: #81a2be!important}.highlight .nb{color: #c5c8c6!important}.highlight .nc{color: #f0c674!important}.highlight .no{color: #c66!important}.highlight .nd{color: #8abeb7!important}.highlight .ni{color: #c5c8c6!important}.highlight .ne{color: #c66!important}.highlight .nf{color: #81a2be!important}.highlight .nl{color: #c5c8c6!important}.highlight .nn{color: #f0c674!important}.highlight .nx{color: #81a2be!important}.highlight .py{color: #c5c8c6!important}.highlight .nt{color: #8abeb7!important}.highlight .nv{color: #c66!important}.highlight .ow{color: #8abeb7!important}.highlight .w{color: #c5c8c6!important}.highlight .mf{color: #de935f!important}.highlight .mh{color: #de935f!important}.highlight .mi{color: #de935f!important}.highlight .mo{color: #de935f!important}.highlight .sb{color: #b5bd68!important}.highlight .sc{color: #c5c8c6!important}.highlight .sd{color: #969896!important}.highlight .s2{color: #b5bd68!important}.highlight .se{color: #de935f!important}.highlight .sh{color: #b5bd68!important}.highlight .si{color: #de935f!important}.highlight .sx{color: #b5bd68!important}.highlight .sr{color: #b5bd68!important}.highlight .s1{color: #b5bd68!important}.highlight .ss{color: #b5bd68!important}.highlight .bp{color: #c5c8c6!important}.highlight .vc{color: #c66!important}.highlight .vg{color: #c66!important}.highlight .vi{color: #c66!important}.highlight .il{color: #de935f!important}
</style>
<script src="${u}"></script>
  `;
};

export {
	extractExcerpt, hasAnyComments, commentInclude, lastToot, liteYouTube, darkGist
};

