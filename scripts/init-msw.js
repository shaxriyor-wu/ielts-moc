#!/usr/bin/env node

/**
 * Helper script to initialize MSW
 * Run: node scripts/init-msw.js
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const publicDir = join(process.cwd(), 'public')

if (!existsSync(publicDir)) {
  console.log('Creating public directory...')
  execSync(`mkdir -p ${publicDir}`, { stdio: 'inherit' })
}

console.log('Initializing MSW...')
try {
  execSync('npx msw init public/ --save', { stdio: 'inherit' })
  console.log('✅ MSW initialized successfully!')
} catch (error) {
  console.error('❌ Failed to initialize MSW:', error.message)
  process.exit(1)
}

