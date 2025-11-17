/**
 * PPMPredictor Demo Application
 *
 * This demo showcases how to integrate PPMPredictor with WorldAlphabets
 * for multi-language text prediction with keyboard-aware error tolerance.
 *
 * Key features demonstrated:
 * - Multi-language support (24+ languages)
 * - Adaptive learning (model updates as you type)
 * - Keyboard layout selection and visualization
 * - Fuzzy matching for typo tolerance
 * - Real-time statistics tracking
 *
 * Learn more: https://github.com/willwade/ppmpredictor#readme
 */

// Import WorldAlphabets functions for language and keyboard data
// WorldAlphabets provides frequency lists and keyboard layouts for 100+ languages
// See: https://github.com/AceCentre/WorldAlphabets
import {
  getAvailableCodes, // Get list of available language codes
  loadFrequencyList, // Load frequency data for a language (used as lexicon)
  getAvailableLayouts, // Get list of available keyboard layouts
  loadKeyboard // Load a specific keyboard layout
} from 'worldalphabets';

// Import PPMPredictor factory function
// See API docs: https://github.com/willwade/ppmpredictor#api-reference
import { createPredictor } from '../src/index.js';
const PPMPredictor = { createPredictor };

/**
 * Application State
 *
 * Centralized state management for the demo application.
 * This pattern makes it easy to track and update all application data.
 */
const state = {
  predictor: null, // The PPMPredictor instance
  currentLanguage: null, // Currently selected language code (e.g., 'en', 'es')
  currentKeyboard: null, // Currently selected keyboard layout ID
  learnedWords: new Set(), // Words learned through adaptive mode
  baseLexicon: [], // Original lexicon from frequency data
  trainingCharCount: 0, // Total characters used for training
  keyboardLayout: null, // Current keyboard layout object
  allKeyboardLayouts: [] // All available keyboard layouts
};

/**
 * Language Training File Mapping
 *
 * Maps language codes to their corresponding training text files.
 * Training files contain sample text in each language to teach the PPM model
 * the character patterns and word structures of that language.
 *
 * See: https://github.com/willwade/ppmpredictor#training-from-files
 */
const LANGUAGE_TRAINING_MAP = {
  'sq': 'training_albanian_SQ.txt',
  'eu': 'training_basque_ES.txt',
  'bn': 'training_bengali_BD.txt',
  'cs': 'training_czech_CS.txt',
  'da': 'training_danish_DK.txt',
  'nl': 'training_dutch_NL.txt',
  'en': 'training_english_GB.txt',
  'fi': 'training_finnish_FI.txt',
  'fr': 'training_french_FR.txt',
  'de': 'training_german_DE.txt',
  'el': 'training_greek_GR.txt',
  'he': 'training_hebrew_IL.txt',
  'hu': 'training_hungarian_HU.txt',
  'it': 'training_italian_IT.txt',
  'mn': 'training_mongolian_MN.txt',
  'fa': 'training_persian_IR.txt',
  'pl': 'training_polish_PL.txt',
  'pt': 'training_portuguese_BR.txt',
  'ru': 'training_russian_RU.txt',
  'es': 'training_spanish_ES.txt',
  'sw': 'training_swahili_KE.txt',
  'sv': 'training_swedish_SE.txt',
  'tr': 'training_turkish_TR.txt',
  'cy': 'training_welsh_GB.txt',
  'tok': 'training_tokipona_TOK.txt'
};

/**
 * Example Phrases by Language
 *
 * Provides sample text for each language to help users test the predictor.
 * These phrases demonstrate the character set and common patterns for each language.
 */
const LANGUAGE_EXAMPLES = {
  'en': 'Hello, how are you today?',
  'es': 'Hola, ¿cómo estás hoy?',
  'fr': 'Bonjour, comment allez-vous?',
  'de': 'Hallo, wie geht es dir?',
  'it': 'Ciao, come stai oggi?',
  'pt': 'Olá, como você está hoje?',
  'nl': 'Hallo, hoe gaat het met je?',
  'sv': 'Hej, hur mår du idag?',
  'da': 'Hej, hvordan har du det?',
  'fi': 'Hei, mitä kuuluu?',
  'pl': 'Cześć, jak się masz?',
  'cs': 'Ahoj, jak se máš?',
  'ru': 'Привет, как дела?',
  'el': 'Γεια σου, πώς είσαι;',
  'tr': 'Merhaba, nasılsın?',
  'hu': 'Helló, hogy vagy?',
  'he': 'שלום, מה שלומך?',
  'sq': 'Përshëndetje, si jeni?',
  'cy': 'Helo, sut wyt ti?',
  'eu': 'Kaixo, zer moduz zaude?',
  'sw': 'Habari, u hali gani?',
  'fa': 'سلام، حال شما چطور است؟',
  'bn': 'হ্যালো, আপনি কেমন আছেন?',
  'mn': 'Сайн уу, та яаж байна?'
};

