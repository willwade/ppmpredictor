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
 * @fileoverview High-level prediction API wrapping PPM language model.
 * 
 * Provides word and letter prediction with configurable error tolerance.
 */

const ppm = require('./ppm_language_model');
const vocab = require('./vocabulary');
const fuzzy = require('./utils/fuzzy-matcher');
const tokenizer = require('./utils/word-tokenizer');

/**
 * Configuration options for the predictor.
 * @typedef {Object} PredictorConfig
 * @property {number} maxOrder - Maximum context length for PPM (default: 5)
 * @property {boolean} errorTolerant - Enable error-tolerant mode (default: false)
 * @property {number} maxEditDistance - Maximum edit distance for fuzzy matching (default: 2)
 * @property {number} minSimilarity - Minimum similarity score 0-1 (default: 0.5)
 * @property {boolean} keyboardAware - Use keyboard-aware distance (default: false)
 * @property {boolean} caseSensitive - Case-sensitive matching (default: false)
 * @property {number} maxPredictions - Maximum number of predictions to return (default: 10)
 * @property {boolean} adaptive - Update model as text is entered (default: false)
 * @property {Array<string>} lexicon - Optional word list for word prediction
 */

/**
 * Prediction result.
 * @typedef {Object} Prediction
 * @property {string} text - Predicted text
 * @property {number} probability - Probability score (0-1)
 * @property {number} [distance] - Edit distance (only in error-tolerant mode)
 * @property {number} [similarity] - Similarity score (only in error-tolerant mode)
 */

/**
 * Predictor class providing word and letter prediction.
 */
class Predictor {
  /**
   * Constructor.
   * @param {PredictorConfig} config Configuration options.
   */
  constructor(config = {}) {
    // Set default configuration
    this.config = {
      maxOrder: config.maxOrder || 5,
      errorTolerant: config.errorTolerant !== undefined ? config.errorTolerant : false,
      maxEditDistance: config.maxEditDistance || 2,
      minSimilarity: config.minSimilarity || 0.5,
      keyboardAware: config.keyboardAware !== undefined ? config.keyboardAware : false,
      caseSensitive: config.caseSensitive !== undefined ? config.caseSensitive : false,
      maxPredictions: config.maxPredictions || 10,
      adaptive: config.adaptive !== undefined ? config.adaptive : false,
      lexicon: config.lexicon || []
    };

    // Create vocabulary
    this.vocab = new vocab.Vocabulary();
    
    // Add all printable ASCII characters to vocabulary
    for (let i = 32; i <= 126; i++) {
      this.vocab.addSymbol(String.fromCharCode(i));
    }
    
    // Add common special characters
    this.vocab.addSymbol('\n');
    this.vocab.addSymbol('\t');
    
    // Create PPM language model
    this.model = new ppm.PPMLanguageModel(this.vocab, this.config.maxOrder);
    
    // Create context
    this.context = this.model.createContext();
    
    // Build lexicon index if provided
    this.lexiconIndex = new Set(this.config.lexicon.map(word => 
      this.config.caseSensitive ? word : word.toLowerCase()
    ));
  }

  /**
   * Train the model on text.
   * @param {string} text Training text.
   */
  train(text) {
    if (!text || typeof text !== 'string') {
      return;
    }

    const chars = tokenizer.toCharArray(text);
    const context = this.model.createContext();
    
    for (const char of chars) {
      const symbolId = this.vocab.addSymbol(char);
      this.model.addSymbolAndUpdate(context, symbolId);
    }
  }

  /**
   * Reset the prediction context.
   */
  resetContext() {
    this.context = this.model.createContext();
  }

  /**
   * Add text to the current context.
   * @param {string} text Text to add to context.
   * @param {boolean} update Whether to update the model (adaptive mode).
   */
  addToContext(text, update = null) {
    if (!text || typeof text !== 'string') {
      return;
    }

    const shouldUpdate = update !== null ? update : this.config.adaptive;
    const chars = tokenizer.toCharArray(text);
    
    for (const char of chars) {
      let symbolId = this.vocab.symbols_.indexOf(char);
      if (symbolId < 0) {
        symbolId = this.vocab.addSymbol(char);
      }
      
      if (shouldUpdate) {
        this.model.addSymbolAndUpdate(this.context, symbolId);
      } else {
        this.model.addSymbolToContext(this.context, symbolId);
      }
    }
  }

