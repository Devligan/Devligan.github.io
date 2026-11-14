import { defineConfig } from 'astro/config';
import config from './portfolio.config.mjs';

export default defineConfig({
  site: config.site,
  build: { inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
