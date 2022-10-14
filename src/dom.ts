/*!
 * dom.js
 * Copyright (C) 2021-2022 Sebastian Riedel
 * MIT Licensed
 */
import type {Child, Parent} from './types.js';
import {Selector} from './css.js';
import {HTMLParser} from './html.js';
import {CDATANode} from './nodes/cdata.js';
import {CommentNode} from './nodes/comment.js';
import {DoctypeNode} from './nodes/doctype.js';
import {DocumentNode} from './nodes/document.js';
import {ElementNode} from './nodes/element.js';
import {FragmentNode} from './nodes/fragment.js';
import {PINode} from './nodes/pi.js';
import {TextNode} from './nodes/text.js';
import {XMLParser} from './xml.js';
import {SafeString} from '@mojojs/util';

export * from '@mojojs/util';
export {CDATANode, CommentNode, DoctypeNode, DocumentNode, ElementNode, FragmentNode, PINode, TextNode};

type FormValue = string | string[] | null | FormValue[];

/**
 * HTML/XML DOM API class.
 */
export default class DOM {
  /**
   * Current node in the DOM tree.
   */
  currentNode: Parent;
  _xml: boolean;

  constructor(input: string | Parent, options: {fragment?: boolean; xml?: boolean} = {}) {
    const xml = (this._xml = options.xml ?? false);

    // Parse
    if (typeof input === 'string') {
      if (xml === true) {
        this.currentNode = new XMLParser().parse(input);
      } else if (options.fragment === true) {
        this.currentNode = new HTMLParser().parseFragment(input);
      } else {
        this.currentNode = new HTMLParser().parse(input);
      }
    }

    // Node
    else {
      this.currentNode = input;
    }
  }

  /**
   * Ancestor elements of this element.
   */
  ancestors(selector?: string): DOM[] {
    return this._filter(
      selector,
      this.currentNode.ancestors().map(node => this._newDOM(node))
    );
  }

  /**
   * Append HTML/XML fragment to this element.
   */
  append(content: string | DOM): this {
    return this._addSibling(this._ensureNode(content), false);
  }

  /**
   * Append HTML/XML fragment to this element's content.
   */
  appendContent(content: string | DOM): this {
    return this._addChild(content, false);
  }

  /**
   * Find first descendant element of this element matching the CSS selector.
   */
  at(selector: string): DOM | null {
    const first = new Selector(selector).first(this.currentNode);
    return first === null ? null : this._newDOM(first);
  }

  /**
   * This element's attributes.
   */
  get attr(): Record<string, string> {
    const current = this.currentNode;
    return current.nodeType === '#element' ? current.attributes : {};
  }

  /**
   * Child elements of this element.
   */
  children(selector?: string): DOM[] {
    return this._filter(
      selector,
      this.currentNode.childNodes.filter(node => node.nodeType === '#element').map(node => this._newDOM(node as Parent))
    );
  }

  /**
   * This element's rendered content.
   */
  content(): string {
    return this.currentNode.childNodes.map(node => node.toString({xml: this._xml})).join('');
  }

  /**
   * Find all descendant elements of this element matching the CSS selector.
   */
  find(selector: string): DOM[] {
    return new Selector(selector).all(this.currentNode).map(node => this._newDOM(node));
  }

  /**
   * Sibling elements after this element.
   */
  following(selector?: string): DOM[] {
    return this._filter(
      selector,
      this.currentNode.siblings().following.map(node => this._newDOM(node))
    );
  }

  /**
   * Find this element's namespace.
   */
  namespace(): string | null {
    const current = this.currentNode;
    if (current.nodeType !== '#element') return null;

    // Extract namespace prefix and search parents
    const nsMatch = current.tagName.match(/^(.*?):/);
    const namespace = nsMatch?.[1] ?? null;
    for (const node of [current, ...current.ancestors()]) {
      const attrs = node.attributes;

      // Namespace for prefix
      if (namespace !== null) {
        const value = attrs[`xmlns:${namespace}`];
        if (value !== undefined) return value;
      }

      // Namespace attribute
      else if (attrs.xmlns !== undefined) {
        return attrs.xmlns;
      }
    }

    return null;
  }

  /**
   * Check if this element matches the CSS selector.
   */
  matches(selector: string): boolean {
    const current = this.currentNode;
    if (current.nodeType !== '#element') return false;
    return new Selector(selector).matches(current);
  }

