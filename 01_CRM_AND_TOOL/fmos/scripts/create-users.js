/**
 * FMOS — Create App Users
 * Run once to create all FMOS user accounts in Supabase.
 *
 * HOW TO RUN:
 * 1. Get your service role key from:
 *    Supabase Dashboard → Project Settings → API → service_role key
 * 2. Run: SUPABASE_SERVICE_ROLE_KEY=your_key_here node scripts/create-users.js
 *
 * User list (email/password/full_name/role) lives in
 * 00_MASTER/FMOS_USER_CREDENTIALS.local.json (gitignored, never committed).
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

const SUPABASE_URL = "https://cnwooodktqwvpzkucskm.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var. Run: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-users.js");
  process.exit(1);
}

const CREDENTIALS_PATH = path.join(__dirname, "../../../00_MASTER/FMOS_USER_CREDENTIALS.local.json");

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error(`Missing credentials file: ${CREDENTIALS_PATH}`);
  process.exit(1);
}

const { users } = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createUsers() {
  console.log("\n🚀 Creating FMOS users...\n");

  for (const user of users) {
    // 1. Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // skip email confirmation
    });

    if (error) {
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        console.log(`⚠️  ${user.email} — already exists, updating profile only`);
        const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
        const existing = allUsers?.find((u) => u.email === user.email);
        if (existing) {
          await updateProfile(existing.id, user);
        } else {
          console.error(`   ❌ Could not find existing user ${user.email}`);
        }
      } else {
        console.error(`❌ ${user.email} — failed to create: ${error.message}`);
      }
      continue;
    }

    console.log(`✅ ${user.email} — auth user created (id: ${data.user.id})`);

    // 2. Update the profiles table
    await updateProfile(data.user.id, user);
  }

  console.log("\n✅ Done. Users are ready to log in.\n");
  console.log("Login summary:");
  users.forEach((u) => {
    console.log(`  ${u.email.padEnd(28)} password: ${u.password.padEnd(16)} role: ${u.role}`);
  });
}

async function updateProfile(userId, user) {
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      full_name: user.full_name,
      role: user.role,
    }, { onConflict: "id" });

  if (profileError) {
    console.error(`   ⚠️  Profile update failed for ${user.email}: ${profileError.message}`);
  } else {
    console.log(`   → Profile set: full_name="${user.full_name}", role="${user.role}"`);
  }
}

createUsers().catch(console.error);
