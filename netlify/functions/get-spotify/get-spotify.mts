import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
  const SPOTIFY_CLIENT_ID = Netlify.env.get('SPOTIFY_CLIENT_ID');
  const SPOTIFY_CLIENT_SECRET = Netlify.env.get('SPOTIFY_CLIENT_SECRET');
  const SPOTIFY_REFRESH_TOKEN = Netlify.env.get('SPOTIFY_REFRESH_TOKEN');

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return Response.json(
      { error: 'Missing Spotify environment variables' },
      { status: 500 }
    );
  }

  const basic = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!tokenRes.ok) {
    return new Response('Token refresh failed', { status: 502 });
  }
  const { access_token } = await tokenRes.json();

  const tracksRes = await fetch(
    'https://api.spotify.com/v1/me/player/recently-played?limit=20',
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  if (!tracksRes.ok) {
    return new Response('Failed to fetch recently played tracks', {
      status: 502,
    });
  }

  const data = await tracksRes.json();

  const tracks = (data.items ?? []).map((i: any) => ({
    name: i.track.name,
    artist: i.track.artists.map((a: any) => a.name).join(', '),
    artists: i.track.artists,
    album: i.track.album.name,
    url: i.track.external_urls.spotify,
    href: i.track.external_urls.spotify,
    preview_url: i.track.preview_url,
    images: i.track.album.images,
    playedAt: i.played_at,
  }));

  return Response.json(tracks, {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
};
