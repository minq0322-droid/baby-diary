/** Shared build paths checked without loading Vite/esbuild. */
export function pwaPaths(githubPages: boolean) {
  const base = githubPages ? '/baby-diary/' : '/';
  return { base, start_url: base, scope: base, icon: base + 'icon.svg' };
}