/**
 * Initialize the Demo Application
 *
 * This is the main entry point that sets up the entire demo.
 * It loads language data, keyboard layouts, and sets up event listeners.
 *
 * Steps:
 * 1. Load available languages from WorldAlphabets
 * 2. Load available keyboard layouts
 * 3. Set up UI event listeners
 * 4. Auto-detect browser language and select it
 * 5. Initialize the predictor for the selected language
 */
async function init() {
  console.log('🚀 Initializing PPMPredictor Demo');

  try {
    // Verify PPMPredictor library is loaded
    if (typeof PPMPredictor === 'undefined') {
      throw new Error('PPMPredictor library not loaded');
    }

    // Load available languages from WorldAlphabets
    // This populates the language dropdown with all supported languages
    await loadLanguages();

    // Load all available keyboard layouts
    // These will be filtered per-language when a language is selected
    await loadKeyboardLayouts();

    // Set up all UI event listeners (input, buttons, etc.)
    setupEventListeners();

    // Auto-detect browser language and use it as default
    // Falls back to English if browser language is not available
    const browserLang = navigator.language.split('-')[0].toLowerCase(); // e.g., "en-US" -> "en"
    const langSelect = document.getElementById('language-select');
    const availableCodes = Array.from(langSelect.options).map(opt => opt.value);
    const defaultLang = availableCodes.includes(browserLang) ? browserLang : 'en';

    // Initialize with the detected/default language
    langSelect.value = defaultLang;
    await selectLanguage(defaultLang);

    updateStatus('✅ Ready! Select a language and start typing.', 'success');

  } catch (error) {
    console.error('Initialization error:', error);
    updateStatus(`❌ Error: ${error.message}`, 'error');
  }
}

