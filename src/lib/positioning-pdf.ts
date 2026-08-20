import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { pdfSafe } from "./pdf-text";
import {
  assembleSentence, defendingLine, runTests, score, verdictFor, PLACEMENTS,
  type Positioning,
} from "./positioning-engine";

// The Positioning Brief — the artifact the public tool actually delivers.
//
// pdf-lib rather than pdfkit: pdfkit reads its font metrics off disk with `fs`,
// which does not exist on Cloudflare Workers. Same reason the rate card was
// rewritten. All text goes through pdfSafe() — a name in a non-Latin script
// otherwise throws inside drawText and 500s the whole request.
//
// Contains no founder material. Everything on the page is the buyer's own words
// plus the verdicts on them.

const GOLD = rgb(0xc9 / 255, 0xa8 / 255, 0x4c / 255);
const INK = rgb(0x1c / 255, 0x1c / 255, 0x1c / 255);
const BODY = rgb(0x3b / 255, 0x3a / 255, 0x35 / 255);
const DIM = rgb(0x60 / 255, 0x5e / 255, 0x56 / 255);
const WHITE = rgb(1, 1, 1);
const PAPER = rgb(0xfa / 255, 0xfa / 255, 0xf7 / 255);
const RULE = rgb(0xe2 / 255, 0xe0 / 255, 0xd6 / 255);
const PASS = rgb(0x2a / 255, 0x6b / 255, 0x4c / 255);
const FAIL = rgb(0xb4 / 255, 0x65 / 255, 0x0f / 255);

const A4 = { w: 595.28, h: 841.89 };
const M = 48;

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;         // measured from the TOP, converted on write
  reg: PDFFont;
  bold: PDFFont;
}

function newPage(c: Ctx) {
  c.page = c.doc.addPage([A4.w, A4.h]);
  c.page.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: PAPER });
  c.y = M;
}

function ensure(c: Ctx, needed: number) {
  if (c.y + needed > A4.h - M) newPage(c);
}

function text(c: Ctx, s: string, opts: { size?: number; font?: PDFFont; color?: typeof INK; x?: number } = {}) {
  const size = opts.size ?? 10;
  const font = opts.font ?? c.reg;
  c.page.drawText(pdfSafe(s), {
    x: opts.x ?? M,
    y: A4.h - c.y - size,
    size,
    font,
    color: opts.color ?? BODY,
  });
}

/** Word-wrap, returning the height consumed. */
function paragraph(c: Ctx, s: string, opts: { size?: number; font?: PDFFont; color?: typeof INK; x?: number; width?: number; leading?: number } = {}) {
  const size = opts.size ?? 10;
  const font = opts.font ?? c.reg;
  const width = opts.width ?? A4.w - M * 2;
  const leading = opts.leading ?? size * 1.45;
  const out: string[] = [];
  let line = "";
  for (const w of pdfSafe(s).split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width && line) { out.push(line); line = w; }
    else line = next;
  }
  if (line) out.push(line);
  for (const l of out) {
    ensure(c, leading + 4);
    text(c, l, { size, font, color: opts.color, x: opts.x });
    c.y += leading;
  }
}

function rule(c: Ctx) {
  c.page.drawRectangle({ x: M, y: A4.h - c.y, width: A4.w - M * 2, height: 0.8, color: RULE });
  c.y += 14;
}

function label(c: Ctx, s: string) {
  ensure(c, 20);
  // pdf-lib has no letter-spacing, so tracked caps are drawn glyph by glyph.
  let x = M;
  for (const ch of pdfSafe(s.toUpperCase())) {
    c.page.drawText(ch, { x, y: A4.h - c.y - 7, size: 7, font: c.bold, color: GOLD });
    x += c.bold.widthOfTextAtSize(ch, 7) + 1.3;
  }
  c.y += 16;
}

