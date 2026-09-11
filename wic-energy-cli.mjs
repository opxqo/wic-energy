#!/usr/bin/env node
import { existsSync } from 'node:fs'

const entry = new URL('./apps/cli/dist/index.js', import.meta.url)
if (!existsSync(entry)) {
  console.error('尚未构建。请先运行：npm install && npm run build:cli')
  process.exitCode = 1
} else {
  await import(entry.href)
}
