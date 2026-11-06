importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.4.1/workbox-sw.js');
workbox.setConfig({ debug: false });

const { registerRoute } = workbox.routing;
const { NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;

const maxAgeSeconds = 30 * 24 * 60 * 60;

function cachePlugins(maxEntries) {
	return [
		new CacheableResponsePlugin({ statuses: [200] }),
		new ExpirationPlugin({ maxEntries, maxAgeSeconds })
	];
}

registerRoute(
	({ request }) => request.mode === 'navigate',
	new NetworkFirst({
		cacheName: 'blog-pages',
		networkTimeoutSeconds: 3,
		plugins: cachePlugins(100)
	})
);

function registerAssetRoute(destination, cacheName) {
	registerRoute(
		({ request, url }) => url.origin === self.location.origin && request.destination === destination,
		new NetworkFirst({
			cacheName,
			plugins: cachePlugins(100)
		})
	);
}

registerAssetRoute('script', 'blog-scripts');
registerAssetRoute('style', 'blog-styles');
registerAssetRoute('image', 'blog-images');

self.addEventListener('activate', event => {
	event.waitUntil(caches.delete('workbox-runtime'));
});
