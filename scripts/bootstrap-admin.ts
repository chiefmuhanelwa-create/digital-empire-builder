/**
 * Bootstrap the first admin WITHOUT needing email (sidesteps BLOCKER-001).
 *
 * The "Admins can manage roles" RLS policy needs you to already be an admin —
 * a chicken-and-egg for the very first one. And signup-confirmation email is
 * currently broken, so a normal signup can't even confirm. This script uses the
 * Supabase service-role key (bypasses RLS) to create-or-update a PRE-CONFIRMED
 * user with a password, then grants them the `admin` role. Idempotent.
 *
 * Usage:
 *   bun run scripts/bootstrap-admin.ts <email> <password>
 *   bun run admin:bootstrap -- <email> <password>
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env (Bun auto-loads it).
 * NEVER commit real credentials. Run locally only.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, password] = process.argv.slice(2);

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
if (!email || !password) {
  console.error("Usage: bun run scripts/bootstrap-admin.ts <email> <password>");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find an existing user by email (paginate; admin API has no direct get-by-email).
async function findUserId(targetEmail: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

const existingId = await findUserId(email);
let userId: string;

if (existingId) {
  const { error } = await admin.auth.admin.updateUserById(existingId, {
    password,
    email_confirm: true,
  });
  if (error) throw error;
  userId = existingId;
  console.log(`Updated existing user (confirmed + password reset): ${email}`);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`Created pre-confirmed user: ${email}`);
}

// Grant admin role (unique(user_id, role) makes this idempotent).
const { error: roleErr } = await admin
  .from("user_roles")
  .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
if (roleErr) throw roleErr;

console.log(`✓ ${email} is now a confirmed admin. Sign in at /auth — no email needed.`);
