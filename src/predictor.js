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

import * as ppm from './ppm_language_model.js';
import * as vocab from './vocabulary.js';
import * as fuzzy from './utils/fuzzy-matcher.js';
import * as tokenizer from './utils/word-tokenizer.js';
import { BKTree } from './utils/bk-tree.js';
import { PrefixTrie } from './utils/prefix-trie.js';

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
 * @property {number} ppmAlpha - PPM smoothing alpha (default: 0.49)
 * @property {number} ppmBeta - PPM smoothing beta (default: 0.77)
 * @property {boolean} ppmUseExclusion - Enable PPM exclusion at inference (default: true)
 * @property {boolean} ppmUpdateExclusion - Enable PPM single-count updates (default: true)
 * @property {number} ppmMaxNodes - Maximum trie nodes per corpus model (0 = unlimited)
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
      keyboardAdjacencyMap: config.keyboardAdjacencyMap || null,
      caseSensitive: config.caseSensitive !== undefined ? config.caseSensitive : false,
      maxPredictions: config.maxPredictions || 10,
      adaptive: config.adaptive !== undefined ? config.adaptive : false,
      lexicon: config.lexicon || [],
      ppmAlpha: config.ppmAlpha !== undefined ? config.ppmAlpha : 0.49,
      ppmBeta: config.ppmBeta !== undefined ? config.ppmBeta : 0.77,
      ppmUseExclusion: config.ppmUseExclusion !== undefined ? config.ppmUseExclusion : true,
      ppmUpdateExclusion: config.ppmUpdateExclusion !== undefined ?
        config.ppmUpdateExclusion : true,
      ppmMaxNodes: config.ppmMaxNodes !== undefined ? config.ppmMaxNodes : 0
    };

    // Create vocabulary (shared across all corpora)
    this.vocab = new vocab.Vocabulary();

    // Add all printable ASCII characters to vocabulary
    for (let i = 32; i <= 126; i++) {
      this.vocab.addSymbol(String.fromCharCode(i));
    }

    // Add common special characters
    this.vocab.addSymbol('\n');
    this.vocab.addSymbol('\t');

    // Multi-corpus support
    // Store multiple training corpora with their own PPM models and lexicons
    this._corpora = {
      // Default corpus (backward compatibility)
      'default': {
        model: new ppm.PPMLanguageModel(
          this.vocab,
          this.config.maxOrder,
          this._getPPMOptions()
        ),
        enabled: true,
        description: 'Default training corpus',
        lexicon: this.config.lexicon || [],
        lexiconIndex: null,
        lexiconTree: null,
        lexiconTrie: null
      }
    };

    // Track which corpora are currently active
    this._activeCorpora = ['default'];

    // Create PPM language model (points to default corpus for backward compatibility)
    this.model = this._corpora['default'].model;

    // Create context
    this.context = this.model.createContext();

    // Bigram tracking for next-word prediction
    // Maps "word1 word2" -> frequency count
    this._bigrams = new Map();

    // Track total bigram count for probability calculation
    this._totalBigrams = 0;

    // Track the last word for bigram learning
    this._lastWord = null;

    // Build lexicon structures for default corpus
    this._buildCorpusLexicon('default');

    // Apply PPM settings to all corpora.
    this._applyPPMConfigToModels();
  }

  /**
   * Train the model on text.
   * Trains the default corpus for backward compatibility.
   * For multi-corpus training, use addTrainingCorpus() instead.
   *
   * This method trains both the character-level PPM model and learns
   * word-pair (bigram) frequencies for next-word prediction.
   *
   * @param {string} text Training text.
   *
   * @example
   * predictor.train('The quick brown fox jumps over the lazy dog');
   * // Learns character patterns AND word pairs like "quick brown", "brown fox", etc.
   */
  train(text) {
    if (!text || typeof text !== 'string') {
      return;
    }

    // Train character-level PPM model
    const chars = tokenizer.toCharArray(text);
    const context = this.model.createContext();

    for (const char of chars) {
      const symbolId = this.vocab.addSymbol(char);
      this.model.addSymbolAndUpdate(context, symbolId);
    }

    // Learn bigrams from the training text
    this._learnBigramsFromText(text);
  }

  /**
   * Add a new training corpus with a unique key.
   * Creates a new PPM model trained on the provided text.
   *
   * @param {string} corpusKey Unique identifier for this corpus (e.g., 'medical', 'personal', 'french')
   * @param {string} text Training text for this corpus
   * @param {Object} options Optional configuration
   * @param {string} options.description Human-readable description of the corpus
   * @param {boolean} options.enabled Whether this corpus should be active (default: true)
   * @param {Array<string>} options.lexicon Optional word list specific to this corpus (e.g., French words for French corpus)
   *
   * @example
   * // Add medical terminology corpus with medical lexicon
   * predictor.addTrainingCorpus('medical', medicalText, {
   *   description: 'Medical terminology and phrases',
   *   lexicon: medicalWords
   * });
   *
   * // Add French corpus with French lexicon
   * predictor.addTrainingCorpus('french', frenchText, {
   *   description: 'French language corpus',
   *   lexicon: frenchWords
   * });
   */
  addTrainingCorpus(corpusKey, text, options = {}) {
    if (!corpusKey || typeof corpusKey !== 'string') {
      throw new Error('corpusKey must be a non-empty string');
    }

    if (!text || typeof text !== 'string') {
      throw new Error('text must be a non-empty string');
    }

    // Create new PPM model for this corpus
    const corpusModel = new ppm.PPMLanguageModel(
      this.vocab,
      this.config.maxOrder,
      this._getPPMOptions()
    );

    // Train the model on the provided text
    const chars = tokenizer.toCharArray(text);
    const context = corpusModel.createContext();

    for (const char of chars) {
      const symbolId = this.vocab.addSymbol(char);
      corpusModel.addSymbolAndUpdate(context, symbolId);
    }

    // Store the corpus with its own lexicon
    this._corpora[corpusKey] = {
      model: corpusModel,
      enabled: options.enabled !== undefined ? options.enabled : true,
      description: options.description || `Training corpus: ${corpusKey}`,
      lexicon: options.lexicon || [],
      lexiconIndex: null,
      lexiconTree: null,
      lexiconTrie: null
    };

    // Build lexicon structures for this corpus
    this._buildCorpusLexicon(corpusKey);

    // Add to active corpora if enabled
    if (this._corpora[corpusKey].enabled && !this._activeCorpora.includes(corpusKey)) {
      this._activeCorpora.push(corpusKey);
    }
  }

  /**
   * Enable specific training corpora for predictions.
   * Disables all other corpora.
   *
   * @param {string|string[]} corpusKeys Single corpus key or array of corpus keys to use
   *
   * @example
   * // Use only medical corpus
   * predictor.useCorpora('medical');
   *
   * // Use medical and personal corpora
   * predictor.useCorpora(['medical', 'personal']);
   */
  useCorpora(corpusKeys) {
    const keys = Array.isArray(corpusKeys) ? corpusKeys : [corpusKeys];

    // Validate all keys exist
    for (const key of keys) {
      if (!this._corpora[key]) {
        throw new Error(`Corpus '${key}' does not exist. Available: ${Object.keys(this._corpora).join(', ')}`);
      }
    }

    // Disable all corpora
    Object.keys(this._corpora).forEach(key => {
      this._corpora[key].enabled = false;
    });

    // Enable specified corpora
    keys.forEach(key => {
      this._corpora[key].enabled = true;
    });

    // Update active corpora list
    this._activeCorpora = keys;

    // Update default model reference if 'default' is active
    if (keys.includes('default')) {
      this.model = this._corpora['default'].model;
    } else if (keys.length > 0) {
      // Point to first active corpus
      this.model = this._corpora[keys[0]].model;
    }
  }

  /**
   * Enable all loaded training corpora for predictions.
   *
   * @example
   * predictor.useAllCorpora();
   */
  useAllCorpora() {
    Object.keys(this._corpora).forEach(key => {
      this._corpora[key].enabled = true;
    });
    this._activeCorpora = Object.keys(this._corpora);
  }

  /**
   * Get list of available corpus keys.
   *
   * @param {boolean} onlyEnabled If true, only return enabled corpora
   * @return {string[]} Array of corpus keys
   *
   * @example
   * const allCorpora = predictor.getCorpora();
   * const activeCorpora = predictor.getCorpora(true);
   */
  getCorpora(onlyEnabled = false) {
    if (onlyEnabled) {
      return this._activeCorpora.slice();
    }
    return Object.keys(this._corpora);
  }

  /**
   * Get information about a specific corpus.
   *
   * @param {string} corpusKey Corpus identifier
   * @return {Object} Corpus information (description, enabled status)
   *
   * @example
   * const info = predictor.getCorpusInfo('medical');
   * console.log(info.description); // "Medical terminology and phrases"
   * console.log(info.enabled);     // true
   */
  getCorpusInfo(corpusKey) {
    if (!this._corpora[corpusKey]) {
      throw new Error(`Corpus '${corpusKey}' does not exist`);
    }

    return {
      key: corpusKey,
      description: this._corpora[corpusKey].description,
      enabled: this._corpora[corpusKey].enabled
    };
  }

  /**
   * Remove a training corpus.
   *
   * @param {string} corpusKey Corpus identifier to remove
   *
   * @example
   * predictor.removeCorpus('old_vocabulary');
   */
  removeCorpus(corpusKey) {
    if (corpusKey === 'default') {
      throw new Error('Cannot remove the default corpus');
    }

    if (!this._corpora[corpusKey]) {
      throw new Error(`Corpus '${corpusKey}' does not exist`);
    }

    delete this._corpora[corpusKey];
    this._activeCorpora = this._activeCorpora.filter(key => key !== corpusKey);
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
      let symbolId = this.vocab.getSymbol(char);
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
   * Merges predictions from all active training corpora.
   *
   * @param {string} context Optional context string (uses current context if not provided).
   * @return {Array<Prediction>} Array of character predictions.
   */
  predictNextCharacter(context = null) {
    // If only one corpus is active, use fast path
    if (this._activeCorpora.length === 1) {
      return this._predictFromSingleCorpus(this._activeCorpora[0], context);
    }

    // Merge predictions from all active corpora
    return this._predictFromMultipleCorpora(context);
  }

  /**
   * Get predictions from a single corpus (fast path).
   * @private
   */
  _predictFromSingleCorpus(corpusKey, context = null) {
    const corpus = this._corpora[corpusKey];
    let workingContext = corpusKey === 'default' ? this.context : corpus.model.createContext();

    if (context !== null) {
      workingContext = corpus.model.createContext();
      const chars = tokenizer.toCharArray(context);
      for (const char of chars) {
        let symbolId = this.vocab.getSymbol(char);
        if (symbolId < 0) {
          symbolId = this.vocab.addSymbol(char);
        }
        corpus.model.addSymbolToContext(workingContext, symbolId);
      }
    }

    // Get probabilities from PPM model
    const probs = corpus.model.getProbs(workingContext);

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
   * Get predictions from multiple corpora and merge them.
   * Averages probabilities across all active corpora.
   * @private
   */
  _predictFromMultipleCorpora(context = null) {
    const allPredictions = new Map(); // char -> { totalProb, count }

    // Collect predictions from each active corpus
    for (const corpusKey of this._activeCorpora) {
      const corpus = this._corpora[corpusKey];
      let workingContext = corpus.model.createContext();

      // Build context if provided
      if (context !== null) {
        const chars = tokenizer.toCharArray(context);
        for (const char of chars) {
          let symbolId = this.vocab.getSymbol(char);
          if (symbolId < 0) {
            symbolId = this.vocab.addSymbol(char);
          }
          corpus.model.addSymbolToContext(workingContext, symbolId);
        }
      } else if (corpusKey === 'default') {
        // Use current context for default corpus
        workingContext = this.context;
      }

      // Get probabilities from this corpus
      const probs = corpus.model.getProbs(workingContext);

      // Accumulate probabilities
      for (let i = 1; i < probs.length; i++) {
        if (probs[i] > 0) {
          const char = this.vocab.symbols_[i];
          if (!allPredictions.has(char)) {
            allPredictions.set(char, { totalProb: 0, count: 0 });
          }
          const entry = allPredictions.get(char);
          entry.totalProb += probs[i];
          entry.count++;
        }
      }
    }

    // Average probabilities and create predictions array
    const predictions = [];
    for (const [char, data] of allPredictions.entries()) {
      predictions.push({
        text: char,
        probability: data.totalProb / data.count // Average across corpora
      });
    }

    // Sort by probability (descending)
    predictions.sort((a, b) => b.probability - a.probability);

    // Return top N predictions
    return predictions.slice(0, this.config.maxPredictions);
  }

  /**
   * Get word completion predictions.
   * Merges lexicons from all active corpora for multilingual support.
   * @param {string} partialWord Partial word to complete.
   * @param {string} precedingContext Optional preceding context.
   * @return {Array<Prediction>} Array of word predictions.
   */
  predictWordCompletion(partialWord, precedingContext = '') {
    if (!partialWord || typeof partialWord !== 'string') {
      return [];
    }

    const normalized = this.config.caseSensitive ? partialWord : partialWord.toLowerCase();

    // Check if any active corpus has a lexicon
    const hasLexicon = this._activeCorpora.some(key => {
      const corpus = this._corpora[key];
      return corpus && corpus.lexiconIndex && corpus.lexiconIndex.size > 0;
    });

    // If we have lexicons in active corpora, use them for word completion
    if (hasLexicon) {
      return this._predictFromLexicon(normalized, precedingContext);
    }

    // Otherwise, use character-level prediction to build word completions
    return this._predictCharacterBased(partialWord, precedingContext);
  }

  /**
   * Predict word completions from lexicons of all active corpora.
   * Merges lexicons from multiple corpora for multilingual support.
   * @param {string} partialWord Partial word (normalized).
   * @param {string} precedingContext Preceding context.
   * @return {Array<Prediction>} Array of word predictions.
   * @private
  */
  _predictFromLexicon(partialWord, precedingContext) {
    const candidates = new Map(); // Map word -> frequency rank (lower is better)
    const seen = new Set();

    // Collect candidates from all active corpora
    for (const corpusKey of this._activeCorpora) {
      const corpus = this._corpora[corpusKey];
      if (!corpus || !corpus.lexiconIndex || corpus.lexiconIndex.size === 0) {
        continue;
      }

      // Get frequency rank from lexicon array (index = rank, lower is more frequent)
      const lexiconArray = corpus.lexicon || [];

      // Use trie for efficient prefix lookup when available
      if (corpus.lexiconTrie) {
        const prefixMatches = corpus.lexiconTrie.collect(partialWord, this.config.maxPredictions * 2);
        for (const word of prefixMatches) {
          if (!seen.has(word)) {
            seen.add(word);
            // Find frequency rank (position in lexicon array)
            const rank = lexiconArray.indexOf(word);
            candidates.set(word, rank >= 0 ? rank : lexiconArray.length);
          }
        }
      } else {
        for (const word of corpus.lexiconIndex) {
          if (fuzzy.startsWith(word, partialWord, this.config.caseSensitive)) {
            if (!seen.has(word)) {
              seen.add(word);
              // Find frequency rank (position in lexicon array)
              const rank = lexiconArray.indexOf(word);
              candidates.set(word, rank >= 0 ? rank : lexiconArray.length);
            }
          }
        }
      }

      // In error-tolerant mode, also include fuzzy matches from this corpus
      if (this.config.errorTolerant && partialWord.length >= 2 && corpus.lexiconTree && !corpus.lexiconTree.isEmpty()) {
        const matches = corpus.lexiconTree.search(partialWord, this.config.maxEditDistance);
        for (const match of matches) {
          const maxLen = Math.max(partialWord.length, match.term.length);
          const similarity = maxLen === 0 ? 1.0 : 1.0 - (match.distance / maxLen);
          if (similarity >= this.config.minSimilarity && !seen.has(match.term)) {
            seen.add(match.term);
            // Find frequency rank (position in lexicon array)
            const rank = lexiconArray.indexOf(match.term);
            candidates.set(match.term, rank >= 0 ? rank : lexiconArray.length);
          }
        }
      }
    }

    // Score candidates using PPM model + frequency rank
    return this._scoreCandidatesWithFrequency(candidates, precedingContext);
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
      let symbolId = this.vocab.getSymbol(char);
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
    const spaceId = this.vocab.getSymbol(' ');

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

      if (newBeams.length === 0) {break;}

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
   * Score candidate words using PPM model + frequency rank.
   * Combines character-level probability with word frequency from lexicon.
   * @param {Map<string, number>} candidates Map of word -> frequency rank.
   * @param {string} precedingContext Preceding context.
   * @return {Array<Prediction>} Scored predictions.
   * @private
   */
  _scoreCandidatesWithFrequency(candidates, precedingContext) {
    const predictions = [];
    const maxRank = Math.max(...candidates.values(), 1);

    for (const [word, rank] of candidates.entries()) {
      // Get PPM character-level score
      const ppmScore = this._scoreWord(word, precedingContext);

      // Convert rank to frequency score (0-1, higher is better)
      // More frequent words (lower rank) get higher scores
      const frequencyScore = 1.0 - (rank / maxRank);

      // Combine scores: 70% frequency, 30% PPM
      // Frequency is more important for word prediction
      const combinedScore = (0.7 * frequencyScore) + (0.3 * ppmScore);

      predictions.push({
        text: word,
        probability: combinedScore
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
      const symbolId = this.vocab.getSymbol(char);
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
   * Learn bigrams (word pairs) from training text.
   * Extracts word pairs and tracks their frequencies for next-word prediction.
   *
   * @param {string} text Training text to learn bigrams from.
   * @private
   *
   * @example
   * // Internal use: learns "quick brown", "brown fox", etc.
   * this._learnBigramsFromText('The quick brown fox');
   */
  _learnBigramsFromText(text) {
    if (!text || typeof text !== 'string') {
      return;
    }

    // Tokenize text into words (splits on whitespace)
    const words = tokenizer.tokenize(text);

    // Normalize words based on case sensitivity setting
    const normalizedWords = words.map(word =>
      this.config.caseSensitive ? word : word.toLowerCase()
    );

    // Learn bigrams (consecutive word pairs)
    for (let i = 0; i < normalizedWords.length - 1; i++) {
      const word1 = normalizedWords[i];
      const word2 = normalizedWords[i + 1];

      // Skip empty words or punctuation-only words
      if (!word1 || !word2 || word1.length === 0 || word2.length === 0) {
        continue;
      }

      // Create bigram key "word1 word2"
      const bigramKey = `${word1} ${word2}`;

      // Increment frequency count
      const currentCount = this._bigrams.get(bigramKey) || 0;
      this._bigrams.set(bigramKey, currentCount + 1);
      this._totalBigrams++;
    }
  }

  /**
   * Predict next word based on bigram frequencies.
   * Uses learned word-pair patterns to suggest likely next words.
   *
   * @param {string} currentWord The current/last word typed.
   * @param {number} maxPredictions Maximum number of predictions to return (default: 10).
   * @return {Array<Prediction>} Array of next-word predictions sorted by probability.
   *
   * @example
   * predictor.train('The quick brown fox jumps over the lazy dog');
   * const predictions = predictor.predictNextWord('brown');
   * // Returns: [{ text: 'fox', probability: 1.0 }]
   *
   * @example
   * // With multiple training examples
   * predictor.train('hello world');
   * predictor.train('hello there');
   * predictor.train('hello friend');
   * const predictions = predictor.predictNextWord('hello');
   * // Returns: [
   * //   { text: 'world', probability: 0.33 },
   * //   { text: 'there', probability: 0.33 },
   * //   { text: 'friend', probability: 0.33 }
   * // ]
   */
  predictNextWord(currentWord, maxPredictions = 10) {
    if (!currentWord || typeof currentWord !== 'string') {
      return [];
    }

    // Normalize the current word
    const normalized = this.config.caseSensitive ? currentWord : currentWord.toLowerCase();

    // Find all bigrams starting with this word
    const nextWordCounts = new Map();
    let totalCount = 0;

    for (const [bigramKey, count] of this._bigrams.entries()) {
      const [word1, word2] = bigramKey.split(' ');

      if (word1 === normalized) {
        nextWordCounts.set(word2, (nextWordCounts.get(word2) || 0) + count);
        totalCount += count;
      }
    }

    // Convert counts to probabilities
    const predictions = [];
    for (const [word, count] of nextWordCounts.entries()) {
      predictions.push({
        text: word,
        probability: count / totalCount
      });
    }

    // Sort by probability (descending) and return top N
    predictions.sort((a, b) => b.probability - a.probability);
    return predictions.slice(0, maxPredictions);
  }

  /**
   * Export learned bigrams as text.
   * Returns bigrams in a simple text format that can be saved and re-imported.
   *
   * @return {string} Bigrams in text format (one per line: "word1 word2 count").
   *
   * @example
   * const bigramText = predictor.exportBigrams();
   * // Returns:
   * // "quick brown 5\n"
   * // "brown fox 5\n"
   * // "hello world 3\n"
   * // ...
   */
  exportBigrams() {
    const lines = [];

    for (const [bigramKey, count] of this._bigrams.entries()) {
      lines.push(`${bigramKey} ${count}`);
    }

    return lines.join('\n');
  }

  /**
   * Import bigrams from text.
   * Loads bigrams from a text format (one per line: "word1 word2 count").
   * This adds to existing bigrams rather than replacing them.
   *
   * @param {string} bigramText Bigrams in text format.
   *
   * @example
   * const bigramText = "quick brown 5\nbrown fox 5\nhello world 3";
   * predictor.importBigrams(bigramText);
   */
  importBigrams(bigramText) {
    if (!bigramText || typeof bigramText !== 'string') {
      return;
    }

    const lines = bigramText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      // Parse "word1 word2 count"
      const parts = trimmed.split(' ');
      if (parts.length < 3) {
        continue; // Invalid format
      }

      // Last part is count, everything before is the bigram
      const count = parseInt(parts[parts.length - 1], 10);
      if (isNaN(count) || count <= 0) {
        continue; // Invalid count
      }

      // Reconstruct bigram key (handles multi-word entries)
      const bigramKey = parts.slice(0, parts.length - 1).join(' ');

      // Add to bigrams
      const currentCount = this._bigrams.get(bigramKey) || 0;
      this._bigrams.set(bigramKey, currentCount + count);
      this._totalBigrams += count;
    }
  }

  /**
   * Clear all learned bigrams.
   * Resets bigram tracking to initial state.
   *
   * @example
   * predictor.clearBigrams();
   */
  clearBigrams() {
    this._bigrams.clear();
    this._totalBigrams = 0;
    this._lastWord = null;
  }

  /**
   * Get bigram statistics.
   * Returns information about learned bigrams.
   *
   * @return {Object} Bigram statistics.
   * @return {number} return.uniqueBigrams - Number of unique bigrams learned.
   * @return {number} return.totalBigrams - Total bigram occurrences.
   *
   * @example
   * const stats = predictor.getBigramStats();
   * console.log(`Learned ${stats.uniqueBigrams} unique word pairs`);
   */
  getBigramStats() {
    return {
      uniqueBigrams: this._bigrams.size,
      totalBigrams: this._totalBigrams
    };
  }

  /**
   * Get PPM model statistics for each corpus.
   * Useful for observing memory usage when max node limits are set.
   *
   * @return {Object<string, Object>} Map of corpus key to stats.
   */
  getPPMStats() {
    const stats = {};
    for (const [key, corpus] of Object.entries(this._corpora)) {
      if (corpus && corpus.model && typeof corpus.model.getStats === 'function') {
        stats[key] = corpus.model.getStats();
      }
    }
    return stats;
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

    if (newConfig.ppmAlpha !== undefined ||
      newConfig.ppmBeta !== undefined ||
      newConfig.ppmUseExclusion !== undefined ||
      newConfig.ppmUpdateExclusion !== undefined ||
      newConfig.ppmMaxNodes !== undefined) {
      this._applyPPMConfigToModels();
    }

    // Rebuild lexicon structures if relevant settings changed
    if (newConfig.lexicon ||
      newConfig.caseSensitive !== undefined ||
      newConfig.keyboardAdjacencyMap ||
      newConfig.keyboardAware !== undefined) {

      // Update default corpus lexicon if lexicon changed
      if (newConfig.lexicon) {
        this._buildLexiconStructures();
      }

      // Rebuild all corpus lexicons if keyboard settings changed
      // (affects BKTree distance function)
      if (newConfig.keyboardAdjacencyMap || newConfig.keyboardAware !== undefined) {
        for (const corpusKey of Object.keys(this._corpora)) {
          this._buildCorpusLexicon(corpusKey);
        }
      }
    }
  }

  /**
   * Build auxiliary structures used for lexicon lookup for a specific corpus.
   * @param {string} corpusKey The corpus to build lexicon structures for
   * @private
   */
  _buildCorpusLexicon(corpusKey) {
    const corpus = this._corpora[corpusKey];
    if (!corpus) {
      return;
    }

    const lexicon = Array.isArray(corpus.lexicon) ? corpus.lexicon : [];
    corpus.lexiconIndex = new Set();
    corpus.lexiconTrie = new PrefixTrie();

    const adjacency = this._resolveAdjacencyMap();
    const distanceFn = this.config.keyboardAware
      ? (a, b) => fuzzy.keyboardAwareDistance(a, b, adjacency || fuzzy.getQwertyAdjacency())
      : fuzzy.levenshteinDistance;

    corpus.lexiconTree = new BKTree(distanceFn);

    for (const entry of lexicon) {
      if (typeof entry !== 'string' || entry.length === 0) {
        continue;
      }

      const normalized = this.config.caseSensitive ? entry : entry.toLowerCase();
      if (!corpus.lexiconIndex.has(normalized)) {
        corpus.lexiconIndex.add(normalized);
        corpus.lexiconTree.insert(normalized);
        corpus.lexiconTrie.insert(normalized);
      }
    }
  }

  /**
   * Build auxiliary structures used for lexicon lookup.
   * For backward compatibility - rebuilds default corpus lexicon.
   * @private
   */
  _buildLexiconStructures() {
    // Update default corpus lexicon from config
    if (this._corpora['default']) {
      this._corpora['default'].lexicon = this.config.lexicon || [];
      this._buildCorpusLexicon('default');
    }

    // Also update keyboard adjacency (shared across all corpora)
    this.keyboardAdjacency = this._resolveAdjacencyMap();
  }

  /**
   * Returns PPM parameter options from predictor config.
   * @return {Object} PPM options object.
   * @private
   */
  _getPPMOptions() {
    return {
      alpha: this.config.ppmAlpha,
      beta: this.config.ppmBeta,
      useExclusion: this.config.ppmUseExclusion,
      updateExclusion: this.config.ppmUpdateExclusion,
      maxNodes: this.config.ppmMaxNodes
    };
  }

  /**
   * Applies current PPM settings to all loaded corpus models.
   * @private
   */
  _applyPPMConfigToModels() {
    const options = this._getPPMOptions();
    for (const corpus of Object.values(this._corpora)) {
      if (corpus && corpus.model && typeof corpus.model.setParameters === 'function') {
        corpus.model.setParameters(options);
      }
    }
  }

  /**
   * Resolve the adjacency map to use for keyboard-aware distance.
   * @return {?Object} adjacency map or null.
   * @private
   */
  _resolveAdjacencyMap() {
    if (!this.config.keyboardAware) {
      return null;
    }
    if (this.config.keyboardAdjacencyMap) {
      return this._normalizeAdjacencyMap(this.config.keyboardAdjacencyMap);
    }
    return fuzzy.getQwertyAdjacency();
  }

  /**
   * Normalize adjacency keys to single-character lowercase entries.
   * @param {Object} adjacencyMap Raw adjacency map.
   * @return {Object} Normalized adjacency map.
   * @private
   */
  _normalizeAdjacencyMap(adjacencyMap) {
    const normalized = {};
    for (const [key, neighbours] of Object.entries(adjacencyMap)) {
      if (typeof key !== 'string' || key.length === 0) {
        continue;
      }
      const base = key.charAt(0).toLowerCase();
      if (!normalized[base]) {
        normalized[base] = [];
      }
      if (Array.isArray(neighbours)) {
        for (const neighbour of neighbours) {
          if (typeof neighbour !== 'string' || neighbour.length === 0) {
            continue;
          }
          const char = neighbour.charAt(0).toLowerCase();
          if (!normalized[base].includes(char)) {
            normalized[base].push(char);
          }
        }
      }
    }
    return normalized;
  }
}

/**
 * Exported APIs.
 */
export { Predictor };
