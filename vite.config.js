import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    watch: {
      ignored: ['**/*.mp3', '**/*.jfif', '**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.gif', '**/*.webp', '**/*.ico', '**/dist/**', '**/.git/**']
    }
  }
});
