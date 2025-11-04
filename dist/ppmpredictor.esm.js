function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			var isInstance = false;
      try {
        isInstance = this instanceof a;
      } catch {}
			if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var index_browser$1 = {exports: {}};

var predictor = {};

var ppm_language_model = {};

function assert(condition, message) {
          if (!condition) {
            throw new Error(message || 'Assertion failed');
          }
        }

var assert$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	default: assert
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(assert$1);

var vocabulary = {};

var hasRequiredVocabulary;

function requireVocabulary () {
	if (hasRequiredVocabulary) return vocabulary;
	hasRequiredVocabulary = 1;
	// Copyright 2025 The Google Research Authors.
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
	 * @fileoverview Simple vocabulary abstraction.
	 *
	 * This is used to store symbols and map them to contiguous integers.
	 */

	// Special symbol denoting the root node.
	const rootSymbol = 0;

	// Symbol name of the root symbol, also used for out-of-vocabulary symbols.
	const rootSymbolName = "<R>";

	// The special out-of-vocabulary (OOV) symbol.
	const oovSymbol = "<OOV>";

	/**
	 * Vocabulary of symbols, which is a set of symbols that map one-to-one to
	 * unique integers.
	 * @final
	 */
	class Vocabulary {
	  constructor() {
	    this.symbols_ = Array();
	    this.symbols_.push(rootSymbolName);
	    this.oovSymbol_ = -1;
	  }

	  /**
	   * Adds symbol to the vocabulary returning its unique ID.
	   * @param {string} symbol Symbol to be added.
	   * @return {number} Symbol ID.
	   * @final
	   */
	  addSymbol(symbol) {
	    let pos = this.symbols_.indexOf(symbol);
	    if (pos >= 0) {
	      return pos;
	    }
	    // The current symbol container length is used as a unique ID. Because
	    // the symbol IDs are used to index the array directly, the symbol ID is
	    // assigned before updating the array.
	    const symbol_id = this.symbols_.length;
	    this.symbols_.push(symbol);
	    return symbol_id;
	  }

	  /**
	   * Returns the vocabulary symbol ID if it exists, otherwise maps the supplied
	   * symbol to out-of-vocabulary (OOV) symbol. Note, this method is *only* used
	   * for testing.
	   * @param {string} symbol Symbol to be looked up.
	   * @return {number} Symbol ID.
	   * @final
	   */
	  getSymbolOrOOV(symbol) {
	    let pos = this.symbols_.indexOf(symbol);
	    if (pos >= 0) {
	      return pos;
	    }
	    this.oovSymbol_ = this.addSymbol(oovSymbol);
	    return this.oovSymbol_;
	  }

	  /**
	   * Returns cardinality of the vocabulary.
	   * @return {number} Size.
	   * @final
	   */
	  size() {
	    return this.symbols_.length;
	  }
	}

	/**
	 * Exported APIs.
	 */
	vocabulary.rootSymbol = rootSymbol;
	vocabulary.Vocabulary = Vocabulary;
	return vocabulary;
}

var hasRequiredPpm_language_model;

