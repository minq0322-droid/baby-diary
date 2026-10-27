import { useEffect } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Member } from '../../data/types';

export function useMemberFonts(members: Member[], store: DataStore) {
  useEffect(() => {
    let cancelled = false;
    const fonts: FontFace[] = [];
    for (const member of members) {
      const property = `--${member.color}-font`;
      document.documentElement.style.removeProperty(property);
      const asset = member.fontAssetId;
      if (!asset) continue;
      const family = `${member.color}Writing`;
      void (async () => {
        const src = await (store.resolvePhotoSrc?.(asset) ?? Promise.resolve(asset));
        const font = new FontFace(family, `url(${JSON.stringify(src)})`);
        await font.load();
        if (cancelled) return;
        document.fonts.add(font);
        fonts.push(font);
        document.documentElement.style.setProperty(property, `'${family}'`);
      })().catch(() => {
        // Keep the default handwriting if the saved asset is unavailable.
      });
    }
    return () => {
      cancelled = true;
      fonts.forEach((font) => document.fonts.delete(font));
      members.forEach((member) =>
        document.documentElement.style.removeProperty(`--${member.color}-font`),
      );
    };
  }, [members, store]);
}
