import { putPhoto, readPhoto, removePhoto } from './photoAssets';
import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
import { LegacyAdapter } from './legacyAdapter';
import { defaultChildStatus, migrateSnapshot, type LegacySnapshot } from './migrate';
import { preparePage } from '../lib/stroke';
import { downscalePhoto, blobToDataUrl } from '../lib/image';
import type { DataStore } from './DataStore';
import { seedChildren, seedMembers, seedTags } from './seed';
import type {
  Child,
  Comment,
  Member,
  Page,
  PageRange,
  Reaction,
  StoreSnapshot,
  Tag,
} from './types';

const STORAGE_KEY = 'yuga-record-data';
const initial: StoreSnapshot = {
  children: seedChildren.map((child) => ({ ...child, status: child.status ?? defaultChildStatus(child) })),
  members: seedMembers,
  tags: seedTags,
  pages: [],
  comments: [],
  reactions: [],
};

function upsert<T extends { id: string }>(items: T[], value: T): T[] {
  return items.some((item) => item.id === value.id)
    ? items.map((item) => (item.id === value.id ? value : item))
    : [...items, value];
}

export class LocalStore extends LegacyAdapter implements DataStore {
  readonly canSwitchMember = true;
  syncState: import('./types').SyncState = 'ok';
  errorMessage = '';
  private timer?: ReturnType<typeof setTimeout>;
  private attempts = 0;
  private photoMigration?: Promise<void>;
  retry = (): void => {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (hasInlinePhotos(this.snapshot)) {
      if (this.photoMigration) return;
      this.photoMigration = this.migratePhotos();
      void this.photoMigration
        .then(() => {
          this.photoMigration = undefined;
          this.retry();
        })
        .catch((error) => {
          this.photoMigration = undefined;
          this.syncState = 'retrying';
          this.errorMessage =
            '사진을 기기에 옮기지 못했어요. 원본을 유지하고 다시 시도해요. ' +
            (error instanceof Error ? error.message : '');
          this.timer = setTimeout(
            this.retry,
            Math.min(1000 * 2 ** this.attempts++, 30000),
          );
          this.snapshot = { ...this.snapshot };
          this.listeners.forEach((listener) => listener());
        });
      return;
    }
    this.persist();
    this.snapshot = { ...this.snapshot };
    this.listeners.forEach((listener) => listener());
  };
  private listeners = new Set<() => void>();
  private snapshot: StoreSnapshot;
  private currentMember = (() => {
    try {
      return localStorage.getItem('me') || '';
    } catch {
      return '';
    }
  })();

  get needsMember(): boolean {
    return !this.currentMember;
  }

