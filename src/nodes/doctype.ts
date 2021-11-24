import {ChildNode} from './child.js';

/**
 * Docuement type node class.
 */
export class DoctypeNode extends ChildNode {
  name: string;
  readonly nodeType = '#doctype';
  publicId: string;
  systemId: string;

  constructor(name: string, publicId: string, systemId: string) {
    super();
    this.name = name;
    this.publicId = publicId;
    this.systemId = systemId;
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return `<!DOCTYPE ${this.name}>`;
  }
}
