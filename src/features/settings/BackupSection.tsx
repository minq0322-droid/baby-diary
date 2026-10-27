import { useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { StoreSnapshot } from '../../data/types';
import {
  fromBackupJson,
  toBackupJson,
  toDatedArchive,
  toMarkdown,
} from '../../lib/exportFormat';
import { downloadFile } from '../../lib/download';
import { todayKey } from '../../lib/date';
import { blobToDataUrl } from '../../lib/image';
import { Sheet } from '../../components/Sheet';
import { loadZip } from '../../lib/loadExportLibs';

type Props = {
  store: DataStore;
  snapshot: StoreSnapshot;
  notify: (message: string) => void;
};

export function BackupSection({ store, snapshot, notify }: Props) {
  const [pending, setPending] = useState<StoreSnapshot | null>(null);
  const existing = new Set(snapshot.pages.map((page) => page.id));
  const added =
    pending?.pages.filter((page) => !existing.has(page.id)).length ?? 0;
  const skipped = (pending?.pages.length ?? 0) - added;
  const exportFile = async (markdown: boolean) => {
    try {
      await store.loadAllPages();
      const all = store.exportAll();
      // Asset references are not portable across stores; backups carry image bytes.
      const portable = async (src: string): Promise<string> => {
        const resolved = store.resolvePhotoSrc
          ? await store.resolvePhotoSrc(src)
          : src;
        if (resolved.startsWith('data:')) return resolved;
        const response = await fetch(resolved);
        if (!response.ok) throw new Error('사진을 불러오지 못했어요.');
        return blobToDataUrl(await response.blob());
      };
      for (const page of all.pages) {
        for (const photo of page.photos) photo.src = await portable(photo.src);
      }
      for (const child of all.children) {
        if (child.photo) child.photo.src = await portable(child.photo.src);
        for (const photo of child.photoHistory)
          photo.src = await portable(photo.src);
      }
      if (markdown) {
        await downloadFile(
          `육아일기-${todayKey()}.md`,
          toMarkdown(all),
          'text/markdown;charset=utf-8',
        );
      } else {
        const Zip = await loadZip(() => notify('내보내기 도구를 불러오는 중…'));
        const zip = new Zip();
        for (const file of toDatedArchive(all))
          zip.file(file.path, file.content);
        zip.file('backup.json', JSON.stringify(toBackupJson(all), null, 2));
        await downloadFile(
          `육아일기-${todayKey()}.zip`,
          await zip.generateAsync({ type: 'blob' }),
          'application/zip',
        );
      }
      notify('기록을 내보냈어요');
    } catch {
      notify('내보내기를 완료하지 못했어요');
    }
  };

  return (
    <>
      <section className="settings-group">
        <h2>백업</h2>
        <div className="settings-list">
          <button
            className="setting"
            type="button"
            onClick={() => void exportFile(false)}
          >
            백업 내려받기
          </button>
          <button
            className="setting"
            type="button"
            onClick={() => void exportFile(true)}
          >
            Markdown 내보내기
          </button>
          <label className="setting">
            백업 가져오기
            <input
              type="file"
              accept=".json,.zip,application/json,application/zip"
              disabled={store.readOnly}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                try {
                  let text: string;
                  if (file.name.toLowerCase().endsWith('.zip')) {
                    const Zip = await loadZip(() => notify('내보내기 도구를 불러오는 중…'));
                    const zip = await Zip.loadAsync(await file.arrayBuffer());
                    const backup = zip.file('backup.json');
                    if (!backup) throw new Error('백업 파일이 없어요.');
                    text = await backup.async('string');
                  } else text = await file.text();
                  setPending(fromBackupJson(JSON.parse(text)));
                } catch {
                  notify('백업 파일 형식을 확인해 주세요');
                }
              }}
            />
          </label>
        </div>
      </section>
      {pending && (
        <Sheet title="백업 가져오기 미리보기" onClose={() => setPending(null)}>
          <div className="backup-actions">
            <p>
              {added}개 페이지 추가, {skipped}개 건너뜀
            </p>
            <button
              className="primary-btn"
              type="button"
              onClick={async () => {
                try {
                  await store.importAll(pending);
                  setPending(null);
                } catch {
                  notify(
                    '사진과 기록을 가져오지 못했어요. 다시 시도해 주세요.',
                  );
                }
              }}
            >
              가져오기
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
