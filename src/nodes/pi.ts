import {ChildNode} from './child.js';

/**
 * Processing instruction node class.
 */
export class PINode extends ChildNode {
  data: string;
  readonly nodeType = '#pi';

  constructor(data: string) {
    super();
    this.data = data;
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return `<?${this.data}?>`;
  }
}
