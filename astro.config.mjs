import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://juanibiapina.dev',
  base: '/bahratal/',
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
  },
});
