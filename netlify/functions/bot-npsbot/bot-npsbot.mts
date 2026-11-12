import type { Config, Context } from '@netlify/functions';

const states: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

const getRandomIntInclusive = function (min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export default async (req: Request, context: Context) => {
  const token = Netlify.env.get('BOT_NPSBOT') || Netlify.env.get('BOT_NPS');
  const npsKey = Netlify.env.get('NPS_KEY');

  if (!token || !npsKey) {
    console.error('Missing BOT_NPSBOT or NPS_KEY environment variable');
    return new Response('Missing BOT_NPSBOT or NPS_KEY environment variable', { status: 500 });
  }

  const stateAbbrs = Object.keys(states);
  const chosenState = stateAbbrs[getRandomIntInclusive(0, stateAbbrs.length - 1)];

  const httpResult = await fetch(
    `https://developer.nps.gov/api/v1/parks?stateCode=${chosenState}&limit=100&fields=images&api_key=${npsKey}`,
    {
      headers: {
        'User-Agent': 'Node',
      },
    }
  );

  if (!httpResult.ok) {
    console.error(`Failed to fetch NPS parks: ${httpResult.status}`);
    return new Response('Failed to fetch NPS parks', { status: 502 });
  }

  const results = await httpResult.json();
  const data = (results.data ?? []).filter((r: any) => r.images && r.images.length > 0);

  if (!data.length) {
    console.log(`No parks with images found for ${chosenState}`);
    return new Response('No data', { status: 200 });
  }

  // Select a random park and a random image
  const selectedPark = data[getRandomIntInclusive(0, data.length - 1)];
  const selectedImageObj = selectedPark.images[getRandomIntInclusive(0, selectedPark.images.length - 1)];
  const selectedImageUrl: string = selectedImageObj.url;

  const tootText = `Picture from ${selectedPark.fullName}. More information at ${selectedPark.url}`;

  // Fetch the image directly into memory as a Blob (no /tmp file or fs stream needed)
  const imageRes = await fetch(selectedImageUrl, {
    headers: {
      'User-Agent': 'Node',
    },
  });

  if (!imageRes.ok) {
    console.error(`Failed to fetch park image from ${selectedImageUrl}: ${imageRes.status}`);
    return new Response('Failed to fetch park image', { status: 502 });
  }

  const imageBlob = await imageRes.blob();
  const fileName = selectedImageUrl.split('/').pop()?.split('?')[0] || 'park.jpg';

  // Upload media to Mastodon using built-in FormData
  const formData = new FormData();
  formData.append('file', imageBlob, fileName);
  if (selectedImageObj.altText || selectedImageObj.caption) {
    formData.append('description', selectedImageObj.altText || selectedImageObj.caption);
  }

  const mediaRes = await fetch('https://mastodon.social/api/v2/media', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!mediaRes.ok) {
    const errText = await mediaRes.text();
    console.error(`Failed to upload media to Mastodon: ${mediaRes.status} ${errText}`);
    return new Response('Failed to upload media to Mastodon', { status: 502 });
  }

  const mediaData = await mediaRes.json();

  // Post the status referencing the uploaded media ID
  const tootRes = await fetch('https://mastodon.social/api/v1/statuses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: tootText,
      media_ids: [mediaData.id],
    }),
  });

  if (!tootRes.ok) {
    const errText = await tootRes.text();
    console.error(`Failed to post to Mastodon: ${tootRes.status} ${errText}`);
    return new Response('Failed to post to Mastodon', { status: 502 });
  }

  const result = await tootRes.json();
  console.log(`Posted toot: ${result.url ?? result.id}`);

  return Response.json(result);
};

export const config: Config = {
  schedule: '0 */4 * * *', // Every 4 hours on the hour (UTC)
};
