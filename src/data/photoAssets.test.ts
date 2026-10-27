import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LocalStore } from './localStore';
import { readPhoto } from './photoAssets';
import * as images from '../lib/image';

/** Browser transaction lifecycle with a persistent backing map, including aborts. */
function memoryIndexedDb() {
  const blobs = new Map<string, Blob>();
  let fail = false;
  const db = {
    close: vi.fn(),
    transaction: () => {
      const tx = {
        oncomplete: undefined as (() => void) | undefined,
        onabort: undefined as (() => void) | undefined,
        error: new Error('quota'),
        objectStore: () => ({
          put: (blob: Blob, key: string) =>
            request(() => {
              blobs.set(key, blob);
            }),
          get: (key: string) => request(() => blobs.get(key)),
          delete: (key: string) =>
            request(() => {
              blobs.delete(key);
            }),
        }),
      };
      const request = (action: () => unknown) => {
        const request = { result: undefined as unknown };
        queueMicrotask(() => {
          if (fail) tx.onabort?.();
          else {
            request.result = action();
            tx.oncomplete?.();
          }
        });
        return request;
      };
      return tx;
    },
  };
  const indexedDB = {
    open: () => {
      const request = {
        result: db,
        onsuccess: undefined as (() => void) | undefined,
      };
      queueMicrotask(() => request.onsuccess?.());
      return request;
    },
  };
  return {
    indexedDB,
    blobs,
    abort: () => {
      fail = true;
    },
  };
}

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  vi.spyOn(images, 'downscalePhoto').mockImplementation(async (blob) => blob);
  vi.spyOn(images, 'blobToDataUrl').mockImplementation(
    async (blob) => 'data:image/png;base64,' + (await blob.text()),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('keeps page/profile image bytes out of localStorage and preserves profile history across reloads', async () => {
  const memory = memoryIndexedDb();
  vi.stubGlobal('indexedDB', memory.indexedDB);
  const store = new LocalStore();
  await store.setChildPhoto('kid1', new Blob(['first']));
  await store.setChildPhoto('kid1', new Blob(['second']));
  const child = store.listChildren()[0];
  expect(child.photoHistory).toHaveLength(1);
  expect(child.photo?.src).toMatch(/^idb-photo:/);
  expect(localStorage.getItem('yuga-record-data')).not.toContain('data:image');
  const restored = new LocalStore();
  expect(await restored.resolvePhotoSrc(child.photo!.src)).toBe(
    'data:image/png;base64,second',
  );
  const previous = child.photoHistory[0];
  restored.useHistoryPhoto('kid1', previous.id);
  expect(restored.listChildren()[0].photo?.id).toBe(previous.id);
  expect(restored.listChildren()[0].photoHistory).toHaveLength(1);
  await restored.deleteHistoryPhoto('kid1', child.photo!.id);
  expect(restored.listChildren()[0].photoHistory).toEqual([]);
  expect(memory.blobs.size).toBe(1);
  expect(await (await readPhoto(previous.src)).text()).toBe('first');
});
it('rejects an aborted photo upload without replacing the current photo or history', async () => {
  const memory = memoryIndexedDb();
  vi.stubGlobal('indexedDB', memory.indexedDB);
  const store = new LocalStore();
  await store.setChildPhoto('kid1', new Blob(['first']));
  const before = store.listChildren()[0];
  memory.abort();
  await expect(
    store.setChildPhoto('kid1', new Blob(['second'])),
  ).rejects.toThrow('quota');
  expect(store.listChildren()[0]).toEqual(before);
});
