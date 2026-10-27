import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStore } from './localStore';
import { migrateSnapshot, type LegacySnapshot } from './migrate';
import { seedChildren, seedMembers, seedTags } from './seed';
import { normalizePageColor } from '../lib/pageColors';

const legacy = (): LegacySnapshot => ({
  children: seedChildren.map(({ pageColor: _, ...child }) => child),
  members: seedMembers,
  tags: seedTags,
  entries: [
    {
      id: 'one',
      date: '2026-10-26',
      childId: 'kid1',
      content: '첫 기록',
      authorId: 'dad',
      tagIds: ['first'],
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T01:00:00Z',
    },
    {
      id: 'two',
      date: '2026-10-26',
      childId: 'kid1',
      content: '다음 기록',
      authorId: 'mom',
      tagIds: ['first', 'sleep'],
      createdAt: '2026-10-26T02:00:00Z',
      updatedAt: '2026-10-26T03:00:00Z',
    },
    {
      id: 'three',
      date: '2026-11-01',
      childId: 'kid2',
      content: '또이 기록',
      authorId: 'dad',
      tagIds: [],
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    },
  ],
  comments: [
    {
      id: 'comment',
      entryId: 'two',
      authorId: 'dad',
      content: '댓글',
      createdAt: '2026-10-26T04:00:00Z',
      updatedAt: '2026-10-26T04:00:00Z',
    },
  ],
  reactions: [
    { entryId: 'one', memberId: 'dad', emoji: '❤️' },
    { entryId: 'two', memberId: 'dad', emoji: '❤️' },
  ],
});

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
});

describe('page migration and local persistence', () => {
  it('normalizes stored page and default child colors on load', () => {
    const data = migrateSnapshot(legacy());
    data.pages[0].color = '#0F4D3A';
    data.children[0].pageColor = '#B8A4F2';
    localStorage.setItem('yuga-record-data', JSON.stringify(data));
    const store = new LocalStore();
    expect(store.getPage('2026-10-26', 'kid1')?.color).toBe(
      normalizePageColor('#0F4D3A'),
    );
    expect(store.listChildren()[0].pageColor).toBe(
      normalizePageColor('#B8A4F2'),
    );
    expect(data.pages[0].color).toBe('#0F4D3A');
  });
  it('asks for a member once and remembers the selection on reload', () => {
    const store = new LocalStore();
    expect(store.needsMember).toBe(true);
    expect(store.getCurrentMemberId()).toBe('');
    const previous = store.getSnapshot();
    store.setCurrentMemberId('mom');
    expect(store.getSnapshot()).not.toBe(previous);
    expect(store.needsMember).toBe(false);
    expect(new LocalStore().getCurrentMemberId()).toBe('mom');
    expect(new LocalStore().needsMember).toBe(false);
  });
  it('persists a member font and its reset across reloads', () => {
    const store = new LocalStore();
    const dad = store.listMembers()[0];
    store.updateMember({
      ...dad,
      fontAssetId: 'data:font/woff2;base64,dGVzdA==',
    });
    expect(new LocalStore().listMembers()[0].fontAssetId).toBe(
      'data:font/woff2;base64,dGVzdA==',
    );
    store.updateMember({ ...dad, fontAssetId: undefined });
    expect(new LocalStore().listMembers()[0].fontAssetId).toBeUndefined();
  });
  it('groups by date and child, preserves authors/times and unions badges and hearts', () => {
    const result = migrateSnapshot(legacy());
    expect(result.pages).toHaveLength(3);
    const page = result.pages[0];
    expect(page.id).toBe('2026-10-26__kid1__dad');
    expect(page.color).toBeUndefined();
    expect(page.text).toBe('첫 기록');
    expect(result.pages[1]).toMatchObject({
      authorId: 'mom',
      text: '다음 기록',
    });
    expect(page.updatedAt).toBe('2026-10-26T03:00:00Z');
    expect(page.tagIds).toEqual(['first', 'sleep']);
    expect(result.comments[0]).toMatchObject({
      pageId: page.id,
      id: 'comment',
    });
    expect(result.comments[0]).not.toHaveProperty('entryId');
    expect(result.reactions).toEqual([
      { pageId: page.id, memberId: 'dad', emoji: '❤️' },
    ]);
  });

  it('persists migration and never duplicates pages on reload', async () => {
    localStorage.setItem('yuga-record-data', JSON.stringify(legacy()));
    const store = new LocalStore();
    await vi.waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem('yuga-record-data')!).version,
      ).toBe(3),
    );
    const persisted = JSON.parse(localStorage.getItem('yuga-record-data')!);
    expect(persisted.version).toBe(3);
    expect(persisted).not.toHaveProperty('entries');
    expect(persisted.pages).toHaveLength(3);
    expect(new LocalStore().exportAll()).toEqual(store.exportAll());
  });

  it('updates all existing colors and defaults, optionally for only one child', () => {
    const store = new LocalStore();
    store.importAll(migrateSnapshot(legacy()));
    store.setAllPageColors('#F59157', 'kid1');
    expect(store.getPage('2026-10-26', 'kid1')?.color).toBe('#F59157');
    expect(store.getPage('2026-11-01', 'kid2')?.color).toBeUndefined();
    expect(store.listChildren().map((child) => child.pageColor)).toEqual([
      '#F59157',
      '#CDEFE2',
    ]);
    store.setAllPageColors('#CDEFE2');
    expect(store.listPages().every((page) => page.color === '#CDEFE2')).toBe(
      true,
    );
    expect(
      store.listChildren().every((child) => child.pageColor === '#CDEFE2'),
    ).toBe(true);
    expect(new LocalStore().exportAll()).toEqual(store.exportAll());
  });

  it('replaces pages, filters date ranges and cascades deletes', () => {
    const store = new LocalStore();
    store.importAll(migrateSnapshot(legacy()));
    const page = store.listPages()[0];
    store.savePage({ ...page, text: '' });
    expect(store.listPages()).toHaveLength(3);
    expect(store.getPage(page.date, page.childId)?.text).toBe('');
    expect(
      store.listPages({ startDate: '2026-11-01', endDate: '2026-11-30' }),
    ).toHaveLength(1);
    store.deleteTag('first');
    expect(store.listTags().some((tag) => tag.id === 'first')).toBe(false);
    expect(store.listPages()[0].tagIds).not.toContain('first');
    store.deletePage(page.id);
    expect(store.listComments()).toEqual([]);
    expect(store.listReactions()).toEqual([]);
  });
});
