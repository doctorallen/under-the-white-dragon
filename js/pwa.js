'use strict';
// ---------------------------------------------------------------------------
// Installing, and staying current. The service worker (sw.js) fetches from
// the network first, so a fresh load is always the latest deploy. A game left
// open (or installed and resumed) checks for a new deploy whenever it comes
// back to the foreground and every fifteen minutes; when one has taken over,
// the game saves and reloads onto it, unless the page is already that
// version (it usually is: a page loaded fresh from the network is current,
// and the new worker taking over just after it needs no reload). The pause menu offers Install where the
// browser allows it, says how on iPhone, and, open in a browser tab when it's
// already installed (so the browser won't offer it), says to open the app.
// ---------------------------------------------------------------------------
// the deploy stamps this with the commit, as it does sw.js
const PAGE_BUILD = '__BUILD__';
const Pwa = {
  app: null, elsewhere: false,
  get prompt() { return this.app && this.app.prompt; },
  get build() { return this.app && this.app.live; },
  init() {
    // (Tycho's installable app: the install pop-up on the first tap or key
    // press after the browser says the game can be installed, asked once,
    // again after a few days if it was turned down; and a new version, once
    // it's taken over, saved and reloaded onto)
    this.app = Tycho.pwa.start({
      build: PAGE_BUILD, askedKey: 'downlevel.installAsked', canAsk: () => true,
      onInstallable: () => { if (Hud.open === 'pause') Hud.refresh(); },
      onInstalled: () => Game.toast('Installed. The White Dragon is on your home screen.', 'good'),
      onNewer: () => { Save.write(); this.app.reload(); },
    });
    // (installed, but open in a tab: the manifest lists the game, so the browser can say)
    this.app.installedElsewhere().then((yes) => { this.elsewhere = yes; if (yes && Hud.open === 'pause') Hud.refresh(); });
  },
  check() { if (this.app) this.app.check(); },
  installed() { return this.app ? this.app.installed() : false; },
  ios() { return this.app ? this.app.ios() : false; },
  install() { if (this.app) this.app.install(); },
  // a line for the pause menu
  html() {
    const b = this.build ? `Build ${this.build}. ` : '';
    if (this.installed()) return `<p class="dim">${b}Installed. It updates itself when there's a new version.</p>`;
    if (this.prompt) return `<p class="dim">${b}</p><div class="buttons"><button data-act="install">Install the game</button></div>`;
    if (this.elsewhere) return `<p class="dim">${b}Installed on this device: open it from your home screen or apps for the full screen.</p>`;
    if (this.ios()) return `<p class="dim">${b}To install: Share, then Add to Home Screen.</p>`;
    return b ? `<p class="dim">${b}</p>` : '';
  },
};
