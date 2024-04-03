
export default async (request, context) => {
	console.log(context);
	console.log(request.headers);
	return new Response("Hello world");
}

export const config = { path: "/test" };