function requirePpm_language_model () {
	if (hasRequiredPpm_language_model) return ppm_language_model;
	hasRequiredPpm_language_model = 1;
	// Copyright 2025 The Google Research Authors.
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
	 * @fileoverview Prediction by Partial Matching (PPM) language model.
	 *
	 * The original PPM algorithm is described in [1]. This particular
	 * implementation has been inspired by the PPM model used by Dasher, an
	 * Augmentative and alternative communication (AAC) input method developed by
	 * the Inference Group at University of Cambridge. The overview of the system
	 * is provided in [2]. The details of this algorithm, which is different from
	 * the standard PPM, are outlined in general terms in [3]. Please also see [4]
	 * for an excellent overview of various PPM variants.
	 *
	 * References:
	 * -----------
	 *   [1] Cleary, John G. and Witten, Ian H. (1984): “Data Compression Using
	 *       Adaptive Coding and Partial String Matching”, IEEE Transactions on
	 *       Communications, vol. 32, no. 4, pp. 396–402.
	 *   [2] Ward, David J. and Blackwell, Alan F. and MacKay, David J. C. (2000):
	 *       “Dasher - A Data Entry Interface Using Continuous Gestures and
	 *       Language Models”, UIST'00 Proceedings of the 13th annual ACM symposium
	 *       on User interface software and technology, pp. 129–137, November, San
	 *       Diego, USA.
	 *   [3] Cowans, Phil (2005): “Language Modelling In Dasher -- A Tutorial”,
	 *       June, Inference Lab, Cambridge University (presentation).
	 *   [4] Jin Hu Huang and David Powers (2004): "Adaptive Compression-based
	 *       Approach for Chinese Pinyin Input." Proceedings of the Third SIGHAN
	 *       Workshop on Chinese Language Processing, pp. 24--27, Barcelona, Spain,
	 *       ACL.
	 * Please also consult the references in README.md file in this directory.
	 */

	const assert = require$$0;

	const vocab = requireVocabulary();

	/**
	 * Kneser-Ney "-like" smoothing parameters.
	 *
	 * These hardcoded values are copied from Dasher. Please see the documentation
	 * for PPMLanguageModel.getProbs() below for more information.
	 */
	const knAlpha = 0.49;
	const knBeta = 0.77;

	/* Epsilon for sanity checks. */
	const epsilon = 1E-10;

	/**
	 * Node in a search tree, which is implemented as a suffix trie that represents
	 * every suffix of a sequence used during its construction. Please see
	 *   [1] Moffat, Alistair (1990): "Implementing the PPM data compression
	 *       scheme", IEEE Transactions on Communications, vol. 38, no. 11, pp.
	 *       1917--1921.
	 *   [2] Esko Ukknonen (1995): "On-line construction of suffix trees",
	 *       Algorithmica, volume 14, pp. 249--260, Springer, 1995.
	 *   [3] Kennington, C. (2011): "Application of Suffix Trees as an
	 *       Implementation Technique for Varied-Length N-gram Language Models",
	 *       MSc. Thesis, Saarland University.
	 *
	 * @final
	 */
	class Node {
	  constructor() {
	    // Leftmost child node for the current node.
	    this.child_ = null;
	    // Next node.
	    this.next_ = null;
	    // Node in the backoff structure, also known as "vine" structure (see [1]
	    // above) and "suffix link" (see [2] above). The backoff for the given node
	    // points at the node representing the shorter context. For example, if the
	    // current node in the trie represents string "AA" (corresponding to the
	    // branch "[R] -> [A] -> [*A*]" in the trie, where [R] stands for root),
	    // then its backoff points at the node "A" (represented by "[R] ->
	    // [*A*]"). In this case both nodes are in the same branch but they don't
	    // need to be. For example, for the node "B" in the trie path for the string
	    // "AB" ("[R] -> [A] -> [*B*]") the backoff points at the child node of a
	    // different path "[R] -> [*B*]".
	    this.backoff_ = null;
	    // Frequency count for this node. Number of times the suffix symbol stored
	    // in this node was observed.
	    this.count_ = 1;
	    // Symbol that this node stores.
	    this.symbol_ = vocab.rootSymbol;
	  }

	  /**
	   * Finds child of the current node with a specified symbol.
	   * @param {number} symbol Integer symbol.
	   * @return {?Node} Node with the symbol.
	   * @final
	   */
	  findChildWithSymbol(symbol) {
	    let current = this.child_;
	    while (current != null) {
	      if (current.symbol_ == symbol) {
	        return current;
	      }
	      current = current.next_;
	    }
	    return current;
	  }

	  /**
	   * Total number of observations for all the children of this node. This
	   * counts all the events observed in this context.
	   *
	   * Note: This API is used at inference time. A possible alternative that will
	   * speed up the inference is to store the number of children in each node as
	   * originally proposed by Moffat for PPMB in
	   *   Moffat, Alistair (1990): "Implementing the PPM data compression scheme",
	   *   IEEE Transactions on Communications, vol. 38, no. 11, pp. 1917--1921.
	   * This however will increase the memory use of the algorithm which is already
	   * quite substantial.
	   *
	   * @param {!array} exclusionMask Boolean exclusion mask for all the symbols.
	   *                 Can be 'null', in which case no exclusion happens.
	   * @return {number} Total number of observations under this node.
	   * @final
	   */
	  totalChildrenCounts(exclusionMask) {
	    let childNode = this.child_;
	    let count = 0;
	    while (childNode != null) {
	      if (!exclusionMask || !exclusionMask[childNode.symbol_]) {
	        count += childNode.count_;
	      }
	      childNode = childNode.next_;
	    }
	    return count;
	  }
	}

	/**
	 * Handle encapsulating the search context.
	 * @final
	 */
	class Context {
	  /**
	   * Constructor.
	   * @param {?Node} head Head node of the context.
	   * @param {number} order Length of the context.
	   */
	  constructor(head, order) {
	    // Current node.
	    this.head_ = head;
	    // The order corresponding to length of the context.
	    this.order_ = order;
	  }
	}

	/**
	 * Prediction by Partial Matching (PPM) Language Model.
	 * @final
	 */
	class PPMLanguageModel {
	  /**
	   * @param {?Vocabulary} vocab Symbol vocabulary object.
	   * @param {number} maxOrder Maximum length of the context.
	   */
	  constructor(vocab, maxOrder) {
	    this.vocab_ = vocab;
	    assert(this.vocab_.size() > 1,
	           "Expecting at least two symbols in the vocabulary");

	    this.maxOrder_ = maxOrder;
	    this.root_ = new Node();
	    this.rootContext_ = new Context();
	    this.rootContext_.head_ = this.root_;
	    this.rootContext_.order_ = 0;
	    this.numNodes_ = 1;

	    // Exclusion mechanism: Off by default, but can be enabled during the
	    // run-time once the constructed suffix tree contains reliable counts.
	    this.useExclusion_ = false;
	  }

	  /**
	   * Adds symbol to the supplied node.
	   * @param {?Node} node Tree node which to grow.
	   * @param {number} symbol Symbol.
	   * @return {?Node} Node with the symbol.
	   * @final @private
	   */
	  addSymbolToNode_(node, symbol) {
	    let symbolNode = node.findChildWithSymbol(symbol);
	    if (symbolNode != null) {
	      // Update the counts for the given node.  Only updates the counts for
	      // the highest order already existing node for the symbol ('single
	      // counting' or 'update exclusion').
	      symbolNode.count_++;
	    } else {
	      // Symbol does not exist under the given node. Create a new child node
	      // and update the backoff structure for lower contexts.
	      symbolNode = new Node();
	      symbolNode.symbol_ = symbol;
	      symbolNode.next_ = node.child_;
	      node.child_ = symbolNode;
	      this.numNodes_++;
	      if (node == this.root_) {
	        // Shortest possible context.
	        symbolNode.backoff_ = this.root_;
	      } else {
	        assert(node.backoff_ != null, "Expected valid backoff node");
	        symbolNode.backoff_ = this.addSymbolToNode_(node.backoff_, symbol);
	      }
	    }
	    return symbolNode;
	  }

	  /**
	   * Creates new context which is initially empty.
	   * @return {?Context} Context object.
	   * @final
	   */
	  createContext() {
	    return new Context(this.rootContext_.head_, this.rootContext_.order_);
	  }

	  /**
	   * Clones existing context.
	   * @param {?Context} context Existing context object.
	   * @return {?Context} Cloned context object.
	   * @final
	   */
	  cloneContext(context) {
	    return new Context(context.head_, context.order_);
	  }

	  /**
	   * Adds symbol to the supplied context. Does not update the model.
	   * @param {?Context} context Context object.
	   * @param {number} symbol Integer symbol.
	   * @final
	   */
	  addSymbolToContext(context, symbol) {
	    if (symbol <= vocab.rootSymbol) {  // Only add valid symbols.
	      return;
	    }
	    assert(symbol < this.vocab_.size(), "Invalid symbol: " + symbol);
	    while (context.head_ != null) {
	      if (context.order_ < this.maxOrder_) {
	        // Extend the current context.
	        const childNode = context.head_.findChildWithSymbol(symbol);
	        if (childNode != null) {
	          context.head_ = childNode;
	          context.order_++;
	          return;
	        }
	      }
	      // Try to extend the shorter context.
	      context.order_--;
	      context.head_ = context.head_.backoff_;
	    }
	    if (context.head_ == null) {
	      context.head_ = this.root_;
	      context.order_ = 0;
	    }
	  }

	  /**
	   * Adds symbol to the supplied context and updates the model.
	   * @param {?Context} context Context object.
	   * @param {number} symbol Integer symbol.
	   * @final
	   */
	  addSymbolAndUpdate(context, symbol) {
	    if (symbol <= vocab.rootSymbol) {  // Only add valid symbols.
	      return;
	    }
	    assert(symbol < this.vocab_.size(), "Invalid symbol: " + symbol);
	    const symbolNode = this.addSymbolToNode_(context.head_, symbol);
	    assert(symbolNode == context.head_.findChildWithSymbol(symbol));
	    context.head_ = symbolNode;
	    context.order_++;
	    while (context.order_ > this.maxOrder_) {
	      context.head_ = context.head_.backoff_;
	      context.order_--;
	    }
	  }

	  /**
	   * Returns probabilities for all the symbols in the vocabulary given the
	   * context.
	   *
	   * Notation:
	   * ---------
	   *         $x_h$ : Context representing history, $x_{h-1}$ shorter context.
	   *   $n(w, x_h)$ : Count of symbol $w$ in context $x_h$.
	   *      $T(x_h)$ : Total count in context $x_h$.
	   *      $q(x_h)$ : Number of symbols with non-zero counts seen in context
	   *                 $x_h$, i.e. |{w' : c(x_h, w') > 0}|. Alternatively, this
	   *                 represents the number of distinct extensions of history
	   *                 $x_h$ in the training data.
	   *
	   * Standard Kneser-Ney method (aka Absolute Discounting):
	   * ------------------------------------------------------
	   * Subtracting \beta (in [0, 1)) from all counts.
	   *   P_{kn}(w | x_h) = \frac{\max(n(w, x_h) - \beta, 0)}{T(x_h)} +
	   *                     \beta * \frac{q(x_h)}{T(x_h)} * P_{kn}(w | x_{h-1}),
	   * where the second term in summation represents escaping to lower-order
	   * context.
	   *
	   * See: Ney, Reinhard and Kneser, Hermann (1995): “Improved backing-off for
	   * M-gram language modeling”, Proc. of Acoustics, Speech, and Signal
	   * Processing (ICASSP), May, pp. 181–184.
	   *
	   * Modified Kneser-Ney method (Dasher version [3]):
	   * ------------------------------------------------
	   * Introducing \alpha parameter (in [0, 1)) and estimating as
	   *   P_{kn}(w | x_h) = \frac{\max(n(w, x_h) - \beta, 0)}{T(x_h) + \alpha} +
	   *                     \frac{\alpha + \beta * q(x_h)}{T(x_h) + \alpha} *
	   *                     P_{kn}(w | x_{h-1}) .
	   *
	   * Additional details on the above version are provided in Sections 3 and 4
	   * of:
	   *   Steinruecken, Christian and Ghahramani, Zoubin and MacKay, David (2016):
	   *   "Improving PPM with dynamic parameter updates", In Proc. Data
	   *   Compression Conference (DCC-2015), pp. 193--202, April, Snowbird, UT,
	   *   USA. IEEE.
	   *
	   * @param {?Context} context Context symbols.
	   * @return {?array} Array of floating point probabilities corresponding to all
	   *                  the symbols in the vocabulary plus the 0th element
	   *                  representing the root of the tree that should be ignored.
	   * @final
	   */
	  getProbs(context) {
	    // Initialize the initial estimates. Note, we don't use uniform
	    // distribution here.
	    const numSymbols = this.vocab_.size();
	    let probs = new Array(numSymbols);
	    for (let i = 0; i < numSymbols; ++i) {
	      probs[i] = 0.0;
	    }

	    // Initialize the exclusion mask.
	    let exclusionMask = null;
	    if (this.useExclusion_) {
	      exclusionMask = new Array(numSymbols);
	      for (let i = 0; i < numSymbols; ++i) {
	        exclusionMask[i] = false;
	      }
	    }

	    // Estimate the probabilities for all the symbols in the supplied context.
	    // This runs over all the symbols in the context and over all the suffixes
	    // (orders) of the context. If the exclusion mechanism is enabled, the
	    // estimate for a higher-order ngram is fully trusted and is excluded from
	    // further interpolation with lower-order estimates.
	    //
	    // Exclusion mechanism is disabled by default. Enable it with care: it has
	    // been shown to work well on large corpora, but may in theory degrade the
	    // performance on smaller sets (as we observed with default Dasher English
	    // training data).
	    let totalMass = 1.0;
	    let node = context.head_;
	    let gamma = totalMass;
	    while (node != null) {
	      const count = node.totalChildrenCounts(exclusionMask);
	      if (count > 0) {
	        let childNode = node.child_;
	        while (childNode != null) {
	          const symbol = childNode.symbol_;
	          if (!exclusionMask || !exclusionMask[symbol]) {
	            const p = gamma * (childNode.count_ - knBeta) / (count + knAlpha);
	            probs[symbol] += p;
	            totalMass -= p;
	            if (exclusionMask) {
	              exclusionMask[symbol] = true;
	            }
	          }
	          childNode = childNode.next_;
	        }
	      }

	      // Backoff to lower-order context. The $\gamma$ factor represents the
	      // total probability mass after processing the current $n$-th order before
	      // backing off to $n-1$-th order. It roughly corresponds to the usual
	      // interpolation parameter, as used in the literature, e.g. in
	      //   Stanley F. Chen and Joshua Goodman (1999): "An empirical study of
	      //   smoothing techniques for language modeling", Computer Speech and
	      //   Language, vol. 13, pp. 359-–394.
	      //
	      // Note on computing $gamma$:
	      // --------------------------
	      // According to the PPM papers, and in particular the Section 4 of
	      //   Steinruecken, Christian and Ghahramani, Zoubin and MacKay,
	      //   David (2016): "Improving PPM with dynamic parameter updates", In
	      //   Proc. Data Compression Conference (DCC-2015), pp. 193--202, April,
	      //   Snowbird, UT, USA. IEEE,
	      // that describes blending (i.e. interpolation), the second multiplying
	      // factor in the interpolation $\lambda$ for a given suffix node $x_h$ in
	      // the tree is given by
	      //   \lambda(x_h) = \frac{q(x_h) * \beta + \alpha}{T(x_h) + \alpha} .
	      // It can be shown that
	      //   \gamma(x_h) = 1.0 - \sum_{w'}
	      //      \frac{\max(n(w', x_h) - \beta, 0)}{T(x_h) + \alpha} =
	      //      \lambda(x_h)
	      // and, in the update below, the following is equivalent:
	      //   \gamma = \gamma * \gamma(x_h) = totalMass .
	      //
	      // Since gamma *= (numChildren * knBeta + knAlpha) / (count + knAlpha) is
	      // expensive, we assign the equivalent totalMass value to gamma.
	      node = node.backoff_;
	      gamma = totalMass;
	    }
	    assert(totalMass >= 0.0,
	           "Invalid remaining probability mass: " + totalMass);

	    // Count the total number of symbols that should have their estimates
	    // blended with the uniform distribution representing the zero context.
	    // When exclusion mechanism is enabled (by enabling this.useExclusion_)
	    // this number will represent the number of symbols not seen during the
	    // training, otherwise, this number will be equal to total number of
	    // symbols because we always interpolate with the estimates for an empty
	    // context.
	    let numUnseenSymbols = 0;
	    for (let i = 1; i < numSymbols; ++i) {
	      if (!exclusionMask || !exclusionMask[i]) {
	        numUnseenSymbols++;
	      }
	    }

	    // Adjust the probability mass for all the symbols.
	    const remainingMass = totalMass;
	    for (let i = 1; i < numSymbols; ++i) {
	      // Following is estimated according to a uniform distribution
	      // corresponding to the context length of zero.
	      if (!exclusionMask || !exclusionMask[i]) {
	        const p = remainingMass / numUnseenSymbols;
	        probs[i] += p;
	        totalMass -= p;
	      }
	    }
	    let leftSymbols = numSymbols - 1;
	    let newProbMass = 0.0;
	    for (let i = 1; i < numSymbols; ++i) {
	      const p = totalMass / leftSymbols;
	      probs[i] += p;
	      totalMass -= p;
	      newProbMass += probs[i];
	      --leftSymbols;
	    }
	    assert(totalMass == 0.0, "Expected remaining probability mass to be zero!");
	    assert(Math.abs(1.0 - newProbMass) < epsilon);
	    return probs;
	  }

	  /**
	   * Prints the trie to console.
	   * @param {?Node} node Current trie node.
	   * @param {string} indent Indentation prefix.
	   * @final @private
	   */
	  printToConsole_(node, indent) {
	    console.log(indent + "  " + this.vocab_.symbols_[node.symbol_] +
	                "(" + node.symbol_ + ") [" + node.count_ + "]");
	    indent += "  ";
	    let child = node.child_;
	    while (child != null) {
	      this.printToConsole_(child, indent);
	      child = child.next_;
	    }
	  }

	  /**
	   * Prints the trie to console.
	   * @final
	   */
	  printToConsole() {
	    this.printToConsole_(this.root_, "");
	  }
	}

	/**
	 * Exported APIs.
	 */
	ppm_language_model.PPMLanguageModel = PPMLanguageModel;
	return ppm_language_model;
}