// Load available languages from WorldAlphabets
async function loadLanguages() {
  const codes = await getAvailableCodes();
  const select = document.getElementById('language-select');
  select.innerHTML = '';

  // Filter to languages we have training data for
  const availableLanguages = codes.filter(code => LANGUAGE_TRAINING_MAP[code]);

  // Add language options
  const languageNames = {
    'sq': 'Albanian', 'eu': 'Basque', 'bn': 'Bengali', 'cs': 'Czech',
    'da': 'Danish', 'nl': 'Dutch', 'en': 'English', 'fi': 'Finnish',
    'fr': 'French', 'de': 'German', 'el': 'Greek', 'he': 'Hebrew',
    'hu': 'Hungarian', 'it': 'Italian', 'mn': 'Mongolian', 'fa': 'Persian',
    'pl': 'Polish', 'pt': 'Portuguese', 'ru': 'Russian', 'es': 'Spanish',
    'sw': 'Swahili', 'sv': 'Swedish', 'tr': 'Turkish', 'cy': 'Welsh', 'tok': 'Toki Pona'
  };

  for (const code of availableLanguages.sort()) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${languageNames[code] || code} (${code})`;
    select.appendChild(option);
  }

  console.log(`📚 Loaded ${availableLanguages.length} languages`);
}

// Load available keyboard layouts
async function loadKeyboardLayouts() {
  const layouts = await getAvailableLayouts();
  state.allKeyboardLayouts = layouts; // Store all layouts
  console.log(`⌨️ Loaded ${layouts.length} keyboard layouts`);
}

// Update keyboard selector based on current language
function updateKeyboardSelector(langCode) {
  const select = document.getElementById('keyboard-select');

  // Filter layouts for this language (layouts typically start with language code)
  const langLayouts = state.allKeyboardLayouts.filter(layout =>
    layout.startsWith(langCode + '-') || layout.startsWith(langCode.toUpperCase() + '-')
  );

  // Keep the linear option
  select.innerHTML = '<option value="linear">Linear ABC (Switch Scanning)</option>';

  // Add filtered keyboard layouts
  for (const layout of langLayouts.sort()) {
    const option = document.createElement('option');
    option.value = layout;
    // Make the name more readable (remove language prefix)
    const displayName = layout.replace(new RegExp(`^${langCode}-`, 'i'), '').replace(/-/g, ' ');
    option.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    select.appendChild(option);
  }

  // If no layouts found for this language, show a message
  if (langLayouts.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = `No keyboard layouts available for ${langCode}`;
    option.disabled = true;
    select.appendChild(option);
  }

  // Select linear by default and display it
  select.value = 'linear';
  state.keyboardLayout = buildLinearKeyboard();
  displayLinearLayout();
}

/**
 * Select a Language and Load Its Resources
 *
 * This function is called when the user selects a language from the dropdown.
 * It performs several steps to set up the predictor for that language:
 *
 * 1. Load frequency list from WorldAlphabets (used as lexicon)
 * 2. Load training text file for that language
 * 3. Create/update the PPMPredictor with the new data
 * 4. Update keyboard layouts available for that language
 *
 * See: https://github.com/willwade/ppmpredictor#word-completion
 */
async function selectLanguage(langCode) {
  updateStatus(`Loading ${langCode}...`, 'info');
  state.currentLanguage = langCode;

  try {
    // Update keyboard layouts to show only those available for this language
    updateKeyboardSelector(langCode);

    // Load frequency list from WorldAlphabets
    // This provides a list of words sorted by frequency of use in the language
    const freqData = await loadFrequencyList(langCode);

    // Use the top 5000 most frequent words as our lexicon
    // The lexicon is used for word completion predictions
    state.baseLexicon = freqData.tokens.slice(0, 5000);
    console.log(`📖 Loaded ${state.baseLexicon.length} words for ${langCode}`);

    // Create predictor if it doesn't exist, or add language as a corpus
    if (!state.predictor) {
      // First time: create predictor with this language as default
      initializePredictor();
    } else {
      // Add this language as a new corpus with its own lexicon
      // This enables multilingual support with per-corpus lexicons
      const trainingText = await getTrainingText(langCode);
      if (trainingText) {
        state.predictor.addTrainingCorpus(langCode, trainingText, {
          description: `${langCode} language corpus`,
          lexicon: state.baseLexicon
        });
        state.predictor.useCorpora([langCode]);
        console.log(`📚 Added ${langCode} corpus with ${state.baseLexicon.length} words`);
      } else {
        // No training data, just update default corpus
        initializePredictor();
      }
    }

    // Load training text to teach the PPM model character patterns
    // This must happen AFTER creating the predictor so bigrams are learned
    // See: https://github.com/willwade/ppmpredictor#training-from-files
    await loadTrainingData(langCode);

    // Update statistics display
    updateStats();

    // Update placeholder with example text in the selected language
    const textInput = document.getElementById('text-input');
    const example = LANGUAGE_EXAMPLES[langCode] || 'Start typing...';
    textInput.placeholder = `Try: "${example}"`;

    updateStatus(`✅ Loaded ${langCode} successfully!`, 'success');

  } catch (error) {
    console.error(`Error loading ${langCode}:`, error);
    updateStatus(`⚠️ Could not load all resources for ${langCode}. Using basic setup.`, 'info');

    // Fallback: create predictor with empty lexicon if loading fails
    state.baseLexicon = [];
    initializePredictor();
    updateStats();
  }
}

/**
 * Get training text for a language (helper function)
 * Returns null if no training data available
 */
async function getTrainingText(langCode) {
  const filename = LANGUAGE_TRAINING_MAP[langCode];
  if (!filename) {
    return null;
  }

  try {
    const response = await fetch(`data/training/${filename}`);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Load Training Data from File
 *
 * Loads a text file containing sample text in the selected language.
 * This text is used to train the PPM (Prediction by Partial Matching) model
 * to understand character patterns and word structures in that language.
 *
 * Training improves:
 * - Character-level predictions (next letter suggestions)
 * - Context awareness (understanding common word sequences)
 * - Language-specific patterns (accents, special characters, etc.)
 *
 * See: https://github.com/willwade/ppmpredictor#training-from-files
 */
async function loadTrainingData(langCode) {
  const filename = LANGUAGE_TRAINING_MAP[langCode];
  if (!filename) {
    console.log(`No training data for ${langCode}`);
    return;
  }

  try {
    const response = await fetch(`data/training/${filename}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    state.trainingCharCount = text.length;

    // Train the predictor
    if (state.predictor) {
      state.predictor.train(text);
      console.log(`📚 Trained on ${text.length} characters`);
    }

  } catch (error) {
    console.warn(`Could not load training data: ${error.message}`);
    state.trainingCharCount = 0;
  }
}

/**
 * Initialize/Update the PPMPredictor
 *
 * Creates a new predictor instance with the current configuration settings.
 * This function is called whenever:
 * - A new language is selected
 * - Configuration toggles are changed (fuzzy, keyboard-aware, adaptive)
 * - The lexicon is updated (learned words added/cleared)
 *
 * Configuration options explained:
 * - lexicon: List of valid words for word completion
 * - errorTolerant: Enable fuzzy matching for typo tolerance
 * - maxEditDistance: Maximum character edits allowed (2 = up to 2 typos)
 * - minSimilarity: Minimum similarity score 0-1 for fuzzy matches
 * - keyboardAware: Consider physical key proximity for typos
 * - adaptive: Update model as user types (learn from input)
 * - maxPredictions: Maximum number of predictions to return
 *
 * See: https://github.com/willwade/ppmpredictor#createpredictorconfig
 */
