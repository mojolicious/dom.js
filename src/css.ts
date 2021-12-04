import type {ElementNode} from './nodes/element.js';
import type {Parent} from './types.js';
import {inspect} from 'util';
import {escapeRegExp, stickyMatch} from './util.js';

interface Attribute {
  name: RegExp;
  type: 'attr';
  value: RegExp | null;
}

interface Tag {
  name: RegExp | null;
  type: 'tag';
}

interface PseudoClassIsNot {
  class: 'is' | 'not';
  type: 'pc';
  value: SelectorList;
}

interface PseudoClassNth {
  class: 'nth-child' | 'nth-last-child' | 'nth-of-type' | 'nth-last-of-type';
  type: 'pc';
  value: [number, number];
}

interface PseudoClassPlain {
  class: 'checked' | 'empty' | 'only-child' | 'only-of-type' | 'root';
  type: 'pc';
}

interface PseudoClassText {
  class: 'text';
  type: 'pc';
  value: RegExp;
}

type PseudoClass = PseudoClassIsNot | PseudoClassNth | PseudoClassPlain | PseudoClassText;

type SimpleSelector = Attribute | Tag | PseudoClass;

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
const PC_RE = new RegExp(`:([\\w\\-]+)(?:\\(((?:\\([^)]+\\)|[^)])+)\\))?`, 'y');
const TAG_RE = new RegExp(`((?:${ESCAPE_RE}\\s|\\\\.|[^,.#:[ >~+])+)`, 'y');
const CLASS_ID_RE = new RegExp(`([.#])((?:${ESCAPE_RE}\\s|\\\\.|[^,.#:[ >~+])+)`, 'y');
const ATTR_RE = new RegExp(
  `\\[` +
    `((?:${ESCAPE_RE}|[\\w\\-])+)` +
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

  matches(tree: ElementNode): boolean {
    return matchList(this._ast, tree, tree, tree);
  }
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
  if (op === '^') return new RegExp(`^${value}`, flags);

  // "$=" (ends with)
  if (op === '$') return new RegExp(`${value}$`, flags);

  // Everything else
  return new RegExp(`^${value}$`, flags);
}

function compileEquation(values: string | undefined): [number, number] {
  if (values === undefined) return [0, 0];

  // "even"
  if (/^\s*even\s*$/i.test(values)) return [2, 2];

  // "odd"
  if (/^\s*odd\s*$/i.test(values)) return [2, 1];

  // "4", "+4" or "-4"
  const numMatch = values.match(/^\s*((?:\+|-)?\d+)\s*$/);
  if (numMatch !== null) return [0, parseInt(numMatch[1])];

  // "n", "4n", "+4n", "-4n", "n+1", "4n-1", "+4n-1" (and other variations)
  const complexMatch = values.match(/^\s*((?:\+|-)?(?:\d+)?)?n\s*((?:\+|-)\s*\d+)?\s*$/i);
  if (complexMatch === null) return [0, 0];

  const first = complexMatch[1] ?? '1';
  const second = complexMatch[2]?.replaceAll(' ', '') ?? '0';
  return [first === '-' ? -1 : parseInt(first), parseInt(second)];
}

function compileName(value: string): RegExp {
  return new RegExp('(?:^|\\:)' + escapeRegExp(cssUnescape(value)) + '$');
}

function compilePseudoClass(name: string, args: string): PseudoClass {
  // ":text"
  if (name === 'text') {
    const textMatch = args.match(/^\/(.+)\/(i)?$/);
    const regex =
      textMatch === null ? new RegExp(escapeRegExp(args), 'i') : new RegExp(textMatch[1], textMatch[2] ?? '');
    return {type: 'pc', class: 'text', value: regex};
  }

  // ":is" and ":not" (contains more selectors)
  if (name === 'not' || name === 'is') {
    return {type: 'pc', class: name, value: compileSelector(args)};
  }

  // ":nth-*" (with An+B notation)
  else if (name === 'nth-child' || name === 'nth-last-child' || name === 'nth-of-type' || name === 'nth-last-of-type') {
    return {type: 'pc', class: name, value: compileEquation(args)};
  }

  // ":first-child"
  else if (name === 'first-child') {
    return {type: 'pc', class: 'nth-child', value: [0, 1]};
  }

  // ":first-of-type"
  else if (name === 'first-of-type') {
    return {type: 'pc', class: 'nth-of-type', value: [0, 1]};
  }

  // ":last-child"
  else if (name === 'last-child') {
    return {type: 'pc', class: 'nth-last-child', value: [-1, 1]};
  }

  // ":last-of-type"
  else if (name === 'last-of-type') {
    return {type: 'pc', class: 'nth-last-of-type', value: [-1, 1]};
  }

  // ":checked", "empty", ":only-child", ":only-of-type", "root"
  else if (
    name === 'checked' ||
    name === 'empty' ||
    name === 'only-child' ||
    name === 'only-of-type' ||
    name === 'root'
  ) {
    return {type: 'pc', class: name};
  }

  // Unknown
  return {type: 'pc', class: 'nth-child', value: [0, 0]};
}

