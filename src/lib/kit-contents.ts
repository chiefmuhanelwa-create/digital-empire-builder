// WHAT THE FOUNDATION KIT CONTAINS — one source, so the copy cannot drift.
//
// The sales page said "25 tools" on the day the catalogue held 27, because both
// numbers were typed by hand in different files. Same class of bug as the
// receipt email describing a seven-step path that had not existed for two
// rebuilds. Counts are derived here and imported everywhere else.
//
// Client-safe on purpose: products.functions.ts imports KIT_FILES FROM this
// file rather than the other way round, so a public sales page can read the
// counts without dragging server code into the browser bundle.
import { TOOLS } from "./kit-catalog";
import { WORKBOOKS } from "./workbook-content";

/**
 * Workbooks stored in the private `product-files` bucket (key → filename).
 * Verified present, all ten, by /admin/kit-health on 2026-08-22.
 */
export const KIT_FILES: Record<string, string> = {
  "niche-clarity": "niche-clarity-workbook.pdf",
  paids: "paids-framework-workbook.pdf",
  "ms-ts-ss": "ms-ts-ss-workbook.pdf",
  "knowledge-audit": "knowledge-audit-workbook.pdf",
  "4e-content-calendar": "4e-content-calendar-workbook.pdf",
  "seeds-pipeline": "seeds-pipeline-workbook.pdf",
  "dares-asset-model": "dares-asset-model-workbook.pdf",
  "90-day-planner": "90-day-first-income-planner.pdf",
  "cheat-sheet": "called-expert-cheat-sheet.pdf",
  "30-day-tracker": "30-day-accountability-tracker.pdf",
};

/**
 * Bucket files surfaced somewhere OTHER than a tool's own page.
 *
 * kit-health flags a whitelisted file that no tool references, on the grounds
 * that the buyer paid for it and cannot reach it. That check reported the cheat
 * sheet as unreachable when it has had its own card in the workspace all along
 * — a false alarm, and a health check that cries wolf gets ignored, which is
 * worse than having none. Anything listed here is deliberately surfaced
 * elsewhere; say where.
 */
export const SURFACED_OUTSIDE_TOOLS: Record<string, string> = {
  "cheat-sheet": "Its own card in the Foundation Kit workspace, under the workbooks list.",
};

export const TOOL_COUNT = TOOLS.length;
/** Bucket workbooks plus the five generated path workbooks. */
export const WORKBOOK_COUNT = Object.keys(KIT_FILES).length + WORKBOOKS.length;
export const VIDEO_LESSON_COUNT = 10;
