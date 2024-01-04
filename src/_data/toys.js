
const TOYS_ENDPOINT = process.env.TOYS_ENDPOINT;
const fetch = require('node-fetch');

module.exports = async function() {

    try {
      let resp = await fetch(TOYS_ENDPOINT);
      let data = await resp.json();

      return data.photos;
    } catch(e) {
      console.log('Toys loading error', e);
      return [];
    }
	
};
