import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import {
  TAX_YEAR,
  BRACKETS,
  PRIMARY_REBATE,
  TAX_THRESHOLD,
  INCOME_SOURCES,
  EXPENSE_CATEGORIES,
  type TaxResult,
} from "./provisional-tax-engine";
import { pdfSafe, pdfSafeName } from "./pdf-text";

// The document a creator forwards to their accountant, or keeps for their own
// records. Same Workers-safe pdf-lib approach as the rate card (pdfkit cannot
// run on Cloudflare Workers — it reads font metrics off disk).
//
// Design intent: this has to survive being opened by a tax practitioner, so it
// leads with the numbers and shows its working. No marketing above the fold.

const GOLD = rgb(0xc9 / 255, 0xa8 / 255, 0x4c / 255);
const DARK = rgb(0x1c / 255, 0x1c / 255, 0x1c / 255);
const WHITE = rgb(1, 1, 1);
const PAPER = rgb(0xfa / 255, 0xf7 / 255, 0xf0 / 255);
const GRAY = rgb(0x77 / 255, 0x77 / 255, 0x77 / 255);
const BORDER = rgb(0xe2 / 255, 0xdd / 255, 0xd2 / 255);
const GOLD_TINT = rgb(0xfd / 255, 0xf8 / 255, 0xee / 255);
const HAIRLINE = rgb(0xf0 / 255, 0xed / 255, 0xe6 / 255);

const W = 794;
const H = 1123;
const PAD = 52;
const COL = W - PAD * 2;
const BASELINE = 0.8;

const zar = (n: number) => "R " + Math.round(n).toLocaleString("en-ZA");

interface T {
  x: number;
  top: number;
  size: number;
  font: PDFFont;
  color: RGB;
  opacity?: number;
  tracking?: number;
  align?: "left" | "center" | "right";
  width?: number;
}

function text(page: PDFPage, raw: string, o: T) {
  const s = pdfSafe(raw);
  const { x, top, size, font, color, opacity = 1, tracking = 0, align = "left", width } = o;
  const y = H - (top + size * BASELINE);
  let sx = x;
  if (align !== "left" && width != null) {
    const w = font.widthOfTextAtSize(s, size) + tracking * Math.max(0, s.length - 1);
    sx = align === "center" ? x + (width - w) / 2 : x + width - w;
  }
  if (!tracking) {
    page.drawText(s, { x: sx, y, size, font, color, opacity });
    return;
  }
  let cx = sx;
  for (const ch of s) {
    page.drawText(ch, { x: cx, y, size, font, color, opacity });
    cx += font.widthOfTextAtSize(ch, size) + tracking;
  }
}

function box(
  page: PDFPage,
  x: number,
  top: number,
  w: number,
  h: number,
  fill?: RGB,
  border?: RGB,
) {
  page.drawRectangle({
    x,
    y: H - top - h,
    width: w,
    height: h,
    ...(fill ? { color: fill } : {}),
    ...(border ? { borderColor: border, borderWidth: 1 } : {}),
  });
}

