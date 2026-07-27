export default async (req, context) => {
  let buttondownKey = process.env.BUTTONDOWNKEY;
  let goatCounterKey = process.env.GOATCOUNTER_API_KEY;

  let [buttondownRequest, goatCounterRequest] = await Promise.all([
    fetch('https://api.buttondown.email/v1/subscribers?type=regular', {
      headers: {
        Authorization: `Token ${buttondownKey}`,
      },
    }),
    fetch('https://raymondcamden.goatcounter.com/api/v0/stats/hits', {
      headers: {
        Authorization: `Bearer ${goatCounterKey}`,
      },
    }),
  ]);

  if (!buttondownRequest.ok || !goatCounterRequest.ok) {
    return Response.json({ error: 'Unable to load stats.' }, { status: 502 });
  }

  let [buttondownData, goatCounterData] = await Promise.all([
    buttondownRequest.json(),
    goatCounterRequest.json(),
  ]);

  let topPages = goatCounterData.hits
    .map(hit => ({ path: hit.path, title: hit.title, count: hit.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return Response.json({
    buttondownCount: buttondownData.count,
    topPages,
  });
};

export const config = {
  path:"/api/get-stats"
}