import { describe, expect, it } from 'vitest';
import { fromBackupJson, toBackupJson, toMarkdown } from './exportFormat';
import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
import { seedChildren, seedMembers, seedTags } from '../data/seed';

const old: LegacySnapshot = {
  children: seedChildren,
  members: seedMembers,
  tags: seedTags,
  entries: [
    {
      id: 'entry1',
      childId: 'kid1',
      date: '2026-10-26',
      content: '첫 걸음',
      tagIds: ['first'],
      authorId: 'dad',
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    },
  ],
  comments: [
    {
      id: 'comment1',
      entryId: 'entry1',
      content: '멋지다',
      authorId: 'dad',
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    },
  ],
  reactions: [{ entryId: 'entry1', memberId: 'dad', emoji: '❤️' }],
};
const all = migrateSnapshot(old);
all.pages[0].drawing = [{ color: '#000', width: 2, points: [0, 0, 1, 1] }];
all.pages[0].photos = [
  { id: 'photo', src: '/photo.jpg', x: 0, y: 0, w: 1, rotation: 0 },
];

describe('page exports', () => {
  it('round-trips v3 including drawings, photos and activity', () => {
    const backup = toBackupJson(all);
    expect(backup.version).toBe(3);
    expect(backup).not.toHaveProperty('entries');
    expect(fromBackupJson(JSON.parse(JSON.stringify(backup)))).toEqual(all);
  });
  it('converts a v1 backup to pages and rekeys activity', () => {
    const imported = fromBackupJson({ ...old, version: 1 });
    expect(imported.pages[0]).toMatchObject({
      text: '첫 걸음',
      authorId: 'dad',
    });
    expect(imported.comments[0].pageId).toBe('2026-10-26__kid1__dad');
    expect(imported.reactions[0].pageId).toBe('2026-10-26__kid1__dad');
  });
  it('writes Korean page headings, notes, badges and media counts', () => {
    const markdown = toMarkdown(all, '2026-10');
    expect(markdown).toContain('## 10월 26일 (월) · 조비안');
    expect(markdown).toContain('- 첫 걸음 — 아빠');
    expect(markdown).toContain('배지: 🌟처음');
    expect(markdown).toContain('(그림 있음, 사진 1장)');
    expect(markdown).toContain('💬 멋지다 — 아빠');
    expect(markdown).toContain('❤️ 아빠');
    expect(toMarkdown(all, '2026-11')).toBe('');
  });
  it('rejects unsupported or malformed backups', () => {
    expect(() => fromBackupJson({ ...old, version: 7 })).toThrow();
    expect(() =>
      fromBackupJson({ ...toBackupJson(all), pages: [{}] }),
    ).toThrow();
  });
});
