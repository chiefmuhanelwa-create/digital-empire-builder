# CHKPLT — Email Infrastructure Reference

> The email list is the only platform we own 100%. Instagram can suspend (780K gone). AdSense can disable (R180K/year gone). The email list cannot be suspended.

---

## Two-Track Email System

| Track | Tool | Purpose | Trigger |
|-------|------|---------|---------|
| **Transactional** | Lovable Cloud (pgmq queue) | Auth, order receipts, password reset | System events |
| **Marketing** | MailerLite | Welcome sequences, nurture, ICP 1 upgrade, broadcasts | User actions + tags |

---

## Track 1 — Transactional Email (Lovable Cloud)

### Setup

- **Sending domain:** `notify.chkplt.com` — must be DNS-verified in Lovable Cloud
- **API key:** `LOVABLE_EMAIL_API_KEY` in `.env`
- **Queue:** pgmq (built into Supabase) — `auth_emails` (15-min TTL) + `transactional_emails` (60-min TTL)
- **Dead letter queues:** `auth_emails_dlq`, `transactional_emails_dlq`
- **Rate limiting:** 10 emails/batch, 200ms delay, Retry-After state in `email_send_state` singleton table
- **Email log:** All sends logged in `email_send_log` table with status tracking

### CRITICAL STATUS — Domain Drifted

`notify.chkplt.com` DNS has drifted from Lovable Cloud verification.

**Impact:** ALL transactional email is broken:
- Magic-link login doesn't work (users cannot login)
- Signup confirmation doesn't send
- Order receipts don't send (buyers don't know what they bought)
- Password reset doesn't work

**Fix:** Lovable Cloud Dashboard → Emails → Manage Domains → select `notify.chkplt.com` → re-verify DNS records → wait for propagation (up to 48 hours)

**Do this FIRST before any other testing. Login is broken until this is fixed.**

### 7 Transactional Templates (`src/lib/email-templates/`)

| Template | File | When sent | Key merge data |
|----------|------|-----------|---------------|
| Magic Link | `magic-link.tsx` | Login request | `{link}`, `{email}` |
| Signup | `signup.tsx` | New account | `{name}`, `{link}` |
| Email Change | `email-change.tsx` | Update email | `{old_email}`, `{link}` |
| Recovery | `recovery.tsx` | Password reset | `{link}` |
| Reauthentication | `reauthentication.tsx` | Re-auth challenge | `{link}` |
| Invite | `invite.tsx` | Admin invites user | `{name}`, `{link}` |
| Order Receipt | `order-receipt.tsx` | Payment confirmed | `{name}`, `{product}`, `{amount}`, `{download_link}` |

### Branding for All Transactional Emails
- Background: `#f0f0f0` (wrapper grey)
- Card: `#fffbea` (cream)
- Accent: `#C9A84C` (Heritage Gold — map to `--banana` CSS var)
- Text: `#111111` (Tool Black)
- Font: Arial/system-sans (React-Email limitation — no Google Fonts)
- Footer: `chkplt.com | @nochill_god`

---

## Track 2 — Marketing Email (MailerLite)

### Account Setup
- **API key:** `MAILERLITE_API_KEY`
- **Reply-to:** chiefmuhanelwa@gmail.com
- **From name:** Ndivhuwo | NoChill
- **Send time:** 9am SAST (UTC+2)
- **Max frequency:** Never more than 3 emails in a week; 2-day minimum gap

### Subscriber Groups

| Group | Env Var | Who |
|-------|---------|-----|
| Called Expert Prospects | `MAILERLITE_GROUP_ID_CALLED_EXPERT` | ICP 1 leads, tagged from content or /apply |
| Free Blueprint Subscribers | `MAILERLITE_GROUP_ID_FREE_BLUEPRINT` | Downloaded Called Expert Blueprint |
| 11th Hour Playbook | `MAILERLITE_GROUP_ID_FREE_11TH_HOUR` | Downloaded 11th Hour Playbook |
| Right Side Assessment | `MAILERLITE_GROUP_ID_FREE_RIGHT_SIDE` | Completed Right Side Assessment |
| 4-Hour Window | `MAILERLITE_GROUP_ID_FREE_4HR_WINDOW` | Downloaded 4-Hour Window System |
| Knowledge Audit | `MAILERLITE_GROUP_ID_FREE_KNOWLEDGE_AUDIT` | Downloaded Knowledge Audit |
| Buyers | `MAILERLITE_GROUP_ID_BUYERS` | All paying customers (any product) |

### ICP 1 Upgrade Trigger (Critical Automation)

Any reply or engagement that includes these words → tag `called-expert-potential` → route to Called Expert upgrade sequence:
- "salary," "job," "employer," "expertise," "qualification," "teaching," "knowledge," "professional," "years of experience," "nurse," "doctor," "teacher," "accountant," "lecturer," "engineer"

---

## The 7-Email Welcome Sequence

**Trigger:** Any opt-in to a free product or the main list
**Timing:** Days 1, 3, 5, 7, 9, 11, 13 (2-day intervals)
**Voice:** Warm, faith-infused, big-brother energy. Raw. Not corporate.

