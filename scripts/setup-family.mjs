// LOCAL ONLY. Creates ignored bootstrap files; never contacts Supabase.
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';

const seedUrl = new URL('../supabase/seed/family_seed.sql', import.meta.url);
const linksUrl = new URL('../supabase/seed/family_links.local', import.meta.url);
for (const url of [seedUrl, linksUrl]) {
  try {
    await access(url);
    throw new Error('Bootstrap file already exists; keep its original keys.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
const dad = randomBytes(32).toString('base64url');
const mom = randomBytes(32).toString('base64url');
const hash = (token) => createHash('sha256').update(token).digest('hex');
const template = await readFile(new URL('../supabase/seed/family_seed.sql.template', import.meta.url), 'utf8');
await writeFile(seedUrl, template.replaceAll('<FAMILY_ID>', randomUUID())
  .replaceAll('<DAD_TOKEN_HASH>', hash(dad)).replaceAll('<MOM_TOKEN_HASH>', hash(mom)), { flag: 'wx' });
const base = 'https://minq0322-droid.github.io/baby-diary/#join=';
await writeFile(linksUrl, '아빠 (owner): ' + base + dad + '\n엄마 (writer): ' + base + mom + '\n', { flag: 'wx' });
process.stdout.write('Created private supabase/seed/family_seed.sql and family_links.local. Do not commit or publish them.\n');
