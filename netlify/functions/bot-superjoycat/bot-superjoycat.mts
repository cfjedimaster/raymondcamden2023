import type { Config, Context } from '@netlify/functions';

const MESSAGES = [
  'You are truly wonderful. Yes, you.',
  'You make me think of a nap on a soft pillow in a warm sunbeam.',
  'You make me purr.',
  'You complete me.',
  'Cat nip has nothing on you!',
  'Hey, you. Yes, you. You rock!',
  'You are better than a red laser dot.',
  'I like you more than cat nip.',
  'Dogs are bad. You are awesome.',
  'You are like the softest part of my fur.',
  'After my food bowl, you are the first thing I want to see in the morning!',
];

const getRandomInt = function (min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
};

export default async (req: Request, context: Context) => {
  const token = Netlify.env.get('BOT_SUPERJOYCAT');
  const catApiKey = Netlify.env.get('CAT_API') ?? '';

  if (!token) {
    console.error('Missing BOT_SUPERJOYCAT environment variable');
    return new Response('Missing BOT_SUPERJOYCAT environment variable', { status: 500 });
  }

  const url = `https://api.thecatapi.com/v1/images/search?api_key=${catApiKey}&size=med`;

  const result = await fetch(url);
  if (!result.ok) {
    console.error(`Failed to fetch cat image metadata: ${result.status}`);
    return new Response('Failed to fetch cat image metadata', { status: 502 });
  }

  const data = await result.json();
  if (!data || !data.length) {
    console.log('No data returned from TheCatAPI');
    return new Response('no data', { status: 200 });
  }

  const catImageUrl: string = data[0].url;
  const message = MESSAGES[getRandomInt(0, MESSAGES.length)];

  // Fetch the cat image directly into memory as a Blob
  const imageRes = await fetch(catImageUrl);
  if (!imageRes.ok) {
    console.error(`Failed to download cat image from ${catImageUrl}: ${imageRes.status}`);
    return new Response('Failed to download cat image', { status: 502 });
  }

  const imageBlob = await imageRes.blob();
  const fileName = catImageUrl.split('/').pop()?.split('?')[0] || 'cat.jpg';

  const formData = new FormData();
  formData.append('file', imageBlob, fileName);

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

  const tootRes = await fetch('https://mastodon.social/api/v1/statuses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: message,
      media_ids: [mediaData.id],
    }),
  });

  if (!tootRes.ok) {
    const errText = await tootRes.text();
    console.error(`Failed to post to Mastodon: ${tootRes.status} ${errText}`);
    return new Response('Failed to post to Mastodon', { status: 502 });
  }

  const tootResult = await tootRes.json();
  console.log(`Posted toot: ${tootResult.url ?? tootResult.id}`);

  return Response.json(tootResult);
};

export const config: Config = {
  schedule: '0 */4 * * *', // Every 4 hours on the hour (UTC)
};
