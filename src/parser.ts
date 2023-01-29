import type {Parent} from './types.js';
import {
  BLOCK,
  CLOSE,
  EMPTY,
  END,
  NAME_START_CHAR,
  NAME_CHAR,
  NO_MORE_CONTENT,
  PHRASING,
  RAW,
  RCDATA,
  SCOPE
} from './constants.js';
import {CDATANode} from './nodes/cdata.js';
import {CommentNode} from './nodes/comment.js';
import {DoctypeNode} from './nodes/doctype.js';
import {ElementNode} from './nodes/element.js';
import {FragmentNode} from './nodes/fragment.js';
import {PINode} from './nodes/pi.js';
import {TextNode} from './nodes/text.js';
import {SafeString, escapeRegExp, stickyMatch, xmlUnescape} from '@mojojs/util';

const NAME_RE = new RegExp(`[${NAME_START_CHAR}][${NAME_CHAR}]*`, 'u');

const TEXT_RE = new RegExp(`([^<]+)`, 'ys');
const DOCTYPE_RE = new RegExp(
  `<!DOCTYPE\\s*(\\w+(?:(?:\\s+\\w+)?(?:\\s+(?:"[^"]*"|'[^']*'))+)?(?:\\s+\\[.+?\\])?\\s*)>`,
  'ysi'
);
const COMMENT_RE = new RegExp(`<!--(.*?)--\\s*>`, 'ys');
const CDATA_RE = new RegExp(`<!\\[CDATA\\[(.*?)\\]\\]>`, 'ysi');
const PI_RE = new RegExp(`<\\?(.*?)\\?>`, 'ys');
const TAG_ATTR_RE = new RegExp(
  `\\s*(${NAME_RE.source})(?:\\s*=\\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^>\\s]*)))?`,
  'ysu'
);
const TAG_END_RE = new RegExp(`\\s*(/)?\\s*>`, 'ys');
const TAG_START_RE = new RegExp(`<\\s*(\\/)?\\s*(${NAME_RE.source})`, 'ysu');
const RUNAWAY_RE = new RegExp(`<`, 'y');

export class Parser {
  parse(text: string, xml: boolean): FragmentNode {
    return this.parseFragment(text, xml);
  }

  parseFragment(text: string, xml: boolean): FragmentNode {
    const doc = new FragmentNode();
    let current: Parent = doc;

    const sticky = {offset: 0, value: text};
    const textLength = text.length;
    while (textLength > sticky.offset) {
      // Text
      const textMatch = stickyMatch(sticky, TEXT_RE);
      if (textMatch !== null) {
        current.insertText(xmlUnescape(textMatch[1]));
        continue;
      }

      // DOCTYPE
      const doctypeMatch = stickyMatch(sticky, DOCTYPE_RE);
      if (doctypeMatch !== null) {
        current.appendChild(new DoctypeNode(doctypeMatch[1], '', ''));
        continue;
      }

      // Comment
      const commentMatch = stickyMatch(sticky, COMMENT_RE);
      if (commentMatch !== null) {
        current.appendChild(new CommentNode(commentMatch[1]));
        continue;
      }

      // CDATA
      const cdataMatch = stickyMatch(sticky, CDATA_RE);
      if (cdataMatch !== null) {
        current.appendChild(new CDATANode(cdataMatch[1]));
        continue;
      }

      // Processing instruction
      const piMatch = stickyMatch(sticky, PI_RE);
      if (piMatch !== null) {
        current.appendChild(new PINode(piMatch[1]));
        continue;
      }

      // Tag
      const before = sticky.offset;
      const startMatch = stickyMatch(sticky, TAG_START_RE);
      if (startMatch !== null) {
        let tag = xml === true ? startMatch[2] : startMatch[2].toLowerCase();

        // Attributes
        const attrs: Record<string, string> = {};
        while (textLength > sticky.offset) {
          const attrMatch = stickyMatch(sticky, TAG_ATTR_RE);
          if (attrMatch === null) break;
          const name = xml === true ? attrMatch[1] : attrMatch[1].toLowerCase();
          attrs[name] = xmlUnescape(attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '');
        }

        let close = false;
        const endMatch = stickyMatch(sticky, TAG_END_RE);
        if (endMatch !== null) {
          if (endMatch[1] !== undefined) close = true;

          // Start
          if (startMatch[1] === undefined) {
            // "image" is an alias for "img"
            if (xml === false && tag === 'image') tag = 'img';
            current = this._start(current, xml, tag, attrs);

            // Element without end tag (self-closing)
            const isSelfClosing =
              (xml !== true && EMPTY.has(tag) === true) ||
              ((xml === true || BLOCK.has(tag) === false) && close === true);
            if (isSelfClosing === true) current = this._end(current, xml, tag);

            // Raw text elements
            if (xml === true || (RAW.has(tag) === false && RCDATA.has(tag) === false)) continue;
            const rawMatch = stickyMatch(sticky, new RegExp(`(.*?)</${escapeRegExp(tag)}(?:\\s+|\\s*>)`, 'ysi'));
            if (rawMatch === null) continue;
            const text = RCDATA.has(tag) === true ? xmlUnescape(rawMatch[1]) : rawMatch[1];
            current.appendChild(new TextNode(new SafeString(text)));
            current = this._end(current, xml, tag);
          }

          // End
          else {
            // No more content
            if (xml !== true && NO_MORE_CONTENT[tag] !== undefined) {
              for (const noMoreContent of NO_MORE_CONTENT[tag]) {
                current = this._end(current, xml, noMoreContent);
              }
            }

            current = this._end(current, xml, tag);
          }

          continue;
        }

        // No full tag (reset offset)
        else {
          sticky.offset = before;
        }
      }

      // Runaway "<"
      const runawayMatch = stickyMatch(sticky, RUNAWAY_RE);
      if (runawayMatch !== null) {
        current.insertText('<');
        continue;
      }

      break;
    }

    return doc;
  }

  _end(current: Parent, xml: boolean, tag: string): Parent {
    let node: Parent | null = current;
    while (node !== null) {
      const parent: Parent | null = node.parentNode;
      if (parent === null) break;

      if (node.nodeType === '#element') {
        const tagName = node.tagName;

        // Don’t traverse a container tag
        if (SCOPE.has(tagName) === true && tagName !== tag) break;

        // Right tag
        if (tagName === tag) {
          // "template"
          if (tag === 'template') {
            const fragment = new FragmentNode();
            node.content = fragment;
            for (const child of node.childNodes) {
              child.detach();
              fragment.appendChild(child);
            }
          }

          return parent;
        }

        // Phrasing content can only cross phrasing content
        if (xml === false && PHRASING.has(tag) === true && PHRASING.has(tagName) === false) break;
      }

      node = parent;
    }

    return current;
  }

  _start(current: Parent, xml: boolean, tag: string, attrs: Record<string, string>): Parent {
    // Autoclose optional HTML elements
    if (xml === false && current.nodeType === '#element') {
      if (END[tag] !== undefined) {
        current = this._end(current, xml, END[tag]);
      }

      // Close allowed parent elements in scope
      else if (CLOSE[tag] !== undefined) {
        const {allowed, scope} = CLOSE[tag];

        let parent: ElementNode = current;
        while (scope.has(parent.tagName) === false) {
          if (allowed.has(parent.tagName) === true) current = this._end(current, xml, parent.tagName);
          if (parent.parentNode === null || parent.parentNode.nodeType !== '#element') break;
          parent = parent.parentNode;
        }
      }
    }

    // New tag
    const node = new ElementNode(tag, '', attrs);
    current.appendChild(node);
    return node;
  }
}
