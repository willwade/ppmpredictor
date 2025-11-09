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
  getAvailableCodes,      // Get list of available language codes
  loadFrequencyList,      // Load frequency data for a language (used as lexicon)
  getAvailableLayouts,    // Get list of available keyboard layouts
  loadKeyboard            // Load a specific keyboard layout
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
  predictor: null,              // The PPMPredictor instance
  currentLanguage: null,        // Currently selected language code (e.g., 'en', 'es')
  currentKeyboard: null,        // Currently selected keyboard layout ID
  learnedWords: new Set(),      // Words learned through adaptive mode
  baseLexicon: [],              // Original lexicon from frequency data
  trainingCharCount: 0,         // Total characters used for training
  keyboardLayout: null,         // Current keyboard layout object
  allKeyboardLayouts: []        // All available keyboard layouts
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
  'cy': 'training_welsh_GB.txt'
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
    'sw': 'Swahili', 'sv': 'Swedish', 'tr': 'Turkish', 'cy': 'Welsh'
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

    // Load training text to teach the PPM model character patterns
    // See: https://github.com/willwade/ppmpredictor#training-from-files
    await loadTrainingData(langCode);

    // Create/update the predictor with new language data
    initializePredictor();

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
    const response = await fetch(`../data/training/${filename}`);
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
    maxEditDistance: 2,        // Allow up to 2 character edits (insertions, deletions, substitutions)
    minSimilarity: 0.5,        // Require at least 50% similarity for fuzzy matches
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
  // Validate keyboard data exists
  if (!keyboard || !keyboard.keys) {
    console.warn('No keyboard data - using default QWERTY adjacency');
    return null;
  }

  // Check if keyboard data includes physical position information
  // We need row/col data to calculate which keys are adjacent
  const hasPositionData = keyboard.keys.some(k => k.row !== null && k.row !== undefined);

  if (!hasPositionData) {
    console.warn('Keyboard layout has no position data - using default QWERTY adjacency');
    return null;
  }

  // If we had position data, we would build the adjacency map here
  // Algorithm would be:
  // 1. Group keys by row and column
  // 2. For each key, find neighbors (±1 row, ±1 col)
  // 3. Build map of key -> [adjacent keys]
  console.warn('Position-based adjacency map not yet implemented - using default QWERTY adjacency');
  return null;
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

  if (currentWord.length === 0) {
    document.getElementById('predictions').textContent = 'Start typing a word...';
    return;
  }

  // Get predictions
  const predictions = state.predictor.predictWordCompletion(currentWord);

  // Display predictions with additional info
  displayPredictions(predictions, currentWord);

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
function displayPredictions(predictions, currentWord) {
  const container = document.getElementById('predictions');

  if (predictions.length === 0) {
    container.innerHTML = `<em>No predictions found for "${currentWord}"</em>`;

    // If fuzzy matching is enabled, show a hint
    if (!document.getElementById('fuzzy-toggle').checked) {
      container.innerHTML += '<br><small>💡 Try enabling fuzzy matching to find similar words</small>';
    }
    return;
  }

  // Show predictions with additional metadata
  container.innerHTML = predictions.map((p, index) => {
    const isExactMatch = p.text.toLowerCase().startsWith(currentWord.toLowerCase());
    const badge = isExactMatch ? '' : ' <small>~</small>';
    const rank = index + 1;
    return `<span class="prediction-item" onclick="insertPrediction('${p.text}')">${rank}. ${p.text}${badge}<span class="prob">${(p.probability * 100).toFixed(0)}%</span></span>`;
  }).join('');
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

// Select keyboard layout
async function selectKeyboard(layoutId) {
  if (layoutId === 'linear') {
    state.keyboardLayout = null;
    displayLinearLayout();
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
    updateStatus(`⚠️ Could not load keyboard layout`, 'info');
  }
}

/**
 * Display Linear ABC Layout
 *
 * Shows a simple linear alphabet layout used for switch scanning.
 * This is commonly used in AAC (Augmentative and Alternative Communication)
 * devices where users scan through options sequentially.
 */
function displayLinearLayout() {
  const viz = document.getElementById('keyboard-viz');
  viz.innerHTML = '<strong>Linear ABC Layout (Switch Scanning)</strong><br><br>';
  viz.innerHTML += '<p style="color: #666; font-size: 0.9em; margin-bottom: 10px;">Sequential layout for switch scanning - no adjacency map needed.</p>';
  viz.innerHTML += '<div style="font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; line-height: 2;">';
  viz.innerHTML += 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z<br>';
  viz.innerHTML += '0 1 2 3 4 5 6 7 8 9<br>';
  viz.innerHTML += 'SPACE . , ! ? - \' "';
  viz.innerHTML += '</div>';
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
  // Note: WorldAlphabets keyboard data doesn't include physical positions,
  // so this will return null and we'll use the default QWERTY adjacency
  const adjacencyMap = buildAdjacencyMap(keyboard);

  if (!adjacencyMap) {
    // Show default QWERTY adjacency map
    viz.innerHTML += '<div style="font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 0.85em;">';
    viz.innerHTML += '<div style="margin-bottom: 10px; color: #666;">Using default QWERTY adjacency map for keyboard-aware typo detection.</div>';
    viz.innerHTML += '<div style="margin-bottom: 8px;"><strong>Adjacency Map Format:</strong></div>';
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
    // Display custom adjacency map (if we had position data)
    viz.innerHTML += '<div style="font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 0.85em;">';
    viz.innerHTML += '<div style="margin-bottom: 8px;"><strong>Custom Keyboard Adjacency Map:</strong></div>';
    viz.innerHTML += '<pre style="margin: 0; font-size: 0.8em; line-height: 1.6; max-height: 300px; overflow-y: auto; color: #333;">{\n';

    // Show first 20 entries for brevity
    const entries = Object.entries(adjacencyMap)
      .filter(([char]) => char.match(/[a-z0-9]/i))
      .sort()
      .slice(0, 20);

    for (const [char, adjacent] of entries) {
      const adjacentStr = adjacent.map(c => `'${c}'`).join(', ');
      viz.innerHTML += `  ${char}: [${adjacentStr}],\n`;
    }

    if (Object.keys(adjacencyMap).length > 20) {
      viz.innerHTML += `  ... (${Object.keys(adjacencyMap).length - 20} more keys)\n`;
    }

    viz.innerHTML += '}</pre>';
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

