/** Only image bytes go into IndexedDB; localStorage holds stable references. */
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('yuga-photo-assets', 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore('photos');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}
async function transaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      try {
        const tx = db.transaction('photos', mode);
        const request = action(tx.objectStore('photos'));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () =>
          reject(tx.error ?? new Error('사진을 저장하지 못했어요.'));
      } catch (error) {
        reject(error);
      }
    });
  } finally {
    db.close();
  }
}
export async function putPhoto(blob: Blob): Promise<string> {
  const id = crypto.randomUUID();
  await transaction('readwrite', (store) => store.put(blob, id));
  return 'idb-photo:' + id;
}
export async function readPhoto(src: string): Promise<Blob> {
  const blob = await transaction<Blob | undefined>('readonly', (store) =>
    store.get(src.slice(10)),
  );
  if (!blob) throw new Error('사진을 찾을 수 없어요.');
  return blob;
}
export async function removePhoto(src: string): Promise<void> {
  if (src.startsWith('idb-photo:'))
    await transaction('readwrite', (store) => store.delete(src.slice(10)));
}
