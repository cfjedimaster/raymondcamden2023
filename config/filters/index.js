const ageInDays = d => {
	let date = new Date(d);
	let now = new Date();
	let diff = now.getTime() - date.getTime();
	let day_diff = Math.floor(diff / (1000 * 3600 * 24)); 
	return day_diff;
}

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
      .replace(/\n/g, '')
      .replace(/data-src/g,'src');

}

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

const titlecase = str => {
  if(!str) return;
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

let postCats = [];
const postCategories = collections => {
  if(postCats.length > 0) return postCats;
  let cats = new Set();

  for(let page of collections.posts) {
    for(let cat of page.data.categories) {
      cat = cat.toLowerCase();
      cats.add(cat);
    }
  }
  postCats = Array.from(cats).sort();
  return postCats;
};

let postTagsCache = [];
const postTags = collections => {
  if(postTagsCache.length > 0) return postTagCache;
  let tags = [];
  for(let tag in collections) {
    if(tag !== 'all' && tag !== 'posts' && tag !== 'categories') tags.push(tag);
  }
  postTags = tags.sort();
  return postTags;
};


module.exports = {
	ageInDays, myEscape, catTagList, my_xml_escape, titlecase, toTitle, postCategories
};