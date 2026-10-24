import type {CDATANode} from './nodes/cdata.ts';
import type {CommentNode} from './nodes/comment.ts';
import type {DoctypeNode} from './nodes/doctype.ts';
import type {DocumentNode} from './nodes/document.ts';
import type {ElementNode} from './nodes/element.ts';
import type {FragmentNode} from './nodes/fragment.ts';
import type {PINode} from './nodes/pi.ts';
import type {TextNode} from './nodes/text.ts';

export type Child = CommentNode | CDATANode | DoctypeNode | ElementNode | FragmentNode | PINode | TextNode;
export type Parent = DocumentNode | ElementNode | FragmentNode;

export interface DOMParser {
  parse(text: string, xml: boolean): Parent;
  parseFragment(text: string, xml: boolean): Parent;
}