function initializePredictor() {
  // Get current UI settings
  const fuzzyEnabled = document.getElementById('fuzzy-toggle').checked;
  const keyboardAware = document.getElementById('keyboard-aware-toggle').checked;
  const adaptive = document.getElementById('adaptive-toggle').checked;

  // Combine base lexicon (from frequency data) with learned words (from adaptive mode)
  // This allows the predictor to suggest both common words and user-specific vocabulary
  const fullLexicon = [...state.baseLexicon, ...Array.from(state.learnedWords)];

  // Build configuration object
  // See all options: https://github.com/willwade/ppmpredictor#api-reference
  const config = {
    lexicon: fullLexicon,
    errorTolerant: fuzzyEnabled,
    maxEditDistance: 2, // Allow up to 2 character edits (insertions, deletions, substitutions)
    minSimilarity: 0.5, // Require at least 50% similarity for fuzzy matches
    keyboardAware: keyboardAware,
    adaptive: adaptive,
    maxPredictions: 10
  };

  // Add custom keyboard adjacency map if keyboard-aware mode is enabled
  // Note: Currently returns null because WorldAlphabets doesn't provide position data
  // Falls back to built-in QWERTY adjacency map
  if (keyboardAware && state.keyboardLayout) {
    config.keyboardAdjacencyMap = buildAdjacencyMap(state.keyboardLayout);
  }

  // Create the predictor instance
  state.predictor = PPMPredictor.createPredictor(config);

  // Re-train the model if we have training data loaded
  // Training teaches the PPM model character patterns in the language
  if (state.trainingCharCount > 0 && state.currentLanguage) {
    loadTrainingData(state.currentLanguage);
  }

  console.log('🔮 Predictor created with config:', config);
}

/**
 * Build Keyboard Adjacency Map
 *
 * Attempts to build a custom adjacency map from keyboard layout data.
 * The adjacency map defines which keys are physically close to each other.
 *
 * Format: { 'a': ['q', 'w', 's', 'z'], 'b': ['v', 'g', 'h', 'n'], ... }
 *
 * Note: WorldAlphabets keyboard data doesn't include physical position data
 * (row, col, pos are all null), so this currently returns null and the
 * predictor uses its built-in QWERTY adjacency map as a fallback.
 *
 * See: https://github.com/willwade/ppmpredictor#keyboard-aware-mode
 */
function buildAdjacencyMap(keyboard) {
  // Check if keyboard already has a pre-built adjacency map (e.g., linear layout)
  if (keyboard && keyboard.adjacencyMap) {
    console.log('ℹ️ Using pre-built adjacency map from keyboard layout');
    return keyboard.adjacencyMap;
  }

  // Validate keyboard data exists
  if (!keyboard || !keyboard.keys || !Array.isArray(keyboard.keys)) {
    console.log('ℹ️ No keyboard data - using built-in QWERTY adjacency map');
    return null;
  }

  // Check if keyboard data includes physical position information
  // WorldAlphabets provides row, col, and pos data for each key
  const hasPositionData = keyboard.keys.some(k => {
    return k && typeof k === 'object' &&
           typeof k.row === 'number' &&
           typeof k.col === 'number';
  });

  if (!hasPositionData) {
    console.log('ℹ️ Keyboard layout has no position data - using built-in QWERTY adjacency map');
    return null;
  }

  console.log(`🎹 Building custom adjacency map from ${keyboard.name || keyboard.id} layout...`);

  // Build adjacency map from position data
  const adjacencyMap = {};

  // Create a position lookup: "row,col" -> key
  const positionMap = new Map();
  for (const key of keyboard.keys) {
    if (typeof key.row === 'number' && typeof key.col === 'number') {
      const posKey = `${key.row},${key.col}`;
      positionMap.set(posKey, key);
    }
  }

  // For each key, find adjacent keys (within 1 row and 1 col)
  for (const key of keyboard.keys) {
    if (typeof key.row !== 'number' || typeof key.col !== 'number') {
      continue;
    }

    // Get the base character for this key (unshifted)
    // WorldAlphabets stores characters in the 'legends' object
    // legends.base is the base (unshifted) character
    let baseChar = null;
    if (key.legends && typeof key.legends === 'object') {
      baseChar = key.legends.base;
    }

    if (!baseChar || typeof baseChar !== 'string' || baseChar.length !== 1) {
      continue; // Skip special keys, modifiers, etc.
    }

    const adjacent = [];
    const row = key.row;
    const col = key.col;

    // Check all 8 surrounding positions
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        // Skip the key itself
        if (r === row && c === col) {
          continue;
        }

        const posKey = `${r},${c}`;
        const adjacentKey = positionMap.get(posKey);

        if (adjacentKey) {
          let adjacentChar = null;
          if (adjacentKey.legends && typeof adjacentKey.legends === 'object') {
            adjacentChar = adjacentKey.legends.base;
          }

          if (adjacentChar && typeof adjacentChar === 'string' && adjacentChar.length === 1 && adjacentChar !== baseChar) {
            adjacent.push(adjacentChar.toLowerCase());
          }
        }
      }
    }

    // Store adjacency for both lowercase and uppercase
    if (adjacent.length > 0) {
      adjacencyMap[baseChar.toLowerCase()] = [...new Set(adjacent)]; // Remove duplicates
      adjacencyMap[baseChar.toUpperCase()] = [...new Set(adjacent.map(c => c.toUpperCase()))];
    }
  }

  const keyCount = Object.keys(adjacencyMap).length;
  console.log(`✅ Built adjacency map with ${keyCount} keys from keyboard layout`);

  return Object.keys(adjacencyMap).length > 0 ? adjacencyMap : null;
}