  /**
   * Sibling element after this element.
   */
  next(): DOM | null {
    const following = this.currentNode.siblings().following;
    if (following.length === 0) return null;
    return this._newDOM(following[0]);
  }

  /**
   * Create a new `DOM` object with one tag.
   */
  static newTag(
    name: string,
    attrs: Record<string, string | boolean | Record<string, string>> | string | SafeString = {},
    content: string | SafeString = ''
  ): DOM {
    if (typeof attrs === 'string' || attrs instanceof SafeString) [content, attrs] = [attrs, {}];

    const processedAttrs: Record<string, string> = {};
    for (const [name, value] of Object.entries(attrs)) {
      if (typeof value === 'boolean') {
        if (value === true) processedAttrs[name] = '';
      } else if (typeof value !== 'string') {
        if (name !== 'data') continue;
        Object.entries(value).forEach(([name, value]) => (processedAttrs[`data-${name}`] = value));
      } else {
        processedAttrs[name] = value;
      }
    }

    const fragment = new FragmentNode();
    const el = new ElementNode(name, '', processedAttrs);
    fragment.appendChild(el);
    el.appendChild(new TextNode(content));

    return new DOM(fragment);
  }

  /**
   * Parent of this element.
   */
  parent(): DOM | null {
    const parent = this.currentNode.parentNode;
    return parent === null ? null : this._newDOM(parent);
  }

  /**
   * Sibling elements before this element.
   */
  preceding(selector?: string): DOM[] {
    return this._filter(
      selector,
      this.currentNode.siblings().preceding.map(node => this._newDOM(node))
    );
  }

  /**
   * Prepend HTML/XML fragment to this element.
   */
  prepend(content: string | DOM): this {
    return this._addSibling(this._ensureNode(content), true);
  }

  /**
   * Prepend HTML/XML fragment to this element's content.
   */
  prependContent(content: string | DOM): this {
    return this._addChild(content, true);
  }

  /**
   * Sibling element before this element.
   */
  previous(): DOM | null {
    const preceding = this.currentNode.siblings().preceding;
    if (preceding.length === 0) return null;
    return this._newDOM(preceding[preceding.length - 1]);
  }

  /**
   * Remove this element and its children.
   */
  remove(): void {
    this.currentNode.detach();
  }

  /**
   * Replace this element with HTML/XML fragment.
   */
  replace(content: string | DOM): void {
    this.prepend(content).remove();
  }

  /**
   * Replace this element's content with HTML/XML fragment.
   */
  replaceContent(content: string | DOM): void {
    this.currentNode.childNodes.forEach(node => node.detach());
    this.appendContent(content);
  }

  /**
   * Root node.
   */
  root(): DOM | null {
    const root = this.currentNode.root();
    const type = root.nodeType;
    return type === '#document' || type === '#fragment' ? this._newDOM(root) : null;
  }

  /**
   * Get a unique CSS selector for this element.
   */
  selector(): string | null {
    const current = this.currentNode;
    if (current.nodeType !== '#element') return null;

    const selector: string[] = [];
    for (const node of [current, ...current.ancestors()]) {
      selector.push(node.tagName + ':nth-child(' + (node.siblings().preceding.length + 1) + ')');
    }
    return selector.reverse().join(' > ');
  }

  /**
   * Remove this element while preserving its content.
   */
  strip(): void {
    const current = this.currentNode;
    const parent = current.parentNode;
    if (parent === null) return;

    const children = this.currentNode.childNodes;
    for (const child of children) {
      child.detach();
      parent.insertBefore(child, current as Child);
    }
    current.detach();
  }

  /**
   * This element's tag name.
   */
  get tag(): string {
    const current = this.currentNode;
    if (current.nodeType !== '#element') return '';
    return current.tagName;
  }

  set tag(name: string) {
    const current = this.currentNode;
    if (current.nodeType !== '#element') return;
    current.tagName = name;
  }

