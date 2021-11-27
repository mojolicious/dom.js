const XML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const XML_UNESCAPE: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'"
};

export class SafeString {
  _safe: string;

  constructor(safe: string) {
    this._safe = safe;
  }

  toString(): string {
    return this._safe;
  }
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stickyMatch(
  stringWithOffset: {offset: number; value: string},
  stickyRegex: RegExp
): RegExpMatchArray | null {
  stickyRegex.lastIndex = stringWithOffset.offset;
  const match = stickyRegex.exec(stringWithOffset.value);
  if (match !== null) stringWithOffset.offset = stickyRegex.lastIndex;
  return match;
}

export function xmlEscape(value: string | SafeString): string {
  if (value instanceof SafeString) return value.toString();
  return value.replace(/[&<>'"]/g, xmlEscapeReplace);
}

function xmlEscapeReplace(char: string): string {
  return XML_ESCAPE[char];
}

export function xmlUnescape(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|apos|#39);/g, xmlUnescapeReplace);
}

function xmlUnescapeReplace(value: string, entity: string): string {
  return XML_UNESCAPE[entity];
}
