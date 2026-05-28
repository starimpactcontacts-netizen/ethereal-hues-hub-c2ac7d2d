/**
 * Loopgate — Storage migration
 *
 * Copies all storage buckets + objects from OLD project to NEW project.
 * Recreates buckets with same name + public/private setting, then streams
 * every object across using the service_role key.
 *
 * Usage:
 *   OLD_URL="https://tmfnqnmyxxydrxwjkaiq.supabase.co" \
 *   OLD_SERVICE_ROLE_KEY="eyJ..." \
 *   NEW_URL="https://xxx.supabase.co" \
 *   NEW_SERVICE_ROLE_KEY="eyJ..." \
 *   node scripts/migrate-storage.mjs
 *
 * NOTE: This re-uploads every file. For very large buckets (millions of files)
 * use Supabase's pg_dump / S3 copy tools instead.
 */

import { createClient } from '@supabase/supabase-js';

const OLD_URL = process.env.OLD_URL || 'https://tmfnqnmyxxydrxwjkaiq.supabase.co';
const OLD_KEY = process.env.OLD_SERVICE_ROLE_KEY;
const NEW_URL = process.env.NEW_URL;
const NEW_KEY = process.env.NEW_SERVICE_ROLE_KEY;

if (!OLD_KEY || !NEW_URL || !NEW_KEY) {
  console.error('Required: OLD_SERVICE_ROLE_KEY, NEW_URL, NEW_SERVICE_ROLE_KEY');
  process.exit(1);
}

const oldSb = createClient(OLD_URL, OLD_KEY);
const newSb = createClient(NEW_URL, NEW_KEY);

async function listAllObjects(client, bucket, prefix = '') {
  const results = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        // It's a folder — recurse
        const sub = await listAllObjects(client, bucket, fullPath);
        results.push(...sub);
      } else {
        results.push(fullPath);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return results;
}

async function migrateBucket(bucket) {
  console.log(`\n📦  Bucket: ${bucket.name} (${bucket.public ? 'public' : 'private'})`);

  // Create on new project
  const { error: createErr } = await newSb.storage.createBucket(bucket.name, {
    public: bucket.public,
    fileSizeLimit: bucket.file_size_limit,
    allowedMimeTypes: bucket.allowed_mime_types,
  });
  if (createErr && !createErr.message.includes('already exists')) {
    console.log(`    ⚠️  ${createErr.message}`);
  }

  const paths = await listAllObjects(oldSb, bucket.name);
  console.log(`    ${paths.length} objects to copy.`);

  let ok = 0, fail = 0;
  for (const path of paths) {
    try {
      const { data: blob, error: dlErr } = await oldSb.storage.from(bucket.name).download(path);
      if (dlErr) throw dlErr;
      const { error: upErr } = await newSb.storage.from(bucket.name).upload(path, blob, { upsert: true, contentType: blob.type });
      if (upErr) throw upErr;
      ok++;
      if (ok % 50 === 0) process.stdout.write(`    ${ok}/${paths.length}\r`);
    } catch (e) {
      fail++;
      console.log(`    ❌  ${path}: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`    ✅  ${ok} copied, ${fail} failed.`);
}

async function run() {
  const { data: buckets, error } = await oldSb.storage.listBuckets();
  if (error) throw error;
  console.log(`Found ${buckets.length} buckets on old project.`);

  for (const b of buckets) {
    await migrateBucket(b);
  }

  console.log('\n✅  Storage migration complete.');
}

run().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});