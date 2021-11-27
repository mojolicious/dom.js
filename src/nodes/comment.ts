import {ChildNode} from './child.js';

/**
 * Comment node class.
 */
export class CommentNode extends ChildNode {
  value: string;
  readonly nodeType = '#comment';

  constructor(value: string) {
    super();
    this.value = value;
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return `<!--${this.value}-->`;
  }
}
