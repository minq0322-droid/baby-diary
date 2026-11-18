import type { Stroke } from '../../data/types';

export type View = { zoom: number; x: number; y: number };
export const initialView: View = { zoom: 1, x: 0, y: 0 };
export function clampView(view: View, width: number, height: number): View {
  const zoom = Math.max(1, Math.min(4, view.zoom));
  return {
    zoom,
    x: Math.max(width * (1 - zoom), Math.min(0, view.x)),
    y: Math.max(height * (1 - zoom), Math.min(0, view.y)),
  };
}
export function normalizedPoint(x: number, y: number, width: number, height: number, view: View): number[] {
  return [
    Math.max(0, Math.min(1, (x - view.x) / (width * view.zoom))),
    Math.max(0, Math.min(1, (y - view.y) / (height * view.zoom))),
  ];
}
// 2026-11-18 (작가): 되돌리기 옆에 「다시 실행」. redo 는 되돌리기 직전 그림을 통째로 쌓고,
// 새 획을 긋거나 전부 지우면 비운다.
export type DrawingHistory = { drawing: Stroke[]; undo: Stroke[][]; redo?: Stroke[][] };
const redoLimit = 30;
export function clearDrawing(state: DrawingHistory): DrawingHistory {
  return { drawing: [], undo: [...state.undo, state.drawing].slice(-10), redo: [] };
}
export function undoDrawing(state: DrawingHistory): DrawingHistory {
  const redo = state.redo ?? [];
  if (!state.undo.length && !state.drawing.length) return { ...state, redo };
  return {
    drawing: state.undo[state.undo.length - 1] ?? state.drawing.slice(0, -1),
    undo: state.undo.slice(0, -1),
    redo: [...redo, state.drawing].slice(-redoLimit),
  };
}
export function redoDrawing(state: DrawingHistory): DrawingHistory {
  const redo = state.redo ?? [];
  const next = redo[redo.length - 1];
  if (!next) return { ...state, redo };
  return {
    drawing: next,
    undo: [...state.undo, state.drawing].slice(-10),
    redo: redo.slice(0, -1),
  };
}