// Set up event listeners
function setupEventListeners() {
  // Language selection
  document.getElementById('language-select').addEventListener('change', async (e) => {
    await selectLanguage(e.target.value);
  });

  // Keyboard layout selection
  document.getElementById('keyboard-select').addEventListener('change', async (e) => {
    await selectKeyboard(e.target.value);
  });

  // Toggle switches
  document.getElementById('fuzzy-toggle').addEventListener('change', () => {
    initializePredictor();
  });

  document.getElementById('keyboard-aware-toggle').addEventListener('change', () => {
    initializePredictor();
  });

  document.getElementById('adaptive-toggle').addEventListener('change', () => {
    initializePredictor();
  });

  document.getElementById('next-word-toggle').addEventListener('change', () => {
    // Update predictions when toggled
    const input = document.getElementById('text-input');
    if (input.value) {
      input.dispatchEvent(new Event('input'));
    }
  });

  // Text input
  document.getElementById('text-input').addEventListener('input', handleTextInput);

  // Clear learned words
  document.getElementById('clear-learned').addEventListener('click', clearLearnedWords);

  // Custom language data
  document.getElementById('apply-custom-data').addEventListener('click', applyCustomData);
  document.getElementById('reset-custom-data').addEventListener('click', resetCustomData);

  // Insert example text
  document.getElementById('insert-example').addEventListener('click', () => {
    const example = LANGUAGE_EXAMPLES[state.currentLanguage] || 'Hello, how are you?';
    document.getElementById('text-input').value = example;
    document.getElementById('text-input').dispatchEvent(new Event('input'));
  });

  // Clear text
  document.getElementById('clear-text').addEventListener('click', () => {
    document.getElementById('text-input').value = '';
    document.getElementById('predictions').textContent = 'Predictions will appear here as you type...';
  });
}

// Handle text input and show predictions
function handleTextInput(e) {
  const text = e.target.value;

  if (!state.predictor || text.length === 0) {
    document.getElementById('predictions').textContent = 'Predictions will appear here as you type...';
    return;
  }

  // Get the last word being typed
  const words = text.split(/\s+/);
  const currentWord = words[words.length - 1];
  const previousWord = words.length > 1 ? words[words.length - 2] : null;

  // Check if next-word prediction is enabled
  const nextWordEnabled = document.getElementById('next-word-toggle').checked;

  // Determine what type of predictions to show
  let completionPredictions = [];
  let nextWordPredictions = [];

  if (currentWord.length === 0) {
    // User just finished a word (ended with space)
    if (nextWordEnabled && previousWord && previousWord.length > 0) {
      // Show next-word predictions
      nextWordPredictions = state.predictor.predictNextWord(previousWord, 10);
      displayPredictions([], currentWord, nextWordPredictions, previousWord);
    } else {
      document.getElementById('predictions').textContent = 'Start typing a word...';
    }
  } else {
    // User is typing a word - show completion predictions
    completionPredictions = state.predictor.predictWordCompletion(currentWord);

    // Optionally also show next-word predictions if enabled
    if (nextWordEnabled && previousWord && previousWord.length > 0) {
      nextWordPredictions = state.predictor.predictNextWord(previousWord, 5);
    }

    displayPredictions(completionPredictions, currentWord, nextWordPredictions, previousWord);
  }

  // If adaptive learning is enabled, learn from completed words
  if (document.getElementById('adaptive-toggle').checked && words.length > 1) {
    const completedWord = words[words.length - 2];
    if (completedWord.length > 2 && !state.learnedWords.has(completedWord) && !state.baseLexicon.includes(completedWord.toLowerCase())) {
      state.learnedWords.add(completedWord.toLowerCase());
      updateLearnedWords();
      updateStats();
      // Rebuild predictor with new word
      initializePredictor();
    }
  }
}

