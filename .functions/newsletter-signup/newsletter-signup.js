const fetch = require('node-fetch');


const buttonDownKey = process.env.BUTTONDOWNKEY;
const apiRoot = `https://api.buttondown.email/v1/subscribers`;

const handler = async (event) => {
	try {

		const email = event.queryStringParameters.email;
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
			return {
				headers: {
					'Content-Type':'application/json'
				},
				statusCode: 200, 
				body: JSON.stringify(result)
			}
		} else {
			console.log(result);
			return {
				headers: {
					'Content-Type':'application/json'
				},
				statusCode: 500,
				body: JSON.stringify(result)
			};
		}



	} catch (error) {
		return { statusCode: 500, body: error.toString() }
	}
}

module.exports = { handler }