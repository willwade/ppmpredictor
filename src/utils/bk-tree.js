/**
 * BK-tree implementation for approximate string matching.
 *
 * Nodes are stored using Levenshtein distance as the metric. Each node keeps a
 * map of distance -> child node, allowing near-logarithmic search when the
 * triangle inequality holds (as it does for edit distance).
 */

import { levenshteinDistance } from './fuzzy-matcher.js';

class BKNode {
  constructor(term) {
    this.term = term;
    this.children = new Map(); // distance => BKNode
  }
}

class BKTree {
  constructor(distanceFn = levenshteinDistance) {
    this.root = null;
    this.distanceFn = distanceFn;
  }

  isEmpty() {
    return this.root === null;
  }

  insert(term) {
    if (!term) {
      return;
    }

    if (!this.root) {
      this.root = new BKNode(term);
      return;
    }

    let current = this.root;
    while (true) {
      const distance = this.distanceFn(term, current.term);
      if (distance === 0) {
        return; // Term already exists
      }

      const child = current.children.get(distance);
      if (child) {
        current = child;
      } else {
        current.children.set(distance, new BKNode(term));
        return;
      }
    }
  }

  /**
   * Find all terms within maxDistance of the query.
   * @param {string} query Search term.
   * @param {number} maxDistance Inclusive distance threshold.
   * @return {Array<{ term: string, distance: number }>}
   */
  search(query, maxDistance) {
    if (!this.root || maxDistance < 0) {
      return [];
    }

    const results = [];
    const stack = [this.root];

    while (stack.length > 0) {
      const node = stack.pop();
      const distance = this.distanceFn(query, node.term);
      if (distance <= maxDistance) {
        results.push({ term: node.term, distance });
      }

      const lower = distance - maxDistance;
      const upper = distance + maxDistance;

      for (const [edgeDistance, child] of node.children.entries()) {
        if (edgeDistance >= lower && edgeDistance <= upper) {
          stack.push(child);
        }
      }
    }

    return results;
  }
}

export { BKTree };

