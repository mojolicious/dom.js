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
  /**
   * Attributes.
   */
  attributes: Record<string, string>;
  /**
   * Node content.
   */
  content: FragmentNode | null = null;
  /**
   * Namespace URI.
   */
  namespaceUri: string;
  /**
   * Node type.
   */
  readonly nodeType = '#element';
  /**
   * Tag name.
   */
  tagName: string;

  constructor(tagName: string, namespaceUri: string, attrs: Record<string, string>) {
    super();
    this.tagName = tagName;
    this.namespaceUri = namespaceUri;
    this.attributes = attrs;
  }

  /**
   * Copy attributes to this element. Only attributes that are not yet present in this element are copied.
   */
  adoptAttributes(attrs: Array<{name: string; value: string}>): void {
    for (const attr of attrs) {
      if (this.attributes[attr.name] === undefined) this.attributes[attr.name] = attr.value;
    }
  }

  /**
   * Render node to string.
   */
  toString(options = {xml: false}): string {
    const xml = options.xml;
    const result: string[] = [];

    const name = this.tagName;
    result.push('<', name);
    for (const [name, value] of Object.entries(this.attributes)) {
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
