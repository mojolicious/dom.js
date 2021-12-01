import type {Child, Parent} from './types.js';
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
    return this.tree.ancestors().map(node => this._newDOM(node));
  }

  /**
   * Find first descendant element of this element matching the CSS selector.
   */
  at(selector: string): DOM | null {
    const first = new Selector(selector).first(this.tree);
    return first === null ? null : this._newDOM(first);
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
   * Child elements of this element.
   */
  children(): DOM[] {
    return this.tree.childNodes.filter(node => node.nodeType === '#element').map(node => this._newDOM(node as Parent));
  }

  /**
   * Find all descendant elements of this element matching the CSS selector.
   */
  find(selector: string): DOM[] {
    return new Selector(selector).all(this.tree).map(node => this._newDOM(node));
  }

  /**
   * Sibling elements after this element.
   */
  following(): DOM[] {
    return this.tree.siblings().following.map(node => this._newDOM(node));
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
   * Sibling element after this element.
   */
  next(): DOM | null {
    const following = this.tree.siblings().following;
    if (following.length === 0) return null;
    return this._newDOM(following[0]);
  }

  /**
   * Parent of this element.
   */
  parent(): DOM | null {
    const parent = this.tree.parentNode;
    return parent === null ? null : this._newDOM(parent);
  }

  /**
   * Sibling elements before this element.
   */
  preceding(): DOM[] {
    return this.tree.siblings().preceding.map(node => this._newDOM(node));
  }

  /**
   * Sibling element before this element.
   */
  previous(): DOM | null {
    const preceding = this.tree.siblings().preceding;
    if (preceding.length === 0) return null;
    return this._newDOM(preceding[preceding.length - 1]);
  }

  /**
   * Remove this element and its children.
   */
  remove(): void {
    this.tree.detach();
  }

  /**
   * Root node.
   */
  root(): DOM | null {
    const root = this.tree.root();
    const type = root.nodeType;
    return type === '#document' || type === '#fragment' ? this._newDOM(root) : null;
  }

  /**
   * Remove this element while preserving its content.
   */
  strip(): void {
    const tree = this.tree;
    const parent = tree.parentNode;
    if (parent === null) return;

    const children = this.tree.childNodes;
    for (const node of children) {
      node.detach();
      parent.insertBefore(node, tree as Child);
    }
    tree.detach();
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

  _newDOM(tree: Parent): DOM {
    return new DOM(tree, {xml: this._xml});
  }
}
