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
 * @fileoverview Word completion example.
 *
 * Demonstrates word completion and prediction with lexicon.
 */

import { createPredictor } from '../src/index.js';

console.log('='.repeat(60));
console.log('Word Completion Example');
console.log('='.repeat(60));
console.log();

// Create a comprehensive lexicon
const lexicon = [
  // Common words
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',

  // AAC-relevant words
  'hello', 'help', 'yes', 'no', 'please', 'thank', 'thanks', 'sorry',
  'want', 'need', 'like', 'love', 'good', 'bad', 'happy', 'sad',
  'hungry', 'thirsty', 'tired', 'pain', 'hurt', 'sick',

  // Action words
  'go', 'come', 'eat', 'drink', 'sleep', 'wake', 'sit', 'stand',
  'walk', 'run', 'talk', 'listen', 'look', 'see', 'hear', 'feel',

  // Question words
  'what', 'when', 'where', 'who', 'why', 'how',

  // Time words
  'now', 'later', 'today', 'tomorrow', 'yesterday', 'morning', 'afternoon', 'evening', 'night',

  // Family
  'mom', 'dad', 'mother', 'father', 'sister', 'brother', 'family', 'friend'
];

console.log(`Lexicon size: ${lexicon.length} words`);
console.log();

// Example 1: Basic word completion
console.log('1. Basic Word Completion');
console.log('-'.repeat(60));

const predictor = createPredictor({
  lexicon: lexicon,
  maxPredictions: 5,
  caseSensitive: false
});

const partialWords = ['hel', 'tha', 'mor', 'wa'];

partialWords.forEach(partial => {
  console.log(`Completing "${partial}":`);
  const predictions = predictor.predictWordCompletion(partial);

  if (predictions.length === 0) {
    console.log('  (No completions found)');
  } else {
    predictions.forEach((pred, idx) => {
      console.log(`  ${idx + 1}. ${pred.text}`);
    });
  }
  console.log();
});

// Example 2: Word completion with training
console.log('2. Word Completion with Context Training');
console.log('-'.repeat(60));

const trainedPredictor = createPredictor({
  lexicon: lexicon,
  maxPredictions: 5
});

// Train on AAC-style conversations
const trainingText = `
hello how are you today
i want to eat please
thank you for the help
i need to go to sleep now
i am feeling happy today
can you help me please
i would like some water
good morning mom and dad
`;

trainedPredictor.train(trainingText);
console.log('Trained on AAC conversation data');
console.log();

const testPartials = ['i ', 'tha', 'hel', 'goo'];

testPartials.forEach(partial => {
  console.log(`Completing "${partial}":`);
  const predictions = trainedPredictor.predictWordCompletion(partial);

  predictions.slice(0, 3).forEach((pred, idx) => {
    console.log(`  ${idx + 1}. ${pred.text} (prob: ${pred.probability.toFixed(4)})`);
  });
  console.log();
});

// Example 3: Context-aware word completion
console.log('3. Context-Aware Word Completion');
console.log('-'.repeat(60));

const contextAwarePredictor = createPredictor({
  lexicon: lexicon,
  maxPredictions: 5
});

// Train with patterns
contextAwarePredictor.train(`
good morning
good afternoon
good evening
good night
thank you
thank you very much
i want to eat
i want to drink
i want to sleep
`);

console.log('Testing context-aware completion:');
console.log();

const contextTests = [
  { context: 'good ', partial: 'mor' },
  { context: 'good ', partial: 'eve' },
  { context: 'thank ', partial: 'yo' },
  { context: 'i want to ', partial: 'ea' }
];

contextTests.forEach(test => {
  console.log(`Context: "${test.context}" + Partial: "${test.partial}"`);
  const predictions = contextAwarePredictor.predictWordCompletion(test.partial, test.context);

  predictions.slice(0, 3).forEach((pred, idx) => {
    console.log(`  ${idx + 1}. ${pred.text}`);
  });
  console.log();
});

// Example 4: Progressive completion
console.log('4. Progressive Word Completion');
console.log('-'.repeat(60));

const word = 'hello';
console.log(`Progressively completing: "${word}"`);
console.log();

for (let i = 1; i <= word.length; i++) {
  const partial = word.substring(0, i);
  const predictions = predictor.predictWordCompletion(partial);

  console.log(`"${partial}" →`, predictions.slice(0, 3).map(p => p.text).join(', '));
}
console.log();

// Example 5: Case sensitivity
console.log('5. Case Sensitivity');
console.log('-'.repeat(60));

const caseSensitiveLexicon = ['Hello', 'hello', 'HELLO', 'Help', 'help'];

console.log('Lexicon:', caseSensitiveLexicon.join(', '));
console.log();

// Case-insensitive
const caseInsensitivePredictor = createPredictor({
  lexicon: caseSensitiveLexicon,
  caseSensitive: false,
  maxPredictions: 5
});

console.log('Case-Insensitive Mode:');
console.log('  Input: "hel"');
const insensitivePredictions = caseInsensitivePredictor.predictWordCompletion('hel');
insensitivePredictions.forEach((pred, idx) => {
  console.log(`    ${idx + 1}. ${pred.text}`);
});
console.log();

// Case-sensitive
const caseSensitivePredictor = createPredictor({
  lexicon: caseSensitiveLexicon,
  caseSensitive: true,
  maxPredictions: 5
});

console.log('Case-Sensitive Mode:');
console.log('  Input: "Hel"');
const sensitivePredictions = caseSensitivePredictor.predictWordCompletion('Hel');
sensitivePredictions.forEach((pred, idx) => {
  console.log(`    ${idx + 1}. ${pred.text}`);
});
console.log();

// Example 6: Dynamic lexicon updates
console.log('6. Dynamic Lexicon Updates');
console.log('-'.repeat(60));

const dynamicPredictor = createPredictor({
  lexicon: ['hello', 'help', 'hero'],
  maxPredictions: 5
});

console.log('Initial lexicon: hello, help, hero');
console.log('Completing "hel":');
let predictions = dynamicPredictor.predictWordCompletion('hel');
console.log('  Matches:', predictions.map(p => p.text).join(', '));
console.log();

console.log('Adding new words to lexicon: helicopter, helmet, helpful');
dynamicPredictor.updateConfig({
  lexicon: ['hello', 'help', 'hero', 'helicopter', 'helmet', 'helpful']
});

console.log('Completing "hel" again:');
predictions = dynamicPredictor.predictWordCompletion('hel');
console.log('  Matches:', predictions.map(p => p.text).join(', '));
console.log();

// Example 7: Empty and edge cases
console.log('7. Edge Cases');
console.log('-'.repeat(60));

const edgeCases = [
  { input: '', description: 'Empty string' },
  { input: 'xyz', description: 'No matches' },
  { input: 'a', description: 'Single character' },
  { input: 'the', description: 'Complete word' }
];

edgeCases.forEach(testCase => {
  console.log(`${testCase.description}: "${testCase.input}"`);
  const predictions = predictor.predictWordCompletion(testCase.input);

  if (predictions.length === 0) {
    console.log('  (No predictions)');
  } else {
    console.log('  Predictions:', predictions.slice(0, 3).map(p => p.text).join(', '));
  }
  console.log();
});

console.log('='.repeat(60));
console.log('Example complete!');
console.log('='.repeat(60));

