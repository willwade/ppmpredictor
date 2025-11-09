/**
 * Simple assert polyfill for browser environments
 * Mimics Node.js assert module behavior
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

assert.ok = assert;

assert.equal = function(actual, expected, message) {
  if (actual != expected) {
    throw new Error(message || `Expected ${actual} to equal ${expected}`);
  }
};

assert.strictEqual = function(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${actual} to strictly equal ${expected}`);
  }
};

assert.notEqual = function(actual, expected, message) {
  if (actual == expected) {
    throw new Error(message || `Expected ${actual} to not equal ${expected}`);
  }
};

assert.notStrictEqual = function(actual, expected, message) {
  if (actual === expected) {
    throw new Error(message || `Expected ${actual} to not strictly equal ${expected}`);
  }
};

assert.deepEqual = function(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
  }
};

assert.throws = function(fn, message) {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
  }
  if (!threw) {
    throw new Error(message || 'Expected function to throw');
  }
};

export default assert;

