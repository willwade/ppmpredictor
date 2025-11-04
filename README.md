# PPM Predictor

A  Node.js library for word and letter prediction with configurable error tolerance, built on PPM (Prediction by Partial Matching) language modeling. Original PPM JS code by Google.. 

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node Version](https://img.shields.io/badge/node-%3E%3D12.0.0-brightgreen.svg)](https://nodejs.org)

## Features

- 🎯 **Character-level prediction** using PPM language model
- 📝 **Word completion** with lexicon support
- 🔧 **Error-tolerant mode** for handling typos and noisy input
- ⌨️ **Keyboard-aware matching** for proximity-based error correction
- 🔄 **Adaptive learning** that updates as users type
- 🎛️ **Configurable tolerance levels** for different use cases
- 🚀 **Zero dependencies** - pure JavaScript implementation
- ♿ **AAC-focused** - designed for assistive technology applications

## Installation

```bash
npm install @willwade/ppmpredictor
```

### Platform Support

- **Node.js**: ✅ Fully supported (v12+)
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

Train the model on text.

**Parameters:**
- `text` (string): Training text

```javascript
predictor.train('The quick brown fox jumps over the lazy dog');
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

The library includes comprehensive examples:

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

Perfect for assistive technology applications where users may have:
- Motor impairments leading to typos
- Switch access with limited precision
- Eye-gaze input with dwell-time errors
- On-screen keyboard usage

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

Build a spell checker with context awareness:

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
  keyboardAware: true  // 'h' and 'j' are adjacent, lower cost
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

- [Google JSLM](https://github.com/google-research/google-research/tree/master/jslm) - Original JS LM code by Google team
- [pylm](https://github.com/willwade/pylm) - Python PPM implementation
- [Dasher](http://www.inference.org.uk/dasher/) - Original AAC application using PPM

