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

