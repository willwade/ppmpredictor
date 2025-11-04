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
 * @fileoverview Word tokenization utilities.
 *
 * Provides functions for splitting text into words and handling
 * word boundaries for prediction.
 */

/**
 * Tokenize text into words.
 * @param {string} text Text to tokenize.
 * @return {Array<string>} Array of words.
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Split on whitespace and punctuation, but keep the tokens
  return text.trim().split(/\s+/).filter(word => word.length > 0);
}

/**
 * Get the last partial word from text (for word completion).
 * @param {string} text Input text.
 * @return {string} The last partial word.
 */
function getLastPartialWord(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const trimmed = text.trimEnd();
  const words = trimmed.split(/\s+/);

  // If text ends with whitespace, there's no partial word
  if (text !== trimmed) {
    return '';
  }

  return words[words.length - 1] || '';
}

/**
 * Get the context (all words except the last partial word).
 * @param {string} text Input text.
 * @return {string} Context text.
 */
function getContext(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const trimmed = text.trimEnd();
  const words = trimmed.split(/\s+/);

  // If text ends with whitespace, all words are context
  if (text !== trimmed) {
    return trimmed;
  }

  // Otherwise, exclude the last word
  if (words.length <= 1) {
    return '';
  }

  return words.slice(0, -1).join(' ');
}

/**
 * Check if text ends with a word boundary (whitespace).
 * @param {string} text Input text.
 * @return {boolean} True if text ends with whitespace.
 */
function endsWithWordBoundary(text) {
  if (!text || typeof text !== 'string') {
    return true;
  }

  return text !== text.trimEnd();
}

/**
 * Normalize text for prediction (lowercase, trim).
 * @param {string} text Input text.
 * @param {boolean} lowercase Whether to convert to lowercase.
 * @return {string} Normalized text.
 */
function normalize(text, lowercase = true) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let normalized = text.trim();
  if (lowercase) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
}

/**
 * Split text into characters, handling special cases.
 * @param {string} text Input text.
 * @return {Array<string>} Array of characters.
 */
function toCharArray(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return Array.from(text);
}

/**
 * Join an array of characters into a string.
 * @param {Array<string>} chars Array of characters.
 * @return {string} Joined string.
 */
function fromCharArray(chars) {
  if (!Array.isArray(chars)) {
    return '';
  }

  return chars.join('');
}

/**
 * Get n-grams from text.
 * @param {string} text Input text.
 * @param {number} n Size of n-grams.
 * @return {Array<string>} Array of n-grams.
 */
function getNgrams(text, n) {
  if (!text || typeof text !== 'string' || n < 1) {
    return [];
  }

  const chars = toCharArray(text);
  const ngrams = [];

  for (let i = 0; i <= chars.length - n; i++) {
    ngrams.push(chars.slice(i, i + n).join(''));
  }

  return ngrams;
}

/**
 * Remove punctuation from text.
 * @param {string} text Input text.
 * @return {string} Text without punctuation.
 */
function removePunctuation(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text.replace(/[^\w\s]/g, '');
}

/**
 * Check if a character is alphanumeric.
 * @param {string} char Character to check.
 * @return {boolean} True if alphanumeric.
 */
function isAlphanumeric(char) {
  if (!char || typeof char !== 'string' || char.length !== 1) {
    return false;
  }

  return /^[a-zA-Z0-9]$/.test(char);
}

/**
 * Check if a character is whitespace.
 * @param {string} char Character to check.
 * @return {boolean} True if whitespace.
 */
function isWhitespace(char) {
  if (!char || typeof char !== 'string' || char.length !== 1) {
    return false;
  }

  return /^\s$/.test(char);
}

/**
 * Exported APIs.
 */
export {
  tokenize,
  getLastPartialWord,
  getContext,
  endsWithWordBoundary,
  normalize,
  toCharArray,
  fromCharArray,
  getNgrams,
  removePunctuation,
  isAlphanumeric,
  isWhitespace
};

export default {
  tokenize,
  getLastPartialWord,
  getContext,
  endsWithWordBoundary,
  normalize,
  toCharArray,
  fromCharArray,
  getNgrams,
  removePunctuation,
  isAlphanumeric,
  isWhitespace
};

