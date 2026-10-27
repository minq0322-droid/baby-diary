import type { DataStore } from '../../data/DataStore';
import type { Page, StoreSnapshot } from '../../data/types';
import { inkFor } from '../../lib/pageColors';
import { downloadFile } from '../../lib/download';
import { paintStroke } from '../page/strokes';
import { BOOK, bookFilename, fitTextPages, wrapText } from './bookLayout';
import { loadPdf, loadZip } from '../../lib/loadExportLibs';

export type BookOptions = {
  start: string;
  end: string;
  childId: string;
  authorId: string;
  format: 'pdf' | 'zip';
};

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    promise.then(
      (value) => {
        signal.removeEventListener('abort', abort);
        resolve(value);
      },
      (reason) => {
        signal.removeEventListener('abort', abort);
        reject(reason);
      },
    );
  });
}

function canvasPage(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = BOOK.width;
  canvas.height = BOOK.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('책 페이지를 만들지 못했어요.');
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = inkFor(color);
  return { canvas, context };
}

async function renderPage(
  page: Page,
  all: StoreSnapshot,
  store: DataStore,
  signal: AbortSignal,
) {
  const child = all.children.find((item) => item.id === page.childId);
  const member = all.members.find(
    (item) => item.id === page.authorId || item.color === page.authorId,
  );
  const color = page.color ?? child?.pageColor ?? '#F4EBDD';
  const { canvas, context } = canvasPage(color);
  const artHeight = (BOOK.width * 4) / 5;
  // Draw on a transparent layer so erasing never cuts through the page background.
  const layer = document.createElement('canvas');
  layer.width = BOOK.width;
  layer.height = Math.round(artHeight);
  const drawing = layer.getContext('2d')!;
  page.drawing.forEach((stroke) =>
    paintStroke(
      drawing,
      stroke,
      BOOK.width,
      artHeight,
      inkFor(color),
      BOOK.width / 300,
    ),
  );
  context.drawImage(layer, 0, 0);
  layer.width = layer.height = 0;
  for (const photo of page.photos) {
    signal.throwIfAborted();
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = await abortable(
      store.resolvePhotoSrc?.(photo.src) ?? Promise.resolve(photo.src),
      signal,
    );
    try {
      await abortable(image.decode(), signal);
    } catch {
      signal.throwIfAborted();
      throw new Error(
        `${page.date}의 사진을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.`,
      );
    }
    signal.throwIfAborted();
    const width = photo.w * BOOK.width;
    const height = (width * image.naturalHeight) / image.naturalWidth;
    context.save();
    context.beginPath();
    context.rect(0, 0, BOOK.width, artHeight);
    context.clip();
    context.translate(
      photo.x * BOOK.width + width / 2,
      photo.y * artHeight + height / 2,
    );
    context.rotate((photo.rotation * Math.PI) / 180);
    context.drawImage(image, -width / 2, -height / 2, width, height);
    context.restore();
  }
  const margin = 110;
  const badges = page.tagIds
    .map((id) => all.tags.find((tag) => tag.id === id))
    .filter(Boolean)
    .map((tag) => `${tag!.emoji} ${tag!.label}`)
    .join(' · ');
  const family = member?.fontAssetId ? `${member.id}Book` : 'Gaegu';
  const textWidth = BOOK.width - margin * 2;
  context.font = '32px Gaegu';
  const badgeLines = badges ? wrapText(context, badges, textWidth) : [];
  const badgeTop = BOOK.height - 95 - badgeLines.length * 40;
  const textTop = artHeight + 35;
  const textHeight = badgeTop - textTop - 25;
  context.font = `68px "${family}"`;
  const layout = fitTextPages(wrapText(context, page.text, textWidth), 68, textHeight);
  const size = layout.size;
  const lines = layout.pages[0];
  context.textBaseline = 'top';
  lines.forEach((line, index) =>
    context.fillText(line, margin, textTop + index * size * 1.35),
  );
  context.font = '32px Gaegu';
  badgeLines.forEach((line, index) =>
    context.fillText(line, margin, badgeTop + index * 40),
  );
  context.fillText(
    `${page.date} · ${child?.name ?? page.childId} · ${page.authorId === 'mom' ? '엄마' : '아빠'}`,
    margin,
    BOOK.height - 55,
  );
  const canvases = [canvas];
  for (const continuation of layout.pages.slice(1)) {
    const extra = canvasPage(color);
    extra.context.font = `${size}px "${family}"`;
    extra.context.textBaseline = 'top';
    extra.context.fillText('(이어서)', margin, artHeight + 35);
    continuation.forEach((line, index) =>
      extra.context.fillText(line, margin, artHeight + 90 + index * size * 1.35),
    );
    canvases.push(extra.canvas);
  }
  return canvases;
}

