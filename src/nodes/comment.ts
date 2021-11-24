import {ChildNode} from './child.js';

/**
 * Comment node class.
 */
export class CommentNode extends ChildNode {
  data: string;
  readonly nodeType = '#comment';

  constructor(data: string) {
    super();
    this.data = data;
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return `<!--${this.data}-->`;
  }
}