  /**
   * Get character/letter predictions.
   * @param {string} context Optional context string (uses current context if not provided).
   * @return {Array<Prediction>} Array of character predictions.
   */
  predictNextCharacter(context = null) {
    let workingContext = this.context;
    
    if (context !== null) {
      workingContext = this.model.createContext();
      const chars = tokenizer.toCharArray(context);
      for (const char of chars) {
        let symbolId = this.vocab.symbols_.indexOf(char);
        if (symbolId < 0) {
          symbolId = this.vocab.addSymbol(char);
        }
        this.model.addSymbolToContext(workingContext, symbolId);
      }
    }

    // Get probabilities from PPM model
    const probs = this.model.getProbs(workingContext);
    
    // Convert to predictions array
    const predictions = [];
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > 0) {
        predictions.push({
          text: this.vocab.symbols_[i],
          probability: probs[i]
        });
      }
    }
    
    // Sort by probability (descending)
    predictions.sort((a, b) => b.probability - a.probability);
    
    // Return top N predictions
    return predictions.slice(0, this.config.maxPredictions);
  }

  /**
   * Get word completion predictions.
   * @param {string} partialWord Partial word to complete.
   * @param {string} precedingContext Optional preceding context.
   * @return {Array<Prediction>} Array of word predictions.
   */
  predictWordCompletion(partialWord, precedingContext = '') {
    if (!partialWord || typeof partialWord !== 'string') {
      return [];
    }

    const normalized = this.config.caseSensitive ? partialWord : partialWord.toLowerCase();
    
    // If we have a lexicon, use it for word completion
    if (this.lexiconIndex.size > 0) {
      return this._predictFromLexicon(normalized, precedingContext);
    }
    
    // Otherwise, use character-level prediction to build word completions
    return this._predictCharacterBased(partialWord, precedingContext);
  }

  /**
   * Predict word completions from lexicon.
   * @param {string} partialWord Partial word (normalized).
   * @param {string} precedingContext Preceding context.
   * @return {Array<Prediction>} Array of word predictions.
   * @private
   */
  _predictFromLexicon(partialWord, precedingContext) {
    const candidates = [];
    
    // Find all words in lexicon that start with the partial word
    for (const word of this.lexiconIndex) {
      if (fuzzy.startsWith(word, partialWord, this.config.caseSensitive)) {
        candidates.push(word);
      }
    }
    
    // In error-tolerant mode, also include fuzzy matches
    if (this.config.errorTolerant && partialWord.length >= 2) {
      const fuzzyMatches = fuzzy.fuzzyMatch(
        partialWord,
        Array.from(this.lexiconIndex),
        this.config.maxEditDistance,
        this.config.minSimilarity
      );
      
      for (const match of fuzzyMatches) {
        if (!candidates.includes(match.text)) {
          candidates.push(match.text);
        }
      }
    }
    
    // Score candidates using PPM model
    return this._scoreCandidates(candidates, precedingContext);
  }

  /**
   * Predict word completions using character-level model.
   * @param {string} partialWord Partial word.
   * @param {string} precedingContext Preceding context.
   * @return {Array<Prediction>} Array of word predictions.
   * @private
   */
  _predictCharacterBased(partialWord, precedingContext) {
    const predictions = [];
    const maxLength = 20; // Maximum word length to predict
    
    // Create a context with the preceding text and partial word
    const fullContext = precedingContext + partialWord;
    const workingContext = this.model.createContext();
    
    const chars = tokenizer.toCharArray(fullContext);
    for (const char of chars) {
      let symbolId = this.vocab.symbols_.indexOf(char);
      if (symbolId >= 0) {
        this.model.addSymbolToContext(workingContext, symbolId);
      }
    }
    
    // Generate completions by predicting next characters
    const completions = this._generateCompletions(
      workingContext,
      partialWord,
      maxLength - partialWord.length,
      5 // Generate top 5 completions
    );
    
    for (const completion of completions) {
      predictions.push({
        text: completion.text,
        probability: completion.probability
      });
    }
    
    return predictions;
  }

  /**
   * Generate word completions by predicting next characters.
   * @param {Object} context PPM context.
   * @param {string} prefix Current prefix.
   * @param {number} maxChars Maximum characters to add.
   * @param {number} numCompletions Number of completions to generate.
   * @return {Array<Prediction>} Generated completions.
   * @private
   */
  _generateCompletions(context, prefix, maxChars, numCompletions) {
    const completions = [];
    const spaceId = this.vocab.symbols_.indexOf(' ');
    
    // Simple beam search
    let beams = [{ context: this.model.cloneContext(context), text: prefix, prob: 1.0 }];
    
    for (let i = 0; i < maxChars; i++) {
      const newBeams = [];
      
      for (const beam of beams) {
        const probs = this.model.getProbs(beam.context);
        const topChars = [];
        
        // Get top characters
        for (let j = 1; j < probs.length; j++) {
          if (probs[j] > 0) {
            topChars.push({ id: j, prob: probs[j] });
          }
        }
        
        topChars.sort((a, b) => b.prob - a.prob);
        
        // Expand beam with top characters
        for (let k = 0; k < Math.min(3, topChars.length); k++) {
          const charId = topChars[k].id;
          const char = this.vocab.symbols_[charId];
          
          // Stop at space or newline
          if (charId === spaceId || char === '\n') {
            if (beam.text.length > prefix.length) {
              completions.push({ text: beam.text, probability: beam.prob });
            }
            continue;
          }
          
          const newContext = this.model.cloneContext(beam.context);
          this.model.addSymbolToContext(newContext, charId);
          
          newBeams.push({
            context: newContext,
            text: beam.text + char,
            prob: beam.prob * topChars[k].prob
          });
        }
      }
      
      if (newBeams.length === 0) break;
      
      // Keep top beams
      newBeams.sort((a, b) => b.prob - a.prob);
      beams = newBeams.slice(0, numCompletions);
    }
    
    // Add remaining beams as completions
    for (const beam of beams) {
      if (beam.text.length > prefix.length) {
        completions.push({ text: beam.text, probability: beam.prob });
      }
    }
    
    completions.sort((a, b) => b.probability - a.probability);
    return completions.slice(0, numCompletions);
  }

  /**
   * Score candidate words using the PPM model.
   * @param {Array<string>} candidates Candidate words.
   * @param {string} precedingContext Preceding context.
   * @return {Array<Prediction>} Scored predictions.
   * @private
   */
  _scoreCandidates(candidates, precedingContext) {
    const predictions = [];
    
    for (const candidate of candidates) {
      const score = this._scoreWord(candidate, precedingContext);
      predictions.push({
        text: candidate,
        probability: score
      });
    }
    
    predictions.sort((a, b) => b.probability - a.probability);
    return predictions.slice(0, this.config.maxPredictions);
  }

  /**
   * Score a word using the PPM model.
   * @param {string} word Word to score.
   * @param {string} precedingContext Preceding context.
   * @return {number} Score (probability).
   * @private
   */
  _scoreWord(word, precedingContext) {
    const fullText = precedingContext + word;
    const workingContext = this.model.createContext();
    
    let logProb = 0;
    const chars = tokenizer.toCharArray(fullText);
    
    for (const char of chars) {
      const symbolId = this.vocab.symbols_.indexOf(char);
      if (symbolId >= 0) {
        const probs = this.model.getProbs(workingContext);
        const prob = probs[symbolId] || 1e-10;
        logProb += Math.log(prob);
        this.model.addSymbolToContext(workingContext, symbolId);
      }
    }
    
    // Convert log probability to probability (normalized)
    return Math.exp(logProb / chars.length);
  }

  /**
   * Get configuration.
   * @return {PredictorConfig} Current configuration.
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration.
   * @param {Partial<PredictorConfig>} newConfig Configuration updates.
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Rebuild lexicon index if lexicon changed
    if (newConfig.lexicon) {
      this.lexiconIndex = new Set(this.config.lexicon.map(word => 
        this.config.caseSensitive ? word : word.toLowerCase()
      ));
    }
  }
}

/**
 * Exported APIs.
 */
exports.Predictor = Predictor;

