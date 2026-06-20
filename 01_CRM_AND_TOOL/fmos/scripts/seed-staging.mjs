/**
 * Seed the STAGING Supabase with deterministic E2E fixtures:
 *   - two auth users (admin + telecaller) with profiles + roles
 *   - one test client and one callable test lead (QA phone)
 *
 * Safe by construction: refuses to run against the production project ref.
 * Idempotent: re-running updates rather than duplicating.
 *
 * Usage:  node scripts/seed-staging.mjs       (reads .env.staging)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "..", ".env.staging");
const PROD_REF = "cnwooodktqwvpzkucskm";

if (!existsSync(ENV_PATH)) {
  console.error("[seed] .env.staging not found. Copy .env.staging.example first.");
  process.exit(1);
}
const env = {};
for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!url || !key) {
  console.error("[seed] Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.staging.");
  process.exit(1);
}
if (url.includes(PROD_REF)) {
  console.error(`[seed] REFUSING: URL points at PRODUCTION (${PROD_REF}). Staging only.`);
  process.exit(1);
}

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function ensureUser(email, password, fullName, role) {
  // Create (or fetch) the auth user, then upsert the profile with the role.
  let userId;
  const { data: created, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error && !/already.*registered|exists/i.test(error.message)) {
    throw new Error(`createUser(${email}): ${error.message}`);
  }
  if (created?.user) {
    userId = created.user.id;
  } else {
    // Already exists — find them via listUsers.
    const { data: list } = await db.auth.admin.listUsers();
    userId = list?.users?.find((u) => u.email === email)?.id;
  }
  if (!userId) throw new Error(`could not resolve user id for ${email}`);
  await db.from("profiles").upsert({ id: userId, email, full_name: fullName, role, is_active: true });
  console.log(`[seed] user ${email} (${role}) → ${userId}`);
  return userId;
}

async function main() {
  console.log(`[seed] target: ${url}`);

  const adminId = await ensureUser(
    env.E2E_ADMIN_EMAIL || "e2e-admin@fmos.test",
    env.E2E_ADMIN_PASSWORD || "E2e!StagingPass1",
    "E2E Admin",
    "admin"
  );
  await ensureUser(
    env.E2E_TELECALLER_EMAIL || "e2e-caller@fmos.test",
    env.E2E_TELECALLER_PASSWORD || "E2e!StagingPass1",
    "E2E Caller",
    "telecaller"
  );

  // A test client for finance/delivery specs.
  // NOTE: clients has no unique constraint on primary_email, so onConflict upsert
  // fails. Delete-then-insert keeps it idempotent without needing one.
  await db.from("clients").delete().eq("primary_email", "e2e-client@fmos.test");
  const { data: client, error: cErr } = await db
    .from("clients")
    .insert({ business_name: "E2E Test Client", primary_email: "e2e-client@fmos.test", owner_name: "E2E Owner", phone: "+918904192656", status: "active", monthly_value: 10000 })
    .select("id")
    .single();
  if (cErr) throw new Error(`client insert: ${cErr.message}`);
  console.log(`[seed] client → ${client?.id}`);

  // A callable test lead (QA phone) for sales/deal specs.
  // leads has no unique constraint on phone either → delete-then-insert.
  await db.from("leads").delete().eq("phone", "+918904192656");
  const { data: lead, error: lErr } = await db
    .from("leads")
    .insert({ company_name: "E2E Test Lead", phone: "+918904192656", contact_person: "E2E Contact", industry: "Dentist", city: "Hubli", source: "manual", lead_type: "outbound", has_website: false })
    .select("id")
    .single();
  if (lErr) throw new Error(`lead insert: ${lErr.message}`);
  console.log(`[seed] lead → ${lead?.id}`);

  console.log("[seed] done.");
  void adminId;
}

main().catch((e) => {
  console.error("[seed] FAILED:", e.message);
  process.exit(1);
});
