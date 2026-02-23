# Scripts

## copy-training-data.sh

Copies training data from `/data/training/` to `/docs/data/training/` for local demo development.

### Why?

- **Source of truth**: `/data/training/` (26MB, tracked in git)
- **Demo needs it**: Vite serves from `/docs/` directory, so demo needs data at `/docs/data/training/`
- **Not in git**: `/docs/data/` is in `.gitignore` to avoid duplicating 26MB of data
- **Auto-copied**: `npm run dev` automatically runs this script before starting Vite

### Usage

```bash
# Manual copy
npm run copy-training

# Automatic (runs before dev server)
npm run dev
```

### GitHub Actions

The GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) copies training data during deployment:

```yaml
- name: Copy training data to built demo
  run: |
    mkdir -p docs-dist/data/training
    cp -r data/training/* docs-dist/data/training/
```

This ensures the deployed demo on GitHub Pages has access to the training files.

## ppm-parity.js

Generates deterministic PPM probability fingerprints from the JS model using the
Dasher rewrite corpora in https://github.com/PapeCoding/Dasher-LM-Rewrite .

### Usage

```bash
# Run with explicit external corpora paths
npm run parity:ppm -- \
  --train /path/to/Dasher-LM-Rewrite/trainText.txt \
  --test /path/to/Dasher-LM-Rewrite/testText.txt

# Save a baseline reference
npm run parity:ppm -- \
  --train /path/to/Dasher-LM-Rewrite/trainText.txt \
  --test /path/to/Dasher-LM-Rewrite/testText.txt \
  --write-reference temp/js-parity-reference.json

# Compare against a baseline (non-zero exit on mismatch)
npm run parity:ppm -- \
  --train /path/to/Dasher-LM-Rewrite/trainText.txt \
  --test /path/to/Dasher-LM-Rewrite/testText.txt \
  --reference temp/js-parity-reference.json
```

### Notes

- Defaults mirror Dasher-style parameters (`alpha=0.49`, `beta=0.77`, exclusion on).
- Supports memory cap testing via `--max-nodes`.
- The Dasher rewrite repository is intentionally external; do not commit it into this repo.