function compileSelector(selector: string): SelectorList {
  const group: SelectorList = [[]];

  const sticky = {offset: 0, value: selector};
  while (selector.length > sticky.offset) {
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
        last.push({type: 'attr', name: compileName('id'), value: compileAttrValue('', classMatch[2], false)});
      } else {
        last.push({type: 'attr', name: compileName('class'), value: compileAttrValue('~', classMatch[2], false)});
      }
      continue;
    }

    // Attribute
    const attrMatch = stickyMatch(sticky, ATTR_RE);
    if (attrMatch !== null) {
      const insensitive = attrMatch[6] === undefined ? false : true;
      last.push({
        type: 'attr',
        name: compileName(attrMatch[1]),
        value: compileAttrValue(attrMatch[2] ?? '', attrMatch[3] ?? attrMatch[4] ?? attrMatch[5], insensitive)
      });
      continue;
    }

    // Pseudo-class
    const pcMatch = stickyMatch(sticky, PC_RE);
    if (pcMatch !== null) {
      last.push(compilePseudoClass(pcMatch[1], pcMatch[2]));
      continue;
    }

    // Tag
    const tagMatch = stickyMatch(sticky, TAG_RE);
    if (tagMatch !== null) {
      const tag = tagMatch[0];
      last.push({type: 'tag', name: tag === '*' ? null : compileName(tag)});
      continue;
    }

    throw new Error(`Unknown CSS selector: ${selector}`);
  }

  if (process.env.MOJO_DOM_CSS_DEBUG === '1') console.log(inspect(group, {depth: 10}));
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
    if (value === null || value.test(attr.value) === true) return true;
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

function matchPseudoClass(simple: PseudoClass, current: ElementNode, tree: Parent, scope: Parent): boolean {
  const name = simple.class;

  // ":not"
  if (name === 'not') {
    if (matchList(simple.value, current, tree, scope) === false) return true;
  }

  // ":is"
  else if (name === 'is') {
    if (matchList(simple.value, current, tree, scope) === true) return true;
  }

  // ":root"
  else if (name === 'root') {
    if (current.parentNode === current.root()) return true;
  }

  // ":empty"
  else if (name === 'empty') {
    if (current.childNodes.filter(node => node.nodeType !== '#comment' && node.nodeType !== '#pi').length === 0) {
      return true;
    }
  }

  // ":checked"
  else if (name === 'checked') {
    if (current.hasAttribute('checked') === true || current.hasAttribute('selected') === true) return true;
  }

  // ":text"
  else if (name === 'text') {
    const regex = simple.value;
    for (const node of current.childNodes) {
      if (node.nodeType === '#text' && regex.test(node.value) === true) return true;
    }
  }

  // ":only-child"
  else if (name === 'only-child' || name === 'only-of-type') {
    let nodes = current.parentNode?.childNodes.filter(node => node.nodeType === '#element') ?? [];
    if (name === 'only-of-type') nodes = nodes.filter(el => (el as ElementNode).tagName === current.tagName);
    if (nodes.length === 1) return true;
  }

  // ":nth-*"
  else if (name === 'nth-child' || name === 'nth-last-child' || name === 'nth-of-type' || name === 'nth-last-of-type') {
    const equation = simple.value;
    let nodes = current.parentNode?.childNodes.filter(node => node.nodeType === '#element') ?? [];

    // "*-of-type"
    if (name === 'nth-of-type' || name === 'nth-last-of-type') {
      nodes = nodes.filter(el => (el as ElementNode).tagName === current.tagName);
    }

    // "nth-last-child"
    if (name === 'nth-last-child' || name === 'nth-last-of-type') nodes.reverse();

    for (let i = 0; i < nodes.length; i++) {
      const result = equation[0] * i + equation[1];
      if (result < 1) continue;
      const sibling = nodes[result - 1];
      if (sibling === undefined) return false;
      if (sibling === current) return true;
    }
  }

  return false;
}

function matchSelector(compound: CompoundSelector, current: ElementNode, tree: Parent, scope: Parent): boolean {
  for (const selector of compound.value) {
    const type = selector.type;

    // Tag
    if (type === 'tag') {
      const name = selector.name;
      if (name !== null && name.test(current.tagName) === false) return false;
    }

    // Attribute
    else if (type === 'attr') {
      if (matchAttribute(selector, current) === false) return false;
    }

    // Pseudo-class
    else if (type === 'pc') {
      if (matchPseudoClass(selector, current, tree, scope) === false) return false;
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
  let current;
  while ((current = queue.shift()) !== undefined) {
    if (current.nodeType !== '#element') continue;

    queue.unshift(...current.childNodes);
    if (matchList(group, current, scope, scope) !== true) continue;
    results.push(current);
    if (one === true) break;
  }

  return results;
}
