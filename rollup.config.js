// rollup.config.js

import cleanup from 'rollup-plugin-cleanup';

export default [
  {
    input: './src/webscraper.js',
    external: ['fs', 'https', 'cheerio'],
    output: {
      file: './index.js',
      format: 'cjs',
    },
  },
  {
    input: './src/webscraper.js',
    external: ['fs', 'https', 'cheerio'],
    output: {
      file: 'dist/webscraper.cjs.js',
      format: 'cjs',
    },
    plugins: [cleanup()],
  }
];
