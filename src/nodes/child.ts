import type {Child, Parent} from '../types.js';

/**
 * Base class for nodes that might have parents.
 */
export class ChildNode {
  nodeType = '#none';
  parentNode: Parent | null = null;

  /**
   * Ancestor elements of this node.
   */
  ancestors(): Parent[] {
    const ancestors: Parent[] = [];

    let current = this.parentNode;
    while (current !== null && current.nodeType === '#element') {
      ancestors.push(current);
      current = current.parentNode;
    }

    return ancestors;
  }

  /**
   * Remove this node from its parent node.
   */
  detach(): void {
    if (this.parentNode !== null) {
      const idx = this.parentNode.childNodes.indexOf(this as unknown as Child);
      this.parentNode.childNodes.splice(idx, 1);
      this.parentNode = null;
    }
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return '';
  }
}
