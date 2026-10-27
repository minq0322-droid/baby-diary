export type ProfilePhoto = { id: string; src: string; createdAt: string };
export type SyncState = 'ok' | 'saving' | 'retrying' | 'error';
export type Child = {
  id: string;
  name: string;
  nickname?: string;
  birthDate?: string;
  dueDate?: string;
  status?: 'born' | 'expecting';
  color: 'kid1' | 'kid2';
  pageColor: string;
  sortOrder: number;
  photo?: ProfilePhoto;
  photoHistory: ProfilePhoto[];
};

export type Member = {
  // Writer identity is dad/mom in every backend; Auth device IDs stay separate.
  id: string;
  displayName: string;
  color: 'dad' | 'mom';
  fontAssetId?: string;
  role?: 'writer' | 'reader';
};

export type TagTone =
  | 'vax'
  | 'fever'
  | 'hosp'
  | 'first'
  | 'growth'
  | 'food'
  | 'sleep'
  | 'med'
  | 'prenatal';
export type Tag = {
  id: string;
  label: string;
  emoji: string;
  tone: TagTone;
  sortOrder: number;
  preset: boolean;
  hidden?: boolean;
};

export type Stroke = {
  color: string;
  width: 2 | 5 | 14;
  /** Normalized x/y pairs, rounded to three decimals. */
  points: number[];
};

export type Photo = {
  id: string;
  src: string;
  x: number;
  y: number;
  w: number;
  rotation: number;
};

export type Note = {
  id: string;
  authorId: 'dad' | 'mom';
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type Page = {
  id: string;
  childId: string;
  date: string;
  authorId: 'dad' | 'mom';
  color?: string;
  drawing: Stroke[];
  photos: Photo[];
  text: string;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type PageSummary = Pick<
  Page,
  'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
> & {
  firstLine: string;
  hasDrawing: boolean;
  photoCount: number;
  deletedAt?: string | null;
};

export type PageRange = { startDate?: string; endDate?: string };
export type Comment = {
  id: string;
  pageId: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};
export type Reaction = { pageId: string; memberId: string; emoji: '❤️' };
export type StoreSnapshot = {
  children: Child[];
  members: Member[];
  tags: Tag[];
  pages: Page[];
  comments: Comment[];
  reactions: Reaction[];
};
