#!/bin/sh
# Publicerar index.html till https://albanskmat.pages.dev (Cloudflare Pages).
# Datan hämtas från GitHub Pages, så detta behövs bara när index.html ändras.
set -e
cd "$(dirname "$0")"
T=$(mktemp -d); cp index.html "$T/"
PATH="$HOME/.local/node/bin:$PATH" npx --prefix server wrangler pages deploy "$T" --project-name albanskmat --branch main --commit-dirty=true
rm -rf "$T"
