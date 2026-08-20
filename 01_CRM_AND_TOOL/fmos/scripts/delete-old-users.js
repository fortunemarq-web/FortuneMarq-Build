/**
 * FMOS — Delete all users except the 4 kept accounts
 * Run: node scripts/delete-old-users.js
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://cnwooodktqwvpzkucskm.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var. Run: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/delete-old-users.js");
  process.exit(1);
}

const KEEP = [
  "sayedjabeer@fmos.com",
  "afifa@fmos.com",
  "admin1@fmos.com",
  "admin2@fmos.com",
];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function deleteOldUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Failed to list users:", error.message);
    process.exit(1);
  }

  const toDelete = users.filter((u) => !KEEP.includes(u.email));

  if (toDelete.length === 0) {
    console.log("No users to delete. Only the 4 kept accounts exist.");
    return;
  }

  console.log(`\nFound ${toDelete.length} user(s) to delete:\n`);
  toDelete.forEach((u) => console.log(`  - ${u.email} (${u.id})`));
  console.log("");

  for (const user of toDelete) {
    // Clean up dependent records before deleting the auth user
    await supabase.from("audit_logs").delete().eq("actor_id", user.id);
    await supabase.from("tasks").update({ assigned_to: null }).eq("assigned_to", user.id);
    await supabase.from("outreach_logs").update({ actor_id: null }).eq("actor_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`❌ Failed to delete ${user.email}: ${deleteError.message}`);
    } else {
      console.log(`✅ Deleted: ${user.email}`);
    }
  }

  console.log("\nDone. Remaining users:");
  KEEP.forEach((email) => console.log(`  ✓ ${email}`));
}

deleteOldUsers().catch(console.error);
