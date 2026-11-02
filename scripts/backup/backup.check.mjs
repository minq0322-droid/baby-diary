import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtemp,
  readFile,
  writeFile,
  stat,
  rm,
  mkdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toDatedArchive } from '../../src/lib/datedArchive.mjs';

const script = fileURLToPath(new URL('./backup.mjs', import.meta.url));
const fixture = fileURLToPath(
  new URL('./fixtures/two-parents.json', import.meta.url),
);

test('dated archives preserve multiple sheets for one parent in creation order', async () => {
  const snapshot = JSON.parse(await readFile(fixture, 'utf8'));
  const first = snapshot.pages.find((page) => page.authorId === 'dad');
  const second = {
    ...first,
    id: first.id + '__zzzzzzzz',
    text: '두 번째 장',
    createdAt: '2026-10-26T20:00:00Z',
  };
  const third = {
    ...second,
    id: first.id + '__aaaaaaaa',
    text: '세 번째 장',
    createdAt: '2026-10-26T21:00:00Z',
  };
  snapshot.pages = [third, second, ...snapshot.pages];
  const files = toDatedArchive(snapshot);
  assert.equal(new Set(files.map((file) => file.path)).size, files.length);
  assert.deepEqual(
    files.filter((file) => file.path.endsWith('.json'))
      .map((file) => JSON.parse(file.content).id),
    [first.id, second.id, third.id, snapshot.pages.find((page) => page.authorId === 'mom').id],
  );
  const markdown = files.find((file) => file.path.endsWith('.md')).content;
  assert.ok(markdown.indexOf('아빠 기록') < markdown.indexOf('두 번째 장'));
  assert.ok(markdown.indexOf('두 번째 장') < markdown.indexOf('세 번째 장'));
});

test('dated backup dry-run and incremental writes preserve old files and both parents', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'diary-backup-'));
  const run = (...args) =>
    execFileSync(process.execPath, [script, '--fixture', fixture, ...args], {
      env: { ...process.env, OUT_DIR: directory },
      encoding: 'utf8',
    });
  try {
    const snapshot = JSON.parse(await readFile(fixture, 'utf8'));
    const files = toDatedArchive(snapshot);
    assert.deepEqual(
      files.map((file) => file.path),
      [
        'diary/2026/10/26/kid1-dad.json',
        'diary/2026/10/26/kid1-mom.json',
        'diary/2026/10/26.md',
      ],
    );
    assert.match(files[2].content, /엄마 기록 — 엄마/);
    assert.match(files[2].content, /아빠 기록 — 아빠/);
    const output = run('--dry-run');
    for (const file of files) assert.ok(output.includes(file.path));
    await assert.rejects(readFile(path.join(directory, 'backup.json')), {
      code: 'ENOENT',
    });
    await mkdir(path.join(directory, 'diary/2020'), { recursive: true });
    const old = path.join(directory, 'diary/2020/old.json');
    await writeFile(old, 'keep');
    run();
    for (const file of files)
      assert.equal(
        await readFile(path.join(directory, file.path), 'utf8'),
        file.content,
      );
    const dated = path.join(directory, files[0].path);
    const before = (await stat(dated)).mtimeMs;
    run();
    assert.equal((await stat(dated)).mtimeMs, before);
    assert.equal(await readFile(old, 'utf8'), 'keep');
    assert.equal(
      JSON.parse(await readFile(path.join(directory, 'backup.json'), 'utf8'))
        .version,
      3,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});


test('public backup encryption roundtrips and rejects a wrong key or modified ciphertext', async () => {
  const { encrypt, decrypt } = await import('./encrypt.mjs');
  const token = 'a'.repeat(43);
  const plaintext = Buffer.from('가족의 비공개 기록');
  const encrypted = encrypt(plaintext, token);
  assert.deepEqual(decrypt(encrypted, token), plaintext);
  assert.equal(encrypted.includes(plaintext), false);
  assert.throws(() => decrypt(encrypted, 'wrong'));
  encrypted[encrypted.length - 1] ^= 1;
  assert.throws(() => decrypt(encrypted, token));
});
