/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference path="./background-sync.d.ts" />

importScripts('https://cdn.jsdelivr.net/npm/idb@8/build/umd.js');

/*
  Initialization
*/
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

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));


/*
  Caching handling, service worker installation and activation handling
*/
const STATIC_CACHE_NAME = 'static-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-v1';

async function preCache() {
  const cache = await caches.open(STATIC_CACHE_NAME);
  console.log('[Service Worker] Pre-caching static assets');
  await cache.addAll([
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/utility.js',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
    'https://code.getmdl.io/1.3.0/material.min.js'
  ]);
}

sw.addEventListener('install', async function (event) {
  console.log('[Service Worker] Installing Service Worker ...');
  event.waitUntil(Promise.all([preCache(), sw.skipWaiting()]));
});

async function deleteOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.filter(cacheName => cacheName !== STATIC_CACHE_NAME).map(cacheName => caches.delete(cacheName))
  );
}

sw.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....');
  event.waitUntil(Promise.all([deleteOldCaches(), sw.clients.claim()]));
});


/*
  Fetch handling
*/
async function fetchAndCache(request) {
  try {

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await fetch(request);
    if (request.url.includes('/api')) {
      if (request.url.includes('/posts')) {
        const data = await response.clone().json();
        const db = await dbPromise;
        await db.clear('posts');
        for (const post of data.posts) {
          db.put('posts', post);
        }
      }
      return response;
    }
    const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
    dynamicCache.put(request, response.clone());
    return response;
  } catch (error) {
    const staticCache = await caches.open(STATIC_CACHE_NAME);
    return staticCache.match('/offline.html');
  }
}

sw.addEventListener('fetch', function (event) {
  event.respondWith(fetchAndCache(event.request));
});

/*
  Sync handling
*/
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

sw.addEventListener('sync',async  function (event) {
  console.log('[Service Worker] Sync event');
  if (event.tag === 'sync-new-posts') {
    event.waitUntil(syncPosts(event));
  }
});


/*
  Push-notification handling
*/
async function showNewPostNotification(data) {
  await sw.registration.showNotification(data.title, {
    body: data.body,
    icon: "/src/images/icons/app-icon-96x96.png",
    vibrate: [ 100, 50, 200 ],
    badge: "/src/images/icons/app-icon-96x96.png",
    data: {
      openUrl: data.openUrl || '/'
    }
  });
}

sw.addEventListener('push', function (event) {
  console.log('[Service Worker] Push event');
  if (event.data) {
    const data = event.data.json();
    console.log('[Service Worker] Push event data', data);
    event.waitUntil(showNewPostNotification(data));
  }
});

async function handleNotificationClick(notification) {
  const clients = await sw.clients.matchAll({type: 'window'});
  const visibleClient = clients.find(client => client.visibilityState === 'visible');
  if (visibleClient) {
    await visibleClient.navigate(notification.data.openUrl);
    await visibleClient.focus();
  } else {
    await sw.clients.openWindow(notification.data.openUrl);
  }
  await notification.close();
}

sw.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification clicked');
  const notification = event.notification;
  const action = event.action;
  if (action === 'confirm') {
    console.log('[Service Worker] Confirm action');
  } else {
    console.log('[Service Worker] Clicked notification');
    event.waitUntil(handleNotificationClick(notification));
  }
});

sw.addEventListener('notificationclose', function (event) {
  console.log('[Service Worker] Notification closed');
  const notification = event.notification;
  if (notification.tag === 'confirmation-notification') {
    console.log('[Service Worker] Notification closed');
  }
});