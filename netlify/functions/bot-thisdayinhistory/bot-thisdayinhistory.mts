import type { Config, Context } from '@netlify/functions';

interface HistoryLink {
  title: string;
  link: string;
}

interface HistoryItem {
  year: string;
  text: string;
  links: HistoryLink[];
}

interface HistoryResponse {
  date: string;
  url: string;
  data: {
    Events?: HistoryItem[];
    Births?: HistoryItem[];
    Deaths?: HistoryItem[];
  };
}

const dcase1 = (s: string) => (s ? s.slice(0, 1).toLowerCase() + s.slice(1) : '');

export default async (req: Request, context: Context) => {
  const token = Netlify.env.get('BOT_THISDAYINHISTORY');
  if (!token) {
    console.error('Missing BOT_THISDAYINHISTORY environment variable');
    return new Response('Missing BOT_THISDAYINHISTORY environment variable', { status: 500 });
  }

  const res = await fetch('https://history.muffinlabs.com/date');
  if (!res.ok) {
    console.error(`Failed to fetch history data: ${res.status}`);
    return new Response('Failed to fetch history data', { status: 502 });
  }

  const response: HistoryResponse = await res.json();
  const data = response.data;

  const types = ['Events', 'Births', 'Deaths'] as const;
  const selectedType = types[Math.floor(Math.random() * types.length)];

  const items = data?.[selectedType];
  if (!items || items.length === 0) {
    console.log(`Unable to find ${selectedType} in response`);
    return new Response(`Unable to find ${selectedType} in response`, { status: 200 });
  }

  const myevent = items[Math.floor(Math.random() * items.length)];

  let text = '';
  if (selectedType === 'Events') {
    text = `On this day in ${myevent.year}, ${dcase1(myevent.text)}`;
  } else if (selectedType === 'Births') {
    text = `On this day in ${myevent.year}, ${myevent.text} was born.`;
  } else {
    text = `On this day in ${myevent.year}, ${myevent.text} passed away.`;
  }

  if (myevent.links?.length > 0) {
    text += `\n\nDetails: ${myevent.links[0].link}`;
  }

  const tootRes = await fetch('https://mastodon.social/api/v1/statuses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ status: text }),
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
