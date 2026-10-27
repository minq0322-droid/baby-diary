import { useEffect, useRef } from 'react';
import type { Page } from '../data/types';
import type { DataStore } from '../data/DataStore';
import { paintStroke } from '../features/page/strokes';
import { useDarkMode } from '../lib/usePageColorStyle';
export function StrokePreview({
  page,
  store,
  className = '',
}: {
  page?: Page;
  store?: DataStore;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dark = useDarkMode();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelled = false;
    const images = (page?.photos ?? []).map((photo) => {
      const image = new Image();
      return { photo, image };
    });
    const draw = () => {
      if (cancelled) return;
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const context = canvas.getContext('2d');
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      (page?.drawing ?? []).forEach((stroke) => {
        paintStroke(
          context,
          stroke,
          rect.width,
          rect.height,
          getComputedStyle(canvas).color,
          rect.width / 340,
        );
      });
      images.forEach(({ photo, image }) => {
        if (!image.complete || !image.naturalWidth) return;
        const width = photo.w * rect.width;
        const height = (width * image.naturalHeight) / image.naturalWidth;
        context.save();
        context.translate(
          photo.x * rect.width + width / 2,
          photo.y * rect.height + height / 2,
        );
        context.rotate((photo.rotation * Math.PI) / 180);
        context.drawImage(image, -width / 2, -height / 2, width, height);
        context.restore();
      });
    };
    images.forEach(({ image, photo }) => {
      image.onload = draw;
      void (
        store?.resolvePhotoSrc
          ? store.resolvePhotoSrc(photo.src)
          : Promise.resolve(photo.src)
      )
        .then((src) => {
          if (!cancelled) image.src = src;
        })
        .catch(() => {
          /* Missing images leave the drawing preview available. */
        });
    });
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => {
      cancelled = true;
      observer.disconnect();
      images.forEach(({ image }) => {
        image.onload = null;
      });
    };
  }, [page, dark, store]);
  return <canvas className={className} ref={ref} aria-hidden="true" />;
}
