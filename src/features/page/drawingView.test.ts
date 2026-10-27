import { describe, expect, it } from 'vitest';
import type { Stroke } from '../../data/types';
import { clampView, clearDrawing, initialView, normalizedPoint, undoDrawing } from './drawingView';

describe('drawing view coordinates', () => {
  it('maps box coordinates to the same surface point after zoom and pan', () => {
    expect(normalizedPoint(100, 80, 400, 320, initialView)).toEqual([.25, .25]);
    expect(normalizedPoint(100, 80, 400, 320, { zoom: 2, x: -100, y: -80 })).toEqual([.25, .25]);
    expect(normalizedPoint(120, 96, 400, 320, { zoom: 3, x: -180, y: -144 })).toEqual([.25, .25]);
    expect(normalizedPoint(-10, 900, 400, 320, initialView)).toEqual([0, 1]);
  });
  it('clamps zoom and translation so the content covers its box', () => {
    expect(clampView({ zoom: 5, x: -9999, y: 40 }, 400, 320)).toEqual({ zoom: 4, x: -1200, y: 0 });
    expect(clampView({ zoom: .5, x: -80, y: -60 }, 400, 320)).toEqual(initialView);
  });
});

describe('clear drawing history', () => {
  const stroke: Stroke = { color: 'ink', width: 2, points: [0, 0, 1, 1] };
  it('restores cleared strokes without mutating the original', () => {
    const drawing = [stroke];
    const cleared = clearDrawing({ drawing, undo: [] });
    expect(cleared.drawing).toEqual([]);
    expect(drawing).toEqual([stroke]);
    expect(undoDrawing(cleared)).toEqual({ drawing, undo: [] });
  });
  it('undoes subsequent strokes before restoring a clear, then removes the last stroke', () => {
    const cleared = clearDrawing({ drawing: [stroke], undo: [] });
    const afterStroke = { drawing: [stroke], undo: [...cleared.undo, []] };
    const undoneStroke = undoDrawing(afterStroke);
    expect(undoneStroke.drawing).toEqual([]);
    const restored = undoDrawing(undoneStroke);
    expect(restored.drawing).toEqual([stroke]);
    expect(undoDrawing(restored).drawing).toEqual([]);
    expect(undoDrawing({ drawing: [], undo: [] }).drawing).toEqual([]);
  });
  it('bounds the retained snapshots', () => {
    expect(clearDrawing({ drawing: [stroke], undo: Array(10).fill([]) }).undo).toHaveLength(10);
  });
});
