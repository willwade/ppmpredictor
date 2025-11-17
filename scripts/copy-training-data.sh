#!/bin/bash

# Copy training data from /data/training to /docs/data/training for local demo development
# This is needed because Vite serves from /docs directory

echo "📚 Copying training data for demo..."

# Create target directory
mkdir -p docs/data/training

# Copy training files
cp -r data/training/* docs/data/training/

echo "✅ Training data copied to docs/data/training/"
echo "   Source: data/training/ (26MB)"
echo "   Target: docs/data/training/ (for local demo)"
echo ""
echo "Note: docs/data/ is in .gitignore and won't be committed"

