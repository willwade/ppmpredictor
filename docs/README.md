# PPMPredictor Demo Pages

This directory contains interactive demos for the PPMPredictor library.

## Available Demos

### 1. Simple Demo (`index.html`)
A basic demonstration of PPMPredictor's core features:
- Character prediction
- Word completion
- Error-tolerant prediction (typo correction)

**Features:**
- Pre-trained on sample English text
- Small lexicon for word completion
- Fuzzy matching for typo tolerance

### 2. Comprehensive Demo (`demo.html`)
A full-featured demonstration integrating PPMPredictor with WorldAlphabets:

**Features:**
- 🌍 **Multi-language Support**: 24+ languages with training data
- 📚 **WorldAlphabets Integration**: Uses frequency data as lexicon
- ⌨️ **Keyboard Layout Selection**: Choose from 100+ keyboard layouts or linear ABC scanning
- 🔧 **Error Tolerance**: Toggle fuzzy matching on/off
- 🎯 **Keyboard-Aware Typos**: Considers physical key proximity
- 📖 **Adaptive Learning**: Learn new words as you type
- 🗑️ **Word Management**: View and clear learned words
- 📊 **Statistics**: Track lexicon size, learned words, and training data

## Supported Languages

The comprehensive demo supports the following languages with training data:

- Albanian (sq)
- Basque (eu)
- Bengali (bn)
- Czech (cs)
- Danish (da)
- Dutch (nl)
- English (en)
- Finnish (fi)
- French (fr)
- German (de)
- Greek (el)
- Hebrew (he)
- Hungarian (hu)
- Italian (it)
- Mongolian (mn)
- Persian (fa)
- Polish (pl)
- Portuguese (pt)
- Russian (ru)
- Spanish (es)
- Swahili (sw)
- Swedish (sv)
- Turkish (tr)
- Welsh (cy)

## How It Works

### Language Selection
1. Select a language from the dropdown
2. The demo loads:
   - Frequency data from WorldAlphabets (top 5000 words as lexicon)
   - Training text from `data/training/` directory
3. A new predictor is created and trained

### Keyboard Layouts
- **Linear ABC**: Simple alphabetical list for switch scanning
- **Keyboard Layouts**: Real keyboard layouts from WorldAlphabets
  - Visualizes base and shift layers
  - Can be used for keyboard-aware typo detection

### Adaptive Learning
When enabled:
- New words you type are automatically learned
- Learned words are added to the lexicon
- You can view all learned words
- Clear individual words or all learned words

### Error Tolerance
- **Fuzzy Matching**: Finds words even with typos (edit distance ≤ 2)
- **Keyboard-Aware**: Considers physical key proximity when selected keyboard layout is active
- **Similarity Threshold**: Only shows matches with ≥ 50% similarity

## Technical Details

### Libraries Used
- **PPMPredictor**: Character and word prediction using PPM (Prediction by Partial Matching)
- **WorldAlphabets**: Multi-language alphabets, frequency data, and keyboard layouts

### Data Sources
- **Lexicon**: WorldAlphabets frequency lists (top 5000 words per language)
- **Training Data**: Text files from Dasher project in `data/training/`
- **Keyboard Layouts**: WorldAlphabets keyboard layout database

### Prediction Algorithm
1. **Character-level**: PPM model trained on text corpus
2. **Word-level**: Combines lexicon lookup with PPM scoring
3. **Error-tolerant**: BK-Tree for efficient fuzzy matching
4. **Keyboard-aware**: Weighted edit distance based on key proximity

## Development

### Local Testing
1. Build the library: `npm run build`
2. Open `docs/index.html` or `docs/demo.html` in a browser
3. For the comprehensive demo, ensure training data is accessible

### Deployment
The demos are automatically deployed to GitHub Pages via `.github/workflows/deploy-pages.yml`:
- Builds the library bundles
- Copies dist files to `docs/dist/`
- Copies training data to `docs/data/training/`
- Deploys the `docs/` directory

## Browser Compatibility

Both demos work in modern browsers that support:
- ES6 modules
- Async/await
- Fetch API
- CSS Grid

Tested in:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

### Simple Demo
- Library size: ~50KB minified
- Load time: < 1s
- Prediction time: < 1ms

### Comprehensive Demo
- Library size: ~50KB (PPMPredictor) + ~2MB (WorldAlphabets from CDN)
- Initial load: 2-5s (includes loading frequency data and training text)
- Language switch: 1-3s
- Prediction time: < 5ms

## Future Enhancements

Potential additions to the comprehensive demo:
- [ ] N-gram prediction (next word prediction)
- [ ] Custom training text upload
- [ ] Export/import learned words
- [ ] Prediction accuracy metrics
- [ ] Typo simulation and correction testing
- [ ] Multi-script support visualization
- [ ] Speech synthesis integration
- [ ] AAC-specific features (phrases, categories)

## License

Apache 2.0 - See LICENSE file for details

## Credits

- **PPMPredictor**: Will Wade
- **WorldAlphabets**: Will Wade
- **Training Data**: Dasher Project
- **PPM Algorithm**: Based on Google Research implementation

