# Training Data

This directory contains sample training data and lexicons for the PPM Predictor library.

## Files

### Training Texts

- **sample_training_text.txt** (764 bytes)
  - General English text for training the PPM model
  - Good for basic character prediction

- **sample_conversation.txt** (882 bytes)
  - Conversational text with common phrases
  - Good for AAC (Augmentative and Alternative Communication) applications

### Lexicons

- **aac_lexicon_en_gb.txt** (22KB, ~2,180 words)
  - AAC-focused vocabulary (British English)
  - Common words used in assistive communication
  - Includes: greetings, requests, emotions, daily activities

- **wordlist.txt** (2KB, ~200 words)
  - General English word list
  - Good for basic word completion

- **comprehensive_lexicon.txt** (30KB, ~3,000 words)
  - Larger vocabulary for more comprehensive predictions
  - Includes common English words

## Usage

### Training from File

```javascript
const fs = require('fs');
const { createPredictor } = require('@willwade/ppmpredictor');

// Load training text
const trainingText = fs.readFileSync('./data/sample_training_text.txt', 'utf-8');

// Create and train predictor
const predictor = createPredictor();
predictor.train(trainingText);
```

### Loading Lexicon

```javascript
const fs = require('fs');
const { createPredictor } = require('@willwade/ppmpredictor');

// Load lexicon
const lexiconText = fs.readFileSync('./data/aac_lexicon_en_gb.txt', 'utf-8');
const lexicon = lexiconText.split('\n').filter(word => word.trim().length > 0);

// Create predictor with lexicon
const predictor = createPredictor({ lexicon });
```

### Combined Training + Lexicon

```javascript
const fs = require('fs');
const { createPredictor } = require('@willwade/ppmpredictor');

// Load both
const trainingText = fs.readFileSync('./data/sample_conversation.txt', 'utf-8');
const lexiconText = fs.readFileSync('./data/aac_lexicon_en_gb.txt', 'utf-8');
const lexicon = lexiconText.split('\n').filter(word => word.trim().length > 0);

// Create predictor with both
const predictor = createPredictor({ lexicon });
predictor.train(trainingText);

// Now you have both character-level predictions and word completion
```

## Using Your Own Data

You can use your own training data and lexicons:

### Custom Training Text

```javascript
const myTrainingText = fs.readFileSync('./my-training-data.txt', 'utf-8');
predictor.train(myTrainingText);
```

### Custom Lexicon

```javascript
// From file (one word per line)
const myLexicon = fs.readFileSync('./my-words.txt', 'utf-8')
  .split('\n')
  .map(word => word.trim())
  .filter(word => word.length > 0);

// Or from array
const myLexicon = ['apple', 'banana', 'cherry', 'date'];

const predictor = createPredictor({ lexicon: myLexicon });
```

## Tips

1. **More training data = better predictions**
   - The PPM model learns patterns from training text
   - Larger training sets improve character prediction accuracy

2. **Lexicon size vs. performance**
   - Larger lexicons provide more word completion options
   - But may slow down predictions slightly
   - For AAC applications, 1,000-5,000 words is usually optimal

3. **Domain-specific training**
   - Train on text similar to your use case
   - For AAC: use conversational text
   - For coding: use source code
   - For medical: use medical texts

4. **Combining approaches**
   - Use training text for character-level predictions
   - Use lexicon for word completion
   - Together they provide the best results

## File Formats

### Training Text
- Plain text files (UTF-8)
- Any natural language text
- Larger files = better training

### Lexicon Files
- One word per line
- Plain text (UTF-8)
- Can include:
  - Single words: `hello`
  - Phrases: `thank you`
  - Contractions: `don't`

Example lexicon file:
```
hello
help
world
thank
thanks
please
```

## License

These sample files are provided for demonstration purposes.
The AAC lexicon is derived from common AAC vocabulary lists.

