#!/bin/sh
# Build the site here, build the image on the preview box and (re)start it at https://<slug>.tetris.international.
# The slug is the only access control, so it lives in .preview-slug next to this script and is never shared publicly.
set -eu
cd "$(dirname "$0")"
[ -s .preview-slug ] || openssl rand -hex 16 > .preview-slug
slug=$(cat .preview-slug)
url="https://$slug.tetris.international"

(cd apps/web && npx vite build >/dev/null)
rm -rf ops/preview/site
cp -R apps/web/dist ops/preview/site

export DOCKER_HOST=ssh://preview@ssh.tetris.international
docker build -q -t "$slug" ops/preview >/dev/null
docker stop -t 10 "$slug" >/dev/null 2>&1 || true
docker rm "$slug" >/dev/null 2>&1 || true
docker run -d --name "$slug" --network preview --restart unless-stopped \
  --memory 128m --cpus 0.5 --label preview.owner="$(whoami)" \
  "$slug" >/dev/null
rm -rf ops/preview/site
echo "$url"
