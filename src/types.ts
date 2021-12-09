import type {CDATANode} from './nodes/cdata.js';
import type {CommentNode} from './nodes/comment.js';
import type {DoctypeNode} from './nodes/doctype.js';
import type {DocumentNode} from './nodes/document.js';
import type {ElementNode} from './nodes/element.js';
import type {FragmentNode} from './nodes/fragment.js';
import type {PINode} from './nodes/pi.js';
import type {TextNode} from './nodes/text.js';

export type Child = CommentNode | CDATANode | DoctypeNode | ElementNode | FragmentNode | PINode | TextNode;
export type Parent = DocumentNode | ElementNode | FragmentNode;
