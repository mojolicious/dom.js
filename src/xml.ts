import {FragmentNode} from './nodes/fragment.js';

export class XMLParser {
  parse(xml: string): FragmentNode {
    throw new Error('XML support is not yet implemented!');
    return new FragmentNode();
  }
}
