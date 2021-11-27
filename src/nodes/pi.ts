import {ChildNode} from './child.js';

/**
 * Processing instruction node class.
 */
export class PINode extends ChildNode {
  value: string;
  readonly nodeType = '#pi';

  constructor(value: string) {
    super();
    this.value = value;
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return `<?${this.value}?>`;
  }
}
