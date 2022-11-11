import {CommentNode, DocumentNode, ElementNode, FragmentNode, TextNode} from '../../lib/dom.js';
import {parse, parseFragment} from 'parse5';

export class Parser {
  _adapter = new TreeAdapter();

  parse(html) {
    return parse(html, {treeAdapter: this._adapter});
  }

  parseFragment(html) {
    return parseFragment(html, {treeAdapter: this._adapter});
  }
}

// Based on https://github.com/inikulin/parse5/blob/master/packages/parse5/lib/tree-adapters/default.js
class TreeAdapter {
  createDocument() {
    return new DocumentNode();
  }

  createDocumentFragment() {
    return new FragmentNode();
  }

  createElement(tagName, namespaceUri, attrsArray) {
    const attrs = {};
    attrsArray.forEach(attr => (attrs[attr.name] = attr.value));
    return new ElementNode(tagName, namespaceUri, attrs);
  }

  createCommentNode(data) {
    return new CommentNode(data);
  }

  createTextNode(value) {
    return new TextNode(value);
  }

  appendChild(parentNode, newNode) {
    parentNode.appendChild(newNode);
  }

  insertBefore(parentNode, newNode, referenceNode) {
    parentNode.insertBefore(newNode, referenceNode);
  }

  setTemplateContent(templateElement, contentElement) {
    templateElement.content = contentElement;
  }

  getTemplateContent(templateElement) {
    return templateElement.content;
  }

  setDocumentType(document, name, publicId, systemId) {
    document.setDocumentType(name, publicId, systemId);
  }

  setDocumentMode(document, mode) {
    document.mode = mode;
  }

  getDocumentMode(document) {
    return document.mode;
  }

  detachNode(node) {
    node.detach();
  }

  insertText(parentNode, text) {
    parentNode.insertText(text);
  }

  insertTextBefore(parentNode, text, referenceNode) {
    parentNode.insertTextBefore(text, referenceNode);
  }

  adoptAttributes(recipient, attrs) {
    recipient.adoptAttributes(attrs);
  }

  getFirstChild(node) {
    return node.childNodes[0];
  }

  getChildNodes(node) {
    return node.childNodes;
  }

  getParentNode(node) {
    return node.parentNode;
  }

  getAttrList(element) {
    const attrs = [];
    for (const [name, value] of Object.entries(element.attributes)) {
      attrs.push({name, value});
    }
    return attrs;
  }

  getTagName(element) {
    return element.tagName;
  }

  getNamespaceURI(element) {
    return element.namespaceUri;
  }

  getTextNodeContent(textNode) {
    return textNode.value.toString();
  }

  getCommentNodeContent(commentNode) {
    return commentNode.value;
  }

  getDocumentTypeNodeName(doctypeNode) {
    return doctypeNode.name;
  }

  getDocumentTypeNodePublicId(doctypeNode) {
    return doctypeNode.publicId;
  }

  getDocumentTypeNodeSystemId(doctypeNode) {
    return doctypeNode.systemId;
  }

  isTextNode(node) {
    return node.nodeType === '#text';
  }

  isCommentNode(node) {
    return node.nodeType === '#comment';
  }

  isDocumentTypeNode(node) {
    return node.nodeType === '#doctype';
  }

  isElementNode(node) {
    return node.nodeType === '#element';
  }

  setNodeSourceCodeLocation() {
    // Disabled
  }

  getNodeSourceCodeLocation() {
    // Disabled
  }

  updateNodeSourceCodeLocation() {
    // Disabled
  }
}
