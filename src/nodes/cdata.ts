import {ChildNode} from './child.js';

/**
 * CDATA node class.
 */
export class CDATANode extends ChildNode {
  data: string;
  readonly nodeType = '#cdata';

  constructor(data: string) {
    super();
    this.data = data;
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return `<![CDATA[${this.data}]]>`;
  }
}
