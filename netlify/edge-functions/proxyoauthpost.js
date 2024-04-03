import { getStore } from "@netlify/blobs";

export default async (request, context) => {

	const tracker = getStore('tracker');

	let packet = {
		ref: request.headers.get('referer'),
		ua: request.headers.get('user-agent'),
		ip: context.ip, 
		geo: context.geo,
		time:new Date()
	};

	let log = await tracker.get('log', { type:'json' });
	if(!log) log = [];
	log.push(packet);
	await tracker.setJSON('log', log);

	return;
}

export const config = { path: "/2013/04/03/ColdFusion-and-OAuth-Part-2-Facebook" };