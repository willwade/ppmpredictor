// Copyright 2025 Will Wade
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Example of training predictor from text files.
 *
 * Demonstrates how to load training data and lexicons from files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPredictor, createErrorTolerantPredictor } from '../src/index.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(60));
console.log('Training from Files Example');
console.log('='.repeat(60));
console.log();

// Example 1: Load and train from a text file
console.log('1. Training from Text File');
console.log('-'.repeat(60));

// Path to training data
const trainingFilePath = path.join(__dirname, '../data/sample_training_text.txt');

if (fs.existsSync(trainingFilePath)) {
  console.log(`Loading training data from: ${trainingFilePath}`);

  // Read the training text
  const trainingText = fs.readFileSync(trainingFilePath, 'utf-8');
  console.log(`Loaded ${trainingText.length} characters`);
  console.log(`First 100 chars: "${trainingText.substring(0, 100)}..."`);
  console.log();

  // Create predictor and train
  const predictor = createPredictor({
    maxOrder: 5,
    maxPredictions: 5
  });

  console.log('Training model...');
  predictor.train(trainingText);
  console.log('Training complete!');
  console.log();

  // Test predictions
  console.log('Testing predictions:');
  const testContexts = ['I ', 'The ', 'you '];

  testContexts.forEach(context => {
    predictor.resetContext();
    predictor.addToContext(context);
    const predictions = predictor.predictNextCharacter();

    console.log(`  After "${context}": ${predictions.slice(0, 3).map(p => `"${p.text}"`).join(', ')}`);
  });
  console.log();
} else {
  console.log(`Training file not found: ${trainingFilePath}`);
  console.log('Using inline training data instead...');
  console.log();
}

// Example 2: Load lexicon from file
console.log('2. Loading Lexicon from File');
console.log('-'.repeat(60));

const lexiconPath = path.join(__dirname, '../data/aac_lexicon_en_gb.txt');

if (fs.existsSync(lexiconPath)) {
  console.log(`Loading lexicon from: ${lexiconPath}`);

  // Read lexicon (one word per line)
  const lexiconText = fs.readFileSync(lexiconPath, 'utf-8');
  const lexicon = lexiconText
    .split('\n')
    .map(line => line.trim())
    .filter(word => word.length > 0);

  console.log(`Loaded ${lexicon.length} words`);
  console.log(`Sample words: ${lexicon.slice(0, 10).join(', ')}`);
  console.log();

  // Create predictor with lexicon
  const predictor = createErrorTolerantPredictor({
    lexicon: lexicon,
    maxEditDistance: 2,
    maxPredictions: 5
  });

  // Test word completion
  console.log('Testing word completion:');
  const testWords = ['hel', 'tha', 'ple'];

  testWords.forEach(partial => {
    const completions = predictor.predictWordCompletion(partial);
    if (completions.length > 0) {
      console.log(`  "${partial}" → ${completions.slice(0, 3).map(c => c.text).join(', ')}`);
    } else {
      console.log(`  "${partial}" → (no matches)`);
    }
  });
  console.log();
} else {
  console.log(`Lexicon file not found: ${lexiconPath}`);
  console.log();
}

// Example 3: Combined training and lexicon
console.log('3. Combined Training + Lexicon');
console.log('-'.repeat(60));

const conversationPath = path.join(__dirname, '../data/sample_conversation.txt');

if (fs.existsSync(conversationPath) && fs.existsSync(lexiconPath)) {
  console.log('Loading both training data and lexicon...');

  // Load training text
  const trainingText = fs.readFileSync(conversationPath, 'utf-8');

  // Load lexicon
  const lexiconText = fs.readFileSync(lexiconPath, 'utf-8');
  const lexicon = lexiconText
    .split('\n')
    .map(line => line.trim())
    .filter(word => word.length > 0);

  console.log(`Training text: ${trainingText.length} characters`);
  console.log(`Lexicon: ${lexicon.length} words`);
  console.log();

  // Create predictor with both
  const predictor = createErrorTolerantPredictor({
    lexicon: lexicon,
    maxEditDistance: 2,
    maxPredictions: 5,
    adaptive: false
  });

  // Train on conversation data
  console.log('Training on conversation data...');
  predictor.train(trainingText);
  console.log('Training complete!');
  console.log();

  // Test with context-aware word completion
  console.log('Testing context-aware predictions:');

  const testCases = [
    { context: 'I want to ', partial: 'ea' },
    { context: 'thank ', partial: 'yo' },
    { context: 'I need ', partial: 'hel' }
  ];

  testCases.forEach(test => {
    const completions = predictor.predictWordCompletion(test.partial, test.context);
    if (completions.length > 0) {
      console.log(`  "${test.context}${test.partial}" → ${completions.slice(0, 3).map(c => c.text).join(', ')}`);
    }
  });
  console.log();
}

// Example 4: Custom training data
console.log('4. Using Custom Training Data');
console.log('-'.repeat(60));

// You can also provide your own training data
const customTraining = `
Hello, how are you today?
I am doing well, thank you.
Would you like some help?
Yes, please help me.
Thank you very much.
You are welcome.
`;

const customLexicon = [
  'hello', 'help', 'thank', 'thanks', 'please', 'welcome',
  'yes', 'no', 'good', 'well', 'today', 'would', 'like', 'some'
];

console.log('Creating predictor with custom data...');

const customPredictor = createErrorTolerantPredictor({
  lexicon: customLexicon,
  maxEditDistance: 2,
  adaptive: true
});

customPredictor.train(customTraining);

console.log('Testing with custom-trained model:');

const customTests = ['hel', 'tha', 'wel'];
customTests.forEach(partial => {
  const completions = customPredictor.predictWordCompletion(partial);
  if (completions.length > 0) {
    console.log(`  "${partial}" → ${completions.slice(0, 3).map(c => c.text).join(', ')}`);
  }
});
console.log();

// Example 5: Saving and loading training state (conceptual)
console.log('5. Training State Management');
console.log('-'.repeat(60));

console.log('Note: The current implementation trains in-memory.');
console.log('For persistent training, you would need to:');
console.log('  1. Train the model once');
console.log('  2. Serialize the model state (future feature)');
console.log('  3. Load the serialized state on startup');
console.log();
console.log('Current approach: Train on application startup');
console.log('  - Fast enough for most use cases');
console.log('  - Training takes < 1 second for typical datasets');
console.log();

// Example 6: Practical usage pattern
console.log('6. Recommended Usage Pattern');
console.log('-'.repeat(60));

console.log(`
// In your application initialization:

const fs = require('fs');
const { createErrorTolerantPredictor } = require('@willwade/noisy-channel-predictor');

// Load resources once at startup
const trainingText = fs.readFileSync('data/training.txt', 'utf-8');
const lexicon = fs.readFileSync('data/lexicon.txt', 'utf-8')
  .split('\\n')
  .filter(w => w.trim());

// Create and train predictor
const predictor = createErrorTolerantPredictor({
  lexicon: lexicon,
  maxEditDistance: 2,
  adaptive: true  // Continues learning from user input
});

predictor.train(trainingText);

// Export for use throughout your app
module.exports = predictor;
`);

console.log('='.repeat(60));
console.log('Example complete!');
console.log('='.repeat(60));
console.log();
console.log('Available training files in ../data/:');
console.log('  - sample_training_text.txt    (general text)');
console.log('  - sample_conversation.txt     (AAC conversations)');
console.log('  - aac_lexicon_en_gb.txt       (AAC vocabulary)');
console.log('  - comprehensive_lexicon.txt   (large word list)');
console.log('  - wordlist.txt                (general words)');