export async function generatePositioningPDF(p: Positioning, name?: string | null): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const c: Ctx = { doc, page: doc.addPage([A4.w, A4.h]), y: 0, reg, bold };
  c.page.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: PAPER });

  const results = runTests(p);
  const passed = score(results);
  const v = verdictFor(passed);
  const sentence = assembleSentence(p);

  // ── header band
  c.page.drawRectangle({ x: 0, y: A4.h - 96, width: A4.w, height: 96, color: INK });
  c.page.drawText(pdfSafe("YOUR POSITIONING BRIEF"), { x: M, y: A4.h - 46, size: 18, font: bold, color: WHITE });
  c.page.drawText(
    pdfSafe(name ? `Prepared for ${name}` : "Prepared from your own answers"),
    { x: M, y: A4.h - 66, size: 9, font: reg, color: rgb(0.78, 0.76, 0.71) },
  );
  c.page.drawRectangle({ x: M, y: A4.h - 82, width: 34, height: 2, color: GOLD });
  c.y = 124;

  // ── the sentence
  label(c, "The sentence");
  paragraph(c, sentence, { size: 15, font: bold, color: INK, leading: 21 });
  c.y += 8;
  rule(c);

  // ── verdict
  label(c, `${passed} of 5 tests passed`);
  paragraph(c, v.headline, { size: 12, font: bold, color: INK, leading: 17 });
  c.y += 3;
  paragraph(c, v.body, { size: 10, color: DIM });
  c.y += 10;

  // ── the five tests
  for (const r of results) {
    ensure(c, 66);
    const mark = r.passed ? "PASS" : "FIX";
    const col = r.passed ? PASS : FAIL;
    c.page.drawRectangle({ x: M, y: A4.h - c.y - 11, width: 30, height: 14, color: col });
    c.page.drawText(pdfSafe(mark), { x: M + (r.passed ? 5 : 8), y: A4.h - c.y - 7.5, size: 7, font: bold, color: WHITE });
    c.page.drawText(pdfSafe(r.name), { x: M + 40, y: A4.h - c.y - 8, size: 10.5, font: bold, color: INK });
    c.page.drawText(pdfSafe(r.question), { x: M + 40 + bold.widthOfTextAtSize(pdfSafe(r.name), 10.5) + 8, y: A4.h - c.y - 8, size: 8.5, font: reg, color: DIM });
    c.y += 18;
    paragraph(c, r.note, { size: 9.5, color: BODY, x: M + 40, width: A4.w - M * 2 - 40 });
    if (r.fix) {
      paragraph(c, `-> ${r.fix}`, { size: 9.5, color: FAIL, x: M + 40, width: A4.w - M * 2 - 40 });
    }
    c.y += 8;
  }

  rule(c);

  // ── the defending line
  const def = defendingLine(p);
  if (def) {
    ensure(c, 80);
    label(c, "When they ask why it costs that");
    c.page.drawRectangle({ x: M, y: A4.h - c.y - 2, width: 3, height: 2, color: GOLD });
    paragraph(c, def, { size: 11, font: bold, color: INK, x: M + 12, width: A4.w - M * 2 - 12, leading: 16 });
    c.y += 6;
    paragraph(c, "Say it before they ask, not after. A price defended in advance is a position; a price defended afterwards is a negotiation.", { size: 9, color: DIM, x: M + 12, width: A4.w - M * 2 - 12 });
    c.y += 12;
  }

  // ── where it goes
  ensure(c, 130);
  label(c, "Where this sentence goes");
  for (const pl of PLACEMENTS) {
    ensure(c, 30);
    c.page.drawCircle({ x: M + 3, y: A4.h - c.y - 4, size: 2, color: GOLD });
    c.page.drawText(pdfSafe(pl.where), { x: M + 12, y: A4.h - c.y - 8, size: 10, font: bold, color: INK });
    c.y += 14;
    paragraph(c, pl.how, { size: 9, color: DIM, x: M + 12, width: A4.w - M * 2 - 12 });
    c.y += 5;
  }

  // ── close
  ensure(c, 90);
  c.y += 6;
  const boxTop = c.y;
  c.page.drawRectangle({ x: M, y: A4.h - boxTop - 74, width: A4.w - M * 2, height: 74, color: INK });
  c.page.drawText(pdfSafe("One sentence is not the business."), { x: M + 18, y: A4.h - boxTop - 26, size: 12, font: bold, color: WHITE });
  const closing = passed === 5
    ? "It is the thing every other part inherits. Put it live this week, then build the offer behind it."
    : "Fix what is marked FIX above, then put it live. Nothing downstream can be sharper than this sentence.";
  c.page.drawText(pdfSafe(closing.slice(0, 92)), { x: M + 18, y: A4.h - boxTop - 44, size: 8.5, font: reg, color: rgb(0.78, 0.76, 0.71) });
  c.page.drawText(pdfSafe("contentpreneur.africa"), { x: M + 18, y: A4.h - boxTop - 62, size: 8.5, font: bold, color: GOLD });

  return doc.save();
}
