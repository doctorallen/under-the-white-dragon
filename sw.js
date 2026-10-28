'use strict';
// ---------------------------------------------------------------------------
// The service worker: makes the game installable and playable offline, but
// never stale. Every request goes to the network first (revalidating past
// the browser's HTTP cache) and only falls back to the cached copy when
// there's no network. BUILD is replaced with the commit at deploy, so each
// deploy is a new worker: it installs, takes over at once, and the page
// reloads itself onto the new version (js/pwa.js).
// ---------------------------------------------------------------------------
// Tycho's worker (vendor/tycho/dist/tycho-sw.js) does the work. It keeps
// what index.html names (every script, the stylesheet, the manifest and its
// icons, the touch icon) and `files`, what only the stylesheet names.
self.TYCHO_SW = { name: 'downlevel', build: '__BUILD__', files: ['fonts/dragon.woff'] };
importScripts('vendor/tycho/dist/tycho-sw.js');
