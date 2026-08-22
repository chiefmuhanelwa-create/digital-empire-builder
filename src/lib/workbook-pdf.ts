import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { pdfSafe } from "./pdf-text";
import { WORKBOOKS, giveAskRatio, type Block, type Workbook } from "./workbook-content";

// ── WORKBOOK RENDERER ───────────────────────────────────────────────────────
//
// A4, print-ready, generated from workbook-content.ts so the page and the paper
// can never disagree.
//
// THE BOX-COLOUR LAW is not decoration — it is how the reader knows, at a
// glance, whether a block is costing them effort or giving them something:
//
//     CREAM        my example      — worked, from a named profession
//     POWDER BLUE  your turn       — the only kind that asks
//     PALE YELLOW  the tip         — the honest catch, or the first move done
//
// pdf-lib rather than pdfkit, because pdfkit reads font metrics off the
// filesystem and there is no filesystem on Workers. This is the same constraint
// that shaped the rate-card generator.
const A4 = { w: 595.28, h: 841.89 };
const M = 52; // page margin
const CONTENT = A4.w - M * 2;

const GOLD = rgb(0xd4 / 255, 0xa8 / 255, 0x2f / 255);
const CHAR = rgb(0x1c / 255, 0x1c / 255, 0x1c / 255);
const INK = rgb(0x2b / 255, 0x2b / 255, 0x2b / 255);
const MUTED = rgb(0x6b / 255, 0x6b / 255, 0x6b / 255);
const CREAM = rgb(0xf1 / 255, 0xe7 / 255, 0xc3 / 255);
const POWDER = rgb(0xdc / 255, 0xeb / 255, 0xf6 / 255);
const PALEY = rgb(0xff / 255, 0xfc / 255, 0xe9 / 255);
const RULE = rgb(0xd8 / 255, 0xd8 / 255, 0xd8 / 255);
const WHITE = rgb(1, 1, 1);

interface Ctx {
  doc: PDFDocument;
  reg: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
  pageNo: number;
  header: string;
}

