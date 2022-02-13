import {ChildNode} from './child.js';
import {SafeString, xmlEscape} from '@mojojs/template';

/**
 * Text node class.
 */
export class TextNode extends ChildNode {
  /**
   * Node type.
   */
  readonly nodeType = '#text';
  /**
   * Text value.
   */
  value: string | SafeString;

  constructor(value: string | SafeString) {
    super();
    this.value = value;
  }

  /**
   * Clone this node.
   */
  clone(): TextNode {
    return new TextNode(this.value);
  }

  /**
   * Render node to string.
   */
  toString(): string {
    const value = this.value;
    return value instanceof SafeString ? value.toString() : xmlEscape(value);
  }
}
