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
export type DrawingHistory = { drawing: Stroke[]; undo: Stroke[][] };
export function clearDrawing(state: DrawingHistory): DrawingHistory {
  return { drawing: [], undo: [...state.undo, state.drawing].slice(-10) };
}
export function undoDrawing(state: DrawingHistory): DrawingHistory {
  return {
    drawing: state.undo[state.undo.length - 1] ?? state.drawing.slice(0, -1),
    undo: state.undo.slice(0, -1),
  };
}
