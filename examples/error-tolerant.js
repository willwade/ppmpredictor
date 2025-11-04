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
 * @fileoverview Error-tolerant prediction example.
 *
 * Demonstrates error-tolerant prediction with fuzzy matching for noisy input.
 */

import { createStrictPredictor, createErrorTolerantPredictor, levenshteinDistance } from '../src/index.js';

console.log('='.repeat(60));
console.log('Error-Tolerant Prediction Example');
console.log('='.repeat(60));
console.log();

// Sample lexicon
const lexicon = [
  'hello', 'help', 'held', 'hero', 'here',
  'world', 'word', 'work', 'worry', 'worth',
  'quick', 'quiet', 'quite', 'quit', 'quiz',
  'brown', 'brow', 'browse', 'browser',
  'jump', 'jumps', 'jumped', 'jumping'
];

console.log('Sample Lexicon:');
console.log(lexicon.join(', '));
console.log();

// Example 1: Strict vs Error-Tolerant Mode
console.log('1. Strict Mode vs Error-Tolerant Mode');
console.log('-'.repeat(60));

const strictPredictor = createStrictPredictor({
  lexicon: lexicon,
  maxPredictions: 5
});

const tolerantPredictor = createErrorTolerantPredictor({
  lexicon: lexicon,
  maxPredictions: 5,
  maxEditDistance: 2,
  minSimilarity: 0.5
});

// Test with a typo
const typo = 'helo'; // Missing 'l'
console.log(`Input with typo: "${typo}"`);
console.log();

console.log('Strict Mode Predictions:');
const strictPredictions = strictPredictor.predictWordCompletion(typo);
if (strictPredictions.length === 0) {
  console.log('  (No matches found)');
} else {
  strictPredictions.forEach((pred, idx) => {
    console.log(`  ${idx + 1}. "${pred.text}" (probability: ${pred.probability.toFixed(4)})`);
  });
}
console.log();

console.log('Error-Tolerant Mode Predictions:');
const tolerantPredictions = tolerantPredictor.predictWordCompletion(typo);
tolerantPredictions.forEach((pred, idx) => {
  const distance = levenshteinDistance(typo, pred.text);
  console.log(`  ${idx + 1}. "${pred.text}" (probability: ${pred.probability.toFixed(4)}, distance: ${distance})`);
});
console.log();

// Example 2: Different types of errors
console.log('2. Handling Different Types of Errors');
console.log('-'.repeat(60));

const testCases = [
  { input: 'wrld', expected: 'world', error: 'Missing vowel' },
  { input: 'qiuck', expected: 'quick', error: 'Transposition' },
  { input: 'browwn', expected: 'brown', error: 'Double letter' },
  { input: 'jmp', expected: 'jump', error: 'Missing letters' },
  { input: 'hepl', expected: 'help', error: 'Transposition' }
];

testCases.forEach((testCase, idx) => {
  console.log(`Test ${idx + 1}: ${testCase.error}`);
  console.log(`  Input: "${testCase.input}" (expected: "${testCase.expected}")`);

  const predictions = tolerantPredictor.predictWordCompletion(testCase.input);
  if (predictions.length > 0) {
    const topMatch = predictions[0];
    const distance = levenshteinDistance(testCase.input, topMatch.text);
    console.log(`  Top match: "${topMatch.text}" (distance: ${distance})`);

    if (topMatch.text === testCase.expected) {
      console.log('  ✓ Correct!');
    } else {
      console.log(`  ✗ Expected "${testCase.expected}"`);
    }
  } else {
    console.log('  ✗ No matches found');
  }
  console.log();
});

// Example 3: Keyboard-aware error tolerance
console.log('3. Keyboard-Aware Error Tolerance');
console.log('-'.repeat(60));

const keyboardAwarePredictor = createErrorTolerantPredictor({
  lexicon: lexicon,
  maxPredictions: 5,
  maxEditDistance: 2,
  keyboardAware: true // Adjacent key errors cost less
});

// These are common keyboard proximity errors
const keyboardErrors = [
  { input: 'hwllo', note: 'h is next to j, but w is next to e' },
  { input: 'wuick', note: 'u is next to i on keyboard' },
  { input: 'vrown', note: 'v is next to b on keyboard' }
];

console.log('Testing keyboard proximity errors:');
console.log();

keyboardErrors.forEach((test, idx) => {
  console.log(`Test ${idx + 1}: "${test.input}"`);
  console.log(`  Note: ${test.note}`);

  const predictions = keyboardAwarePredictor.predictWordCompletion(test.input);
  console.log('  Predictions:');
  predictions.slice(0, 3).forEach((pred, i) => {
    console.log(`    ${i + 1}. "${pred.text}" (probability: ${pred.probability.toFixed(4)})`);
  });
  console.log();
});

// Example 4: Configurable tolerance levels
console.log('4. Configurable Tolerance Levels');
console.log('-'.repeat(60));

const input = 'hlo'; // Missing two letters

console.log(`Input: "${input}"`);
console.log();

const toleranceLevels = [
  { maxEditDistance: 1, minSimilarity: 0.7, label: 'Strict' },
  { maxEditDistance: 2, minSimilarity: 0.5, label: 'Moderate' },
  { maxEditDistance: 3, minSimilarity: 0.3, label: 'Lenient' }
];

toleranceLevels.forEach(level => {
  const predictor = createErrorTolerantPredictor({
    lexicon: lexicon,
    maxPredictions: 3,
    maxEditDistance: level.maxEditDistance,
    minSimilarity: level.minSimilarity
  });

  const predictions = predictor.predictWordCompletion(input);

  console.log(`${level.label} (maxDistance: ${level.maxEditDistance}, minSimilarity: ${level.minSimilarity}):`);
  if (predictions.length === 0) {
    console.log('  (No matches)');
  } else {
    predictions.forEach((pred, idx) => {
      const distance = levenshteinDistance(input, pred.text);
      console.log(`  ${idx + 1}. "${pred.text}" (distance: ${distance})`);
    });
  }
  console.log();
});

// Example 5: Runtime configuration changes
console.log('5. Runtime Configuration Changes');
console.log('-'.repeat(60));

const dynamicPredictor = createStrictPredictor({
  lexicon: lexicon,
  maxPredictions: 3
});

const testInput = 'helo';

console.log(`Input: "${testInput}"`);
console.log();

console.log('Initial (Strict Mode):');
let predictions = dynamicPredictor.predictWordCompletion(testInput);
console.log(`  Matches: ${predictions.length}`);
console.log();

console.log('Switching to Error-Tolerant Mode...');
dynamicPredictor.updateConfig({
  errorTolerant: true,
  maxEditDistance: 2
});

predictions = dynamicPredictor.predictWordCompletion(testInput);
console.log(`  Matches: ${predictions.length}`);
predictions.forEach((pred, idx) => {
  console.log(`  ${idx + 1}. "${pred.text}"`);
});
console.log();

console.log('='.repeat(60));
console.log('Example complete!');
console.log('='.repeat(60));