function wrap(font: PDFFont, raw: string, size: number, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of pdfSafe(raw).split(/\s+/)) {
    const t = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(t, size) > max && line) {
      out.push(line);
      line = word;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

export interface TaxPdfData {
  creatorName?: string;
  result: TaxResult;
  income: Record<string, number>;
  expenses: Record<string, number>;
  date: string;
}

export async function generateTaxPDF(d: TaxPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Provisional Tax Estimate ${TAX_YEAR} — NOCHILL`);
  const page = doc.addPage([W, H]);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const r = d.result;

  box(page, 0, 0, W, H, PAPER);

  // Header
  box(page, 0, 0, W, 96, DARK);
  text(page, "PROVISIONAL TAX ESTIMATE  ·  NOCHILL", {
    x: PAD,
    top: 24,
    size: 7.5,
    font: bold,
    color: GOLD,
    tracking: 2.2,
  });
  text(page, pdfSafeName(d.creatorName).toUpperCase(), {
    x: PAD,
    top: 40,
    size: 24,
    font: bold,
    color: WHITE,
  });
  text(page, `${TAX_YEAR} tax year`, {
    x: 0,
    top: 28,
    size: 10,
    font: bold,
    color: GOLD,
    align: "right",
    width: W - PAD,
  });
  text(page, d.date, {
    x: 0,
    top: 44,
    size: 9,
    font: reg,
    color: WHITE,
    opacity: 0.6,
    align: "right",
    width: W - PAD,
  });
  box(page, 0, 96, W, 4, GOLD);

  // Headline numbers
  const stripY = 100;
  box(page, 0, stripY, W, 86, DARK);
  const cells = [
    { l: "TOTAL INCOME", v: zar(r.totalIncome) },
    { l: "DEDUCTIONS", v: "−" + zar(r.totalExpenses) },
    { l: "TAXABLE INCOME", v: zar(r.taxable) },
    { l: "TAX FOR THE YEAR", v: zar(r.annualTax) },
  ];
  const cw = W / 4;
  cells.forEach((c, i) => {
    if (i > 0) box(page, i * cw, stripY + 14, 1, 58, rgb(0.2, 0.2, 0.2));
    text(page, c.l, {
      x: i * cw,
      top: stripY + 16,
      size: 7,
      font: bold,
      color: GRAY,
      tracking: 1.4,
      align: "center",
      width: cw,
    });
    text(page, c.v, {
      x: i * cw,
      top: stripY + 34,
      size: 15,
      font: bold,
      color: i === 3 ? GOLD : WHITE,
      align: "center",
      width: cw,
    });
  });
  box(page, 0, 186, W, 4, GOLD);

  // The two payments — the actionable part
  let y = 214;
  text(page, "WHAT YOU PAY, AND WHEN", {
    x: PAD,
    top: y,
    size: 7.5,
    font: bold,
    color: GRAY,
    tracking: 1.5,
  });
  y += 20;
  const halfW = (COL - 14) / 2;
  const pay = [
    { l: "1st provisional (IRP6)", v: zar(r.firstPayment), w: "By 31 August" },
    { l: "2nd provisional (IRP6)", v: zar(r.secondPayment), w: "By the last day of February" },
  ];
  pay.forEach((p, i) => {
    const x = PAD + i * (halfW + 14);
    box(page, x, y, halfW, 92, i === 0 ? GOLD_TINT : WHITE, i === 0 ? GOLD : BORDER);
    text(page, p.l.toUpperCase(), {
      x,
      top: y + 14,
      size: 7,
      font: bold,
      color: GRAY,
      tracking: 1.3,
      align: "center",
      width: halfW,
    });
    text(page, p.v, {
      x,
      top: y + 32,
      size: 26,
      font: bold,
      color: DARK,
      align: "center",
      width: halfW,
    });
    text(page, p.w, {
      x,
      top: y + 68,
      size: 9,
      font: reg,
      color: GRAY,
      align: "center",
      width: halfW,
    });
  });
  y += 108;

  // Set-aside guidance
  box(page, PAD, y, COL, 54, DARK);
  text(page, "SET ASIDE EVERY MONTH", {
    x: PAD + 18,
    top: y + 13,
    size: 7,
    font: bold,
    color: GOLD,
    tracking: 1.4,
  });
  text(page, `${zar(r.monthlySetAside)} a month, into an account you never spend from.`, {
    x: PAD + 18,
    top: y + 28,
    size: 13,
    font: bold,
    color: WHITE,
  });
  y += 70;

  // Rates
  text(page, "YOUR RATES", { x: PAD, top: y, size: 7.5, font: bold, color: GRAY, tracking: 1.5 });
  y += 18;
  const rates = [
    {
      l: "Effective rate",
      v: `${(r.effectiveRate * 100).toFixed(1)}%`,
      s: "Across everything you earned",
    },
    {
      l: "Marginal rate",
      v: `${(r.marginalRate * 100).toFixed(0)}%`,
      s: "What your next rand is taxed at",
    },
    { l: "Take-home", v: zar(r.takeHome), s: "After expenses and tax" },
  ];
  const rw = (COL - 20) / 3;
  rates.forEach((c, i) => {
    const x = PAD + i * (rw + 10);
    box(page, x, y, rw, 74, WHITE, BORDER);
    text(page, c.l.toUpperCase(), {
      x,
      top: y + 12,
      size: 6.5,
      font: bold,
      color: GRAY,
      tracking: 1.2,
      align: "center",
      width: rw,
    });
    text(page, c.v, {
      x,
      top: y + 26,
      size: 19,
      font: bold,
      color: DARK,
      align: "center",
      width: rw,
    });
    for (const [li, ln] of wrap(reg, c.s, 7.5, rw - 16).entries()) {
      text(page, ln, {
        x,
        top: y + 52 + li * 10,
        size: 7.5,
        font: reg,
        color: GRAY,
        align: "center",
        width: rw,
      });
    }
  });
  y += 92;

  // Breakdown — income and expenses side by side
  const rowsY = y;
  const listW = (COL - 20) / 2;
  const drawList = (
    x: number,
    title: string,
    items: readonly { key: string; label: string }[],
    values: Record<string, number>,
    total: number,
    totalLabel: string,
  ) => {
    text(page, title, { x, top: rowsY, size: 7.5, font: bold, color: GRAY, tracking: 1.5 });
    let ry = rowsY + 18;
    const used = items.filter((i) => (values[i.key] || 0) > 0);
    if (used.length === 0) {
      text(page, "None entered", { x, top: ry + 4, size: 9.5, font: reg, color: GRAY });
      ry += 20;
    }
    for (const it of used) {
      text(page, it.label, { x, top: ry, size: 9.5, font: reg, color: DARK });
      text(page, zar(values[it.key]), {
        x,
        top: ry,
        size: 9.5,
        font: bold,
        color: DARK,
        align: "right",
        width: listW,
      });
      box(page, x, ry + 16, listW, 0.5, HAIRLINE);
      ry += 22;
    }
    box(page, x, ry + 2, listW, 26, GOLD_TINT);
    text(page, totalLabel, { x: x + 10, top: ry + 10, size: 9, font: bold, color: DARK });
    text(page, zar(total), {
      x: x - 10,
      top: ry + 10,
      size: 10,
      font: bold,
      color: DARK,
      align: "right",
      width: listW,
    });
    return ry + 36;
  };

  const yA = drawList(PAD, "INCOME", INCOME_SOURCES, d.income, r.totalIncome, "Total income");
  const yB = drawList(
    PAD + listW + 20,
    "DEDUCTIONS",
    EXPENSE_CATEGORIES,
    d.expenses,
    r.totalExpenses,
    "Total deductions",
  );
  y = Math.max(yA, yB) + 10;

  // Bracket table — show the working
  text(page, `${TAX_YEAR} SARS TAX TABLE`, {
    x: PAD,
    top: y,
    size: 7.5,
    font: bold,
    color: GRAY,
    tracking: 1.5,
  });
  y += 18;
  box(page, PAD, y, COL, 18, DARK);
  text(page, "TAXABLE INCOME", {
    x: PAD + 12,
    top: y + 5,
    size: 7,
    font: bold,
    color: GOLD,
    tracking: 1.2,
  });
  text(page, "RATE", {
    x: PAD - 12,
    top: y + 5,
    size: 7,
    font: bold,
    color: GOLD,
    tracking: 1.2,
    align: "right",
    width: COL,
  });
  y += 18;
  let low = 1;
  for (const b of BRACKETS) {
    const range =
      b.upTo === Infinity
        ? `R${low.toLocaleString("en-ZA")} and above`
        : `R${low.toLocaleString("en-ZA")} – R${b.upTo.toLocaleString("en-ZA")}`;
    const inBand = r.taxable >= low && (b.upTo === Infinity || r.taxable <= b.upTo);
    if (inBand) box(page, PAD, y, COL, 17, GOLD_TINT);
    text(page, range, {
      x: PAD + 12,
      top: y + 4,
      size: 8.5,
      font: inBand ? bold : reg,
      color: DARK,
    });
    text(page, `${(b.rate * 100).toFixed(0)}%`, {
      x: PAD - 12,
      top: y + 4,
      size: 8.5,
      font: inBand ? bold : reg,
      color: DARK,
      align: "right",
      width: COL,
    });
    box(page, PAD, y + 17, COL, 0.5, HAIRLINE);
    low = b.upTo + 1;
    y += 17;
  }
  y += 8;
  text(
    page,
    `Primary rebate ${zar(PRIMARY_REBATE)}  ·  Tax threshold ${zar(TAX_THRESHOLD)}  ·  Your band is highlighted`,
    {
      x: PAD,
      top: y,
      size: 8,
      font: reg,
      color: GRAY,
    },
  );

  // Footer
  const fy = 1058;
  box(page, PAD, fy - 14, COL, 1, BORDER);
  for (const [i, ln] of wrap(
    reg,
    "This is an estimate to help you plan and reserve — not tax advice. Confirm your figures with a registered tax practitioner before filing. Generated by CHKPLT.",
    7.5,
    COL,
  ).entries()) {
    text(page, ln, { x: PAD, top: fy - 2 + i * 10, size: 7.5, font: reg, color: GRAY });
  }
  text(page, "chkplt.com", {
    x: 0,
    top: fy + 8,
    size: 8,
    font: bold,
    color: GOLD,
    align: "right",
    width: W - PAD,
  });

  return doc.save();
}
