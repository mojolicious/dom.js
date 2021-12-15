import {ParentNode} from './parent.js';

/**
 * Document fragment node class.
 */
export class FragmentNode extends ParentNode {
  /**
   * Node type.
   */
  readonly nodeType = '#fragment';

  /**
   * Clone this node.
   */
  clone(): FragmentNode {
    const fragment = new FragmentNode();
    this.childNodes.map(node => node.clone()).forEach(node => fragment.appendChild(node));
    return fragment;
  }
}
