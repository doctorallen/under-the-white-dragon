'use strict';
// ---------------------------------------------------------------------------
// Installing, and staying current. The service worker (sw.js) fetches from
// the network first, so a fresh load is always the latest deploy. A game left
// open (or installed and resumed) checks for a new deploy whenever it comes
// back to the foreground and every fifteen minutes; when one has taken over,
// the game saves and reloads onto it, unless the page is already that
// version (it usually is: a page loaded fresh from the network is current,
// and the new worker taking over just after it needs no reload). The pause menu offers Install where the
// browser allows it, and says how on iPhone.
// ---------------------------------------------------------------------------
// the deploy stamps this with the commit, as it does sw.js
const PAGE_BUILD = '__BUILD__';
const Pwa = {
  reg: null, prompt: null, build: null, reloading: false,
  init() {
    // the browser's own install pop-up: on the first tap or key press after the
    // browser says the game can be installed, ask once (again after a few days
    // if it was turned down). The event isn't held back, so the browser can
    // also show its own install bar.
    addEventListener('beforeinstallprompt', (e) => { this.prompt = e; if (Hud.open === 'pause') Hud.refresh(); });
    const ask = () => {
      if (!this.prompt || this.installed()) return;
      let last = 0; try { last = +localStorage.getItem('downlevel.installAsked') || 0; } catch (err) { /* storage unavailable */ }
      if (Date.now() - last < 3 * 864e5) return;
      try { localStorage.setItem('downlevel.installAsked', String(Date.now())); } catch (err) { /* storage unavailable */ }
      this.install();
    };
    addEventListener('pointerup', ask); addEventListener('keyup', ask);
    addEventListener('appinstalled', () => { this.prompt = null; Game.toast('Installed. The White Dragon is on your home screen.', 'good'); });
    fetch('version.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((v) => { this.build = v && v.build; }).catch(() => {});
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // a new version took over: save, and reload onto it (not on the very first install)
      if (!hadController || this.reloading) return;
      fetch('version.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((v) => {
        if (v && v.build === PAGE_BUILD) return; // already running it
        this.reloading = true; Save.write(); location.reload();
      });
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      this.reg = reg;
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.check(); });
      setInterval(() => this.check(), 15 * 60 * 1000);
    }).catch(() => {});
  },
  check() { if (this.reg) this.reg.update().catch(() => {}); },
  installed() { return matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true; },
  ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent); },
  install() { if (!this.prompt) return; this.prompt.prompt(); this.prompt.userChoice.finally(() => { this.prompt = null; Hud.refresh(); }); },
  // a line for the pause menu
  html() {
    const b = this.build ? `Build ${this.build}. ` : '';
    if (this.installed()) return `<p class="dim">${b}Installed. It updates itself when there's a new version.</p>`;
    if (this.prompt) return `<p class="dim">${b}</p><div class="buttons"><button data-act="install">Install the game</button></div>`;
    if (this.ios()) return `<p class="dim">${b}To install: Share, then Add to Home Screen.</p>`;
    return b ? `<p class="dim">${b}</p>` : '';
  },
};
