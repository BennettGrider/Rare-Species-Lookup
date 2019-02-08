const cacheName = 'v3';


// Call Install Event. This is where we handle caching assets
self.addEventListener('install', e => {
    console.log('Service Worker: Installed');
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

// Call fetch event. In this service worker, we want to cache the entire site, so we will do that in the fetch event instead
self.addEventListener('fetch', e => {
    console.log('Service Worker: Fetching');
    e.respondWith(
        fetch(e.request) // Can cache the entire response here, because you need to fetch it first, then cache it
            .then(res => {
                // Make a copy/clone of the response from the server
                const resClone = res.clone();
                // Open a cache
                caches
                    .open(cacheName)
                    .then(cache => {
                        // Add response to the cache
                        cache.put(e.request, resClone);
                    });
                return res;
            }).catch(err => caches.match(e.request).then(res => res)) // If connection drops, catch method runs. User should have the site in the cache
    );
});
