#!/bin/sh
# Renders the README images in media/github/ from banners.html with headless Chrome.
# Usage: sh media/github/src/render.sh   (needs network for the web fonts)
set -eu
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
python3 -I - <<'PY'
import json
svg = open('../../../site/assets/art/rovelle-chart.svg').read()
page = open('banners.html').read().replace('</head>', '<script>window.CHART_SVG = %s;</script></head>' % json.dumps(svg), 1)
open('_render.html', 'w').write(page)
PY
for spec in banner:1280:640 stories:1280:240 world:1280:240 agent:1280:240 chart:1280:860 cover-mobius:480:600; do
  name=${spec%%:*}; rest=${spec#*:}; w=${rest%%:*}; h=${rest#*:}
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size="$w,$h" --virtual-time-budget=8000 --screenshot="_$name.png" "file://$PWD/_render.html#$name" >/dev/null 2>&1
  magick "_$name.png" -strip -quality 86 "../$name.jpg"
  rm "_$name.png"
done
rm _render.html
ls -la ..
