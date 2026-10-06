import { Context } from '@netlify/functions'

export default async (request: Request, context: Context) => {
  try {

    const CP_KEY = process.env.CODEPEN_KEY;

    const req = await fetch('https://api.codepen.io/v2/pens?sort=updated&direction=desc&access=Public&template=false&per_page=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CP_KEY}`,
        'Content-Type': 'application/json'
      }});
    
    let data = await req.json();

    // now lets do some mapping 
    data = data.map((pen: any) => {
      return {
        title: pen.title,
        url: pen.urls.editor,
        created_at: pen.created_at,
        updated_at: pen.updated_at,
        screenshot: pen.screenshot_urls.small
      }
    });

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return new Response(error.toString(), {
      status: 500,
    })
  }
}
