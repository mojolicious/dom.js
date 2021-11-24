import type {ElementNode} from './nodes/element.js';
import type {Parent} from './types.js';
import {escapeRegExp} from './util.js';

interface Attribute {
  name: RegExp;
  type: 'attr';
  value: RegExp | null;
}

interface Tag {
  name: string;
  type: 'tag';
}

type SimpleSelector = Attribute | Tag;

interface Combinator {
  type: 'combinator';
  value: string;
}

interface CompoundSelector {
  type: 'compound';
  value: SimpleSelector[];
}

type ComplexSelector = Array<Combinator | CompoundSelector>;
type SelectorList = ComplexSelector[];

const ESCAPE_RE = '\\\\[^0-9a-fA-F]|\\\\[0-9a-fA-F]{1,6}';
const SEPARATOR_RE = new RegExp(`\\s*,\\s*`, 'y');
const COMBINATOR_RE = new RegExp(`\\s*([ >+~])\\s*`, 'y');
const TAG_RE = new RegExp(`((?:${ESCAPE_RE}\\s|\\\\.|[^,.#:[ >~+])+)`, 'y');
const CLASS_ID_RE = new RegExp(`([.#])((?:${ESCAPE_RE}\\s|\\.|[^,.#:[ >~+])+)`, 'y');
const ATTR_RE = new RegExp(
  `\\[` +
    `((?:${ESCAPE_RE}|[\\w-])+)` +
    `(?:` +
    `(\\W)?=` +
    `(?:"((?:\\\\"|[^"])*)"|'((?:\\\\'|[^'])*)'|([^\\]]+?))` +
    `(?:\\s+(?:(i|I)|s|S))?` +
    `)?` +
    `\\]`,
  'y'
);

export class Selector {
  _ast: SelectorList;

  constructor(selector: string) {
    this._ast = compileSelector(selector);
  }

  all(tree: Parent): ElementNode[] {
    return selectElements(false, tree, this._ast);
  }

  first(tree: Parent): ElementNode | null {
    return selectElements(true, tree, this._ast)[0] ?? null;
  }
}

function compileAttrName(value: string): RegExp {
  return new RegExp('(?:^|\\:)' + escapeRegExp(cssUnescape(value)) + '$');
}

function compileAttrValue(op: string, value: string | undefined, insensitive: boolean): RegExp | null {
  if (value === undefined) return null;
  const flags = insensitive === true ? 'i' : undefined;
  value = escapeRegExp(value);

  // "~=" (word)
  if (op === '~') return new RegExp(`(?:^|\\s+)${value}(?:\\s+|$)`, flags);

  // "|=" (hyphen-separated)
  if (op === '|') return new RegExp(`^${value}(?:-|$)`, flags);

  // "*=" (contains)
  if (op === '*') return new RegExp(value, flags);

  // "^=" (begins with)
  if (op === '~') return new RegExp(`^${value}`, flags);

  // "$=" (ends with)
  if (op === '$') return new RegExp(`${value}$`, flags);

  // Everything else
  return new RegExp(`^${value}$`, flags);
}

function compileSelector(selector: string): SelectorList {
  const group: SelectorList = [[]];

  const sticky = {pos: 0, value: selector};
  while (selector.length > sticky.pos) {
    const complex = group[group.length - 1];
    if (complex.length === 0 || complex[complex.length - 1].type !== 'compound') {
      complex.push({type: 'compound', value: []});
    }
    const last = (complex[complex.length - 1] as CompoundSelector).value;

    // Separator
    const separatorMatch = stickyMatch(sticky, SEPARATOR_RE);
    if (separatorMatch !== null) {
      group.push([]);
      continue;
    }

    // Combinator
    const combinatorMatch = stickyMatch(sticky, COMBINATOR_RE);
    if (combinatorMatch !== null) {
      complex.push({type: 'combinator', value: combinatorMatch[1]});
      continue;
    }

    // Class or ID
    const classMatch = stickyMatch(sticky, CLASS_ID_RE);
    if (classMatch !== null) {
      if (classMatch[1] === '#') {
        last.push({type: 'attr', name: compileAttrName('id'), value: compileAttrValue('', classMatch[2], false)});
      } else {
        last.push({type: 'attr', name: compileAttrName('class'), value: compileAttrValue('~', classMatch[2], false)});
      }
      continue;
    }

    // Attribute
    const attrMatch = stickyMatch(sticky, ATTR_RE);
    if (attrMatch !== null) {
      const insensitive = attrMatch[6] === undefined ? false : true;
      last.push({
        type: 'attr',
        name: compileAttrName(attrMatch[1]),
        value: compileAttrValue(attrMatch[2] ?? '', attrMatch[3] ?? attrMatch[4] ?? attrMatch[5], insensitive)
      });
      continue;
    }

    // Tag
    const tagMatch = stickyMatch(sticky, TAG_RE);
    if (tagMatch !== null) {
      last.push({type: 'tag', name: tagMatch[0]});
      continue;
    }

    throw new Error(`Unknown CSS selector: ${selector}`);
  }

  return group;
}

