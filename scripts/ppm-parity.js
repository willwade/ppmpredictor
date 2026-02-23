#!/usr/bin/env node
/**
 * PPM parity harness for JS model.
 *
 * Generates deterministic fingerprints from probability vectors while training
 * and testing against Dasher rewrite text corpora. Can optionally compare
 * against a saved reference produced by an earlier run.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

import { PPMLanguageModel, Vocabulary } from '../src/index.js';

const DEFAULT_TRAIN = '';
const DEFAULT_TEST = '';

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx < 0 || idx + 1 >= process.argv.length) {
    return fallback;
  }
  return process.argv[idx + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function parseIntArg(flag, fallback) {
  const value = Number.parseInt(getArg(flag, String(fallback)), 10);
  return Number.isNaN(value) ? fallback : value;
}

// 32-bit FNV-1a hash for deterministic parity checks.
function fnv1aUpdate(hash, value) {
  let h = hash;
  h ^= value >>> 0;
  h = Math.imul(h, 0x01000193);
  return h >>> 0;
}

function fingerprintProbs(probs) {
  let hash = 0x811c9dc5;
  for (let i = 1; i < probs.length; i++) {
    const scaled = Math.round(probs[i] * 1e12);
    hash = fnv1aUpdate(hash, i);
    hash = fnv1aUpdate(hash, scaled);
  }
  return hash >>> 0;
}

function symbolFromChar(char) {
  if (char >= 'A' && char <= 'Z') {
    return char;
  }
  if (char >= 'a' && char <= 'z') {
    return char.toUpperCase();
  }
  return null;
}

async function readSymbols(filePath, limit) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const symbols = [];
  const stream = fs.createReadStream(absolutePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    for (const ch of line) {
      const symbol = symbolFromChar(ch);
      if (symbol !== null) {
        symbols.push(symbol);
        if (symbols.length >= limit) {
          rl.close();
          stream.destroy();
          return symbols;
        }
      }
    }
  }
  return symbols;
}

function createModel(options) {
  const vocabulary = new Vocabulary();
  const symbolIds = {};
  for (let i = 0; i < 26; i++) {
    const symbol = String.fromCharCode(65 + i);
    symbolIds[symbol] = vocabulary.addSymbol(symbol);
  }
  const model = new PPMLanguageModel(vocabulary, options.maxOrder, {
    alpha: options.alpha,
    beta: options.beta,
    useExclusion: options.useExclusion,
    updateExclusion: options.updateExclusion,
    maxNodes: options.maxNodes
  });

  return { model, symbolIds };
}

function runPhase(label, symbols, model, symbolIds, mode, sampleEvery) {
  const context = model.createContext();
  const samples = [];
  let aggregateHash = 0x811c9dc5;

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const id = symbolIds[symbol];
    if (mode === 'train') {
      model.addSymbolAndUpdate(context, id);
    } else {
      model.addSymbolToContext(context, id);
    }
    const probs = model.getProbs(context);
    const localHash = fingerprintProbs(probs);
    aggregateHash = fnv1aUpdate(aggregateHash, localHash);

    if ((i + 1) % sampleEvery === 0 || i === symbols.length - 1) {
      samples.push({
        phase: label,
        index: i + 1,
        hash: localHash >>> 0
      });
    }
  }

  return {
    phase: label,
    symbols: symbols.length,
    aggregateHash: aggregateHash >>> 0,
    samples
  };
}

function loadReference(referencePath) {
  if (!referencePath) {
    return null;
  }
  const absolutePath = path.resolve(referencePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Reference file not found: ${absolutePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function compareReference(result, reference) {
  if (!reference) {
    return { ok: true, mismatches: [] };
  }
  const mismatches = [];

  const phases = ['train', 'test'];
  for (const phase of phases) {
    const current = result[phase];
    const expected = reference[phase];
    if (!expected) {
      mismatches.push(`${phase}: missing in reference`);
      continue;
    }
    if (current.aggregateHash !== expected.aggregateHash) {
      mismatches.push(
        `${phase}: aggregateHash mismatch ${current.aggregateHash} != ${expected.aggregateHash}`
      );
    }
    const length = Math.min(current.samples.length, expected.samples.length);
    for (let i = 0; i < length; i++) {
      if (current.samples[i].hash !== expected.samples[i].hash) {
        mismatches.push(
          `${phase}: sample#${i} (index ${current.samples[i].index}) hash mismatch ` +
          `${current.samples[i].hash} != ${expected.samples[i].hash}`
        );
        break;
      }
    }
  }

  return { ok: mismatches.length === 0, mismatches };
}

async function main() {
  const trainPath = getArg('--train', DEFAULT_TRAIN);
  const testPath = getArg('--test', DEFAULT_TEST);
  const trainLimit = parseIntArg('--train-limit', 500000);
  const testLimit = parseIntArg('--test-limit', 500000);
  const sampleEvery = parseIntArg('--sample-every', 5000);

  const options = {
    maxOrder: parseIntArg('--max-order', 5),
    alpha: Number.parseFloat(getArg('--alpha', '0.49')),
    beta: Number.parseFloat(getArg('--beta', '0.77')),
    useExclusion: getArg('--use-exclusion', 'true') !== 'false',
    updateExclusion: getArg('--update-exclusion', 'true') !== 'false',
    maxNodes: parseIntArg('--max-nodes', 0)
  };

  const referencePath = getArg('--reference', '');
  const writeReference = getArg('--write-reference', '');

  if (!trainPath || !testPath) {
    throw new Error(
      'Missing --train or --test path.\n' +
      'Example: npm run parity:ppm -- --train /path/to/trainText.txt --test /path/to/testText.txt'
    );
  }

  const [trainSymbols, testSymbols] = await Promise.all([
    readSymbols(trainPath, trainLimit),
    readSymbols(testPath, testLimit)
  ]);

  const { model, symbolIds } = createModel(options);
  const train = runPhase('train', trainSymbols, model, symbolIds, 'train', sampleEvery);
  const test = runPhase('test', testSymbols, model, symbolIds, 'test', sampleEvery);

  const result = {
    options,
    train,
    test,
    stats: model.getStats()
  };

  if (writeReference) {
    fs.writeFileSync(path.resolve(writeReference), JSON.stringify(result, null, 2));
  }

  const reference = referencePath ? loadReference(referencePath) : null;
  const comparison = compareReference(result, reference);
  result.comparison = comparison;

  console.log(JSON.stringify(result, null, 2));
  if (!comparison.ok && !hasFlag('--allow-mismatch')) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
