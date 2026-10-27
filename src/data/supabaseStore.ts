import { normalizePageColor } from '../lib/pageColors';
import { migrateSnapshot } from './migrate';
import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
import { LegacyAdapter } from './legacyAdapter';
import { preparePage } from '../lib/stroke';
import { downscalePhoto } from '../lib/image';
import { enterFamily, loadMembership, makeInvite, inviteRequired, inviteFailure, type FamilyMembership } from './familyAccess';
import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
} from '@supabase/supabase-js';
import type { DataStore } from './DataStore';
import type {
  Child,
  Comment,
  Page,
  PageRange,
  Member,
  Reaction,
  StoreSnapshot,
  Tag,
} from './types';

type Table =
  | 'children'
  | 'members'
  | 'tags'
  | 'pages'
  | 'comments'
  | 'reactions';
type Row = Record<string, unknown>;
type Mutation =
  | { kind: 'member'; member: Member }
  | { kind: 'entry'; entry: Page }
  | {
    kind: 'upsert';
    table: 'children' | 'tags' | 'comments' | 'reactions';
    row: Row;
  }
  | {
    kind: 'delete';
    table: 'pages' | 'tags' | 'comments' | 'reactions';
    key: Row;
  };
type Envelope = { base: StoreSnapshot; outbox: Mutation[]; membership?: FamilyMembership };
export type SyncStatus = {
  phase: 'loading' | 'signedOut' | 'ready' | 'blocked';
  message: string;
  pending: number;
  canWrite: boolean;
};

const empty = (): StoreSnapshot => ({
  children: [],
  members: [],
  tags: [],
  pages: [],
  comments: [],
  reactions: [],
});
const tables: Table[] = [
  'children',
  'members',
  'tags',
  'pages',
  'comments',
  'reactions',
];
const camel = (key: string) =>
  key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const snake = (key: string) =>
  key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
function fromRow<T>(row: Row): T {
  if ('display_name' in row) {
    row = { ...row, id: row.member_id, font_asset_id: row.font_asset_path };
    delete row.member_id;
    delete row.font_asset_path;
  }
  return Object.fromEntries(
    Object.entries(row)
      .filter(([key]) => key !== 'family_id')
      .map(([key, value]) => [camel(key), value ?? undefined]),
  ) as T;
}
function toRow(value: object): Row {
  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => [snake(key), field ?? null]),
  );
}
function replace<T>(items: T[], item: T, same: (value: T) => boolean): T[] {
  return items.some(same)
    ? items.map((value) => (same(value) ? item : value))
    : [...items, item];
}

/** Apply both realtime rows and queued changes to an immutable cache. */
function patch(
  snapshot: StoreSnapshot,
  table: Table,
  row: Row,
  deleted = false,
): StoreSnapshot {
  if (table === 'reactions') {
    const same = (item: Reaction) =>
      item.pageId === row.page_id && item.memberId === row.member_id;
    return {
      ...snapshot,
      reactions: deleted
        ? snapshot.reactions.filter((item) => !same(item))
        : replace(snapshot.reactions, fromRow<Reaction>(row), same),
    };
  }
  if (table === 'members') row = { ...row, id: row.member_id };
  const same = (item: { id: string }) => item.id === row.id;
  if (table === 'pages') {
    const entry = fromRow<Page>(row);
    return {
      ...snapshot,
      pages: deleted
        ? snapshot.pages.filter((item) => !same(item))
        : replace(snapshot.pages, entry, same),
      comments: deleted
        ? snapshot.comments.filter((item) => item.pageId !== row.id)
        : snapshot.comments,
      reactions: deleted
        ? snapshot.reactions.filter((item) => item.pageId !== row.id)
        : snapshot.reactions,
    };
  }
  // These collections share their primary-key shape, while retaining domain types.
  const update = <T extends { id: string }>(items: T[]): T[] =>
    deleted
      ? items.filter((item) => !same(item))
      : replace(items, fromRow<T>(row), same);
  switch (table) {
    case 'children':
      return { ...snapshot, children: update(snapshot.children) };
    case 'members':
      return { ...snapshot, members: update(snapshot.members) };
    case 'tags':
      return { ...snapshot, tags: update(snapshot.tags) };
    case 'comments':
      return { ...snapshot, comments: update(snapshot.comments) };
  }
}

