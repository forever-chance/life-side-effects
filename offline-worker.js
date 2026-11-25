'use strict';

const offlineCache = 'life-offline-275.1';
const root = self.registration.scope;
const local = path => new URL(path, root).href;

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

let download;
self.addEventListener('message', event => {
 if (event.data !== 'prepare-offline' || !event.ports[0]) return;
 const reply = event.ports[0];
 download ??= prepareOffline().finally(() => { download = null; });
 event.waitUntil(download.then(() => reply.postMessage(true), () => reply.postMessage(false)));
});

async function prepareOffline() {
 const cache = await caches.open(offlineCache);
 if (await cache.match(local('offline-ready'))) return;
 const response = await fetch(local('offline-assets.json'), {cache:'reload'});
 if (!response.ok) throw new Error('Offline manifest unavailable');
 const files = await response.json();
 for (let offset = 0; offset < files.length; offset += 20) {
  const batch = files.slice(offset,offset+20);
  const existing = await Promise.all(batch.map(path => cache.match(local(path))));
  await cache.addAll(batch.filter((_,index)=>!existing[index]).map(path=>new Request(local(path),{cache:'reload'})));
 }
 await cache.put(local('offline-ready'), new Response('ready'));
 for (const key of await caches.keys()) {
  if (key.startsWith('life-offline-') && key !== offlineCache) await caches.delete(key);
 }
}

self.addEventListener('fetch', event => {
 const request = event.request;
 if (request.method !== 'GET' || !request.url.startsWith(root)) return;
 event.respondWith(fetch(request).catch(async error => {
  const keys = [offlineCache,...(await caches.keys()).filter(key=>key.startsWith('life-offline-')&&key!==offlineCache).reverse()];
  for (const key of keys) {
   const cache = await caches.open(key);
   if (!await cache.match(local('offline-ready'))) continue;
   const saved = request.mode === 'navigate'
    ? await cache.match(local('index.html'))
    : await cache.match(request,{ignoreSearch:true});
   if (saved) return saved;
  }
  throw error;
 }));
});
