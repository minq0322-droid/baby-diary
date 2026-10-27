import { createClient } from '@supabase/supabase-js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { toDatedArchive, toMarkdown } from '../../src/lib/datedArchive.mjs';

const outDir = path.resolve(process.env.OUT_DIR || '.');
const jsonDir = path.join(outDir, 'json');
const markdownDir = path.join(outDir, 'markdown');
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
}).format(new Date());
const log = (message) => process.stdout.write(`${message}\n`);
const dryRun = process.argv.includes('--dry-run');
const fixtureIndex = process.argv.indexOf('--fixture');
const fixture = fixtureIndex >= 0 ? process.argv[fixtureIndex + 1] : undefined;

async function writeChanged(filename, content) {
  const relative = path.relative(outDir, filename);
  if (relative.startsWith('..') || path.isAbsolute(relative))
    throw new Error('invalid archive path');
  try {
    if ((await readFile(filename, 'utf8')) === content) return;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (dryRun) {
    log(`backup: would write ${relative.split(path.sep).join('/')}`);
    return;
  }
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, content, 'utf8');
}

function fail(message, code = 1) {
  log(`backup: ${message}`);
  process.exit(code);
}

async function readAll(client, table, familyId) {
  const rows = [];
  for (let start = 0; ; start += 500) {
    let query = client.from(table).select('*').eq('family_id', familyId);
    for (const key of table === 'reactions' ? ['page_id', 'member_id'] : table === 'members' ? ['member_id'] : ['id'])
      query = query.order(key);
    const { data, error } = await query.range(start, start + 499);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 500) return rows;
  }
}

const camel = (row) =>
  Object.fromEntries(
    Object.entries(row).filter(([key]) => key !== 'family_id').map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
      value ?? undefined,
    ]),
  );

try {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'BACKUP_JOIN_TOKEN',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (!fixture && missing.length)
    fail(`missing environment: ${missing.join(', ')}`, 2);
  const dailyFile = path.join(jsonDir, `${today}.json`);
  if (process.argv.includes('--once-per-day')) {
    try {
      await readFile(dailyFile);
      log(`backup: already exists for ${today}`);
      process.exit(0);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  let snapshot;
  if (fixture) {
    snapshot = JSON.parse(await readFile(path.resolve(fixture), 'utf8'));
  } else {
    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error: authError } = await client.auth.signInAnonymously();
    if (authError) throw authError;
    const { data: familyId, error: joinError } = await client.rpc('join_family', {
      p_token: process.env.BACKUP_JOIN_TOKEN,
    });
    if (joinError) throw new Error('backup invite join failed');
    if (!familyId) throw new Error('backup invite is invalid or revoked');
    const { data: membership, error: memberError } = await client.from('family_members')
      .select('role').single();
    if (memberError || membership?.role !== 'reader') throw new Error('backup requires a READER invite');
    const { error: pruneError } = await client.rpc('prune_reader_members');
    if (pruneError) throw new Error('reader cleanup failed');
    const [children, members, tags, pages, comments, reactions] =
      await Promise.all(
        ['children', 'members', 'tags', 'pages', 'comments', 'reactions'].map(
          (table) => readAll(client, table, familyId),
        ),
      );
    snapshot = {
      children: children.map(camel),
      members: members.map((row) => ({ id: row.member_id, displayName: row.display_name, color: row.color, fontAssetId: row.font_asset_path ?? undefined })),
      tags: tags.map(camel),
      pages: pages.map(camel),
      comments: comments.map(camel),
      reactions: reactions.map(camel),
    };
  }
  const backup = {
    version: 3,
    exportedAt: new Date().toISOString(),
    ...snapshot,
  };
  await writeChanged(dailyFile, `${JSON.stringify(backup, null, 2)}\n`);

  for (const file of toDatedArchive(snapshot)) {
    await writeChanged(path.join(outDir, file.path), file.content);
  }
  await writeChanged(
    path.join(outDir, 'backup.json'),
    JSON.stringify(backup, null, 2),
  );
  const months = new Set(snapshot.pages.map((page) => page.date.slice(0, 7)));
  for (const month of months) {
    await writeChanged(
      path.join(markdownDir, `${month}.md`),
      toMarkdown(snapshot, month),
    );
  }
  await writeChanged(
    path.join(outDir, 'status.json'),
    JSON.stringify(
      { lastBackupAt: backup.exportedAt, pages: snapshot.pages.length },
      null,
      2,
    ),
  );
  log(
    `backup: ${dryRun ? 'dry-run' : 'wrote'} ${snapshot.pages.length} page(s)`,
  );
} catch (error) {
  fail(
    error instanceof Error
      ? error.message.replaceAll(process.env.BACKUP_JOIN_TOKEN || '\0', '[redacted]').replace(/\s+/g, ' ').trim()
      : 'unknown error',
  );
}
