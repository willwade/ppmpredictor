/**
 * Bigram Tracking Example
 *
 * This example demonstrates how to use bigram (word-pair) tracking
 * for next-word prediction in PPMPredictor.
 *
 * Bigrams complement the character-level PPM model by tracking
 * word-pair frequencies for phrase completion.
 */

import { createPredictor } from '../src/index.js';

console.log('='.repeat(70));
console.log('PPMPredictor - Bigram Tracking Example');
console.log('='.repeat(70));
console.log();

// ============================================================================
// Example 1: Basic Bigram Learning
// ============================================================================

console.log('Example 1: Basic Bigram Learning');
console.log('-'.repeat(70));

const predictor = createPredictor();

// Train on sample text - bigrams are automatically learned
const trainingText = 'The quick brown fox jumps over the lazy dog';
predictor.train(trainingText);

console.log(`Training text: "${trainingText}"`);
console.log();

// Get bigram statistics
const stats = predictor.getBigramStats();
console.log(`Learned ${stats.uniqueBigrams} unique word pairs`);
console.log(`Total bigram occurrences: ${stats.totalBigrams}`);
console.log();

// Predict next word after "quick"
const predictions1 = predictor.predictNextWord('quick');
console.log('After "quick", predict:');
predictions1.forEach(pred => {
  console.log(`  - "${pred.text}" (${(pred.probability * 100).toFixed(1)}%)`);
});
console.log();

// ============================================================================
// Example 2: Multiple Training Examples
// ============================================================================

console.log('Example 2: Multiple Training Examples');
console.log('-'.repeat(70));

const predictor2 = createPredictor();

// Train with multiple examples of the same word in different contexts
predictor2.train('hello world');
predictor2.train('hello there');
predictor2.train('hello friend');
predictor2.train('hello world'); // "world" appears twice

console.log('Training texts:');
console.log('  - "hello world"');
console.log('  - "hello there"');
console.log('  - "hello friend"');
console.log('  - "hello world" (again)');
console.log();

const predictions2 = predictor2.predictNextWord('hello');
console.log('After "hello", predict:');
predictions2.forEach(pred => {
  console.log(`  - "${pred.text}" (${(pred.probability * 100).toFixed(1)}%)`);
});
console.log();

// ============================================================================
// Example 3: AAC Use Case - Common Phrases
// ============================================================================

console.log('Example 3: AAC Use Case - Common Phrases');
console.log('-'.repeat(70));

const aacPredictor = createPredictor();

// Train on common AAC phrases
const aacPhrases = [
  'I want water',
  'I want food',
  'I want help',
  'I need help',
  'I need bathroom',
  'thank you',
  'thank you very much',
  'good morning',
  'good night',
  'good afternoon'
];

console.log('Training on common AAC phrases:');
aacPhrases.forEach(phrase => {
  console.log(`  - "${phrase}"`);
  aacPredictor.train(phrase);
});
console.log();

// Predict after "I"
console.log('After "I", predict:');
const iPredictions = aacPredictor.predictNextWord('I');
iPredictions.slice(0, 5).forEach(pred => {
  console.log(`  - "${pred.text}" (${(pred.probability * 100).toFixed(1)}%)`);
});
console.log();

// Predict after "want"
console.log('After "want", predict:');
const wantPredictions = aacPredictor.predictNextWord('want');
wantPredictions.forEach(pred => {
  console.log(`  - "${pred.text}" (${(pred.probability * 100).toFixed(1)}%)`);
});
console.log();

// Predict after "good"
console.log('After "good", predict:');
const goodPredictions = aacPredictor.predictNextWord('good');
goodPredictions.forEach(pred => {
  console.log(`  - "${pred.text}" (${(pred.probability * 100).toFixed(1)}%)`);
});
console.log();

// ============================================================================
// Example 4: Export and Import Bigrams
// ============================================================================

console.log('Example 4: Export and Import Bigrams');
console.log('-'.repeat(70));

// Export bigrams from the AAC predictor
const exportedBigrams = aacPredictor.exportBigrams();
console.log('Exported bigrams (first 5 lines):');
const lines = exportedBigrams.split('\n').slice(0, 5);
lines.forEach(line => {
  if (line.trim()) {
    console.log(`  ${line}`);
  }
});
console.log(`  ... (${exportedBigrams.split('\n').length - 1} total bigrams)`);
console.log();

