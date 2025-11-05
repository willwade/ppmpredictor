/**
 * Simple prefix trie with depth-first traversal for prefix listings.
 */

class TrieNode {
  constructor() {
    this.children = new Map();
    this.isWord = false;
  }
}

class PrefixTrie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
    }
    node.isWord = true;
  }

  /**
   * Collect words starting with a prefix up to a maximum count.
   * @param {string} prefix Prefix to search.
   * @param {number} limit Maximum number of words to return.
   * @return {Array<string>} Matching words.
   */
  collect(prefix, limit) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char);
    }

    const results = [];
    const stack = [[node, prefix]];

    while (stack.length > 0 && results.length < limit) {
      const [current, currentPrefix] = stack.pop();
      if (current.isWord) {
        results.push(currentPrefix);
      }

      // Push children in reverse sorted order so results come out alphabetical.
      const childrenEntries = Array.from(current.children.entries());
      childrenEntries.sort((a, b) => b[0].localeCompare(a[0]));
      for (const [char, child] of childrenEntries) {
        stack.push([child, currentPrefix + char]);
      }
    }

    return results;
  }
}

export { PrefixTrie };

