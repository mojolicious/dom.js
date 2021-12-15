import {DoctypeNode} from './doctype.js';
import {ParentNode} from './parent.js';

export class DocumentNode extends ParentNode {
  /**
   * Document mode.
   */
  mode = 'no-quirks';
  /**
   * Node type.
   */
  readonly nodeType = '#document';

  /**
   * Clone this node.
   */
  clone(): DocumentNode {
    const doc = new DocumentNode();
    doc.mode = this.mode;
    this.childNodes.map(node => node.clone()).forEach(node => doc.appendChild(node));
    return doc;
  }

  /**
   * Sets the document type.
   */
  setDocumentType(name: string, publicId: string, systemId: string): void {
    let doctypeNode: DoctypeNode | null = null;

    for (const child of this.childNodes) {
      if (child.nodeType === '#doctype') {
        doctypeNode = child;
        break;
      }
    }

    if (doctypeNode !== null) {
      doctypeNode.name = name;
      doctypeNode.publicId = publicId;
      doctypeNode.systemId = systemId;
    } else {
      this.appendChild(new DoctypeNode(name, publicId, systemId));
    }
  }
}
