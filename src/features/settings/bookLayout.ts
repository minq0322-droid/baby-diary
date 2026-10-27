export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
export const BOOK = { width: mmToPx(148), height: mmToPx(210) };

export function bookFilename(
  date: string,
  child: string,
  author: string,
): string {
  const safe = (value: string) =>
    value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
    '이름없음';
  return `${date}_${safe(child)}_${safe(author)}.png`;
}

export function wrapText(
  context: Pick<CanvasRenderingContext2D, 'measureText'>,
  text: string,
  width: number,
): string[] {
  return text.split('\n').flatMap((paragraph) => {
    const lines: string[] = [];
    let line = '';
    for (const char of paragraph) {
      if (line && context.measureText(line + char).width > width) {
        lines.push(line);
        line = '';
      }
      line += char;
    }
    lines.push(line);
    return lines;
  });
}

export function fitTextPages(
  lines: string[],
  baseSize: number,
  maxHeight: number,
): { size: number; pages: string[][] } {
  let size = baseSize;
  while (size > baseSize * 0.8 && lines.length * size * 1.35 > maxHeight) {
    size -= 1;
  }
  const linesPerPage = Math.max(1, Math.floor(maxHeight / (size * 1.35)));
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }
  return { size, pages: pages.length ? pages : [[]] };
}