  constructor() {
    super();
    this.snapshot = structuredClone(initial);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as StoreSnapshot | LegacySnapshot;
      this.snapshot = migrateSnapshot({ ...initial, ...parsed });
      if (!hasInlinePhotos(this.snapshot)) {
        this.persist();
        return;
      }
      this.retry();
    } catch {
      // Malformed storage never replaces a valid in-memory snapshot.
    }
  }

  getSnapshot = (): StoreSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private persist(): void {
    if (this.photoMigration) return;
    if (hasInlinePhotos(this.snapshot)) {
      this.retry();
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 3, ...this.snapshot }),
      );
      this.syncState = 'ok';
      this.errorMessage = '';
      this.attempts = 0;
    } catch (error) {
      this.syncState = 'retrying';
      this.errorMessage =
        '기기에 저장하지 못했어요. 변경 내용은 유지하고 다시 시도해요. ' +
        (error instanceof Error ? error.message : '저장 공간을 확인해 주세요.');
      if (!this.timer)
        this.timer = setTimeout(
          this.retry,
          Math.min(1000 * 2 ** this.attempts++, 30000),
        );
    }
  }

  private commit(next: StoreSnapshot): void {
    this.snapshot = next;
    this.persist();
    this.listeners.forEach((listener) => listener());
  }

  listChildren(): Child[] {
    return this.snapshot.children;
  }
  listMembers() {
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
    return this.snapshot.pages.find(
      (page) => page.id === date + '__' + childId + '__' + authorId,
    );
  }

  savePage(page: Page): void {
    if (page.photos.some((photo) => photo.src.startsWith('data:'))) {
      throw new Error('사진을 먼저 업로드한 뒤 저장해 주세요.');
    }
    this.commit({
      ...this.snapshot,
      pages: upsert(this.snapshot.pages, preparePage(page)),
    });
  }

  deletePage(id: string): void {
    this.commit({
      ...this.snapshot,
      pages: this.snapshot.pages.filter((item) => item.id !== id),
      comments: this.snapshot.comments.filter((item) => item.pageId !== id),
      reactions: this.snapshot.reactions.filter((item) => item.pageId !== id),
    });
  }

  setAllPageColors(color: string, childId?: string): void {
    const updatedAt = new Date().toISOString();
    this.commit({
      ...this.snapshot,
      pages: this.snapshot.pages.map((page) =>
        !childId || page.childId === childId
          ? { ...page, color, updatedAt }
          : page,
      ),
      children: this.snapshot.children.map((child) =>
        !childId || child.id === childId
          ? { ...child, pageColor: color }
          : child,
      ),
    });
  }

  async uploadPhoto(blob: Blob): Promise<{ src: string }> {
    return { src: await putPhoto(await downscalePhoto(blob)) };
  }

  async resolvePhotoSrc(src: string): Promise<string> {
    return src.startsWith('idb-photo:')
      ? blobToDataUrl(await readPhoto(src))
      : src;
  }
  protected async removePhotoAsset(src: string): Promise<void> {
    if (this.syncState !== 'ok')
      throw new Error('사진 목록을 저장한 뒤 삭제를 다시 시도해 주세요.');
    await removePhoto(src);
  }
  private async migratePhotos(): Promise<void> {
    const convert = async (src: string) =>
      src.startsWith('data:') ? putPhoto(await (await fetch(src)).blob()) : src;
    for (const page of this.snapshot.pages) {
      if (!page.photos.some((photo) => photo.src.startsWith('data:'))) continue;
      const photos = await Promise.all(
        page.photos.map(async (photo) => ({
          ...photo,
          src: await convert(photo.src),
        })),
      );
      this.snapshot = {
        ...this.snapshot,
        pages: this.snapshot.pages.map((item) =>
          item.id === page.id
            ? {
                ...item,
                photos: item.photos.map(
                  (photo) =>
                    photos.find(
                      (converted) =>
                        converted.id === photo.id &&
                        page.photos.find((old) => old.id === photo.id)?.src ===
                          photo.src,
                    ) ?? photo,
                ),
              }
            : item,
        ),
      };
    }
    for (const child of this.snapshot.children) {
      if (
        !child.photo?.src.startsWith('data:') &&
        !child.photoHistory.some((photo) => photo.src.startsWith('data:'))
      )
        continue;
      const photo = child.photo
        ? { ...child.photo, src: await convert(child.photo.src) }
        : undefined;
      const photoHistory = await Promise.all(
        child.photoHistory.map(async (item) => ({
          ...item,
          src: await convert(item.src),
        })),
      );
      this.snapshot = {
        ...this.snapshot,
        children: this.snapshot.children.map((item) =>
          item.id === child.id
            ? {
                ...item,
                photo: item.photo?.id === child.photo?.id ? photo : item.photo,
                photoHistory: item.photoHistory.map(
                  (old) =>
                    photoHistory.find((converted) => converted.id === old.id) ??
                    old,
                ),
              }
            : item,
        ),
      };
    }
  }
  listComments(pageId?: string): Comment[] {
    if (pageId) pageId = this.pageId(pageId);
    return this.snapshot.comments.filter(
      (item) => !pageId || item.pageId === pageId,
    );
  }

  createComment(comment: Comment): void {
    this.updateComment(comment);
  }
  updateComment(comment: Comment): void {
    const value = { ...comment, pageId: this.pageId(comment.pageId) };
    this.commit({
      ...this.snapshot,
      comments: upsert(this.snapshot.comments, value),
    });
  }

  deleteComment(id: string): void {
    this.commit({
      ...this.snapshot,
      comments: this.snapshot.comments.filter((item) => item.id !== id),
    });
  }

  listReactions(pageId?: string): Reaction[] {
    if (pageId) pageId = this.pageId(pageId);
    return this.snapshot.reactions.filter(
      (item) => !pageId || item.pageId === pageId,
    );
  }

  toggleReaction(pageId: string, memberId = this.getCurrentMemberId()): void {
    pageId = this.pageId(pageId);
    const same = (item: Reaction) =>
      item.pageId === pageId && item.memberId === memberId;
    this.commit({
      ...this.snapshot,
      reactions: this.snapshot.reactions.some(same)
        ? this.snapshot.reactions.filter((item) => !same(item))
        : [...this.snapshot.reactions, { pageId, memberId, emoji: '❤️' }],
    });
  }

  updateChild(child: Child): void {
    this.commit({
      ...this.snapshot,
      children: upsert(this.snapshot.children, child),
    });
  }

  updateMember(member: Member): void {
    this.commit({
      ...this.snapshot,
      members: upsert(this.snapshot.members, member),
    });
  }

  async uploadFont(blob: Blob): Promise<{ src: string }> {
    return { src: await blobToDataUrl(blob) };
  }

  createTag(tag: Tag): void {
    this.updateTag(tag);
  }
  updateTag(tag: Tag): void {
    this.commit({ ...this.snapshot, tags: upsert(this.snapshot.tags, tag) });
  }

  deleteTag(id: string): void {
    this.commit({
      ...this.snapshot,
      tags: this.snapshot.tags.filter((tag) => tag.id !== id),
      pages: this.snapshot.pages.map((page) => ({
        ...page,
        tagIds: page.tagIds.filter((tagId) => tagId !== id),
      })),
    });
  }

  reorderTags(ids: string[]): void {
    const order = [
      ...new Set([...ids, ...this.snapshot.tags.map((tag) => tag.id)]),
    ];
    const tags = order.flatMap((id, sortOrder) => {
      const tag = this.snapshot.tags.find((item) => item.id === id);
      return tag ? [{ ...tag, sortOrder }] : [];
    });
    this.commit({ ...this.snapshot, tags });
  }

  getCurrentMemberId(): string {
    return this.currentMember;
  }

  setCurrentMemberId(id: string): void {
    this.currentMember = id;
    this.snapshot = { ...this.snapshot };
    try {
      localStorage.setItem('me', id);
    } catch {
      /* Storage may be unavailable. */
    }
    this.listeners.forEach((listener) => listener());
  }

  exportAll(): StoreSnapshot {
    return structuredClone(this.snapshot);
  }
  importAll(data: StoreSnapshot): void | Promise<void> {
    if (hasInlinePhotos(data)) {
      return externalizeSnapshot(data, async (blob) => ({
        src: await putPhoto(blob),
      })).then((converted) => this.importAll(converted));
    }
    const existing = new Set(this.snapshot.pages.map((page) => page.id));
    const pages = data.pages
      .filter((page) => !existing.has(page.id))
      .map(preparePage);
    const imported = new Set(pages.map((page) => page.id));
    const comments = data.comments.filter((comment) =>
      imported.has(comment.pageId),
    );
    const reactions = data.reactions.filter((reaction) =>
      imported.has(reaction.pageId),
    );
    const merge = <T extends { id: string }>(old: T[], incoming: T[]): T[] => [
      ...old,
      ...incoming.filter((value) => !old.some((item) => item.id === value.id)),
    ];
    this.commit({
      children: merge(this.snapshot.children, data.children),
      members: merge(this.snapshot.members, data.members),
      tags: merge(this.snapshot.tags, data.tags),
      pages: [...this.snapshot.pages, ...pages],
      comments: merge(this.snapshot.comments, comments),
      reactions: [...this.snapshot.reactions, ...reactions],
    });
  }
}

export const localStore = new LocalStore();
