import { normalizePageColor } from '../lib/pageColors';
import { todayKey } from '../lib/date';
import { LegacyAdapter } from './legacyAdapter';
import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
import { preparePage } from '../lib/stroke';
import { downscalePhoto, blobToDataUrl } from '../lib/image';
import type { DataStore } from './DataStore';
import { LocalStore } from './localStore';
import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
import type {
  Child,
  Comment,
  Page,
  PageRange,
  PageSummary,
  Member,
  Reaction,
  StoreSnapshot,
  SyncState,
  Tag,
} from './types';
export type ArtifactConfig = {
  children: Record<string, Child>;
  tags: Record<string, Tag>;
  members: { dad: Member; mom: Member };
  memberByUser: Record<string, 'dad' | 'mom'>;
};
type Body = Record<string, unknown>;
type Write = { path: string; patch: Body };
export type MonthDoc = {
  authorPagesV3?: boolean;
  pages: Record<string, PageSummary>;
  comments: Record<string, Comment & { deletedAt?: string | null }>;
  reactions: Record<string, Reaction & { on: boolean }>;
};
const emptyMonth = (): MonthDoc => ({ pages: {}, comments: {}, reactions: {} });
export function mergeDoc(base: Body, patch: Body): Body {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    next[key] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? mergeDoc((base[key] as Body) ?? {}, value as Body)
        : value;
  }
  return next;
}
function summarize(page: Page): PageSummary {
  return {
    id: page.id,
    date: page.date,
    childId: page.childId,
    authorId: page.authorId,
    color: page.color,
    firstLine: page.text.split('\n')[0].slice(0, 120),
    tagIds: page.tagIds,
    hasDrawing: page.drawing.length > 0,
    photoCount: page.photos.length,
    updatedAt: page.updatedAt,
    deletedAt: null,
  };
}
/** Summary projections serve old list screens. Editors and exports always load full pages. */
export function buildArtifactSnapshot(
  config: ArtifactConfig | null,
  months: Record<string, MonthDoc>,
  cache = new Map<string, Page>(),
): StoreSnapshot {
  const summaries = Object.values(months)
    .flatMap((doc) => Object.values(doc.pages ?? {}))
    .filter((page) => !page.deletedAt);
  const ids = new Set(summaries.map((page) => page.id));
  return {
    children: Object.values(config?.children ?? {})
      .map((child) => ({
        ...child,
        status: child.status ?? defaultChildStatus(child),
        photoHistory: child.photoHistory ?? [],
        pageColor: normalizePageColor(
          child.pageColor ?? defaultPageColor(child),
        ),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    members: Object.values(config?.members ?? {}),
    tags: Object.values(config?.tags ?? {})
      .filter(Boolean)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    pages: summaries.map((summary) =>
      cache.has(summary.id)
        ? {
            ...cache.get(summary.id)!,
            color: cache.get(summary.id)!.color || undefined,
          }
        : {
            id: summary.id,
            date: summary.date,
            childId: summary.childId,
            authorId: summary.authorId,
            color: summary.color || undefined,
            text: summary.firstLine,
            tagIds: summary.tagIds,
            drawing: [],
            photos: [],
            createdAt: summary.updatedAt,
            updatedAt: summary.updatedAt,
          },
    ),
    comments: Object.values(months)
      .flatMap((doc) => Object.values(doc.comments ?? {}))
      .filter((item) => !item.deletedAt && ids.has(item.pageId))
      .map(({ deletedAt: _, ...comment }) => comment),
    reactions: Object.values(months)
      .flatMap((doc) => Object.values(doc.reactions ?? {}))
      .filter((item) => item.on && ids.has(item.pageId))
      .map(({ pageId, memberId, emoji }) => ({ pageId, memberId, emoji })),
  };
}
export class ArtifactStore extends LegacyAdapter implements DataStore {
  readonly viewerMapping = true;
  private config: ArtifactConfig | null = null;
  private viewConfig: ArtifactConfig | null = null;
  private months: Record<string, MonthDoc> = {};
  private cache = new Map<string, Page>();
  private loading = new Map<string, Promise<Page>>();
  private pending: Write[] = [];
  private listeners = new Set<() => void>();
  private stops: Unsubscribe[] = [];
  private snapshot = buildArtifactSnapshot(null, {});
  private canWrite: boolean;
  private flushing = false;
  private disposed = false;
  private indexLoaded = false;
  private timer?: ReturnType<typeof setTimeout>;
  private attempts = 0;
  syncState: SyncState = 'ok';
  errorMessage = '';
  static async create(
    claude: Claude | undefined = window.claude,
  ): Promise<DataStore> {
    if (!claude) return new LocalStore();
    const [db, user, assets] = await Promise.all([
      claude.use('db'),
      claude.use('user'),
      claude.use('assets'),
    ]);
    if (!db || !user) return new LocalStore();
    const [uid, allowed] = await Promise.all([
      user.id(),
      user.can('data.write'),
    ]);
    return new ArtifactStore(db, uid, allowed !== false, assets);
  }
  constructor(
    private db: DB,
    private uid: string | null,
    allowed = true,
    private assets: Claude.Assets | null = null,
  ) {
    super();
    this.canWrite = allowed && Boolean(uid);
    const error = (error: DbError) => this.fail(error);
    this.stops.push(
      db.doc('meta/config').onSnapshot((snap) => {
        if (snap.metadata.hasPendingWrites) return;
        this.config = snap.exists ? (snap.data() as ArtifactConfig) : null;
        this.emit();
        this.migrateMonths();
      }, error),
    );
    this.stops.push(
      db.collection('index').onSnapshot((snap) => {
        if (snap.metadata.hasPendingWrites) return;
        this.indexLoaded = true;
        this.months = Object.fromEntries(
          snap.docs.map((doc) => [doc.id, doc.data() as MonthDoc]),
        );
        for (const doc of Object.values(this.months))
          for (const summary of Object.values(doc.pages ?? {})) {
            if (this.cache.get(summary.id)?.updatedAt !== summary.updatedAt)
              this.cache.delete(summary.id);
          }
        this.emit();
        this.migrateMonths();
        for (const page of Object.values(
          this.months[todayKey().slice(0, 7)]?.pages ?? {},
        )) {
          if (!page.deletedAt)
            void this.loadPage(page.id).catch((error) => this.fail(error));
        }
      }, error),
    );
    void this.readLegacy().catch(error);
  }
  private legacyMonths: Record<string, Body> = {};
  private legacyLoaded = false;
  private legacyRequest?: Promise<void>;
  private readLegacy(): Promise<void> {
    if (this.legacyLoaded) return Promise.resolve();
    if (this.legacyRequest) return this.legacyRequest;
    this.legacyRequest = this.db
      .collection('months')
      .get()
      .then((snap) => {
        this.legacyMonths = Object.fromEntries(
          snap.docs
            .filter((doc) => !this.months[doc.id]?.authorPagesV3)
            .map((doc) => [doc.id, doc.data() as Body]),
        );
        this.legacyLoaded = true;
        this.emit();
        this.migrateMonths();
      })
      .finally(() => {
        this.legacyRequest = undefined;
      });
    return this.legacyRequest;
  }
  private convertMonth(doc: Body): StoreSnapshot {
    return migrateMonthSnapshot(
      {
        children: Object.values(this.config?.children ?? {}),
        members: Object.values(this.config?.members ?? {}),
        tags: Object.values(this.config?.tags ?? {}).filter(Boolean),
      },
      doc,
    );
  }
  private migrating = new Set<string>();
  private migrateMonths(): void {
    if (this.readOnly || !this.config || !this.indexLoaded) return;
    for (const [month, doc] of Object.entries(this.legacyMonths)) {
      if (this.months[month]?.authorPagesV3 || this.migrating.has(month))
        continue;
      this.migrating.add(month);
      void this.migrateMonth(month, doc).catch((error) => {
        this.migrating.delete(month);
        this.fail(error);
      });
    }
  }
  private async migrateMonth(month: string, doc: Body): Promise<void> {
    const converted = this.convertMonth(doc);
    const writes: Write[] = [];
    for (const page of converted.pages) {
      const destination = await this.db.doc('pages/' + page.id).get();
      if (!destination.exists)
        writes.push(...this.pageWrites(await this.externalize(page)));
      else if (!this.months[month]?.pages[page.id])
        writes.push(
          this.monthWrite(
            month,
            'pages',
            page.id,
            summarize(destination.data() as Page),
          ),
        );
    }
    for (const comment of converted.comments) {
      if (!this.months[month]?.comments[comment.id])
        writes.push(
          this.monthWrite(month, 'comments', comment.id, {
            ...comment,
            deletedAt: null,
          }),
        );
    }
    for (const reaction of converted.reactions) {
      const id = reaction.pageId + '__' + reaction.memberId;
      if (!this.months[month]?.reactions[id])
        writes.push(
          this.monthWrite(month, 'reactions', id, { ...reaction, on: true }),
        );
    }
    // This marker is reached only after all new docs have been confirmed. Never delete the source.
    writes.push({ path: 'index/' + month, patch: { authorPagesV3: true } });
    this.write(writes);
  }
  dispose(): void {
    this.disposed = true;
    clearTimeout(this.timer);
    this.stops.forEach((stop) => stop());
    this.listeners.clear();
  }
  get readOnly(): boolean {
    return !this.canWrite;
  }
  get canSwitchMember(): boolean {
    return this.canWrite;
  }
  get preparing(): boolean {
    return !this.viewConfig || !this.indexLoaded || !this.legacyLoaded;
  }
  get needsMember(): boolean {
    return !this.readOnly && !this.preparing && !this.getCurrentMemberId();
  }
  getSnapshot = (): StoreSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private emit(): void {
    let config = this.config;
    const months = { ...this.months };
    const cache = new Map(this.cache);
    for (const { path, patch } of this.pending) {
      if (path === 'meta/config')
        config = mergeDoc(
          (config as unknown as Body) ?? {},
          patch,
        ) as ArtifactConfig;
      else if (path.startsWith('index/')) {
        const month = path.slice(6);
        months[month] = mergeDoc(
          (months[month] ?? emptyMonth()) as unknown as Body,
          patch,
        ) as MonthDoc;
      } else if (path.startsWith('pages/'))
        cache.set(path.slice(6), patch as unknown as Page);
    }
    this.viewConfig = config;
    this.snapshot = buildArtifactSnapshot(config, months, cache);
    // Read access remains available while migration is pending or only a reader is present.
    for (const [month, doc] of Object.entries(this.legacyMonths)) {
      if (months[month]?.authorPagesV3) continue;
      const legacy = this.convertMonth(doc);
      const known = new Set(this.snapshot.pages.map((page) => page.id));
      this.snapshot.pages.push(
        ...legacy.pages.filter(
          (page) =>
            !known.has(page.id) && !months[month]?.pages[page.id]?.deletedAt,
        ),
      );
      this.snapshot.comments.push(
        ...legacy.comments.filter(
          (comment) =>
            !this.snapshot.comments.some((item) => item.id === comment.id) &&
            !months[month]?.comments[comment.id]?.deletedAt,
        ),
      );
      this.snapshot.reactions.push(
        ...legacy.reactions.filter(
          (reaction) =>
            !this.snapshot.reactions.some(
              (item) =>
                item.pageId === reaction.pageId &&
                item.memberId === reaction.memberId,
            ) &&
            months[month]?.reactions[reaction.pageId + '__' + reaction.memberId]
              ?.on !== false,
        ),
      );
    }
    this.listeners.forEach((listener) => listener());
  }
  private write(writes: Write[]): void {
    if (this.readOnly || !this.viewConfig || !writes.length) return;
    this.pending.push(
      ...(JSON.parse(
        JSON.stringify(writes, (_, value: unknown) =>
          value === undefined ? null : value,
        ),
      ) as Write[]),
    );
    this.emit();
    if (!this.timer) void this.flush();
  }
  private fail(error: unknown): void {
    const reason = error as { code?: string; message?: string };
    if (reason.code === 'revoked' || reason.code === 'not_granted')
      this.canWrite = false;
    this.syncState = this.readOnly ? 'error' : 'retrying';
    this.errorMessage =
      '저장하지 못했어요. ' +
      (reason.message || reason.code || '연결을 확인해 주세요.') +
      ' 변경 내용은 유지하고 다시 시도해요.';
    if (!this.readOnly && !this.timer && !this.disposed)
      this.timer = setTimeout(
        () => {
          this.timer = undefined;
          if (!this.legacyLoaded)
            void this.readLegacy().catch((error) => this.fail(error));
          this.migrateMonths();
          void this.flush();
        },
        Math.min(1000 * 2 ** this.attempts++, 30000),
      );
    this.emit();
  }
  private async flush(): Promise<void> {
    if (this.flushing || this.readOnly || this.disposed) return;
    this.flushing = true;
    this.syncState = 'saving';
    this.emit();
    const blockedPaths = new Set<string>();
    try {
      while (this.pending.length && !this.disposed) {
        // A failed page must not block independent settings or other months.
        // Keep order within each document, and publish summaries only after bodies.
        const write = this.pending.find((candidate, index) => {
          if (
            blockedPaths.has(candidate.path) ||
            this.pending
              .slice(0, index)
              .some((item) => item.path === candidate.path)
          )
            return false;
          if (candidate.path.startsWith('index/')) {
            const month = candidate.path.slice(6);
            if (
              this.pending.some((item) =>
                item.path.startsWith('pages/' + month),
              )
            )
              return false;
          }
          return true;
        });
        if (!write || this.readOnly) break;
        try {
          const ref = this.db.doc(write.path);
          if (write.path.startsWith('pages/')) await ref.set(write.patch);
          else if ((await ref.get()).exists) await ref.update(write.patch);
          else await ref.set(write.patch);
        } catch (error) {
          blockedPaths.add(write.path);
          this.fail(error);
          continue;
        }
        if (write.path === 'meta/config')
          this.config = mergeDoc(
            (this.config as unknown as Body) ?? {},
            write.patch,
          ) as ArtifactConfig;
        else if (write.path.startsWith('index/')) {
          const month = write.path.slice(6);
          this.months[month] = mergeDoc(
            (this.months[month] ?? emptyMonth()) as unknown as Body,
            write.patch,
          ) as MonthDoc;
        } else if (write.path.startsWith('pages/'))
          this.cache.set(write.path.slice(6), write.patch as unknown as Page);
        this.pending = this.pending.filter((item) => item !== write);
        this.emit();
      }
      if (
        !this.pending.length &&
        this.legacyLoaded &&
        Object.keys(this.legacyMonths).every(
          (month) => this.months[month]?.authorPagesV3,
        )
      ) {
        this.attempts = 0;
        this.syncState = 'ok';
        this.errorMessage = '';
      }
    } catch (error) {
      this.fail(error);
    } finally {
      this.flushing = false;
      this.emit();
    }
  }
  retry(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (!this.legacyLoaded)
      void this.readLegacy().catch((error) => this.fail(error));
    this.migrateMonths();
    void this.flush();
  }
  async loadPage(id: string): Promise<Page> {
    const optimistic = this.pending
      .filter((write) => write.path === 'pages/' + id)
      .slice(-1)[0];
    if (optimistic) return optimistic.patch as unknown as Page;
    const cached = this.cache.get(id);
    if (cached) return cached;
    if (!this.months[id.slice(0, 7)]?.pages[id]) {
      const legacy = this.snapshot.pages.find((page) => page.id === id);
      if (legacy) return legacy;
    }
    const existing = this.loading.get(id);
    if (existing) return existing;
    const request = this.db
      .doc('pages/' + id)
      .get()
      .then((snap) => {
        if (!snap.exists) throw new Error('페이지를 찾을 수 없어요.');
        const page = snap.data() as Page;
        this.cache.set(id, { ...page, color: page.color || undefined });
        this.emit();
        return this.cache.get(id)!;
      })
      .finally(() => this.loading.delete(id));
    this.loading.set(id, request);
    return request;
  }
  async loadAllPages(): Promise<void> {
    await Promise.all(
      this.snapshot.pages.map((page) => this.loadPage(page.id)),
    );
  }
  private monthWrite(
    month: string,
    field: keyof MonthDoc,
    id: string,
    value: object,
  ): Write {
    return { path: `index/${month}`, patch: { [field]: { [id]: value } } };
  }
  private pageMonth(pageId: string): string | undefined {
    return this.snapshot.pages
      .find((entry) => entry.id === pageId)
      ?.date.slice(0, 7);
  }
  private meta(field: string, id: string, value: unknown): void {
    this.write([{ path: 'meta/config', patch: { [field]: { [id]: value } } }]);
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
    authorId = this.getCurrentMemberId() || 'dad',
  ): Page | undefined {
    const id = date + '__' + childId + '__' + authorId;
    if (
      this.cache.has(id) ||
      this.pending.some((write) => write.path === 'pages/' + id)
    ) {
      return this.snapshot.pages.find((page) => page.id === id);
    }
    if (!this.months[date.slice(0, 7)]?.pages[id])
      return this.snapshot.pages.find((page) => page.id === id);
    return undefined;
  }
  listComments(pageId?: string): Comment[] {
    if (pageId) pageId = this.pageId(pageId);
    return this.snapshot.comments.filter(
      (comment) => !pageId || comment.pageId === pageId,
    );
  }
  listReactions(pageId?: string): Reaction[] {
    if (pageId) pageId = this.pageId(pageId);
    return this.snapshot.reactions.filter(
      (reaction) => !pageId || reaction.pageId === pageId,
    );
  }
  savePage(page: Page): void {
    const value = preparePage(page);
    const existing = this.cache.get(value.id);
    if (existing && existing.authorId !== value.authorId)
      throw new Error('작성자는 바꿀 수 없어요.');
    if (value.photos.some((photo) => photo.src.startsWith('data:'))) {
      throw new Error('사진을 먼저 업로드한 뒤 저장해 주세요.');
    }
    this.queuePage(value);
  }
  private queuePage(value: Page): void {
    this.write(this.pageWrites(value));
  }
  private pageWrites(value: Page): Write[] {
    return [
      { path: 'pages/' + value.id, patch: value as unknown as Body },
      this.monthWrite(
        value.date.slice(0, 7),
        'pages',
        value.id,
        summarize(value),
      ),
    ];
  }
  private async externalize(page: Page): Promise<Page> {
    const photos = [];
    for (const photo of page.photos) {
      if (!photo.src.startsWith('data:')) {
        photos.push(photo);
        continue;
      }
      const blob = await (await fetch(photo.src)).blob();
      photos.push({ ...photo, src: (await this.uploadPhoto(blob)).src });
    }
    return preparePage({ ...page, photos });
  }
  deletePage(id: string): void {
    const entry = this.snapshot.pages.find((item) => item.id === id);
    if (!entry) return;
    const month = entry.date.slice(0, 7);
    const deletedAt = new Date().toISOString();
    this.write([
      this.monthWrite(month, 'pages', id, { ...summarize(entry), deletedAt }),
      ...this.listComments(id).map((comment) =>
        this.monthWrite(month, 'comments', comment.id, {
          ...comment,
          deletedAt,
        }),
      ),
      ...this.listReactions(id).map((reaction) =>
        this.monthWrite(month, 'reactions', `${id}__${reaction.memberId}`, {
          ...reaction,
          on: false,
        }),
      ),
    ]);
  }
  createComment(comment: Comment): void {
    comment = { ...comment, pageId: this.pageId(comment.pageId) };
    this.updateComment(comment);
  }
  updateComment(comment: Comment): void {
    const month = this.pageMonth(comment.pageId);
    if (month)
      this.write([
        this.monthWrite(month, 'comments', comment.id, {
          ...comment,
          deletedAt: null,
        }),
      ]);
  }
  deleteComment(id: string): void {
    const comment = this.snapshot.comments.find((item) => item.id === id);
    const month = comment && this.pageMonth(comment.pageId);
    if (comment && month)
      this.write([
        this.monthWrite(month, 'comments', id, {
          ...comment,
          deletedAt: new Date().toISOString(),
        }),
      ]);
  }
  toggleReaction(pageId: string, memberId = this.getCurrentMemberId()): void {
    pageId = this.pageId(pageId);
    const month = this.pageMonth(pageId);
    const on = !this.listReactions(pageId).some(
      (reaction) => reaction.memberId === memberId,
    );
    if (month)
      this.write([
        this.monthWrite(month, 'reactions', `${pageId}__${memberId}`, {
          pageId,
          memberId,
          emoji: '❤️',
          on,
        }),
      ]);
  }
  async uploadPhoto(blob: Blob): Promise<{ src: string }> {
    if (this.readOnly || !this.viewConfig)
      throw new Error('기록을 저장할 권한을 확인해 주세요.');
    if (!this.assets)
      throw new Error('사진 저장 기능을 사용할 수 없어요. 다시 열어 주세요.');
    const asset = await this.assets.upload(await downscalePhoto(blob));
    return { src: asset.id ? '/_blob/' + asset.id : asset.url };
  }
  protected async removePhotoAsset(src: string): Promise<void> {
    if (this.syncState === 'saving') {
      await new Promise<void>((resolve, reject) => {
        const stop = this.subscribe(() => {
          if (this.syncState === 'saving') return;
          stop();
          if (this.syncState === 'ok') resolve();
          else
            reject(
              new Error('사진 목록을 저장하지 못해 사진 파일은 유지했어요.'),
            );
        });
      });
    }
    if (this.syncState !== 'ok')
      throw new Error('사진 목록을 저장한 뒤 다시 삭제해 주세요.');
    if (this.assets) await this.assets.delete(src);
  }
  setAllPageColors(color: string, childId?: string): void {
    void this.loadAllPages()
      .then(() => {
        for (const page of this.snapshot.pages) {
          if (!childId || page.childId === childId)
            this.savePage({
              ...page,
              color,
              updatedAt: new Date().toISOString(),
            });
        }
        for (const child of this.snapshot.children) {
          if (!childId || child.id === childId)
            this.updateChild({ ...child, pageColor: color });
        }
      })
      .catch((error) => this.fail(error));
  }
  deleteTag(id: string): void {
    this.meta('tags', id, null);
    void this.loadAllPages()
      .then(() => {
        for (const page of this.snapshot.pages.filter((page) =>
          page.tagIds.includes(id),
        )) {
          this.savePage({
            ...page,
            tagIds: page.tagIds.filter((tag) => tag !== id),
          });
        }
      })
      .catch((error) => this.fail(error));
  }
  updateChild(child: Child): void {
    this.meta('children', child.id, child);
  }
  updateMember(member: Member): void {
    this.meta('members', member.id, {
      ...member,
      fontAssetId: member.fontAssetId ?? null,
    });
  }
  async uploadFont(blob: Blob): Promise<{ src: string }> {
    if (this.readOnly || !this.viewConfig)
      throw new Error('기록을 저장할 권한을 확인해 주세요.');
    return {
      src: this.assets
        ? (await this.assets.upload(blob)).url
        : await blobToDataUrl(blob),
    };
  }
  createTag(tag: Tag): void {
    this.updateTag(tag);
  }
  updateTag(tag: Tag): void {
    this.meta('tags', tag.id, tag);
  }
  reorderTags(ids: string[]): void {
    ids.forEach((id, sortOrder) => {
      const tag = this.snapshot.tags.find((item) => item.id === id);
      if (tag) this.updateTag({ ...tag, sortOrder });
    });
  }
  getCurrentMemberId(): string {
    return this.uid ? (this.viewConfig?.memberByUser?.[this.uid] ?? '') : '';
  }
  setCurrentMemberId(id: string): void {
    if (this.uid && (id === 'dad' || id === 'mom'))
      this.meta('memberByUser', this.uid, id);
  }
  exportAll(): StoreSnapshot {
    if (
      this.snapshot.pages.some(
        (page) => !this.getPage(page.date, page.childId, page.authorId),
      )
    )
      throw new Error('페이지를 불러온 뒤 백업해 주세요.');
    return structuredClone(this.snapshot);
  }
  importAll(data: StoreSnapshot): void | Promise<void> {
    if (hasInlinePhotos(data)) {
      return externalizeSnapshot(data, (blob) => this.uploadPhoto(blob)).then(
        (converted) => this.importAll(converted),
      );
    }
    const writes: Write[] = [];
    for (const field of ['children', 'tags', 'members'] as const) {
      for (const value of data[field]) {
        if (!this.snapshot[field].some((item) => item.id === value.id)) {
          writes.push({
            path: 'meta/config',
            patch: { [field]: { [value.id]: value } },
          });
        }
      }
    }
    const pages = data.pages
      .filter(
        (entry) => !this.snapshot.pages.some((item) => item.id === entry.id),
      )
      .map(preparePage);
    for (const entry of pages) {
      const month = entry.date.slice(0, 7);
      writes.push(...this.pageWrites(entry));
      for (const comment of data.comments.filter(
        (item) => item.pageId === entry.id,
      )) {
        writes.push(
          this.monthWrite(month, 'comments', comment.id, {
            ...comment,
            deletedAt: null,
          }),
        );
      }
      for (const reaction of data.reactions.filter(
        (item) => item.pageId === entry.id,
      )) {
        writes.push(
          this.monthWrite(
            month,
            'reactions',
            `${entry.id}__${reaction.memberId}`,
            { ...reaction, on: true },
          ),
        );
      }
    }
    this.write(writes);
  }
}
