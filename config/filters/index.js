

const ageInDays = d => {
	let date = new Date(d);
	let now = new Date();
	let diff = now.getTime() - date.getTime();
	let day_diff = Math.floor(diff / (1000 * 3600 * 24)); 
	return day_diff;
}


module.exports = {
	ageInDays
};