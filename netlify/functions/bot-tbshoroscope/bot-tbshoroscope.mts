import type { Config, Context } from '@netlify/functions';
import { generateSlug } from 'random-word-slugs';

const signs = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

function getAdjective() {
  return generateSlug(1, {
    partsOfSpeech: ['adjective'],
  });
}

function getNoun() {
  return generateSlug(1, {
    partsOfSpeech: ['noun'],
  });
}

function randRange(minNum: number, maxNum: number) {
  return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
}

function getSign() {
  return signs[randRange(0, signs.length - 1)];
}

function getFinancialString() {
  const options = [
    'Today is a good day to invest. Stock prices will change. ',
    'Today is a bad day to invest. Stock prices will change. ',
    'Investments are a good idea today. Spend wisely before the ' + getAdjective() + ' ' + getNoun() + ' turns your luck! ',
    'Save your pennies! Your ' + getNoun() + ' is not a safe investment today. ',
    'Consider selling your ' + getNoun() + ' for a good return today. ',
    'You can buy a lottery ticket or a ' + getNoun() + '. Either is a good investment. ',
  ];
  return options[randRange(0, options.length - 1)];
}

function getRomanticString() {
  const options = [
    'Follow your heart like you would follow a ' + getAdjective() + ' ' + getNoun() + ". It won't lead you astray. ",
    'You will fall in love with a ' + getSign() + ' but they are in love with their ' + getNoun() + '. ',
    'Romance is not in your future today. Avoid it like a ' + getAdjective() + ' ' + getNoun() + '. ',
    'Romance is blossoming like a ' + getAdjective() + ' ' + getNoun() + '! ',
    'Avoid romantic engagements today. Wait for a sign - it will resemble a ' + getAdjective() + ' ' + getNoun() + '. ',
    'Love is in the air. Unfortunately not the air you will be breathing. ',
  ];
  return options[randRange(0, options.length - 1)];
}

function getRandomString() {
  const options = [
    'Avoid talking to a ' + getSign() + ' today. They will vex you and bring you a ' + getNoun() + '. ',
    'Spend time talking to a ' + getSign() + ' today. They think you are a ' + getNoun() + '! ',
    'Dont listen to people who give you vague advice about life or your ' + getNoun() + '. ',
    'Today you need to practice your patience. And your piano. ',
    'Meet new people today. Show them your ' + getNoun() + '. ',
    'Your spirits are high today - but watch our for a ' + getAdjective() + ' ' + getNoun() + '. ',
    'Your sign is in the third phase today. This is important. ',
    'Your sign is in the second phase today. This is critical. ',
    'Something big is going to happen today. Or tomorrow. ',
    "Something something you're special and important something something. ",
    'A ' + getAdjective() + ' ' + getNoun() + ' will give you important advice today. ',
    'A ' + getAdjective() + ' ' + getNoun() + ' has it out for you today. ',
    'Last Tuesday was a good day. Today - not so much. ',
    'On the next full moon, it will be full. ',
    'Today is a bad day for work - instead focus on your ' + getNoun() + '. ',
    "Today is a good day for work - but don't forget your " + getNoun() + '. ',
    'A dark stranger will enter your life. They will have a ' + getAdjective() + ' ' + getNoun() + '. ',
  ];
  return options[randRange(0, options.length - 1)];
}

function getHoroscope() {
  const horoscope = `${getSign()}: 
${getRandomString()}${getFinancialString()}${getRomanticString()}

Your lucky numbers are ${randRange(1, 10)}, ${randRange(1, 10)} and ${getNoun()}.`;
  return horoscope;
}

export default async (req: Request, context: Context) => {
  const token = Netlify.env.get('BOT_TBSHOROSCOPE');
  if (!token) {
    console.error('Missing BOT_TBSHOROSCOPE environment variable');
    return new Response('Missing BOT_TBSHOROSCOPE environment variable', { status: 500 });
  }

  let horoscope = getHoroscope();
  /*
  So, sometimes a horoscope is too big. If it is, we will try one more time and then just give up
  because this is just a stupid bot. Or heck, let's try 3 times total.
  */
  if (horoscope.length > 280) horoscope = getHoroscope();
  if (horoscope.length > 280) horoscope = getHoroscope();
  // I give up. It wasn't meant to be.
  if (horoscope.length > 280) {
    console.log('I couldnt create a short enough horoscope and life is meaningless...');
    return new Response('I couldnt create a short enough horoscope and life is meaningless...', { status: 200 });
  }

  const tootRes = await fetch('https://mastodon.social/api/v1/statuses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ status: horoscope }),
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
