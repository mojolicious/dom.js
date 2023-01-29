import type {ElementNode} from './element.js';
import type {Child, Parent} from '../types.js';

interface Siblings {
  following: ElementNode[];
  preceding: ElementNode[];
}

/**
 * Base class for nodes that might have parents.
 */
export class ChildNode {
  /**
   * Node type.
   */
  nodeType = '#none';
  /**
   * Parent node.
   */
  parentNode: Parent | null = null;

  /**
   * Ancestor elements of this node.
   */
  ancestors(): ElementNode[] {
    const ancestors: ElementNode[] = [];

    let current = this.parentNode;
    while (current !== null && current.nodeType === '#element') {
      ancestors.push(current);
      current = current.parentNode;
    }

    return ancestors;
  }

  /**
   * Clone this node.
   */
  clone(): ChildNode {
    return new ChildNode();
  }

  /**
   * Remove this node from its parent node.
   */
  detach(): void {
    if (this.parentNode !== null) {
      const idx = this.parentNode.childNodes.indexOf(this as any as Child);
      this.parentNode.childNodes.splice(idx, 1);
      this.parentNode = null;
    }
  }

  /**
   * Root node.
   */
  root(): Parent | Child {
    let parent = this as any as Parent | Child;
    while (parent.parentNode !== null) {
      parent = parent.parentNode;
    }
    return parent;
  }

  /**
   * Sibling elements of this node.
   */
  siblings(): Siblings {
    const siblings: Siblings = {following: [], preceding: []};
    const parent = this.parentNode;
    if (parent === null) return siblings;

    let active = siblings.preceding;
    for (const sibling of parent.childNodes) {
      if (sibling.nodeType !== '#element') continue;
      if (sibling === (this as any as ElementNode)) {
        active = siblings.following;
        continue;
      }
      active.push(sibling);
    }

    return siblings;
  }

  /**
   * Render node to string.
   */
  toString(): string {
    return '';
  }
}
