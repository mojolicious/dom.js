import type {ElementNode} from './nodes/element.js';
import type {Parent} from './types.js';
import {cssUnescape, escapeRegExp, stickyMatch} from '@mojojs/util';

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
  class: 'any-link' | 'checked' | 'empty' | 'link' | 'only-child' | 'only-of-type' | 'root' | 'visited';
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
const COMBINATOR_RE = new RegExp(`\\s*([>+~])\\s*`, 'y');
const DESCENDANT_RE = new RegExp(`\\s+`, 'y');
const PC_RE = new RegExp(`:([\\w\\-]+)(?:\\(((?:\\([^)]+\\)|[^)])+)\\))?`, 'y');
const TAG_RE = new RegExp(`((?:${ESCAPE_RE}\\s|\\\\[\\s\\S]|[^,.#:[\\s>~+])+)`, 'y');
const CLASS_ID_RE = new RegExp(`([.#])((?:${ESCAPE_RE}\\s?|[^,.#:[\\s>~+])+)`, 'y');
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
    return matchList(this._ast, tree, tree, tree.root() as Parent);
  }
}

function allTags(tree: Parent): ElementNode[] {
  const tags: ElementNode[] = [];
  const queue = [...tree.childNodes];
  let current;
  while ((current = queue.shift()) !== undefined) {
    if (current.nodeType !== '#element') continue;
    tags.push(current);
    queue.unshift(...current.childNodes);
  }
  return tags;
}

function compileAttrValue(op: string, value: string | undefined, insensitive: boolean): RegExp | null {
  if (value === undefined) return null;
  const flags = insensitive === true ? 'i' : undefined;
  value = escapeRegExp(cssUnescape(value));

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
  if (/^\s*even\s*$/i.test(values)) return [2, 0];

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
    return {type: 'pc', class: 'nth-last-child', value: [0, 1]};
  }

  // ":last-of-type"
  else if (name === 'last-of-type') {
    return {type: 'pc', class: 'nth-last-of-type', value: [0, 1]};
  }

  // ":checked", ":empty", ":only-child", ":only-of-type", ":root"
  else if (
    name === 'any-link' ||
    name === 'checked' ||
    name === 'empty' ||
    name === 'link' ||
    name === 'only-child' ||
    name === 'only-of-type' ||
    name === 'root' ||
    name === 'visited'
  ) {
    return {type: 'pc', class: name};
  }

  // Unknown
  return {type: 'pc', class: 'nth-child', value: [0, 0]};
}

