import {ChildNode} from './child.js';

/**
 * Processing instruction node class.
 */
export class PINode extends ChildNode {
  /**
   * Processing Instruction value.
   */
  value: string;
  /**
   * Node type.
   */
  readonly nodeType = '#pi';

  constructor(value: string) {
    super();
    this.value = value;
  }

  /**
   * Clone this node.
   */
  clone(): PINode {
    return new PINode(this.value);
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return `<?${this.value}?>`;
  }
}
