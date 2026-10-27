// Freeze only the previous artwork. The live scene keeps all gesture handlers.
export function crossfadeScene(root: HTMLElement): () => void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => { };
  const copy = root.cloneNode(true) as HTMLElement;
  copy.inert = true;
  copy.setAttribute('aria-hidden', 'true');
  copy.removeAttribute('aria-label');
  copy.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  copy.querySelector('.scene-picker')?.remove();
  copy.querySelectorAll<HTMLElement>('.scene-date, .home-navigation').forEach((node) => {
    node.style.visibility = 'hidden';
  });
  const source = root.querySelector('canvas');
  const canvas = copy.querySelector('canvas');
  if (source && canvas) canvas.getContext('2d')?.drawImage(source, 0, 0);
  const bounds = root.getBoundingClientRect();
  Object.assign(copy.style, {
    position: 'fixed', left: `${bounds.left}px`, top: `${bounds.top}px`,
    width: `${bounds.width}px`, height: `${bounds.height}px`, margin: '0',
  });
  copy.classList.add('scene-fade-copy');
  document.body.append(copy);
  const timer = window.setTimeout(() => copy.remove(), 420);
  return () => { window.clearTimeout(timer); copy.remove(); };
}
