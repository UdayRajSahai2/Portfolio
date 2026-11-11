import { defineConfig } from 'vite';

// One id per build. The page carries it (__BUILD_ID__) and the build writes it to
// version.json, so a page left over in a browser's cache can tell it is stale (src/fresh.js).
const BUILD_ID = Date.now().toString(36);

// Relative asset paths, so the built site works at any URL:
// https://<user>.github.io/<repo>/, a custom domain, or Vercel/Netlify.
export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    {
      name: 'build-id',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID }) });
      },
    },
  ],
  build: {
    chunkSizeWarningLimit: 1000, // three.js is big; that's expected
  },
});