export async function exportBook(
  store: DataStore,
  options: BookOptions,
  signal: AbortSignal,
  progress: (done: number, total: number) => void,
  toolLoading: () => void = () => undefined,
) {
  await abortable(store.loadAllPages(), signal);
  signal.throwIfAborted();
  const all = store.exportAll();
  const pages = all.pages
    .filter(
      (page) =>
        page.date >= options.start &&
        page.date <= options.end &&
        (!options.childId || page.childId === options.childId) &&
        (!options.authorId || page.authorId === options.authorId),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!pages.length) throw new Error('선택한 기간에 기록이 없어요.');
  progress(0, pages.length);
  const fonts: FontFace[] = [];
  try {
    for (const member of all.members) {
      if (
        !member.fontAssetId ||
        !pages.some((page) => page.authorId === member.color)
      )
        continue;
      const font = new FontFace(
        `${member.id}Book`,
        `url(${JSON.stringify(await (store.resolvePhotoSrc?.(member.fontAssetId) ?? Promise.resolve(member.fontAssetId)))})`,
      );
      await abortable(font.load(), signal);
      document.fonts.add(font);
      fonts.push(font);
    }
    const gaegu = await abortable(
      document.fonts.load('68px Gaegu', '우리 아이의 일기'),
      signal,
    );
    await abortable(document.fonts.ready, signal);
    if (!gaegu.length)
      throw new Error(
        '글씨체를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.',
      );
    signal.throwIfAborted();
    const pdf =
      options.format === 'pdf'
        ? new (await loadPdf(toolLoading))({
            unit: 'mm',
            format: [148, 210],
            compress: true,
          })
        : undefined;
    const zip =
      options.format === 'zip'
        ? new (await loadZip(toolLoading))()
        : undefined;
    if (pdf) {
      const { canvas, context } = canvasPage('#F4EBDD');
      context.textAlign = 'center';
      context.font = '90px Gaegu';
      const names = all.children
        .filter((child) => !options.childId || child.id === options.childId)
        .map((child) => child.name)
        .join(' · ');
      wrapText(context, `${names}의 일기`, BOOK.width - 200).forEach(
        (line, i) => context.fillText(line, BOOK.width / 2, 1050 + i * 110),
      );
      context.font = '60px Gaegu';
      context.fillText(
        `${options.start.slice(0, 7).replace('-', '.')} – ${options.end.slice(0, 7).replace('-', '.')}`,
        BOOK.width / 2,
        1450,
      );
      pdf.addImage(canvas, 'PNG', 0, 0, 148, 210);
      canvas.width = canvas.height = 0;
    }
    for (const [index, page] of pages.entries()) {
      signal.throwIfAborted();
      const canvases = await renderPage(page, all, store, signal);
      if (pdf) {
        for (const [pageIndex, rendered] of canvases.entries()) {
          if (index > 0 || pageIndex > 0) pdf.addPage([148, 210]);
          pdf.addImage(rendered, 'PNG', 0, 0, 148, 210);
        }
      }
      if (zip) {
        for (const [pageIndex, rendered] of canvases.entries()) {
          const blob = await new Promise<Blob>((resolve, reject) =>
            rendered.toBlob(
              (value) =>
                value
                  ? resolve(value)
                  : reject(new Error('이미지를 만들지 못했어요.')),
              'image/png',
            ),
          );
          const name = bookFilename(
            page.date,
            all.children.find((child) => child.id === page.childId)?.name ??
              page.childId,
            page.authorId === 'mom' ? '엄마' : '아빠',
          );
          zip.file(
            pageIndex ? name.replace(/\.png$/, `_${pageIndex + 1}.png`) : name,
            await blob.arrayBuffer(),
          );
        }
      }
      canvases.forEach((rendered) => {
        rendered.width = rendered.height = 0;
      });
      progress(index + 1, pages.length);
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
    signal.throwIfAborted();
    const blob = pdf
      ? pdf.output('blob')
      : await zip!.generateAsync({ type: 'blob' }, () =>
          signal.throwIfAborted(),
        );
    signal.throwIfAborted();
    await downloadFile(
      `육아일기-${options.start}-${options.end}.${options.format}`,
      blob,
      options.format === 'pdf' ? 'application/pdf' : 'application/zip',
    );
  } finally {
    fonts.forEach((font) => document.fonts.delete(font));
  }
}
