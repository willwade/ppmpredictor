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
 * @fileoverview Main entry point for noisy-channel-predictor library.
 *
 * Provides word and letter prediction with configurable error tolerance
 * using PPM (Prediction by Partial Matching) language model.
 */

import { Predictor } from './predictor.js';
import { PPMLanguageModel } from './ppm_language_model.js';
import { Vocabulary } from './vocabulary.js';
import fuzzyMatcher from './utils/fuzzy-matcher.js';
import wordTokenizer from './utils/word-tokenizer.js';

/**
 * Create a new predictor instance with the given configuration.
 *
 * @param {Object} config - Configuration options
 * @param {number} [config.maxOrder=5] - Maximum context length for PPM
 * @param {boolean} [config.errorTolerant=false] - Enable error-tolerant mode
 * @param {number} [config.maxEditDistance=2] - Maximum edit distance for fuzzy matching
 * @param {number} [config.minSimilarity=0.5] - Minimum similarity score (0-1)
 * @param {boolean} [config.keyboardAware=false] - Use keyboard-aware distance
 * @param {Object} [config.keyboardAdjacencyMap] - Custom adjacency map for keyboard-aware distance
 * @param {boolean} [config.caseSensitive=false] - Case-sensitive matching
 * @param {number} [config.maxPredictions=10] - Maximum number of predictions
 * @param {boolean} [config.adaptive=false] - Update model as text is entered
 * @param {Array<string>} [config.lexicon=[]] - Optional word list for word prediction
 * @param {number} [config.ppmAlpha=0.49] - PPM smoothing alpha
 * @param {number} [config.ppmBeta=0.77] - PPM smoothing beta
 * @param {boolean} [config.ppmUseExclusion=true] - Enable inference-time exclusion
 * @param {boolean} [config.ppmUpdateExclusion=true] - Enable single-count updates
 * @param {number} [config.ppmMaxNodes=0] - Maximum trie nodes per model (0 = unlimited)
 * @return {Predictor} Predictor instance
 *
 * @example
 * const { createPredictor } = require('@willwade/noisy-channel-predictor');
 *
 * // Create a basic predictor
 * const predictor = createPredictor();
 *
 * // Train on some text
 * predictor.train('The quick brown fox jumps over the lazy dog');
 *
 * // Get character predictions
 * predictor.addToContext('The qui');
 * const charPredictions = predictor.predictNextCharacter();
 * console.log(charPredictions); // [{ text: 'c', probability: 0.8 }, ...]
 *
 * @example
 * // Create an error-tolerant predictor with a lexicon
 * const predictor = createPredictor({
 *   errorTolerant: true,
 *   maxEditDistance: 2,
 *   lexicon: ['hello', 'world', 'help', 'held']
 * });
 *
 * // Get word completions (with typo tolerance)
 * const wordPredictions = predictor.predictWordCompletion('helo');
 * console.log(wordPredictions); // [{ text: 'hello', probability: 0.9 }, ...]
 */
function createPredictor(config = {}) {
  return new Predictor(config);
}

/**
 * Create a predictor with strict mode (exact matching only).
 *
 * @param {Object} config - Configuration options (errorTolerant will be set to false)
 * @return {Predictor} Predictor instance in strict mode
 *
 * @example
 * const { createStrictPredictor } = require('@willwade/noisy-channel-predictor');
 *
 * const predictor = createStrictPredictor({
 *   lexicon: ['hello', 'world']
 * });
 *
 * const predictions = predictor.predictWordCompletion('hel');
 * console.log(predictions); // Only exact prefix matches
 */
function createStrictPredictor(config = {}) {
  return new Predictor({
    ...config,
    errorTolerant: false
  });
}

/**
 * Create a predictor with error-tolerant mode enabled.
 *
 * @param {Object} config - Configuration options (errorTolerant will be set to true)
 * @return {Predictor} Predictor instance in error-tolerant mode
 *
 * @example
 * const { createErrorTolerantPredictor } = require('@willwade/noisy-channel-predictor');
 *
 * const predictor = createErrorTolerantPredictor({
 *   maxEditDistance: 2,
 *   keyboardAware: true,
 *   lexicon: ['hello', 'world', 'help']
 * });
 *
 * // Will match 'hello' even with typos
 * const predictions = predictor.predictWordCompletion('helo');
 * console.log(predictions);
 */
function createErrorTolerantPredictor(config = {}) {
  return new Predictor({
    ...config,
    errorTolerant: true
  });
}

/**
 * Utility function to calculate edit distance between two strings.
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @return {number} Edit distance
 *
 * @example
 * const { levenshteinDistance } = require('@willwade/noisy-channel-predictor');
 *
 * const distance = levenshteinDistance('hello', 'helo');
 * console.log(distance); // 1
 */
function levenshteinDistance(str1, str2) {
  return fuzzyMatcher.levenshteinDistance(str1, str2);
}

/**
 * Utility function to calculate similarity score between two strings.
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @return {number} Similarity score (0-1, higher is more similar)
 *
 * @example
 * const { similarityScore } = require('@willwade/noisy-channel-predictor');
 *
 * const score = similarityScore('hello', 'helo');
 * console.log(score); // 0.8
 */
function similarityScore(str1, str2) {
  return fuzzyMatcher.similarityScore(str1, str2);
}

// Export main API
export {
  // Factory functions
  createPredictor,
  createStrictPredictor,
  createErrorTolerantPredictor,

  // Classes (for advanced usage)
  Predictor,
  PPMLanguageModel,
  Vocabulary,

  // Utilities
  levenshteinDistance,
  similarityScore,
  fuzzyMatcher,
  wordTokenizer
};
