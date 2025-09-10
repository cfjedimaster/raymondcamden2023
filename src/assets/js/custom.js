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