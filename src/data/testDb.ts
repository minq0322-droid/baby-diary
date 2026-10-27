import { mergeDoc, type ArtifactConfig } from './artifactStore';
import { seedChildren, seedMembers, seedTags } from './seed';
import type { Page } from './types';
type Body = Record<string, unknown>;
export const config = (): ArtifactConfig => ({
  children: Object.fromEntries(seedChildren.map((child) => [child.id, child])),
  tags: Object.fromEntries(seedTags.map((tag) => [tag.id, tag])),
  members: { dad: seedMembers[0], mom: seedMembers[1] },
  memberByUser: { viewer: 'dad' },
});
export const page = (date = '2026-10-26', childId = 'kid1'): Page => ({
  id: date + '__' + childId + '__dad',
  date,
  childId,
  color: '#F4B9B8',
  drawing: [],
  photos: [],
  authorId: 'dad',
  text: '오늘 기록',
  tagIds: [],
  createdAt: '2026-10-26T03:00:00Z',
  updatedAt: '2026-10-26T03:00:00Z',
});
/** Just the contract surface the store uses; snapshots are copied, never mutable DB state. */
export class FakeDb {
  bodies = new Map<string, Body>();
  writes: { path: string; kind: string; patch: Body }[] = [];
  subscriptions = 0;
  failNext = false;
  failureCode = 'invalid_argument';
  failPaths = new Map<string, string>();
  private active = new Set<string>();
  private listeners = new Set<() => void>();

  constructor(seeded = true) {
    if (seeded) this.bodies.set('meta/config', config());
  }
  private snapshot(path: string): DocumentSnapshot {
    const body = this.bodies.get(path);
    return {
      id: path.split('/').at(-1)!,
      exists: Boolean(body),
      data: () => body && structuredClone(body),
      metadata: { fromCache: false, hasPendingWrites: false },
    };
  }
  private listen(callback: () => void): Unsubscribe {
    this.subscriptions++;
    this.listeners.add(callback);
    callback();
    return () => this.listeners.delete(callback);
  }
  publish(): void {
    this.listeners.forEach((listener) => listener());
  }
  doc(path: string): DocumentReference {
    const write = async (kind: 'set' | 'update', patch: Body) => {
      if (this.active.has(path)) throw new Error('Overlapping writes');
      this.active.add(path);
      try {
        await Promise.resolve();
        const code = this.failPaths.get(path);
        if (code) throw { code, message: 'rejected' };
        if (this.failNext) {
          this.failNext = false;
          throw { code: this.failureCode, message: 'offline' };
        }
        if (kind === 'update' && !this.bodies.has(path))
          throw new Error('Missing doc');
        this.writes.push({ path, kind, patch });
        this.bodies.set(
          path,
          kind === 'set'
            ? structuredClone(patch)
            : mergeDoc(this.bodies.get(path)!, patch),
        );
        this.publish();
      } finally {
        this.active.delete(path);
      }
    };
    return {
      id: path.split('/').at(-1)!,
      path,
      get: async () => this.snapshot(path),
      set: (patch) => write('set', patch),
      update: (patch) => write('update', patch),
      onSnapshot: (next) => this.listen(() => next(this.snapshot(path))),
    } as DocumentReference;
  }
  collection(path: string): CollectionReference {
    return {
      get: async () => {
        const docs = [...this.bodies.keys()]
          .filter((key) => key.startsWith(path + '/'))
          .map((key) => this.snapshot(key));
        return {
          docs,
          size: docs.length,
          empty: !docs.length,
          docChanges: () => [],
          metadata: { fromCache: false, hasPendingWrites: false },
        };
      },
      onSnapshot: (next: (snapshot: QuerySnapshot) => void) =>
        this.listen(() => {
          const docs = [...this.bodies.keys()]
            .filter((key) => key.startsWith(`${path}/`))
            .map((key) => this.snapshot(key));
          next({
            docs,
            size: docs.length,
            empty: !docs.length,
            docChanges: () => [],
            metadata: { fromCache: false, hasPendingWrites: false },
          });
        }),
    } as unknown as CollectionReference;
  }
}

// Drain the store's promise queues, without timers or platform dependencies.
export async function settle(): Promise<void> {
  for (let index = 0; index < 100; index++) await Promise.resolve();
}
