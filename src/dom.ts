import type {Parent} from './types.js';
import {Selector} from './css.js';
import {HTMLParser} from './html.js';
export * from './util.js';

/**
 * DOM class.
 */
export default class DOM {
  /**
   * DOM tree.
   */
  tree: Parent;

  constructor(input: string | Parent, options: {fragment?: boolean} = {}) {
    // Parse
    if (typeof input === 'string') {
      if (options.fragment === true) {
        this.tree = new HTMLParser().parseFragment(input);
      } else {
        this.tree = new HTMLParser().parse(input);
      }
    }

    // Node
    else {
      this.tree = input;
    }
  }

  /**
   * Find first descendant element of this element matching the CSS selector.
   */
  at(selector: string): DOM | null {
    const first = new Selector(selector).first(this.tree);
    return first === null ? null : new DOM(first);
  }

  /**
   * Find all descendant elements of this element matching the CSS selector.
   */
  find(selector: string): DOM[] {
    return new Selector(selector).all(this.tree).map(node => new DOM(node));
  }

  /**
   * This element's tag name.
   */
  get tag(): string | null {
    const tree = this.tree;
    if (tree.nodeType !== '#element') return null;
    return tree.tagName;
  }

  /**
   * Extract text content from this element only (not including child elements).
   */
  text(): string {
    const tree = this.tree;
    if (tree.nodeType !== '#element') return '';

    const buffer: string[] = [];
    for (const node of tree.childNodes) {
      if (node.nodeType === '#text') {
        buffer.push(node.value);
      }
    }

    return buffer.join('');
  }

  /**
   * Render DOM to HTML.
   */
  toString(): string {
    return this.tree.toString();
  }
}
