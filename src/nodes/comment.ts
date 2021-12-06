import {ChildNode} from './child.js';

/**
 * Comment node class.
 */
export class CommentNode extends ChildNode {
  /**
   * Comment value.
   */
  value: string;
  /**
   * Node type.
   */
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
