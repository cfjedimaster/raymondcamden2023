import CleanCSS from 'clean-css';

const ageInDays = d => {
	let date = new Date(d);
	let now = new Date();
	let diff = now.getTime() - date.getTime();
	let day_diff = Math.floor(diff / (1000 * 3600 * 24)); 
	return day_diff;
}

const algExcerpt = text => {
  //first remove code
  text = text.replace(/<code class="language-.*?">.*?<\/code>/sg, '');
  //now remove html tags
  text = text.replace(/<.*?>/g, '');
  //now limit to 5k
  return text.substring(0,5000);
};

const catTagList = p => {
	let result = [];
  for(let i=0; i<p.data.categories.length; i++) {
    result.push({
      name: p.data.categories[i],
      url: '/categories/'+myEscape(p.data.categories[i])
    });
  }
  for(let i=0; i<p.data.tags.length; i++) {
    result.push({
      name: p.data.tags[i],
      url: '/tags/'+myEscape(p.data.tags[i])
    });
  }

  return result;
}

// Credit: https://support.cloudinary.com/hc/en-us/community/posts/200788162/comments/200128802
// Used for my new OG images
const cloudinaryTitleEscape = s => {
    return encodeURIComponent(s).replaceAll('%2C','%252C');
};

const fixcattag = str => {
  if(!str) return;
  if(str === 'coldfusion') return 'ColdFusion';
  if(str === 'javascript') return 'JavaScript';
  if(str === 'jquery') return 'jQuery';
  if(str === 'pdf services') return 'PDF Services';
  return str;
};

const getByCategory = (posts, cat) => {
  let results = [];

  // handle case issues I'm having
  cat = cat.toLowerCase();
  for(let post of posts) {
    if(post.data.categories.indexOf(cat) >= 0) results.push(post);
  }
  return results.reverse();
};

const myEscape = s => {
    return s.replace(/ /g, '+');
};

const my_xml_escape = s => {
    if(!s) return;
    return s.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
//      .replace(/\n/g, '')
      .replace(/data-src/g,'src');

}



const titlecase = str => {
  if(!str) return;
  if(str.toLowerCase() === 'coldfusion') return 'ColdFusion';
  // https://stackoverflow.com/a/196991/52160
  // modified 11/2/2021 to no longer lowercase the rest
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    }
  );
};

let titlePostCache = {};
const toTitle = (p, posts) => {
  if(titlePostCache[p]) return titlePostCache[p];
  console.log('toTitle for '+p+'\n', JSON.stringify(titlePostCache));
  for(let i=0;i<posts.length;i++) {
    if(posts[i].url == p) {
      titlePostCache[p] = { title: posts[i].data.title, date: posts[i].date};
      return titlePostCache[p];
    }
  }
  // cache that we couldn't match
  titlePostCache[p] = { title: ''};
  return titlePostCache[p];
};

let cssCache = null;
const cssmin = css => {
  if(!cssCache) {
    cssCache = new CleanCSS({}).minify(css).styles;
  }
  return cssCache;
};

export {
	ageInDays, algExcerpt, cssmin, fixcattag, getByCategory, myEscape, catTagList, cloudinaryTitleEscape, my_xml_escape, titlecase, toTitle
};