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
      // Layout size, so an animating (scaled) parent cannot shrink the backing store.
      const rect = { width: canvas.clientWidth, height: canvas.clientHeight };
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const context = canvas.getContext('2d');
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Letterbox if a caller constrains the preview to a different shape.
      const width = Math.min(rect.width, rect.height * 5 / 4);
      const height = width * 4 / 5;
      context.translate((rect.width - width) / 2, (rect.height - height) / 2);
      context.beginPath();
      context.rect(0, 0, width, height);
      context.clip();
      (page?.drawing ?? []).forEach((stroke) => {
        paintStroke(
          context,
          stroke,
          width,
          height,
          getComputedStyle(canvas).color,
          width / 300,
        );
      });
      images.forEach(({ photo, image }) => {
        if (!image.complete || !image.naturalWidth) return;
        const photoWidth = photo.w * width;
        const photoHeight = (photoWidth * image.naturalHeight) / image.naturalWidth;
        context.save();
        context.translate(
          photo.x * width + photoWidth / 2,
          photo.y * height + photoHeight / 2,
        );
        context.rotate((photo.rotation * Math.PI) / 180);
        context.drawImage(image, -photoWidth / 2, -photoHeight / 2, photoWidth, photoHeight);
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
