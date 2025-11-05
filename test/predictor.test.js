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
 * @fileoverview Basic tests for the predictor library.
 */

import assert from 'assert';
import {
  createPredictor,
  createStrictPredictor,
  createErrorTolerantPredictor,
  levenshteinDistance,
  similarityScore
} from '../src/index.js';

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    testsFailed++;
  }
}

console.log('Running Predictor Tests...');
console.log('='.repeat(60));
console.log();

// Test 1: Basic predictor creation
test('Create predictor with default config', () => {
  const predictor = createPredictor();
  assert(predictor !== null);
  assert(predictor !== undefined);
});

// Test 2: Training
test('Train predictor on text', () => {
  const predictor = createPredictor();
  predictor.train('hello world');
  // Should not throw
});

// Test 3: Character prediction
test('Predict next character', () => {
  const predictor = createPredictor();
  predictor.train('hello world');
  predictor.resetContext();
  predictor.addToContext('hel');

  const predictions = predictor.predictNextCharacter();
  assert(Array.isArray(predictions));
  assert(predictions.length > 0);
  assert(predictions[0].text !== undefined);
  assert(predictions[0].probability !== undefined);
  assert(predictions[0].probability >= 0 && predictions[0].probability <= 1);
});

// Test 4: Word completion with lexicon
test('Word completion with lexicon', () => {
  const predictor = createPredictor({
    lexicon: ['hello', 'help', 'hero', 'world']
  });

  const completions = predictor.predictWordCompletion('hel');
  assert(Array.isArray(completions));
  assert(completions.length > 0);
  assert(completions.every(c => c.text.startsWith('hel')));
});

// Test 5: Strict mode
test('Strict mode - no fuzzy matching', () => {
  const predictor = createStrictPredictor({
    lexicon: ['hello', 'world']
  });

  const completions = predictor.predictWordCompletion('helo'); // typo
  // In strict mode, should not match 'hello'
  assert(completions.length === 0 || !completions.some(c => c.text === 'hello'));
});

// Test 6: Error-tolerant mode
test('Error-tolerant mode - fuzzy matching', () => {
  const predictor = createErrorTolerantPredictor({
    lexicon: ['hello', 'world'],
    maxEditDistance: 2
  });

  const completions = predictor.predictWordCompletion('helo'); // typo
  // Should match 'hello' despite typo
  assert(completions.length > 0);
  assert(completions.some(c => c.text === 'hello'));
});

// Test 7: Context reset
test('Reset context', () => {
  const predictor = createPredictor();
  predictor.train('hello world');
  predictor.addToContext('hello');
  predictor.resetContext();

  // After reset, context should be empty
  // This should work without errors
  const predictions = predictor.predictNextCharacter();
  assert(Array.isArray(predictions));
});

// Test 8: Configuration update
test('Update configuration at runtime', () => {
  const predictor = createPredictor({
    errorTolerant: false
  });

  let config = predictor.getConfig();
  assert(config.errorTolerant === false);

  predictor.updateConfig({ errorTolerant: true });

  config = predictor.getConfig();
  assert(config.errorTolerant === true);
});

// Test 9: Levenshtein distance
test('Calculate Levenshtein distance', () => {
  assert(levenshteinDistance('hello', 'hello') === 0);
  assert(levenshteinDistance('hello', 'helo') === 1);
  assert(levenshteinDistance('hello', 'world') === 4);
  assert(levenshteinDistance('', '') === 0);
  assert(levenshteinDistance('abc', '') === 3);
});

// Test 10: Similarity score
test('Calculate similarity score', () => {
  const score1 = similarityScore('hello', 'hello');
  assert(score1 === 1.0);

  const score2 = similarityScore('hello', 'helo');
  assert(score2 > 0.5 && score2 < 1.0);

  const score3 = similarityScore('hello', 'world');
  assert(score3 < 0.5);
});

// Test 11: Case sensitivity
test('Case-insensitive matching', () => {
  const predictor = createPredictor({
    lexicon: ['Hello', 'World'],
    caseSensitive: false
  });

  const completions = predictor.predictWordCompletion('hel');
  assert(completions.length > 0);
});

// Test 12: Case sensitivity (strict)
test('Case-sensitive matching', () => {
  const predictor = createPredictor({
    lexicon: ['Hello', 'hello'],
    caseSensitive: true
  });

  const completions1 = predictor.predictWordCompletion('Hel');
  assert(completions1.some(c => c.text === 'Hello'));

  const completions2 = predictor.predictWordCompletion('hel');
  assert(completions2.some(c => c.text === 'hello'));
});

// Test 13: Max predictions limit
test('Respect max predictions limit', () => {
  const predictor = createPredictor({
    lexicon: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
    maxPredictions: 5
  });

  predictor.train('abcdefghijk');
  const predictions = predictor.predictNextCharacter();
  assert(predictions.length <= 5);
});

