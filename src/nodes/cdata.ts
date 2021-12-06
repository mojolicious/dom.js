import {ChildNode} from './child.js';

/**
 * CDATA node class.
 */
export class CDATANode extends ChildNode {
  /**
   * CDATA value
   */
  value: string;
  /**
   * Node type.
   */
  readonly nodeType = '#cdata';

  constructor(value: string) {
    super();
    this.value = value;
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return `<![CDATA[${this.value}]]>`;
  }
}
