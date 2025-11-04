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
 * @fileoverview Browser-compatible entry point for noisy-channel-predictor.
 * 
 * This version excludes Node.js-specific dependencies (like fs) and provides
 * a browser-friendly API.
 */

const predictorModule = require('./predictor');
const ppmModule = require('./ppm_language_model');
const vocabModule = require('./vocabulary');
const fuzzyMatcher = require('./utils/fuzzy-matcher');
const wordTokenizer = require('./utils/word-tokenizer');

// Extract the actual classes from the modules
const Predictor = predictorModule.Predictor || predictorModule;
const PPMLanguageModel = ppmModule.PPMLanguageModel || ppmModule;
const Vocabulary = vocabModule.Vocabulary || vocabModule;

/**
 * Create a new predictor instance.
 * 
 * @param {Object} config - Configuration options
 * @returns {Predictor} Predictor instance
 */
function createPredictor(config = {}) {
  return new Predictor(config);
}

/**
 * Create a predictor with strict mode (exact matching only).
 * 
 * @param {Object} config - Configuration options
 * @returns {Predictor} Predictor instance
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
 * @param {Object} config - Configuration options
 * @returns {Predictor} Predictor instance
 */
function createErrorTolerantPredictor(config = {}) {
  return new Predictor({
    ...config,
    errorTolerant: true
  });
}

// Export for different module systems
const PPMPredictor = {
  // Factory functions
  createPredictor,
  createStrictPredictor,
  createErrorTolerantPredictor,

  // Classes
  Predictor,
  PPMLanguageModel,
  Vocabulary,

  // Utilities
  fuzzyMatcher,
  wordTokenizer,

  // Convenience exports
  levenshteinDistance: fuzzyMatcher.levenshteinDistance,
  similarityScore: fuzzyMatcher.similarityScore,
  fuzzyMatch: fuzzyMatcher.fuzzyMatch
};

// UMD export
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = PPMPredictor;
  module.exports.createPredictor = createPredictor;
  module.exports.createStrictPredictor = createStrictPredictor;
  module.exports.createErrorTolerantPredictor = createErrorTolerantPredictor;
  module.exports.Predictor = Predictor;
  module.exports.PPMLanguageModel = PPMLanguageModel;
  module.exports.Vocabulary = Vocabulary;
  module.exports.fuzzyMatcher = fuzzyMatcher;
  module.exports.wordTokenizer = wordTokenizer;
  module.exports.levenshteinDistance = fuzzyMatcher.levenshteinDistance;
  module.exports.similarityScore = fuzzyMatcher.similarityScore;
  module.exports.fuzzyMatch = fuzzyMatcher.fuzzyMatch;
}

if (typeof window !== 'undefined') {
  // Browser global
  window.PPMPredictor = PPMPredictor;
}

// Default export
module.exports = PPMPredictor;

