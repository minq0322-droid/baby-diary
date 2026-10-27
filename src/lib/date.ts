import { differenceInCalendarDays, differenceInCalendarMonths, format, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Child } from '../data/types';
import type { Comment, Reaction } from '../data/types';

const dateFormat = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function toKey(date: Date): string { return dateFormat(date); }
export function fromKey(key: string): Date { return parse(key, 'yyyy-MM-dd', new Date(2000, 0, 1)); }
export function addDays(key: string, days: number): string { const date = fromKey(key); date.setDate(date.getDate() + days); return toKey(date); }
export function todayKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}
export function formatHeader(key: string): string { return format(fromKey(key), 'M월 d일 EEEE', { locale: ko }); }
export function relativeTime(value: string, now = new Date()): string {
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
  const yesterdayKey = addDays(todayKey(now), -1);
  if (todayKey(date) === yesterdayKey) return `어제 ${format(date, 'a h:mm', { locale: ko })}`;
  return format(date, 'M월 d일 a h:mm', { locale: ko });
}
export function hasNewActivity(date: string, comments: Comment[], reactions: Reaction[], memberId: string): boolean {
  try {
    const seen = Number(localStorage.getItem(`yuga-last-seen:${date}`) ?? 0);
    return comments.some((comment) => comment.createdAt && comment.authorId !== memberId && new Date(comment.createdAt).getTime() > seen)
      || (seen === 0 && reactions.some((reaction) => reaction.memberId !== memberId));
  } catch { return false; }
}
export function isBorn(child: Pick<Child, 'birthDate' | 'status'>): boolean {
  return Boolean(child.birthDate) || child.status === 'born';
}
export function ageLabel(child: Pick<Child, 'id' | 'birthDate' | 'dueDate' | 'status'>, onKey: string): string {
  if (child.birthDate) {
    const birth = fromKey(child.birthDate); const on = fromKey(onKey);
    const months = differenceInCalendarMonths(on, birth) - (on.getDate() < birth.getDate() ? 1 : 0);
    if (months < 0) return '';
    if (months < 1) return `생후 ${differenceInCalendarDays(on, birth)}일`;
    return months < 24 ? `${months}개월` : `${Math.floor(months / 12)}년 ${months % 12}개월`;
  }
  if (child.dueDate) {
    const days = differenceInCalendarDays(fromKey(child.dueDate), fromKey(onKey));
    return days < 0 ? '출산 예정일 지남' : days === 0 ? '출산 예정 D-day' : `출산 예정 D-${days}`;
  }
  return child.id === 'kid2' ? '출산 전' : '';
}

export function dayCounter(child: Pick<Child, 'birthDate' | 'dueDate' | 'status'>, dateKey: string): string {
  if (child.birthDate) {
    const days = differenceInCalendarDays(fromKey(dateKey), fromKey(child.birthDate));
    return days < 0 ? '' : `D+${days}`;
  }
  if (isBorn(child)) return '태어난 날을 입력해 주세요';
  if (child.dueDate) {
    const days = differenceInCalendarDays(fromKey(child.dueDate), fromKey(dateKey));
    return days < 0 ? '출산 예정일 지남' : days === 0 ? 'D-day' : `D-${days}`;
  }
  return '출산 예정일 미정';
}