var fuzzyMatcher = {};

var hasRequiredFuzzyMatcher;

function requireFuzzyMatcher () {
	if (hasRequiredFuzzyMatcher) return fuzzyMatcher;
	hasRequiredFuzzyMatcher = 1;
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
	          dp[i - 1][j] + 1,      // deletion
	          dp[i][j - 1] + 1,      // insertion
	          dp[i - 1][j - 1] + 1   // substitution
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
	  if (maxLen === 0) return 1.0;
	  
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
	  
	  for (const candidate of candidates) {
	    const distance = levenshteinDistance(target, candidate);
	    const similarity = similarityScore(target, candidate);
	    
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

	/**
	 * Get keyboard adjacency map for QWERTY layout.
	 * Used for keyboard-proximity-based error tolerance.
	 * @return {Object} Map of characters to their adjacent keys.
	 */
	function getQwertyAdjacency() {
	  return {
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
	}

	/**
	 * Check if two characters are adjacent on a QWERTY keyboard.
	 * @param {string} char1 First character.
	 * @param {string} char2 Second character.
	 * @return {boolean} True if characters are adjacent.
	 */
	function areKeysAdjacent(char1, char2) {
	  const adjacency = getQwertyAdjacency();
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
	function keyboardAwareDistance(str1, str2) {
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
	        const substCost = areKeysAdjacent(str1[i - 1], str2[j - 1]) ? 0.5 : 1.0;
	        
	        dp[i][j] = Math.min(
	          dp[i - 1][j] + 1,              // deletion
	          dp[i][j - 1] + 1,              // insertion
	          dp[i - 1][j - 1] + substCost   // substitution
	        );
	      }
	    }
	  }
	  
	  return dp[len1][len2];
	}

	/**
	 * Exported APIs.
	 */
	fuzzyMatcher.levenshteinDistance = levenshteinDistance;
	fuzzyMatcher.similarityScore = similarityScore;
	fuzzyMatcher.startsWith = startsWith;
	fuzzyMatcher.fuzzyMatch = fuzzyMatch;
	fuzzyMatcher.getQwertyAdjacency = getQwertyAdjacency;
	fuzzyMatcher.areKeysAdjacent = areKeysAdjacent;
	fuzzyMatcher.keyboardAwareDistance = keyboardAwareDistance;
	return fuzzyMatcher;
}

