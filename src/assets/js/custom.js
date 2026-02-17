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
    let iconSize = 14; 
    let moonIconSVG = generateMoonPhaseSVG(currentPhase, iconSize, '#ffffff');

    // Set the innerHTML of the span to the generated SVG
    moonPhaseSpan.innerHTML = moonIconSVG;
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

/**
 * Generates an SVG icon for a given moon phase.
 * @param {string} phase The moon phase (e.g., 'New Moon', 'Full Moon').
 * @param {number} size The size of the SVG (width and height).
 * @param {string} [color='currentColor'] An optional color for the moon icon (e.g., 'white', '#FFD700').
 * @returns {string} The SVG string for the moon phase icon.
 */
function generateMoonPhaseSVG(phase, size = 24, color = 'currentColor') {
    const r = size / 2; // Radius
    const cx = r; // Center x
    const cy = r; // Center y

    let pathD = '';
    let fill = color;    // Use the provided color or default
    let stroke = color;  // Use the provided color or default
    let strokeWidth = size * 0.05; // 5% of size

    switch (phase) {
        case 'New Moon':
            // Outline circle for new moon
            pathD = `M ${cx} ${cy} m ${-r + strokeWidth / 2}, 0 a ${r - strokeWidth / 2},${r - strokeWidth / 2} 0 1,0 ${2 * (r - strokeWidth / 2)},0 a ${r - strokeWidth / 2},${r - strokeWidth / 2} 0 1,0 ${-2 * (r - strokeWidth / 2)},0`;
            fill = 'none'; // New moon is an outline, so no fill
            break;
        case 'Waxing Crescent':
            // This is a bit complex for a simple crescent. We'll use a full circle and cut out a dark crescent.
            // Full circle, then subtract a crescent shape
            pathD = `M ${cx},${cy - r} A ${r},${r} 0 0,1 ${cx},${cy + r} A ${r},${r} 0 0,1 ${cx},${cy - r} Z ` + // Full circle for the base
                    `M ${cx + (r * 0.5)},${cy - r} A ${r},${r} 0 0,0 ${cx + (r * 0.5)},${cy + r} A ${r},${r} 0 0,0 ${cx + (r * 0.5)},${cy - r} Z`; // A slightly offset ellipse for the cutout
            break;
        case 'First Quarter':
            // Right half of the moon is lit
            pathD = `M ${cx},${cy - r} A ${r},${r} 0 0,1 ${cx},${cy + r} L ${cx},${cy + r} L ${cx},${cy - r} Z`;
            break;
        case 'Waxing Gibbous':
            // Almost full, dark crescent on the left
            pathD = `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx},${cy + r} A ${r},${r} 0 1,1 ${cx},${cy - r} Z ` + // Full circle
                    `M ${cx - (r * 0.5)},${cy - r} A ${r},${r} 0 0,0 ${cx - (r * 0.5)},${cy + r} L ${cx - (r * 0.5)},${cy + r} L ${cx - (r * 0.5)},${cy - r} Z`; // Left crescent cutout
            break;
        case 'Full Moon':
            // Full circle
            pathD = `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx},${cy + r} A ${r},${r} 0 1,1 ${cx},${cy - r} Z`;
            break;
        case 'Waning Gibbous':
            // Almost full, dark crescent on the right
            pathD = `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx},${cy + r} A ${r},${r} 0 1,1 ${cx},${cy - r} Z ` + // Full circle
                    `M ${cx + (r * 0.5)},${cy - r} A ${r},${r} 0 0,1 ${cx + (r * 0.5)},${cy + r} L ${cx + (r * 0.5)},${cy + r} L ${cx + (r * 0.5)},${cy - r} Z`; // Right crescent cutout
            break;
        case 'Last Quarter':
            // Left half of the moon is lit
            pathD = `M ${cx},${cy - r} A ${r},${r} 0 0,0 ${cx},${cy + r} L ${cx},${cy + r} L ${cx},${cy - r} Z`;
            break;
        case 'Waning Crescent':
            // Half moon + crescent on the left
            pathD = `M ${cx},${cy - r} A ${r},${r} 0 0,0 ${cx},${cy + r} A ${r},${r} 0 0,0 ${cx},${cy - r} Z ` + // Full circle
                    `M ${cx - (r * 0.5)},${cy - r} A ${r},${r} 0 0,1 ${cx - (r * 0.5)},${cy + r} A ${r},${r} 0 0,1 ${cx - (r * 0.5)},${cy - r} Z`; // Inner crescent cutout
            break;
        default:
            // Fallback to New Moon outline
            pathD = `M ${cx} ${cy} m ${-r + strokeWidth / 2}, 0 a ${r - strokeWidth / 2},${r - strokeWidth / 2} 0 1,0 ${2 * (r - strokeWidth / 2)},0 a ${r - strokeWidth / 2},${r - strokeWidth / 2} 0 1,0 ${-2 * (r - strokeWidth / 2)},0`;
            fill = 'none';
            break;
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}">
                <path d="${pathD}" />
            </svg>`;
}
