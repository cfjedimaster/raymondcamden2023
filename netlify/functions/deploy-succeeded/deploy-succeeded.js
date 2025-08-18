/*
My code for successful deploys now consists of two main actions. Send me a nicer email and update my Algolia index.
*/

const algCredentials = { appId: process.env.ALG_APP_ID, apiKey: process.env.ALG_API_KEY, indexName: 'raymondcamden' };

//const SG_KEY = process.env.SENDGRID;
const PB_KEY = process.env.PUSHBULLET_TOKEN;
const PB_DEVICE = process.env.PUSHBULLET_DEVICE;

import { mail as helper } from 'sendgrid';
//const helper = require('sendgrid').mail;

import { algoliasearch as algoliaSearch } from 'algoliasearch';

//const algoliaSearch = require('algoliasearch');
const algolia = algoliaSearch(algCredentials.appId, algCredentials.apiKey);
//const index = algolia.initIndex(algCredentials.indexName);

export default async (req, context) => {


  try {

    /*
    Update on Aug 9, 2021:
    I'm still having issues with timeouts and poor logging support from Netlify. So now
    we have new logic. We will get the index and NOT delete them all. We wil get the first 3 entries
    from the JSON file (newest are first) and do updateObjects on it. This should be MUCH quicker.

    Why 3? No real reason. This runs on every build but only matters on new posts. This will ensure new
    posts show up in the index.

    For edits, or deletes (I've deleted maybe 2-3 times in the past 10+ years), I'll use a new script that basically
    does what this used to do. Clear all and add all. This is so rare I'm not even going to build that code for now
    as I can do it later and just grab the older version.

    Also, I discovered the call to convert my algolia.json to data was VERY slow, not surprising considering the size.
    So I added a new index, algolia_new.json, that's the last 5 items. Again, 5 is kinda arbitrary. 
    */

    /// HANDLE ALOGLIA
    // first, get my index
    let dataResp = await fetch('https://www.raymondcamden.com/algolia_new.json');

    let data = await dataResp.json();

    console.log('Successfully got the data, size of articles '+data.length, data[0].title);

    //first clear 

    let requests = [];

    // If you use my code for a new blog, your index may not have 3 items!
    for(let i=0;i<3;i++) {
      /*
      define an objectID for Algolia
      */
      let d = data[i];
      d.objectID = d.url;
      requests.push({
        'action':'updateObject',
        'body':d
      })
    };
    console.log('Batch data object created to add to Algolia index');

    await algolia.batch({
      indexName:algCredentials.indexName,
      batchWriteParams: {
        requests
      }
    });
    console.log('Request to batch index fired, not waiting, good luck?');

    /*
    New logic to get the event body
    */
    let event = await req.json();

    /// HANDLE EMAIL (if sent)
    // modified aug 2025 - now i use pushbullet
    //sendgrid removed their free tier in summer of 2025 so I'm commenting out this, removed the func, etc
    //May bring back notifications another way
    
    if(event.payload) {
      let pubData = event.payload;
      let body = `
Deploy Succeeded for ${pubData.name} (${pubData.url})

Build Title: ${pubData.title}
Finished:    ${pubData.published_at}
Duration:    ${toMinutes(pubData.deploy_time)}
    `;

      if(pubData.summary && pubData.summary.messages) {
        body += `
  Messages:`;
        pubData.summary.messages.forEach(msg => {
          body += `

  [${msg.type}] ${msg.title}
  ${msg.description}`;
        });
      }

      //await sendEmail(body, 'Netlify Build Succeeded', 'raymondcamden@gmail.com', 'raymondcamden@gmail.com');
      console.log('Send push notification');
      await sendPB(body, 'Netlify Build Succeeded', PB_DEVICE, PB_KEY);
    }
    


  } catch (err) {
    console.log('error handler for function ran', JSON.stringify(err.message));
    return new Response('Error', { status: 500 });
  }

}

function toMinutes(s) {
	if(s < 60) return `${s} seconds`;
	let minutes = (s - (s % 60)) / 60;
	return `${minutes}m ${s%60}s`;
}

async function sendPB(body, title, device, key) {

  let reqbody = {
    body, 
    title, 
    device_iden:device, 
    type:"note"
  };

  fetch('https://api.pushbullet.com/v2/pushes', {
    method:'POST',
    headers: {
      'Content-Type':'application/json',
      'Access-Token':key
    }, 
    body:JSON.stringify(reqbody)
  });

  let res = await req.json();
  return;
  // um... for now i dont care about the response
}

