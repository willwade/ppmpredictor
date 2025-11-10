# PPM Predictor

A Node.js library for word and letter prediction with configurable error tolerance, built on PPM (Prediction by Partial Matching) language modeling. Original PPM JS code by Google.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node Version](https://img.shields.io/badge/node-%3E%3D12.0.0-brightgreen.svg)](https://nodejs.org)

## 🎮 Live Demo

**[Try the Interactive Demo](https://willwade.github.io/ppmpredictor/demo.html)** - Full-featured demo with WorldAlphabets integration
- 24+ languages with real training data
- Adaptive learning with word management
- Keyboard layout selection and visualization
- Fuzzy matching and keyboard-aware typos
- Real-time statistics

## Features (aka your regular emoji-filled bullet list)

- 🎯 **Character-level prediction** using PPM language model
- 📝 **Word completion** with lexicon support
- 🔧 **Error-tolerant mode** for handling typos and noisy input
- ⌨️ **Keyboard-aware matching** for proximity-based error correction
- 🔄 **Adaptive learning** that updates as users type
- 🎛️ **Configurable tolerance levels** for different use cases
- 🚀 **Zero dependencies** - pure JavaScript implementation
- ♿ **AAC-focused** - designed for assistive technology applications
- 🌍 **Multi-language support** - works with WorldAlphabets for 100+ languages
- 📚 **Per-corpus lexicons** - NEW in v0.0.7! Each corpus can have its own vocabulary

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Training & Adaptive Learning](#training--adaptive-learning)
  - [Next Character Prediction](#next-character-prediction)
  - [Word Completion](#word-completion)
  - [Next Word Prediction](#next-word-prediction)
  - [Error-Tolerant Prediction](#error-tolerant-prediction)
  - [Keyboard-Aware Matching](#keyboard-aware-matching)
- [Advanced Usage](#advanced-usage)
  - [Managing Multiple Corpora](#managing-multiple-corpora)
  - [Multilingual Support](#multilingual-support)
  - [Domain-Specific Vocabularies](#domain-specific-vocabularies)
- [API Reference](#api-reference)
- [Configuration Guide](#configuration-guide)
- [Examples](#examples)
- [Use Cases](#use-cases)
- [Performance Considerations](#performance-considerations)
- [Testing](#testing)
- [License](#license)
- [Credits](#credits)
- [Contributing](#contributing)

## Installation

```bash
npm install @willwade/ppmpredictor
```

### Platform Support

- **Node.js**: Fully supported (v12+)
- **Browser**: Fully supported (direct usage or bundled)
  - Direct: `<script src="dist/ppmpredictor.min.js"></script>`
  - CDN: `<script src="https://unpkg.com/@willwade/ppmpredictor"></script>`
  - Bundled: Works with Webpack, Rollup, etc.

## Quick Start

```javascript
const { createPredictor } = require('@willwade/ppmpredictor');

// Create a predictor
const predictor = createPredictor({
  lexicon: ['hello', 'help', 'hero', 'world', 'word']
});

// Train on some text
predictor.train('The quick brown fox jumps over the lazy dog');

// Add context and predict next character
predictor.addToContext('The qui');
const charPredictions = predictor.predictNextCharacter();
console.log(charPredictions);
// [{ text: 'c', probability: 0.85 }, ...]

// Word completion
const wordPredictions = predictor.predictWordCompletion('hel');
console.log(wordPredictions);
// [{ text: 'hello', probability: 0.45 }, { text: 'help', probability: 0.35 }, ...]

// Next word prediction
const nextWord = predictor.predictNextWord('quick');
console.log(nextWord);
// [{ text: 'brown', probability: 1.0 }]
```

## Usage

### Training & Adaptive Learning

Train the predictor on text to learn character patterns and word sequences:

```javascript
const { createPredictor } = require('@willwade/ppmpredictor');
const fs = require('fs');

// Option 1: With lexicon (recommended for word completion)
const lexicon = fs.readFileSync('lexicon.txt', 'utf-8')
  .split('\n')
  .filter(word => word.trim());

const predictor = createPredictor({ lexicon });

// Train from a string
predictor.train('The quick brown fox jumps over the lazy dog');

// Train from a file
const trainingText = fs.readFileSync('training.txt', 'utf-8');
predictor.train(trainingText);

// Option 2: Without lexicon (character-level only)
// Word completion will fall back to character-based prediction (slower)
const charOnlyPredictor = createPredictor();
charOnlyPredictor.train('The quick brown fox');
// Still works, but word completion is less efficient

// Adaptive mode - learns as user types
const adaptivePredictor = createPredictor({
  adaptive: true,
  lexicon: lexicon  // Include lexicon for best results
});
adaptivePredictor.addToContext('hello world');
// Model automatically updates with new patterns
```

> **How Training Works**: The PPM (Prediction by Partial Matching) model learns character sequences and their probabilities. It also automatically tracks **bigrams** (word pairs) for next-word prediction. The more text you train on, the better the predictions become.
>
> **Lexicon vs No Lexicon**:
> - **With lexicon**: Word completion uses fast dictionary lookup (recommended)
> - **Without lexicon**: Word completion falls back to character-level prediction (slower but still works)

**Available training files** (in parent project's `data/` directory):
- `sample_training_text.txt` - General text for training
- `sample_conversation.txt` - AAC conversation examples
- `aac_lexicon_en_gb.txt` - AAC vocabulary (2,180 words)

See [examples/train-from-file.js](examples/train-from-file.js) for complete examples.

### Next Character Prediction

Predict the most likely next character based on context:

```javascript
const predictor = createPredictor();
predictor.train('The quick brown fox');

predictor.addToContext('The qui');
const predictions = predictor.predictNextCharacter();

console.log(predictions);
// [
//   { text: 'c', probability: 0.85 },
//   { text: 'e', probability: 0.10 },
//   { text: 't', probability: 0.05 }
// ]
```

### Word Completion

Suggest word completions based on a partial word:

```javascript
const predictor = createPredictor({
  lexicon: ['hello', 'help', 'hero', 'world', 'word', 'work']
});

const completions = predictor.predictWordCompletion('hel');

console.log(completions);
// [
//   { text: 'hello', probability: 0.45 },
//   { text: 'help', probability: 0.35 },
//   { text: 'hero', probability: 0.20 }
// ]
```

**Loading lexicons from files:**

```javascript
const fs = require('fs');

// Load lexicon (one word per line)
const lexicon = fs.readFileSync('lexicon.txt', 'utf-8')
  .split('\n')
  .filter(word => word.trim());

const predictor = createPredictor({ lexicon });
```

### Next Word Prediction

Predict the next word based on the previous word (using bigram tracking):

```javascript
const predictor = createPredictor();

// Train on text - automatically learns word pairs
predictor.train('The quick brown fox. The quick red fox. The quick brown dog.');

// Predict next word after "quick"
const predictions = predictor.predictNextWord('quick');

console.log(predictions);
// [
//   { text: 'brown', probability: 0.67 },
//   { text: 'red', probability: 0.33 }
// ]
```

> **How Bigram Tracking Works**: Bigrams are automatically learned when you call `train()` or `addTrainingCorpus()`. Each word pair's frequency is tracked, and predictions are based on relative frequencies. For example, if "quick brown" appears twice and "quick red" appears once, "brown" gets a 67% probability.

**Bigram statistics:**

```javascript
const stats = predictor.getBigramStats();
console.log(stats);
// { uniqueBigrams: 150, totalBigrams: 500 }

// Export/import bigrams
const bigramData = predictor.exportBigrams();
fs.writeFileSync('bigrams.json', JSON.stringify(bigramData));

const imported = JSON.parse(fs.readFileSync('bigrams.json', 'utf-8'));
predictor.importBigrams(imported);
```

### Error-Tolerant Prediction

Handle typos and noisy input with fuzzy matching:

```javascript
const { createErrorTolerantPredictor } = require('@willwade/ppmpredictor');

const predictor = createErrorTolerantPredictor({
  lexicon: ['hello', 'help', 'world'],
  maxEditDistance: 2,      // Allow up to 2 character edits
  minSimilarity: 0.5       // Require at least 50% similarity
});

// Works even with typos!
const predictions = predictor.predictWordCompletion('helo'); // Missing 'l'

console.log(predictions);
// [
//   { text: 'hello', probability: 0.85, distance: 1, similarity: 0.8 },
//   { text: 'help', probability: 0.15, distance: 2, similarity: 0.5 }
// ]
```

### Keyboard-Aware Matching

Use physical keyboard layout to better handle typos:

```javascript
const predictor = createPredictor({
  lexicon: ['hello', 'jello', 'yellow'],
  errorTolerant: true,
  keyboardAware: true  // Uses QWERTY layout by default
});

// 'h' and 'j' are adjacent on QWERTY, so 'jello' scores higher
const predictions = predictor.predictWordCompletion('helo');
// 'jello' gets a better score than 'yellow' because 'h' and 'j' are close
```

**Custom keyboard layouts:**

```javascript
const customLayout = {
  'a': ['q', 's', 'z'],
  'b': ['v', 'g', 'h', 'n'],
  // ... define adjacency for all keys
};

const predictor = createPredictor({
  keyboardAware: true,
  keyboardAdjacencyMap: customLayout
});
```

**WorldAlphabets integration** (100+ keyboard layouts):

```javascript
const { loadKeyboardLayout } = require('worldalphabets');

const layout = await loadKeyboardLayout('fr-azerty');
const adjacencyMap = buildAdjacencyMap(layout); // Your helper function

const predictor = createPredictor({
  keyboardAware: true,
  keyboardAdjacencyMap: adjacencyMap
});
```

## Advanced Usage

### Managing Multiple Corpora

**New in v0.0.7**: Train and manage multiple domain-specific corpora for context-aware predictions.

```javascript
const { createPredictor } = require('@willwade/ppmpredictor');

const predictor = createPredictor({
  lexicon: generalWords  // Default corpus
});

// Add domain-specific corpora
predictor.addTrainingCorpus('medical', medicalText, {
  description: 'Medical terminology',
  lexicon: medicalWords
});

predictor.addTrainingCorpus('work', workText, {
  description: 'Work vocabulary',
  lexicon: workWords
});

// Switch context based on user's activity
if (userIsAtWork) {
  predictor.useCorpora(['work', 'default']);
} else if (userIsAtDoctor) {
  predictor.useCorpora(['medical', 'default']);
} else {
  predictor.useAllCorpora();
}

// Manage corpora
const allCorpora = predictor.getCorpora();
const info = predictor.getCorpusInfo('medical');
predictor.removeCorpus('old_vocabulary');
```

> **How Predictions are Merged**: When multiple corpora are active, PPMPredictor gets character predictions from each active corpus, averages the probabilities, and returns the top N predictions sorted by averaged probability.

### Multilingual Support

**New in v0.0.7**: Each corpus can have its own lexicon, enabling true multilingual support!

```javascript
const { createPredictor } = require('@willwade/ppmpredictor');
const { loadFrequencyList } = require('worldalphabets');

// Load frequency lists for different languages
const englishWords = (await loadFrequencyList('en')).tokens.slice(0, 5000);
const frenchWords = (await loadFrequencyList('fr')).tokens.slice(0, 5000);
const spanishWords = (await loadFrequencyList('es')).tokens.slice(0, 5000);

// Create predictor with English as default
const predictor = createPredictor({
  lexicon: englishWords
});

// Add French corpus with French lexicon
const frenchText = fs.readFileSync('data/french_training.txt', 'utf-8');
predictor.addTrainingCorpus('french', frenchText, {
  description: 'French language corpus',
  lexicon: frenchWords  // French-specific vocabulary
});

// Add Spanish corpus with Spanish lexicon
const spanishText = fs.readFileSync('data/spanish_training.txt', 'utf-8');
predictor.addTrainingCorpus('spanish', spanishText, {
  description: 'Spanish language corpus',
  lexicon: spanishWords  // Spanish-specific vocabulary
});

// Switch language based on user's selection
if (currentLanguage === 'french') {
  predictor.useCorpora(['french']);
  // Word completion now uses French lexicon only
} else if (currentLanguage === 'spanish') {
  predictor.useCorpora(['spanish']);
  // Word completion now uses Spanish lexicon only
} else {
  predictor.useCorpora(['default']);
  // Word completion uses English lexicon
}

// Or use multiple languages simultaneously (code-switching)
predictor.useCorpora(['french', 'spanish']);
// Word completion merges both French and Spanish lexicons
```

### Domain-Specific Vocabularies

Different contexts require different vocabularies:

```javascript
const predictor = createPredictor({
  lexicon: generalWords  // General vocabulary
});

// Medical AAC user
const medicalWords = ['acetaminophen', 'ibuprofen', 'diagnosis', 'prescription'];
predictor.addTrainingCorpus('medical', medicalText, {
  description: 'Medical terminology',
  lexicon: medicalWords
});

// Professional user
const workWords = ['meeting', 'deadline', 'project', 'presentation'];
predictor.addTrainingCorpus('work', workText, {
  description: 'Work-related vocabulary',
  lexicon: workWords
});

// Student
const academicWords = ['assignment', 'lecture', 'exam', 'research'];
predictor.addTrainingCorpus('academic', academicText, {
  description: 'Academic vocabulary',
  lexicon: academicWords
});

// Switch context based on user's activity
if (userIsAtWork) {
  predictor.useCorpora(['work', 'default']);
} else if (userIsAtDoctor) {
  predictor.useCorpora(['medical', 'default']);
} else if (userIsAtSchool) {
  predictor.useCorpora(['academic', 'default']);
}
```

## API Reference

### Factory Functions

#### `createPredictor(config)`

Creates a new predictor instance with the given configuration.

**Parameters:**
- `config` (Object, optional): Configuration options
  - `maxOrder` (number): Maximum context length for PPM (default: 5)
  - `errorTolerant` (boolean): Enable error-tolerant mode (default: false)
  - `maxEditDistance` (number): Maximum edit distance for fuzzy matching (default: 2)
  - `minSimilarity` (number): Minimum similarity score 0-1 (default: 0.5)
  - `keyboardAware` (boolean): Use keyboard-aware distance (default: false)
  - `keyboardAdjacencyMap` (Object): Custom keyboard adjacency map
  - `caseSensitive` (boolean): Case-sensitive matching (default: false)
  - `maxPredictions` (number): Maximum predictions to return (default: 10)
  - `adaptive` (boolean): Update model as text is entered (default: false)
  - `lexicon` (Array<string>): Optional word list for word prediction (default: [])

**Returns:** `Predictor` instance

```javascript
const predictor = createPredictor({
  errorTolerant: true,
  maxEditDistance: 2,
  keyboardAware: true,
  adaptive: true,
  lexicon: ['hello', 'world']
});
```

#### `createStrictPredictor(config)`

Creates a predictor with strict mode (exact matching only).

```javascript
const predictor = createStrictPredictor({ lexicon: words });
```

#### `createErrorTolerantPredictor(config)`

Creates a predictor with error-tolerant mode enabled.

```javascript
const predictor = createErrorTolerantPredictor({
  lexicon: words,
  maxEditDistance: 2
});
```

### Predictor Class

#### `train(text)`

Train the default corpus on text. For multi-corpus training, use `addTrainingCorpus()` instead.

**Parameters:**
- `text` (string): Training text

```javascript
predictor.train('The quick brown fox jumps over the lazy dog');
```

#### `addTrainingCorpus(corpusKey, text, options)`

Add a new training corpus with a unique identifier and optional corpus-specific lexicon.

**Parameters:**
- `corpusKey` (string): Unique identifier for this corpus (e.g., 'medical', 'personal', 'french')
- `text` (string): Training text for this corpus
- `options` (object, optional):
  - `description` (string): Human-readable description
  - `enabled` (boolean): Whether corpus should be active (default: true)
  - `lexicon` (string[]): **NEW in v0.0.7** - Optional word list specific to this corpus

```javascript
// Add medical terminology corpus with medical lexicon
predictor.addTrainingCorpus('medical', medicalText, {
  description: 'Medical terminology and phrases',
  lexicon: medicalWords
});

// Add French corpus with French lexicon (multilingual support)
predictor.addTrainingCorpus('french', frenchText, {
  description: 'French language corpus',
  lexicon: frenchWords
});
```

#### `useCorpora(corpusKeys)`

Enable specific training corpora for predictions. Disables all other corpora.

**Parameters:**
- `corpusKeys` (string | string[]): Single corpus key or array of corpus keys

```javascript
// Use only medical corpus
predictor.useCorpora('medical');

// Use medical and personal corpora
predictor.useCorpora(['medical', 'personal']);
```

#### `useAllCorpora()`

Enable all loaded training corpora for predictions.

```javascript
predictor.useAllCorpora();
```

#### `getCorpora(onlyEnabled)`

Get list of available corpus keys.

**Parameters:**
- `onlyEnabled` (boolean, optional): If true, only return enabled corpora

**Returns:** Array of corpus keys (strings)

```javascript
const allCorpora = predictor.getCorpora();
// ['default', 'medical', 'personal']

const activeCorpora = predictor.getCorpora(true);
// ['medical', 'personal']
```

#### `getCorpusInfo(corpusKey)`

Get information about a specific corpus.

**Parameters:**
- `corpusKey` (string): Corpus identifier

**Returns:** Object with corpus information

```javascript
const info = predictor.getCorpusInfo('medical');
// {
//   key: 'medical',
//   description: 'Medical terminology',
//   enabled: true
// }
```

#### `removeCorpus(corpusKey)`

Remove a training corpus. Cannot remove the 'default' corpus.

**Parameters:**
- `corpusKey` (string): Corpus identifier to remove

```javascript
predictor.removeCorpus('old_vocabulary');
```

#### `addToContext(text)`

Add text to the prediction context.

**Parameters:**
- `text` (string): Text to add to context

```javascript
predictor.addToContext('The quick brown');
```

#### `resetContext()`

Reset the prediction context to empty.

```javascript
predictor.resetContext();
```

#### `predictNextCharacter(maxPredictions)`

Predict the next character based on current context.

**Parameters:**
- `maxPredictions` (number, optional): Maximum predictions to return

**Returns:** Array of predictions with `text` and `probability`

```javascript
predictor.addToContext('The qui');
const predictions = predictor.predictNextCharacter();
// [{ text: 'c', probability: 0.85 }, ...]
```

#### `predictWordCompletion(partialWord, precedingContext, maxPredictions)`

Predict word completions based on partial word.

**Parameters:**
- `partialWord` (string): Partial word to complete
- `precedingContext` (string, optional): Context before the word
- `maxPredictions` (number, optional): Maximum predictions to return

**Returns:** Array of predictions with `text` and `probability`

```javascript
const predictions = predictor.predictWordCompletion('hel');
// [{ text: 'hello', probability: 0.45 }, ...]
```

#### `predictNextWord(currentWord, maxPredictions)`

Predict next word based on learned bigram frequencies.

**Parameters:**
- `currentWord` (string): The current/last word typed
- `maxPredictions` (number, optional): Maximum predictions to return (default: 10)

**Returns:** Array of predictions with `text` and `probability`

```javascript
const predictions = predictor.predictNextWord('quick');
// [{ text: 'brown', probability: 1.0 }]
```

#### `exportBigrams()`

Export learned bigrams as text for saving/persistence.

**Returns:** String with bigrams in format "word1 word2 count" (one per line)

```javascript
const bigramText = predictor.exportBigrams();
// "quick brown 5\nbrown fox 5\n..."

// Save to file (Node.js)
fs.writeFileSync('bigrams.txt', bigramText);

// Save to localStorage (browser)
localStorage.setItem('bigrams', bigramText);
```

#### `importBigrams(bigramText)`

Import bigrams from text. Adds to existing bigrams rather than replacing.

**Parameters:**
- `bigramText` (string): Bigrams in text format

```javascript
// Load from file (Node.js)
const bigramText = fs.readFileSync('bigrams.txt', 'utf-8');
predictor.importBigrams(bigramText);

// Load from localStorage (browser)
const saved = localStorage.getItem('bigrams');
if (saved) {
  predictor.importBigrams(saved);
}
```

#### `clearBigrams()`

Clear all learned bigrams.

```javascript
predictor.clearBigrams();
```

#### `getBigramStats()`

Get statistics about learned bigrams.

**Returns:** Object with `uniqueBigrams` and `totalBigrams`

```javascript
const stats = predictor.getBigramStats();
console.log(`Learned ${stats.uniqueBigrams} unique word pairs`);
console.log(`Total occurrences: ${stats.totalBigrams}`);
```

#### `updateConfig(newConfig)`

Update predictor configuration at runtime.

**Parameters:**
- `newConfig` (object): Configuration options to update

```javascript
predictor.updateConfig({
  errorTolerant: true,
  maxEditDistance: 3,
  lexicon: newWordList
});
```

## Configuration Guide

### Strict Mode vs Error-Tolerant Mode

**Strict Mode** (default):
- Exact prefix matching only
- Fast and predictable
- Best for: Clean input, autocomplete

```javascript
const predictor = createStrictPredictor({
  lexicon: words
});
```

**Error-Tolerant Mode**:
- Fuzzy matching with edit distance
- Handles typos and misspellings
- Best for: Noisy input, AAC, accessibility

```javascript
const predictor = createErrorTolerantPredictor({
  lexicon: words,
  maxEditDistance: 2,
  minSimilarity: 0.6
});
```

### Tolerance Levels

Adjust tolerance based on your use case:

```javascript
// Strict - only minor typos
const strict = createPredictor({
  errorTolerant: true,
  maxEditDistance: 1,
  minSimilarity: 0.8
});

// Moderate - common typos (recommended)
const moderate = createPredictor({
  errorTolerant: true,
  maxEditDistance: 2,
  minSimilarity: 0.6
});

// Lenient - significant errors
const lenient = createPredictor({
  errorTolerant: true,
  maxEditDistance: 3,
  minSimilarity: 0.4
});
```

### Keyboard-Aware Mode

Enable for better handling of keyboard proximity errors:

```javascript
const predictor = createErrorTolerantPredictor({
  keyboardAware: true,  // 'h' and 'j' are adjacent, lower cost
  keyboardAdjacencyMap: {  // Optional: override QWERTY layout
    a: ['q', 's', 'z'],
    b: ['v', 'g', 'h', 'n'],
    // ... define adjacency for all keys
  }
});
```

**Benefits:**
- "helo" → "hello" scores better than "helo" → "jello" (even though both are 1 edit)
- Physical proximity matters: 'h' and 'j' are adjacent, so lower error cost

### Adaptive Mode

Let the model learn from user input in real-time:

```javascript
const predictor = createPredictor({
  adaptive: true  // Model updates as user types
});

// As user types, the model learns their patterns
predictor.addToContext('hello world');
// Model now knows "hello" is often followed by "world"
```

**Use cases:**
- Personalized prediction
- Learning user's writing style
- Adapting to domain-specific vocabulary

## Examples

The library includes several examples:

### Run Examples

```bash
# Basic character prediction
npm run example:basic

# Error-tolerant prediction with typos
npm run example:error-tolerant

# Word completion with lexicon
npm run example:word-completion

# Training from files
npm run example:train-from-file

# Bigram tracking
npm run example:bigram-tracking
```

### Example Files

- `examples/basic-prediction.js` - Character prediction basics
- `examples/error-tolerant.js` - Handling typos and noisy input
- `examples/word-completion.js` - Word completion with lexicon
- `examples/train-from-file.js` - Loading training data from files
- `examples/bigram-tracking.js` - Next-word prediction with bigrams

## Use Cases

### AAC (Augmentative and Alternative Communication)

Perfect for users with motor impairments who may have difficulty with precise typing:

```javascript
const { createErrorTolerantPredictor } = require('@willwade/ppmpredictor');

const predictor = createErrorTolerantPredictor({
  lexicon: aacVocabulary,
  keyboardAware: true,      // Handle proximity errors
  maxEditDistance: 2,       // Allow typos
  adaptive: true,           // Learn user's patterns
  maxPredictions: 5         // Show top 5 suggestions
});

// Train on user's common phrases
predictor.train('I want to go to the park. I need help. Thank you.');

// Predict with error tolerance
const predictions = predictor.predictWordCompletion('hlp');
// Returns: [{ text: 'help', probability: 0.85 }, ...]
```

### Text Input Enhancement

Improve any text input with intelligent prediction:

```javascript
const predictor = createPredictor({
  adaptive: true,
  maxPredictions: 5
});

// Train on user's writing style
predictor.train(userHistoricalText);

// Provide real-time predictions
inputField.addEventListener('input', (e) => {
  const text = e.target.value;
  predictor.addToContext(text);

  // Character prediction
  const charPredictions = predictor.predictNextCharacter();

  // Word completion
  const lastWord = text.split(/\s+/).pop();
  const wordPredictions = predictor.predictWordCompletion(lastWord);

  showSuggestions(charPredictions, wordPredictions);
});
```

### Multilingual Communication

Support users who communicate in multiple languages:

```javascript
const { loadFrequencyList } = require('worldalphabets');

const englishWords = (await loadFrequencyList('en')).tokens.slice(0, 5000);
const spanishWords = (await loadFrequencyList('es')).tokens.slice(0, 5000);

const predictor = createPredictor({ lexicon: englishWords });

predictor.addTrainingCorpus('spanish', spanishText, {
  lexicon: spanishWords
});

// User can switch languages
languageSelector.addEventListener('change', (e) => {
  predictor.useCorpora([e.target.value]);
});
```

### Medical/Professional Terminology

Domain-specific vocabulary for specialized users:

```javascript
const medicalWords = [
  'acetaminophen', 'ibuprofen', 'prescription',
  'diagnosis', 'symptoms', 'treatment'
];

const predictor = createPredictor({
  lexicon: generalWords
});

predictor.addTrainingCorpus('medical', medicalText, {
  description: 'Medical terminology',
  lexicon: medicalWords
});

// At doctor's office
predictor.useCorpora(['medical', 'default']);
```

## Performance Considerations

- **Memory**: PPM model size grows with training data
  - ~1-5 MB for typical AAC vocabulary
  - Scales linearly with training text size
- **Speed**: Character prediction is very fast (< 1ms)
- **Training**: One-time cost, can be done at initialization
- **Lexicon**: Larger lexicons increase word completion time
  - 1,000 words: < 5ms
  - 10,000 words: < 20ms
  - 50,000 words: < 100ms

### Optimization Tips

1. **Limit lexicon size** to relevant words (5,000-10,000 is usually sufficient)
2. **Use appropriate maxOrder** (5 is usually sufficient, higher = more memory)
3. **Train once** at initialization, not per-prediction
4. **Cache predictions** for repeated queries
5. **Use corpora** to separate vocabularies instead of one huge lexicon

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

All 46 tests passing! ✓

## License

Apache License 2.0 - see [LICENSE](../LICENSE) file for details.

## Credits

- **PPM Implementation**: Based on Google Research's JavaScript PPM implementation
- **Original Research**: Cleary & Witten (1984), Dasher project (Cambridge)
- **WorldAlphabets Integration**: Frequency lists and keyboard layouts for 100+ languages
- **Author**: Will Wade

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

### Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run demo locally
npm run dev
```

## Links

- [GitHub Repository](https://github.com/willwade/ppmpredictor)
- [Issue Tracker](https://github.com/willwade/ppmpredictor/issues)
- [NPM Package](https://www.npmjs.com/package/@willwade/ppmpredictor)
- [Live Demo](https://willwade.github.io/ppmpredictor/demo.html)

## Related Projects

- [Predictionary](https://github.com/asterics/predictionary) - Dictionary-based prediction library from the Asterics project. Just note ours does character level prediction and with fuzzy matching around keyboard layouts.
- [Google JSLM](https://github.com/google-research/google-research/tree/master/jslm) - Original JS language model code by Google team
- [pylm](https://github.com/willwade/pylm) - Python PPM implementation
- [Dasher](http://www.inference.org.uk/dasher/) - Original AAC application using PPM
- [WorldAlphabets](https://github.com/willwade/WorldAlphabets) - Frequency lists and keyboard layouts for 100+ languages


