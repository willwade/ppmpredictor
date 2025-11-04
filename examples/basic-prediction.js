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
 * @fileoverview Basic prediction example.
 * 
 * Demonstrates basic character and word prediction using the library.
 */

const { createPredictor } = require('../src/index');

console.log('='.repeat(60));
console.log('Basic Prediction Example');
console.log('='.repeat(60));
console.log();

// Create a predictor with default settings
const predictor = createPredictor({
  maxOrder: 5,
  maxPredictions: 5
});

console.log('1. Training the model...');
console.log('-'.repeat(60));

// Train on some sample text
const trainingText = `
The quick brown fox jumps over the lazy dog.
The dog was very lazy and slept all day.
The fox was quick and clever.
A quick fox can jump very high.
`;

predictor.train(trainingText);
console.log('Training complete!');
console.log();

// Example 1: Character prediction
console.log('2. Character Prediction');
console.log('-'.repeat(60));

const context1 = 'The qui';
predictor.resetContext();
predictor.addToContext(context1);

console.log(`Context: "${context1}"`);
console.log('Predicted next characters:');

const charPredictions = predictor.predictNextCharacter();
charPredictions.forEach((pred, idx) => {
  console.log(`  ${idx + 1}. "${pred.text}" (probability: ${pred.probability.toFixed(4)})`);
});
console.log();

// Example 2: Character prediction with different context
console.log('3. Character Prediction with Different Context');
console.log('-'.repeat(60));

const context2 = 'The dog was ver';
predictor.resetContext();
predictor.addToContext(context2);

console.log(`Context: "${context2}"`);
console.log('Predicted next characters:');

const charPredictions2 = predictor.predictNextCharacter();
charPredictions2.forEach((pred, idx) => {
  console.log(`  ${idx + 1}. "${pred.text}" (probability: ${pred.probability.toFixed(4)})`);
});
console.log();

// Example 3: Building predictions incrementally
console.log('4. Incremental Prediction');
console.log('-'.repeat(60));

predictor.resetContext();
const incrementalText = 'The f';

console.log(`Building context character by character: "${incrementalText}"`);
console.log();

for (let i = 0; i < incrementalText.length; i++) {
  const partial = incrementalText.substring(0, i + 1);
  predictor.resetContext();
  predictor.addToContext(partial);
  
  const predictions = predictor.predictNextCharacter();
  console.log(`After "${partial}":`);
  console.log(`  Top prediction: "${predictions[0].text}" (${predictions[0].probability.toFixed(4)})`);
}
console.log();

// Example 4: Adaptive mode
console.log('5. Adaptive Mode (Model Updates as You Type)');
console.log('-'.repeat(60));

const adaptivePredictor = createPredictor({
  maxOrder: 5,
  maxPredictions: 3,
  adaptive: true
});

// Train with initial text
adaptivePredictor.train('hello world');

console.log('Initial training: "hello world"');
console.log();

// Type "hello" and see predictions adapt
const word = 'hello';
adaptivePredictor.resetContext();

console.log('Typing "hello" with adaptive mode:');
for (let i = 0; i < word.length; i++) {
  const char = word[i];
  adaptivePredictor.addToContext(char, true); // true = update model
  
  const predictions = adaptivePredictor.predictNextCharacter();
  console.log(`  After "${word.substring(0, i + 1)}": next = "${predictions[0]?.text || 'N/A'}"`);
}
console.log();

// Example 5: Using a custom context
console.log('6. Prediction with Custom Context (No State)');
console.log('-'.repeat(60));

console.log('Predicting without maintaining state:');

const customContext = 'The lazy';
const predictions = predictor.predictNextCharacter(customContext);

console.log(`Context: "${customContext}"`);
console.log('Predicted next characters:');
predictions.slice(0, 3).forEach((pred, idx) => {
  console.log(`  ${idx + 1}. "${pred.text}" (probability: ${pred.probability.toFixed(4)})`);
});
console.log();

console.log('='.repeat(60));
console.log('Example complete!');
console.log('='.repeat(60));

