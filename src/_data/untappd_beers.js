
const CLIENT_ID = process.env.UNTAPPD_CLIENT_ID;
const CLIENT_SECRET = process.env.UNTAPPD_CLIENT_SECRET;
const fetch = require('node-fetch');

module.exports = async function() {

    try {
      // short circuit at home to make it quicker...
      if(process.env.ELEVENTY_ROOT.includes('/home/ray')) return [];

      let resp = await fetch(`https://api.untappd.com/v4/user/checkins/cfjedimaster?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&limit=10`, {
        headers: {
          'user-agent':'MyAgentBringsAllTheBoysToTheYard'
        }
      });
      let data = await resp.json();

      return data.response.checkins.items.map(b => {
        return {
            created: b.created_at, 
            rating: b.rating_score, 
            name: b.beer.beer_name, 
            label: b.beer.beer_label, 
            style: b.beer.beer_style, 
            abv: b.beer.beer_abv,
            brewery: b.brewery.brewery_name
        }
      });
    } catch(e) {
      console.log('Untappd loading error', e);
      return [];
    }
	
};
