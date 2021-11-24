import {SafeString, escapeRegExp, xmlEscape} from '../lib/dom.js';
import t from 'tap';

t.test('escapeRegExp', t => {
  t.equal(escapeRegExp('te*s?t'), 'te\\*s\\?t', 'escaped');
  t.equal(escapeRegExp('\\^$.*+?()[]{}|'), '\\\\\\^\\$\\.\\*\\+\\?\\(\\)\\[\\]\\{\\}\\|', 'escaped');
  t.end();
});

t.test('xmlEscape', t => {
  t.same(xmlEscape('Hello World!'), 'Hello World!');
  t.same(xmlEscape('привет<foo>'), 'привет&lt;foo&gt;');
  t.same(xmlEscape('la<f>\nbar"baz"\'yada\n\'&lt;la'), 'la&lt;f&gt;\nbar&quot;baz&quot;&#39;yada\n&#39;&amp;lt;la');
  t.same(xmlEscape('<p>'), '&lt;p&gt;');
  t.same(xmlEscape(new SafeString('<p>')), '<p>');
  t.end();
});
