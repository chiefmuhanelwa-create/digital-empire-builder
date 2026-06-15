# CHKPLT — How to Activate This Project with Claude Code

## HOW TO OPEN THIS PROJECT IN CLAUDE CODE

Every time you want to work on this funnel, do this:

1. Open **Terminal** (press Cmd + Space, type "Terminal", hit Enter)
2. Type this command and press Enter:
   ```
   claude /Users/NOCHILLGOD/Desktop/digital-empire-builder
   ```
3. Claude Code opens inside THIS project — not the Shopify store.
4. Everything you build here stays in this folder and syncs to GitHub automatically.

That's how you "enter" the project with me. One command.

---

## BEFORE YOU CAN RUN IT LOCALLY

The project needs 4 things set up before it works:

### 1. Install Bun (the package manager this project uses)
Run this in Terminal:
```
curl -fsSL https://bun.sh/install | bash
```

### 2. Install project dependencies
Inside the project folder, run:
```
bun install
```

### 3. Set up your environment variables
Create a file called `.env` in the project root and fill in:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
VITE_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret_key
```

Where to get these:
- **Supabase keys:** supabase.com → your project → Settings → API
- **Paystack key:** dashboard.paystack.com → Settings → API Keys
- **Turnstile keys:** dash.cloudflare.com → Turnstile → Add site

### 4. Run the dev server
```
bun dev
```
Then open your browser at: `http://localhost:3000`

---

## WHAT STILL NEEDS TO BE BUILT (pick up here when ready)

- [ ] Add your products to the database (Niche Clarity Workbook, Creator Starter Bundle, PAIDS Workbook, etc.)
- [ ] Confirm brand name — currently says "CHKPLT" everywhere
- [ ] Connect MailerLite for post-purchase email triggers
- [ ] Upload product files (PDFs) to Supabase storage
- [ ] Deploy to Cloudflare for the live URL
- [ ] Test full checkout flow (Paystack → order created → download unlocked)

---

## HOW TO PUSH CHANGES TO GITHUB (so Lovable stays in sync)

After making changes with Claude Code, run:
```
git add .
git commit -m "describe what you changed"
git push
```
Lovable will automatically pick up the changes.

---

## QUICK REFERENCE — Project Structure

| Folder/File | What it is |
|-------------|-----------|
| `src/routes/` | All pages (index, apply, products, checkout, etc.) |
| `src/components/` | Reusable UI pieces |
| `src/lib/` | Backend logic (checkout, products, auth, email) |
| `src/lib/email-templates/` | All transactional email designs |
| `supabase/` | Database schema and migrations |
| `wrangler.jsonc` | Cloudflare deployment config |
| `package.json` | All dependencies |

---

## WHEN YOU'RE READY TO DEPLOY LIVE

1. Create a Cloudflare account at cloudflare.com
2. Run: `bun run build`
3. Run: `bunx wrangler deploy`
4. Add your environment variables in the Cloudflare dashboard

Or tell Claude Code "deploy this to Cloudflare" and we'll walk through it together.
