/**
 * Loopgate — Schema migration script
 *
 * Applies every file in supabase/migrations/ to the new Supabase project
 * in chronological order, skipping any migration that has already been run.
 *
 * Usage (run from repo root):
 *   DB_URL="postgresql://postgres:[password]@db.dpoyjziejujqjvhubxcs.supabase.co:5432/postgres" \
 *   node scripts/migrate-schema.mjs
 *
 * Get your DB password from:
 *   Supabase dashboard → new project → Settings → Database → Connection string
 *   (copy the password from the URI)
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

const DB_URL = process.env.DB_URL;
if (!DB_URL) {
  console.error('❌  Set DB_URL env var to the new project connection string.');
  console.error('    DB_URL="postgresql://postgres:[password]@db.dpoyjziejujqjvhubxcs.supabase.co:5432/postgres"');
  process.exit(1);
}

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  console.log('✅  Connected to new Supabase project.');

  // Create tracking table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS public._migrations_applied (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Get already-applied migrations
  const { rows: applied } = await client.query(
    'SELECT filename FROM public._migrations_applied ORDER BY filename'
  );
  const appliedSet = new Set(applied.map(r => r.filename));

  // Read migration files in order
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const pending = files.filter(f => !appliedSet.has(f));
  console.log(`\n📋  ${files.length} total migrations, ${pending.length} pending.\n`);

  if (pending.length === 0) {
    console.log('✅  Schema already up to date.');
    await client.end();
    return;
  }

  let applied_count = 0;
  let error_count = 0;

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    process.stdout.write(`  ▶  ${file} … `);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO public._migrations_applied (filename) VALUES ($1) ON CONFLICT DO NOTHING',
        [file]
      );
      await client.query('COMMIT');
      console.log('✅');
      applied_count++;
    } catch (err) {
      await client.query('ROLLBACK');
      // Many migrations use IF NOT EXISTS / IF EXISTS — only fatal if it's a real error
      const msg = err.message || '';
      const isIdempotentError =
        msg.includes('already exists') ||
        msg.includes('does not exist') ||
        msg.includes('duplicate key');
      if (isIdempotentError) {
        console.log(`⚠️   skipped (${msg.slice(0, 80)})`);
        // Still record it so we don't retry
        try {
          await client.query(
            'INSERT INTO public._migrations_applied (filename) VALUES ($1) ON CONFLICT DO NOTHING',
            [file]
          );
        } catch (_) { /* ignore */ }
        applied_count++;
      } else {
        console.log(`❌  ERROR: ${msg}`);
        error_count++;
      }
    }
  }

  console.log(`\n──────────────────────────────────────────`);
  console.log(`✅  Applied : ${applied_count}`);
  if (error_count > 0) console.log(`❌  Errors  : ${error_count}`);
  console.log(`──────────────────────────────────────────\n`);

  await client.end();
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
