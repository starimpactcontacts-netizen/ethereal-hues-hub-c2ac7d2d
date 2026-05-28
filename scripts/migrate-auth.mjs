/**
 * Loopgate — Auth users migration
 *
 * Exports auth.users + auth.identities from the OLD project via the admin API,
 * then inserts them into the NEW project's auth schema directly via psql.
 * Preserves encrypted_password so users keep their existing passwords.
 *
 * Usage:
 *   OLD_URL="https://tmfnqnmyxxydrxwjkaiq.supabase.co" \
 *   OLD_SERVICE_ROLE_KEY="eyJ..." \
 *   NEW_DB_URL="postgresql://postgres:[pw]@db.xxx.supabase.co:5432/postgres" \
 *   node scripts/migrate-auth.mjs
 *
 * Run AFTER migrate-schema.mjs and BEFORE migrate-data.mjs
 * (profiles & FKs reference auth.users(id)).
 */

import pg from 'pg';

const { Client } = pg;

const OLD_URL         = process.env.OLD_URL || 'https://tmfnqnmyxxydrxwjkaiq.supabase.co';
const OLD_SERVICE_KEY = process.env.OLD_SERVICE_ROLE_KEY;
const NEW_DB_URL      = process.env.NEW_DB_URL;
const PAGE_SIZE       = 1000;

if (!OLD_SERVICE_KEY || !NEW_DB_URL) {
  console.error('Required env vars: OLD_SERVICE_ROLE_KEY, NEW_DB_URL');
  process.exit(1);
}

// ── Fetch users from admin API (includes encrypted_password) ────────────────
async function fetchUserPage(page) {
  const url = `${OLD_URL}/auth/v1/admin/users?page=${page}&per_page=${PAGE_SIZE}`;
  const res = await fetch(url, {
    headers: {
      apikey: OLD_SERVICE_KEY,
      Authorization: `Bearer ${OLD_SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return body.users || [];
}

async function fetchAllUsers() {
  const all = [];
  let page = 1;
  while (true) {
    const users = await fetchUserPage(page);
    if (users.length === 0) break;
    all.push(...users);
    if (users.length < PAGE_SIZE) break;
    page++;
  }
  return all;
}

// The admin REST API does NOT return encrypted_password. We MUST query the old
// project's database directly to copy password hashes. So this script also needs
// OLD_DB_URL (the old project's connection string).
async function dumpAuthFromOldDb() {
  const OLD_DB_URL = process.env.OLD_DB_URL;
  if (!OLD_DB_URL) {
    throw new Error(
      'OLD_DB_URL is required to preserve password hashes.\n' +
      'Get it from: old Supabase dashboard → Settings → Database → URI'
    );
  }
  const old = new Client({ connectionString: OLD_DB_URL, ssl: { rejectUnauthorized: false } });
  await old.connect();

  const users = (await old.query(`
    SELECT id, instance_id, aud, role, email, encrypted_password,
           email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
           recovery_token, recovery_sent_at, email_change_token_new, email_change,
           email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
           is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
           phone_change, phone_change_token, phone_change_sent_at, confirmed_at,
           email_change_token_current, email_change_confirm_status, banned_until,
           reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at,
           is_anonymous
    FROM auth.users
  `)).rows;

  const identities = (await old.query(`
    SELECT provider_id, user_id, identity_data, provider, last_sign_in_at,
           created_at, updated_at, email, id
    FROM auth.identities
  `)).rows;

  await old.end();
  return { users, identities };
}

// ── Bulk insert with conflict-skip ──────────────────────────────────────────
async function bulkInsert(client, schema, table, rows) {
  if (rows.length === 0) return;
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const cols = Object.keys(chunk[0]);
    const placeholders = chunk.map(
      (_, ri) => `(${cols.map((_, ci) => `$${ri * cols.length + ci + 1}`).join(', ')})`
    );
    const values = chunk.flatMap(row =>
      cols.map(c => (row[c] && typeof row[c] === 'object' ? JSON.stringify(row[c]) : row[c]))
    );
    const sql = `
      INSERT INTO ${schema}."${table}" (${cols.map(c => `"${c}"`).join(', ')})
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (id) DO NOTHING
    `;
    await client.query(sql, values);
  }
}

async function run() {
  console.log('📥  Dumping auth.users + auth.identities from OLD project DB …');
  const { users, identities } = await dumpAuthFromOldDb();
  console.log(`    Found ${users.length} users, ${identities.length} identities.\n`);

  const client = new Client({ connectionString: NEW_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅  Connected to NEW project.\n');

  await client.query('SET session_replication_role = replica;');

  process.stdout.write('  ▶  auth.users … ');
  await bulkInsert(client, 'auth', 'users', users);
  console.log(`✅ ${users.length}`);

  process.stdout.write('  ▶  auth.identities … ');
  await bulkInsert(client, 'auth', 'identities', identities);
  console.log(`✅ ${identities.length}`);

  await client.query('SET session_replication_role = DEFAULT;');
  await client.end();

  console.log('\n──────────────────────────────────────────');
  console.log('✅  Auth migration complete.');
  console.log('    Users can log in with their existing passwords.');
  console.log('──────────────────────────────────────────\n');
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});