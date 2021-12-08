import {SafeString} from '../util.js';
import {xmlEscape} from '../util.js';
import {ChildNode} from './child.js';

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
   * Render node to string.
   */
  toString(): string {
    const value = this.value;
    return value instanceof SafeString ? value.toString() : xmlEscape(value);
  }
}
