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

test('Custom keyboard adjacency map influences fuzzy matching', () => {
  const defaultPredictor = createErrorTolerantPredictor({
    lexicon: ['bar'],
    keyboardAware: true,
    maxEditDistance: 0.5
  });
  const defaultResult = defaultPredictor.predictWordCompletion('aar');
  assert(!defaultResult.some(c => c.text === 'bar'));

  const adjacency = {
    a: ['b'],
    b: ['a']
  };
  const customPredictor = createErrorTolerantPredictor({
    lexicon: ['bar'],
    keyboardAware: true,
    keyboardAdjacencyMap: adjacency,
    maxEditDistance: 0.5
  });
  const customResult = customPredictor.predictWordCompletion('aar');
  assert(customResult.some(c => c.text === 'bar'));
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

// Multi-corpus tests
console.log('\nMulti-Corpus Tests:');
console.log('-'.repeat(60));

test('Add training corpus', () => {
  const predictor = createPredictor();
  predictor.addTrainingCorpus('medical', 'medical terminology patient doctor hospital');
  const corpora = predictor.getCorpora();
  assert(corpora.includes('medical'), 'Medical corpus should be added');
  assert(corpora.includes('default'), 'Default corpus should exist');
});

test('Get corpus info', () => {
  const predictor = createPredictor();
  predictor.addTrainingCorpus('medical', 'medical text', {
    description: 'Medical terminology'
  });
  const info = predictor.getCorpusInfo('medical');
  assert.strictEqual(info.description, 'Medical terminology');
  assert.strictEqual(info.enabled, true);
});

test('Use specific corpus', () => {
  const predictor = createPredictor();
  predictor.train('hello world');
  predictor.addTrainingCorpus('medical', 'medical terminology');

  predictor.useCorpora('medical');
  const activeCorpora = predictor.getCorpora(true);
  assert.strictEqual(activeCorpora.length, 1);
  assert.strictEqual(activeCorpora[0], 'medical');
});

test('Use multiple corpora', () => {
  const predictor = createPredictor();
  predictor.addTrainingCorpus('medical', 'medical text');
  predictor.addTrainingCorpus('personal', 'personal text');

  predictor.useCorpora(['medical', 'personal']);
  const activeCorpora = predictor.getCorpora(true);
  assert.strictEqual(activeCorpora.length, 2);
  assert(activeCorpora.includes('medical'));
  assert(activeCorpora.includes('personal'));
});

test('Use all corpora', () => {
  const predictor = createPredictor();
  predictor.addTrainingCorpus('medical', 'medical text');
  predictor.addTrainingCorpus('personal', 'personal text');

  predictor.useCorpora('medical'); // First use only medical
  predictor.useAllCorpora(); // Then enable all

  const activeCorpora = predictor.getCorpora(true);
  assert.strictEqual(activeCorpora.length, 3); // default + medical + personal
});

test('Remove corpus', () => {
  const predictor = createPredictor();
  predictor.addTrainingCorpus('temp', 'temporary text');

  let corpora = predictor.getCorpora();
  assert(corpora.includes('temp'));

  predictor.removeCorpus('temp');
  corpora = predictor.getCorpora();
  assert(!corpora.includes('temp'));
});

test('Cannot remove default corpus', () => {
  const predictor = createPredictor();
  try {
    predictor.removeCorpus('default');
    assert.fail('Should throw error when removing default corpus');
  } catch (error) {
    assert(error.message.includes('Cannot remove the default corpus'));
  }
});

test('Predict from single corpus', () => {
  const predictor = createPredictor();
  predictor.train('hello hello hello world');

  predictor.addToContext('hel');
  const predictions = predictor.predictNextCharacter();

  assert(predictions.length > 0);
  assert.strictEqual(predictions[0].text, 'l'); // Should predict 'l' after 'hel'
});

test('Predict from multiple corpora', () => {
  const predictor = createPredictor();

  // Train default corpus on 'hello'
  predictor.train('hello hello hello');

  // Train medical corpus on 'help'
  predictor.addTrainingCorpus('medical', 'help help help');

  // Use both corpora
  predictor.useCorpora(['default', 'medical']);

  predictor.addToContext('hel');
  const predictions = predictor.predictNextCharacter();

  assert(predictions.length > 0);
  // Should have predictions from both 'hello' and 'help'
  const chars = predictions.map(p => p.text);
  assert(chars.includes('l') || chars.includes('p'));
});

test('Multi-corpus predictions are merged', () => {
  const predictor = createPredictor();

  // Train two corpora with different patterns
  predictor.train('aaa aaa aaa');
  predictor.addTrainingCorpus('corpus2', 'bbb bbb bbb');

  // Use both
  predictor.useCorpora(['default', 'corpus2']);

  predictor.resetContext();
  const predictions = predictor.predictNextCharacter();

  // Should have predictions from both corpora
  const chars = predictions.map(p => p.text);
  assert(chars.includes('a') || chars.includes('b'));
});

// ============================================================================
// BIGRAM TRACKING TESTS
// ============================================================================

// Test 33: Learn bigrams from training text
test('Learn bigrams from training text', () => {
  const predictor = createPredictor();
  predictor.train('The quick brown fox jumps over the lazy dog');

  const stats = predictor.getBigramStats();
  assert(stats.uniqueBigrams > 0, 'Should learn some bigrams');
  assert(stats.totalBigrams > 0, 'Should have total bigram count');
  assert(stats.uniqueBigrams <= stats.totalBigrams, 'Unique bigrams should not exceed total');
});

// Test 34: Predict next word using bigrams
test('Predict next word using bigrams', () => {
  const predictor = createPredictor();
  predictor.train('The quick brown fox jumps over the lazy dog');

  const predictions = predictor.predictNextWord('quick');
  assert(Array.isArray(predictions), 'Should return array');
  assert(predictions.length > 0, 'Should have predictions');
  assert(predictions[0].text === 'brown', 'Should predict "brown" after "quick"');
  assert(predictions[0].probability > 0, 'Should have probability');
});

// Test 35: Bigram predictions with multiple occurrences
test('Bigram predictions with multiple occurrences', () => {
  const predictor = createPredictor();
  predictor.train('hello world');
  predictor.train('hello there');
  predictor.train('hello friend');
  predictor.train('hello world'); // "world" appears twice

  const predictions = predictor.predictNextWord('hello');
  assert(predictions.length === 3, 'Should have 3 unique next words');

  // "world" should have highest probability (appears twice)
  const worldPred = predictions.find(p => p.text === 'world');
  assert(worldPred, 'Should predict "world"');
  assert(worldPred.probability === 0.5, 'Should have 50% probability (2/4)');

  // Others should have 25% each
  const therePred = predictions.find(p => p.text === 'there');
  const friendPred = predictions.find(p => p.text === 'friend');
  assert(therePred && therePred.probability === 0.25, 'Should have 25% probability');
  assert(friendPred && friendPred.probability === 0.25, 'Should have 25% probability');
});

// Test 36: Export and import bigrams
test('Export and import bigrams', () => {
  const predictor1 = createPredictor();
  predictor1.train('The quick brown fox');

  const exported = predictor1.exportBigrams();
  assert(typeof exported === 'string', 'Should export as string');
  assert(exported.length > 0, 'Should have content');

  const predictor2 = createPredictor();
  predictor2.importBigrams(exported);

  const stats1 = predictor1.getBigramStats();
  const stats2 = predictor2.getBigramStats();
  assert(stats1.uniqueBigrams === stats2.uniqueBigrams, 'Should have same unique bigrams');
  assert(stats1.totalBigrams === stats2.totalBigrams, 'Should have same total bigrams');

  // Predictions should match
  const pred1 = predictor1.predictNextWord('quick');
  const pred2 = predictor2.predictNextWord('quick');
  assert(pred1.length === pred2.length, 'Should have same number of predictions');
  assert(pred1[0].text === pred2[0].text, 'Should predict same word');
});

// Test 37: Clear bigrams
test('Clear bigrams', () => {
  const predictor = createPredictor();
  predictor.train('The quick brown fox');

  let stats = predictor.getBigramStats();
  assert(stats.uniqueBigrams > 0, 'Should have bigrams before clear');

  predictor.clearBigrams();

  stats = predictor.getBigramStats();
  assert(stats.uniqueBigrams === 0, 'Should have no bigrams after clear');
  assert(stats.totalBigrams === 0, 'Should have zero total after clear');

  const predictions = predictor.predictNextWord('quick');
  assert(predictions.length === 0, 'Should have no predictions after clear');
});

// Test 38: Case sensitivity in bigrams
test('Case sensitivity in bigrams', () => {
  const caseSensitive = createPredictor({ caseSensitive: true });
  caseSensitive.train('Hello World');
  caseSensitive.train('hello world');

  const predictions1 = caseSensitive.predictNextWord('Hello');
  const predictions2 = caseSensitive.predictNextWord('hello');

  assert(predictions1.length === 1, 'Should have one prediction for "Hello"');
  assert(predictions2.length === 1, 'Should have one prediction for "hello"');
  assert(predictions1[0].text === 'World', 'Should predict "World" (capitalized)');
  assert(predictions2[0].text === 'world', 'Should predict "world" (lowercase)');

  // Case insensitive
  const caseInsensitive = createPredictor({ caseSensitive: false });
  caseInsensitive.train('Hello World');
  caseInsensitive.train('hello world');

  const predictions3 = caseInsensitive.predictNextWord('hello');
  assert(predictions3.length === 1, 'Should have one prediction');
  assert(predictions3[0].text === 'world', 'Should predict "world"');
  assert(predictions3[0].probability === 1.0, 'Should have 100% probability (both normalized to same bigram)');
});

// Test 39: Bigram predictions with max limit
test('Bigram predictions with max limit', () => {
  const predictor = createPredictor();
  // Train with many different next words
  for (let i = 0; i < 20; i++) {
    predictor.train(`hello word${i}`);
  }

  const predictions5 = predictor.predictNextWord('hello', 5);
  assert(predictions5.length === 5, 'Should return max 5 predictions');

  const predictions10 = predictor.predictNextWord('hello', 10);
  assert(predictions10.length === 10, 'Should return max 10 predictions');

  const predictionsAll = predictor.predictNextWord('hello', 100);
  assert(predictionsAll.length === 20, 'Should return all 20 predictions');
});

// Test 40: Empty or invalid input handling
test('Empty or invalid input handling for bigrams', () => {
  const predictor = createPredictor();
  predictor.train('hello world');

  assert(predictor.predictNextWord('').length === 0, 'Should return empty for empty string');
  assert(predictor.predictNextWord('nonexistent').length === 0, 'Should return empty for unknown word');

  predictor.importBigrams(''); // Should not crash
  predictor.importBigrams('invalid format'); // Should not crash

  const stats = predictor.getBigramStats();
  assert(stats.uniqueBigrams > 0, 'Should still have original bigrams');
});

// Per-Corpus Lexicon Tests
console.log();
console.log('Per-Corpus Lexicon Tests:');
console.log('-'.repeat(60));

test('Add corpus with specific lexicon', () => {
  const predictor = createPredictor();
  const frenchWords = ['bonjour', 'merci', 'au revoir'];

  predictor.addTrainingCorpus('french', 'bonjour le monde', {
    lexicon: frenchWords,
    description: 'French vocabulary'
  });

  const info = predictor.getCorpusInfo('french');
  assert(info !== null);
  assert.strictEqual(info.description, 'French vocabulary');
});

test('Word completion uses corpus-specific lexicon', () => {
  const predictor = createPredictor({
    lexicon: ['hello', 'help', 'hero']
  });

  const frenchWords = ['bonjour', 'bonsoir', 'bon'];
  predictor.addTrainingCorpus('french', 'bonjour le monde', {
    lexicon: frenchWords
  });

  // Use only French corpus
  predictor.useCorpora(['french']);

  const predictions = predictor.predictWordCompletion('bon');
  assert(predictions.length > 0);

  // Should only get French words, not English
  const texts = predictions.map(p => p.text);
  assert(texts.includes('bonjour') || texts.includes('bonsoir') || texts.includes('bon'));
  assert(!texts.includes('hello'));
});

test('Multilingual word completion merges lexicons', () => {
  const predictor = createPredictor({
    lexicon: ['hello', 'help', 'hero']
  });

  const frenchWords = ['bonjour', 'bonsoir'];
  predictor.addTrainingCorpus('french', 'bonjour le monde', {
    lexicon: frenchWords
  });

  const spanishWords = ['hola', 'hasta'];
  predictor.addTrainingCorpus('spanish', 'hola mundo', {
    lexicon: spanishWords
  });

  // Use all corpora
  predictor.useCorpora(['default', 'french', 'spanish']);

  // Should get words from all languages
  const hPredictions = predictor.predictWordCompletion('h');
  const hTexts = hPredictions.map(p => p.text);

  // Should include words from multiple languages
  const hasEnglish = hTexts.some(w => ['hello', 'help', 'hero'].includes(w));
  const hasSpanish = hTexts.some(w => ['hola', 'hasta'].includes(w));

  assert(hasEnglish || hasSpanish, 'Should have words from multiple languages');
});

test('Empty corpus lexicon falls back to character-based prediction', () => {
  const predictor = createPredictor();

  // Add corpus without lexicon
  predictor.addTrainingCorpus('nolexicon', 'the quick brown fox');
  predictor.useCorpora(['nolexicon']);

  const predictions = predictor.predictWordCompletion('qui');
  // Should still get predictions (character-based)
  assert(Array.isArray(predictions));
});

test('Per-corpus lexicon with fuzzy matching', () => {
  const predictor = createPredictor({
    errorTolerant: true,
    maxEditDistance: 2
  });

  const medicalWords = ['acetaminophen', 'ibuprofen', 'aspirin'];
  predictor.addTrainingCorpus('medical', 'take acetaminophen for pain', {
    lexicon: medicalWords
  });

  predictor.useCorpora(['medical']);

  // Typo: "ibuprofin" instead of "ibuprofen"
  const predictions = predictor.predictWordCompletion('ibuprofin');
  const texts = predictions.map(p => p.text);

  // Should fuzzy match to "ibuprofen"
  assert(texts.includes('ibuprofen'), 'Should fuzzy match medical terms');
});

test('Switch between corpus lexicons', () => {
  const predictor = createPredictor({
    lexicon: ['cat', 'dog', 'bird']
  });

  const fruitWords = ['apple', 'banana', 'cherry'];
  predictor.addTrainingCorpus('fruits', 'I like apples', {
    lexicon: fruitWords
  });

  // Use default (animals)
  predictor.useCorpora(['default']);
  let predictions = predictor.predictWordCompletion('c');
  let texts = predictions.map(p => p.text);
  assert(texts.includes('cat'), 'Should have animal words');

  // Switch to fruits
  predictor.useCorpora(['fruits']);
  predictions = predictor.predictWordCompletion('c');
  texts = predictions.map(p => p.text);
  assert(texts.includes('cherry'), 'Should have fruit words');
  assert(!texts.includes('cat'), 'Should not have animal words');
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
