let BD_KEY = process.env.BUTTONDOWNKEY;

export default async (req, context) => {

  let request = await fetch(`https://api.buttondown.email/v1/subscribers?type=regular`, {
    headers: {
    Authorization: `Token ${BD_KEY}`,
    },
  });

  let data = await request.json();
  let result = { buttondownCount: data.count };

  return Response.json(result);
};

export const config = {
  path:"/api/get-stats"
}