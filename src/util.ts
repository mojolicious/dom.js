const XML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
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

export function xmlEscape(value: string | SafeString): string {
  if (value instanceof SafeString) return value.toString();
  return value.replace(/[&<>'"]/g, xmlReplace);
}

function xmlReplace(char: string): string {
  return XML_ESCAPE[char] ?? char;
}