// Display predictions
function displayPredictions(completionPredictions, currentWord, nextWordPredictions = [], previousWord = null) {
  const container = document.getElementById('predictions');
  let html = '';

  // Show word completion predictions
  if (completionPredictions && completionPredictions.length > 0) {
    html += '<div style="margin-bottom: 15px;">';
    html += '<strong style="color: #667eea; display: block; margin-bottom: 8px;">📝 Complete: "' + currentWord + '"</strong>';
    html += completionPredictions.map((p, index) => {
      const isExactMatch = p.text.toLowerCase().startsWith(currentWord.toLowerCase());
      const badge = isExactMatch ? '' : ' <small>~</small>';
      const rank = index + 1;
      return `<span class="prediction-item" onclick="insertPrediction('${p.text}')">${rank}. ${p.text}${badge}<span class="prob">${(p.probability * 100).toFixed(0)}%</span></span>`;
    }).join('');
    html += '</div>';
  }

  // Show next-word predictions
  if (nextWordPredictions && nextWordPredictions.length > 0) {
    html += '<div>';
    html += '<strong style="color: #764ba2; display: block; margin-bottom: 8px;">🔮 After "' + previousWord + '":</strong>';
    html += nextWordPredictions.map((p, index) => {
      const rank = index + 1;
      return `<span class="prediction-item" onclick="insertPrediction('${p.text}')" style="background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);">${rank}. ${p.text}<span class="prob">${(p.probability * 100).toFixed(0)}%</span></span>`;
    }).join('');
    html += '</div>';
  }

  // If no predictions at all
  if (html === '') {
    if (currentWord && currentWord.length > 0) {
      container.innerHTML = `<em>No predictions found for "${currentWord}"</em>`;
      // If fuzzy matching is disabled, show a hint
      if (!document.getElementById('fuzzy-toggle').checked) {
        container.innerHTML += '<br><small>💡 Try enabling fuzzy matching to find similar words</small>';
      }
    } else {
      container.innerHTML = '<em>Start typing a word...</em>';
    }
  } else {
    container.innerHTML = html;
  }
}

// Insert prediction into text input
window.insertPrediction = function(word) {
  const input = document.getElementById('text-input');
  const text = input.value;
  const words = text.split(/\s+/);
  words[words.length - 1] = word;
  input.value = words.join(' ') + ' ';
  input.focus();

  // Trigger input event to update predictions
  input.dispatchEvent(new Event('input'));
};

/**
 * Build Linear Keyboard Layout
 *
 * Creates a linear ABC layout for switch scanning where each character
 * is adjacent to the previous and next character in sequence.
 * This is commonly used in AAC devices for sequential scanning.
 *
 * Returns a keyboard object with adjacency map where:
 * - 'a' is adjacent to ['b']
 * - 'b' is adjacent to ['a', 'c']
 * - 'c' is adjacent to ['b', 'd']
 * etc.
 */
function buildLinearKeyboard() {
  // Define the linear sequence (alphabet + numbers + common punctuation)
  const sequence = 'abcdefghijklmnopqrstuvwxyz0123456789 .,!?\'-"';

  // Build adjacency map
  const adjacencyMap = {};

  for (let i = 0; i < sequence.length; i++) {
    const char = sequence[i];
    const adjacent = [];

    // Add previous character (if exists)
    if (i > 0) {
      adjacent.push(sequence[i - 1]);
    }

    // Add next character (if exists)
    if (i < sequence.length - 1) {
      adjacent.push(sequence[i + 1]);
    }

    // Store for both lowercase and uppercase
    adjacencyMap[char] = adjacent;
    if (char.match(/[a-z]/)) {
      adjacencyMap[char.toUpperCase()] = adjacent.map(c => c.toUpperCase());
    }
  }

  console.log(`📐 Built linear adjacency map with ${Object.keys(adjacencyMap).length} keys`);

  // Return a keyboard-like object
  return {
    id: 'linear',
    name: 'Linear ABC Layout (Switch Scanning)',
    keys: [], // No physical keys
    adjacencyMap: adjacencyMap // Custom adjacency map
  };
}

// Select keyboard layout
async function selectKeyboard(layoutId) {
  if (layoutId === 'linear') {
    // Build linear adjacency map for switch scanning
    state.keyboardLayout = buildLinearKeyboard();
    displayLinearLayout();

    // Update predictor if keyboard-aware is enabled
    if (document.getElementById('keyboard-aware-toggle').checked) {
      initializePredictor();
    }
    return;
  }

  try {
    const keyboard = await loadKeyboard(layoutId);
    state.keyboardLayout = keyboard;
    displayKeyboardLayout(keyboard);

    // Update predictor if keyboard-aware is enabled
    if (document.getElementById('keyboard-aware-toggle').checked) {
      initializePredictor();
    }

  } catch (error) {
    console.error('Error loading keyboard:', error);
    updateStatus('⚠️ Could not load keyboard layout', 'info');
  }
}

/**
 * Display Linear ABC Layout
 *
 * Shows a simple linear alphabet layout used for switch scanning.
 * This is commonly used in AAC (Augmentative and Alternative Communication)
 * devices where users scan through options sequentially.
 *
 * Each character is adjacent to the previous and next character in the sequence.
 */
