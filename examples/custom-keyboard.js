/**
 * Demonstrates building a keyboard adjacency map from a WorldAlphabets layout
 * and passing it into the predictor for keyboard-aware fuzzy matching.
 *
 * Run with:
 *   npm install worldalphabets
 *   node examples/custom-keyboard.js
 */

import { createErrorTolerantPredictor } from '../src/index.js';
let worldalphabets;
try {
  worldalphabets = await import('worldalphabets');
} catch {
  console.error('This example requires the optional dependency `worldalphabets`.');
  console.error('Install it locally with: npm install worldalphabets');
  process.exit(1);
}

const {
  getAvailableLayouts,
  loadKeyboard,
  getUnicode,
  extractLayers
} = worldalphabets;

/**
 * Build an adjacency map from a keyboard layout.
 * For simplicity, we treat keys that share a row or column neighbour as adjacent
 * using the physical arrangement metadata.
 *
 * @param {Object} keyboard Layout object from worldalphabets.
 * @return {Record<string, string[]>} adjacency map.
 */
function buildAdjacencyMap(keyboard) {
  const adjacency = {};

  // Group keys by row/column coordinates provided by the layout metadata.
  for (const key of keyboard.keys) {
    if (!key.position || !key.labels) {continue;}

    const normalized = (key.labels.base || '').toLowerCase();
    if (!normalized || normalized.length !== 1) {continue;}

    const neighbours = [];

    for (const candidate of keyboard.keys) {
      if (candidate === key || !candidate.position || !candidate.labels) {continue;}
      const candidateChar = (candidate.labels.base || '').toLowerCase();
      if (!candidateChar || candidateChar.length !== 1) {continue;}

      const rowDiff = Math.abs(candidate.position.row - key.position.row);
      const colDiff = Math.abs(candidate.position.column - key.position.column);

      if (rowDiff <= 1 && colDiff <= 1) {
        neighbours.push(candidateChar);
      }
    }

    adjacency[normalized] = neighbours;
  }

  return adjacency;
}

async function main() {
  const layouts = await getAvailableLayouts();
  console.log('Available layouts (first 5):', layouts.slice(0, 5));

  const layoutId = 'fr-french-standard-azerty';
  const keyboard = await loadKeyboard(layoutId);
  console.log(`Loaded layout: ${layoutId}`);
  console.log('First key Unicode:', getUnicode(keyboard.keys[1], 'base'));

  const layers = extractLayers(keyboard, ['base', 'shift']);
  console.log('Shift layer example for Digit1:', layers.shift.Digit1);

  const adjacency = buildAdjacencyMap(keyboard);
  const predictor = createErrorTolerantPredictor({
    lexicon: ['bonjour', 'bonsoir', 'salut', 'merci'],
    maxEditDistance: 2,
    keyboardAware: true,
    keyboardAdjacencyMap: adjacency
  });

  console.log('Predictions for typo near AZERTY layout ("bonjor")');
  const predictions = predictor.predictWordCompletion('bonjor');
  console.log(predictions.slice(0, 5));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
