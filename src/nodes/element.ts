import type {FragmentNode} from './fragment.js';
import {ParentNode} from './parent.js';
import {EMPTY} from '../constants.js';
import {xmlEscape} from '@mojojs/util';

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
   * Clone this node.
   */
  clone(): ElementNode {
    const attrs: Record<string, string> = {};
    for (const [name, value] of Object.entries(this.attributes)) {
      attrs[name] = value;
    }

    const el = new ElementNode(this.tagName, this.namespaceUri, attrs);
    const content = this.content;
    el.content = content === null ? null : content.clone();
    this.childNodes.map(node => node.clone()).forEach(node => el.appendChild(node));
    return el;
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

    if (xml === true) {
      if (this.childNodes.length > 0) {
        result.push('>', this._content(options), '</', name, '>');
      } else {
        result.push(' />');
      }
    } else if (EMPTY.has(name) !== true) {
      result.push('>', this._content(options), '</', name, '>');
    } else {
      result.push('>');
    }

    return result.join('');
  }

  _content(options: {xml: boolean}): string {
    const content = this.content;
    return content === null ? this.childNodes.map(node => node.toString(options)).join('') : content.toString(options);
  }
}