function displayLinearLayout() {
  const viz = document.getElementById('keyboard-viz');
  viz.innerHTML = '<strong>Linear ABC Layout (Switch Scanning)</strong><br><br>';

  // Show the linear sequence
  viz.innerHTML += '<div style="font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; line-height: 2; margin-bottom: 15px;">';
  viz.innerHTML += '<div style="color: #666; font-size: 0.9em; margin-bottom: 10px;">Sequential layout for switch scanning:</div>';
  viz.innerHTML += 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z<br>';
  viz.innerHTML += '0 1 2 3 4 5 6 7 8 9<br>';
  viz.innerHTML += 'SPACE . , ! ? - \' "';
  viz.innerHTML += '</div>';

  // Show the adjacency map
  if (state.keyboardLayout && state.keyboardLayout.adjacencyMap) {
    const adjacencyMap = state.keyboardLayout.adjacencyMap;

    viz.innerHTML += '<div style="font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 0.85em;">';
    viz.innerHTML += '<div style="margin-bottom: 10px; padding: 10px; background: #d4edda; border-left: 3px solid #28a745; font-size: 0.9em;">';
    viz.innerHTML += '<strong>✅ Linear Adjacency Map Built!</strong><br>Each character is adjacent to its neighbors in the sequence.';
    viz.innerHTML += '</div>';
    viz.innerHTML += '<div style="margin-bottom: 8px;"><strong>Adjacency Map (first 15 characters):</strong></div>';
    viz.innerHTML += '<pre style="margin: 0; font-size: 0.8em; line-height: 1.6; max-height: 300px; overflow-y: auto; color: #333;">{\n';

    // Show first 15 letter entries
    const entries = Object.entries(adjacencyMap)
      .filter(([char]) => char.match(/[a-z]/))
      .sort()
      .slice(0, 15);

    for (const [char, adjacent] of entries) {
      const adjacentStr = adjacent.map(c => `'${c}'`).join(', ');
      viz.innerHTML += `  ${char}: [${adjacentStr}],\n`;
    }

    const totalKeys = Object.keys(adjacencyMap).filter(k => k.match(/[a-z]/)).length;
    if (totalKeys > 15) {
      viz.innerHTML += `  ... (${totalKeys - 15} more letters)\n`;
    }

    viz.innerHTML += '}</pre>';
    viz.innerHTML += '<div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-left: 3px solid #2196f3; font-size: 0.85em;">';
    viz.innerHTML += '<strong>💡 How it works:</strong> In linear scanning, each character is only adjacent to the previous ';
    viz.innerHTML += 'and next character in the sequence. This helps with typo detection when users accidentally select ';
    viz.innerHTML += 'the wrong character during sequential scanning.';
    viz.innerHTML += '</div>';
    viz.innerHTML += '</div>';
  }
}

/**
 * Display Keyboard Layout Adjacency Map
 *
 * Shows the adjacency map used for keyboard-aware error tolerance.
 * The adjacency map defines which keys are physically close to each other,
 * allowing the predictor to better handle typos where nearby keys are pressed.
 *
 * For example, on QWERTY:
 * - 'a' is adjacent to ['q', 'w', 's', 'z']
 * - Typing "heklo" (k instead of l) is more likely than "hezlo" (z instead of l)
 *
 * See: https://github.com/willwade/ppmpredictor#keyboard-aware-mode
 */
function displayKeyboardLayout(keyboard) {
  const viz = document.getElementById('keyboard-viz');

  // Validate keyboard data
  if (!keyboard || !keyboard.keys || keyboard.keys.length === 0) {
    viz.innerHTML = '<p>No keyboard data available</p>';
    return;
  }

  // Display keyboard name
  viz.innerHTML = `<strong>${keyboard.name || keyboard.id || 'Keyboard Layout'}</strong><br><br>`;

  // Try to build adjacency map from keyboard data
  // WorldAlphabets provides row/col position data for each key
  const adjacencyMap = buildAdjacencyMap(keyboard);

  if (!adjacencyMap) {
    // Show default QWERTY adjacency map
    viz.innerHTML += '<div style="font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 0.85em;">';
    viz.innerHTML += '<div style="margin-bottom: 10px; color: #666;">Using built-in QWERTY adjacency map for keyboard-aware typo detection.</div>';
    viz.innerHTML += '<div style="margin-bottom: 8px;"><strong>Default Adjacency Map (QWERTY):</strong></div>';
    viz.innerHTML += '<pre style="margin: 0; font-size: 0.8em; line-height: 1.6; color: #333;">{\n';
    viz.innerHTML += '  a: [\'q\', \'w\', \'s\', \'z\'],     // Keys adjacent to \'a\'\n';
    viz.innerHTML += '  b: [\'v\', \'g\', \'h\', \'n\'],     // Keys adjacent to \'b\'\n';
    viz.innerHTML += '  c: [\'x\', \'d\', \'f\', \'v\'],     // Keys adjacent to \'c\'\n';
    viz.innerHTML += '  d: [\'s\', \'e\', \'r\', \'f\', \'c\', \'x\'],\n';
    viz.innerHTML += '  e: [\'w\', \'r\', \'d\', \'s\'],\n';
    viz.innerHTML += '  ...\n';
    viz.innerHTML += '}</pre>';
    viz.innerHTML += '<div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-left: 3px solid #2196f3; font-size: 0.85em;">';
    viz.innerHTML += '<strong>💡 How it works:</strong> When keyboard-aware mode is enabled, the predictor considers ';
    viz.innerHTML += 'physical key proximity when matching typos. A typo using an adjacent key (like "heklo" for "hello") ';
    viz.innerHTML += 'is weighted more favorably than a random typo.';
    viz.innerHTML += '</div>';
    viz.innerHTML += '</div>';
  } else {
    // Display custom adjacency map built from keyboard position data
    viz.innerHTML += '<div style="font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 0.85em;">';
    viz.innerHTML += '<div style="margin-bottom: 10px; padding: 10px; background: #d4edda; border-left: 3px solid #28a745; font-size: 0.9em;">';
    viz.innerHTML += `<strong>✅ Custom Adjacency Map Built!</strong><br>Generated from ${keyboard.name || keyboard.id} physical key positions.`;
    viz.innerHTML += '</div>';
    viz.innerHTML += '<div style="margin-bottom: 8px;"><strong>Adjacency Map (first 20 keys):</strong></div>';
    viz.innerHTML += '<pre style="margin: 0; font-size: 0.8em; line-height: 1.6; max-height: 300px; overflow-y: auto; color: #333;">{\n';

    // Show first 20 entries for brevity (lowercase only)
    const entries = Object.entries(adjacencyMap)
      .filter(([char]) => char.match(/[a-z0-9]/))
      .sort()
      .slice(0, 20);

    for (const [char, adjacent] of entries) {
      const adjacentStr = adjacent.map(c => `'${c}'`).join(', ');
      viz.innerHTML += `  ${char}: [${adjacentStr}],\n`;
    }

    const totalKeys = Object.keys(adjacencyMap).filter(k => k.match(/[a-z0-9]/)).length;
    if (totalKeys > 20) {
      viz.innerHTML += `  ... (${totalKeys - 20} more keys)\n`;
    }

    viz.innerHTML += '}</pre>';
    viz.innerHTML += '<div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-left: 3px solid #2196f3; font-size: 0.85em;">';
    viz.innerHTML += '<strong>💡 Layout-specific detection:</strong> This custom map reflects the actual physical layout of ';
    viz.innerHTML += `${keyboard.name || keyboard.id}, providing more accurate typo detection for this specific keyboard.`;
    viz.innerHTML += '</div>';
    viz.innerHTML += '</div>';
  }
}

