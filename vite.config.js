import { defineConfig } from 'vite';

// Relative asset paths, so the built site works at any URL:
// https://<user>.github.io/<repo>/, a custom domain, or Vercel/Netlify.
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 1000, // three.js is big; that's expected
  },
});
