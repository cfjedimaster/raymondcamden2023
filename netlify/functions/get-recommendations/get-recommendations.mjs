import { getStore } from "@netlify/blobs";

let algCredentials = { appId: process.env.ALG_APP_ID, apiKey: process.env.ALG_API_KEY, indexName: 'raymondcamden' };

// difference in minutes, one day basically
// changed to 12 hours 
let CACHE_MAX = 12 * 60 * 60 * 1000;

export default async (req, context) => {

  let params = new URL(req.url).searchParams;
  if(!params.get('path')) return new Response("No path!");
  let path = 'https://www.raymondcamden.com' + params.get('path');
  
  const recommendationStore = getStore('recommendations');

  let recos = await recommendationStore.get(path, { type:'json'});

  // bypass locally and never cache
  let bypass = false;
  // going to add a query string hack to force load, later
  //if(!process.env.NODE_ENV) bypass = true;

  if(recos && !bypass) {
    let diff = new Date() - new Date(recos.cached);
    console.log('path is', path, 'cache value', recos.cached, ' diff was ', diff, ' and max is ', CACHE_MAX);
    if(diff < CACHE_MAX) return Response.json(recos.recommendations);
  }
  console.log('Not in cache, or expired');

  let body = { 
    "requests":[
        {
            "indexName":"raymondcamden",
            "model":"related-products",
            "objectID":path,
            "threshold":40,
            "maxRecommendations":5,
            "queryParameters":{
                "attributesToRetrieve":"title,date,url"
            }
        }
    ]
  }

  let resp = await fetch(`https://${algCredentials.appId}-dsn.algolia.net/1/indexes/*/recommendations`, {
    method:'POST',
    headers:{
      'X-Algolia-Application-Id': algCredentials.appId, 
      'X-Algolia-API-Key': algCredentials.apiKey
    },
    body:JSON.stringify(body)
  });

  let results = await resp.json();
  if(results.status && results.status === 404) return Response.json([]);

  let recommendations = results.results[0].hits.map(h => {
    return {
      "date":h.date,
      "url":h.url,
      "title":h.title
    }
  });
  console.log(`for ${path} found ${recommendations.length} recommendations`);
  await recommendationStore.setJSON(path, { recommendations, cached: new Date() });

  return Response.json(recommendations);
};

export const config = {
  path:"/api/get-recommendations"
}