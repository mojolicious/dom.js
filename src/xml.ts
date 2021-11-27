import type {Parent} from './types.js';
import {CDATANode} from './nodes/cdata.js';
import {CommentNode} from './nodes/comment.js';
import {DoctypeNode} from './nodes/doctype.js';
import {DocumentNode} from './nodes/document.js';
import {ElementNode} from './nodes/element.js';
import {PINode} from './nodes/pi.js';
import {stickyMatch, xmlUnescape} from './util.js';

const ATTR_RE = new RegExp(`([^<>=\\s/]+|/)(?:\\s*=\\s*(?:(?<quote>["'])(.*?)\\k<quote>|([^>\\s]*)))?\\s*`, 'ys');
const TEXT_RE = new RegExp(`([^<]+)`, 'ys');
const DOCTYPE_RE = new RegExp(
  `<!DOCTYPE\\s*(\\w+(?:(?:\\s+\\w+)?(?:\\s+(?:"[^"]*"|'[^']*'))+)?(?:\\s+\\[.+?\\])?\\s*)>`,
  'ysi'
);
const COMMENT_RE = new RegExp(`<!--(.*?)--\\s*>`, 'ys');
const CDATA_RE = new RegExp(`<!\\[CDATA\\[(.*?)\\]\\]>`, 'ysi');
const PI_RE = new RegExp(`<\\?(.*?)\\?>`, 'ys');
const TAG_RE = new RegExp(`<\\s*(\\/)?\\s*([^<>\\s]+)\\s*((?:${ATTR_RE.source})*)>`, 'ys');
const RUNAWAY_RE = new RegExp(`<`, 'y');

export class XMLParser {
  parse(xml: string): DocumentNode {
    const doc = new DocumentNode();
    let current: Parent = doc;

    const sticky = {offset: 0, value: xml};
    while (xml.length > sticky.offset) {
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
      const tagMatch = stickyMatch(sticky, TAG_RE);
      if (tagMatch !== null) {
        const tag = tagMatch[2];

        // Start
        if (tagMatch[1] === undefined) {
          const attrs = [];
          const unparsed = tagMatch[3];
          let close = false;
          if (unparsed !== undefined) {
            // Attributes
            const stickyAttr = {offset: 0, value: unparsed};
            while (unparsed.length > stickyAttr.offset) {
              const attrMatch = stickyMatch(stickyAttr, ATTR_RE);
              if (attrMatch === null) break;
              const name = attrMatch[1];
              if (name === '/') {
                close = true;
              } else {
                attrs.push({name: name, value: xmlUnescape(attrMatch[3] ?? attrMatch[4] ?? '')});
              }
            }
          }

          current.appendChild((current = new ElementNode(tag, '', attrs)));

          // Element without end tag (self-closing)
          if (close === true) current = this._end(current, tag);
        }

        // End
        else {
          current = this._end(current, tag);
        }
        continue;
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

  _end(current: Parent, tag: string): Parent {
    let node: Parent | null = current;
    while (node !== null) {
      const parent: Parent | null = node.parentNode;
      if (parent === null) break;

      if (node.nodeType === '#element' && node.tagName === tag) return parent;
      node = parent;
    }

    return current;
  }
}
