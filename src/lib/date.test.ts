import { describe, expect, it } from 'vitest';
import { ageLabel, addDays, dayCounter, fromKey, relativeTime, toKey, todayKey } from './date';

describe('date helpers', () => {
  it('counts days relative to the page date across month and year boundaries', () => {
    expect(dayCounter({ birthDate: '2026-03-17' }, '2026-10-27')).toBe('D+224');
    expect(dayCounter({ birthDate: '2025-12-31' }, '2026-01-01')).toBe('D+1');
    expect(dayCounter({ birthDate: '2026-01-01' }, '2026-01-01')).toBe('D+0');
    expect(dayCounter({ status: 'born' }, '2026-01-01')).toBe('태어난 날을 입력해 주세요');
  });
  it('formats due date counters and an unknown due date', () => {
    expect(dayCounter({ dueDate: '2026-10-29' }, '2026-10-27')).toBe('D-2');
    expect(dayCounter({ dueDate: '2026-10-27' }, '2026-10-27')).toBe('D-day');
    expect(dayCounter({}, '2026-10-27')).toBe('출산 예정일 미정');
  });
  it('formats month and year age labels', () => {
    expect(ageLabel({ id: 'kid1', birthDate: '2025-01-10' }, '2025-02-10')).toBe('1개월');
    expect(ageLabel({ id: 'kid1', birthDate: '2023-01-10' }, '2025-03-10')).toBe('2년 2개월');
  });
  it('respects the day-of-month boundary for month age', () => {
    expect(ageLabel({ id: 'kid1', birthDate: '2025-01-31' }, '2025-02-28')).toBe('생후 28일');
    expect(ageLabel({ id: 'kid1', birthDate: '2025-01-31' }, '2025-03-01')).toBe('1개월');
  });
  it('formats due date labels including day zero and overdue', () => {
    const child = { id: 'kid2', dueDate: '2025-05-12' };
    expect(ageLabel(child, '2025-05-10')).toBe('출산 예정 D-2');
    expect(ageLabel(child, '2025-05-12')).toBe('출산 예정 D-day');
    expect(ageLabel(child, '2025-05-13')).toBe('출산 예정일 지남');
  });
  it('labels unborn child without a due date', () => {
    expect(ageLabel({ id: 'kid2' }, '2025-01-01')).toBe('출산 전');
    expect(ageLabel({ id: 'kid1' }, '2025-01-01')).toBe('');
  });
  it('keeps local date keys stable across midnight boundaries', () => {
    expect(toKey(new Date(2025, 0, 1, 23, 59))).toBe('2025-01-01');
    expect(toKey(new Date(2025, 0, 2, 0, 1))).toBe('2025-01-02');
    expect(todayKey(new Date('2025-01-01T15:30:00.000Z'))).toBe('2025-01-02');
    expect(addDays('2025-01-01', 1)).toBe('2025-01-02');
    expect(toKey(fromKey('2025-01-01'))).toBe('2025-01-01');
  });
  it('formats quiet relative times', () => {
    const now = new Date('2025-05-12T21:20:00+09:00');
    expect(relativeTime('2025-05-12T21:20:00+09:00', now)).toBe('방금');
    expect(relativeTime('2025-05-12T21:17:00+09:00', now)).toBe('3분 전');
    expect(relativeTime('2025-05-11T21:20:00+09:00', now)).toBe('어제 오후 9:20');
  });
});
