const cacheName = 'v1';
const cacheAssets = [ // Array of all pages you want to cache. Do this if you don't have many pages to cache
    'index.html',
    '/css/main.css',
    '/js/main.js'
];


// Call Install Event. This is where we handle caching assets
self.addEventListener('install', e => {
    console.log('Service Worker: Installed');

    e.waitUntil( // Waiting until the promise is finished
        caches
            .open(cacheName)
            .then(cache => {
                console.log('Service Worker: Caching Files');
                cache.addAll(cacheAssets);
            }) // .open() gives a promise with a cache object
            .then(() => self.skipWaiting())
    );
});

// Call activate event. Clean up any old cache in here
self.addEventListener('activate', e => {
    console.log('Service Worker: Activated');
    // Removing unwanted caches
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if(cache !== cacheName) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Call fetch event
self.addEventListener('fetch', e => {
    console.log('Service Worker: Fetching');
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request)) // .match() method loads the files from the cache
        // Can cache the entire response here, because you need to fetch it first, then cache it
    );
});
