import type { StoreSnapshot } from './types';

export function hasInlinePhotos(data: StoreSnapshot): boolean {
  return (
    data.pages.some((page) =>
      page.photos.some((photo) => photo.src.startsWith('data:')),
    ) ||
    data.children.some(
      (child) =>
        child.photo?.src.startsWith('data:') ||
        child.photoHistory?.some((photo) => photo.src.startsWith('data:')),
    )
  );
}

/** Finish asset writes before persisting any page/config pointers. Source is untouched. */
export async function externalizeSnapshot(
  data: StoreSnapshot,
  upload: (blob: Blob) => Promise<{ src: string }>,
): Promise<StoreSnapshot> {
  const result = structuredClone(data);
  const converted = new Map<string, string>();
  const convert = async (src: string) => {
    if (!src.startsWith('data:')) return src;
    const cached = converted.get(src);
    if (cached) return cached;
    const value = (await upload(await (await fetch(src)).blob())).src;
    converted.set(src, value);
    return value;
  };
  for (const page of result.pages) {
    for (const photo of page.photos) photo.src = await convert(photo.src);
  }
  for (const child of result.children) {
    if (child.photo) child.photo.src = await convert(child.photo.src);
    for (const photo of child.photoHistory ?? [])
      photo.src = await convert(photo.src);
  }
  return result;
}
