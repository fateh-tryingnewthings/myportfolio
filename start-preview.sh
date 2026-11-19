#!/usr/bin/env bash
# Preview the portfolio through a local web server so YouTube videos play
# inside the page (YouTube blocks embeds on pages opened as file://).
# Usage: ./start-preview.sh   then press Ctrl+C to stop.
cd "$(dirname "$0")" || exit 1
PORT="${1:-8080}"
URL="http://localhost:$PORT"
echo "Portfolio running at $URL  (Ctrl+C to stop)"
( sleep 1; xdg-open "$URL" >/dev/null 2>&1 ) &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
