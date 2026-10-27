import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStore } from './supabaseStore';
import type { Page } from './types';
type Row = Record<string, unknown>;
const user1 = 'device-dad';
const user2 = 'device-mom';
const familyId = 'family-one';
const page: Page = {
  id: '2026-10-26__kid1__dad', childId: 'kid1', date: '2026-10-26',
  text: '첫 걸음', tagIds: ['first'], authorId: 'dad', drawing: [], photos: [],
  createdAt: '2026-10-26T00:00:00Z', updatedAt: '2026-10-26T00:00:00Z',
};
function fakeServer(role = 'writer') {
  let userId = user1;
  const rows: Record<string, Row[]> = {
    family_members: [{ user_id: user1, family_id: familyId, member_id: role === 'reader' ? 'reader' : 'dad', role }],
    children: [], tags: [], pages: [], comments: [], reactions: [],
    members: [{ family_id: familyId, member_id: 'dad', display_name: '아빠', color: 'dad' },
      { family_id: familyId, member_id: 'mom', display_name: '엄마', color: 'mom' }],
  };
  let authChanged: (event: string, session: unknown) => void = () => { };
  const callbacks = new Map<string, (payload: unknown) => void>();
  const channel = {
    on: vi.fn((_event, filter, callback) => { callbacks.set(filter.table, callback); return channel; }),
    subscribe: vi.fn(() => channel),
  };
  const upsert = vi.fn(async (table: string, row: Row) => {
    const same = (item: Row) => table === 'reactions'
      ? item.page_id === row.page_id && item.member_id === row.member_id : item.id === row.id;
    rows[table] = [...rows[table].filter((item) => !same(item)), row];
    return { error: null };
  });
  const membership = vi.fn(async () => ({ data: rows.family_members.find((row) => row.user_id === userId) ?? null, error: null }));
  const signed = vi.fn(async (path: string) => ({ data: { signedUrl: 'https://signed/' + path }, error: null }));
  const upload = vi.fn(async () => ({ error: null }));
  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { user: { id: userId } } }, error: null })),
      signInAnonymously: vi.fn(),
      onAuthStateChange: vi.fn((callback) => { authChanged = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; }),
    },
    rpc: vi.fn(async () => ({ data: null, error: null })),
    channel: vi.fn(() => channel), removeChannel: vi.fn(),
    storage: { from: () => ({ createSignedUrl: signed, upload, remove: vi.fn(async () => ({ error: null })) }) },
    from: vi.fn((table: string) => {
      const filters: Row = {};
      let update: Row | undefined;
      let deleting = false;
      const matches = (row: Row) => Object.entries(filters).every(([key, value]) => row[key] === value);
      const query = {
        select: () => query, order: () => query,
        eq: (key: string, value: unknown) => { filters[key] = value; return query; },
        maybeSingle: membership,
        range: async () => ({ data: rows[table].filter(matches), error: null }),
        upsert: (row: Row) => upsert(table, row),
        update: (row: Row) => { update = row; return query; },
        delete: () => { deleting = true; return query; },
        then: (resolve: (value: unknown) => void) => {
          if (update)
            rows[table] = rows[table].map((row) => matches(row) ? { ...row, ...update } : row);
          if (deleting)
            rows[table] = rows[table].filter((row) => !matches(row));
          resolve({ error: null });
        },
      };
      return query;
    }),
  };
  return { rows, upsert, membership, signed, upload, client: client as unknown as SupabaseClient,
    login: (id: string) => { userId = id; authChanged('SIGNED_IN', { user: { id } }); },
    emit: (table: string, eventType: string, row: Row) => {
      row = { family_id: familyId, ...row };
      const key = table === 'reactions' ? 'page_id' : table === 'members' ? 'member_id' : 'id';
      rows[table] = rows[table].filter((item) => item[key] !== row[key]);
      if (eventType !== 'DELETE')
        rows[table].push(row);
      if (table === 'pages' && eventType === 'DELETE') {
        rows.comments = rows.comments.filter((item) => item.page_id !== row.id);
        rows.reactions = rows.reactions.filter((item) => item.page_id !== row.id);
      }
      callbacks.get(table)?.({ eventType, new: eventType === 'DELETE' ? {} : row, old: eventType === 'DELETE' ? row : {} });
    },
  };
}
let stores: SupabaseStore[] = [];
function create(server: ReturnType<typeof fakeServer>) {
  const store = new SupabaseStore(server.client, 'test-project');
  stores.push(store);
  return store;
}
async function ready(store: SupabaseStore) {
  await vi.waitFor(() => expect(store.getStatus().phase).toBe('ready'));
}
beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
  const events = new EventTarget();
  vi.stubGlobal('window', { setTimeout, addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events),
    history: { replaceState: vi.fn() }, location: { hash: '', pathname: '/baby-diary/', search: '' } });
  vi.stubGlobal('navigator', { onLine: false });
});
afterEach(() => { stores.forEach((store) => store.dispose()); stores = []; vi.unstubAllGlobals(); });
describe('family SupabaseStore', () => {
  it('queues only the current member font and sends its storage path, including reset', async () => {
    const server = fakeServer();
    const store = create(server);
    await ready(store);
    expect(store.getCurrentMemberId()).toBe('dad');
    store.updateMember({ ...store.listMembers()[1], fontAssetId: '/other' });
    expect(store.getStatus().pending).toBe(0);
    const member = store.listMembers()[0];
    store.updateMember({ ...member, fontAssetId: 'supabase-photo:family-one/font.woff2' });
    expect(store.listMembers()[0].fontAssetId).toBe('supabase-photo:family-one/font.woff2');
    vi.stubGlobal('navigator', { onLine: true });
    store.retry();
    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
    expect(server.rows.members[0].font_asset_path).toBe('supabase-photo:family-one/font.woff2');
    store.updateMember({ ...member, fontAssetId: undefined });
    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
    expect(server.rows.members[0].font_asset_path).toBeNull();
    expect(store.listMembers()[0].fontAssetId).toBeUndefined();
  });
  it('persists optimistic pages and flushes the same mutation after restart', async () => {
    const server = fakeServer();
    const first = create(server);
    await ready(first);
    first.savePage(page);
    expect(first.listPages()).toEqual([page]);
    expect(server.upsert).not.toHaveBeenCalled();
    first.dispose();
    const restarted = create(server);
    await ready(restarted);
    expect(restarted.listPages()).toEqual([page]);
    vi.stubGlobal('navigator', { onLine: true });
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(restarted.getStatus().pending).toBe(0));
    expect(server.upsert).toHaveBeenCalledWith('pages', expect.objectContaining({ id: page.id, family_id: familyId, author_id: 'dad', text: page.text }));
  });
  it('keeps failures and newer edits queued, with the reason, and retries in order', async () => {
    const server = fakeServer();
    const store = create(server);
    await ready(store);
    server.upsert.mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('navigator', { onLine: true });
    store.savePage(page);
    await vi.waitFor(() => expect(store.errorMessage).toContain('offline'));
    expect(store.readOnly).toBe(false);
    store.savePage({ ...page, text: '두 걸음' });
    expect(store.listPages()[0].text).toBe('두 걸음');
    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
    expect(server.upsert.mock.calls.map((call) => call[1].text)).toEqual(['첫 걸음', '첫 걸음', '두 걸음']);
  });
  it('refreshes realtime changes, preserves pending edits, and cascades deletes', async () => {
    const server = fakeServer();
    const store = create(server);
    await ready(store);
    store.savePage(page);
    server.emit('pages', 'UPDATE', { id: page.id, child_id: 'kid1', date: page.date, text: 'server', author_id: 'dad', tag_ids: [], drawing: [], photos: [] });
    await vi.waitFor(() => expect(store.listPages()[0].text).toBe('첫 걸음'));
    vi.stubGlobal('navigator', { onLine: true });
    store.retry();
    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
    server.emit('comments', 'INSERT', { id: 'comment', page_id: page.id, author_id: 'mom', content: '멋져' });
    server.emit('reactions', 'INSERT', { page_id: page.id, member_id: 'mom', emoji: '❤️' });
    await vi.waitFor(() => expect(store.listComments()).toHaveLength(1));
    await vi.waitFor(() => expect(store.listReactions()).toHaveLength(1));
    server.emit('pages', 'DELETE', { id: page.id });
    await vi.waitFor(() => expect(store.listPages()).toEqual([]));
    expect(store.listComments()).toEqual([]);
    expect(store.listReactions()).toEqual([]);
  });
  it('isolates device caches and pending writes on identity change', async () => {
    const server = fakeServer();
    const store = create(server);
    await ready(store);
    store.savePage(page);
    server.rows.family_members = [{ user_id: user2, family_id: familyId, member_id: 'mom', role: 'writer' }];
    server.login(user2);
    await vi.waitFor(() => expect(store.getCurrentMemberId()).toBe('mom'));
    expect(store.listPages()).toEqual([]);
    expect(store.getStatus().pending).toBe(0);
    expect(server.upsert).not.toHaveBeenCalled();
  });
  it('blocks reader writes and other members comments and hearts', async () => {
    const server = fakeServer('reader');
    const store = create(server);
    await ready(store);
    store.savePage(page);
    expect(store.listPages()).toEqual([]);
    expect(store.getStatus().pending).toBe(0);
    server.rows.family_members[0] = { ...server.rows.family_members[0], member_id: 'dad', role: 'writer' };
    store.retry();
    await vi.waitFor(() => expect(store.readOnly).toBe(false));
    store.createComment({ id: 'c', pageId: page.id, authorId: 'mom', content: '댓글', createdAt: page.createdAt, updatedAt: page.updatedAt });
    store.toggleReaction(page.id, 'mom');
    expect(store.listComments()).toEqual([]);
    expect(store.listReactions()).toEqual([]);
    expect(server.upsert).not.toHaveBeenCalled();
  });
  it('detects kicked devices and keeps unsent edits in persisted storage', async () => {
    const server = fakeServer();
    const store = create(server);
    await ready(store);
    store.savePage(page);
    server.rows.family_members = [];
    store.retry();
    await vi.waitFor(() => expect(store.getStatus().phase).toBe('blocked'));
    expect(store.readOnly).toBe(true);
    expect(store.getStatus().pending).toBe(1);
    expect(server.upsert).not.toHaveBeenCalled();
  });
  it('caches signed assets for 50 minutes and refreshes them afterwards', async () => {
    const server = fakeServer();
    const store = create(server);
    await ready(store);
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1000);
    const src = 'supabase-photo:family-one/photo.jpg';
    expect(await store.resolvePhotoSrc(src)).toBe('https://signed/family-one/photo.jpg');
    await store.resolvePhotoSrc(src);
    expect(server.signed).toHaveBeenCalledTimes(1);
    now.mockReturnValue(1000 + 50 * 60000);
    await store.resolvePhotoSrc(src);
    expect(server.signed).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });
  it('keeps cached edits available when a restarted device cannot reach membership', async () => {
    const server = fakeServer();
    const first = create(server);
    await ready(first);
    first.savePage(page);
    first.dispose();
    server.membership.mockRejectedValue(new Error('network unavailable'));
    const restarted = create(server);
    await ready(restarted);
    expect(restarted.listPages()).toEqual([page]);
    expect(restarted.readOnly).toBe(false);
    expect(restarted.errorMessage).toContain('network unavailable');
  });
  it('uploads WOFF2 and TTF under the family prefix and refuses other formats', async () => {
    const server = fakeServer();
    const store = create(server);
    await ready(store);
    const font = new Blob(['wOF2', 'font bytes']);
    const result = await store.uploadFont(font);
    expect(result.src).toMatch(/^supabase-photo:family-one\/.*\.woff2$/);
    expect(server.upload).toHaveBeenCalledWith(expect.stringMatching(/^family-one\//), font, { contentType: 'font/woff2' });
    await store.uploadFont(new Blob([new Uint8Array([0, 1, 0, 0])]));
    expect(server.upload).toHaveBeenLastCalledWith(expect.stringMatching(/\.ttf$/), expect.any(Blob), { contentType: 'font/ttf' });
    await expect(store.uploadFont(new Blob(['OTTO']))).rejects.toThrow('WOFF2 또는 TTF');
  });

});