// Create a new predictor and import the bigrams
const importedPredictor = createPredictor();
importedPredictor.importBigrams(exportedBigrams);

const importedStats = importedPredictor.getBigramStats();
console.log(`Imported ${importedStats.uniqueBigrams} unique bigrams`);
console.log();

// Verify predictions match
const originalPreds = aacPredictor.predictNextWord('I');
const importedPreds = importedPredictor.predictNextWord('I');

console.log('Predictions match after import:');
console.log(`  Original: ${originalPreds.length} predictions`);
console.log(`  Imported: ${importedPreds.length} predictions`);
console.log(`  Match: ${originalPreds[0].text === importedPreds[0].text ? '✓' : '✗'}`);
console.log();

// ============================================================================
// Example 5: Combining Character and Word Predictions
// ============================================================================

console.log('Example 5: Combining Character and Word Predictions');
console.log('-'.repeat(70));

const hybridPredictor = createPredictor({
  lexicon: ['quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog']
});

hybridPredictor.train('The quick brown fox jumps over the lazy dog');

// Character-level prediction
hybridPredictor.addToContext('The qui');
const charPreds = hybridPredictor.predictNextCharacter();
console.log('Character-level: After "The qui", predict next character:');
charPreds.slice(0, 3).forEach(pred => {
  console.log(`  - "${pred.text}" (${(pred.probability * 100).toFixed(1)}%)`);
});
console.log();

// Word-level prediction
const wordPreds = hybridPredictor.predictNextWord('quick');
console.log('Word-level: After "quick", predict next word:');
wordPreds.forEach(pred => {
  console.log(`  - "${pred.text}" (${(pred.probability * 100).toFixed(1)}%)`);
});
console.log();

// Word completion (uses character-level model)
const completions = hybridPredictor.predictWordCompletion('qui');
console.log('Word completion: Complete "qui":');
completions.slice(0, 3).forEach(pred => {
  console.log(`  - "${pred.text}" (${(pred.probability * 100).toFixed(1)}%)`);
});
console.log();

// ============================================================================
// Example 6: Case Sensitivity
// ============================================================================

console.log('Example 6: Case Sensitivity');
console.log('-'.repeat(70));

// Case-insensitive (default)
const caseInsensitive = createPredictor({ caseSensitive: false });
caseInsensitive.train('Hello World');
caseInsensitive.train('hello world');

console.log('Case-insensitive mode:');
const ciPreds = caseInsensitive.predictNextWord('hello');
console.log(`  After "hello": ${ciPreds.length} prediction(s)`);
ciPreds.forEach(pred => {
  console.log(`    - "${pred.text}" (${(pred.probability * 100).toFixed(1)}%)`);
});
console.log();

// Case-sensitive
const caseSensitive = createPredictor({ caseSensitive: true });
caseSensitive.train('Hello World');
caseSensitive.train('hello world');

console.log('Case-sensitive mode:');
const csPreds1 = caseSensitive.predictNextWord('Hello');
console.log(`  After "Hello": ${csPreds1.length} prediction(s)`);
csPreds1.forEach(pred => {
  console.log(`    - "${pred.text}"`);
});

const csPreds2 = caseSensitive.predictNextWord('hello');
console.log(`  After "hello": ${csPreds2.length} prediction(s)`);
csPreds2.forEach(pred => {
  console.log(`    - "${pred.text}"`);
});
console.log();

// ============================================================================
// Summary
// ============================================================================

console.log('='.repeat(70));
console.log('Summary');
console.log('='.repeat(70));
console.log();
console.log('Bigram tracking provides:');
console.log('  ✓ Next-word prediction based on learned word pairs');
console.log('  ✓ Automatic learning during training');
console.log('  ✓ Export/import for persistence');
console.log('  ✓ Probability-based ranking');
console.log('  ✓ Case-sensitive or case-insensitive matching');
console.log();
console.log('Use cases:');
console.log('  • AAC phrase completion');
console.log('  • Text entry acceleration');
console.log('  • Language learning (common collocations)');
console.log('  • Domain-specific terminology');
console.log();
console.log('Combine with character-level PPM for comprehensive prediction!');
console.log();

