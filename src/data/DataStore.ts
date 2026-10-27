import { useSyncExternalStore } from 'react';
import { projectEntries, type LegacyEntry } from './legacyAdapter';
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

export interface DataStore {
  readonly syncState: import('./types').SyncState;
  readonly canSwitchMember?: boolean;
  readonly viewerMapping?: boolean;
  readonly readOnly?: boolean;
  readonly needsMember?: boolean;
  readonly preparing?: boolean;
  readonly errorMessage?: string;
  retry?(): void;
  getSnapshot(): StoreSnapshot;
  subscribe(listener: () => void): () => void;
  listChildren(): Child[];
  listMembers(): Member[];
  listTags(): Tag[];
  listPages(range?: PageRange): Page[];
  getPage(
    date: string,
    childId: string,
    authorId?: 'dad' | 'mom',
  ): Page | undefined;
  loadPage(id: string): Promise<Page>;
  loadAllPages(): Promise<void>;
  savePage(page: Page): void;
  deletePage(id: string): void;
  setAllPageColors(color: string, childId?: string): void;
  uploadPhoto(blob: Blob): Promise<{ src: string }>;
  resolvePhotoSrc?(src: string): Promise<string>;
  listComments(pageId?: string): Comment[];
  createComment(comment: Comment): void;
  updateComment(comment: Comment): void;
  deleteComment(id: string): void;
  listReactions(pageId?: string): Reaction[];
  toggleReaction(pageId: string, memberId?: string): void;
  updateChild(child: Child): void;
  setChildPhoto(childId: string, blob: Blob): Promise<void>;
  useHistoryPhoto(childId: string, photoId: string): void;
  deleteHistoryPhoto(childId: string, photoId: string): Promise<void>;
  updateMember(member: Member): void;
  uploadFont(blob: Blob): Promise<{ src: string }>;
  createTag(tag: Tag): void;
  updateTag(tag: Tag): void;
  deleteTag(id: string): void;
  reorderTags(ids: string[]): void;
  getCurrentMemberId(): string;
  setCurrentMemberId(id: string): void;
  exportAll(): StoreSnapshot;
  importAll(data: StoreSnapshot): void | Promise<void>;
}

/** Existing screens consume this projection until phases 10–11. */
export function useStore(
  store: DataStore,
): StoreSnapshot & { entries: LegacyEntry[] } {
  const data = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return { ...data, entries: projectEntries(data) };
}
