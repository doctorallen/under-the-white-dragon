#!/bin/sh
# Static checks: every script parses, index.html and js/ agree with each
# other, and no global is declared in two files (they all share one scope, so
# the second would silently replace the first).
set -e
cd "$(dirname "$0")/.."

for f in js/*.js test/*.js; do node --check "$f"; done

grep -o 'src="js/[^"]*"' index.html | cut -d'"' -f2 | while read -r f; do
  test -f "$f" || { echo "index.html names a missing script: $f"; exit 1; }
done
for f in js/*.js; do
  grep -q "src=\"$f\"" index.html || { echo "$f is not loaded by index.html"; exit 1; }
done
for f in $(grep -o 'href="[^"]*"' index.html | cut -d'"' -f2 | grep -v '^http' | grep -v '^#'); do
  test -f "$f" || { echo "index.html links a missing file: $f"; exit 1; }
done

# Tycho, the engine, with Tyrell, the minds engine, inside it, is a git
# submodule: it must be checked out, and what the page loads from it there
test -f vendor/tycho/dist/tyrell.js || { echo "vendor/tycho is missing: git submodule update --init"; exit 1; }
for f in $(grep -o 'src="vendor/tycho/dist/[^"]*"' index.html | cut -d'"' -f2); do
  test -f "$f" || { echo "index.html loads a missing file: $f"; exit 1; }
done
grep -q 'src="vendor/tycho/dist/tyrell.js"' index.html || { echo "index.html does not load vendor/tycho/dist/tyrell.js"; exit 1; }

# the service worker is Tycho's (it keeps everything index.html names, for
# offline play): sw.js imports it and keeps its stamp for the deploy
node --check sw.js
grep -q "importScripts('vendor/tycho/dist/tycho-sw.js')" sw.js || { echo "sw.js does not import Tycho's worker"; exit 1; }
test -f vendor/tycho/dist/tycho-sw.js || { echo "vendor/tycho/dist/tycho-sw.js is missing"; exit 1; }
grep -q "__BUILD__" sw.js || { echo "sw.js lost its __BUILD__ stamp"; exit 1; }
for f in $(grep -o "files: \[[^]]*\]" sw.js | grep -o "'[^']*'" | tr -d "'"); do test -f "$f" || { echo "sw.js keeps a missing file: $f"; exit 1; }; done
node -e "const m = JSON.parse(require('fs').readFileSync('manifest.webmanifest', 'utf8')); for (const i of m.icons) if (!require('fs').existsSync(i.src)) { console.log('manifest.webmanifest names a missing icon: ' + i.src); process.exit(1); }"

dups=$(grep -hoE '^(function|const|let|var|class) [A-Za-z0-9_$]+' js/*.js | awk '{print $2}' | sort | uniq -d)
if [ -n "$dups" ]; then echo "declared in more than one file: $dups"; exit 1; fi

# the world and its paint may only use seeded randomness
if grep -n 'Math\.random' js/world.js js/paint.js js/spr.js js/util.js js/levels.js js/people.js js/props.js js/travel.js js/kit.js js/d_*.js | grep -v '//'; then echo "generation and painting must be seeded (hash / Rng), never Math.random"; exit 1; fi
echo "check: ok"