function apply(snapshot: StoreSnapshot, mutation: Mutation): StoreSnapshot {
  if (mutation.kind === 'member') {
    return {
      ...snapshot,
      members: replace(
        snapshot.members,
        mutation.member,
        (item) => item.id === mutation.member.id,
      ),
    };
  }
  if (mutation.kind === 'entry') {
    return {
      ...snapshot,
      pages: replace(
        snapshot.pages,
        mutation.entry,
        (item) => item.id === mutation.entry.id,
      ),
    };
  }
  return patch(
    snapshot,
    mutation.table,
    mutation.kind === 'delete' ? mutation.key : mutation.row,
    mutation.kind === 'delete',
  );
}

export class SupabaseStore extends LegacyAdapter implements DataStore {
  readonly canSwitchMember = false;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private retryAttempts = 0;
  get syncState(): import('./types').SyncState {
    return this.status.message
      ? this.status.canWrite
        ? 'retrying'
        : 'error'
      : this.outbox.length
        ? 'saving'
        : 'ok';
  }
  get errorMessage(): string {
    return this.status.message;
  }
  get readOnly(): boolean {
    return !this.status.canWrite;
  }
  private base = empty();
  private snapshot = empty();
  private outbox: Mutation[] = [];
  private listeners = new Set<() => void>();
  private userId = '';
  private membership: FamilyMembership | null = null;
  private bootstrapping = true;
  private assetUrls = new Map<string, { url: string; expires: number }>();
  private membershipTimer?: ReturnType<typeof setInterval>;
  get isOwner(): boolean {
    return this.membership?.role === 'owner';
  }
  private storageKey = '';
  private status: SyncStatus = {
    phase: 'loading',
    message: '',
    pending: 0,
    canWrite: false,
  };
  private channel?: RealtimeChannel;
  private flushing = false;
  private revision = 0;
  private generation = 0;
  private disposed = false;
  private refreshPromise?: Promise<void>;
  private authSubscription: { unsubscribe(): void };

