import { getStore } from "@netlify/blobs";

export default async () => {

	const tracker = getStore('tracker');
	let result = await tracker.get('log', { type:'json' });
	return Response.json(result);	
};

export const config = {
  path: "/api/log"
};