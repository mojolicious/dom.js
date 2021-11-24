import type {CommentNode} from './nodes/comment.js';
import type {DoctypeNode} from './nodes/doctype.js';
import type {DocumentNode} from './nodes/document.js';
import type {ElementNode} from './nodes/element.js';
import type {FragmentNode} from './nodes/fragment.js';
import type {TextNode} from './nodes/text.js';

export interface Attribute {
  name: string;
  namespace?: string | undefined;
  prefix?: string | undefined;
  value: string;
}

export type Child = CommentNode | DoctypeNode | ElementNode | FragmentNode | TextNode;
export type Parent = DocumentNode | ElementNode | FragmentNode;
