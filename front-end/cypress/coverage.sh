#!/bin/sh
# Cypress e2e coverage: instrumented dev build served on :4300 (ng serve on :4200 is left alone).
# Report: ../rapports/front-end-cypress/index.html (see .nycrc.json)
set -e
cd "$(dirname "$0")/.."
OUT=dist/coverage/browser
rm -rf dist/coverage .nyc_output
npx ng build --configuration development --output-path dist/coverage
# source paths in the map are relative to the project root, not to $OUT: make them absolute
node -e 'const fs=require("fs"),path=require("path"),f=process.argv[1],m=JSON.parse(fs.readFileSync(f));m.sources=m.sources.map(s=>path.resolve(s));fs.writeFileSync(f,JSON.stringify(m))' $OUT/main.js.map
npx nyc instrument --in-place --include "$OUT/main.js" --exclude-after-remap=false $OUT
npx vite preview --outDir $OUT --port 4300 --strictPort >/dev/null 2>&1 &
trap "kill $!" EXIT
until curl -sf -o /dev/null http://localhost:4300/; do sleep 0.5; done
npx cypress run --config baseUrl=http://localhost:4300 "$@"
# the plugin's own report ignores .nycrc filtering (includes node_modules): regenerate it
rm -rf ../rapports/front-end-cypress
npx nyc report
