import type { Config, Context } from '@netlify/functions';
import { generateSlug, type RandomWordOptions } from 'random-word-slugs';
import indefinite from 'indefinite';
import pluralize from 'pluralize';
import { BskyAgent } from '@atproto/api';

const getRandomIntInclusive = function (min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const locations = [
  'in an ancient temple',
  'in a jungle',
  'by a dusty fountain',
  'on the shore of an ocean',
  'on a distant planet',
  'inside a whirlpool',
  'on an ancient moon',
  'on an island',
  'by a lake',
  'by a forest lake',
  'under your bed',
  "in a unicorn's forest",
  'far from people',
  'under a lake',
  'in a castle in the sky',
  'on a forgotten mountain',
  'at the bottom of a whirlpool',
  'in a nebula',
  'far away under rocks and stone',
  'in a mossy grove',
  'in a sock drawer',
  'inside an abandoned castle',
  'at the end of a rainbow',
  'on a mountain top',
  'in a moonlit forest',
  'inside a black hole',
  'in the ruins of a city',
  'on a deserted island',
  'in a jungle',
  'in a forest temple',
  'in a long forgotten city',
  'on a moon',
  'on a distant planet',
  'deep inside a well',
  'in an old mansion',
  'on a crumbling mountain',
  'on a forgotten island',
  'in a haunted house',
  'on the other side of a rainbow',
  'on a lonely island',
  "under a child's bed",
  'in a castle in the clouds',
  'in the ruins of a village',
  'deep in a cave',
  'under a haunted house',
  'near a village',
];

const verbs = [
  'sees',
  'explores',
  'sorts',
  'inventories',
  'loves',
  'estimates',
  'guards',
  'tallies',
  'reminisces over',
  'regards',
  'looks over',
  'searches',
  'investigates',
  'is proud of',
  'examines',
  'fiddles with',
  'counts',
  'admires',
  'loves',
  'admires',
];

const getDragonType = function () {
  const options: RandomWordOptions<1> = {
    format: 'lower',
    partsOfSpeech: ['adjective'],
    categories: {
      adjective: ['color', 'appearance', 'personality'],
    },
  };

  return generateSlug(1, options);
};

const getLocation = function () {
  return locations[getRandomIntInclusive(0, locations.length - 1)];
};

const getVerb = function () {
  return verbs[getRandomIntInclusive(0, verbs.length - 1)];
};

const getHoard = function () {
  const options: RandomWordOptions<1> = {
    format: 'lower',
    partsOfSpeech: ['adjective'],
    categories: {
      adjective: ['quantity'],
    },
  };

  const quantity = generateSlug(1, options);

  const options2: RandomWordOptions<1> = {
    format: 'lower',
    partsOfSpeech: ['noun'],
    categories: {
      noun: ['animals', 'food', 'thing'],
    },
  };

  const item = pluralize(generateSlug(1, options2));
  const ofWords = ['hundreds', 'thousands', 'millions', 'billions'];
  let joiner = ' ';
  /*
  hard coded logic - may revisit
  */
  if (ofWords.indexOf(quantity) >= 0) joiner = ' of ';

  return `${quantity}${joiner}${item}`;
};

const getFeeling = function () {
  const options: RandomWordOptions<1> = {
    format: 'lower',
    partsOfSpeech: ['adjective'],
    categories: {
      adjective: ['condition'],
    },
  };

  return generateSlug(1, options);
};

export default async (req: Request, context: Context) => {
  const mastodonToken = Netlify.env.get('BOT_DRAGONHOARDS');
  const blueskyPassword =
    Netlify.env.get('BLUESKY_DRAGONHOARDS_PASSWORD') || Netlify.env.get('BOT_DRAGONHOARDS_BLUESKY');

  if (!mastodonToken || !blueskyPassword) {
    console.error('Missing BOT_DRAGONHOARDS or BLUESKY_DRAGONHOARDS_PASSWORD environment variable');
    return new Response('Missing BOT_DRAGONHOARDS or BLUESKY_DRAGONHOARDS_PASSWORD environment variable', {
      status: 500,
    });
  }

  const type = getDragonType();
  const hoards: string[] = [];
  for (let i = 0; i < 3; i++) {
    hoards.push(getHoard());
  }

  const hoardStr = `${hoards[0]}, ${hoards[1]}, and ${hoards[2]}`;
  const statusText = `${indefinite(type, { capitalize: true })} dragon lives ${getLocation()}. She ${getVerb()} her hoard, which consists of ${hoardStr}. She feels ${getFeeling()}.`;

  // 1. Post to Mastodon
  const tootRes = await fetch('https://mastodon.social/api/v1/statuses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mastodonToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ status: statusText }),
  });

  if (!tootRes.ok) {
    const errText = await tootRes.text();
    console.error(`Failed to post to Mastodon: ${tootRes.status} ${errText}`);
    return new Response('Failed to post to Mastodon', { status: 502 });
  }

  const mastodonResult = await tootRes.json();
  console.log(`Posted to Mastodon: ${mastodonResult.url ?? mastodonResult.id}`);

  // 2. Post to Bluesky
  const agent = new BskyAgent({
    service: 'https://bsky.social',
  });

  await agent.login({
    identifier: 'dragonhoards.bsky.social',
    password: blueskyPassword,
  });

  const bskyResult = await agent.post({
    text: statusText,
    langs: ['en-US'],
    createdAt: new Date().toISOString(),
  });
  console.log(`Posted to Bluesky: ${bskyResult.uri}`);

  return Response.json({
    text: statusText,
    mastodon: mastodonResult,
    bluesky: bskyResult,
  });
};

export const config: Config = {
  schedule: '0 */4 * * *', // Every 4 hours on the hour (UTC)
};
