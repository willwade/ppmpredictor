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
 * @fileoverview Fuzzy matching utilities for error-tolerant prediction.
 *
 * Provides functions for calculating string similarity and filtering
 * predictions based on edit distance and other similarity metrics.
 */

/**
 * Calculate Levenshtein distance between two strings.
 * @param {string} str1 First string.
 * @param {string} str2 Second string.
 * @return {number} Edit distance.
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= len1; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    dp[0][j] = j;
  }

  // Fill the dp table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1, higher is more similar).
 * @param {string} str1 First string.
 * @param {string} str2 Second string.
 * @return {number} Similarity score between 0 and 1.
 */
function similarityScore(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) {return 1.0;}

  const distance = levenshteinDistance(str1, str2);
  return 1.0 - (distance / maxLen);
}

/**
 * Check if a string starts with a prefix (case-insensitive option).
 * @param {string} str The string to check.
 * @param {string} prefix The prefix to look for.
 * @param {boolean} caseSensitive Whether to do case-sensitive matching.
 * @return {boolean} True if str starts with prefix.
 */
function startsWith(str, prefix, caseSensitive = true) {
  if (!caseSensitive) {
    str = str.toLowerCase();
    prefix = prefix.toLowerCase();
  }
  return str.startsWith(prefix);
}

/**
 * Filter and rank strings by similarity to a target string.
 * @param {string} target Target string to match against.
 * @param {Array<string>} candidates Array of candidate strings.
 * @param {number} maxDistance Maximum edit distance to include.
 * @param {number} minSimilarity Minimum similarity score (0-1) to include.
 * @return {Array<{text: string, distance: number, similarity: number}>}
 *         Sorted array of matches with scores.
 */
function fuzzyMatch(target, candidates, maxDistance = 2, minSimilarity = 0.5) {
  const matches = [];
  const targetLength = target.length;

  for (const candidate of candidates) {
    if (Math.abs(candidate.length - targetLength) > maxDistance) {
      continue;
    }

    const distance = levenshteinDistance(target, candidate);
    const maxLen = Math.max(targetLength, candidate.length);
    const similarity = maxLen === 0 ? 1.0 : 1.0 - (distance / maxLen);

    if (distance <= maxDistance && similarity >= minSimilarity) {
      matches.push({
        text: candidate,
        distance: distance,
        similarity: similarity
      });
    }
  }

  // Sort by similarity (descending) then by distance (ascending)
  matches.sort((a, b) => {
    if (Math.abs(a.similarity - b.similarity) > 0.001) {
      return b.similarity - a.similarity;
    }
    return a.distance - b.distance;
  });

  return matches;
}

const qwertyAdjacency = {
  'q': ['w', 'a', 's'],
  'w': ['q', 'e', 'a', 's', 'd'],
  'e': ['w', 'r', 's', 'd', 'f'],
  'r': ['e', 't', 'd', 'f', 'g'],
  't': ['r', 'y', 'f', 'g', 'h'],
  'y': ['t', 'u', 'g', 'h', 'j'],
  'u': ['y', 'i', 'h', 'j', 'k'],
  'i': ['u', 'o', 'j', 'k', 'l'],
  'o': ['i', 'p', 'k', 'l'],
  'p': ['o', 'l'],
  'a': ['q', 'w', 's', 'z', 'x'],
  's': ['q', 'w', 'e', 'a', 'd', 'z', 'x', 'c'],
  'd': ['w', 'e', 'r', 's', 'f', 'x', 'c', 'v'],
  'f': ['e', 'r', 't', 'd', 'g', 'c', 'v', 'b'],
  'g': ['r', 't', 'y', 'f', 'h', 'v', 'b', 'n'],
  'h': ['t', 'y', 'u', 'g', 'j', 'b', 'n', 'm'],
  'j': ['y', 'u', 'i', 'h', 'k', 'n', 'm'],
  'k': ['u', 'i', 'o', 'j', 'l', 'm'],
  'l': ['i', 'o', 'p', 'k'],
  'z': ['a', 's', 'x'],
  'x': ['a', 's', 'd', 'z', 'c'],
  'c': ['s', 'd', 'f', 'x', 'v'],
  'v': ['d', 'f', 'g', 'c', 'b'],
  'b': ['f', 'g', 'h', 'v', 'n'],
  'n': ['g', 'h', 'j', 'b', 'm'],
  'm': ['h', 'j', 'k', 'n']
};

/**
 * Get keyboard adjacency map for QWERTY layout.
 * Used for keyboard-proximity-based error tolerance.
 * @return {Object} Map of characters to their adjacent keys.
 */
function getQwertyAdjacency() {
  return qwertyAdjacency;
}

/**
 * Check if two characters are adjacent on a QWERTY keyboard.
 * @param {string} char1 First character.
 * @param {string} char2 Second character.
 * @return {boolean} True if characters are adjacent.
 */
function areKeysAdjacent(char1, char2, adjacency = qwertyAdjacency) {
  const c1 = char1.toLowerCase();
  const c2 = char2.toLowerCase();

  return adjacency[c1] && adjacency[c1].includes(c2);
}

/**
 * Calculate keyboard-aware edit distance.
 * Substitutions between adjacent keys cost less than non-adjacent keys.
 * @param {string} str1 First string.
 * @param {string} str2 Second string.
 * @return {number} Keyboard-aware edit distance.
 */
function keyboardAwareDistance(str1, str2, adjacency = qwertyAdjacency) {
  const len1 = str1.length;
  const len2 = str2.length;

  const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // Check if keys are adjacent for substitution cost
        const substCost = areKeysAdjacent(str1[i - 1], str2[j - 1], adjacency) ? 0.5 : 1.0;

        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + substCost // substitution
        );
      }
    }
  }

  return dp[len1][len2];
}

/**
 * Exported APIs.
 */
export {
  levenshteinDistance,
  similarityScore,
  startsWith,
  fuzzyMatch,
  getQwertyAdjacency,
  areKeysAdjacent,
  keyboardAwareDistance
};

export default {
  levenshteinDistance,
  similarityScore,
  startsWith,
  fuzzyMatch,
  getQwertyAdjacency,
  areKeysAdjacent,
  keyboardAwareDistance
};
