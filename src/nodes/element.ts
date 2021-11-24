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
   * Get attribute value from this node.
   */
  getAttributeValue(name: string): string | null {
    for (const attr of this.attrs) {
      if (attr.name === name) return attr.value;
    }
    return null;
  }

  /**
   * Render node to string.
   */
  toString(): string {
    const result: string[] = [];

    const name = this.tagName;
    result.push('<', name);
    for (const attr of this.attrs) {
      result.push(' ', attr.name, '="', xmlEscape(attr.value), '"');
    }
    result.push('>');

    if (EMPTY_HTML_TAGS[name] !== true) {
      result.push(this.childNodes.map(node => node.toString()).join(''), '</', name, '>');
    }

    return result.join('');
  }
}
