import type { DataStore } from './DataStore';
import type { Child, Page, StoreSnapshot } from './types';
import { noteAuthor } from './migrate';

export type LegacyEntry = {
  id: string;
  childId: string;
  date: string;
  content: string;
  tagIds: string[];
  authorId: string;
  createdAt: string;
  updatedAt: string;
};
export function projectEntries(data: StoreSnapshot): LegacyEntry[] {
  return data.pages.map((page) => ({
    id: page.id,
    childId: page.childId,
    date: page.date,
    content: page.text,
    authorId:
      data.members.find((member) => member.color === page.authorId)?.id ??
      page.authorId,
    tagIds: page.tagIds,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  }));
}
/** Small compatibility bridge until the UI phases are replaced. */
export abstract class LegacyAdapter {
  abstract getSnapshot(): StoreSnapshot;
  abstract savePage(page: Page): void;
  abstract deletePage(id: string): void;
  abstract updateChild(child: Child): void;
  abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
  protected async removePhotoAsset(_src: string): Promise<void> {}
  async loadPage(id: string): Promise<Page> {
    const page = this.getSnapshot().pages.find((item) => item.id === id);
    if (!page) throw new Error('페이지를 찾을 수 없어요.');
    return page;
  }
  async loadAllPages(): Promise<void> {}
  async setChildPhoto(childId: string, blob: Blob): Promise<void> {
    const uploaded = await this.uploadPhoto(blob);
    const child = this.getSnapshot().children.find(
      (item) => item.id === childId,
    );
    if (!child) throw new Error('아이를 찾을 수 없어요.');
    this.updateChild({
      ...child,
      photo: {
        id: crypto.randomUUID(),
        src: uploaded.src,
        createdAt: new Date().toISOString(),
      },
      photoHistory: [
        ...(child.photoHistory ?? []),
        ...(child.photo ? [child.photo] : []),
      ],
    });
  }
  useHistoryPhoto(childId: string, photoId: string): void {
    const child = this.getSnapshot().children.find(
      (item) => item.id === childId,
    );
    const photo = child?.photoHistory.find((item) => item.id === photoId);
    if (!child || !photo) return;
    this.updateChild({
      ...child,
      photo,
      photoHistory: [
        ...child.photoHistory.filter((item) => item.id !== photoId),
        ...(child.photo ? [child.photo] : []),
      ],
    });
  }
  async deleteHistoryPhoto(childId: string, photoId: string): Promise<void> {
    const child = this.getSnapshot().children.find(
      (item) => item.id === childId,
    );
    const photo = child?.photoHistory.find((item) => item.id === photoId);
    if (!child || !photo) return;
    this.updateChild({
      ...child,
      photoHistory: child.photoHistory.filter((item) => item.id !== photoId),
    });
    const referenced =
      this.getSnapshot().children.some(
        (item) =>
          item.photo?.src === photo.src ||
          item.photoHistory.some((p) => p.src === photo.src),
      ) ||
      this.getSnapshot().pages.some((page) =>
        page.photos.some((item) => item.src === photo.src),
      );
    if (!referenced) await this.removePhotoAsset(photo.src);
  }
  listEntries(startDate?: string, endDate?: string): LegacyEntry[] {
    return projectEntries(this.getSnapshot()).filter(
      (item) =>
        (!startDate || item.date >= startDate) &&
        (!endDate || item.date <= endDate),
    );
  }
  protected pageId(id: string): string {
    return id;
  }
  createEntry(entry: LegacyEntry): void {
    this.updateEntry(entry);
  }
  updateEntry(entry: LegacyEntry): void {
    const data = this.getSnapshot();
    const authorId = noteAuthor(entry.authorId, data.members);
    const id = entry.date + '__' + entry.childId + '__' + authorId;
    const page = data.pages.find((item) => item.id === id);
    this.savePage({
      ...page,
      id,
      date: entry.date,
      childId: entry.childId,
      authorId,
      text: entry.content,
      drawing: page?.drawing ?? [],
      photos: page?.photos ?? [],
      tagIds: entry.tagIds,
      createdAt: page?.createdAt ?? entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  }
  deleteEntry(id: string): void {
    this.deletePage(id);
  }
}
export type LegacyStore = DataStore & LegacyAdapter;
