
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import ignore from 'rollup-plugin-ignore';


export default [
  // FOR TEST
  {
    input: 'src/browser.mjs',
    output: {
      file: 'browser/country/ip_lookup.js',
      format: 'iife',
      name: 'IpLookup',
    },
    plugins: [
      nodeResolve({
        browser: true,
      }),
      ignore(["fs", "path"]),
    ]
  },
  {
    input: 'src/browser-extra.mjs',
    output: {
      file: 'browser/country-extra/ip_lookup.js',
      format: 'iife',
      name: 'IpLookup',
    },
    plugins: [
      nodeResolve({
        browser: true,
      }),
      ignore(["fs", "path"]),
    ]
  },

  // FOR PRODUCTION
  {
    input: 'src/browser.mjs',
    output: {
      file: 'browser/country/ip_lookup.min.js',
      format: 'iife',
      name: 'IpLookup',
    },
    plugins: [
      nodeResolve({
        browser: true,
      }),
      ignore(["fs", "path"]),
      terser(),
    ]
  },
  {
    input: 'src/browser-extra.mjs',
    output: {
      file: 'browser/country-extra/ip_lookup.min.js',
      format: 'iife',
      name: 'IpLookup',
    },
    plugins: [
      nodeResolve({
        browser: true,
      }),
      ignore(["fs", "path"]),
      terser(),
    ]
  },
];
