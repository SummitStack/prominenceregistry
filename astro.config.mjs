// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://prominenceregistry.com',
  // Static routes (e.g. /image-review) must win over /[slug] peak pages.
  trailingSlash: 'always',
});