// Test 14: Empty input handling
test('Handle empty input gracefully', () => {
  const predictor = createPredictor({
    lexicon: ['hello', 'world']
  });

  const completions = predictor.predictWordCompletion('');
  // Should not throw, may return empty or all words
  assert(Array.isArray(completions));
});

// Test 15: Adaptive mode
test('Adaptive mode updates model', () => {
  const predictor = createPredictor({
    adaptive: true
  });

  predictor.resetContext();
  predictor.addToContext('test', true); // Update model

  // Should work without errors
  const predictions = predictor.predictNextCharacter();
  assert(Array.isArray(predictions));
});

// Test 16: Lexicon update
test('Update lexicon at runtime', () => {
  const predictor = createPredictor({
    lexicon: ['hello']
  });

  let completions = predictor.predictWordCompletion('wor');
  assert(completions.length === 0);

  predictor.updateConfig({
    lexicon: ['hello', 'world']
  });

  completions = predictor.predictWordCompletion('wor');
  assert(completions.length > 0);
  assert(completions.some(c => c.text === 'world'));
});

// Test 17: Probability ordering
test('Predictions ordered by probability', () => {
  const predictor = createPredictor();
  predictor.train('aaaaabbbbc');
  predictor.resetContext();

  const predictions = predictor.predictNextCharacter();

  // Check that probabilities are in descending order
  for (let i = 1; i < predictions.length; i++) {
    assert(predictions[i - 1].probability >= predictions[i].probability);
  }
});

// Test 18: Context with special characters
test('Handle special characters in context', () => {
  const predictor = createPredictor();
  predictor.train('hello, world!');
  predictor.resetContext();
  predictor.addToContext('hello,');

  const predictions = predictor.predictNextCharacter();
  assert(Array.isArray(predictions));
  assert(predictions.length > 0);
});

// Test 19: Multiple training sessions
test('Multiple training sessions accumulate', () => {
  const predictor = createPredictor();
  predictor.train('hello');
  predictor.train('world');

  // Both training sessions should affect the model
  predictor.resetContext();
  const predictions = predictor.predictNextCharacter();
  assert(predictions.length > 0);
});

// Test 20: Keyboard-aware mode
test('Keyboard-aware error tolerance', () => {
  const predictor = createErrorTolerantPredictor({
    lexicon: ['hello'],
    keyboardAware: true,
    maxEditDistance: 2
  });

  // 'j' is adjacent to 'h' on QWERTY
  const completions = predictor.predictWordCompletion('jello');
  // Should still work
  assert(Array.isArray(completions));
});

// Regression suite to ensure predictions remain stable after performance tweaks.
test('Regression: top-N predictions remain stable', () => {
  const predictor = createPredictor();
  predictor.train('the quick brown fox jumps over the lazy dog. the quick blue hare.');
  predictor.resetContext();
  predictor.addToContext('the ');

  const charPreds = predictor.predictNextCharacter().slice(0, 5);
  const expectedChars = [
    { text: 'q', probability: 0.44819389715754004 },
    { text: 'l', probability: 0.16699089362953626 },
    { text: 't', probability: 0.05237716056772911 },
    { text: 'h', probability: 0.047360509629352156 },
    { text: ' ', probability: 0.03974712384208602 }
  ];

  const tolerance = 1e-9;
  expectedChars.forEach((expected, index) => {
    const actual = charPreds[index];
    assert(actual, `Missing character prediction at index ${index}`);
    assert.strictEqual(actual.text, expected.text, `Unexpected char at index ${index}`);
    assert(Math.abs(actual.probability - expected.probability) < tolerance,
      `Probability mismatch for '${expected.text}'`);
  });

  const lexicon = ['hello', 'help', 'held', 'helmet', 'helium', 'hero', 'world'];
  const wordPredictor = createPredictor({ lexicon, errorTolerant: true });

  const completions = wordPredictor.predictWordCompletion('hel');
  const expectedWords = ['hello', 'help', 'held', 'hero', 'helmet'];
  expectedWords.forEach((word) => {
    const suggestion = completions.find(c => c.text === word);
    assert(suggestion, `Missing completion for '${word}'`);
    assert(Math.abs(suggestion.probability - 0.010309278350515483) < tolerance,
      `Probability mismatch for word '${word}'`);
  });

  const fuzzy = wordPredictor.predictWordCompletion('hez');
  const expectedFuzzy = ['help', 'held', 'hero'];
  expectedFuzzy.forEach((word) => {
    const suggestion = fuzzy.find(c => c.text === word);
    assert(suggestion, `Missing fuzzy completion for '${word}'`);
  });
});

console.log();
console.log('='.repeat(60));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log('='.repeat(60));

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed! ✓');
  process.exit(0);
}