// Update learned words display
function updateLearnedWords() {
  const container = document.getElementById('learned-words');

  if (state.learnedWords.size === 0) {
    container.innerHTML = '<em>No learned words yet. Enable adaptive learning and start typing!</em>';
    return;
  }

  container.innerHTML = Array.from(state.learnedWords)
    .map(word => `<span class="word-tag">${word}<span class="remove" onclick="removeLearnedWord('${word}')">×</span></span>`)
    .join('');
}

// Remove a learned word
window.removeLearnedWord = function(word) {
  state.learnedWords.delete(word);
  updateLearnedWords();
  updateStats();
  initializePredictor(); // Rebuild predictor without this word
};

// Clear all learned words
function clearLearnedWords() {
  state.learnedWords.clear();
  updateLearnedWords();
  updateStats();
  initializePredictor();
}

// Update statistics display
function updateStats() {
  document.getElementById('stat-lexicon').textContent = state.baseLexicon.length;
  document.getElementById('stat-learned').textContent = state.learnedWords.size;
  document.getElementById('stat-training').textContent = state.trainingCharCount.toLocaleString();

  // Update bigram statistics if predictor exists
  if (state.predictor) {
    const bigramStats = state.predictor.getBigramStats();
    document.getElementById('stat-bigrams').textContent = bigramStats.uniqueBigrams.toLocaleString();
  } else {
    document.getElementById('stat-bigrams').textContent = '0';
  }
}

// Update status message
function updateStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
}

// Apply custom language data
function applyCustomData() {
  const lexiconText = document.getElementById('custom-lexicon').value.trim();
  const trainingText = document.getElementById('custom-training').value.trim();

  if (!lexiconText && !trainingText) {
    updateStatus('⚠️ Please provide custom lexicon or training text', 'info');
    return;
  }

  try {
    // Parse lexicon (one word per line)
    if (lexiconText) {
      const words = lexiconText.split('\n')
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0);
      state.baseLexicon = words;
      updateStatus(`✅ Loaded ${words.length} custom words`, 'success');
    }

    // Train on custom text
    if (trainingText) {
      state.trainingCharCount = trainingText.length;
      if (state.predictor) {
        state.predictor.train(trainingText);
      }
      updateStatus(`✅ Trained on ${trainingText.length} custom characters`, 'success');
    }

    // Rebuild predictor with custom data
    initializePredictor();
    updateStats();

  } catch (error) {
    console.error('Error applying custom data:', error);
    updateStatus(`❌ Error: ${error.message}`, 'error');
  }
}

// Reset to default language data
async function resetCustomData() {
  document.getElementById('custom-lexicon').value = '';
  document.getElementById('custom-training').value = '';

  // Reload the current language
  await selectLanguage(state.currentLanguage);
  updateStatus('✅ Reset to default language data', 'success');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

