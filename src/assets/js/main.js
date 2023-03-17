document.addEventListener('DOMContentLoaded', init, false);

function init() {
	console.log('loaded');
	// Support copying link
	let linkCopy = document.querySelector('#copy-link');
	
	if(linkCopy) {
		console.log('support link copy', linkCopy);
		linkCopy.addEventListener('click', () => {
			// first get the url
			let url = location.href;
			console.log('will copy url', url);
			console.log('copy to cb');
		});
	}
	
}
