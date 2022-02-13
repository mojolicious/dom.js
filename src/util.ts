const XML_UNESCAPE: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'"
};

export function cssUnescape(value: string): string {
  return value.replaceAll('\\n', '').replace(/\\([0-9a-fA-F]{1,6})\s?/g, cssUnescapeReplace);
}

function cssUnescapeReplace(value: string): string {
  return String.fromCharCode(parseInt(value.replaceAll('\\', ''), 16));
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

export function xmlUnescape(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|apos|#39);/g, xmlUnescapeReplace);
}

function xmlUnescapeReplace(value: string, entity: string): string {
  return XML_UNESCAPE[entity];
}
