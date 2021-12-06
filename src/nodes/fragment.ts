import {ParentNode} from './parent.js';

/**
 * Document fragment node class.
 */
export class FragmentNode extends ParentNode {
  /**
   * Node type.
   */
  readonly nodeType = '#fragment';
}
