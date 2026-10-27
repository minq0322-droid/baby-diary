import { describe, expect, it } from 'vitest';
import { object, subject, topic } from './josa';

describe('Korean name particles', () => {
  it('chooses particles from the final Hangul syllable', () => {
    expect(topic('또이')).toBe('또이는');
    expect(topic('조비안')).toBe('조비안은');
    expect(subject('또이')).toBe('또이가');
    expect(subject('조비안')).toBe('조비안이');
    expect(object('또이')).toBe('또이를');
    expect(object('조비안')).toBe('조비안을');
  });

  it('marks non-Hangul endings as unknown', () => {
    expect(topic('Joy')).toBe('Joy은(는)');
    expect(subject('Joy')).toBe('Joy이(가)');
    expect(object('Joy')).toBe('Joy을(를)');
  });
});
