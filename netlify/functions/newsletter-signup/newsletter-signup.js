const buttonDownKey = process.env.BUTTONDOWNKEY;
const apiRoot = `https://api.buttondown.email/v1/subscribers`;

export default async (req) => {

	try {

		let params = new URL(req.url).searchParams;
		let email = params.get('email');

		if (!email) {
			return {
				statusCode: 500,
				body: 'email query parameter required'
			};
		}

		let body = { email };

		let resp = await fetch(apiRoot, {
			method:'POST',
			headers: {
				'Authorization':`Token ${buttonDownKey}`
			}, 
			body: JSON.stringify(body)
		});

		let status = resp.status;
		let result = await resp.json();
		if(status === 201) {

			return Response.json(result);

		} else {
			console.log(result);
			return Response.json(result);

		}

	} catch (error) {
		console.log(error);
		return new Response('Error', { status: 500 });
	}
};