### Email 1 — Day 1 (Trust Building)
**Subject:** "I owe you more than I've been giving"
**Purpose:** Introduce Ndivhuwo, the 780K story, what's coming in the sequence
**Lead:** The loss (780K suspended, AdSense disabled) → why it changed everything
**CTA:** None — just establish trust and set up the next email
**Tone:** Vulnerable before strong

### Email 2 — Day 3 (Diagnosis)
**Subject:** "You're not lazy. You're unstructured."
**Purpose:** Reframe the consistency problem as a systems problem, not a character flaw
**Key insight:** Consistency is a system, not a character trait
**Teach:** Batch method formula: Pick 3 content pillars → 10 posts per pillar → one 2-3hr session per week
**CTA:** "Reply with your biggest challenge right now"

### Email 3 — Day 5 (Education)
**Subject:** "5 ways your content can make money"
**Purpose:** PAIDS breakdown — most creators only use one stream (A)
**Teach:** P = Products, A = Ads+Affiliates, I = Information, D = Deals, S = Services
**Proof:** R23,000 in ONE day from the 'A' stream (AdMarula affiliate link)
**CTA:** Download PAIDS PDF (if not already)

### Email 4 — Day 7 (Framework)
**Subject:** "You're talking to everyone. That's why you reach nobody."
**Purpose:** Niche clarity — the #2 pain point from audience data
**Teach:** 3-step niche formula: Name your experience → Name your person → Name the transformation
**CTA:** "Reply with your niche draft — I'll respond personally"

### Email 5 — Day 9 (Ownership)
**Subject:** "I lost 780,000 followers in one morning."
**Purpose:** River vs Fish Tank — why the email list is the only thing they own
**Lead:** The Instagram suspension story (August 2025, 780K gone)
**Teach:** LEFT side = rented platforms (Instagram, AdSense, TikTok). RIGHT side = email list, products, CHKPLT.
**CTA:** "Start your email list free on MailerLite (free to 1,000 subscribers)"

### Email 6 — Day 11 (Monetisation)
**Subject:** "What brands actually want (it's not your follower count)"
**Purpose:** Brand deal education + positioning for ICP 2 monetisation
**Teach:** Engagement rate > follower count. Consistency. Audience alignment. Media kit.
**Pricing formula:**
- Nano (1K–10K): R500–R3,000
- Micro (10K–50K): R3,000–R8,000
- Mid (50K–500K): R8,000–R20,000
- Macro (500K+): R20,000–R100,000+
**Proof:** R350 first brand deal (2017) → R10,500 per Reel (Capitec 2026)

### Email 7 — Day 13 (Offer)
**Subject:** "I built something for you"
**Purpose:** First product offer with proof-first framing
**Lead:** What the sequence has been building toward
**CTA options:**
- ICP 2: Niche Clarity Workbook (R199) or Creator Starter Bundle
- ICP 1: Called Expert Blueprint (free) or Starter Kit (R997)
- Discount code: time-limited (48-hour expiry)
**Tone:** Celebration, not pressure. "This is for the ones who are serious."

---

## ICP 1 Upgrade Sequence (After Day 13)

For subscribers tagged `called-expert-potential`:

| Email | Day | Subject angle | Product |
|-------|-----|--------------|---------|
| A | 15 | "Your salary is SARS's number, not yours" | Called Expert Blueprint (free) |
| B | 18 | Matthew 20 — "You're not too late" | 11th Hour Playbook (free) |
| C | 21 | "The shift worker who built R600K between night shifts" | 4-Hour Window System (free) |
| D | 25 | "What 20 years of expertise + zero packaging looks like" | Starter Kit (R997) |
| E | 30 | "6 spots. 20 weeks. R18,000." | Called Expert Accelerator PRO |

---

## Email Copy Rules (NOCHILL Voice)

1. **Subject line:** Specific amount OR story hook OR direct question. Never vague.
   - ✅ "I lost R180,000/year in one email from Google"
   - ❌ "Important update about your account"

2. **Opening:** Lead with the truth they need to hear, not a greeting.
   - ✅ "You've been posting for 6 months. No income. That's not a content problem."
   - ❌ "Hope you're doing well! I wanted to share..."

3. **No filler phrases:** Never "I hope this finds you well" · "I'd love to" · "Feel free to" · "I hope this helps"

4. **Specific proof:** Use exact numbers. R23,000. R207,879. 780K followers. Not "significant income" or "a large following."

5. **One action per email:** One CTA. Not three links. Not "check out these resources."

6. **Spiritual layer:** After the practical lesson, not before. "If you're reading this, God has kept you for this moment. Isaiah 60:1."

7. **Close with challenge:** "This week, [one specific action]." Not "I hope you found this useful."

8. **Reply-to:** chiefmuhanelwa@gmail.com — every reply must be read and triaged for ICP signals.

---

## Email Audit — Checking Health

Run monthly:
```sql
-- Check for failed or bounced transactional emails
SELECT template_name, status, COUNT(*) 
FROM email_send_log 
WHERE created_at >= date_trunc('month', now())
GROUP BY template_name, status
ORDER BY status, COUNT(*) DESC;

-- Check DLQ (dead letter queue) for stuck messages
SELECT * FROM pgmq.read('transactional_emails_dlq', 0, 10);
SELECT * FROM pgmq.read('auth_emails_dlq', 0, 10);
```
