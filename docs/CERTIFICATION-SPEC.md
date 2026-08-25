# Contentpreneur Certification — build spec

**Status:** specified, not yet awarded. Founder ruling 2026-08-25 overrode the
"not Year 1" position in `nochill-brain` and the global `CLAUDE.md`.

**The concern that was overridden, recorded so it isn't lost:** the source strategy
doc says certification "should be sequenced after the Academy curriculum is stable,
since certification requires a finished, assessable curriculum to certify against."
That is still true. This spec resolves it by certifying **only against curriculum
that is finished and live today** (see §2), rather than waiting or pretending.

Source: `Contentpreneur Africa/knowledge-base/business/certification-strategy.md`
(the 5-level ladder and the assessment-method superset), extended here into a
buildable spec.

---

## 1. What a certificate has to be, to be worth anything

A credential nobody can check is a graphic. Three properties are non-negotiable:

1. **Verifiable by a third party** — a public URL an employer can load without an
   account, showing holder, level, issue date, and whether it is still valid.
2. **Earned against fixed evidence** — the same requirements for everyone, recorded
   at the time of assessment, not reconstructed later.
3. **Revocable** — a standard that cannot be withdrawn is not a standard. Revocation
   must be visible on the same public URL.

**What an SA employer or client is actually buying:** proof that this person has
built and shipped a real revenue-generating knowledge asset — not that they watched
a course. Every level below is assessed on *artefacts produced*, never on completion
percentage.

---

## 2. What can honestly be certified today

| Product | Live curriculum | Certifiable now? |
|---|---|---|
| `contentpreneur-90day-cohort` (Accelerator PRO, R16,081.61) | **7 modules, live** — the 7-Stage Transformation | ✅ Yes — this is the assessable spine |
| `called-expert-foundation-kit` (R1,565.03) | 1 module, 10 lessons + workspace tools | ⚠️ Partial — supports Level 1 evidence, not a level on its own |
| `called-expert-foundations` (R4,791.89) | **advertises 4 modules, has zero** | ❌ No. Blocked — see §7 |
| `called-expert-facilitator` (R64,537.20) | Application + interview, human-delivered | ✅ Already live as Level 4's commercial wrapper |

The Accelerator's 7 modules map 1:1 to the 7-Stage Transformation
(MS×TS×SS → SWOT → 4Es → Social Media → 3Cs → DARES → PAIDS). That mapping is the
rubric spine for Level 1.

---

## 3. The ladder — rubric per level

Levels 1–3 and 5 have **no product row yet**. Level 4 does
(`called-expert-facilitator`). Prices for the others are a founder decision and are
deliberately not invented here.

### Level 1 — Certified Contentpreneur
- **Prerequisite:** Accelerator PRO grant + all 7 modules complete.
- **Evidence required (all four):**
  1. A published knowledge asset with a working checkout URL
  2. An owned audience list with ≥1 send and its open rate
  3. A PAIDS map naming which streams are live vs planned
  4. Proof of at least one paid transaction (redacted receipt)
- **Assessment:** portfolio review against the four items. Binary per item.
- **Pass:** 4/4. No partial pass — three-quarters of an asset earns nothing.

### Level 2 — Certified Strategist
- **Prerequisite:** Level 1 held ≥90 days.
- **Evidence:** the same four artefacts produced **for someone who is not you**,
  plus a written diagnosis of that person's stage and the reasoning for the
  recommended path.
- **Assessment:** portfolio + case study.
- **Pass:** 4/4 artefacts and a diagnosis that a reviewer can follow to the same
  conclusion.

### Level 3 — Certified Coach
- **Prerequisite:** Level 2.
- **Evidence:** three clients taken through a full stage transition, with
  before/after numbers each; one recorded coaching session.
- **Assessment:** portfolio + case studies + recorded-session review.
- **Pass:** 3/3 clients evidenced, session meets the coaching rubric.

### Level 4 — Licensed Trainer
- **Prerequisite:** Level 3.
- **Evidence:** delivers the curriculum to a cohort under observation; signed
  licence terms; IP register acknowledgement.
- **Assessment:** application + interview + observed delivery.
- **Commercial wrapper already live:** `called-expert-facilitator`, R64,537.20,
  application-gated.
- **Pass:** interview + observed delivery both cleared.

### Level 5 — Master Contentpreneur
- **Prerequisite:** Level 4, held ≥12 months.
- **Evidence:** trained trainers who themselves certified; sustained revenue
  evidence.
- **Assessment:** founder review. Deliberately discretionary and rare.

---

## 4. Revocation

Grounds: fabricated evidence, misrepresenting the level held, licence breach
(Level 4+), or a refund/chargeback that voids the prerequisite grant.

Effect: `revoked_at` set with a reason. The public verification page then renders
**REVOKED** with the date. Certificates are never deleted — a disappearing
credential is indistinguishable from one that never existed.

---

## 5. Data model

New table `certificates` (new migration file — existing migrations are immutable):

| column | purpose |
|---|---|
| `id` | uuid pk |
| `user_id` | fk → `profiles` |
| `level` | 1–5, constrained |
| `slug` | public verification slug, unique, unguessable |
| `holder_name` | name as it appears on the credential |
| `issued_at` | timestamptz |
| `evidence` | jsonb — the artefact refs assessed, frozen at issue |
| `assessed_by` | who signed it off |
| `revoked_at` / `revoked_reason` | nullable |

**RLS:** holders read their own; admins read/write all; **anon reads only
`slug`, `holder_name`, `level`, `issued_at`, `revoked_at`** via a restricted view
— never `evidence` (it contains revenue figures) and never `user_id`.

Hangs off `product_grants` and `lesson_progress`, both of which already exist.

---

## 6. Public verification

Route `/verify/$slug` — no auth, loads for anyone, renders holder, level, issue
date, and validity. A `noindex` header so credentials aren't scraped into search.

---

## 7. Hard prerequisite

**No certificate is awarded against `called-expert-foundations` until it has
lessons.** It is published at R4,791.89, is not application-gated, and its own
`format` field advertises "LMS course — 4 recorded modules, self-paced" while the
live database holds zero modules and zero lessons for it. Certifying against it
would convert a delivery bug into a credential fraud.

Level 1 certifies against the **Accelerator**, which has its 7 modules live. That
is why the spec is buildable now despite this gap.

---

## 8. Open — founder decisions, not assumptions

1. Price for Levels 1, 2, 3, 5. Level 4 is live at R64,537.20.
2. Whether Level 1 is included in the Accelerator or sold separately.
3. Whether the credential carries an expiry / renewal.
4. **Awards claim:** the source strategy doc says "3x-consecutive SAMA judge
   (SAMA 30, 31, 32)". The global `CLAUDE.md` says SAMA 30 & 31. These conflict and
   `PROOF.md` is the authority — resolve there before any of it appears on a
   certificate or a sales page. Do not assert 32 until it is checked.
