import type {Child, Parent} from '../types.js';
import {ChildNode} from './child.js';
import {TextNode} from './text.js';

/**
 * Base class for nodes with children.
 */
export class ParentNode extends ChildNode {
  /**
   * Child nodes.
   */
  childNodes: Child[] = [];

  /**
   * Append a child node to this parent node.
   */
  appendChild(node: Child) {
    this.childNodes.push(node);
    node.parentNode = this as Parent;
  }

  /**
   * Clone this node.
   */
  clone(): ParentNode {
    return new ParentNode();
  }

  /**
   * Insert a child node to this parent node after the given reference node.
   */
  insertAfter(node: Child, referenceNode: Child): void {
    this._insertNode(node, referenceNode, 1);
  }

  /**
   * Insert a child node to this parent node before the given reference node.
   */
  insertBefore(node: Child, referenceNode: Child): void {
    this._insertNode(node, referenceNode, 0);
  }

  /**
   * Insert text into this parent node. If the last child is a text node, the text will be appended to the text node
   * content. Otherwise, insert a new text node with the given text.
   */
  insertText(text: string): void {
    if (this.childNodes.length > 0) {
      const prevNode = this.childNodes[this.childNodes.length - 1];

      if (prevNode.nodeType === '#text') {
        prevNode.value += text;
        return;
      }
    }

    this.appendChild(new TextNode(text));
  }

  /**
   * Insert text into a sibling node that goes before the reference node. If the sibling node is a text node, the
   * provided text will be appended to the text node content. Otherwise, insert a new sibling text node with the given
   * text before the reference node.
   */
  insertTextBefore(text: string, referenceNode: Child): void {
    const prevNode: Child | undefined = this.childNodes[this.childNodes.indexOf(referenceNode) - 1];

    if (prevNode !== undefined && prevNode.nodeType === '#text') {
      prevNode.value += text;
    } else {
      this.insertBefore(new TextNode(text), referenceNode);
    }
  }

  /**
   * Prepend a child node to this parent node.
   */
  prependChild(node: Child) {
    this.childNodes.unshift(node);
    node.parentNode = this as Parent;
  }

  /**
   * Render node to string.
   */
  toString(options = {xml: false}): string {
    return this.childNodes.map(node => node.toString(options)).join('');
  }

  _insertNode(node: Child, referenceNode: Child, offset: number): void {
    const idx = this.childNodes.indexOf(referenceNode);
    this.childNodes.splice(idx + offset, 0, node);
    node.parentNode = this as Parent;
  }
}