function wrap(font: PDFFont, raw: string, size: number, maxW: number): string[] {
  const words = pdfSafe(raw).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function newPage(c: Ctx): void {
  c.page = c.doc.addPage([A4.w, A4.h]);
  c.pageNo += 1;
  c.y = A4.h - M;

  // Centred CAPS running header + full-width gold rule.
  const h = pdfSafe(c.header.toUpperCase());
  const size = 8;
  const tracked = h.split("").join(" ");
  const wdt = c.bold.widthOfTextAtSize(tracked, size);
  c.page.drawText(tracked, {
    x: (A4.w - wdt) / 2,
    y: c.y,
    size,
    font: c.bold,
    color: MUTED,
  });
  c.y -= 10;
  c.page.drawRectangle({ x: M, y: c.y, width: CONTENT, height: 1.4, color: GOLD });
  c.y -= 26;

  // Page number in the outer corner.
  const n = String(c.pageNo);
  const even = c.pageNo % 2 === 0;
  c.page.drawText(n, {
    x: even ? M : A4.w - M - c.reg.widthOfTextAtSize(n, 9),
    y: M - 22,
    size: 9,
    font: c.reg,
    color: MUTED,
  });
}

function ensure(c: Ctx, needed: number): void {
  if (c.y - needed < M + 6) newPage(c);
}

function paragraph(c: Ctx, text: string, size = 10.5, color = INK, indent = 0): void {
  const lines = wrap(c.reg, text, size, CONTENT - indent);
  const lh = size * 1.55;
  for (const ln of lines) {
    ensure(c, lh);
    c.page.drawText(ln, { x: M + indent, y: c.y - size, size, font: c.reg, color });
    c.y -= lh;
  }
}

function heading(c: Ctx, text: string, size = 13): void {
  ensure(c, size * 2.4);
  c.y -= 8;
  const lines = wrap(c.bold, text, size, CONTENT);
  for (const ln of lines) {
    ensure(c, size * 1.4);
    c.page.drawText(ln, { x: M, y: c.y - size, size, font: c.bold, color: CHAR });
    c.y -= size * 1.4;
  }
  c.y -= 4;
}

/** A tinted block. The colour IS the instruction — see the box-colour law. */
function box(c: Ctx, b: Block): void {
  const fill = b.kind === "example" ? CREAM : b.kind === "ask" ? POWDER : PALEY;
  const labelText = b.kind === "example" ? "MY EXAMPLE" : b.kind === "ask" ? "YOUR TURN" : "TIP";

  const pad = 14;
  const bodySize = 10.5;
  const bodyLines = wrap(c.reg, b.body, bodySize, CONTENT - pad * 2);
  const ruled = b.kind === "ask" ? (b.lines ?? 5) : 0;
  const headH = b.heading ? 16 : 0;
  const h = pad + 12 + headH + bodyLines.length * bodySize * 1.5 + ruled * 20 + pad;

  // Never split a box across a page — a half-finished "your turn" is unusable.
  ensure(c, h + 10);

  const top = c.y;
  c.page.drawRectangle({ x: M, y: top - h, width: CONTENT, height: h, color: fill });
  c.page.drawRectangle({ x: M, y: top - h, width: 3, height: h, color: GOLD });

  let yy = top - pad;
  c.page.drawText(labelText, { x: M + pad, y: yy - 7, size: 7.5, font: c.bold, color: MUTED });
  yy -= 14;

  if (b.heading) {
    c.page.drawText(pdfSafe(b.heading), {
      x: M + pad,
      y: yy - 11,
      size: 11.5,
      font: c.bold,
      color: CHAR,
    });
    yy -= headH;
  }
  for (const ln of bodyLines) {
    c.page.drawText(ln, { x: M + pad, y: yy - bodySize, size: bodySize, font: c.reg, color: INK });
    yy -= bodySize * 1.5;
  }
  for (let i = 0; i < ruled; i++) {
    yy -= 20;
    c.page.drawRectangle({
      x: M + pad,
      y: yy + 4,
      width: CONTENT - pad * 2,
      height: 0.6,
      color: RULE,
    });
  }
  c.y = top - h - 14;
}

function receiptBlock(c: Ctx, b: Block): void {
  ensure(c, 60);
  const top = c.y;
  c.page.drawRectangle({ x: M, y: top - 4, width: CONTENT, height: 1.2, color: GOLD });
  c.y -= 16;
  if (b.heading) {
    c.page.drawText(pdfSafe(b.heading.toUpperCase()), {
      x: M,
      y: c.y - 8,
      size: 8,
      font: c.bold,
      color: GOLD,
    });
    c.y -= 18;
  }
  paragraph(c, b.body, 10.5, CHAR);
  c.y -= 6;
  c.page.drawRectangle({ x: M, y: c.y + 4, width: CONTENT, height: 1.2, color: GOLD });
  c.y -= 16;
}

function cover(c: Ctx, w: Workbook, stepNo: number): void {
  c.page = c.doc.addPage([A4.w, A4.h]);
  c.pageNo = 0;
  c.page.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: CHAR });

  let y = A4.h - 150;
  const step = `STEP ${stepNo} OF ${WORKBOOKS.length}`.split("").join(" ");
  c.page.drawText(step, {
    x: M,
    y,
    size: 9,
    font: c.bold,
    color: GOLD,
  });
  y -= 46;

  // Gold ALL-CAPS title with wide tracking.
  for (const ln of wrap(c.bold, w.title.toUpperCase(), 30, CONTENT)) {
    c.page.drawText(ln.split("").join(" "), {
      x: M,
      y: y - 30,
      size: 24,
      font: c.bold,
      color: GOLD,
    });
    y -= 40;
  }

  y -= 14;
  for (const ln of wrap(c.reg, w.subtitle, 12, CONTENT - 40)) {
    c.page.drawText(ln, { x: M, y: y - 12, size: 12, font: c.reg, color: WHITE });
    y -= 20;
  }

  y -= 44;
  c.page.drawRectangle({ x: M, y, width: 64, height: 1.4, color: GOLD });
  y -= 34;
  c.page.drawText("YOU START HERE", { x: M, y: y - 8, size: 8, font: c.bold, color: GOLD });
  y -= 20;
  for (const ln of wrap(c.reg, w.from, 11, CONTENT - 40)) {
    c.page.drawText(ln, { x: M, y: y - 11, size: 11, font: c.reg, color: rgb(0.85, 0.85, 0.85) });
    y -= 17;
  }
  y -= 22;
  c.page.drawText("YOU FINISH WITH", { x: M, y: y - 8, size: 8, font: c.bold, color: GOLD });
  y -= 20;
  for (const ln of wrap(c.bold, w.to, 11, CONTENT - 40)) {
    c.page.drawText(ln, { x: M, y: y - 11, size: 11, font: c.bold, color: WHITE });
    y -= 17;
  }

  c.page.drawText("CONTENTPRENEUR AFRICA", {
    x: M,
    y: M + 8,
    size: 8,
    font: c.bold,
    color: GOLD,
  });
  // Never print the price inside the product.
}

export async function generateWorkbookPDF(slug: string): Promise<Uint8Array> {
  const w = WORKBOOKS.find((x) => x.slug === slug);
  if (!w) throw new Error(`No workbook for "${slug}".`);

  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const c: Ctx = {
    doc,
    reg,
    bold,
    page: doc.addPage([A4.w, A4.h]),
    y: 0,
    pageNo: 0,
    header: w.title,
  };
  doc.removePage(doc.getPageCount() - 1);

  cover(c, w, WORKBOOKS.indexOf(w) + 1);
  newPage(c);

  for (const b of w.blocks) {
    if (b.kind === "teach") {
      if (b.heading) heading(c, b.heading);
      paragraph(c, b.body);
      c.y -= 8;
    } else if (b.kind === "receipt") {
      receiptBlock(c, b);
    } else {
      box(c, b);
    }
  }

  // Closing page — what they now have, and the one next thing.
  ensure(c, 120);
  c.y -= 10;
  heading(c, "You are done with this step", 14);
  paragraph(c, `You now have: ${w.to}`);
  c.y -= 6;
  const next = WORKBOOKS[WORKBOOKS.indexOf(w) + 1];
  paragraph(
    c,
    next
      ? `Next: ${next.title}. ${next.subtitle}`
      : "That was the last step. Somebody has your offer in front of them, which is further than almost anybody with your experience ever gets.",
    10.5,
    MUTED,
  );

  doc.setTitle(pdfSafe(`${w.title} — Contentpreneur Africa`));
  doc.setAuthor("Ndivhuwo Muhanelwa");
  doc.setSubject(pdfSafe(w.subtitle));
  return doc.save();
}

/** Filenames, so callers and the health check agree on one source. */
export const WORKBOOK_FILES: Record<string, string> = Object.fromEntries(
  WORKBOOKS.map((w) => [w.slug, w.file]),
);

/** Re-exported so the health check can assert the gate on the shipped content. */
export { giveAskRatio, WORKBOOKS };
