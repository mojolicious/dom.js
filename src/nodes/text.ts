import {xmlEscape} from '../util.js';
import {ChildNode} from './child.js';

/**
 * Text node class.
 */
export class TextNode extends ChildNode {
  readonly nodeType = '#text';
  value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return xmlEscape(this.value);
  }
}