var wordTokenizer = {};

var hasRequiredWordTokenizer;

function requireWordTokenizer () {
	if (hasRequiredWordTokenizer) return wordTokenizer;
	hasRequiredWordTokenizer = 1;
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
	wordTokenizer.tokenize = tokenize;
	wordTokenizer.getLastPartialWord = getLastPartialWord;
	wordTokenizer.getContext = getContext;
	wordTokenizer.endsWithWordBoundary = endsWithWordBoundary;
	wordTokenizer.normalize = normalize;
	wordTokenizer.toCharArray = toCharArray;
	wordTokenizer.fromCharArray = fromCharArray;
	wordTokenizer.getNgrams = getNgrams;
	wordTokenizer.removePunctuation = removePunctuation;
	wordTokenizer.isAlphanumeric = isAlphanumeric;
	wordTokenizer.isWhitespace = isWhitespace;
	return wordTokenizer;
}

var hasRequiredPredictor;

function requirePredictor () {
	if (hasRequiredPredictor) return predictor;
	hasRequiredPredictor = 1;
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

	const ppm = requirePpm_language_model();
	const vocab = requireVocabulary();
	const fuzzy = requireFuzzyMatcher();
	const tokenizer = requireWordTokenizer();

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
	predictor.Predictor = Predictor;
	return predictor;
}

var hasRequiredIndex_browser;

function requireIndex_browser () {
	if (hasRequiredIndex_browser) return index_browser$1.exports;
	hasRequiredIndex_browser = 1;
	(function (module) {
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

		const predictorModule = requirePredictor();
		const ppmModule = requirePpm_language_model();
		const vocabModule = requireVocabulary();
		const fuzzyMatcher = requireFuzzyMatcher();
		const wordTokenizer = requireWordTokenizer();

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
		if (module.exports) {
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
	} (index_browser$1));
	return index_browser$1.exports;
}

var index_browserExports = requireIndex_browser();
var index_browser = /*@__PURE__*/getDefaultExportFromCjs(index_browserExports);

export { index_browser as default };
//# sourceMappingURL=ppmpredictor.esm.js.map
