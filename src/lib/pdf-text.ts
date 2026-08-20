// pdf-lib's standard fonts (Helvetica et al) are WinAnsi-encoded and THROW on
// any character outside that set. Anything user-supplied that reaches drawText
// — a creator's name, a brand name, a handle — can therefore take down the
// whole request with a 500 rather than degrading.
//
// That is not hypothetical now the tools serve all 54 African countries: names
// in Arabic (Egypt, Sudan), Amharic (Ethiopia), Tifinagh (Morocco) or any
// non-Latin script hit it immediately.
//
// Every PDF generator in this codebase routes its text through here. If you add
// another one, use this — do not call drawText with raw input.

const SUBSTITUTIONS: Record<string, string> = {
  "−": "-", // U+2212 minus — the one that actually crashed first
  "–": "-", // en dash
  "—": "-", // em dash
  "‘": "'",
  "’": "'",
  "‚": ",",
  "“": '"',
  "”": '"',
  "„": '"',
  "…": "...",
  " ": " ", // non-breaking space
  " ": " ", // thin space
  " ": " ", // narrow no-break space
  "•": "-",
  "×": "x",
  "→": "->",
  "←": "<-",
  "≈": "~",
  "™": "(TM)",
};

/**
 * Make a string safe to hand to a pdf-lib standard font.
 * Known typographic characters are substituted; anything else outside
 * WinAnsi's range is dropped rather than allowed to throw.
 */
export function pdfSafe(input: string): string {
  let out = "";
  for (const ch of input) {
    const sub = SUBSTITUTIONS[ch];
    if (sub !== undefined) {
      out += sub;
      continue;
    }
    const code = ch.codePointAt(0) ?? 0;
    // Printable ASCII, plus the Latin-1 supplement WinAnsi covers.
    if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) {
      out += ch;
    }
    // everything else is intentionally dropped
  }
  return out;
}

/**
 * A display name that survives sanitising. If a name is entirely non-Latin
 * there would be nothing left to print, so fall back rather than render blank.
 */
export function pdfSafeName(input: string | undefined, fallback = "Creator"): string {
  const cleaned = pdfSafe((input ?? "").trim()).trim();
  return cleaned.length > 0 ? cleaned : fallback;
}
