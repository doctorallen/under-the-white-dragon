'use strict';
// ---------------------------------------------------------------------------
// The service worker: makes the game installable and playable offline, but
// never stale. Every request goes to the network first (revalidating past
// the browser's HTTP cache) and only falls back to the cached copy when
// there's no network. BUILD is replaced with the commit at deploy, so each
// deploy is a new worker: it installs, takes over at once, and the page
// reloads itself onto the new version (js/pwa.js).
// ---------------------------------------------------------------------------
const BUILD = '__BUILD__';
const CACHE = 'downlevel-' + BUILD;
// everything the game needs to run offline (test/check.sh keeps this in step with index.html)
const FILES = [
  './',
  'index.html',
  'css/style.css',
  'fonts/dragon.woff',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'vendor/tyrell/dist/tyrell.js',
  'js/util.js',
  'js/tuning.js',
  'js/spr.js',
  'js/paint.js',
  'js/people.js',
  'js/props.js',
  'js/dragon.js',
  'js/items.js',
  'js/quests.js',
  'js/cases.js',
  'js/enhance.js',
  'js/world.js',
  'js/levels.js',
  'js/kit.js',
  'js/travel.js',
  'js/d_high.js',
  'js/d_street.js',
  'js/d_under.js',
  'js/d_old.js',
  'js/d_works.js',
  'js/d_deep.js',
  'js/d_dragon.js',
  'js/d_block.js', 'js/d_neon.js',
  'js/things.js',
  'js/game.js',
  'js/save.js',
  'js/input.js',
  'js/player.js',
  'js/enemies.js',
  'js/actors.js',
  'js/hack.js',
  'js/parts.js',
  'js/bench.js',
  'js/jobs.js', 'js/tips.js',
  'js/town.js',
  'js/city.js',
  'js/life.js',
  'js/day.js',
  'js/skyline.js',
  'js/flight.js',
  'js/map.js',
  'js/worldmap.js',
  'js/dev.js',
  'js/gl.js',
  'js/render.js',
  'js/hud.js',
  'js/panels.js',
  'js/pwa.js',
  'js/main.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('downlevel-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('/version.json')) return; // always straight to the network
  e.respondWith(
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});