  /**
   * Extract text content from this element.
   */
  text(options = {recursive: false}): string {
    const recursive = options.recursive;

    const current = this.currentNode;
    const type = current.nodeType;
    if (type !== '#element' && type !== '#fragment' && type !== '#document') return '';

    const nodes = [...current.childNodes];
    const buffer: string[] = [];
    let node;
    while ((node = nodes.shift()) !== undefined) {
      const type = node.nodeType;

      // Text
      if (type === '#text' || type === '#cdata') {
        buffer.push(node.value.toString());
      }

      // Element
      else if (recursive === true && type === '#element') {
        nodes.unshift(...node.childNodes);
      }
    }

    return buffer.join('');
  }

  /**
   * Render DOM to HTML or XML.
   */
  toString(options = {xml: this._xml}): string {
    return this.currentNode.toString(options);
  }

  /**
   * Extract value from form element (such as `<button>`, `<input>`, `<option>`, `<select>` and `<textarea>`), or
   * return `null` if this element has no value. In the case of `<select>` with `multiple` attribute, find `<option>`
   * elements with `selected` attribute and return an array with all values, or `null` if none could be found.
   */
  val(): FormValue {
    const tag = this.tag;
    const attr = this.attr;

    // "option"
    if (tag === 'option') return attr.value ?? this.text();

    // "input" ("type=checkbox" and "type=radio")
    if (tag === 'input') {
      const type = attr.type;
      if (type === 'radio' || type === 'checkbox') return attr.value ?? 'on';
    }

    // "textarea", "input" or "button"
    if (tag !== 'select') return tag === 'textarea' ? this.text() : attr.value;

    // "select"
    const values = this.find('option:checked:not([disabled])')
      .filter(el => el.ancestors('optgroup[disabled]').length === 0)
      .map(el => el.val());
    return attr.multiple !== undefined ? (values.length > 0 ? values : null) : values[values.length - 1];
  }

  /**
   * Wrap HTML/XML fragment around this element.
   */
  wrap(content: string | DOM): void {
    this._wrap(content, true);
  }

  /**
   * Wrap HTML/XML fragment around the content of this element.
   */
  wrapContent(content: string | DOM): void {
    this._wrap(content, false);
  }

  _addChild(content: string | DOM, before: boolean): this {
    const contentNode = this._ensureNode(content);
    const current = this.currentNode;
    const nodes: Child[] = this._extractNodes(contentNode);

    if (before === true) {
      nodes.reverse().forEach(node => current.prependChild(node));
    } else {
      nodes.forEach(node => current.appendChild(node));
    }

    return this;
  }

  _addSibling(contentNode: Parent, before: boolean): this {
    const current = this.currentNode;
    const parent = current.parentNode;
    if (parent === null) return this;

    const nodes: Child[] = this._extractNodes(contentNode);

    if (before === true) {
      nodes.forEach(node => parent.insertBefore(node, current as Child));
    } else {
      nodes.reverse().forEach(node => parent.insertAfter(node, current as Child));
    }

    return this;
  }

  _ensureNode(content: string | DOM): Parent {
    if (content instanceof DOM) return content.currentNode.clone();
    const xml = this._xml;
    return new DOM(content, xml === true ? {xml} : {fragment: true}).currentNode;
  }

  _extractNodes(current: Parent): Child[] {
    const type = current.nodeType;
    return type === '#document' || type === '#fragment' ? current.childNodes : [current];
  }

  _filter(selector: string | undefined, elements: DOM[]): DOM[] {
    return selector === undefined ? elements : elements.filter(el => el.matches(selector));
  }

  _innermostElement(node: Parent): Parent {
    const nodes = node.childNodes.filter(node => node.nodeType === '#element') as Parent[];
    return nodes.length > 0 ? this._innermostElement(nodes[0]) : node;
  }

  _newDOM(node: Parent): DOM {
    return new DOM(node, {xml: this._xml});
  }

  _wrap(content: string | DOM, outer: boolean): void {
    const current = this.currentNode;

    const contentNode = this._ensureNode(content);
    const innerNode = this._innermostElement(contentNode);
    if (innerNode === contentNode) return;

    // Wrap around element
    if (outer === true) {
      if (current.parentNode === null) return;

      this._addSibling(contentNode, true);
      current.detach();
      innerNode.appendChild(current as Child);
    }

    // Wrap content
    else {
      const children = current.childNodes;
      current.childNodes = [];
      children.reverse().forEach(node => innerNode.prependChild(node));
      contentNode.childNodes.forEach(node => current.appendChild(node));
    }
  }
}
