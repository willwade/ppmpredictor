# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

