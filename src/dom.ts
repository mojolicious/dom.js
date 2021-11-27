import type {Parent} from './types.js';
import {Selector} from './css.js';
import {HTMLParser} from './html.js';
import {XMLParser} from './xml.js';
export * from './util.js';

type AttributeProxy = Record<string, string | null>;

/**
 * HTML/XML DOM API class.
 */
export default class DOM {
  /**
   * DOM tree.
   */
  tree: Parent;
  _attr: AttributeProxy | undefined;
  _xml: boolean;

  constructor(input: string | Parent, options: {fragment?: boolean; xml?: boolean} = {}) {
    const xml = (this._xml = options.xml ?? false);

    // Parse
    if (typeof input === 'string') {
      if (xml === true) {
        this.tree = new XMLParser().parse(input);
      } else if (options.fragment === true) {
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
   * Ancestor elements of this element.
   */
  ancestors(): DOM[] {
    return this.tree.ancestors().map(node => new DOM(node, {xml: this._xml}));
  }

  /**
   * Find first descendant element of this element matching the CSS selector.
   */
  at(selector: string): DOM | null {
    const first = new Selector(selector).first(this.tree);
    return first === null ? null : new DOM(first, {xml: this._xml});
  }

  /**
   * This element's attributes.
   */
  get attr(): AttributeProxy {
    if (this._attr === undefined) {
      this._attr = new Proxy(this.tree, {
        deleteProperty: function (target: Parent, name: string): boolean {
          return target.nodeType === '#element' ? target.deleteAttribute(name) : false;
        },
        get: function (target: Parent, name: string): string | null {
          return target.nodeType === '#element' ? target.getAttributeValue(name) : null;
        },
        getOwnPropertyDescriptor: function (): Record<string, boolean> {
          return {enumerable: true, configurable: true};
        },
        ownKeys: function (target: Parent): string[] {
          return target.nodeType === '#element' ? target.getAttributeNames() : [];
        },
        set: function (target: Parent, name: string, value: string): boolean {
          return target.nodeType === '#element' ? target.setAttributeValue(name, value) : false;
        }
      }) as any as AttributeProxy;
    }

    return this._attr;
  }

  /**
   * Find all descendant elements of this element matching the CSS selector.
   */
  find(selector: string): DOM[] {
    return new Selector(selector).all(this.tree).map(node => new DOM(node, {xml: this._xml}));
  }

  /**
   * Check if this element matches the CSS selector.
   */
  matches(selector: string): boolean {
    const tree = this.tree;
    if (tree.nodeType !== '#element') return false;
    return new Selector(selector).matches(tree);
  }

  /**
   * This element's tag name.
   */
  get tag(): string {
    const tree = this.tree;
    if (tree.nodeType !== '#element') return '';
    return tree.tagName;
  }

  set tag(name: string) {
    const tree = this.tree;
    if (tree.nodeType !== '#element') return;
    tree.tagName = name;
  }

  /**
   * Extract text content from this element only (not including child elements).
   */
  text(): string {
    const tree = this.tree;
    if (tree.nodeType !== '#element') return '';

    const buffer: string[] = [];
    for (const node of tree.childNodes) {
      const type = node.nodeType;
      if (type === '#text' || type === '#cdata') buffer.push(node.value);
    }

    return buffer.join('');
  }

  /**
   * Render DOM to HTML or XML.
   */
  toString(options = {xml: this._xml}): string {
    return this.tree.toString(options);
  }
}
