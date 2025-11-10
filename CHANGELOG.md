# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.9] - 2025-11-10

### Added
- **Per-corpus lexicons** - Each training corpus can now have its own lexicon for true multilingual and domain-specific support
- **Bigram tracking** - Automatic word-pair frequency tracking for next-word prediction
- **Multi-corpus management** - Train and manage multiple domain-specific corpora with `addTrainingCorpus()`, `useCorpora()`, `removeCorpus()`
- **Next-word prediction API** - `predictNextWord()`, `exportBigrams()`, `importBigrams()`, `getBigramStats()`, `clearBigrams()`
- **Multilingual demo** - Interactive demo with 24+ languages, WorldAlphabets integration, keyboard layout visualization
- 6 new tests for per-corpus lexicon functionality
- 8 new tests for bigram tracking
- 10 new tests for multi-corpus management

### Changed
- **README restructured** - Improved organization with Quick Start, Usage, Advanced Usage, and API Reference sections
- **Corpus data structure** - Each corpus now stores its own `lexicon`, `lexiconIndex`, `lexiconTree`, and `lexiconTrie`
- **Word completion** - Now merges lexicons from all active corpora for multilingual support
- **Training** - Automatically learns bigrams (word pairs) during `train()` and `addTrainingCorpus()`
- **npm package size reduced by ~99%** - Removed training data from published package (149.7 KB vs ~23MB)

### Fixed
- **GitHub Pages demo paths** - Fixed resource loading for demo.html on GitHub Pages
- Demo script path changed from `/demo-app.js` to `./demo-app.js`
- Training data paths changed from `../data/training/` to `data/training/`

### Documentation
- Added comprehensive examples for multi-corpus usage
- Added multilingual support examples (French, Spanish, English)
- Added domain-specific vocabulary examples (medical, work, academic)
- Added bigram tracking examples with export/import
- Improved Keyboard-Aware Matching section with complete QWERTY adjacency map example
- Added WorldAlphabets integration helper function example
- Clarified lexicon vs no-lexicon behavior in Training section

### Breaking Changes
- None - All changes are backward compatible

## [0.0.7] - 2025-11-09

### Added
- Regression test to lock in key character/word/fuzzy predictions and guard future performance refactors.
- Support for custom keyboard adjacency maps (plus example) when using keyboard-aware fuzzy matching.

### Changed
- Reworked vocabulary lookups to use an O(1) symbol map for faster training/adaptive updates.
- Replaced linear lexicon fuzzy scans with a BK-tree, improving error-tolerant lookups for large vocabularies.
- Introduced a prefix trie for deterministic, faster lexicon prefix searches.
- Updated documentation with live adaptive training guidance and tips on persisting incremental learning.

### Performance
- Character training benchmark (50× sample conversation) improved about 9%.
- Lexicon prefix completions on `data/comprehensive_lexicon.txt` improved about 8% (9.33 ms → 8.56 ms avg).
- Fuzzy completions on the same lexicon improved about 12% (10.09 ms → 8.96 ms avg).

### Breaking Changes
- None.

## [1.0.0] - 2025-11-04

### Added
- Initial release of noisy-channel-predictor
- Character-level prediction using PPM (Prediction by Partial Matching)
- Word completion with lexicon support
- Error-tolerant mode with fuzzy matching
- Keyboard-aware distance calculation for proximity-based error correction
- Adaptive learning mode that updates as users type
- Configurable tolerance levels (strict vs error-tolerant)
- Case-sensitive and case-insensitive matching options
- Comprehensive API with factory functions
- TypeScript type definitions
- Full test suite with 20+ tests
- Three detailed examples:
  - Basic character prediction
  - Error-tolerant prediction with typos
  - Word completion with lexicon
- Complete documentation with API reference
- Zero external dependencies

### Features
- `createPredictor()` - Create predictor with custom configuration
- `createStrictPredictor()` - Create predictor in strict mode
- `createErrorTolerantPredictor()` - Create predictor in error-tolerant mode
- `Predictor.train()` - Train model on text
- `Predictor.predictNextCharacter()` - Get character predictions
- `Predictor.predictWordCompletion()` - Get word completion predictions
- `Predictor.updateConfig()` - Update configuration at runtime
- Utility functions for edit distance and similarity scoring
- Fuzzy matching utilities
- Word tokenization utilities

### Documentation
- Comprehensive README with examples
- API reference documentation
- Configuration guide
- Use case examples (AAC, text input, spell correction)
- Performance considerations and optimization tips

[1.0.0]: https://github.com/willwade/noisy-channel-correction/releases/tag/v1.0.0
