import { normalizePageColor } from '../lib/pageColors';
import type { LegacyEntry } from './legacyAdapter';
import type {
  Child,
  Comment,
  Member,
  Note,
  Page,
  Reaction,
  StoreSnapshot,
} from './types';

export type OldPage = Omit<Page, 'authorId' | 'text'> & { notes: Note[] };
export type LegacySnapshot = Omit<
  StoreSnapshot,
  'pages' | 'comments' | 'reactions' | 'children'
> & {
  children: (Omit<Child, 'pageColor' | 'photoHistory'> & {
    pageColor?: string;
    photoHistory?: Child['photoHistory'];
  })[];
  entries: LegacyEntry[];
  comments: (Omit<Comment, 'pageId'> & { entryId: string })[];
  reactions: (Omit<Reaction, 'pageId'> & { entryId: string })[];
};
export type OldSnapshot = Omit<StoreSnapshot, 'pages' | 'children'> & {
  pages: (OldPage | Page)[];
  children: LegacySnapshot['children'];
};

/** Merge interrupted v1→v2 sources by note ID before splitting by author. */
export function migrateMonthSnapshot(
  metadata: Pick<StoreSnapshot, 'children' | 'members' | 'tags'>,
  doc: Record<string, unknown>,
): StoreSnapshot {
  const active = <T>(value: unknown): T[] =>
    Object.values(
      (value ?? {}) as Record<string, T & { deletedAt?: string }>,
    ).filter((item) => !item.deletedAt);
  const pages = structuredClone(active<OldPage | Page>(doc.pages));
  for (const entry of active<LegacyEntry>(doc.entries)) {
    let page = pages.find(
      (page) =>
        page.date === entry.date &&
        page.childId === entry.childId &&
        'notes' in page,
    ) as OldPage | undefined;
    if (!page) {
      page = {
        id: entry.date + '__' + entry.childId,
        date: entry.date,
        childId: entry.childId,
        notes: [],
        drawing: [],
        photos: [],
        tagIds: [],
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
      pages.push(page);
    }
    if (!page.notes.some((note) => note.id === entry.id)) {
      page.notes.push({
        id: entry.id,
        authorId: noteAuthor(entry.authorId, metadata.members),
        text: entry.content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
      page.tagIds = [...new Set([...page.tagIds, ...entry.tagIds])];
    }
  }
  const ids = new Map(
    pages.flatMap((page) =>
      'notes' in page
        ? page.notes.map((note) => [note.id, page.id] as const)
        : [],
    ),
  );
  const pageId = (item: { pageId?: string; entryId?: string }) =>
    item.pageId || ids.get(item.entryId ?? '') || '';
  const comments = active<Comment & { entryId?: string }>(doc.comments).map(
    (item) => ({ ...item, pageId: pageId(item) }),
  );
  const reactions = active<Reaction & { entryId?: string; on?: boolean }>(
    doc.reactions,
  )
    .filter((item) => item.on !== false)
    .map((item) => ({ ...item, pageId: pageId(item) }));
  return migrateSnapshot({ ...metadata, pages, comments, reactions });
}
export const defaultPageColor = (child: Pick<Child, 'color'>): string =>
  child.color === 'kid2' ? '#CDEFE2' : '#F4B9B8';

export const defaultChildStatus = (child: Pick<Child, 'id'>): 'born' | 'expecting' =>
  child.id === 'kid2' ? 'expecting' : 'born';

export function noteAuthor(id: string, members: Member[]): 'dad' | 'mom' {
  if (id === 'dad' || id === 'mom') return id;
  const member = members.find((item) => item.id === id);
  if (!member) throw new Error('기록의 작성자를 확인해 주세요.');
  return member.color;
}

/** Pure and deterministic. Sources remain untouched until the caller confirms persistence. */
export function migrateSnapshot(
  data: StoreSnapshot | OldSnapshot | LegacySnapshot,
): StoreSnapshot {
  const children = data.children.map((child) => ({
    ...child,
    status: child.status ?? defaultChildStatus(child),
    photoHistory: child.photoHistory ?? [],
    pageColor: normalizePageColor(child.pageColor ?? defaultPageColor(child)),
  }));
  const sources: (OldPage | Page)[] =
    'pages' in data ? structuredClone(data.pages) : [];
  const aliases = new Map<string, string>();
  if ('entries' in data) {
    const grouped = new Map<string, OldPage>();
    for (const entry of [...data.entries].sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    )) {
      const id = entry.date + '__' + entry.childId;
      const page = grouped.get(id) ?? {
        id,
        date: entry.date,
        childId: entry.childId,
        drawing: [],
        photos: [],
        notes: [],
        tagIds: [],
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
      page.notes.push({
        id: entry.id,
        authorId: noteAuthor(entry.authorId, data.members),
        text: entry.content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
      page.tagIds = [...new Set([...page.tagIds, ...entry.tagIds])];
      if (entry.updatedAt > page.updatedAt) page.updatedAt = entry.updatedAt;
      grouped.set(id, page);
      aliases.set(entry.id, id);
    }
    sources.push(...grouped.values());
  }
  const pages = new Map<string, Page>();
  const owners = new Map<string, string>();
  for (const source of sources) {
    if (!('notes' in source)) {
      const value = {
        ...source,
        color: source.color ? normalizePageColor(source.color) : undefined,
      };
      pages.set(value.id, value);
      owners.set(value.id, value.id);
      continue;
    }
    const notes = [...source.notes].sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
    const owner = notes[0]?.authorId ?? 'dad';
    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
    for (const authorId of [
      ...new Set([owner, ...notes.map((note) => note.authorId)]),
    ]) {
      const id = source.date + '__' + source.childId + '__' + authorId;
      const { notes: _, ...rest } = source;
      const value: Page = {
        ...rest,
        id,
        authorId,
        color: source.color ? normalizePageColor(source.color) : undefined,
        text: notes
          .filter((note) => note.authorId === authorId)
          .map((note) => note.text)
          .join('\n\n'),
        drawing: authorId === owner ? source.drawing : [],
        photos: authorId === owner ? source.photos : [],
        tagIds: authorId === owner ? source.tagIds : [],
      };
      if (!pages.has(id)) pages.set(id, value);
    }
  }
  const target = (item: { pageId: string } | { entryId: string }) => {
    const old = 'pageId' in item ? item.pageId : item.entryId;
    return owners.get(aliases.get(old) ?? old) ?? old;
  };
  const comments = (data.comments ?? []).map((item) => {
    const { ...rest } = item;
    return {
      id: rest.id,
      pageId: target(item),
      content: rest.content,
      authorId: rest.authorId,
      createdAt: rest.createdAt,
      updatedAt: rest.updatedAt,
    };
  });
  const reactions = new Map<string, Reaction>();
  for (const item of data.reactions ?? []) {
    const pageId = target(item);
    reactions.set(pageId + '__' + item.memberId, {
      pageId,
      memberId: item.memberId,
      emoji: item.emoji,
    });
  }
  return {
    children,
    members: data.members,
    tags: data.tags,
    pages: [...pages.values()],
    comments,
    reactions: [...reactions.values()],
  };
}
