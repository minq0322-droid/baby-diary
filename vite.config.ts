import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { pwaPaths } from './src/lib/pwaPaths';

export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  const paths = pwaPaths(!artifact && process.env.GITHUB_PAGES === 'true');
  return {
    base: artifact ? "/" : paths.base,
    define: { __ARTIFACT__: JSON.stringify(artifact) },
    plugins: [
      react(),
      ...(artifact
        ? [
            {
              name: 'artifact-font',
              transformIndexHtml(html: string) {
                const fontFaces = [
                  ['Pretendard-Regular', '400 500'],
                  ['Pretendard-SemiBold', '600'],
                  ['Pretendard-Bold', '700 900'],
                ].map(([name, weight]) => {
                  const font = readFileSync(
                    new URL(
                      `./node_modules/pretendard/dist/web/static/woff2-subset/${name}.subset.woff2`,
                      import.meta.url,
                    ),
                  ).toString('base64');
                  return `@font-face{font-family:Pretendard;font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${font}) format('woff2')}`;
                }).join('');
                return html.replace(
                  /<link\b[^>]*href="https:\/\/cdn\.jsdelivr\.net[^>]*>/,
                  `<style>${fontFaces}</style>`,
                );
              },
            },
            {
              name: 'artifact-fragment',
              closeBundle() {
                const html = readFileSync('dist-artifact/index.html', 'utf8');
                const styles = [...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(([style]) => style);
                const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(([script]) => script);
                const themeColor = html.match(/<meta\b[^>]*name=["']theme-color["'][^>]*>/i)?.[0]
                  ?? '<meta name="theme-color" content="#FAF8F5">';
                const fragment = [
                  '<title>육아 기록</title>',
                  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap">',
                  themeColor,
                  ...styles,
                  '<div id="root"></div>',
                  ...scripts,
                ].join('\n');
                writeFileSync('dist-artifact/page.html', fragment);
              },
            },
            viteSingleFile(),
          ]
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['icon.svg'],
              manifest: {
                start_url: paths.start_url,
                scope: paths.scope,
                name: '육아 기록',
                short_name: '육아기록',
                lang: 'ko',
                display: 'standalone',
                theme_color: '#FAF8F5',
                background_color: '#FAF8F5',
                icons: [
                  {
                    src: paths.icon,
                    sizes: 'any',
                    type: 'image/svg+xml',
                    purpose: 'any maskable',
                  },
                ],
              },
            }),
          ]),
    ],
    ...(artifact
      ? {
          publicDir: false,
          build: {
            outDir: 'dist-artifact',
            modulePreload: false,
            rollupOptions: { output: { inlineDynamicImports: true } },
          },
        }
      : {}),
  };
});
