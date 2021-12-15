import {ChildNode} from './child.js';

/**
 * Docuement type node class.
 */
export class DoctypeNode extends ChildNode {
  /**
   * Document type name.
   */
  name: string;
  /**
   * Node type.
   */
  readonly nodeType = '#doctype';
  /**
   * Public ID.
   */
  publicId: string;
  /**
   * System ID.
   */
  systemId: string;

  constructor(name: string, publicId: string, systemId: string) {
    super();
    this.name = name;
    this.publicId = publicId;
    this.systemId = systemId;
  }

  /**
   * Clone this node.
   */
  clone(): DoctypeNode {
    return new DoctypeNode(this.name, this.publicId, this.systemId);
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return `<!DOCTYPE ${this.name}>`;
  }
}
