let searchInput;

document.addEventListener('DOMContentLoaded', () => {

    searchInput = document.getElementById('search');
    let searchButton = document.querySelector('.search-box button');
    
    if (searchInput && searchButton) {
        // Handle search button click
        searchButton.addEventListener('click', function() {
            performSearch();
        });
        
        // Handle Enter key in search input
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
    }

    if(window.location.pathname.indexOf('/2') === 0) {
        doSubscriptionForm();
        //doRecommendations();
    }

    let moonPhaseSpan = document.getElementById('moonPhase');
    if(!moonPhaseSpan) return;

    let currentPhase = getCurrentMoonPhase();
    /*
    M is new moon
    Q is waxing crescent 
    T is first quarter 
    V is waxing gibbeous 
    Z is full moon
    E is wamomg crescent 
    G is last quarter 
    J is waninf crescent 

    if (phase < 5.53699) return 'Waxing Crescent';
    if (phase < 9.22831) return 'First Quarter';
    if (phase < 12.91964) return 'Waxing Gibbous';
    if (phase < 16.61097) return 'Full Moon';
    if (phase < 20.30230) return 'Waning Gibbous';
    if (phase < 23.99363) return 'Last Quarter';
    if (phase < 27.68496) return 'Waning Crescent';
   
    */
    let letter = 'M';
    if(currentPhase == 'Waxing Crescent') letter = 'Q';
    if(currentPhase == 'First Quarter') letter = 'T';
    if(currentPhase == 'Waxing Gibbous') letter = 'V';
    if(currentPhase == 'Full Moon') letter = 'Z';
    if(currentPhase == 'Waning Gibbous') letter = 'E';
    if(currentPhase == 'Last Quarter') letter = 'G';
    if(currentPhase == 'Waning Crescent') letter = 'J';

    moonPhaseSpan.innerHTML = letter;
    moonPhaseSpan.title = `Current Lunar Phase ${currentPhase}`;


});

function performSearch() {
    const query = searchInput.value.trim();
    if (query) {
        window.location.href = `/search/?search=${encodeURIComponent(query)}`;
    }
}

if ('serviceWorker' in navigator) {
  // Use the window load event to keep the page load performant
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}

function doSubscriptionForm() {
    const SUBSCRIBE_API = '/api/newsletter-signup?email=';
    const subEmail = document.querySelector('#subEmail');
    const subButton = document.querySelector('#subButton');
    const subStatus = document.querySelector('#subStatus');

    subButton.addEventListener('click', () => {
        const email = subEmail.value;
        if(!email) return;
        console.log('add '+email);
        subButton.disabled = true;
        subStatus.innerHTML = 'Attempting to subscribe you...';
        fetch(SUBSCRIBE_API + email)
        .then(res => {
            return res.json()
        })
        .then(res => {
            if(res.creation_date) {
                subStatus.innerHTML = 'You have been subscribed!';
            } else {
                subStatus.innerHTML = `There was an error: ${res.detail}`;
            }
            subButton.disabled = false;
        })
        .catch(e => {
            console.log('error result', e);
        });

    });
}

async function doRecommendations() {

  //let url = window.location.pathname.slice(0,-1);
  let url = window.location.pathname;
  /*
  In order to stay under Algolia's free tier limits, going to limit
  recommendations to items in 202*
  */
  if(url.indexOf('202') === -1) return; 
  if(url.slice(-1) === '/') url = url.slice(0,-1);
  let recommendationReq = await fetch('/api/get-recommendations?path=' + encodeURIComponent(url));
  let recommendations = await recommendationReq.json();

  console.log(`${recommendations.length} recommendations found`);

  if(recommendations.length === 0) return;

  let formatter = new Intl.DateTimeFormat('en-us', {
    dateStyle:'long'
  });

  let reco = `
		<div class="author-box">
			<div class="author-info">
				<h3>Related Content</h3>
        <ul>
  `;

  recommendations.forEach(r => {
    reco += `
      <li><a href="${r.url}">${r.title} (${formatter.format(new Date(r.date))})</a></li>
    `;
  });

  reco += `
      </ul>
    </div>
  </div>`;

  document.querySelector('div.author-box').insertAdjacentHTML('afterend',reco);
}

/**
 * Calculates the current phase of the moon.
 * @returns {string} The current moon phase (e.g., 'New Moon', 'Waxing Crescent', 'Full Moon').
 */
function getCurrentMoonPhase() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // Month is 0-indexed
    const day = now.getDate();

    // Calculate the Julian date for the current date
    let jd = 367 * year - Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) + Math.floor((275 * month) / 9) + day + 1721013.5;

    // Days since new moon (Jan 6, 2000)
    // This is an approximate value, for a precise calculation you'd need more orbital mechanics
    const daysSinceNewMoon = jd - 2451549.5; // Julian date of Jan 6, 2000 New Moon

    // Synodic month (average period of the moon's phases)
    const synodicMonth = 29.53058867;

    // Calculate the phase as a fraction of the synodic month
    let phase = daysSinceNewMoon % synodicMonth;
    if (phase < 0) {
        phase += synodicMonth;
    }

    // Determine the moon phase based on the fraction
    if (phase < 1.84566) return 'New Moon';
    if (phase < 5.53699) return 'Waxing Crescent';
    if (phase < 9.22831) return 'First Quarter';
    if (phase < 12.91964) return 'Waxing Gibbous';
    if (phase < 16.61097) return 'Full Moon';
    if (phase < 20.30230) return 'Waning Gibbous';
    if (phase < 23.99363) return 'Last Quarter';
    if (phase < 27.68496) return 'Waning Crescent';
    return 'New Moon'; // Should loop back to new moon
}