function compileSelector(selector: string): SelectorList {
  const group: SelectorList = [[]];

  const trimmed = selector.trim();
  const sticky = {offset: 0, value: trimmed};
  while (trimmed.length > sticky.offset) {
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

    // Descendant combinator
    const descendantMatch = stickyMatch(sticky, DESCENDANT_RE);
    if (descendantMatch !== null) {
      complex.push({type: 'combinator', value: ' '});
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

    throw new Error(`Unknown CSS selector: ${trimmed}`);
  }

  return group;
}

function evaluate(group: SelectorList, tree: Parent, scope: Parent, pool: ElementNode[]): ElementNode[] {
  const results: ElementNode[] = [];
  const seen = new Set<ElementNode>();
  for (const selector of group) {
    for (const node of evaluateOne(selector, tree, scope, pool)) {
      if (seen.has(node) === true) continue;
      seen.add(node);
      results.push(node);
    }
  }
  return results;
}

function evaluateOne(selector: ComplexSelector, tree: Parent, scope: Parent, pool: ElementNode[]): ElementNode[] {
  const parts = [...selector];
  const compound = parts.shift();
  if (compound === undefined || compound.type !== 'compound') return [];
  let candidates = pool.filter(node => matchSelector(compound, node, tree, scope) === true);

  while (parts.length > 0) {
    const combinator = parts.shift() as Combinator;
    const next = parts.shift();
    if (next === undefined || next.type !== 'compound') return [];

    const seen = new Set<ElementNode>();
    const newCandidates: ElementNode[] = [];
    for (const node of candidates) {
      for (const candidate of stepForward(combinator.value, node)) {
        if (seen.has(candidate) === true) continue;
        seen.add(candidate);
        if (matchSelector(next, candidate, tree, scope) === true) newCandidates.push(candidate);
      }
    }
    candidates = newCandidates;
  }

  return candidates;
}

function matchAttribute(selector: Attribute, current: ElementNode): boolean {
  const nameRegex = selector.name;
  const valueRegex = selector.value;

  for (const [name, value] of Object.entries(current.attributes)) {
    if (nameRegex.test(name) === false) continue;
    if (valueRegex === null || valueRegex.test(value) === true) return true;
  }

  return false;
}

function matchList(group: SelectorList, current: ElementNode, tree: Parent, scope: Parent): boolean {
  for (const selector of group) {
    if (matchOne(selector, current, tree, scope) === true) return true;
  }
  return false;
}

function matchOne(selector: ComplexSelector, current: ElementNode, tree: Parent, scope: Parent): boolean {
  const parts = [...selector].reverse();
  const compound = parts.shift();
  if (compound === undefined || compound.type !== 'compound') return false;
  if (matchSelector(compound, current, tree, scope) === false) return false;

  let candidates: ElementNode[] = [current];
  while (parts.length > 0) {
    const combinator = parts.shift() as Combinator;
    const next = parts.shift();
    if (next === undefined || next.type !== 'compound') return false;

    const seen = new Set<ElementNode>();
    const newCandidates: ElementNode[] = [];
    for (const node of candidates) {
      for (const candidate of stepBack(combinator.value, node, scope)) {
        if (seen.has(candidate) === true) continue;
        seen.add(candidate);
        if (matchSelector(next, candidate, tree, scope) === true) newCandidates.push(candidate);
      }
    }
    if (newCandidates.length === 0) return false;
    candidates = newCandidates;
  }

  return true;
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
    const attrs = current.attributes;
    if (attrs.checked !== undefined || attrs.selected !== undefined) return true;
  }

  // ":text"
  else if (name === 'text') {
    const regex = simple.value;
    for (const node of current.childNodes) {
      if (node.nodeType === '#text' && regex.test(node.value.toString()) === true) return true;
    }
  }

  // ":any-link", ":link", ":visited"
  else if (name === 'any-link' || name === 'link' || name === 'visited') {
    const tag = current.tagName;
    if ((tag === 'a' || tag === 'area' || tag === 'link') && current.attributes.href !== undefined) return true;
  }

  // ":only-*"
  else if (name === 'only-child' || name === 'only-of-type') {
    let nodes = current.parentNode?.childNodes.filter(node => node.nodeType === '#element') ?? [];
    if (name === 'only-of-type') nodes = nodes.filter(el => (el as ElementNode).tagName === current.tagName);
    if (nodes.length === 1) return true;
  }

  // ":nth-*"
  else if (name === 'nth-child' || name === 'nth-last-child' || name === 'nth-of-type' || name === 'nth-last-of-type') {
    const equation = simple.value;
    let nodes = current.parentNode?.childNodes.filter(node => node.nodeType === '#element') ?? [];

    // ":*-of-type"
    if (name === 'nth-of-type' || name === 'nth-last-of-type') {
      nodes = nodes.filter(el => (el as ElementNode).tagName === current.tagName);
    }

    let index = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] !== current) continue;
      index = i;
      break;
    }
    if (name === 'nth-last-child' || name === 'nth-last-of-type') index = nodes.length - index - 1;
    index++;

    const delta = index - equation[1];
    if (delta === 0) return true;
    return equation[0] !== 0 && delta < 0 === equation[0] < 0 && delta % equation[0] === 0;
  }

  // Everything else
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

function selectElements(one: boolean, scope: Parent, group: SelectorList): ElementNode[] {
  const tags = allTags(scope);
  const matches = new Set(evaluate(group, scope, scope, tags));

  const results: ElementNode[] = [];
  for (const node of tags) {
    if (matches.has(node) === false) continue;
    if (one === true) return [node];
    results.push(node);
  }

  return results;
}

function stepBack(combinator: string, node: ElementNode, scope: Parent): ElementNode[] {
  // " " (ancestors) and ">" (parent only)
  if (combinator === ' ' || combinator === '>') {
    const ancestors: ElementNode[] = [];
    let current: Parent | null = node;
    while (current !== scope && current.parentNode !== null) {
      current = current.parentNode;
      if (current.nodeType !== '#element') break;
      ancestors.push(current);
      if (combinator === '>' || current === scope) break;
    }
    return ancestors;
  }

  // "~" (preceding siblings) and "+" (immediately preceding)
  const parent = node.parentNode;
  if (parent === null) return [];

  const preceding: ElementNode[] = [];
  for (const child of parent.childNodes) {
    if (child.nodeType !== '#element') continue;
    if (child === node) break;
    preceding.push(child);
  }
  if (combinator === '+') return preceding.length === 0 ? [] : [preceding[preceding.length - 1]];
  return preceding;
}

function stepForward(combinator: string, node: ElementNode): ElementNode[] {
  // " " (descendants)
  if (combinator === ' ') return allTags(node);

  // ">" (children only)
  if (combinator === '>') {
    const children: ElementNode[] = [];
    for (const child of node.childNodes) {
      if (child.nodeType !== '#element') continue;
      children.push(child);
    }
    return children;
  }

  // "~" (following siblings) and "+" (immediately following)
  const parent = node.parentNode;
  if (parent === null) return [];

  const following: ElementNode[] = [];
  let found = false;
  for (const child of parent.childNodes) {
    if (child.nodeType !== '#element') continue;
    if (found === true) following.push(child);
    if (child === node) found = true;
  }
  if (combinator === '+') return following.length === 0 ? [] : [following[0]];
  return following;
}
