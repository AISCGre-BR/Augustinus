#!/bin/bash

# Find local texmf directory
TEXMFHOME=$(kpsewhich -var-value=TEXMFHOME)

if [ -z "$TEXMFHOME" ]; then
    echo "Error: Could not find TEXMFHOME. Is TeX Live installed?"
    exit 1
fi

# Expand path if it starts with ~
TEXMFHOME="${TEXMFHOME/#\~/$HOME}"

DEST_DIR="$TEXMFHOME/tex/latex/augustinus"

echo "Installing augustinus.sty to $DEST_DIR..."

mkdir -p "$DEST_DIR"
cp augustinus.sty "$DEST_DIR/"

# Optional: refresh filename database
# Usually not needed for TEXMFHOME in modern distributions, but good for completeness
if command -v texhash >/dev/null 2>&1; then
    texhash "$TEXMFHOME"
fi

echo "Installation complete."
