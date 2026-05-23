/**
 * Loopgate — Data migration script
 *
 * Reads every row from every table in the old Supabase project via the REST API
 * (service role key — bypasses RLS) and inserts them into the new project.
 *
 * Usage (run from repo root):
 *   OLD_SERVICE_ROLE_KEY="eyJ..." \
 *   NEW_DB_URL="postgresql://postgres:[password]@db.dpoyjziejujqjvhubxcs.supabase.co:5432/postgres" \
 *   node scripts/migrate-data.mjs
 *
 * Run migrate-schema.mjs first so the schema exists on the new project.
 */

import pg from 'pg';
import https from 'https';
import { URL } from 'url';

const { Client } = pg;

// ── Config ──────────────────────────────────────────────────────────────────
const OLD_URL          = 'https://tmfnqnmyxxydrxwjkaiq.supabase.co';
const OLD_SERVICE_KEY  = process.env.OLD_SERVICE_ROLE_KEY;
const NEW_DB_URL       = process.env.NEW_DB_URL;
const PAGE_SIZE        = 1000;   // rows per REST API page

if (!OLD_SERVICE_KEY || !NEW_DB_URL) {
  console.error('Required env vars:');
  console.error('  OLD_SERVICE_ROLE_KEY   — service_role key for old Supabase project');
  console.error('  NEW_DB_URL             — postgres connection URL for new project');
  process.exit(1);
}

// ── Tables to migrate (in FK-safe order) ────────────────────────────────────
// Adjust or reorder if you hit FK violations.
const TABLES = [
  'profiles',
  'user_roles',
  'connected_platforms',
  'houses',
  'crews',
  'crew_members',
  'events',
  'event_participations',
  'event_rounds',
  'event_messages',
  'battles',
  'battle_submissions',
  'tournaments',
  'tournament_participants',
  'notifications',
  'activity_feed',
  'judge_inbox',
  'review_requests',
  'messages',
  'message_threads',
  'thread_participants',
  'drops',
  'drop_entries',
  'shop_items',
  'purchases',
  'tickets',
];

// ── REST API helper ──────────────────────────────────────────────────────────
async function fetchPage(table, offset) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${OLD_URL}/rest/v1/${table}`);
    url.searchParams.set('select', '*');
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('offset', String(offset));

    const opts = {
      hostname: url.hostname,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      headers: {
        apikey: OLD_SERVICE_KEY,
        Authorization: `Bearer ${OLD_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'count=exact',
      },
    };

    const req = https.request(opts, res => {
      let body = '';
      res.on('data', d => (body += d));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error(`JSON parse error: ${body.slice(0, 200)}`)); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchAllRows(table) {
  const rows = [];
  let offset = 0;
  while (true) {
    const page = await fetchPage(table, offset);
    if (!Array.isArray(page) || page.length === 0) break;
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

// ── Bulk insert helper ───────────────────────────────────────────────────────
async function bulkInsert(client, table, rows) {
  if (rows.length === 0) return;
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const cols = Object.keys(chunk[0]);
    const placeholders = chunk.map(
      (_, ri) => `(${cols.map((_, ci) => `$${ri * cols.length + ci + 1}`).join(', ')})`
    );
    const values = chunk.flatMap(row => cols.map(c => row[c]));
    const sql = `
      INSERT INTO public."${table}" (${cols.map(c => `"${c}"`).join(', ')})
      VALUES ${placeholders.join(', ')}
      ON CONFLICT DO NOTHING
    `;
    await client.query(sql, values);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const client = new Client({ connectionString: NEW_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅  Connected to new Supabase project.\n');

  // Disable triggers/FK checks for the duration of the import
  await client.query('SET session_replication_role = replica;');

  let total_rows = 0;
  const errors = [];

  for (const table of TABLES) {
    process.stdout.write(`  ▶  ${table} … `);
    try {
      const rows = await fetchAllRows(table);
      if (rows.length === 0) {
        console.log('(empty)');
        continue;
      }
      await bulkInsert(client, table, rows);
      total_rows += rows.length;
      console.log(`✅  ${rows.length} rows`);
    } catch (err) {
      const msg = err.message || String(err);
      // 404 = table doesn't exist in old project, skip gracefully
      if (msg.includes('404') || msg.includes('relation') || msg.includes('does not exist')) {
        console.log('⚠️   not found, skipping');
      } else {
        console.log(`❌  ${msg.slice(0, 120)}`);
        errors.push({ table, error: msg });
      }
    }
  }

  await client.query('SET session_replication_role = DEFAULT;');
  await client.end();

  console.log(`\n──────────────────────────────────────────`);
  console.log(`✅  Total rows migrated : ${total_rows}`);
  if (errors.length > 0) {
    console.log(`❌  Tables with errors  : ${errors.length}`);
    errors.forEach(e => console.log(`     • ${e.table}: ${e.error.slice(0, 100)}`));
  }
  console.log(`──────────────────────────────────────────\n`);
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
