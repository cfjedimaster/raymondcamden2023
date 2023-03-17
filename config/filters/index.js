

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

module.exports = {
	ageInDays, myEscape, catTagList, my_xml_escape
};