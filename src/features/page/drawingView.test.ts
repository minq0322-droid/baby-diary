import { describe, expect, it } from 'vitest';
import type { Stroke } from '../../data/types';
import { clampView, clearDrawing, initialView, normalizedPoint, redoDrawing, undoDrawing } from './drawingView';

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
    expect(undoDrawing(cleared)).toEqual({ drawing, undo: [], redo: [[]] });
  });
  it('redoes what was undone, in order, and a new stroke ends redo', () => {
    const a: Stroke = { ...stroke, points: [0, 0, .5, .5] };
    const b: Stroke = { ...stroke, points: [.5, .5, 1, 1] };
    const start = { drawing: [a, b], undo: [] };
    const once = undoDrawing(start);
    const twice = undoDrawing(once);
    expect(twice.drawing).toEqual([]);
    const back1 = redoDrawing(twice);
    expect(back1.drawing).toEqual([a]);
    const back2 = redoDrawing(back1);
    expect(back2.drawing).toEqual([a, b]);
    expect(redoDrawing(back2)).toEqual(back2);
    // Undo after redo walks back the same way.
    expect(undoDrawing(back2).drawing).toEqual([a]);
    // Redo also brings back a full clear.
    const cleared = clearDrawing(start);
    expect(cleared.redo).toEqual([]);
    const restored = undoDrawing(cleared);
    expect(redoDrawing(restored).drawing).toEqual([]);
    // Nothing to undo leaves redo untouched.
    expect(undoDrawing({ drawing: [], undo: [], redo: [[a]] }).redo).toEqual([[a]]);
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
