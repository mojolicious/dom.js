import type {Attribute} from '../types.js';
import type {FragmentNode} from './fragment.js';
import {xmlEscape} from '../util.js';
import {ParentNode} from './parent.js';

const EMPTY_HTML_TAGS: Record<string, boolean> = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  menuitem: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true
};

/**
 * Element node class.
 */
export class ElementNode extends ParentNode {
  attrs: Attribute[];
  content: FragmentNode | null = null;
  namespaceUri: string;
  readonly nodeType = '#element';
  tagName: string;

  constructor(tagName: string, namespaceUri: string, attrs: Attribute[]) {
    super();
    this.tagName = tagName;
    this.namespaceUri = namespaceUri;
    this.attrs = attrs;
  }

  /**
   * Copy attributes to this element. Only attributes that are not yet present in this element are copied.
   */
  adoptAttributes(attrs: Attribute[]): void {
    const recipientAttrsMap = [];

    for (const attr of this.attrs) {
      recipientAttrsMap.push(attr.name);
    }

    for (const attr of attrs) {
      if (recipientAttrsMap.indexOf(attr.name) === -1) this.attrs.push(attr);
    }
  }

  /**
   * Remove attribute from this node.
   */
  deleteAttribute(name: string): boolean {
    this.attrs = this.attrs.filter(attr => attr.name !== name);
    return true;
  }

  /**
   * Get attribute names from this node.
   */
  getAttributeNames(): string[] {
    return this.attrs.map(attr => attr.name);
  }

  /**
   * Get attribute value from this node.
   */
  getAttributeValue(name: string): string | null {
    for (const attr of this.attrs) {
      if (attr.name === name) return attr.value;
    }
    return null;
  }

  /**
   * Check if an attribute exists.
   */
  hasAttribute(name: string): boolean {
    for (const attr of this.attrs) {
      if (attr.name === name) return true;
    }
    return false;
  }

  /**
   * Set attribute value for this node.
   */
  setAttributeValue(name: string, value: string): boolean {
    for (const attr of this.attrs) {
      if (attr.name !== name) continue;
      attr.value = value;
      return true;
    }

    this.attrs.push({name, value});

    return true;
  }

  /**
   * Render node to string.
   */
  toString(options = {xml: false}): string {
    const xml = options.xml;
    const result: string[] = [];

    const name = this.tagName;
    result.push('<', name);
    for (const attr of this.attrs) {
      const name = attr.name;
      const value = attr.value;

      if (value === '') {
        result.push(' ', xml === true ? `${name}="${name}"` : name);
      } else {
        result.push(' ', name, '="', xmlEscape(value), '"');
      }
    }

    const children = this.childNodes;
    if (xml === true) {
      if (children.length > 0) {
        result.push('>', children.map(node => node.toString(options)).join(''), '</', name, '>');
      } else {
        result.push(' />');
      }
    } else if (EMPTY_HTML_TAGS[name] !== true) {
      result.push('>', children.map(node => node.toString(options)).join(''), '</', name, '>');
    } else {
      result.push('>');
    }

    return result.join('');
  }
}
