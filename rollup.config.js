import ts from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

import pkg from './package.json'

const banner = `
/**
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} Lachlan Miller
 * Released under the MIT License
 */
`

function createEntry(options) {
  const {
    format,
    input,
    isBrowser
  } = options

  const config = {
    input,
    external: [
      'vue',
      '@vue/compiler-dom',
    ],
    plugins: [
      replace({
        "process.env.NODE_ENV": true
      }),
      resolve(), commonjs(), json()
    ],
    output: {
      banner,
      name: 'VueTestUtils',
      file: 'dist/vue-test-utils.browser.js',
      format,
      globals: {
        vue: 'Vue',
        '@vue/compiler-dom': 'VueCompilerDOM',
      }
    }
  }

  if (format === 'es') {
    config.output.file = pkg.module
  }
  if (format === 'cjs') {
    config.output.file = pkg.main
  }
  console.log(`Building ${format}: ${config.output.file}`)

  config.plugins.push(
    ts({
      check: format === 'es' && isBrowser,
      tsconfigOverride: {
        compilerOptions: {
          declaration: format === 'es',
          target: 'es5', // not sure what this should be?
          module: format === 'cjs' ? 'es2015' : 'esnext'
        },
        exclude: ['tests']
      }
    })
  )

  return config
}

export default [
  createEntry({ format: 'es', input: 'src/index.ts', isBrowser: false }),
  createEntry({ format: 'iife', input: 'src/index.ts', isBrowser: true }),
  createEntry({ format: 'cjs', input: 'src/index.ts', isBrowser: false }),
]
