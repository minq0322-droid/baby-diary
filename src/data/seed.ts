import type { Child, Member, Tag } from './types';

export const seedChildren: Child[] = [
  { id: 'kid1', name: '조비안', nickname: '조이', color: 'kid1', pageColor: '#F4B9B8', sortOrder: 0, photoHistory: [] },
  { id: 'kid2', name: '또이', nickname: '또이', color: 'kid2', pageColor: '#CDEFE2', sortOrder: 1, photoHistory: [] },
];
export const seedMembers: Member[] = [
  { id: 'dad', displayName: '아빠', color: 'dad' },
  { id: 'mom', displayName: '엄마', color: 'mom' },
];
export const seedTags: Tag[] = [
  { id: 'vax', label: '예방접종', emoji: '💉', tone: 'vax', sortOrder: 0, preset: true },
  { id: 'fever', label: '열·아픔', emoji: '🤒', tone: 'fever', sortOrder: 1, preset: true },
  { id: 'hosp', label: '병원', emoji: '🏥', tone: 'hosp', sortOrder: 2, preset: true },
  { id: 'first', label: '처음', emoji: '🌟', tone: 'first', sortOrder: 3, preset: true },
  { id: 'growth', label: '키·몸무게', emoji: '📏', tone: 'growth', sortOrder: 4, preset: true },
  { id: 'food', label: '수유·이유식', emoji: '🍼', tone: 'food', sortOrder: 5, preset: true },
  { id: 'sleep', label: '수면', emoji: '😴', tone: 'sleep', sortOrder: 6, preset: true },
  { id: 'med', label: '약', emoji: '💊', tone: 'med', sortOrder: 7, preset: true },
  { id: 'prenatal', label: '산전검진', emoji: '🤰', tone: 'prenatal', sortOrder: 8, preset: true },
];
