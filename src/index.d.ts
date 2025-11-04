// Type definitions for @willwade/noisy-channel-predictor
// Project: https://github.com/willwade/noisy-channel-correction
// Definitions by: Will Wade <https://github.com/willwade>

/**
 * Configuration options for the predictor.
 */
export interface PredictorConfig {
  /** Maximum context length for PPM (default: 5) */
  maxOrder?: number;
  /** Enable error-tolerant mode (default: false) */
  errorTolerant?: boolean;
  /** Maximum edit distance for fuzzy matching (default: 2) */
  maxEditDistance?: number;
  /** Minimum similarity score 0-1 (default: 0.5) */
  minSimilarity?: number;
  /** Use keyboard-aware distance (default: false) */
  keyboardAware?: boolean;
  /** Case-sensitive matching (default: false) */
  caseSensitive?: boolean;
  /** Maximum number of predictions to return (default: 10) */
  maxPredictions?: number;
  /** Update model as text is entered (default: false) */
  adaptive?: boolean;
  /** Optional word list for word prediction */
  lexicon?: string[];
}

/**
 * Prediction result.
 */
export interface Prediction {
  /** Predicted text */
  text: string;
  /** Probability score (0-1) */
  probability: number;
  /** Edit distance (only in error-tolerant mode) */
  distance?: number;
  /** Similarity score (only in error-tolerant mode) */
  similarity?: number;
}

/**
 * Predictor class providing word and letter prediction.
 */
export class Predictor {
  /**
   * Create a new predictor.
   * @param config Configuration options
   */
  constructor(config?: PredictorConfig);

  /**
   * Train the model on text.
   * @param text Training text
   */
  train(text: string): void;

  /**
   * Reset the prediction context.
   */
  resetContext(): void;

  /**
   * Add text to the current context.
   * @param text Text to add to context
   * @param update Whether to update the model (defaults to config.adaptive)
   */
  addToContext(text: string, update?: boolean): void;

  /**
   * Get character/letter predictions.
   * @param context Optional context string (uses current context if not provided)
   * @returns Array of character predictions
   */
  predictNextCharacter(context?: string): Prediction[];

  /**
   * Get word completion predictions.
   * @param partialWord Partial word to complete
   * @param precedingContext Optional preceding context
   * @returns Array of word predictions
   */
  predictWordCompletion(partialWord: string, precedingContext?: string): Prediction[];

  /**
   * Get current configuration.
   * @returns Current configuration
   */
  getConfig(): PredictorConfig;

  /**
   * Update configuration.
   * @param newConfig Configuration updates
   */
  updateConfig(newConfig: Partial<PredictorConfig>): void;
}

/**
 * PPM Language Model class (for advanced usage).
 */
export class PPMLanguageModel {
  constructor(vocab: Vocabulary, maxOrder: number);
  createContext(): any;
  cloneContext(context: any): any;
  addSymbolToContext(context: any, symbol: number): void;
  addSymbolAndUpdate(context: any, symbol: number): void;
  getProbs(context: any): number[];
  printToConsole(): void;
}

/**
 * Vocabulary class (for advanced usage).
 */
export class Vocabulary {
  constructor();
  addSymbol(symbol: string): number;
  getSymbolOrOOV(symbol: string): number;
  size(): number;
  symbols_: string[];
}

/**
 * Fuzzy matcher utilities.
 */
export namespace fuzzyMatcher {
  /**
   * Calculate Levenshtein distance between two strings.
   */
  function levenshteinDistance(str1: string, str2: string): number;

  /**
   * Calculate similarity score between two strings (0-1).
   */
  function similarityScore(str1: string, str2: string): number;

  /**
   * Check if a string starts with a prefix.
   */
  function startsWith(str: string, prefix: string, caseSensitive?: boolean): boolean;

  /**
   * Filter and rank strings by similarity to a target string.
   */
  function fuzzyMatch(
    target: string,
    candidates: string[],
    maxDistance?: number,
    minSimilarity?: number
  ): Array<{ text: string; distance: number; similarity: number }>;

  /**
   * Get keyboard adjacency map for QWERTY layout.
   */
  function getQwertyAdjacency(): Record<string, string[]>;

  /**
   * Check if two characters are adjacent on a QWERTY keyboard.
   */
  function areKeysAdjacent(char1: string, char2: string): boolean;

  /**
   * Calculate keyboard-aware edit distance.
   */
  function keyboardAwareDistance(str1: string, str2: string): number;
}

/**
 * Word tokenizer utilities.
 */
export namespace wordTokenizer {
  /**
   * Tokenize text into words.
   */
  function tokenize(text: string): string[];

  /**
   * Get the last partial word from text.
   */
  function getLastPartialWord(text: string): string;

  /**
   * Get the context (all words except the last partial word).
   */
  function getContext(text: string): string;

  /**
   * Check if text ends with a word boundary.
   */
  function endsWithWordBoundary(text: string): boolean;

  /**
   * Normalize text for prediction.
   */
  function normalize(text: string, lowercase?: boolean): string;

  /**
   * Split text into characters.
   */
  function toCharArray(text: string): string[];

  /**
   * Join an array of characters into a string.
   */
  function fromCharArray(chars: string[]): string;

  /**
   * Get n-grams from text.
   */
  function getNgrams(text: string, n: number): string[];

  /**
   * Remove punctuation from text.
   */
  function removePunctuation(text: string): string;

  /**
   * Check if a character is alphanumeric.
   */
  function isAlphanumeric(char: string): boolean;

  /**
   * Check if a character is whitespace.
   */
  function isWhitespace(char: string): boolean;
}

/**
 * Create a new predictor instance with the given configuration.
 * @param config Configuration options
 * @returns Predictor instance
 */
export function createPredictor(config?: PredictorConfig): Predictor;

/**
 * Create a predictor with strict mode (exact matching only).
 * @param config Configuration options
 * @returns Predictor instance in strict mode
 */
export function createStrictPredictor(config?: PredictorConfig): Predictor;

/**
 * Create a predictor with error-tolerant mode enabled.
 * @param config Configuration options
 * @returns Predictor instance in error-tolerant mode
 */
export function createErrorTolerantPredictor(config?: PredictorConfig): Predictor;

/**
 * Calculate edit distance between two strings.
 * @param str1 First string
 * @param str2 Second string
 * @returns Edit distance
 */
export function levenshteinDistance(str1: string, str2: string): number;

/**
 * Calculate similarity score between two strings.
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score (0-1)
 */
export function similarityScore(str1: string, str2: string): number;