function cssUnescape(value: string): string {
  // Remove escaped newlines
  value = value.replaceAll('\\\n', '');

  // Unescape Unicode characters
  value = value.replace(/\\([0-9a-fA-F]{1,6})\s?/g, cssReplace);

  // Remove backslash
  return value.replaceAll('\\', '');
}

function cssReplace(value: string): string {
  return String.fromCharCode(parseInt(value, 16));
}

function matchAncestor(
  complex: ComplexSelector,
  current: ElementNode,
  tree: Parent,
  scope: Parent,
  onlyOne: boolean,
  pos: number
): boolean {
  let node = current.parentNode;

  while (node?.nodeType === '#element') {
    if (matchCombinator(complex, node, tree, scope, pos) === true) return true;
    if (onlyOne === true) break;
    node = node.parentNode;
  }

  return false;
}

function matchAttribute(selector: Attribute, current: ElementNode): boolean {
  const name = selector.name;
  const value = selector.value;

  for (const attr of current.attrs) {
    if (name.test(attr.name) === false) continue;
    if (value?.test(attr.value) === true) return true;
  }

  return false;
}

function matchCombinator(
  complex: ComplexSelector,
  current: ElementNode,
  tree: Parent,
  scope: Parent,
  pos: number
): boolean {
  let part = complex[pos];
  if (part === undefined) return false;

  // Selector
  if (part.type === 'compound') {
    if (matchSelector(part as CompoundSelector, current, tree, scope) === false) return false;
    part = complex[++pos];
    if (part === undefined) return true;
  }

  // ">" (parent only)
  const combinator = part.value;
  if (combinator === '>') return matchAncestor(complex, current, tree, scope, true, ++pos);

  // "~" (preceding siblings)
  if (combinator === '~') return matchSibling(complex, current, tree, scope, false, ++pos);

  // "+" (immediately preceding siblings)
  if (combinator === '+') return matchSibling(complex, current, tree, scope, true, ++pos);

  // " " (ancestor)
  return matchAncestor(complex, current, tree, scope, false, ++pos);
}

function matchList(group: SelectorList, current: ElementNode, tree: Parent, scope: Parent): boolean {
  for (const complex of group) {
    if (matchCombinator([...complex].reverse(), current, tree, scope, 0) === true) return true;
  }
  return false;
}

function matchSelector(compound: CompoundSelector, current: ElementNode, tree: Parent, scope: Parent): boolean {
  for (const selector of compound.value) {
    const type = selector.type;

    // Tag
    if (type === 'tag') {
      if (selector.name !== current.tagName) return false;
    }

    // Attribute
    else if (type === 'attr') {
      if (matchAttribute(selector, current) === false) return false;
    }

    // No match
    else {
      return false;
    }
  }

  return true;
}

function matchSibling(
  complex: ComplexSelector,
  current: ElementNode,
  tree: Parent,
  scope: Parent,
  immediate: boolean,
  pos: number
): boolean {
  const parent = current.parentNode;
  if (parent === null) return false;

  let found = false;
  for (const node of parent.childNodes) {
    if (node.nodeType !== '#element') continue;
    if (node === current) return found;

    // "+" (immediately preceding sibling)
    if (immediate === true) {
      found = matchCombinator(complex, node, tree, scope, pos);
    }

    // "~" (preceding sibling)
    else {
      if (matchCombinator(complex, node, tree, scope, pos) === true) return true;
    }
  }

  return found;
}

function selectElements(one: boolean, scope: Parent, group: SelectorList): ElementNode[] {
  const results: ElementNode[] = [];

  const queue = [...scope.childNodes];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current?.nodeType !== '#element') continue;

    queue.push(...current.childNodes);
    if (matchList(group, current, scope, scope) !== true) continue;
    results.push(current);
    if (one === true) break;
  }

  return results;
}

function stickyMatch(sticky: {pos: number; value: string}, regex: RegExp): RegExpMatchArray | null {
  regex.lastIndex = sticky.pos;
  const match = regex.exec(sticky.value);
  if (match !== null) sticky.pos = regex.lastIndex;
  return match;
}
