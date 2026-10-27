import type { StoreSnapshot } from '../data/types';
export type ArchiveFile = { path: string; content: string };
export function toMarkdown(all: StoreSnapshot, month?: string): string;
export function toDatedArchive(snapshot: StoreSnapshot): ArchiveFile[];
