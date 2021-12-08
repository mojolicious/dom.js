import type {DoctypeNode} from './nodes/doctype.js';
import type {Attribute, Child, Parent} from './types.js';
import {CommentNode} from './nodes/comment.js';
import {DocumentNode} from './nodes/document.js';
import {ElementNode} from './nodes/element.js';
import {FragmentNode} from './nodes/fragment.js';
import {TextNode} from './nodes/text.js';
import parse5 from 'parse5';

export class HTMLParser {
  _adapter = new TreeAdapter();

  parse(html: string): DocumentNode {
    const document: DocumentNode = parse5.parse(html, {treeAdapter: this._adapter}) as any;
    return document;
  }

  parseFragment(html: string): FragmentNode {
    const document: FragmentNode = parse5.parseFragment(html, {treeAdapter: this._adapter}) as any;
    return document;
  }
}

// Based on https://github.com/inikulin/parse5/blob/master/packages/parse5/lib/tree-adapters/default.js
class TreeAdapter {
  createDocument(): DocumentNode {
    return new DocumentNode();
  }

  createDocumentFragment(): FragmentNode {
    return new FragmentNode();
  }

  createElement(tagName: string, namespaceUri: string, attrs: Attribute[]): ElementNode {
    return new ElementNode(tagName, namespaceUri, attrs);
  }

  createCommentNode(data: string): CommentNode {
    return new CommentNode(data);
  }

  createTextNode(value: string): TextNode {
    return new TextNode(value);
  }

  appendChild(parentNode: Parent, newNode: Child): void {
    parentNode.appendChild(newNode);
  }

  insertBefore(parentNode: Parent, newNode: Child, referenceNode: Child): void {
    parentNode.insertBefore(newNode, referenceNode);
  }

  setTemplateContent(templateElement: ElementNode, contentElement: FragmentNode): void {
    templateElement.content = contentElement;
  }

  getTemplateContent(templateElement: ElementNode): FragmentNode | null {
    return templateElement.content;
  }

  setDocumentType(document: DocumentNode, name: string, publicId: string, systemId: string): void {
    document.setDocumentType(name, publicId, systemId);
  }

  setDocumentMode(document: DocumentNode, mode: string): void {
    document.mode = mode;
  }

  getDocumentMode(document: DocumentNode): string {
    return document.mode;
  }

  detachNode(node: Child): void {
    node.detach();
  }

  insertText(parentNode: Parent, text: string): void {
    parentNode.insertText(text);
  }

  insertTextBefore(parentNode: Parent, text: string, referenceNode: Child): void {
    parentNode.insertTextBefore(text, referenceNode);
  }

  adoptAttributes(recipient: ElementNode, attrs: Attribute[]): void {
    recipient.adoptAttributes(attrs);
  }

  getFirstChild(node: Parent): Child {
    return node.childNodes[0];
  }

  getChildNodes(node: Parent): Child[] {
    return node.childNodes;
  }

  getParentNode(node: ElementNode): Parent | null {
    return node.parentNode;
  }

  getAttrList(element: ElementNode): Attribute[] {
    return element.attrs;
  }

  getTagName(element: ElementNode): string {
    return element.tagName;
  }

  getNamespaceURI(element: ElementNode): string {
    return element.namespaceUri;
  }

  getTextNodeContent(textNode: TextNode): string {
    return textNode.value.toString();
  }

  getCommentNodeContent(commentNode: CommentNode): string {
    return commentNode.value;
  }

  getDocumentTypeNodeName(doctypeNode: DoctypeNode): string {
    return doctypeNode.name;
  }

  getDocumentTypeNodePublicId(doctypeNode: DoctypeNode): string {
    return doctypeNode.publicId;
  }

  getDocumentTypeNodeSystemId(doctypeNode: DoctypeNode): string {
    return doctypeNode.systemId;
  }

  isTextNode(node: Child): boolean {
    return node.nodeType === '#text';
  }

  isCommentNode(node: Child): boolean {
    return node.nodeType === '#comment';
  }

  isDocumentTypeNode(node: Child): boolean {
    return node.nodeType === '#doctype';
  }

  isElementNode(node: Child): boolean {
    return node.nodeType === '#element';
  }

  setNodeSourceCodeLocation(): void {
    // Disabled
  }

  getNodeSourceCodeLocation(): any {
    // Disabled
  }

  updateNodeSourceCodeLocation(): void {
    // Disabled
  }
}
