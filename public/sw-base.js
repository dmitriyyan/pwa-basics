/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference path="./background-sync.d.ts" />

/*
  Initialization
*/
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js',
  'https://cdn.jsdelivr.net/npm/idb@8/build/umd.js'
);

/** @type {typeof import('idb')} */
const idb = self.idb;
const dbPromise = idb.openDB('posts-store', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('posts')) {
      db.createObjectStore('posts', { keyPath: 'id' });
    } else if (!db.objectStoreNames.contains('sync-posts')) {
      db.createObjectStore('sync-posts', { keyPath: 'id' });
    }
  },
});

/*
  Caching handling
*/
const { StaleWhileRevalidate } = workbox.strategies;
const { registerRoute } = workbox.routing;

registerRoute(
  /https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
  })
);

registerRoute(
    /https:\/\/(?:cdnjs\.cloudflare\.com\/ajax\/libs\/material-design-lite\/1\.3\.0\/material\.indigo-pink\.min\.css|code\.getmdl\.io\/1\.3\.0\/material\.min\.js)/,
  new StaleWhileRevalidate({
    cacheName: 'material'
  })
);

registerRoute('https://cdn.jsdelivr.net/npm/idb@8/build/umd.js', new StaleWhileRevalidate({
  cacheName: 'idb'
}));

registerRoute(
  /https:\/\/picsum\.photos\/.*/,
  new StaleWhileRevalidate({
    cacheName: 'posts-images',
  }),
);

registerRoute(
  'http://localhost:3000/api/posts',
  async function ({ event }) {
    try {
      const response = await fetch(event.request);
      const data = await response.clone().json();
      const db = await dbPromise;
      await db.clear('posts');
      for (const post of data.posts) {
        db.put('posts', post);
      }
      return response;
    } catch (error) {
      return new Response('Error fetching posts', { status: 500 });
    }
  }
);

workbox.routing.setDefaultHandler(new StaleWhileRevalidate({
  cacheName: 'dynamic-cache',
}));
workbox.recipes.offlineFallback();

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

/*
  Sync handling
*/
// this is default bg sync with workbox but you need to add logic to frontend because it will show error if there is no internet connection
// registerRoute(
//   'http://localhost:3000/api/posts',
//   new workbox.strategies.NetworkOnly({
//     plugins: [
//       new workbox.backgroundSync.BackgroundSyncPlugin('sync-new-posts', {
//         maxRetentionTime: 24 * 60,
//       }),
//     ],
//   }),
// );
async function syncPosts(event) {
  try {
    const db = await dbPromise;
    const syncPosts = await db.getAll('sync-posts');
    const response = await fetch('http://localhost:3000/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(syncPosts)
    });
    if (response.ok) {
      await db.clear('sync-posts');
    }
    console.log('[Service Worker] Sync posts', syncPosts);
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

sw.addEventListener('sync', async  function (event) {
  console.log('[Service Worker] Sync event');
  if (event.tag === 'sync-new-posts') {
    event.waitUntil(syncPosts(event));
  }
});

