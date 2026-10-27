export type Crop = { zoom: number; x: number; y: number };
export function clampCrop(
  image: { width: number; height: number },
  crop: Crop,
): Crop {
  const zoom = Math.max(1, Math.min(3, crop.zoom));
  const scale = Math.max(480 / image.width, 480 / image.height) * zoom;
  const maxX = (image.width * scale) / 2 - 240;
  const maxY = (image.height * scale) / 2 - 240;
  return {
    zoom,
    x: Math.max(-maxX, Math.min(maxX, crop.x)),
    y: Math.max(-maxY, Math.min(maxY, crop.y)),
  };
}
