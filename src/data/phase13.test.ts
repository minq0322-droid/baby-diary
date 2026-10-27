import { afterEach, expect, it, vi } from 'vitest';
import { ArtifactStore } from './artifactStore';
import { FakeDb, page, settle } from './testDb';
import { LocalStore } from './localStore';
import { migrateMonthSnapshot, migrateSnapshot } from './migrate';
import { preparePage } from '../lib/stroke';
import { fromBackupJson, toDatedArchive } from '../lib/exportFormat';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('retains failed edits and write permission, accepts settings and retries automatically', async () => {
  vi.useFakeTimers();
  const db = new FakeDb();
  const store = new ArtifactStore(db, 'viewer');
  db.failNext = true;
  store.savePage(page());
  await settle();
  expect(store.readOnly).toBe(false);
  expect(store.listPages()[0].text).toBe('오늘 기록');
  expect(store.syncState).toBe('retrying');
  expect(store.errorMessage).toBeTruthy();
  store.updateChild({ ...store.listChildren()[0], pageColor: '#F9F0C8' });
  expect(store.listChildren()[0].pageColor).toBe('#F9F0C8');
  await vi.advanceTimersByTimeAsync(2000);
  await settle();
  expect(store.syncState).toBe('ok');
  expect(db.bodies.has('pages/' + page().id)).toBe(true);
  store.dispose();
});
it('keeps inherited color absent when child default changes', () => {
  const store = new LocalStore();
  store.savePage({ ...page(), color: undefined });
  store.updateChild({ ...store.listChildren()[0], pageColor: '#F9F0C8' });
  const saved = store.getPage(page().date, 'kid1');
  expect(saved?.color).toBeUndefined();
  expect(saved?.color ?? store.listChildren()[0].pageColor).toBe('#F9F0C8');
});
it('splits notes by author and assigns media/activity to earliest author idempotently', () => {
  const old = {
    ...page(),
    id: '2026-10-26__kid1',
    authorId: undefined,
    text: undefined,
    notes: [
      {
        id: 'm',
        authorId: 'mom',
        text: '하나',
        createdAt: '1',
        updatedAt: '1',
      },
      { id: 'd', authorId: 'dad', text: '둘', createdAt: '2', updatedAt: '2' },
      { id: 'm2', authorId: 'mom', text: '셋', createdAt: '3', updatedAt: '3' },
    ],
    drawing: [{ color: 'ink', width: 2, points: [0, 0, 1, 1] }],
  };
  const result = migrateSnapshot({
    ...new LocalStore().exportAll(),
    pages: [old],
    comments: [
      {
        id: 'c',
        pageId: old.id,
        content: '댓글',
        authorId: 'dad',
        createdAt: '1',
        updatedAt: '1',
      },
    ],
  } as never);
  expect(result.pages).toHaveLength(2);
  expect(result.pages.find((p) => p.authorId === 'mom')).toMatchObject({
    text: '하나\n\n셋',
    drawing: old.drawing,
  });
  expect(result.pages.find((p) => p.authorId === 'dad')?.drawing).toEqual([]);
  expect(result.comments[0].pageId).toBe(old.id + '__mom');
  expect(migrateSnapshot(result)).toEqual(result);
});
it('simplifies first and enforces a real UTF-8 200 KB page limit', () => {
  const dense = {
    ...page(),
    drawing: [
      { color: 'ink', width: 2 as const, points: Array(100000).fill(0.5) },
    ],
  };
  expect(preparePage(dense).drawing[0].points).toHaveLength(2);
  expect(() => preparePage({ ...page(), text: '가'.repeat(70000) })).toThrow(
    '그림이 너무 커서 저장할 수 없어요. 일부를 지워 주세요',
  );
});
it('creates deterministic dated JSON and daily Markdown paths', () => {
  const files = toDatedArchive({
    ...new LocalStore().exportAll(),
    pages: [page()],
  });
  expect(files.map((f) => f.path)).toEqual([
    'diary/2026/10/26/kid1-dad.json',
    'diary/2026/10/26.md',
  ]);
  expect(files[1].content).toContain('오늘 기록');
});
it('imports v2 notes and writes both parents into one readable daily archive', () => {
  const { authorId: _, text: __, ...body } = page();
  const old = {
    ...body,
    id: body.date + '__' + body.childId,
    notes: [
      {
        id: 'a',
        authorId: 'dad',
        text: '아빠 기록',
        createdAt: '1',
        updatedAt: '1',
      },
      {
        id: 'b',
        authorId: 'mom',
        text: '엄마 기록',
        createdAt: '2',
        updatedAt: '2',
      },
    ],
  };
  const snapshot = fromBackupJson({
    ...new LocalStore().exportAll(),
    version: 2,
    pages: [old],
  });
  const files = toDatedArchive(snapshot);
  expect(files.map((file) => file.path)).toEqual([
    'diary/2026/10/26/kid1-dad.json',
    'diary/2026/10/26/kid1-mom.json',
    'diary/2026/10/26.md',
  ]);
  expect(files[2].content).toContain('아빠 기록');
  expect(files[2].content).toContain('엄마 기록');
});
it('deduplicates notes when v1 entries and partially migrated month pages coexist', () => {
  const metadata = new LocalStore().exportAll();
  const old = {
    ...page(),
    id: '2026-10-26__kid1',
    notes: [
      {
        id: 'a',
        authorId: 'mom',
        text: '기존',
        createdAt: '1',
        updatedAt: '1',
      },
    ],
  };
  const converted = migrateMonthSnapshot(metadata, {
    pages: { [old.id]: old },
    entries: {
      a: {
        id: 'a',
        date: old.date,
        childId: old.childId,
        authorId: 'mom',
        content: '기존',
        tagIds: [],
        createdAt: '1',
        updatedAt: '1',
      },
      b: {
        id: 'b',
        date: old.date,
        childId: old.childId,
        authorId: 'dad',
        content: '추가',
        tagIds: [],
        createdAt: '2',
        updatedAt: '2',
      },
    },
    comments: {
      c: {
        id: 'c',
        entryId: 'b',
        content: '댓글',
        authorId: 'dad',
        createdAt: '2',
        updatedAt: '2',
      },
    },
  });
  expect(converted.pages).toHaveLength(2);
  expect(converted.pages.find((page) => page.authorId === 'mom')?.text).toBe(
    '기존',
  );
  expect(converted.pages.find((page) => page.authorId === 'dad')?.text).toBe(
    '추가',
  );
  expect(converted.comments[0].pageId).toBe(old.id + '__mom');
});
it('rejects changing a page author under an existing identity', () => {
  expect(() =>
    new LocalStore().savePage({ ...page(), authorId: 'mom' }),
  ).toThrow();
});
it('retains local edits across quota failures and automatically retries storage', async () => {
  vi.useFakeTimers();
  const values = new Map<string, string>();
  let full = true;
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (full) throw new Error('quota');
      values.set(key, value);
    },
  });
  const store = new LocalStore();
  store.savePage(page());
  expect(store.syncState).toBe('retrying');
  expect(store.getPage(page().date, 'kid1')?.text).toBe('오늘 기록');
  full = false;
  await vi.advanceTimersByTimeAsync(1000);
  expect(store.syncState).toBe('ok');
  expect(JSON.parse(values.get('yuga-record-data')!).pages[0].text).toBe(
    '오늘 기록',
  );
});