  constructor(
    private client: SupabaseClient,
    private namespace: string,
  ) {
    super();
    // Defer work outside the Auth callback: SDK calls here can otherwise deadlock.
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (this.bootstrapping || _event === 'INITIAL_SESSION' || _event === 'TOKEN_REFRESHED') return;
      const id = session?.user.id ?? '';
      window.setTimeout(() => {
        if (!this.bootstrapping) void this.activate(id);
      }, 0);
    });
    this.authSubscription = data.subscription;
    window.addEventListener('online', this.retry);
    void this.start();
    this.membershipTimer = setInterval(() => {
      if (this.status.phase === 'ready') void this.checkMembership().catch(() => undefined);
    }, 60_000);
  }

  static create(url: string, key: string): SupabaseStore {
    return new SupabaseStore(createClient(url, key), url);
  }

  getSnapshot = (): StoreSnapshot => this.snapshot;
  getStatus = (): SyncStatus => this.status;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private setStatus(status: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...status, pending: this.outbox.length };
    this.snapshot = { ...this.snapshot };
    this.notify();
  }

  private commit(): void {
    const next = this.outbox.reduce(apply, this.base);
    this.snapshot = {
      ...next,
      pages: next.pages.map((page) => ({
        ...page,
        color: page.color ? normalizePageColor(page.color) : undefined,
      })),
      children: next.children.map((child) => ({
        ...child,
        pageColor: normalizePageColor(child.pageColor),
        photoHistory: child.photoHistory ?? [],
      })),
    };
    try {
      if (this.storageKey) {
        const envelope: Envelope = {
          base: this.base,
          outbox: this.outbox,
          membership: this.membership ?? undefined,
        };
        localStorage.setItem(this.storageKey, JSON.stringify(envelope));
      }
    } catch {
      this.status = {
        ...this.status,
        message:
          '기기 저장 공간을 확인해 주세요. 창을 닫으면 대기 중인 변경이 사라질 수 있어요.',
      };
    }
    this.setStatus({});
  }

  private async start(): Promise<void> {
    if (this.disposed) return;
    const joining = new URLSearchParams(window.location.hash.replace(/^#/, '')).has('join');
    this.bootstrapping = true;
    this.setStatus({ phase: 'loading', message: '' });
    try {
      const result = await enterFamily(this.client, window.location, (url) => {
        window.history.replaceState(null, '', url);
      });
      this.membership = result.membership;
      await this.activate(result.userId, true);
    } catch (error) {
      // A previously verified device can keep editing its persisted outbox offline.
      let recovered = false;
      if (this.reason(error) !== inviteFailure && !joining) {
        try {
          const { data } = await this.client.auth.getSession();
          const id = data.session?.user.id;
          const saved = id && localStorage.getItem('yuga-supabase-family:' + this.namespace + ':' + id);
          const envelope = saved ? JSON.parse(saved) as Envelope : undefined;
          if (id && envelope?.membership) {
            this.membership = envelope.membership;
            await this.activate(id, true);
            this.setStatus({ message: '연결을 기다리고 있어요. ' + this.reason(error) });
            recovered = true;
          }
        } catch { /* Keep a calm connection screen when no local snapshot is available. */ }
      }
      if (!recovered) this.setStatus({ phase: 'blocked', message: this.reason(error) });
    } finally {
      this.bootstrapping = false;
    }
  }

  private async activate(id: string, force = false): Promise<void> {
    if (this.disposed) return;
    if (!force && id === this.userId && this.status.phase !== 'loading') return;
    const generation = ++this.generation;
    if (this.channel) void this.client.removeChannel(this.channel);
    if (!force) this.membership = null;
    this.userId = id;
    this.base = empty();
    this.outbox = [];
    this.storageKey = id ? 'yuga-supabase-family:' + this.namespace + ':' + id : '';
    this.refreshPromise = undefined;
    if (!id) {
      this.snapshot = empty();
      this.setStatus({ phase: 'blocked', canWrite: false, message: inviteRequired });
      return;
    }
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const envelope = JSON.parse(saved) as Envelope;
        if (!this.membership || envelope.membership?.family_id === this.membership.family_id) {
          this.base = migrateSnapshot(envelope.base);
          this.outbox = envelope.outbox;
        }
      }
      if (!force) this.membership = await loadMembership(this.client, id);
    } catch (error) {
      this.setStatus({ message: '연결을 기다리고 있어요. ' + this.reason(error) });
    }
    if (generation !== this.generation) return;
    this.setStatus({
      phase: this.membership ? 'ready' : 'blocked',
      canWrite: !!this.membership && this.membership.role !== 'reader',
      message: this.membership ? '' : inviteRequired,
    });
    this.commit();
    if (!this.membership) return;
    this.channel = this.client.channel('family:' + this.membership.family_id);
    for (const table of tables) {
      this.channel.on('postgres_changes', {
        event: '*', schema: 'public', table,
        filter: 'family_id=eq.' + this.membership.family_id,
      }, (payload) => {
        if (generation !== this.generation) return;
        this.revision++;
        if (payload.eventType === 'DELETE') {
          this.retry();
          return;
        }
        const row = payload.new as Row;
        if (row.family_id !== this.membership?.family_id) return;
        this.base = patch(this.base, table, row);
        this.commit();
      });
    }
    this.channel.subscribe((state) => {
      if (generation === this.generation && state === 'SUBSCRIBED') this.retry();
    });
    await this.refresh();
    if (generation === this.generation) void this.flush();
  }

  private reason(error: unknown): string {
    return typeof error === 'object' && error && 'message' in error
      ? String(error.message) : '연결을 확인하고 다시 시도해 주세요.';
  }

  private async checkMembership(): Promise<boolean> {
    const generation = this.generation;
    const membership = await loadMembership(this.client, this.userId);
    if (generation !== this.generation) return false;
    this.membership = membership;
    if (!membership) {
      this.base = empty();
      this.snapshot = empty();
      this.setStatus({ phase: 'blocked', canWrite: false, message: inviteRequired });
      return false;
    }
    this.setStatus({ canWrite: membership.role !== 'reader' });
    return true;
  }

  private refresh(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;
    const generation = this.generation;
    const work = async () => {
      try {
        if (!await this.checkMembership()) return;
        // A reconnect also fetches missed deletes and tag changes.
        let changed: boolean;
        do {
          const revision = this.revision;
          const results = await Promise.all(
            tables.map((table) => this.fetchRows(table)),
          );
          if (generation !== this.generation) return;
          changed = revision !== this.revision;
          if (changed) continue;
          let next = empty();
          tables.forEach((table, index) => {
            for (const row of results[index]) next = patch(next, table, row);
          });
          const member = this.membership;
          this.base = next;
          this.setStatus({
            phase: member ? 'ready' : 'blocked',
            canWrite: !!member && member.role !== 'reader',
            message: member ? '' : inviteRequired,
          });
          this.commit();
        } while (changed && generation === this.generation);
      } catch (error) {
        if (generation !== this.generation) return;
        this.setStatus({
          message: '연결을 기다리고 있어요. ' + this.reason(error),
        });
      }
    };
    const promise = work().finally(() => {
      if (this.refreshPromise === promise) this.refreshPromise = undefined;
    });
    this.refreshPromise = promise;
    return promise;
  }

  private async fetchRows(table: Table): Promise<Row[]> {
    const rows: Row[] = [];
    const keys = table === 'reactions' ? ['page_id', 'member_id'] : table === 'members' ? ['member_id'] : ['id'];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      let query = this.client.from(table).select('*').eq('family_id', this.membership!.family_id);
      for (const key of keys) query = query.order(key);
      const { data, error } = await query.range(offset, offset + pageSize - 1);
      if (error) throw error;
      rows.push(...((data ?? []) as Row[]));
      if (!data || data.length < pageSize) return rows;
    }
  }

  retry = (): void => {
    if (this.disposed || this.bootstrapping) return;
    if (!this.userId || this.status.phase === 'blocked') {
      if (this.status.message !== inviteFailure) void this.start();
      return;
    }
    void this.refresh().then(() => this.flush());
  };

  createInvite(memberId: string, replace = false): Promise<string> {
    if (!this.isOwner) return Promise.reject(new Error('가족 관리자만 만들 수 있어요.'));
    return makeInvite(this.client, memberId, replace);
  }
  async storageUsage(): Promise<number> {
    const { data, error } = await this.client.rpc('storage_usage');
    if (error) throw error;
    return Number(data);
  }

  private enqueue(mutations: Mutation[]): void {
    if (!this.status.canWrite || this.status.phase !== 'ready') {
      this.setStatus({ message: '기록을 변경하려면 작성자 권한이 필요해요.' });
      return;
    }
    this.outbox = [...this.outbox, ...mutations];
    this.commit();
    void this.flush();
  }

  private async send(mutation: Mutation): Promise<void> {
    const family_id = this.membership!.family_id;
    if (mutation.kind === 'member') {
      const { id, displayName, color, fontAssetId } = mutation.member;
      const { error } = await this.client.from('members').update({
        display_name: displayName, color, font_asset_path: fontAssetId ?? null,
      }).eq('family_id', family_id).eq('member_id', id);
      if (error) throw error;
      return;
    }
    if (mutation.kind === 'entry' || mutation.kind === 'upsert') {
      const table = mutation.kind === 'entry' ? 'pages' : mutation.table;
      const row = mutation.kind === 'entry' ? toRow(mutation.entry) : mutation.row;
      const onConflict = table === 'pages' ? 'id' : table === 'reactions'
        ? 'family_id,page_id,member_id' : 'family_id,id';
      const { error } = await this.client.from(table).upsert({ ...row, family_id }, { onConflict });
      if (error) throw error;
      return;
    }
    let query = this.client.from(mutation.table).delete().eq('family_id', family_id);
    for (const [key, value] of Object.entries(mutation.key)) query = query.eq(key, value);
    const { error } = await query;
    if (error) throw error;
  }

  private async flush(): Promise<void> {
    if (
      this.disposed ||
      this.flushing ||
      !navigator.onLine ||
      !this.status.canWrite ||
      !this.userId
    )
      return;
    this.flushing = true;
    const generation = this.generation;
    let failed = false;
    try {
      while (this.outbox.length && generation === this.generation) {
        const mutation = this.outbox[0];
        await this.send(mutation);
        if (generation !== this.generation) return;
        this.base = apply(this.base, mutation);
        this.outbox = this.outbox.slice(1);
        this.commit();
      }
      this.retryAttempts = 0;
      this.setStatus({ message: '' });
    } catch (error) {
      failed = true;
      const code = (error as { code?: string }).code;
      if (code === 'revoked' || code === 'not_granted')
        this.setStatus({ canWrite: false });
      if (this.status.canWrite && !this.retryTimer)
        this.retryTimer = setTimeout(
          () => {
            this.retryTimer = undefined;
            void this.flush();
          },
          Math.min(1000 * 2 ** this.retryAttempts++, 30000),
        );
      if (generation === this.generation) {
        this.setStatus({
          message:
            '저장 대기 중이에요. ' + this.reason(error),
        });
      }
    } finally {
      this.flushing = false;
      if (generation !== this.generation || (!failed && this.outbox.length > 0))
        void this.flush();
    }
  }

  listChildren(): Child[] {
    return this.snapshot.children;
  }

  listMembers(): Member[] {
    return this.snapshot.members;
  }

  listTags(): Tag[] {
    return this.snapshot.tags;
  }

  listPages(range: PageRange = {}): Page[] {
    return this.snapshot.pages.filter(
      (page) =>
        (!range.startDate || page.date >= range.startDate) &&
        (!range.endDate || page.date <= range.endDate),
    );
  }
  getPage(
    date: string,
    childId: string,
    authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
  ): Page | undefined {
    return this.snapshot.pages.find(
      (page) => page.id === date + '__' + childId + '__' + authorId,
    );
  }
  savePage(page: Page): void {
    if (page.photos.some((photo) => photo.src.startsWith('data:')))
      throw new Error('사진을 먼저 업로드한 뒤 저장해 주세요.');
    this.enqueue([{ kind: 'entry', entry: preparePage(page) }]);
  }
  deletePage(id: string): void {
    this.enqueue([{ kind: 'delete', table: 'pages', key: { id } }]);
  }
  setAllPageColors(color: string, childId?: string): void {
    const updatedAt = new Date().toISOString();
    this.enqueue([
      ...this.snapshot.pages
        .filter((page) => !childId || page.childId === childId)
        .map((page) => ({
          kind: 'entry' as const,
          entry: { ...page, color, updatedAt },
        })),
      ...this.snapshot.children
        .filter((child) => !childId || child.id === childId)
        .map((child) => ({
          kind: 'upsert' as const,
          table: 'children' as const,
          row: toRow({ ...child, pageColor: color }),
        })),
    ]);
  }
  deleteTag(id: string): void {
    this.enqueue([
      ...this.snapshot.pages
        .filter((page) => page.tagIds.includes(id))
        .map((page) => ({
          kind: 'entry' as const,
          entry: {
            ...page,
            tagIds: page.tagIds.filter((tagId) => tagId !== id),
          },
        })),
      { kind: 'delete', table: 'tags', key: { id } },
    ]);
  }
  async uploadPhoto(blob: Blob): Promise<{ src: string }> {
    if (!this.status.canWrite) throw new Error('작성자 권한이 필요해요.');
    const path = this.membership!.family_id + '/' + crypto.randomUUID() + '.jpg';
    const { error } = await this.client.storage
      .from('photos')
      .upload(path, await downscalePhoto(blob), { contentType: 'image/jpeg' });
    if (error) throw error;
    // Signed URLs remain private. resolvePhotoSrc renews them per view.
    return { src: 'supabase-photo:' + path };
  }
  async resolvePhotoSrc(src: string): Promise<string> {
    const marker = '/storage/v1/object/sign/photos/';
    const index = src.indexOf(marker);
    if (index < 0 && !src.startsWith('supabase-photo:')) return src;
    const path = src.startsWith('supabase-photo:')
      ? src.slice(15)
      : decodeURIComponent(src.slice(index + marker.length).split('?')[0]);
    const cached = this.assetUrls.get(path);
    if (cached && cached.expires > Date.now()) return cached.url;
    const { data, error } = await this.client.storage
      .from('photos')
      .createSignedUrl(path, 3600);
    if (error) throw error;
    this.assetUrls.set(path, { url: data.signedUrl, expires: Date.now() + 50 * 60_000 });
    return data.signedUrl;
  }
  protected async removePhotoAsset(src: string): Promise<void> {
    const marker = '/storage/v1/object/sign/photos/';
    const path = src.startsWith('supabase-photo:')
      ? src.slice(15)
      : src.includes(marker)
        ? decodeURIComponent(src.split(marker)[1].split('?')[0])
        : '';
    if (!path) return;
    const { error } = await this.client.storage.from('photos').remove([path]);
    if (error) throw error;
  }
  listComments(pageId?: string): Comment[] {
    if (pageId) pageId = this.pageId(pageId);
    return this.snapshot.comments.filter(
      (comment) => !pageId || comment.pageId === pageId,
    );
  }
  createComment(comment: Comment): void {
    comment = { ...comment, pageId: this.pageId(comment.pageId) };
    if (comment.authorId !== this.getCurrentMemberId()) {
      this.setStatus({
        message: '다른 가족의 댓글은 이 계정에서 복원할 수 없어요.',
      });
      return;
    }
    this.enqueue([{ kind: 'upsert', table: 'comments', row: toRow(comment) }]);
  }
  updateComment(comment: Comment): void {
    if (comment.authorId !== this.getCurrentMemberId()) return;
    this.enqueue([{ kind: 'upsert', table: 'comments', row: toRow(comment) }]);
  }
  deleteComment(id: string): void {
    if (
      this.snapshot.comments.find((item) => item.id === id)?.authorId !==
      this.getCurrentMemberId()
    )
      return;
    this.enqueue([{ kind: 'delete', table: 'comments', key: { id } }]);
  }
  listReactions(pageId?: string): Reaction[] {
    if (pageId) pageId = this.pageId(pageId);
    return this.snapshot.reactions.filter(
      (reaction) => !pageId || reaction.pageId === pageId,
    );
  }
  toggleReaction(pageId: string, memberId = this.getCurrentMemberId()): void {
    pageId = this.pageId(pageId);
    if (memberId !== this.getCurrentMemberId()) return;
    const key = { page_id: pageId, member_id: memberId };
    const exists = this.snapshot.reactions.some(
      (item) => item.pageId === pageId && item.memberId === memberId,
    );
    this.enqueue([
      exists
        ? { kind: 'delete', table: 'reactions', key }
        : { kind: 'upsert', table: 'reactions', row: { ...key, emoji: '❤️' } },
    ]);
  }
  updateChild(child: Child): void {
    this.enqueue([{ kind: 'upsert', table: 'children', row: toRow(child) }]);
  }

  updateMember(member: Member): void {
    if (member.id !== this.getCurrentMemberId()) return;
    this.enqueue([{ kind: 'member', member }]);
  }

  async uploadFont(blob: Blob): Promise<{ src: string }> {
    if (!this.status.canWrite) throw new Error('작성자 권한이 필요해요.');
    const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    const woff2 = String.fromCharCode(...header) === 'wOF2';
    const ttf = header[0] === 0 && header[1] === 1 && header[2] === 0 && header[3] === 0;
    if (!woff2 && !ttf) throw new Error('WOFF2 또는 TTF 글씨체를 골라 주세요.');
    const contentType = ttf ? 'font/ttf' : 'font/woff2';
    const path = this.membership!.family_id + '/' + crypto.randomUUID() + (contentType === 'font/ttf' ? '.ttf' : '.woff2');
    const { error } = await this.client.storage.from('photos').upload(path, blob, { contentType });
    if (error) throw error;
    return { src: 'supabase-photo:' + path };
  }

  createTag(tag: Tag): void {
    this.enqueue([{ kind: 'upsert', table: 'tags', row: toRow(tag) }]);
  }

  updateTag(tag: Tag): void {
    this.createTag(tag);
  }

  reorderTags(ids: string[]): void {
    this.enqueue(
      ids.flatMap((id, sortOrder) => {
        const tag = this.snapshot.tags.find((item) => item.id === id);
        return tag
          ? [
            {
              kind: 'upsert' as const,
              table: 'tags' as const,
              row: toRow({ ...tag, sortOrder }),
            },
          ]
          : [];
      }),
    );
  }
  getCurrentMemberId(): string {
    return this.membership?.member_id ?? '';
  }

  setCurrentMemberId(_id: string): void {
    // Supabase identity is controlled by Auth.
  }

  exportAll(): StoreSnapshot {
    return structuredClone(this.snapshot);
  }

  importAll(data: StoreSnapshot): void | Promise<void> {
    if (hasInlinePhotos(data)) {
      return externalizeSnapshot(data, (blob) => this.uploadPhoto(blob)).then(
        (converted) => this.importAll(converted),
      );
    }
    const mutations: Mutation[] = [];
    for (const child of data.children) {
      if (!this.snapshot.children.some((item) => item.id === child.id)) {
        mutations.push({
          kind: 'upsert',
          table: 'children',
          row: toRow(child),
        });
      }
    }
    for (const tag of data.tags) {
      if (!this.snapshot.tags.some((item) => item.id === tag.id)) {
        mutations.push({ kind: 'upsert', table: 'tags', row: toRow(tag) });
      }
    }
    // Resolve backup writers against the family's dad/mom profiles.
    const resolveMember = (id: string): string | undefined => {
      const member = data.members.find((item) => item.id === id);
      return (
        this.snapshot.members.find((item) => item.id === id)?.id ??
        this.snapshot.members.find((item) => item.color === id)?.id ??
        this.snapshot.members.find(
          (item) =>
            item.displayName === member?.displayName &&
            item.color === member?.color,
        )?.id
      );
    };
    const pages = data.pages
      .filter(
        (entry) => !this.snapshot.pages.some((item) => item.id === entry.id),
      )
      .map(preparePage);
    if (
      pages.some((entry) => !resolveMember(entry.authorId)) ||
      data.comments.some(
        (item) =>
          pages.some((entry) => entry.id === item.pageId) &&
          resolveMember(item.authorId) !== this.getCurrentMemberId(),
      ) ||
      data.reactions.some(
        (item) =>
          pages.some((entry) => entry.id === item.pageId) &&
          resolveMember(item.memberId) !== this.getCurrentMemberId(),
      )
    ) {
      this.setStatus({
        message:
          '복원할 가족 계정이 없거나 다른 가족의 댓글·하트가 있어요. 본인 계정 자료만 복원할 수 있어요.',
      });
      return;
    }
    for (const entry of pages) mutations.push({ kind: 'entry', entry });
    for (const comment of data.comments.filter((item) =>
      pages.some((entry) => entry.id === item.pageId),
    )) {
      mutations.push({
        kind: 'upsert',
        table: 'comments',
        row: toRow({ ...comment, authorId: this.getCurrentMemberId() }),
      });
    }
    for (const reaction of data.reactions.filter((item) =>
      pages.some((entry) => entry.id === item.pageId),
    )) {
      mutations.push({
        kind: 'upsert',
        table: 'reactions',
        row: toRow({ ...reaction, memberId: this.getCurrentMemberId() }),
      });
    }
    this.enqueue(mutations);
  }

  dispose(): void {
    this.disposed = true;
    clearTimeout(this.retryTimer);
    clearInterval(this.membershipTimer);
    this.generation++;
    this.authSubscription.unsubscribe();
    window.removeEventListener('online', this.retry);
    if (this.channel) void this.client.removeChannel(this.channel);
    this.listeners.clear();
  }
}
