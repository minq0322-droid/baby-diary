import { afterEach, expect, it, vi } from 'vitest';
import { ArtifactStore } from './artifactStore';
import { FakeDb, config, page, settle } from './testDb';
import * as images from '../lib/image';

afterEach(() => vi.restoreAllMocks());
it('writes one full body per page and small index summaries with no media bytes', async () => {
  const db = new FakeDb();
  const store = new ArtifactStore(db, 'viewer');
  store.savePage({
    ...page(),
    drawing: [{ color: 'ink', width: 2, points: [0, 0, 1, 1] }],
  });
  store.savePage(page('2026-10-27'));
  await settle();
  expect(db.bodies.get('pages/' + page().id)).toHaveProperty('drawing');
  expect(db.bodies.get('index/2026-10')).toMatchObject({
    pages: { [page().id]: { hasDrawing: true, firstLine: '오늘 기록' } },
  });
  expect(JSON.stringify(db.bodies.get('index/2026-10'))).not.toContain(
    'points',
  );
  expect(db.writes.some((write) => write.path.startsWith('months/'))).toBe(
    false,
  );
  store.dispose();
});
it('loads a full old-month body on demand and exports only after all pages load', async () => {
  const db = new FakeDb();
  const value = page('2020-01-01');
  db.bodies.set(
    'pages/' + value.id,
    value as unknown as Record<string, unknown>,
  );
  db.bodies.set('index/2020-01', {
    pages: {
      [value.id]: {
        ...value,
        text: undefined,
        drawing: undefined,
        photos: undefined,
        firstLine: '요약',
        hasDrawing: false,
        photoCount: 0,
      },
    },
    comments: {},
    reactions: {},
  });
  const store = new ArtifactStore(db, 'viewer');
  expect(store.getPage(value.date, value.childId)).toBeUndefined();
  expect(() => store.exportAll()).toThrow();
  expect(await store.loadPage(value.id)).toMatchObject({ text: value.text });
  await store.loadAllPages();
  expect(store.exportAll().pages[0].text).toBe(value.text);
  store.dispose();
});
it('persists independent child settings even while one page keeps failing', async () => {
  vi.useFakeTimers();
  const db = new FakeDb();
  db.failPaths.set('pages/' + page().id, 'invalid_argument');
  const store = new ArtifactStore(db, 'viewer');
  store.savePage(page());
  await settle();
  store.updateChild({ ...store.listChildren()[0], pageColor: '#F9F0C8' });
  await vi.advanceTimersByTimeAsync(1000);
  await settle();
  expect(db.bodies.get('meta/config')).toMatchObject({
    children: { kid1: { pageColor: '#F9F0C8' } },
  });
  expect(store.listPages()[0].text).toBe('오늘 기록');
  expect(store.syncState).toBe('retrying');
  expect(store.readOnly).toBe(false);
  db.failPaths.clear();
  store.retry();
  await settle();
  expect(store.syncState).toBe('ok');
  store.dispose();
  vi.useRealTimers();
});
it('migrates sources only once and marks complete after destination writes', async () => {
  const db = new FakeDb();
  const old = {
    ...page(),
    id: '2026-10-26__kid1',
    authorId: undefined,
    text: undefined,
    notes: [
      {
        id: 'a',
        authorId: 'mom',
        text: '엄마 기록',
        createdAt: '1',
        updatedAt: '1',
      },
      {
        id: 'b',
        authorId: 'dad',
        text: '아빠 기록',
        createdAt: '2',
        updatedAt: '2',
      },
    ],
  };
  db.bodies.set('months/2026-10', {
    pages: { [old.id]: old },
    comments: {},
    reactions: {},
  });
  const store = new ArtifactStore(db, 'viewer');
  await settle();
  expect(db.bodies.get('months/2026-10')).toMatchObject({
    pages: { [old.id]: old },
  });
  expect(db.bodies.get('index/2026-10')).toHaveProperty('authorPagesV3', true);
  expect(db.writes.at(-1)?.patch).toEqual({ authorPagesV3: true });
  expect(store.listPages()).toHaveLength(2);
  store.dispose();
  db.writes = [];
  const next = new ArtifactStore(db, 'viewer');
  await settle();
  expect(db.writes).toEqual([]);
  next.dispose();
});
it('keeps source and omits completion marker when a destination write fails', async () => {
  vi.useFakeTimers();
  const db = new FakeDb();
  db.bodies.set('months/2026-10', {
    entries: {
      old: {
        id: 'old',
        date: page().date,
        childId: 'kid1',
        authorId: 'dad',
        content: '기록',
        tagIds: [],
        createdAt: '1',
        updatedAt: '1',
      },
    },
  });
  db.failNext = true;
  const store = new ArtifactStore(db, 'viewer');
  await settle();
  expect(db.bodies.get('index/2026-10') ?? {}).not.toHaveProperty(
    'authorPagesV3',
  );
  expect(db.bodies.get('months/2026-10')).toHaveProperty('entries');
  store.retry();
  await settle();
  expect(db.bodies.get('index/2026-10')).toHaveProperty('authorPagesV3', true);
  store.dispose();
  vi.useRealTimers();
});
it.each([
  'revoked',
  'not_granted',
  'invalid_argument',
  'quota_exceeded',
  'capability_disabled',
])('disables writing only for permission revocation: %s', async (code) => {
  vi.useFakeTimers();
  const db = new FakeDb();
  db.failNext = true;
  db.failureCode = code;
  const store = new ArtifactStore(db, 'viewer');
  store.savePage(page());
  await settle();
  expect(store.readOnly).toBe(['revoked', 'not_granted'].includes(code));
  expect(store.listPages()).toHaveLength(1);
  store.dispose();
  vi.useRealTimers();
});
it('uploads through assets, retains unlimited history, swaps history and deletes only the selected unused asset', async () => {
  const db = new FakeDb();
  let index = 0;
  const upload = vi.fn(async () => ({ id: 'asset' + ++index, url: '/photo' }));
  const remove = vi.fn(async () => ({ deleted: true }));
  vi.spyOn(images, 'downscalePhoto').mockImplementation(async (blob) => blob);
  const store = new ArtifactStore(db, 'viewer', true, {
    upload,
    delete: remove,
  } as unknown as Claude.Assets);
  for (let i = 0; i < 8; i++)
    await store.setChildPhoto('kid1', new Blob(['photo']));
  await settle();
  expect(store.listChildren()[0].photoHistory).toHaveLength(7);
  const child = store.listChildren()[0];
  const previous = child.photoHistory[0];
  store.useHistoryPhoto(child.id, previous.id);
  expect(store.listChildren()[0].photo?.id).toBe(previous.id);
  expect(store.listChildren()[0].photoHistory).toHaveLength(7);
  const removed = store.listChildren()[0].photoHistory[0];
  await store.deleteHistoryPhoto(child.id, removed.id);
  expect(remove).toHaveBeenCalledWith(removed.src);
  expect(store.listChildren()[0].photoHistory).toHaveLength(6);
  expect(store.listChildren()[1]).toEqual({
    ...config().children.kid2,
    status: 'expecting',
  });
  store.dispose();
});
