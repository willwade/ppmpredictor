# PPM Predictor

A  Node.js library for word and letter prediction with configurable error tolerance, built on PPM (Prediction by Partial Matching) language modeling. Original PPM JS code by Google.. 

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node Version](https://img.shields.io/badge/node-%3E%3D12.0.0-brightgreen.svg)](https://nodejs.org)

## 🎮 Live Demo

**[Try the Interactive Demo](https://willwade.github.io/ppmpredictor/demo.html)** - Full-featured demo with WorldAlphabets integration
- 24+ languages with real training data
- Adaptive learning with word management
- Keyboard layout selection and visualization
- Fuzzy matching and keyboard-aware typos
- Real-time statistics

## Features (aka emoji filled box that is all the rage..)

- 🎯 **Character-level prediction** using PPM language model
- 📝 **Word completion** with lexicon support
- 🔧 **Error-tolerant mode** for handling typos and noisy input
- ⌨️ **Keyboard-aware matching** for proximity-based error correction
- 🔄 **Adaptive learning** that updates as users type
- 🎛️ **Configurable tolerance levels** for different use cases
- 🚀 **Zero dependencies** - pure JavaScript implementation
- ♿ **AAC-focused** - designed for assistive technology applications
- 🌍 **Multi-language support** - works with WorldAlphabets for 100+ languages

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

### Basic Character Prediction

```javascript
const { createPredictor } = require('@willwade/ppmpredictor');

// Create a predictor
const predictor = createPredictor();

// Train on some text
predictor.train('The quick brown fox jumps over the lazy dog');

// Add context and predict next character
predictor.addToContext('The qui');
const predictions = predictor.predictNextCharacter();

console.log(predictions);
// [
//   { text: 'c', probability: 0.85 },
//   { text: 'e', probability: 0.10 },
//   ...
// ]
```

### Word Completion

```javascript
const { createPredictor } = require('@willwade/noisy-channel-predictor');

const predictor = createPredictor({
  lexicon: ['hello', 'help', 'hero', 'world', 'word']
});

const completions = predictor.predictWordCompletion('hel');

console.log(completions);
// [
//   { text: 'hello', probability: 0.45 },
//   { text: 'help', probability: 0.35 },
//   { text: 'hero', probability: 0.20 }
// ]
```

### Error-Tolerant Prediction

```javascript
const { createErrorTolerantPredictor } = require('@willwade/noisy-channel-predictor');

const predictor = createErrorTolerantPredictor({
  lexicon: ['hello', 'help', 'world'],
  maxEditDistance: 2
});

// Works even with typos!
const predictions = predictor.predictWordCompletion('helo'); // Missing 'l'

console.log(predictions);
// [
//   { text: 'hello', probability: 0.85 },
//   { text: 'help', probability: 0.15 }
// ]
```

## Training from Files

Load training data and lexicons from text files:

```javascript
const fs = require('fs');
const { createPredictor } = require('@willwade/noisy-channel-predictor');

// Load training text
const trainingText = fs.readFileSync('training.txt', 'utf-8');

// Load lexicon (one word per line)
const lexicon = fs.readFileSync('lexicon.txt', 'utf-8')
  .split('\n')
  .filter(word => word.trim());

// Create and train predictor
const predictor = createPredictor({ lexicon });
predictor.train(trainingText);
```

**Available training files** (in parent project's `data/` directory):
- `sample_training_text.txt` - General text for training
- `sample_conversation.txt` - AAC conversation examples
- `aac_lexicon_en_gb.txt` - AAC vocabulary (2,180 words)
- `comprehensive_lexicon.txt` - Large word list
- `wordlist.txt` - General word list

See [examples/train-from-file.js](examples/train-from-file.js) for complete examples.

## Multiple Training Corpora

**New in v1.1.0**: Train and manage multiple domain-specific corpora for context-aware predictions.

### Why Multiple Corpora?

Different contexts require different vocabularies and language patterns:
- **Medical AAC user**: General conversation + medical terminology
- **Multilingual user**: Different languages in separate corpora
- **Professional**: Work vocabulary + personal vocabulary
- **Student**: Academic subjects + casual communication

### Basic Usage

```javascript
const { createPredictor } = require('@willwade/ppmpredictor');

// Create predictor
const predictor = createPredictor();

// Add domain-specific training corpora
predictor.addTrainingCorpus('medical', medicalText, {
  description: 'Medical terminology and phrases'
});

predictor.addTrainingCorpus('personal', personalDiaryText, {
  description: 'User\'s personal vocabulary'
});

// Use specific corpora for predictions
predictor.useCorpora(['medical', 'personal']);

// Get predictions (merged from both corpora)
const predictions = predictor.predictNextCharacter();
```

### Node.js Example

```javascript
const fs = require('fs');
const { createPredictor } = require('@willwade/ppmpredictor');

const predictor = createPredictor();

// Load and add medical corpus
const medicalText = fs.readFileSync('data/medical_terms.txt', 'utf-8');
predictor.addTrainingCorpus('medical', medicalText, {
  description: 'Medical terminology'
});

// Load and add work corpus
const workText = fs.readFileSync('data/work_emails.txt', 'utf-8');
predictor.addTrainingCorpus('work', workText, {
  description: 'Work-related vocabulary'
});

// Switch context based on user's activity
if (userIsAtWork) {
  predictor.useCorpora(['work', 'default']);
} else if (userIsAtDoctor) {
  predictor.useCorpora(['medical', 'default']);
} else {
  predictor.useAllCorpora(); // Use all available corpora
}
```

### Browser Example

```javascript
import { createPredictor } from '@willwade/ppmpredictor';

const predictor = createPredictor();

// Fetch and add training corpora
async function loadCorpora() {
  // Load medical corpus
  const medicalResponse = await fetch('data/medical.txt');
  const medicalText = await medicalResponse.text();
  predictor.addTrainingCorpus('medical', medicalText);

  // Load personal corpus
  const personalResponse = await fetch('data/personal.txt');
  const personalText = await personalResponse.text();
  predictor.addTrainingCorpus('personal', personalText);

  // Use both corpora
  predictor.useCorpora(['medical', 'personal']);
}

loadCorpora();
```

### Managing Corpora

```javascript
// List all corpora
const allCorpora = predictor.getCorpora();
console.log(allCorpora); // ['default', 'medical', 'personal']

// List only active corpora
const activeCorpora = predictor.getCorpora(true);
console.log(activeCorpora); // ['medical', 'personal']

// Get corpus information
const info = predictor.getCorpusInfo('medical');
console.log(info);
// {
//   key: 'medical',
//   description: 'Medical terminology',
//   enabled: true
// }

// Remove a corpus
predictor.removeCorpus('old_vocabulary');

// Use all corpora
predictor.useAllCorpora();
```

### How Predictions are Merged

When multiple corpora are active, PPMPredictor:
1. Gets character predictions from each active corpus
2. Averages the probabilities across all corpora
3. Returns the top N predictions sorted by averaged probability

This ensures that predictions reflect patterns from all relevant contexts.

## Bigram Tracking for Next-Word Prediction

In addition to character-level PPM predictions, PPMPredictor tracks **bigrams** (word pairs) to provide next-word suggestions. This complements the character-level model with word-level patterns.

### What are Bigrams?

Bigrams are consecutive word pairs learned from training text. For example, from the text "The quick brown fox", the bigrams are:
- "the quick"
- "quick brown"
- "brown fox"

When you type "quick", the predictor can suggest "brown" as the next word based on learned bigram frequencies.

### How Bigram Tracking Works

1. **Automatic Learning**: Bigrams are automatically learned when you call `train()` or `addTrainingCorpus()`
2. **Frequency Tracking**: Each bigram's frequency is tracked across all training
3. **Probability Calculation**: Predictions are based on relative frequencies

### Basic Usage

```javascript
const { createPredictor } = require('@willwade/ppmpredictor');

const predictor = createPredictor();

// Train on text - automatically learns bigrams
predictor.train('The quick brown fox jumps over the lazy dog');

// Get next-word predictions
const predictions = predictor.predictNextWord('quick');
console.log(predictions);
// [{ text: 'brown', probability: 1.0 }]
```

### Multiple Training Examples

When the same word appears in different contexts, probabilities reflect the frequencies:

```javascript
predictor.train('hello world');
predictor.train('hello there');
predictor.train('hello friend');
predictor.train('hello world'); // "world" appears twice

const predictions = predictor.predictNextWord('hello');
console.log(predictions);
// [
//   { text: 'world', probability: 0.5 },   // 2 out of 4
//   { text: 'there', probability: 0.25 },  // 1 out of 4
//   { text: 'friend', probability: 0.25 }  // 1 out of 4
// ]
```

### Export and Import Bigrams

You can save and restore learned bigrams:

```javascript
// Export bigrams to text
const bigramText = predictor.exportBigrams();
// Returns: "quick brown 1\nbrown fox 1\nhello world 2\n..."

// Save to file (Node.js)
const fs = require('fs');
fs.writeFileSync('learned-bigrams.txt', bigramText);

// Later: import bigrams
const savedBigrams = fs.readFileSync('learned-bigrams.txt', 'utf-8');
predictor.importBigrams(savedBigrams);
```

### Browser Usage

```javascript
// Export bigrams
const bigramText = predictor.exportBigrams();

// Save to localStorage
localStorage.setItem('myBigrams', bigramText);

// Later: restore
const savedBigrams = localStorage.getItem('myBigrams');
if (savedBigrams) {
  predictor.importBigrams(savedBigrams);
}
```

### Bigram Statistics

Get information about learned bigrams:

```javascript
const stats = predictor.getBigramStats();
console.log(`Learned ${stats.uniqueBigrams} unique word pairs`);
console.log(`Total bigram occurrences: ${stats.totalBigrams}`);
```

### Clear Bigrams

Reset bigram tracking:

```javascript
predictor.clearBigrams();
```

### Use Cases

Bigram tracking is particularly useful for:

- **AAC (Augmentative and Alternative Communication)**: Predict common phrases and word combinations
- **Text Entry**: Speed up typing by suggesting likely next words
- **Language Learning**: Learn common word collocations from training text
- **Domain-Specific Text**: Capture technical terminology and phrase patterns

### Combining with Character-Level Predictions

PPMPredictor provides both:
- **Character-level predictions** via `predictNextCharacter()` - great for typo correction and new words
- **Word-level predictions** via `predictNextWord()` - great for phrase completion

You can use both together for a comprehensive prediction system:

```javascript
// Character-level: predict next character
predictor.addToContext('The qui');
const charPreds = predictor.predictNextCharacter();
// [{ text: 'c', probability: 0.85 }, ...]

// Word-level: predict next word
const wordPreds = predictor.predictNextWord('quick');
// [{ text: 'brown', probability: 1.0 }]
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
- `keyboardAdjacencyMap` (Object): Override the default QWERTY neighbours for keyboard-aware mode
- `caseSensitive` (boolean): Case-sensitive matching (default: false)
  - `maxPredictions` (number): Maximum predictions to return (default: 10)
  - `adaptive` (boolean): Update model as text is entered (default: false)
  - `lexicon` (Array<string>): Optional word list for word prediction (default: [])

**Returns:** `Predictor` instance

#### `createStrictPredictor(config)`

Creates a predictor with strict mode (exact matching only).

#### `createErrorTolerantPredictor(config)`

Creates a predictor with error-tolerant mode enabled.

### Predictor Class

#### `train(text)`

Train the default corpus on text. For multi-corpus training, use `addTrainingCorpus()` instead.

**Parameters:**
- `text` (string): Training text

```javascript
predictor.train('The quick brown fox jumps over the lazy dog');
```

#### `addTrainingCorpus(corpusKey, text, options)`

Add a new training corpus with a unique identifier.

**Parameters:**
- `corpusKey` (string): Unique identifier for this corpus (e.g., 'medical', 'personal')
- `text` (string): Training text for this corpus
- `options` (object, optional):
  - `description` (string): Human-readable description
  - `enabled` (boolean): Whether corpus should be active (default: true)

```javascript
// Add medical terminology corpus
predictor.addTrainingCorpus('medical', medicalText, {
  description: 'Medical terminology and phrases'
});

// Add personal vocabulary
predictor.addTrainingCorpus('personal', personalText, {
  description: 'User\'s personal vocabulary'
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

#### `predictNextWord(currentWord, maxPredictions)`

Predict next word based on learned bigram frequencies.

**Parameters:**
- `currentWord` (string): The current/last word typed
- `maxPredictions` (number, optional): Maximum predictions to return (default: 10)

**Returns:** Array of predictions with `text` and `probability`

```javascript
const predictions = predictor.predictNextWord('quick');
// [{ text: 'brown', probability: 1.0 }]

const predictions = predictor.predictNextWord('hello', 5);
// Returns top 5 next-word predictions
```

#### `exportBigrams()`

Export learned bigrams as text for saving/persistence.

**Returns:** String with bigrams in format "word1 word2 count" (one per line)

```javascript
const bigramText = predictor.exportBigrams();
// "quick brown 5\nbrown fox 5\nhello world 3\n..."

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

#### `resetContext()`

Reset the prediction context to empty.

```javascript
predictor.resetContext();
```

#### `addToContext(text, update)`

Add text to the current context.

**Parameters:**
- `text` (string): Text to add to context
- `update` (boolean, optional): Whether to update the model (defaults to `config.adaptive`)

```javascript
predictor.addToContext('Hello ');
predictor.addToContext('world', true); // Update model
```

### Live Adaptive Training

Enable adaptive mode to let the model learn from confirmed user input in real time:

```javascript
const predictor = createPredictor({ adaptive: true });

function onUserAccepted(text) {
  // Include a delimiter so the model learns word boundaries.
  predictor.addToContext(text + ' ');
}
```

Only commit text after the user finalises it (e.g. presses space/enter or taps a suggestion) so the model does not memorise transient typos.

To persist the incremental learning, store the accepted text and replay it on startup:

```javascript
const replayBuffer = loadFromStorage(); // e.g. localStorage, IndexedDB, server

if (replayBuffer) {
  predictor.train(replayBuffer);
}
```

If you manage a custom lexicon alongside adaptive training, update both together:

```javascript
myLexicon.push('newword');
predictor.updateConfig({ lexicon: myLexicon });
```

This gives you live self-learning without needing a full retrain cycle.

#### `predictNextCharacter(context)`

Get character/letter predictions.

**Parameters:**
- `context` (string, optional): Context string (uses current context if not provided)

**Returns:** Array of `{ text: string, probability: number }`

```javascript
const predictions = predictor.predictNextCharacter('The qui');
```

#### `predictWordCompletion(partialWord, precedingContext)`

Get word completion predictions.

**Parameters:**
- `partialWord` (string): Partial word to complete
- `precedingContext` (string, optional): Preceding context

**Returns:** Array of `{ text: string, probability: number }`

```javascript
const completions = predictor.predictWordCompletion('hel', 'I need some ');
```

#### `updateConfig(newConfig)`

Update configuration at runtime.

**Parameters:**
- `newConfig` (Object): Configuration updates

```javascript
predictor.updateConfig({
  errorTolerant: true,
  maxEditDistance: 3
});
```

#### `getConfig()`

Get current configuration.

**Returns:** Configuration object

### Utility Functions

#### `levenshteinDistance(str1, str2)`

Calculate edit distance between two strings.

```javascript
const { levenshteinDistance } = require('@willwade/noisy-channel-predictor');

const distance = levenshteinDistance('hello', 'helo');
console.log(distance); // 1
```

#### `similarityScore(str1, str2)`

Calculate similarity score (0-1) between two strings.

```javascript
const { similarityScore } = require('@willwade/noisy-channel-predictor');

const score = similarityScore('hello', 'helo');
console.log(score); // 0.8
```

## Examples

The library includes some examples:

### Run Examples

```bash
# Basic character prediction
npm run example:basic

# Error-tolerant prediction with typos
npm run example:error-tolerant

# Word completion with lexicon
npm run example:word-completion
```

### Example Files

- `examples/basic-prediction.js` - Character prediction basics
- `examples/error-tolerant.js` - Handling typos and noisy input
- `examples/word-completion.js` - Word completion with lexicon

## Use Cases

### AAC (Augmentative and Alternative Communication)

eg

```javascript
const predictor = createErrorTolerantPredictor({
  lexicon: aacVocabulary,
  keyboardAware: true,
  maxEditDistance: 2,
  adaptive: true
});
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
inputField.on('input', (text) => {
  const predictions = predictor.predictNextCharacter(text);
  showSuggestions(predictions);
});
```

### Spell Correction

Build a spell checker with context awareness (NB: Not really great at this):

```javascript
const corrector = createErrorTolerantPredictor({
  lexicon: dictionary,
  maxEditDistance: 2,
  minSimilarity: 0.6
});

function correctWord(word, context) {
  const suggestions = corrector.predictWordCompletion(word, context);
  return suggestions[0]?.text || word;
}
```

## Configuration Guide

### Strict Mode vs Error-Tolerant Mode

**Strict Mode** (default):
- Exact prefix matching only
- Fast and predictable
- Best for: Clean input, autocomplete

**Error-Tolerant Mode**:
- Fuzzy matching with edit distance
- Handles typos and misspellings
- Best for: Noisy input, AAC, accessibility

### Tolerance Levels

Adjust tolerance based on your use case:

```javascript
// Strict - only minor typos
{ maxEditDistance: 1, minSimilarity: 0.8 }

// Moderate - common typos
{ maxEditDistance: 2, minSimilarity: 0.6 }

// Lenient - significant errors
{ maxEditDistance: 3, minSimilarity: 0.4 }
```

### Keyboard-Aware Mode

Enable for better handling of keyboard proximity errors:

```javascript
const predictor = createErrorTolerantPredictor({
  keyboardAware: true,  // 'h' and 'j' are adjacent, lower cost
  keyboardAdjacencyMap: {  // Optional: override QWERTY layout
    a: ['b'],
    b: ['a']
  }
});
```

### Adaptive Mode

Let the model learn from user input:

```javascript
const predictor = createPredictor({
  adaptive: true  // Model updates as user types
});
```

## Performance Considerations

- **Memory**: PPM model size grows with training data
- **Speed**: Character prediction is very fast (< 1ms)
- **Training**: One-time cost, can be done at initialization
- **Lexicon**: Larger lexicons increase word completion time

### Optimization Tips

1. **Limit lexicon size** to relevant words
2. **Use appropriate maxOrder** (5 is usually sufficient)
3. **Train once** at initialization, not per-prediction
4. **Cache predictions** for repeated queries

## Advanced Usage

### Custom Vocabulary

```javascript
const { Predictor, Vocabulary } = require('@willwade/noisy-channel-predictor');

const vocab = new Vocabulary();
// Add custom symbols
vocab.addSymbol('😊');
vocab.addSymbol('👍');

// Use with predictor...
```

### Direct PPM Access

```javascript
const { PPMLanguageModel, Vocabulary } = require('@willwade/noisy-channel-predictor');

const vocab = new Vocabulary();
const model = new PPMLanguageModel(vocab, 5);

// Low-level PPM operations...
```

## Testing

```bash
npm test
```

## License

Apache License 2.0 - see [LICENSE](../LICENSE) file for details.

## Credits

- **PPM Implementation**: Based on Google Research's JavaScript PPM implementation
- **Original Research**: Cleary & Witten (1984), Dasher project (Cambridge)
- **Author**: Will Wade

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Links

- [GitHub Repository](https://github.com/willwade/noisy-channel-correction)
- [Issue Tracker](https://github.com/willwade/noisy-channel-correction/issues)
- [NPM Package](https://www.npmjs.com/package/@willwade/noisy-channel-predictor)

## Related Projects

- [Predictionary](https://github.com/asterics/predictionary) - Dictionary-based prediction library. Really neat from the Asterics project. Just note ours does character level PPM modeling and also we can do things like keyboard-aware fuzzy matching.
- [Google JSLM](https://github.com/google-research/google-research/tree/master/jslm) - Original JS LM code by Google team
- [pylm](https://github.com/willwade/pylm) - Python PPM implementation
- [Dasher](http://www.inference.org.uk/dasher/) - Original AAC application using PPM
