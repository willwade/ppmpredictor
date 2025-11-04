// Rollup configuration for building browser bundles
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

// Simple assert polyfill for browsers
const assertPolyfill = {
  name: 'assert-polyfill',
  resolveId(id) {
    if (id === 'assert') return id;
    return null;
  },
  load(id) {
    if (id === 'assert') {
      return `
        export default function assert(condition, message) {
          if (!condition) {
            throw new Error(message || 'Assertion failed');
          }
        }
      `;
    }
    return null;
  }
};

export default [
  // Browser-friendly UMD build (unminified)
  {
    input: 'src/index.browser.js',
    output: {
      name: 'PPMPredictor',
      file: 'dist/ppmpredictor.js',
      format: 'umd',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      assertPolyfill, // Polyfill assert for browsers
      resolve({ browser: true }), // Resolve node_modules with browser field
      commonjs() // Convert CommonJS to ES6
    ]
  },

  // Browser-friendly UMD build (minified)
  {
    input: 'src/index.browser.js',
    output: {
      name: 'PPMPredictor',
      file: 'dist/ppmpredictor.min.js',
      format: 'umd',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      assertPolyfill,
      resolve({ browser: true }),
      commonjs(),
      terser() // Minify
    ]
  },

  // ES module build (for modern bundlers)
  {
    input: 'src/index.browser.js',
    output: {
      file: 'dist/ppmpredictor.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      assertPolyfill,
      resolve({ browser: true }),
      commonjs()
    ]
  }
];

